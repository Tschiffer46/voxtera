import api from './api.js';

export interface Company {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  survey_count: string;
}

export interface Survey {
  id: number;
  title: string;
  status: string;
  starts_at: string;
  ends_at: string;
  created_at: string;
  response_count: string;
}

export interface SurveyLink {
  id: number;
  token: string;
  is_active: boolean;
  created_at: string;
  response_count: string;
}

export interface Question {
  id: number;
  text: string;
  type: 'rating' | 'enps' | 'open_text';
  order_position: number;
  required: boolean;
  config: Record<string, unknown>;
}

// Companies
export async function getCompanies(): Promise<Company[]> {
  const { data } = await api.get('/admin/companies');
  return data;
}

export async function getCompanySurveys(companyId: number): Promise<Survey[]> {
  const { data } = await api.get(`/admin/companies/${companyId}/surveys`);
  return data;
}

// Survey Links
export async function getSurveyLinks(surveyId: number): Promise<SurveyLink[]> {
  const { data } = await api.get(`/admin/surveys/${surveyId}/links`);
  return data;
}

export async function createSurveyLink(surveyId: number): Promise<{ token: string; url: string }> {
  const { data } = await api.post(`/admin/surveys/${surveyId}/links`, {});
  return data;
}

// Questions
export async function getQuestions(surveyId: number): Promise<Question[]> {
  const { data } = await api.get(`/admin/surveys/${surveyId}/questions`);
  return data;
}

export async function createQuestion(
  surveyId: number,
  question: { text: string; type: string; required?: boolean; config?: Record<string, unknown> }
): Promise<Question> {
  const { data } = await api.post(`/admin/surveys/${surveyId}/questions`, question);
  return data;
}

export async function updateQuestion(
  questionId: number,
  updates: { text?: string; type?: string; required?: boolean; config?: Record<string, unknown> }
): Promise<Question> {
  const { data } = await api.put(`/admin/questions/${questionId}`, updates);
  return data;
}

export async function deleteQuestion(questionId: number): Promise<void> {
  await api.delete(`/admin/questions/${questionId}`);
}
