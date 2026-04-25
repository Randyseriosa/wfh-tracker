import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/page/Login';
import AdminDashboard from './components/page/admin/AdminDashboard';
import Supervisors from './components/page/admin/Supervisors';
import SupervisorDashboard from './components/page/supervisor/SupervisorDashboard';
import MemberDashboard from './components/page/member/MemberDashboard';
import ProfilePage from './components/page/Profile';
import Settings from './components/page/Settings';
import MemberPortal from './components/page/MemberPortal';
import RequestPortal from './components/page/RequestPortal';
import { useAuth } from './hooks/useAuth';
import { AuthProvider } from './context/AuthContext';
import './App.css';
import WebGLBackground from './components/common/WebGLBackground';
import { LoadingProvider } from './context/LoadingContext';
import { ModalProvider } from './context/ModalContext';

const RoleBasedRedirect: React.FC = () => {
    const { profile, loading, user } = useAuth();

    if (loading) return null;

    if (!user) return <Navigate to="/login" replace />;

    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center text-error border border-error/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black tracking-tight">Profile Not Found</h2>
                    <p className="text-secondary-content max-w-xs mx-auto">Authenticated as <span className="font-mono text-primary">{user.email}</span>, but no profile was found. Please contact admin.</p>
                </div>
                <button
                    onClick={() => {
                        import('./supabaseService').then(({ supabase }) => supabase.auth.signOut());
                        window.location.href = '/login';
                    }}
                    className="btn btn-ghost btn-sm text-error font-bold"
                >
                    Return to Login
                </button>
            </div>
        );
    }

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

    if (loading) return null;

    if (!user) return <Navigate to="/login" replace />;
    if (!profile || !allowedRoles.includes(profile.role)) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) return null;

    if (user) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

function App() {
    return (
        <LoadingProvider>
            <ModalProvider>
                <AuthProvider>
                    <Router>
                        <div className="min-h-screen bg-base-100 font-sans relative">
                            <WebGLBackground />
                            <div className="relative z-10 min-h-screen flex flex-col">
                                <Routes>
                                    <Route path="/" element={<RoleBasedRedirect />} />
                                    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                                    <Route path="/register" element={<PublicRoute><Login /></PublicRoute>} />
                                    <Route path="/register/member" element={<PublicRoute><Login /></PublicRoute>} />
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
                                        path="/admin/supervisors"
                                        element={
                                            <ProtectedRoute allowedRoles={['admin']}>
                                                <Supervisors />
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
                </AuthProvider>
            </ModalProvider>
        </LoadingProvider>
    );
}

export default App;
