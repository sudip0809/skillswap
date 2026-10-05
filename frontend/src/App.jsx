import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import { Login, Register } from './pages/Auth';
import ProfileForm from './pages/ProfileForm';
import Dashboard from './pages/Dashboard';
import Matches from './pages/Matches';
import UserProfile from './pages/UserProfile';
import Requests from './pages/Requests';
import Swaps from './pages/Swaps';
import ExchangeRoom from './pages/ExchangeRoom';
import Sessions from './pages/Sessions';
import Notifications from './pages/Notifications';

const P = ({ children }) => <ProtectedRoute>{children}</ProtectedRoute>;

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile/setup" element={<ProtectedRoute allowIncomplete><ProfileForm setup /></ProtectedRoute>} />
        <Route path="/profile/edit" element={<P><ProfileForm /></P>} />
        <Route path="/dashboard" element={<P><Dashboard /></P>} />
        <Route path="/matches" element={<P><Matches /></P>} />
        <Route path="/users/:id" element={<P><UserProfile /></P>} />
        <Route path="/requests" element={<P><Requests /></P>} />
        <Route path="/swaps" element={<P><Swaps /></P>} />
        <Route path="/swaps/:id" element={<P><ExchangeRoom /></P>} />
        <Route path="/sessions" element={<P><Sessions /></P>} />
        <Route path="/notifications" element={<P><Notifications /></P>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
