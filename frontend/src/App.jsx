import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

// Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import ExpensesPage from './pages/ExpensesPage';
import ExpenseNewPage from './pages/ExpenseNewPage';
import ExpenseDetailPage from './pages/ExpenseDetailPage';
import UsersPage from './pages/UsersPage';
import RulesPage from './pages/RulesPage';
import CategoriesPage from './pages/CategoriesPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
            },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected routes with Layout */}
          <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/expenses/new" element={<ExpenseNewPage />} />
            <Route path="/expenses/:id" element={<ExpenseDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* Admin-only routes */}
            <Route path="/users" element={<PrivateRoute requiredRole="admin"><UsersPage /></PrivateRoute>} />
            <Route path="/rules" element={<PrivateRoute requiredRole="admin"><RulesPage /></PrivateRoute>} />
            <Route path="/categories" element={<PrivateRoute requiredRole="admin"><CategoriesPage /></PrivateRoute>} />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
