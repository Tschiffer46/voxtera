import api from './api';

// Survey service — employee-facing survey operations

export interface SurveyData {
  survey: {
    id: number;
    title: string;
    description: string | null;
    company: { name: string };
  };
  questions: Array<{
    id: number;
    text: string;
    type: 'rating' | 'enps' | 'open_text';
    order_position: number;
    required: boolean;
    config: {
      min?: number;
      max?: number;
      min_label?: string;
      max_label?: string;
      placeholder?: string;
    };
  }>;
  organizationalLevels: Array<{
    id: number;
    name: string;
    type: string;
    parent_id: number | null;
  }>;
}

export async function getSurvey(token: string): Promise<SurveyData> {
  const response = await api.get<SurveyData>(`/surveys/${token}`);
  return response.data;
}

export async function startSurvey(
  token: string,
  organizationalLevelId?: number
): Promise<{ responseId: number; sessionId: string }> {
  const response = await api.post(`/surveys/${token}/start`, {
    organizationalLevelId,
  });
  return response.data as { responseId: number; sessionId: string };
}

export async function submitAnswer(
  token: string,
  responseId: number,
  questionId: number,
  value: { ratingValue?: number; textValue?: string }
): Promise<void> {
  await api.post(`/surveys/${token}/answer`, {
    responseId,
    questionId,
    ...value,
  });
}

export async function completeSurvey(
  token: string,
  responseId: number
): Promise<void> {
  await api.post(`/surveys/${token}/complete`, { responseId });
}
