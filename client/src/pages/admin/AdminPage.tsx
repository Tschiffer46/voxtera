import { useState, useEffect, useCallback } from 'react';
import { PageWrapper } from '../../components/PageWrapper';
import {
  getCompanies,
  getCompanySurveys,
  getSurveyLinks,
  createSurveyLink,
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  type Company,
  type Survey,
  type SurveyLink,
  type Question,
} from '../../services/admin.service';

type View = 'companies' | 'surveys' | 'survey-detail';

export default function AdminPage() {
  const [view, setView] = useState<View>('companies');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [links, setLinks] = useState<SurveyLink[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Question form state
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionForm, setQuestionForm] = useState({ text: '', type: 'rating' as string });

  useEffect(() => {
    getCompanies()
      .then(setCompanies)
      .finally(() => setLoading(false));
  }, []);

  const openCompany = useCallback(async (company: Company) => {
    setSelectedCompany(company);
    setLoading(true);
    const data = await getCompanySurveys(company.id);
    setSurveys(data);
    setView('surveys');
    setLoading(false);
  }, []);

  const openSurvey = useCallback(async (survey: Survey) => {
    setSelectedSurvey(survey);
    setLoading(true);
    const [linksData, questionsData] = await Promise.all([
      getSurveyLinks(survey.id),
      getQuestions(survey.id),
    ]);
    setLinks(linksData);
    setQuestions(questionsData);
    setView('survey-detail');
    setLoading(false);
  }, []);

  const goBack = useCallback(() => {
    if (view === 'survey-detail') {
      setView('surveys');
      setSelectedSurvey(null);
    } else if (view === 'surveys') {
      setView('companies');
      setSelectedCompany(null);
    }
  }, [view]);

  const handleGenerateLink = useCallback(async () => {
    if (!selectedSurvey) return;
    await createSurveyLink(selectedSurvey.id);
    // Refresh links
    const updatedLinks = await getSurveyLinks(selectedSurvey.id);
    setLinks(updatedLinks);
  }, [selectedSurvey]);

  const handleCopyLink = useCallback(async (token: string) => {
    const url = `${window.location.origin}/survey/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }, []);

  const handleAddQuestion = useCallback(async () => {
    if (!selectedSurvey || !questionForm.text) return;

    const defaultConfig = questionForm.type === 'open_text'
      ? { placeholder: 'Share your thoughts...' }
      : questionForm.type === 'enps'
        ? { min: 0, max: 10, min_label: 'Not at all likely', max_label: 'Extremely likely' }
        : { min: 1, max: 5, min_label: 'Strongly Disagree', max_label: 'Strongly Agree' };

    await createQuestion(selectedSurvey.id, {
      text: questionForm.text,
      type: questionForm.type,
      config: defaultConfig,
    });

    const updated = await getQuestions(selectedSurvey.id);
    setQuestions(updated);
    setQuestionForm({ text: '', type: 'rating' });
    setShowAddQuestion(false);
  }, [selectedSurvey, questionForm]);

  const handleUpdateQuestion = useCallback(async () => {
    if (!editingQuestion || !selectedSurvey) return;
    await updateQuestion(editingQuestion.id, {
      text: editingQuestion.text,
      type: editingQuestion.type,
    });
    const updated = await getQuestions(selectedSurvey.id);
    setQuestions(updated);
    setEditingQuestion(null);
  }, [editingQuestion, selectedSurvey]);

  const handleDeleteQuestion = useCallback(async (questionId: number) => {
    if (!selectedSurvey) return;
    if (!confirm('Are you sure you want to delete this question?')) return;
    await deleteQuestion(questionId);
    const updated = await getQuestions(selectedSurvey.id);
    setQuestions(updated);
  }, [selectedSurvey]);

  const typeBadgeColor = (type: string) => {
    switch (type) {
      case 'rating': return 'bg-primary-100 text-primary-700';
      case 'enps': return 'bg-accent-100 text-accent-700';
      case 'open_text': return 'bg-secondary-100 text-secondary-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <PageWrapper variant="admin" className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with breadcrumb */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <button onClick={() => { setView('companies'); setSelectedCompany(null); setSelectedSurvey(null); }} className="hover:text-gray-600">
              Admin
            </button>
            {selectedCompany && (
              <>
                <span>/</span>
                <button onClick={() => { setView('surveys'); setSelectedSurvey(null); }} className="hover:text-gray-600">
                  {selectedCompany.name}
                </button>
              </>
            )}
            {selectedSurvey && (
              <>
                <span>/</span>
                <span className="text-gray-600">{selectedSurvey.title}</span>
              </>
            )}
          </div>

          {view !== 'companies' && (
            <button onClick={goBack} className="text-sm text-primary-600 hover:text-primary-700 mb-2 flex items-center gap-1">
              ← Back
            </button>
          )}

          <h1 className="text-2xl font-semibold text-gray-900">
            {view === 'companies' && 'Admin Panel'}
            {view === 'surveys' && selectedCompany?.name}
            {view === 'survey-detail' && selectedSurvey?.title}
          </h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── Companies List ─────────────────────── */}
            {view === 'companies' && (
              <div className="card">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Companies</h2>
                <div className="divide-y divide-gray-100">
                  {companies.map((company) => (
                    <button
                      key={company.id}
                      onClick={() => openCompany(company)}
                      className="w-full py-3 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-lg px-2 -mx-2 text-left"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{company.name}</p>
                        <p className="text-sm text-gray-400">{company.slug}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {company.survey_count} survey{Number(company.survey_count) !== 1 ? 's' : ''}
                        </span>
                        <span className="text-gray-300">→</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Surveys List ──────────────────────── */}
            {view === 'surveys' && (
              <div className="card">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Surveys</h2>
                <div className="divide-y divide-gray-100">
                  {surveys.map((survey) => (
                    <button
                      key={survey.id}
                      onClick={() => openSurvey(survey)}
                      className="w-full py-3 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-lg px-2 -mx-2 text-left"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{survey.title}</p>
                        <p className="text-sm text-gray-400">
                          {Number(survey.response_count)} response{Number(survey.response_count) !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          survey.status === 'active' ? 'bg-secondary-100 text-secondary-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {survey.status}
                        </span>
                        <span className="text-gray-300">→</span>
                      </div>
                    </button>
                  ))}
                  {surveys.length === 0 && (
                    <p className="py-4 text-gray-400 text-sm">No surveys found.</p>
                  )}
                </div>
              </div>
            )}

            {/* ── Survey Detail ─────────────────────── */}
            {view === 'survey-detail' && selectedSurvey && (
              <div className="space-y-6">

                {/* Survey Links Section */}
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Survey Links</h2>
                    <button onClick={handleGenerateLink} className="btn-primary text-sm">
                      + Generate New Link
                    </button>
                  </div>

                  {links.length === 0 ? (
                    <p className="text-gray-400 text-sm">No links generated yet. Click "Generate New Link" to create one.</p>
                  ) : (
                    <div className="space-y-2">
                      {links.map((link) => (
                        <div key={link.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-600 font-mono truncate">
                              {window.location.origin}/survey/{link.token}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {Number(link.response_count)} response{Number(link.response_count) !== 1 ? 's' : ''} · Created {new Date(link.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleCopyLink(link.token)}
                            className={`ml-3 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                              copiedToken === link.token
                                ? 'bg-secondary-50 border-secondary-200 text-secondary-700'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {copiedToken === link.token ? 'Copied!' : 'Copy Link'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Questions Section */}
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">
                      Questions ({questions.length})
                    </h2>
                    <button onClick={() => setShowAddQuestion(true)} className="btn-primary text-sm">
                      + Add Question
                    </button>
                  </div>

                  <div className="space-y-2">
                    {questions.map((q, idx) => (
                      <div key={q.id} className="border border-gray-100 rounded-lg p-3">
                        {editingQuestion?.id === q.id ? (
                          /* Edit mode */
                          <div className="space-y-3">
                            <textarea
                              value={editingQuestion.text}
                              onChange={(e) => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                              className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary-300 focus:outline-none"
                              rows={2}
                            />
                            <div className="flex items-center gap-2">
                              <select
                                value={editingQuestion.type}
                                onChange={(e) => setEditingQuestion({ ...editingQuestion, type: e.target.value as Question['type'] })}
                                className="border border-gray-200 rounded-lg px-2 py-1 text-sm"
                              >
                                <option value="rating">Rating (1-5)</option>
                                <option value="enps">eNPS (0-10)</option>
                                <option value="open_text">Open Text</option>
                              </select>
                              <button onClick={handleUpdateQuestion} className="btn-primary text-sm py-1">Save</button>
                              <button onClick={() => setEditingQuestion(null)} className="btn-secondary text-sm py-1">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          /* View mode */
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-gray-400 font-medium">Q{idx + 1}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${typeBadgeColor(q.type)}`}>
                                  {q.type === 'open_text' ? 'text' : q.type}
                                </span>
                              </div>
                              <p className="text-sm text-gray-900">{q.text}</p>
                            </div>
                            <div className="flex items-center gap-1 ml-3">
                              <button
                                onClick={() => setEditingQuestion({ ...q })}
                                className="text-xs text-gray-400 hover:text-primary-600 px-2 py-1"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="text-xs text-gray-400 hover:text-concern-500 px-2 py-1"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Question Form */}
                  {showAddQuestion && (
                    <div className="mt-4 border border-primary-200 bg-primary-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">New Question</h3>
                      <textarea
                        value={questionForm.text}
                        onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })}
                        placeholder="Enter question text..."
                        className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary-300 focus:outline-none mb-3"
                        rows={2}
                      />
                      <div className="flex items-center gap-3">
                        <select
                          value={questionForm.type}
                          onChange={(e) => setQuestionForm({ ...questionForm, type: e.target.value })}
                          className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                        >
                          <option value="rating">Rating (1-5)</option>
                          <option value="enps">eNPS (0-10)</option>
                          <option value="open_text">Open Text</option>
                        </select>
                        <button onClick={handleAddQuestion} className="btn-primary text-sm" disabled={!questionForm.text}>
                          Add
                        </button>
                        <button onClick={() => { setShowAddQuestion(false); setQuestionForm({ text: '', type: 'rating' }); }} className="btn-secondary text-sm">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  );
}
