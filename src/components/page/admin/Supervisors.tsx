import React from 'react';
import DashboardLayout from '../../layout/DashboardLayout';
import { useSupervisors } from '../../../hooks/useWFH';
import { useLoading } from '../../../context/LoadingContext';

const Supervisors = () => {
    const { supervisors, loading, refresh } = useSupervisors();
    const { showLoading, hideLoading } = useLoading();

    const handleRefresh = async () => {
        showLoading();
        await refresh();
        hideLoading();
    };

    return (
        <DashboardLayout title="Supervisor Oversight">
            <div className="surface-elevated flex flex-col h-full min-h-[500px] animate-fade-in-up">
                <div className="p-8 border-b border-base-300 flex justify-between items-center bg-base-200/30">
                    <div>
                        <h3 className="text-2xl font-black capitalize">Supervisors</h3>
                        <p className="text-xs text-secondary-content mt-1">
                            List of active supervisors and their managed team size.
                        </p>
                    </div>
                    <button onClick={handleRefresh} className="btn btn-ghost btn-sm btn-circle hover:bg-primary/20 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="table w-full">
                        <thead className="bg-base-200/50">
                            <tr className="border-none">
                                <th className="text-[10px] text-secondary-content uppercase tracking-widest py-6 px-8 leading-none">Supervisor Name</th>
                                <th className="text-[10px] text-secondary-content uppercase tracking-widest py-6 leading-none">Department</th>
                                <th className="text-[10px] text-secondary-content uppercase tracking-widest py-6 text-center leading-none">Members</th>
                                <th className="text-[10px] text-secondary-content uppercase tracking-widest py-6 text-right px-8 leading-none">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-base-300">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center">
                                        <div className="loader mx-auto"></div>
                                    </td>
                                </tr>
                            ) : supervisors.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-20 text-secondary-content font-medium italic">
                                        No supervisors found in the system.
                                    </td>
                                </tr>
                            ) : (
                                supervisors.map((s, index) => (
                                    <tr
                                        key={s.id}
                                        className="hover:bg-primary/5 transition-all group animate-fade-in-up"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <td className="py-6 px-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border border-primary/10 shadow-sm">
                                                    {s.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold group-hover:text-primary transition-colors text-base">{s.name}</div>
                                                    <div className="text-[10px] opacity-50 font-mono tracking-tighter">ID: {s.id.substring(0, 8)}...</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-6">
                                            <span className="px-3 py-1.5 rounded-xl bg-base-200 text-[10px] font-black uppercase tracking-widest border border-base-300 group-hover:border-primary/20 transition-colors">
                                                {s.department?.name || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="py-6 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-xl font-black text-primary font-mono leading-none">
                                                    {s.memberCount}
                                                </span>
                                                <span className="text-[9px] uppercase tracking-tighter opacity-40 font-bold mt-1">Managed</span>
                                            </div>
                                        </td>
                                        <td className="py-6 px-8 text-right">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success text-[10px] font-bold uppercase tracking-wider border border-success/20">
                                                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
                                                Active
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Supervisors;
