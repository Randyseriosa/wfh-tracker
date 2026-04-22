import React from 'react';
import DashboardLayout from '../../layout/DashboardLayout';

const MemberDashboard: React.FC = () => {
    return (
        <DashboardLayout title="Member Dashboard">
            <div className="max-w-4xl mx-auto space-y-10">
                <div className="surface-elevated p-12 text-center space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            Digital Workspace
                        </h1>
                        <p className="text-secondary-content text-lg">Welcome to your personalized WFH ecosystem control center.</p>
                    </div>
                    <div className="pt-6 border-t border-white/5">
                        <p className="text-sm text-secondary-content/60 font-medium tracking-widest uppercase">System Operational</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="surface-elevated-sm p-8 space-y-4">
                        <h3 className="text-xl font-bold">Quick Actions</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <button className="btn-primary-custom h-12">New Request</button>
                            <button className="btn btn-ghost rounded-full border border-white/10 h-12">View History</button>
                        </div>
                    </div>
                    <div className="surface-elevated-sm p-8 space-y-4">
                        <h3 className="text-xl font-bold">Notifications</h3>
                        <p className="text-secondary-content text-sm">No new notifications from your supervisor.</p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default MemberDashboard;
