import pool from '../index.js';

/**
 * Seed data for Voxtera POC
 * Creates 3 companies with organizational hierarchies and a sample survey.
 * Mock response data is added for the 2 non-pilot companies.
 */

const companies = [
  { name: 'Nordic Tech Solutions', slug: 'nordic-tech' },
  { name: 'Scandinavian Health Group', slug: 'scandinavian-health' },
  { name: 'Baltic Digital Agency', slug: 'baltic-digital' },
];

// Org hierarchy for each company: HQ → 2 Divisions → 2 Departments each → 2 Teams each
function buildOrgStructure(companyName: string) {
  return {
    name: `${companyName} HQ`,
    type: 'hq' as const,
    children: [
      {
        name: 'Technology',
        type: 'division' as const,
        children: [
          {
            name: 'Engineering',
            type: 'department' as const,
            children: [
              { name: 'Backend Team', type: 'team' as const },
              { name: 'Frontend Team', type: 'team' as const },
            ],
          },
          {
            name: 'Product',
            type: 'department' as const,
            children: [
              { name: 'Product Team', type: 'team' as const },
              { name: 'Design Team', type: 'team' as const },
            ],
          },
        ],
      },
      {
        name: 'Operations',
        type: 'division' as const,
        children: [
          {
            name: 'HR & People',
            type: 'department' as const,
            children: [
              { name: 'Talent Team', type: 'team' as const },
              { name: 'Culture Team', type: 'team' as const },
            ],
          },
          {
            name: 'Finance',
            type: 'department' as const,
            children: [
              { name: 'Finance Team', type: 'team' as const },
              { name: 'Legal Team', type: 'team' as const },
            ],
          },
        ],
      },
    ],
  };
}

// Sample survey questions (mix of rating, eNPS, and open text)
const surveyQuestions = [
  {
    text: 'I feel valued and appreciated at work.',
    type: 'rating' as const,
    config: { min: 1, max: 5, min_label: 'Strongly Disagree', max_label: 'Strongly Agree' },
  },
  {
    text: 'I have the tools and resources I need to do my job effectively.',
    type: 'rating' as const,
    config: { min: 1, max: 5, min_label: 'Strongly Disagree', max_label: 'Strongly Agree' },
  },
  {
    text: 'My manager communicates clearly and supports my growth.',
    type: 'rating' as const,
    config: { min: 1, max: 5, min_label: 'Strongly Disagree', max_label: 'Strongly Agree' },
  },
  {
    text: 'I have a good work-life balance.',
    type: 'rating' as const,
    config: { min: 1, max: 5, min_label: 'Strongly Disagree', max_label: 'Strongly Agree' },
  },
  {
    text: 'I understand how my work contributes to the company\'s goals.',
    type: 'rating' as const,
    config: { min: 1, max: 5, min_label: 'Strongly Disagree', max_label: 'Strongly Agree' },
  },
  {
    text: 'The company culture makes me feel included and respected.',
    type: 'rating' as const,
    config: { min: 1, max: 5, min_label: 'Strongly Disagree', max_label: 'Strongly Agree' },
  },
  {
    text: 'I feel confident sharing feedback and ideas openly.',
    type: 'rating' as const,
    config: { min: 1, max: 5, min_label: 'Strongly Disagree', max_label: 'Strongly Agree' },
  },
  {
    text: 'I see clear opportunities for career growth here.',
    type: 'rating' as const,
    config: { min: 1, max: 5, min_label: 'Strongly Disagree', max_label: 'Strongly Agree' },
  },
  {
    text: 'How likely are you to recommend this company as a great place to work? (0 = Not at all, 10 = Extremely likely)',
    type: 'enps' as const,
    config: { min: 0, max: 10, min_label: 'Not at all likely', max_label: 'Extremely likely' },
  },
  {
    text: 'What is going well that we should continue doing?',
    type: 'open_text' as const,
    config: { placeholder: 'Share what you appreciate most...' },
  },
  {
    text: 'What could we improve to make this a better workplace?',
    type: 'open_text' as const,
    config: { placeholder: 'Share your suggestions...' },
  },
  {
    text: 'Is there anything else you would like leadership to know?',
    type: 'open_text' as const,
    config: { placeholder: 'Any other feedback...' },
  },
];

