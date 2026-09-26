import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import LessonView from './pages/LessonView';
import MyLearning from './pages/MyLearning';
import Assignments from './pages/Assignments';
import AssignmentDetail from './pages/AssignmentDetail';
import Teach from './pages/Teach';
import CourseEditor from './pages/CourseEditor';
import Admin from './pages/Admin';
import Profile from './pages/Profile';

const staff = ['instructor', 'admin'];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/courses/:courseId/lessons/:lessonId" element={<LessonView />} />
        <Route path="/my-learning" element={<MyLearning />} />
        <Route path="/assignments" element={<Assignments />} />
        <Route path="/assignments/:id" element={<AssignmentDetail />} />
        <Route path="/teach" element={<ProtectedRoute roles={staff}><Teach /></ProtectedRoute>} />
        <Route path="/teach/new" element={<ProtectedRoute roles={staff}><CourseEditor /></ProtectedRoute>} />
        <Route path="/teach/:id" element={<ProtectedRoute roles={staff}><CourseEditor /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Admin /></ProtectedRoute>} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
