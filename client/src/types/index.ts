// Client-side TypeScript type definitions

export type SurveyStatus = 'draft' | 'active' | 'closed';
export type QuestionType = 'rating' | 'enps' | 'open_text';
export type OrgLevelType = 'team' | 'department' | 'division' | 'hq';
export type SentimentType = 'positive' | 'neutral' | 'negative';
export type ActionStatus = 'planned' | 'in_progress' | 'done';

export interface Company {
  id: number;
  name: string;
  slug: string;
}

export interface OrganizationalLevel {
  id: number;
  company_id: number;
  name: string;
  type: OrgLevelType;
  parent_id: number | null;
}

export interface Survey {
  id: number;
  company_id: number;
  title: string;
  description: string | null;
  status: SurveyStatus;
  starts_at: string | null;
  ends_at: string | null;
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
}

