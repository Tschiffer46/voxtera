import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SurveyPage from './pages/survey/SurveyPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import AdminPage from './pages/admin/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Employee survey — anonymous access via token */}
        <Route path="/survey/:token" element={<SurveyPage />} />

        {/* Management dashboard */}
        <Route path="/dashboard/*" element={<DashboardPage />} />

        {/* HR admin panel */}
        <Route path="/admin/*" element={<AdminPage />} />

        {/* Redirect root to dashboard for now */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
