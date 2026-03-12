import { Router, Request, Response } from 'express';
import pool from '../db/index.js';

const router = Router();

/**
 * GET /api/admin/companies
 * List all companies with survey counts.
 */
router.get('/companies', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.name, c.slug, c.created_at,
              COUNT(s.id) as survey_count
       FROM companies c
       LEFT JOIN surveys s ON s.company_id = c.id
       GROUP BY c.id
       ORDER BY c.name`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error listing companies:', err);
    res.status(500).json({ error: 'Failed to list companies' });
  }
});

/**
 * GET /api/admin/companies/:companyId
 * Get full company details including org structure.
 */
router.get('/companies/:companyId', async (req: Request, res: Response): Promise<void> => {
  const { companyId } = req.params;

  try {
    const companyResult = await pool.query(
      `SELECT id, name, slug, created_at FROM companies WHERE id = $1`,
      [companyId]
    );

    if (companyResult.rows.length === 0) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }

    const levelsResult = await pool.query(
      `SELECT id, name, type, parent_id FROM organizational_levels
       WHERE company_id = $1 ORDER BY type, name`,
      [companyId]
    );

    res.json({
      company: companyResult.rows[0],
      organizationalLevels: levelsResult.rows,
    });
  } catch (err) {
    console.error('Error fetching company:', err);
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});

/**
 * GET /api/admin/companies/:companyId/surveys
 * List surveys for a company.
 */
router.get('/companies/:companyId/surveys', async (req: Request, res: Response): Promise<void> => {
  const { companyId } = req.params;

  try {
    const result = await pool.query(
      `SELECT s.id, s.title, s.status, s.starts_at, s.ends_at, s.created_at,
              COUNT(DISTINCT r.id) FILTER (WHERE r.completed_at IS NOT NULL) as response_count
       FROM surveys s
       LEFT JOIN responses r ON r.survey_id = s.id
       WHERE s.company_id = $1
       GROUP BY s.id
       ORDER BY s.created_at DESC`,
      [companyId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error listing surveys:', err);
    res.status(500).json({ error: 'Failed to list surveys' });
  }
});

// ── Survey Links ────────────────────────────────────────────────

/**
 * GET /api/admin/surveys/:surveyId/links
 * List all survey links with response counts.
 */
router.get('/surveys/:surveyId/links', async (req: Request, res: Response): Promise<void> => {
  const { surveyId } = req.params;

  try {
    const result = await pool.query(
      `SELECT sl.id, sl.token, sl.is_active, sl.created_at,
              COUNT(DISTINCT r.id) FILTER (WHERE r.completed_at IS NOT NULL) as response_count
       FROM survey_links sl
       LEFT JOIN responses r ON r.survey_link_id = sl.id
       WHERE sl.survey_id = $1
       GROUP BY sl.id
       ORDER BY sl.created_at DESC`,
      [surveyId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error listing survey links:', err);
    res.status(500).json({ error: 'Failed to list survey links' });
  }
});

/**
 * POST /api/admin/surveys/:surveyId/links
 * Generate a new anonymous survey link.
 */
router.post('/surveys/:surveyId/links', async (req: Request, res: Response): Promise<void> => {
  const { surveyId } = req.params;
  const { organizationalLevelId } = req.body as { organizationalLevelId?: number };

  try {
    const result = await pool.query(
      `INSERT INTO survey_links (survey_id, organizational_level_id)
       VALUES ($1, $2) RETURNING id, token, created_at`,
      [surveyId, organizationalLevelId ?? null]
    );

    const { token } = result.rows[0];
    res.status(201).json({
      token,
      url: `/survey/${token}`,
    });
  } catch (err) {
    console.error('Error creating survey link:', err);
    res.status(500).json({ error: 'Failed to create survey link' });
  }
});

// ── Questions CRUD ──────────────────────────────────────────────

/**
 * GET /api/admin/surveys/:surveyId/questions
 * List all questions for a survey.
 */
router.get('/surveys/:surveyId/questions', async (req: Request, res: Response): Promise<void> => {
  const { surveyId } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, text, type, order_position, required, config
       FROM questions
       WHERE survey_id = $1
       ORDER BY order_position`,
      [surveyId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error listing questions:', err);
    res.status(500).json({ error: 'Failed to list questions' });
  }
});

/**
 * POST /api/admin/surveys/:surveyId/questions
 * Create a new question.
 */
router.post('/surveys/:surveyId/questions', async (req: Request, res: Response): Promise<void> => {
  const { surveyId } = req.params;
  const { text, type, required, config } = req.body as {
    text: string;
    type: string;
    required?: boolean;
    config?: Record<string, unknown>;
  };

  if (!text || !type) {
    res.status(400).json({ error: 'text and type are required' });
    return;
  }

  try {
    // Get the next order position
    const posResult = await pool.query(
      `SELECT COALESCE(MAX(order_position), 0) + 1 as next_pos FROM questions WHERE survey_id = $1`,
      [surveyId]
    );
    const nextPos = posResult.rows[0].next_pos;

    const result = await pool.query(
      `INSERT INTO questions (survey_id, text, type, order_position, required, config)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, text, type, order_position, required, config`,
      [surveyId, text, type, nextPos, required ?? true, JSON.stringify(config ?? {})]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating question:', err);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

/**
 * PUT /api/admin/questions/:questionId
 * Update a question.
 */
router.put('/questions/:questionId', async (req: Request, res: Response): Promise<void> => {
  const { questionId } = req.params;
  const { text, type, required, config } = req.body as {
    text?: string;
    type?: string;
    required?: boolean;
    config?: Record<string, unknown>;
  };

  try {
    const result = await pool.query(
      `UPDATE questions SET
         text = COALESCE($1, text),
         type = COALESCE($2, type),
         required = COALESCE($3, required),
         config = COALESCE($4, config)
       WHERE id = $5
       RETURNING id, text, type, order_position, required, config`,
      [text ?? null, type ?? null, required ?? null, config ? JSON.stringify(config) : null, questionId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating question:', err);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

/**
 * DELETE /api/admin/questions/:questionId
 * Delete a question.
 */
router.delete('/questions/:questionId', async (req: Request, res: Response): Promise<void> => {
  const { questionId } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM questions WHERE id = $1 RETURNING id`,
      [questionId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    res.json({ deleted: true });
  } catch (err) {
    console.error('Error deleting question:', err);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

/**
 * GET /api/admin/surveys/:surveyId/response-rates
 * Response rates broken down by organizational level.
 */
router.get('/surveys/:surveyId/response-rates', async (req: Request, res: Response): Promise<void> => {
  const { surveyId } = req.params;

  try {
    const result = await pool.query(
      `SELECT
         ol.id,
         ol.name,
         ol.type,
         COUNT(r.id) as total_responses,
         COUNT(r.id) FILTER (WHERE r.completed_at IS NOT NULL) as completed_responses
       FROM organizational_levels ol
       LEFT JOIN responses r ON r.organizational_level_id = ol.id AND r.survey_id = $1
       WHERE ol.company_id = (SELECT company_id FROM surveys WHERE id = $1)
       GROUP BY ol.id, ol.name, ol.type
       ORDER BY ol.type, ol.name`,
      [surveyId]
    );

    res.json(
      result.rows.map((row) => ({
        ...row,
        completionRate: row.total_responses > 0
          ? Math.round((row.completed_responses / row.total_responses) * 100)
          : 0,
      }))
    );
  } catch (err) {
    console.error('Error fetching response rates:', err);
    res.status(500).json({ error: 'Failed to fetch response rates' });
  }
});

export default router;
