-- Initial database schema for Voxtera
-- Migration: 001_initial_schema

-- Create custom enum types
CREATE TYPE org_level_type AS ENUM ('team', 'department', 'division', 'hq');
CREATE TYPE survey_status AS ENUM ('draft', 'active', 'closed');
CREATE TYPE question_type AS ENUM ('rating', 'enps', 'open_text');
CREATE TYPE sentiment_type AS ENUM ('positive', 'neutral', 'negative');
CREATE TYPE action_status AS ENUM ('planned', 'in_progress', 'done');

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organizational levels (self-referencing hierarchy: HQ → Division → Department → Team)
CREATE TABLE IF NOT EXISTS organizational_levels (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type org_level_type NOT NULL,
  parent_id INTEGER REFERENCES organizational_levels(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Surveys
CREATE TABLE IF NOT EXISTS surveys (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status survey_status NOT NULL DEFAULT 'draft',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions within a survey
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  survey_id INTEGER NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  type question_type NOT NULL,
  order_position INTEGER NOT NULL,
  required BOOLEAN NOT NULL DEFAULT TRUE,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Survey access links (anonymous tokens)
CREATE TABLE IF NOT EXISTS survey_links (
  id SERIAL PRIMARY KEY,
  survey_id INTEGER NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  organizational_level_id INTEGER REFERENCES organizational_levels(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual survey response sessions
CREATE TABLE IF NOT EXISTS responses (
  id SERIAL PRIMARY KEY,
  survey_id INTEGER NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  survey_link_id INTEGER NOT NULL REFERENCES survey_links(id) ON DELETE CASCADE,
  organizational_level_id INTEGER REFERENCES organizational_levels(id) ON DELETE SET NULL,
  session_id VARCHAR(255) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual question answers
CREATE TABLE IF NOT EXISTS answers (
  id SERIAL PRIMARY KEY,
  response_id INTEGER NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  rating_value INTEGER,
  text_value TEXT,
  sentiment sentiment_type,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (response_id, question_id)
);

-- Manager action items
CREATE TABLE IF NOT EXISTS actions (
  id SERIAL PRIMARY KEY,
  organizational_level_id INTEGER NOT NULL REFERENCES organizational_levels(id) ON DELETE CASCADE,
  survey_id INTEGER NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES questions(id) ON DELETE SET NULL,
  concern_area TEXT NOT NULL,
  description TEXT NOT NULL,
  responsible_person VARCHAR(255),
  deadline DATE,
  status action_status NOT NULL DEFAULT 'planned',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_org_levels_company_id ON organizational_levels(company_id);
CREATE INDEX idx_org_levels_parent_id ON organizational_levels(parent_id);
CREATE INDEX idx_surveys_company_id ON surveys(company_id);
CREATE INDEX idx_questions_survey_id ON questions(survey_id);
CREATE INDEX idx_survey_links_token ON survey_links(token);
CREATE INDEX idx_survey_links_survey_id ON survey_links(survey_id);
CREATE INDEX idx_responses_survey_id ON responses(survey_id);
CREATE INDEX idx_responses_survey_link_id ON responses(survey_link_id);
CREATE INDEX idx_answers_response_id ON answers(response_id);
CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_actions_survey_id ON actions(survey_id);
CREATE INDEX idx_actions_org_level_id ON actions(organizational_level_id);
