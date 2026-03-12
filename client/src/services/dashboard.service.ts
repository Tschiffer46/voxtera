import api from './api';

// Dashboard service — management-facing analytics operations

export interface Company {
  id: number;
  name: string;
  slug: string;
}

export interface DashboardOverview {
  company: { id: number; name: string };
  survey: { id: number; title: string; status: string };
  metrics: {
    responseRate: number;
    totalResponses: number;
    averageScore: number | null;
    enpsScore: number | null;
    areasOfConcern: number;
  };
}

export async function getCompanies(): Promise<Company[]> {
  const response = await api.get<Company[]>('/dashboard/companies');
  return response.data;
}

export async function getCompanyOverview(companyId: number): Promise<DashboardOverview> {
  const response = await api.get<DashboardOverview>(
    `/dashboard/companies/${companyId}/overview`
  );
  return response.data;
}

export async function getSurveyResults(
  companyId: number,
  surveyId: number,
  levelId?: number
) {
  const params = levelId ? { levelId } : {};
  const response = await api.get(
    `/dashboard/companies/${companyId}/surveys/${surveyId}/results`,
    { params }
  );
  return response.data;
}

export async function getSurveyComments(
  companyId: number,
  surveyId: number,
  options?: { sentiment?: string; levelId?: number }
) {
  const response = await api.get(
    `/dashboard/companies/${companyId}/surveys/${surveyId}/comments`,
    { params: options }
  );
  return response.data;
}

export async function getActions(companyId: number, surveyId: number) {
  const response = await api.get(
    `/dashboard/companies/${companyId}/surveys/${surveyId}/actions`
  );
  return response.data;
}

export async function createAction(data: {
  organizationalLevelId: number;
  surveyId: number;
  questionId?: number;
  concernArea: string;
  description: string;
  responsiblePerson?: string;
  deadline?: string;
}) {
  const response = await api.post('/dashboard/actions', data);
  return response.data;
}

export async function updateAction(
  actionId: number,
  data: { status?: string; description?: string; responsiblePerson?: string; deadline?: string }
) {
  const response = await api.patch(`/dashboard/actions/${actionId}`, data);
  return response.data;
}

export interface TimelineEntry {
  date: string;
  count: number;
}

export async function getResponsesTimeline(
  companyId: number,
  surveyId: number
): Promise<TimelineEntry[]> {
  const response = await api.get<TimelineEntry[]>(
    `/dashboard/companies/${companyId}/surveys/${surveyId}/responses-timeline`
  );
  return response.data;
}
