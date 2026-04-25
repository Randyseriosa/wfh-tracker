import React from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { useLoading } from '../../context/LoadingContext';
import { useModal } from '../../context/ModalContext';

const Settings: React.FC = () => {
    const { showLoading, hideLoading } = useLoading();
    const { showAlert } = useModal();

    const handleApplyChanges = async () => {
        showLoading();
        // Simulate an API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        hideLoading();
        showAlert('Changes applied successfully', 'Update');
    };

    return (
        <DashboardLayout title="System Configurations">
            <div className="max-w-4xl">
                <div className="surface-elevated p-8 md:p-12 space-y-12 animate-fade-in-up">
                    <div className="space-y-3">
                        <h1 className="text-3xl font-bold tracking-tight">Application Parameters</h1>
                        <p className="text-secondary-content text-sm">Configure global environment and user experience settings.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <div className="p-6 rounded-[24px] bg-base-200 border border-base-300 flex items-center justify-between group hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-base-300 flex items-center justify-center text-secondary group-hover:bg-primary group-hover:text-white transition-all">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Visual Language</h3>
                                    <p className="text-secondary-content text-xs mt-1">Switch between adaptive light and high-fidelity dark interfaces.</p>
                                </div>
                            </div>
                            <div className="badge badge-lg bg-primary/10 text-primary border-none font-bold uppercase text-[10px] tracking-widest px-4">Active: Adaptive</div>
                        </div>

                        <div className="p-6 rounded-[24px] bg-base-200 border border-base-300 flex items-center justify-between group opacity-50">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-base-300 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Relay Signals</h3>
                                    <p className="text-secondary-content text-xs mt-1">Configure real-time event alerts and ecosystem signals.</p>
                                </div>
                            </div>
                            <div className="text-secondary-content text-[10px] font-bold uppercase tracking-widest bg-base-300 px-3 py-1 rounded-full">Inactive</div>
                        </div>

                        <div className="p-6 rounded-[24px] bg-base-200 border border-base-300 flex items-center justify-between group opacity-50">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-base-300 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Security Protocols</h3>
                                    <p className="text-secondary-content text-xs mt-1">Manage encryption layers and identity verification methods.</p>
                                </div>
                            </div>
                            <div className="text-secondary-content text-[10px] font-bold uppercase tracking-widest bg-base-300 px-3 py-1 rounded-full">Coming Soon</div>
                        </div>
                    </div>

                    <div className="pt-10 border-t border-base-300 flex justify-end">
                        <button
                            onClick={handleApplyChanges}
                            className="btn btn-primary rounded-xl px-12 h-14 shadow-lg shadow-primary/20 text-sm font-bold tracking-widest uppercase"
                        >
                            Apply Changes
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Settings;