// Open text responses for mock data variety
const positiveComments = [
  'Great team culture and collaborative environment.',
  'Management is very supportive and approachable.',
  'The work is meaningful and I feel my contributions matter.',
  'Excellent work-life balance and flexible hours.',
  'Strong focus on employee development and learning.',
  'Regular feedback sessions help me grow in my role.',
  'The benefits package is comprehensive and fair.',
  'Leadership is transparent about company direction.',
];

const improvementComments = [
  'More regular all-hands meetings would be helpful.',
  'Better documentation for processes and systems.',
  'Career growth paths could be clearer.',
  'Would love more cross-team collaboration opportunities.',
  'Meeting culture could be more efficient.',
  'Remote work tooling could be improved.',
  'Salary reviews could happen more frequently.',
  'More budget for professional development courses.',
];

const additionalComments = [
  'Looking forward to the new product launch.',
  'Happy to be part of this team.',
  'Would appreciate more social events.',
  'The onboarding process was smooth.',
  null,
  null,
  null,
];

// Generate realistic random rating (slightly positive skew)
function randomRating(min: number, max: number): number {
  const range = max - min + 1;
  // Weighted towards positive end
  const weights = range === 5
    ? [0.05, 0.10, 0.20, 0.40, 0.25]
    : [0.02, 0.03, 0.05, 0.07, 0.10, 0.13, 0.15, 0.15, 0.13, 0.10, 0.07];
  const rand = Math.random();
  let cumulative = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (rand <= cumulative) return min + i;
  }
  return max;
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Insert org hierarchy recursively, return map of level names to IDs
async function insertOrgLevels(
  companyId: number,
  node: { name: string; type: string; children?: typeof node[] },
  parentId: number | null,
  levelMap: Map<string, number>
): Promise<void> {
  const result = await pool.query<{ id: number }>(
    `INSERT INTO organizational_levels (company_id, name, type, parent_id)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [companyId, node.name, node.type, parentId]
  );
  const id = result.rows[0].id;
  levelMap.set(node.name, id);

  if (node.children) {
    for (const child of node.children) {
      await insertOrgLevels(companyId, child, id, levelMap);
    }
  }
}

// Generate mock responses for a survey
async function generateMockResponses(
  surveyId: number,
  linkId: number,
  teamIds: number[],
  questionIds: number[],
  count: number
): Promise<void> {
  for (let i = 0; i < count; i++) {
    const teamId = randomFrom(teamIds);
    const sessionId = `mock-session-${surveyId}-${i}-${Date.now()}`;

    const responseResult = await pool.query<{ id: number }>(
      `INSERT INTO responses (survey_id, survey_link_id, organizational_level_id, session_id, completed_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING id`,
      [surveyId, linkId, teamId, sessionId]
    );
    const responseId = responseResult.rows[0].id;

    for (const questionId of questionIds) {
      const questionIndex = questionIds.indexOf(questionId);
      const question = surveyQuestions[questionIndex];

      if (question.type === 'open_text') {
        const textPool = questionIndex === 9
          ? positiveComments
          : questionIndex === 10
          ? improvementComments
          : additionalComments;
        const textValue = randomFrom(textPool as (string | null)[]);
        if (textValue) {
          await pool.query(
            `INSERT INTO answers (response_id, question_id, text_value) VALUES ($1, $2, $3)`,
            [responseId, questionId, textValue]
          );
        }
      } else {
        const config = question.config as { min: number; max: number };
        const ratingValue = randomRating(config.min, config.max);
        await pool.query(
          `INSERT INTO answers (response_id, question_id, rating_value) VALUES ($1, $2, $3)`,
          [responseId, questionId, ratingValue]
        );
      }
    }
  }
}

async function seed(): Promise<void> {
  console.log('Starting seed...');

  // Clear existing data (in reverse dependency order)
  await pool.query('TRUNCATE TABLE actions, answers, responses, survey_links, questions, surveys, organizational_levels, companies RESTART IDENTITY CASCADE');

  const companyIds: number[] = [];
  const surveyIds: number[] = [];

  for (const company of companies) {
    console.log(`Creating company: ${company.name}`);

    // Insert company
    const companyResult = await pool.query<{ id: number }>(
      `INSERT INTO companies (name, slug) VALUES ($1, $2) RETURNING id`,
      [company.name, company.slug]
    );
    const companyId = companyResult.rows[0].id;
    companyIds.push(companyId);

    // Insert org hierarchy
    const levelMap = new Map<string, number>();
    const orgStructure = buildOrgStructure(company.name);
    await insertOrgLevels(companyId, orgStructure, null, levelMap);

    // Create a survey
    const surveyResult = await pool.query<{ id: number }>(
      `INSERT INTO surveys (company_id, title, description, status, starts_at, ends_at)
       VALUES ($1, $2, $3, $4, NOW() - INTERVAL '30 days', NOW() + INTERVAL '7 days')
       RETURNING id`,
      [
        companyId,
        'Q1 2024 Employee Satisfaction Survey',
        'Our quarterly pulse survey to understand how everyone is doing and where we can improve.',
        'active',
      ]
    );
    const surveyId = surveyResult.rows[0].id;
    surveyIds.push(surveyId);

    // Insert questions
    const questionIds: number[] = [];
    for (let i = 0; i < surveyQuestions.length; i++) {
      const q = surveyQuestions[i];
      const questionResult = await pool.query<{ id: number }>(
        `INSERT INTO questions (survey_id, text, type, order_position, required, config)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [surveyId, q.text, q.type, i + 1, true, JSON.stringify(q.config)]
      );
      questionIds.push(questionResult.rows[0].id);
    }

    // Create a company-wide survey link
    const linkResult = await pool.query<{ id: number }>(
      `INSERT INTO survey_links (survey_id, organizational_level_id, is_active)
       VALUES ($1, NULL, TRUE) RETURNING id`,
      [surveyId]
    );
    const linkId = linkResult.rows[0].id;

    // Get all team IDs for this company
    const teamsResult = await pool.query<{ id: number }>(
      `SELECT id FROM organizational_levels WHERE company_id = $1 AND type = 'team'`,
      [companyId]
    );
    const teamIds = teamsResult.rows.map((r) => r.id);

    // Generate mock responses for mock companies (not the pilot company)
    const isMockCompany = company.slug !== 'nordic-tech';
    if (isMockCompany) {
      console.log(`Generating mock responses for ${company.name}...`);
      await generateMockResponses(surveyId, linkId, teamIds, questionIds, 22);
    }
  }

  // Add sample actions for the first mock company
  const mockCompanyId = companyIds[1];
  const mockSurveyId = surveyIds[1];
  const mockTeam = await pool.query<{ id: number }>(
    `SELECT id FROM organizational_levels WHERE company_id = $1 AND type = 'department' LIMIT 1`,
    [mockCompanyId]
  );
  if (mockTeam.rows.length > 0) {
    const orgLevelId = mockTeam.rows[0].id;
    await pool.query(
      `INSERT INTO actions (organizational_level_id, survey_id, concern_area, description, responsible_person, deadline, status)
       VALUES
         ($1, $2, 'Work-life balance', 'Introduce flexible working hours policy to address balance concerns', 'HR Manager', CURRENT_DATE + INTERVAL '60 days', 'in_progress'),
         ($1, $2, 'Career growth', 'Launch quarterly career development conversations with all staff', 'People Lead', CURRENT_DATE + INTERVAL '30 days', 'planned'),
         ($1, $2, 'Communication', 'Schedule monthly all-hands meetings with Q&A session', 'CEO', CURRENT_DATE + INTERVAL '14 days', 'done')`,
      [orgLevelId, mockSurveyId]
    );
  }

  console.log('Seed complete!');
  console.log(`Created ${companies.length} companies with surveys and organizational hierarchies.`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
