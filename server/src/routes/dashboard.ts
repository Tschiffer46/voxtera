import { Router, Request, Response } from 'express';
import pool from '../db/index.js';

const router = Router();

/**
 * GET /api/dashboard/companies
 * List all companies.
 */
router.get('/companies', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT id, name, slug, created_at FROM companies ORDER BY name`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error listing companies:', err);
    res.status(500).json({ error: 'Failed to list companies' });
  }
});

/**
 * GET /api/dashboard/companies/:companyId/overview
 * High-level metrics for a company's latest active/closed survey.
 */
router.get('/companies/:companyId/overview', async (req: Request, res: Response): Promise<void> => {
  const { companyId } = req.params;

  try {
    // Get latest survey
    const surveyResult = await pool.query(
      `SELECT id, title, status FROM surveys
       WHERE company_id = $1 AND status IN ('active', 'closed')
       ORDER BY created_at DESC LIMIT 1`,
      [companyId]
    );

    if (surveyResult.rows.length === 0) {
      res.status(404).json({ error: 'No surveys found for this company' });
      return;
    }

    const survey = surveyResult.rows[0];

    // Get company info
    const companyResult = await pool.query(
      `SELECT id, name FROM companies WHERE id = $1`,
      [companyId]
    );

    // Response count and rate
    const responseStats = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE completed_at IS NOT NULL) as completed,
         COUNT(*) as total
       FROM responses WHERE survey_id = $1`,
      [survey.id]
    );

    // Average score across all rating questions
    const avgScore = await pool.query(
      `SELECT ROUND(AVG(a.rating_value)::numeric, 1) as avg
       FROM answers a
       JOIN questions q ON q.id = a.question_id
       JOIN responses r ON r.id = a.response_id
       WHERE r.survey_id = $1 AND q.type = 'rating' AND a.rating_value IS NOT NULL`,
      [survey.id]
    );

    // eNPS score
    const enpsResult = await pool.query(
      `SELECT a.rating_value
       FROM answers a
       JOIN questions q ON q.id = a.question_id
       JOIN responses r ON r.id = a.response_id
       WHERE r.survey_id = $1 AND q.type = 'enps' AND r.completed_at IS NOT NULL`,
      [survey.id]
    );

    let enpsScore = null;
    if (enpsResult.rows.length > 0) {
      const promoters = enpsResult.rows.filter((r) => r.rating_value >= 9).length;
      const detractors = enpsResult.rows.filter((r) => r.rating_value <= 6).length;
      const total = enpsResult.rows.length;
      enpsScore = Math.round(((promoters - detractors) / total) * 100);
    }

    // Count areas of concern (questions with avg < 3.0)
    const concernResult = await pool.query(
      `SELECT COUNT(*) as count FROM (
         SELECT q.id
         FROM questions q
         JOIN answers a ON a.question_id = q.id
         JOIN responses r ON r.id = a.response_id
         WHERE r.survey_id = $1 AND q.type = 'rating' AND a.rating_value IS NOT NULL
         GROUP BY q.id
         HAVING AVG(a.rating_value) < 3.0
       ) as concerns`,
      [survey.id]
    );

    const stats = responseStats.rows[0];
    res.json({
      company: companyResult.rows[0],
      survey: { id: survey.id, title: survey.title, status: survey.status },
      metrics: {
        responseRate: stats.total > 0
          ? Math.round((Number(stats.completed) / Number(stats.total)) * 100)
          : 0,
        totalResponses: Number(stats.completed),
        averageScore: avgScore.rows[0].avg ? Number(avgScore.rows[0].avg) : null,
        enpsScore,
        areasOfConcern: Number(concernResult.rows[0].count),
      },
    });
  } catch (err) {
    console.error('Error fetching overview:', err);
    res.status(500).json({ error: 'Failed to fetch overview' });
  }
});

/**
 * GET /api/dashboard/companies/:companyId/surveys/:surveyId/results
 * Detailed results broken down by question.
 */
router.get(
  '/companies/:companyId/surveys/:surveyId/results',
  async (req: Request, res: Response): Promise<void> => {
    const { surveyId } = req.params;
    const { levelId } = req.query;

    try {
      const questionsResult = await pool.query(
        `SELECT id, text, type, order_position, config FROM questions
         WHERE survey_id = $1 ORDER BY order_position`,
        [surveyId]
      );

      const results = [];
      for (const question of questionsResult.rows) {
        let queryParams: unknown[] = [question.id];
        let levelFilter = '';

        if (levelId) {
          levelFilter = ' AND r.organizational_level_id = $2';
          queryParams = [question.id, levelId];
        }

        if (question.type === 'rating') {
          const distResult = await pool.query(
            `SELECT a.rating_value, COUNT(*) as count
             FROM answers a
             JOIN responses r ON r.id = a.response_id
             WHERE a.question_id = $1 AND r.completed_at IS NOT NULL
               AND a.rating_value IS NOT NULL${levelFilter}
             GROUP BY a.rating_value
             ORDER BY a.rating_value`,
            queryParams
          );

          const distribution: Record<number, number> = {};
          let total = 0;
          let sum = 0;
          for (const row of distResult.rows) {
            distribution[row.rating_value] = Number(row.count);
            total += Number(row.count);
            sum += row.rating_value * Number(row.count);
          }

          results.push({
            id: question.id,
            text: question.text,
            type: question.type,
            average: total > 0 ? Math.round((sum / total) * 10) / 10 : null,
            distribution,
          });
        } else if (question.type === 'enps') {
          const enpsResult = await pool.query(
            `SELECT a.rating_value
             FROM answers a
             JOIN responses r ON r.id = a.response_id
             WHERE a.question_id = $1 AND r.completed_at IS NOT NULL
               AND a.rating_value IS NOT NULL${levelFilter}`,
            queryParams
          );

          const promoters = enpsResult.rows.filter((r) => r.rating_value >= 9).length;
          const detractors = enpsResult.rows.filter((r) => r.rating_value <= 6).length;
          const total = enpsResult.rows.length;

          results.push({
            id: question.id,
            text: question.text,
            type: question.type,
            enps: total > 0 ? Math.round(((promoters - detractors) / total) * 100) : null,
            promoters,
            detractors,
            passives: total - promoters - detractors,
            total,
          });
        } else {
          // Open text — just count responses
          const countResult = await pool.query(
            `SELECT COUNT(*) as count FROM answers a
             JOIN responses r ON r.id = a.response_id
             WHERE a.question_id = $1 AND r.completed_at IS NOT NULL
               AND a.text_value IS NOT NULL${levelFilter}`,
            queryParams
          );
          results.push({
            id: question.id,
            text: question.text,
            type: question.type,
            responseCount: Number(countResult.rows[0].count),
          });
        }
      }

      res.json({ questions: results });
    } catch (err) {
      console.error('Error fetching results:', err);
      res.status(500).json({ error: 'Failed to fetch results' });
    }
  }
);

