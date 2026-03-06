import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PageWrapper } from '../../components/PageWrapper';
import {
  getSurvey,
  startSurvey,
  submitAnswer,
  completeSurvey,
  type SurveyData,
} from '../../services/survey.service';

type SurveyState = 'loading' | 'select-team' | 'in-progress' | 'complete' | 'error';

export default function SurveyPage() {
  const { token } = useParams<{ token: string }>();
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [state, setState] = useState<SurveyState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedLevelId, setSelectedLevelId] = useState<number | undefined>();
  const [responseId, setResponseId] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { ratingValue?: number; textValue?: string }>>({});

  useEffect(() => {
    if (!token) return;

    getSurvey(token)
      .then((data) => {
        setSurveyData(data);
        setState('select-team');
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to load survey';
        setErrorMessage(message);
        setState('error');
      });
  }, [token]);

  const handleStartSurvey = async () => {
    if (!token) return;
    try {
      const { responseId: id } = await startSurvey(token, selectedLevelId);
      setResponseId(id);
      setState('in-progress');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start survey';
      setErrorMessage(message);
      setState('error');
    }
  };

  const handleAnswer = (value: { ratingValue?: number; textValue?: string }) => {
    if (!surveyData) return;
    const questionId = surveyData.questions[currentQuestionIndex].id;
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = async () => {
    if (!surveyData || !token || responseId === null) return;
    const question = surveyData.questions[currentQuestionIndex];
    const answer = answers[question.id];

    // Save the answer
    if (answer) {
      await submitAnswer(token, responseId, question.id, answer);
    }

    if (currentQuestionIndex < surveyData.questions.length - 1) {
      setCurrentQuestionIndex((i) => i + 1);
    } else {
      // Last question — complete the survey
      await completeSurvey(token, responseId);
      setState('complete');
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((i) => i - 1);
    }
  };

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading survey...</p>
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">😕</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Survey not available</h1>
          <p className="text-gray-500">{errorMessage || 'This survey link is inactive or has expired.'}</p>
        </div>
      </div>
    );
  }

  if (state === 'complete') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-50 to-white">
        <div className="text-center max-w-md px-4">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">Thank you!</h1>
          <p className="text-gray-600 mb-2">
            Your response has been recorded anonymously.
          </p>
          <p className="text-primary-600 font-medium">Your voice matters.</p>
        </div>
      </div>
    );
  }

  if (state === 'select-team' && surveyData) {
    const teams = surveyData.organizationalLevels.filter(
      (l) => l.type === 'team' || l.type === 'department'
    );

    return (
      <PageWrapper variant="survey">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <p className="text-sm text-primary-600 font-medium mb-1">
              {surveyData.survey.company.name}
            </p>
            <h1 className="text-2xl font-semibold text-gray-900">
              {surveyData.survey.title}
            </h1>
          </div>

          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Before we start, which team are you in?
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              This helps us identify patterns — your response remains completely anonymous.
            </p>

            <div className="grid gap-2 mb-6">
              {teams.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setSelectedLevelId(level.id)}
                  className={`text-left px-4 py-3 rounded-lg border transition-all ${
                    selectedLevelId === level.id
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {level.name}
                </button>
              ))}
              <button
                onClick={() => setSelectedLevelId(undefined)}
                className={`text-left px-4 py-3 rounded-lg border transition-all ${
                  selectedLevelId === undefined
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-500'
                }`}
              >
                Prefer not to say
              </button>
            </div>

            <button onClick={handleStartSurvey} className="btn-primary w-full py-3">
              Start Survey →
            </button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (state === 'in-progress' && surveyData) {
    const question = surveyData.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / surveyData.questions.length) * 100;
    const currentAnswer = answers[question.id];
    const isLast = currentQuestionIndex === surveyData.questions.length - 1;

    return (
      <PageWrapper variant="survey">
        <div className="max-w-2xl mx-auto px-4 py-12">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Question {currentQuestionIndex + 1} of {surveyData.questions.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-primary-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-medium text-gray-900 mb-6">{question.text}</h2>

            {/* Rating question */}
            {question.type === 'rating' && (
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-3">
                  <span>{question.config.min_label}</span>
                  <span>{question.config.max_label}</span>
                </div>
                <div className="flex gap-2 justify-center">
                  {Array.from(
                    { length: (question.config.max ?? 5) - (question.config.min ?? 1) + 1 },
                    (_, i) => i + (question.config.min ?? 1)
                  ).map((val) => (
                    <button
                      key={val}
                      onClick={() => handleAnswer({ ratingValue: val })}
                      className={`w-12 h-12 rounded-xl font-semibold text-sm transition-all ${
                        currentAnswer?.ratingValue === val
                          ? 'bg-primary-500 text-white shadow-md scale-110'
                          : 'bg-gray-100 text-gray-600 hover:bg-primary-50 hover:text-primary-600'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* eNPS question */}
            {question.type === 'enps' && (
              <div>
                <div className="flex gap-1 flex-wrap justify-center mb-3">
                  {Array.from({ length: 11 }, (_, i) => i).map((val) => (
                    <button
                      key={val}
                      onClick={() => handleAnswer({ ratingValue: val })}
                      className={`w-10 h-10 rounded-lg font-semibold text-sm transition-all ${
                        currentAnswer?.ratingValue === val
                          ? 'bg-primary-500 text-white shadow-md scale-110'
                          : val <= 6
                          ? 'bg-concern-50 text-concern-600 hover:bg-concern-100'
                          : val <= 8
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          : 'bg-secondary-50 text-secondary-600 hover:bg-secondary-100'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Not at all likely</span>
                  <span>Extremely likely</span>
                </div>
              </div>
            )}

            {/* Open text question */}
            {question.type === 'open_text' && (
              <textarea
                value={currentAnswer?.textValue ?? ''}
                onChange={(e) => handleAnswer({ textValue: e.target.value })}
                placeholder={question.config.placeholder ?? 'Share your thoughts...'}
                className="w-full border border-gray-200 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
                rows={4}
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <button
              onClick={handleBack}
              disabled={currentQuestionIndex === 0}
              className="btn-secondary disabled:opacity-40"
            >
              ← Back
            </button>
            <button
              onClick={handleNext}
              disabled={question.required && !currentAnswer && question.type !== 'open_text'}
              className="btn-primary disabled:opacity-40"
            >
              {isLast ? 'Submit Survey' : 'Next →'}
            </button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return null;
}
