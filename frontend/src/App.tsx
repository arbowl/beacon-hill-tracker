import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import ScrollToTop from './components/ScrollToTop'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import ViewsPage from './pages/ViewsPage'
import KeysPage from './pages/KeysPage'
import AdminPage from './pages/AdminPage'
import ContactPage from './pages/ContactPage'
import AboutPage from './pages/AboutPage'
import FAQPage from './pages/FAQPage'
import PrivacyPage from './pages/PrivacyPage'
import TOSPage from './pages/TOSPage'
import PressPage from './pages/PressPage'
import UpdatesPage from './pages/UpdatesPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Layout>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/tos" element={<TOSPage />} />
            <Route path="/press" element={<PressPage />} />
            <Route path="/updates" element={<UpdatesPage />} />
            
            {/* Dashboard - public access */}
            <Route path="/dashboard" element={<DashboardPage />} />
            
            {/* Protected routes */}
            <Route path="/views" element={
              <ProtectedRoute>
                <ViewsPage />
              </ProtectedRoute>
            } />
            <Route path="/keys" element={
              <ProtectedRoute requiredRole="privileged">
                <KeysPage />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin">
                <AdminPage />
              </ProtectedRoute>
            } />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  )
}

export default App
