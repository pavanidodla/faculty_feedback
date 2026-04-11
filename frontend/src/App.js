import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Register from './pages/Register';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import StudentDashboard from './pages/StudentDashboard';
import FeedbackForm from './pages/FeedbackForm';
import ViewFeedback from './pages/ViewFeedback';
import AdminDashboard from './pages/AdminDashboard';
import ManageSubjects from './pages/ManageSubjects';
import AdminViewFeedback from './pages/AdminViewFeedback';
import ExportFeedback from './pages/ExportFeedback';


const PrivateRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
};

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? (user.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />) : <Navigate to="/login" />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={<PrivateRoute role="student"><StudentDashboard /></PrivateRoute>} />
        <Route path="/feedback" element={<PrivateRoute role="student"><FeedbackForm /></PrivateRoute>} />
        <Route path="/my-feedback" element={<PrivateRoute role="student"><ViewFeedback /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/subjects" element={<PrivateRoute role="admin"><ManageSubjects /></PrivateRoute>} />
        <Route path="/admin/feedback" element={<PrivateRoute role="admin"><AdminViewFeedback /></PrivateRoute>} />
        <Route path="/admin/export" element={<PrivateRoute role="admin"><ExportFeedback /></PrivateRoute>} />
        
      </Routes>
    </BrowserRouter>
  );
}