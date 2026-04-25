import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../supabaseService';
import { useAuth } from '../../hooks/useAuth';
import { useLoading } from '../../context/LoadingContext';

interface DashboardLayoutProps {
    children: React.ReactNode;
    title: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { profile } = useAuth();
    const { showLoading, hideLoading } = useLoading();
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        if (saved === 'nord') return 'wfh-theme';
        return saved || 'wfh-theme';
    });

    useEffect(() => {
        document.querySelector('html')?.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'wfh-theme' ? 'dark' : 'wfh-theme');
    };

    const handleLogout = async () => {
        try {
            showLoading();
            await authService.logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            hideLoading();
        }
    };

    const isAdmin = profile?.role === 'admin';
    const isSupervisor = profile?.role === 'supervisor';

    const menuItems = [];

    if (isAdmin) {
        menuItems.push(
            { name: 'Dashboard', path: '/admin', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
            { name: 'Supervisor', path: '/admin/supervisors', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' }
        );
    } else if (isSupervisor) {
        menuItems.push(
            { name: 'Dashboard', path: '/supervisor', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
            { name: 'Requests', path: '/supervisor?tab=requests', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
            { name: 'Members', path: '/supervisor?tab=members', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
            { name: 'Settings', path: '/supervisor?tab=settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
        );
    } else {
        menuItems.push(
            { name: 'Dashboard', path: '/portal', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
            { name: 'Profile', path: '/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
        );
    }

    const isActive = (path: string) => {
        if (isSupervisor) {
            // For supervisor, check if path matches location.pathname + location.search
            const fullPath = location.pathname + location.search;
            if (path === '/supervisor' && !location.search) return true;
            return fullPath === path;
        }
        return location.pathname === path;
    };

    return (
        <div className="drawer lg:drawer-open min-h-screen bg-base-200/50">
            <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
            <div className="drawer-content flex flex-col items-center justify-start relative p-4 lg:p-8">
                {/* Mobile Header (Minimal) */}
                <div className="w-full flex lg:hidden items-center justify-between mb-8 px-2">
                    <label htmlFor="my-drawer-2" className="btn btn-ghost btn-circle drawer-button">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                    </label>
                    <h1 className="text-xl font-bold text-primary">WFH Portal</h1>
                    <div className="w-10"></div> {/* Spacer */}
                </div>

                {/* Main Content */}
                <div className="w-full max-w-7xl animate-fade-in-up">
                    {children}
                </div>
            </div>

            <div className="drawer-side z-40">
                <label htmlFor="my-drawer-2" aria-label="close sidebar" className="drawer-overlay"></label>
                <div className="menu p-6 w-80 min-h-full bg-base-100 border-r border-base-300 text-base-content flex flex-col">
                    {/* Sidebar Brand */}
                    <div className="flex items-center gap-4 px-2 mb-10">
                        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-primary">WFH Tracker</h1>
                            <span className="text-[10px] uppercase tracking-widest font-bold opacity-50 px-1">{profile?.role || 'User'}</span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-2">
                        {menuItems.map((item) => (
                            <div
                                key={item.name}
                                onClick={() => navigate(item.path)}
                                className={`sidebar-item ${isActive(item.path) ? 'sidebar-item-active' : ''}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={item.icon} />
                                </svg>
                                {item.name}
                            </div>
                        ))}
                    </nav>

                    {/* Sidebar Footer */}
                    <div className="mt-auto space-y-4">
                        {/* Theme Toggle */}
                        <div
                            onClick={toggleTheme}
                            className="flex items-center justify-between p-4 rounded-2xl bg-base-200 border border-base-300 cursor-pointer group"
                        >
                            <div className="flex items-center gap-3">
                                {theme === 'wfh-theme' ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.95 16.95l.707.707M7.05 7.05l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                )}
                                <span className="text-sm font-medium">{theme === 'wfh-theme' ? 'Light Mode' : 'Dark Mode'}</span>
                            </div>
                            <div className="w-8 h-4 bg-base-300 rounded-full relative transition-all group-hover:bg-primary/20">
                                <div className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full transition-all duration-300 ${theme === 'wfh-theme' ? 'left-1 bg-warning shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'left-4 bg-primary'}`}></div>
                            </div>
                        </div>

                        {/* Profile & Logout */}
                        <div className="p-4 rounded-2xl bg-base-200 border border-base-300 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="avatar placeholder">
                                    <div className="bg-primary text-white rounded-full w-10 h-10 flex items-center justify-center">
                                        <span className="text-sm font-bold">{profile?.name?.charAt(0).toUpperCase() || 'U'}</span>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm font-bold truncate">{profile?.name || 'User'}</p>
                                    <p className="text-[10px] opacity-50 truncate uppercase tracking-widest">{profile?.role || 'Guest'}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="btn btn-ghost btn-sm w-full rounded-xl text-error hover:bg-error/10 flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;

