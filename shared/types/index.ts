// Shared TypeScript types used by both client and server

export type SurveyStatus = 'draft' | 'active' | 'closed';
export type QuestionType = 'rating' | 'enps' | 'open_text';
export type OrgLevelType = 'team' | 'department' | 'division' | 'hq';
export type SentimentType = 'positive' | 'neutral' | 'negative';
export type ActionStatus = 'planned' | 'in_progress' | 'done';

export interface Company {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationalLevel {
  id: number;
  company_id: number;
  name: string;
  type: OrgLevelType;
  parent_id: number | null;
  created_at: string;
}

export interface Survey {
  id: number;
  company_id: number;
  title: string;
  description: string | null;
  status: SurveyStatus;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuestionConfig {
  min?: number;
  max?: number;
  min_label?: string;
  max_label?: string;
  placeholder?: string;
}

export interface Question {
  id: number;
  survey_id: number;
  text: string;
  type: QuestionType;
  order_position: number;
  required: boolean;
  config: QuestionConfig;
  created_at: string;
}

export interface SurveyLink {
  id: number;
  survey_id: number;
  token: string;
  organizational_level_id: number | null;
  is_active: boolean;
  created_at: string;
}

export interface Response {
  id: number;
  survey_id: number;
  survey_link_id: number;
  organizational_level_id: number | null;
  session_id: string;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface Answer {
  id: number;
  response_id: number;
  question_id: number;
  rating_value: number | null;
  text_value: string | null;
  sentiment: SentimentType | null;
  created_at: string;
}

export interface Action {
  id: number;
  organizational_level_id: number;
  survey_id: number;
  question_id: number | null;
  concern_area: string;
  description: string;
  responsible_person: string;
  deadline: string;
  status: ActionStatus;
  created_at: string;
  updated_at: string;
}
