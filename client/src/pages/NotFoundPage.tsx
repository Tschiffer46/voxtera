import { Link } from 'react-router-dom';
import { PageWrapper } from '../components/PageWrapper';

export default function NotFoundPage() {
  return (
    <PageWrapper>
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Page not found</h2>
          <p className="text-gray-500 mb-6">The page you are looking for doesn't exist.</p>
          <Link to="/dashboard" className="btn-primary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </PageWrapper>
  );
}
