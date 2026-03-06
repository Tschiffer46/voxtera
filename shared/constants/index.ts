// Shared constants used by both client and server

export const RATING_MIN = 1;
export const RATING_MAX = 5;
export const ENPS_MIN = 0;
export const ENPS_MAX = 10;

// eNPS score categories
export const ENPS_PROMOTER_MIN = 9; // 9–10
export const ENPS_DETRACTOR_MAX = 6; // 0–6

// Concern threshold — scores below this are flagged
export const CONCERN_THRESHOLD = 3.0;

export const SURVEY_STATUSES = ['draft', 'active', 'closed'] as const;
export const QUESTION_TYPES = ['rating', 'enps', 'open_text'] as const;
export const ORG_LEVEL_TYPES = ['team', 'department', 'division', 'hq'] as const;
export const SENTIMENT_TYPES = ['positive', 'neutral', 'negative'] as const;
export const ACTION_STATUSES = ['planned', 'in_progress', 'done'] as const;

export const API_BASE_URL = '/api';
