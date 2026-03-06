import { useState, useEffect } from 'react';
import { PageWrapper } from '../../components/PageWrapper';
import api from '../../services/api';

interface Company {
  id: number;
  name: string;
  slug: string;
  survey_count: number;
}

export default function AdminPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Company[]>('/admin/companies')
      .then((res) => setCompanies(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageWrapper variant="admin" className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Admin Panel</h1>
          <p className="text-gray-500 text-sm mt-1">Manage companies, surveys, and access links</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Companies</h2>
            <div className="divide-y divide-gray-100">
              {companies.map((company) => (
                <div key={company.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{company.name}</p>
                    <p className="text-sm text-gray-400">{company.slug}</p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {company.survey_count} survey{Number(company.survey_count) !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}

              {companies.length === 0 && (
                <p className="py-4 text-gray-400 text-sm">No companies found.</p>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 card">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Coming in Phase 4</h2>
          <ul className="text-sm text-gray-500 list-disc list-inside space-y-1">
            <li>Edit company and organizational structure</li>
            <li>Create and manage surveys</li>
            <li>Generate anonymous survey links</li>
            <li>View detailed response rates</li>
          </ul>
        </div>
      </div>
    </PageWrapper>
  );
}