/**
 * GET /api/dashboard/companies/:companyId/surveys/:surveyId/comments
 * Open-text responses with optional sentiment filter.
 */
router.get(
  '/companies/:companyId/surveys/:surveyId/comments',
  async (req: Request, res: Response): Promise<void> => {
    const { surveyId } = req.params;
    const { sentiment, levelId } = req.query;

    try {
      let query = `
        SELECT q.text as question_text, a.text_value as text, a.sentiment,
               ol.name as organizational_level
        FROM answers a
        JOIN questions q ON q.id = a.question_id
        JOIN responses r ON r.id = a.response_id
        LEFT JOIN organizational_levels ol ON ol.id = r.organizational_level_id
        WHERE r.survey_id = $1 AND q.type = 'open_text'
          AND a.text_value IS NOT NULL AND r.completed_at IS NOT NULL
      `;
      const params: unknown[] = [surveyId];

      if (sentiment) {
        params.push(sentiment);
        query += ` AND a.sentiment = $${params.length}`;
      }
      if (levelId) {
        params.push(levelId);
        query += ` AND r.organizational_level_id = $${params.length}`;
      }

      query += ' ORDER BY a.created_at DESC';

      const result = await pool.query(query, params);
      res.json({ comments: result.rows });
    } catch (err) {
      console.error('Error fetching comments:', err);
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  }
);

/**
 * GET /api/dashboard/companies/:companyId/surveys/:surveyId/actions
 * Get all actions for a survey.
 */
router.get(
  '/companies/:companyId/surveys/:surveyId/actions',
  async (req: Request, res: Response): Promise<void> => {
    const { surveyId } = req.params;

    try {
      const result = await pool.query(
        `SELECT a.*, ol.name as organizational_level_name
         FROM actions a
         LEFT JOIN organizational_levels ol ON ol.id = a.organizational_level_id
         WHERE a.survey_id = $1
         ORDER BY a.created_at DESC`,
        [surveyId]
      );
      res.json({ actions: result.rows });
    } catch (err) {
      console.error('Error fetching actions:', err);
      res.status(500).json({ error: 'Failed to fetch actions' });
    }
  }
);

/**
 * POST /api/dashboard/actions
 * Create a new action item.
 */
router.post('/actions', async (req: Request, res: Response): Promise<void> => {
  const {
    organizationalLevelId,
    surveyId,
    questionId,
    concernArea,
    description,
    responsiblePerson,
    deadline,
  } = req.body as {
    organizationalLevelId: number;
    surveyId: number;
    questionId?: number;
    concernArea: string;
    description: string;
    responsiblePerson?: string;
    deadline?: string;
  };

  if (!organizationalLevelId || !surveyId || !concernArea || !description) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO actions (organizational_level_id, survey_id, question_id, concern_area, description, responsible_person, deadline)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [organizationalLevelId, surveyId, questionId ?? null, concernArea, description, responsiblePerson ?? null, deadline ?? null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating action:', err);
    res.status(500).json({ error: 'Failed to create action' });
  }
});

/**
 * PATCH /api/dashboard/actions/:actionId
 * Update an action.
 */
router.patch('/actions/:actionId', async (req: Request, res: Response): Promise<void> => {
  const { actionId } = req.params;
  const { status, description, responsiblePerson, deadline } = req.body as {
    status?: string;
    description?: string;
    responsiblePerson?: string;
    deadline?: string;
  };

  try {
    const result = await pool.query(
      `UPDATE actions SET
         status = COALESCE($1, status),
         description = COALESCE($2, description),
         responsible_person = COALESCE($3, responsible_person),
         deadline = COALESCE($4::date, deadline),
         updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [status ?? null, description ?? null, responsiblePerson ?? null, deadline ?? null, actionId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Action not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating action:', err);
    res.status(500).json({ error: 'Failed to update action' });
  }
});

/**
 * GET /api/dashboard/companies/:companyId/surveys/:surveyId/responses-timeline
 * Daily response counts for a chart.
 */
router.get('/companies/:companyId/surveys/:surveyId/responses-timeline', async (req: Request, res: Response): Promise<void> => {
  const { surveyId } = req.params;

  try {
    const result = await pool.query(
      `SELECT DATE(completed_at) as date, COUNT(*) as count
       FROM responses
       WHERE survey_id = $1 AND completed_at IS NOT NULL
       GROUP BY DATE(completed_at)
       ORDER BY date`,
      [surveyId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching responses timeline:', err);
    res.status(500).json({ error: 'Failed to fetch responses timeline' });
  }
});

export default router;
