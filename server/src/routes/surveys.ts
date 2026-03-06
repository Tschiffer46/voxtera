import { Router, Request, Response } from 'express';
import pool from '../db/index.js';

const router = Router();

/**
 * GET /api/surveys/:token
 * Get survey data via anonymous access token.
 */
router.get('/:token', async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params;

  try {
    // Find the survey link and associated survey
    const linkResult = await pool.query(
      `SELECT sl.id as link_id, sl.survey_id, sl.organizational_level_id,
              s.title, s.description, s.status,
              c.name as company_name
       FROM survey_links sl
       JOIN surveys s ON s.id = sl.survey_id
       JOIN companies c ON c.id = s.company_id
       WHERE sl.token = $1 AND sl.is_active = TRUE`,
      [token]
    );

    if (linkResult.rows.length === 0) {
      res.status(404).json({ error: 'Survey not found or link is inactive' });
      return;
    }

    const link = linkResult.rows[0];

    if (link.status !== 'active') {
      res.status(410).json({ error: 'This survey is no longer active' });
      return;
    }

    // Get questions
    const questionsResult = await pool.query(
      `SELECT id, text, type, order_position, required, config
       FROM questions
       WHERE survey_id = $1
       ORDER BY order_position`,
      [link.survey_id]
    );

    // Get available organizational levels for respondent to choose from
    const levelsResult = await pool.query(
      `SELECT id, name, type, parent_id
       FROM organizational_levels
       WHERE company_id = (
         SELECT company_id FROM surveys WHERE id = $1
       )
       ORDER BY type, name`,
      [link.survey_id]
    );

    res.json({
      survey: {
        id: link.survey_id,
        title: link.title,
        description: link.description,
        company: { name: link.company_name },
      },
      questions: questionsResult.rows,
      organizationalLevels: levelsResult.rows,
    });
  } catch (err) {
    console.error('Error fetching survey:', err);
    res.status(500).json({ error: 'Failed to load survey' });
  }
});

/**
 * POST /api/surveys/:token/start
 * Start a survey session.
 */
router.post('/:token/start', async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params;
  const { organizationalLevelId } = req.body as { organizationalLevelId?: number };

  try {
    const linkResult = await pool.query(
      `SELECT sl.id, sl.survey_id FROM survey_links sl
       JOIN surveys s ON s.id = sl.survey_id
       WHERE sl.token = $1 AND sl.is_active = TRUE AND s.status = 'active'`,
      [token]
    );

    if (linkResult.rows.length === 0) {
      res.status(404).json({ error: 'Survey not found or inactive' });
      return;
    }

    const { id: linkId, survey_id: surveyId } = linkResult.rows[0];
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const responseResult = await pool.query(
      `INSERT INTO responses (survey_id, survey_link_id, organizational_level_id, session_id)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [surveyId, linkId, organizationalLevelId ?? null, sessionId]
    );

    res.json({
      responseId: responseResult.rows[0].id,
      sessionId,
    });
  } catch (err) {
    console.error('Error starting survey:', err);
    res.status(500).json({ error: 'Failed to start survey' });
  }
});

/**
 * POST /api/surveys/:token/answer
 * Submit an answer to a question.
 */
router.post('/:token/answer', async (req: Request, res: Response): Promise<void> => {
  const { responseId, questionId, ratingValue, textValue } = req.body as {
    responseId: number;
    questionId: number;
    ratingValue?: number;
    textValue?: string;
  };

  if (!responseId || !questionId) {
    res.status(400).json({ error: 'responseId and questionId are required' });
    return;
  }

  try {
    // Upsert the answer (allow re-answering)
    await pool.query(
      `INSERT INTO answers (response_id, question_id, rating_value, text_value)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (response_id, question_id)
       DO UPDATE SET rating_value = EXCLUDED.rating_value, text_value = EXCLUDED.text_value`,
      [responseId, questionId, ratingValue ?? null, textValue ?? null]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error saving answer:', err);
    res.status(500).json({ error: 'Failed to save answer' });
  }
});

/**
 * POST /api/surveys/:token/complete
 * Mark a survey response as completed.
 */
router.post('/:token/complete', async (req: Request, res: Response): Promise<void> => {
  const { responseId } = req.body as { responseId: number };

  if (!responseId) {
    res.status(400).json({ error: 'responseId is required' });
    return;
  }

  try {
    await pool.query(
      `UPDATE responses SET completed_at = NOW() WHERE id = $1`,
      [responseId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error completing survey:', err);
    res.status(500).json({ error: 'Failed to complete survey' });
  }
});

export default router;
