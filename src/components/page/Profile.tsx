import React from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';

const Profile: React.FC = () => {
    const { profile } = useAuth();

    return (
        <DashboardLayout title="Identity Profile">
            <div className="max-w-4xl">
                <div className="surface-elevated p-8 md:p-12 space-y-10 animate-fade-in-up">
                    <div className="flex flex-col md:flex-row items-center gap-8 border-b border-base-300 pb-10">
                        <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-4xl font-bold shadow-xl shadow-primary/20">
                            {profile?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 text-center md:text-left space-y-1">
                            <h1 className="text-3xl font-bold tracking-tight">{profile?.name || 'Authenticated User'}</h1>
                            <p className="text-secondary-content uppercase tracking-widest text-[10px] font-extrabold flex items-center justify-center md:justify-start gap-2">
                                <span className="w-2 h-2 rounded-full bg-success"></span>
                                Workspace Identity Verified
                            </p>
                        </div>
                        <button className="btn btn-primary rounded-xl px-8 h-12 shadow-lg shadow-primary/20">Edit Profile</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-8">
                            <div className="group">
                                <label className="text-[10px] uppercase tracking-widest text-secondary-content font-bold block mb-2 group-hover:text-primary transition-colors">Primary Domain</label>
                                <div className="text-lg font-medium p-4 rounded-xl bg-base-200 border border-base-300">Internal Ecosystem</div>
                            </div>
                            <div className="group">
                                <label className="text-[10px] uppercase tracking-widest text-secondary-content font-bold block mb-2 group-hover:text-primary transition-colors">Access Level</label>
                                <div className="text-lg font-bold text-primary p-4 rounded-xl bg-primary/5 border border-primary/10 capitalize">
                                    {profile?.role || 'Authorized User'}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-8">
                            <div className="group">
                                <label className="text-[10px] uppercase tracking-widest text-secondary-content font-bold block mb-2 group-hover:text-primary transition-colors">Credential ID</label>
                                <div className="text-lg font-mono p-4 rounded-xl bg-base-200 border border-base-300">
                                    {profile?.id.substring(0, 18)}...
                                </div>
                            </div>
                            <div className="group">
                                <label className="text-[10px] uppercase tracking-widest text-secondary-content font-bold block mb-2 group-hover:text-primary transition-colors">Account Type</label>
                                <div className="text-lg font-medium p-4 rounded-xl bg-base-200 border border-base-300">Permanent Employee</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Profile;

