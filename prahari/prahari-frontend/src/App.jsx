import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import Login from './pages/Login';
import MinistryDashboard from './pages/MinistryDashboard';
import UserDashboard from './pages/UserDashboard';
import WorksList from './pages/WorksList';
import WorkDetail from './pages/WorkDetail';
import VendorGraph from './pages/VendorGraph';
import Assistant from './pages/Assistant';
import AdminUpload from './pages/AdminUpload';
import ReviewQueue from './pages/ReviewQueue';
import EngineControl from './pages/EngineControl';
import CitizenWork from './pages/CitizenWork';
import { DemoTourProvider } from './context/DemoTourContext';
import InteractiveDemoTour from './components/InteractiveDemoTour';

function ProtectedRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem('prahari_token');
  if (!token) return <Navigate to="/login" replace />;
  if (adminOnly) {
    const user = JSON.parse(localStorage.getItem('prahari_user') || '{}');
    if (user.role !== 'admin') return <Navigate to="/user/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <DemoTourProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/citizen/work/:id" element={<CitizenWork />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Admin panel */}
            <Route path="/admin/ministry" element={<ProtectedRoute adminOnly><MinistryDashboard /></ProtectedRoute>} />
            <Route path="/admin/state" element={<ProtectedRoute adminOnly><MinistryDashboard /></ProtectedRoute>} />
            <Route path="/admin/district" element={<ProtectedRoute adminOnly><MinistryDashboard /></ProtectedRoute>} />
            <Route path="/admin/upload" element={<ProtectedRoute adminOnly><AdminUpload /></ProtectedRoute>} />
            <Route path="/admin/review" element={<ProtectedRoute adminOnly><ReviewQueue /></ProtectedRoute>} />
            <Route path="/admin/vendors" element={<ProtectedRoute adminOnly><VendorGraph /></ProtectedRoute>} />
            <Route path="/admin/engines" element={<ProtectedRoute adminOnly><EngineControl /></ProtectedRoute>} />
            <Route path="/admin/assistant" element={<ProtectedRoute adminOnly><Assistant /></ProtectedRoute>} />
            <Route path="/admin/works/:id" element={<ProtectedRoute adminOnly><WorkDetail /></ProtectedRoute>} />

            {/* User panel (MP / District) */}
            <Route path="/user/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
            <Route path="/user/works" element={<ProtectedRoute><WorksList /></ProtectedRoute>} />
            <Route path="/user/works/:id" element={<ProtectedRoute><WorkDetail /></ProtectedRoute>} />
            <Route path="/user/alerts" element={<ProtectedRoute><ReviewQueue /></ProtectedRoute>} />
            <Route path="/user/assistant" element={<ProtectedRoute><Assistant /></ProtectedRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          <InteractiveDemoTour />
        </DemoTourProvider>
      </BrowserRouter>
    </LanguageProvider>
  );
}
