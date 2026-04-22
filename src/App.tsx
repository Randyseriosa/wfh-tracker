import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/page/Login';
import AdminDashboard from './components/page/admin/AdminDashboard';
import SupervisorDashboard from './components/page/supervisor/SupervisorDashboard';
import MemberDashboard from './components/page/member/MemberDashboard';
import ProfilePage from './components/page/Profile';
import Settings from './components/page/Settings';
import MemberPortal from './components/page/MemberPortal';
import RequestPortal from './components/page/RequestPortal';
import { useAuth } from './hooks/useAuth';
import './App.css';
import WebGLBackground from './components/common/WebGLBackground';

const RoleBasedRedirect: React.FC = () => {
    const { profile, loading, user } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;
    if (!profile) return <div className="flex items-center justify-center min-h-screen font-bold text-error">Profile not found. Please contact admin.</div>;

    switch (profile.role) {
        case 'admin':
            return <Navigate to="/admin" replace />;
        case 'supervisor':
            return <Navigate to="/supervisor" replace />;
        case 'member':
            return <Navigate to="/member" replace />;
        default:
            return <Navigate to="/login" replace />;
    }
};

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { profile, loading, user } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;
    if (!profile || !allowedRoles.includes(profile.role)) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-base-100 font-sans relative">
                <WebGLBackground />
                <div className="relative z-10 min-h-screen flex flex-col">
                    <Routes>
                        <Route path="/" element={<RoleBasedRedirect />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Login />} />
                        <Route path="/member-portal" element={<MemberPortal />} />
                        <Route path="/requestportal" element={<RequestPortal />} />

                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <AdminDashboard />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/supervisor"
                            element={
                                <ProtectedRoute allowedRoles={['supervisor']}>
                                    <SupervisorDashboard />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/member"
                            element={
                                <ProtectedRoute allowedRoles={['member']}>
                                    <MemberDashboard />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/profile"
                            element={
                                <ProtectedRoute allowedRoles={['admin', 'supervisor', 'member']}>
                                    <ProfilePage />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/settings"
                            element={
                                <ProtectedRoute allowedRoles={['admin', 'supervisor', 'member']}>
                                    <Settings />
                                </ProtectedRoute>
                            }
                        />

                        <Route path="*" element={<div className="flex items-center justify-center min-h-screen text-2xl font-bold">404 - Page Not Found</div>} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;
