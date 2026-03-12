import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PageWrapper } from '../../components/PageWrapper';
import {
  getCompanies,
  getCompanyOverview,
  getResponsesTimeline,
  type Company,
  type DashboardOverview,
  type TimelineEntry,
} from '../../services/dashboard.service';

export default function DashboardPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [overviewLoading, setOverviewLoading] = useState(false);

  useEffect(() => {
    getCompanies()
      .then((data) => {
        setCompanies(data);
        if (data.length > 0) {
          setSelectedCompanyId(data[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedCompanyId) return;
    setOverviewLoading(true);
    getCompanyOverview(selectedCompanyId)
      .then((data) => {
        setOverview(data);
        // Fetch timeline data for the survey
        if (data?.survey?.id) {
          return getResponsesTimeline(selectedCompanyId, data.survey.id);
        }
        return [];
      })
      .then((timelineData) => setTimeline(timelineData ?? []))
      .catch(() => { setOverview(null); setTimeline([]); })
      .finally(() => setOverviewLoading(false));
  }, [selectedCompanyId]);

  // Format dates for the chart
  const chartData = timeline.map((entry) => ({
    date: new Date(entry.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    count: Number(entry.count),
  }));

  return (
    <PageWrapper variant="dashboard" className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Employee satisfaction results and action tracking</p>
          </div>

          {/* Company selector */}
          {companies.length > 0 && (
            <select
              value={selectedCompanyId ?? ''}
              onChange={(e) => setSelectedCompanyId(Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : overviewLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : overview ? (
          <div>
            {/* Survey title */}
            <p className="text-sm text-gray-500 mb-6">
              Survey: <span className="font-medium text-gray-700">{overview.survey.title}</span>
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                overview.survey.status === 'active'
                  ? 'bg-secondary-100 text-secondary-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {overview.survey.status}
              </span>
            </p>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <MetricCard
                label="Response Rate"
                value={`${overview.metrics.responseRate}%`}
                color="primary"
              />
              <MetricCard
                label="Total Responses"
                value={String(overview.metrics.totalResponses)}
                color="secondary"
              />
              <MetricCard
                label="Average Score"
                value={overview.metrics.averageScore !== null
                  ? `${overview.metrics.averageScore} / 5`
                  : '—'}
                color="primary"
              />
              <MetricCard
                label="eNPS Score"
                value={overview.metrics.enpsScore !== null
                  ? String(overview.metrics.enpsScore)
                  : '—'}
                color={
                  overview.metrics.enpsScore !== null && overview.metrics.enpsScore >= 30
                    ? 'secondary'
                    : overview.metrics.enpsScore !== null && overview.metrics.enpsScore < 0
                    ? 'concern'
                    : 'accent'
                }
              />
              <MetricCard
                label="Areas of Concern"
                value={String(overview.metrics.areasOfConcern)}
                color={overview.metrics.areasOfConcern > 0 ? 'concern' : 'secondary'}
              />
            </div>

            {/* Responses Over Time Chart */}
            <div className="card">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Responses Over Time</h2>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                      formatter={(value) => [`${value} responses`, 'Count']}
                    />
                    <Bar dataKey="count" fill="#4A90D9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-sm py-8 text-center">
                  No response data yet. Responses will appear here as employees complete the survey.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-400">No survey data available for this company yet.</p>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  color: 'primary' | 'secondary' | 'accent' | 'concern';
}

function MetricCard({ label, value, color }: MetricCardProps) {
  const colorClasses = {
    primary: 'text-primary-600',
    secondary: 'text-secondary-600',
    accent: 'text-accent-600',
    concern: 'text-concern-500',
  };

  return (
    <div className="card">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${colorClasses[color]}`}>{value}</p>
    </div>
  );
}
