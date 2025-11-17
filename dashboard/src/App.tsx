import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import LoginPage from '@/pages/LoginPage'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import DashboardHome from '@/pages/DashboardHome'
import LeadsPage from '@/pages/LeadsPage'
import LeadDetailPage from '@/pages/LeadDetailPage'
import AnalyticsPage from '@/pages/AnalyticsPage'
import KeywordsPage from '@/pages/KeywordsPage'
import TemplatesPage from '@/pages/TemplatesPage'
import SettingsPage from '@/pages/SettingsPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return user ? <>{children}</> : <Navigate to="/login" />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <DashboardLayout>
              <Routes>
                <Route path="/" element={<DashboardHome />} />
                <Route path="/leads" element={<LeadsPage />} />
                <Route path="/leads/:id" element={<LeadDetailPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/keywords" element={<KeywordsPage />} />
                <Route path="/templates" element={<TemplatesPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </DashboardLayout>
          </PrivateRoute>
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
