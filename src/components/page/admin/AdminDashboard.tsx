import React, { useState } from 'react';
import DashboardLayout from '../../layout/DashboardLayout';
import { useDepartments } from '../../../hooks/useWFH';
import { wfhService } from '../../../supabaseService';

const AdminDashboard = () => {
    const { departments, loading, refresh } = useDepartments();
    const [newDeptName, setNewDeptName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddDept = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDeptName.trim()) return;

        try {
            setIsSubmitting(true);
            await wfhService.addDepartment(newDeptName.trim());
            setNewDeptName('');
            refresh();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardLayout title="Admin Dashboard">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Add Department Section */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="surface-elevated p-8">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold">New Department</h2>
                            <p className="text-xs text-secondary-content mt-1">Expand your organizational structure.</p>
                        </div>
                        <form onSubmit={handleAddDept} className="space-y-6">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text text-secondary-content uppercase tracking-widest text-[10px] font-bold">Department Name</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Design, Engineering"
                                    className="input input-bordered w-full bg-base-200 border-base-300 focus:border-primary transition-all rounded-xl h-12"
                                    value={newDeptName}
                                    onChange={(e) => setNewDeptName(e.target.value)}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className={`btn btn-primary w-full rounded-xl h-12 shadow-lg shadow-primary/20 ${isSubmitting ? 'loading' : ''}`}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Creating...' : 'Create Department'}
                            </button>
                        </form>
                    </div>

                    <div className="surface-elevated p-8 border-primary/10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{departments.length}</div>
                                <div className="text-xs text-secondary-content uppercase tracking-wider font-bold">Total Departments</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Department List */}
                <div className="lg:col-span-8">
                    <div className="surface-elevated flex flex-col h-full min-h-[500px]">
                        <div className="p-8 border-b border-base-300 flex justify-between items-center bg-base-200/30">
                            <div>
                                <h3 className="text-xl font-bold">Active Departments</h3>
                                <p className="text-xs text-secondary-content mt-1">Manage existing departments.</p>
                            </div>
                            <button onClick={refresh} className="btn btn-ghost btn-sm btn-circle">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto">
                            {loading ? (
                                <div className="flex items-center justify-center h-64">
                                    <span className="loading loading-ring loading-lg text-primary"></span>
                                </div>
                            ) : departments.length === 0 ? (
                                <div className="p-20 text-center">
                                    <div className="w-16 h-16 bg-base-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                    <p className="text-secondary-content">No departments defined yet.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-base-300">
                                    {departments.map((dept, index) => (
                                        <div
                                            key={dept.id}
                                            className="p-6 flex justify-between items-center group hover:bg-primary/5 transition-all animate-fade-in-up"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-base-200 flex items-center justify-center font-bold text-xs">
                                                    {dept.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="font-bold group-hover:text-primary transition-colors">{dept.name}</span>
                                                    <div className="text-[10px] text-secondary-content uppercase tracking-widest font-mono">ID: {dept.id.substring(0, 8)}...</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs text-secondary-content font-medium block">{new Date(dept.created_at).toLocaleDateString()}</span>
                                                <button className="text-[10px] text-primary font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">View Details</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;

