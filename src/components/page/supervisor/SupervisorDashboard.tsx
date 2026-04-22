import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layout/DashboardLayout';
import { useTeamMembers, useTeamRequests, useDepartments, useSupervisorSettings } from '../../../hooks/useWFH';
import { useAuth } from '../../../hooks/useAuth';
import { wfhService } from '../../../supabaseService';

const SupervisorDashboard = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab'); // Will be null, 'requests', 'members', or 'settings'

    const { members, loading: loadingMembers, refresh: refreshMembers } = useTeamMembers(user?.id);
    const { requests, loading: loadingRequests, refresh: refreshRequests } = useTeamRequests(user?.id);
    const { departments } = useDepartments();
    const { settings, defaultCredits, updateDefaultCredits, applyTeamCredits, loading: loadingSettings } = useSupervisorSettings(user?.id);

    const [isAddMemberModalOpen, setAddMemberModalOpen] = useState(false);
    const [isUpdatingDefault, setIsUpdatingDefault] = useState(false);
    const [tempDefaultCredits, setTempDefaultCredits] = useState(0);
    const [tempSettingName, setTempSettingName] = useState('Default');

    // Form state for add member
    const [newMember, setNewMember] = useState({
        name: '',
        id_num: '',
        dept_id: '',
        initial_credits: 0
    });

    // Calendar state
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        setTempDefaultCredits(defaultCredits);
        // Find the setting name safely
        const defaultSetting = settings.find(s => s.name === 'default-credits');
        const currentName = defaultSetting?.name || (settings.length > 0 ? settings[0].name : 'Default');
        setTempSettingName(currentName === 'default-credits' ? 'Default' : currentName);
        setNewMember(prev => ({ ...prev, initial_credits: defaultCredits }));
    }, [defaultCredits, settings]);

    const handleApprove = async (id: string) => {
        try {
            await wfhService.approveRequest(id);
            refreshRequests();
            refreshMembers();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDeny = async (id: string) => {
        try {
            await wfhService.denyRequest(id);
            refreshRequests();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleRevert = async (id: string) => {
        try {
            await wfhService.revertRequest(id);
            refreshRequests();
            refreshMembers();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleUpdateDefaultCredits = async () => {
        try {
            setIsUpdatingDefault(true);
            await updateDefaultCredits(tempSettingName, tempDefaultCredits);
            alert('Settings updated successfully');
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsUpdatingDefault(false);
        }
    };

    const handleApplyTeamCredits = async () => {
        const confirmApply = window.confirm(
            `Are you sure you want to set ALL current team members to ${tempDefaultCredits} credits? This will override their current balances.`
        );

        if (!confirmApply) return;

        try {
            setIsUpdatingDefault(true);
            await applyTeamCredits(tempDefaultCredits);
            alert('Team credits updated successfully');
            refreshMembers(); // Refresh to see new balances
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsUpdatingDefault(false);
        }
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        // Validation
        if (!/^\d{4}-\d{4}$/.test(newMember.id_num)) {
            alert('ID Number must be in XXXX-XXXX format');
            return;
        }

        try {
            await wfhService.addMember({
                ...newMember,
                supervisor_id: user.id
            });
            setAddMemberModalOpen(false);
            setNewMember({ name: '', id_num: '', dept_id: '', initial_credits: defaultCredits });
            refreshMembers();
        } catch (err: any) {
            alert(err.message);
        }
    };

    // Calendar logic
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const changeMonth = (offset: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = [];

        // Padding for first week
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-24 bg-base-200/20 border border-base-300/30 rounded-lg"></div>);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayRequests = requests.filter(r => r.date_requested.startsWith(dateStr) && r.status === 'approved');
            const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();

            days.push(
                <div key={d} className={`relative group h-24 p-3 border border-base-300/50 rounded-lg flex flex-col gap-1 transition-all hover:bg-primary/5 ${isToday ? 'bg-primary/10 border-primary/30 ring-1 ring-primary/20' : 'bg-base-200/50'}`}>
                    <span className={`text-xs font-bold ${isToday ? 'text-primary' : 'text-secondary-content'}`}>{d}</span>
                    <div className="flex flex-wrap gap-1 mt-1 overflow-hidden">
                        {dayRequests.map((r) => (
                            <div key={r.id} className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(34,211,238,0.5)]" title={r.member?.name}></div>
                        ))}
                    </div>
                    {dayRequests.length > 0 && (
                        <>
                            <span className="text-[10px] font-bold text-primary mt-auto">{dayRequests.length} WFH</span>

                            {/* Hover Card */}
                            <div className="invisible group-hover:visible absolute z-[100] bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 w-56 p-4 bg-base-100/95 backdrop-blur-md border border-base-300 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-scale-in pointer-events-none">
                                <div className="text-[10px] uppercase font-black tracking-[0.1em] text-primary mb-3 border-b border-primary/10 pb-2 flex justify-between items-center">
                                    <span>WFH Personnel</span>
                                    <span className="bg-primary/10 px-2 py-0.5 rounded text-[9px]">{dayRequests.length}</span>
                                </div>
                                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {dayRequests.map((r) => (
                                        <div key={r.id} className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-[10px] shrink-0 border border-primary/20">
                                                {r.member?.name?.charAt(0)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-base-content truncate leading-none mb-0.5">{r.member?.name}</span>
                                                <span className="text-[9px] opacity-50 font-mono tracking-tighter">{r.member?.id_num}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Arrow */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] w-4 h-4 overflow-hidden">
                                    <div className="w-2.5 h-2.5 bg-base-100/95 border-b border-r border-base-300 rotate-45 -translate-y-1.5 translate-x-0.5 shadow-sm"></div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            );
        }

        return days;
    };

    return (
        <DashboardLayout title={!activeTab ? "Supervisor Dashboard" : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Ecosystem`}>
            <div className="space-y-8 pb-20">
                {/* Main Dashboard View: Stats & Calendar */}
                {!activeTab && (
                    <div className="space-y-8 animate-fade-in-up">
                        {/* Stats Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="surface-elevated p-8 flex flex-col gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <span className="text-[10px] text-secondary-content uppercase tracking-widest font-extrabold opacity-70">Total Members</span>
                                    <div className="text-4xl font-black mt-1 gradient-text">{members.length}</div>
                                    <p className="text-[10px] text-secondary-content mt-1">Managed personnel within your organization.</p>
                                </div>
                            </div>
                            <div className="surface-elevated p-8 flex flex-col gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-warning/10 flex items-center justify-center text-warning shadow-inner">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <span className="text-[10px] text-secondary-content uppercase tracking-widest font-extrabold opacity-70">Pending Actions</span>
                                    <div className="text-4xl font-black mt-1 text-warning">
                                        {requests.filter(r => r.status === 'pending').length}
                                    </div>
                                    <p className="text-[10px] text-secondary-content mt-1">WFH requests awaiting your verification.</p>
                                </div>
                            </div>
                        </div>

                        {/* Calendar View */}
                        <div className="surface-elevated p-8">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-2xl font-black tracking-tight">WFH Calendar</h3>
                                    <p className="text-xs text-secondary-content mt-1">Track approved WFH schedules globally.</p>
                                </div>
                                <div className="flex items-center gap-4 bg-base-200 p-2 rounded-2xl border border-base-300">
                                    <button onClick={() => changeMonth(-1)} className="btn btn-ghost btn-sm btn-circle hover:bg-primary/20 hover:text-primary transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <span className="text-sm font-bold min-w-[120px] text-center uppercase tracking-widest">
                                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                    </span>
                                    <button onClick={() => changeMonth(1)} className="btn btn-ghost btn-sm btn-circle hover:bg-primary/20 hover:text-primary transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-4 mb-4 text-center">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <div key={day} className="text-[10px] uppercase tracking-widest font-black text-secondary-content opacity-50">{day}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-4">
                                {renderCalendar()}
                            </div>
                        </div>
                    </div>
                )}

                {/* Specific Tab Views */}
                {activeTab && (
                    <div className="surface-elevated overflow-hidden animate-fade-in-up">
                        {/* Tab Header */}
                        <div className="p-8 border-b border-base-300 flex justify-between items-center bg-base-200/30">
                            <div>
                                <h3 className="text-2xl font-black capitalize">{activeTab} Monitor</h3>
                                <p className="text-xs text-secondary-content mt-1">
                                    {activeTab === 'requests' ? 'Unified view of all team submitted WFH requests.' :
                                        activeTab === 'members' ? 'Comprehensive list of managed personnel and balances.' :
                                            'Global management parameters and defaults.'}
                                </p>
                            </div>
                            {activeTab === 'members' && (
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-3 bg-base-100 p-1.5 rounded-xl border border-base-300">
                                        <button onClick={() => changeMonth(-1)} className="btn btn-ghost btn-xs btn-circle hover:bg-primary/20 hover:text-primary transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <span className="text-[10px] font-black uppercase tracking-widest min-w-[100px] text-center">
                                            {currentDate.toLocaleString('default', { month: 'short', year: 'numeric' })}
                                        </span>
                                        <button onClick={() => changeMonth(1)} className="btn btn-ghost btn-xs btn-circle hover:bg-primary/20 hover:text-primary transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                    <button className="btn btn-primary btn-sm rounded-xl px-6" onClick={() => setAddMemberModalOpen(true)}>
                                        New Personnel
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Requests Table */}
                        {activeTab === 'requests' && (
                            <div className="overflow-x-auto">
                                <table className="table w-full">
                                    <thead className="bg-base-200/50">
                                        <tr className="border-none">
                                            <th className="text-[10px] text-secondary-content uppercase tracking-widest py-6 px-8">Name</th>
                                            <th className="text-[10px] text-secondary-content uppercase tracking-widest py-6">Date Requested</th>
                                            <th className="text-[10px] text-secondary-content uppercase tracking-widest py-6">Status</th>
                                            <th className="text-[10px] text-secondary-content uppercase tracking-widest py-6 text-right px-8">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-base-300">
                                        {requests.length === 0 ? (
                                            <tr><td colSpan={4} className="text-center py-20 text-secondary-content font-medium">No submission records found in this cycle.</td></tr>
                                        ) : (
                                            requests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((req) => (
                                                <tr key={req.id} className="hover:bg-primary/5 transition-all group">
                                                    <td className="py-6 px-8">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                                                                {req.member?.name?.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold group-hover:text-primary transition-colors">{req.member?.name}</div>
                                                                <div className="text-[10px] opacity-50 font-mono">{req.member?.id_num}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-6 font-medium text-sm">
                                                        {new Date(req.date_requested).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </td>
                                                    <td className="py-6">
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${req.status === 'approved' ? 'bg-success/10 text-success border border-success/20' :
                                                            req.status === 'rejected' ? 'bg-error/10 text-error border border-error/20' :
                                                                'bg-warning/10 text-warning border border-warning/20'
                                                            }`}>
                                                            {req.status === 'rejected' ? 'Denied' : req.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-6 px-8 text-right">
                                                        {req.status === 'pending' && (
                                                            <div className="flex justify-end gap-2">
                                                                <button
                                                                    onClick={() => handleApprove(req.id)}
                                                                    className="btn btn-ghost btn-sm btn-circle text-success hover:bg-success/20"
                                                                    title="Approve"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeny(req.id)}
                                                                    className="btn btn-ghost btn-sm btn-circle text-error hover:bg-error/20"
                                                                    title="Deny"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        )}
                                                        {req.status === 'approved' && (
                                                            <div className="flex justify-end items-center gap-3">
                                                                <div className="text-success" title="Approved">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleRevert(req.id)}
                                                                    className="btn btn-ghost btn-sm btn-circle text-secondary hover:bg-secondary/20"
                                                                    title="Revert"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        )}
                                                        {req.status === 'rejected' && (
                                                            <div className="flex justify-end p-2 text-error" title="Denied">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Members Table */}
                        {activeTab === 'members' && (
                            <div className="overflow-x-auto">
                                <table className="table w-full">
                                    <thead className="bg-base-200/50">
                                        <tr className="border-none">
                                            <th className="text-[10px] text-secondary-content uppercase tracking-widest py-6 px-8">Name</th>
                                            <th className="text-[10px] text-secondary-content uppercase tracking-widest py-6">Department</th>
                                            <th className="text-[10px] text-secondary-content uppercase tracking-widest py-6 text-center">Allowance</th>
                                            <th className="text-[10px] text-secondary-content uppercase tracking-widest py-6 text-center">Used (Month)</th>
                                            <th className="text-[10px] text-secondary-content uppercase tracking-widest py-6 text-center">Left (Month)</th>
                                            <th className="text-[10px] text-secondary-content uppercase tracking-widest py-6 text-right px-8">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-base-300">
                                        {members.length === 0 ? (
                                            <tr><td colSpan={5} className="text-center py-20 text-secondary-content">No managed identities found.</td></tr>
                                        ) : (
                                            members.map((m) => {
                                                const monthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
                                                const usedThisMonth = requests.filter(r => r.member_id === m.id && r.status === 'approved' && r.date_requested.startsWith(monthStr)).length;
                                                const leftThisMonth = Math.max(0, (m.initial_credits ?? 0) - usedThisMonth);

                                                return (
                                                    <tr key={m.id} className="hover:bg-primary/5 transition-all">
                                                        <td className="py-6 px-8">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center text-secondary font-bold text-xs">
                                                                    {m.name.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold">{m.name}</div>
                                                                    <div className="text-[10px] opacity-40 font-mono">{m.id_num}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-6">
                                                            <span className="px-3 py-1 rounded-lg bg-base-200 text-[10px] font-bold uppercase tracking-widest border border-base-300">
                                                                {m.department?.name}
                                                            </span>
                                                        </td>
                                                        <td className="py-6 text-center">
                                                            <span className="text-lg font-bold text-secondary font-mono opacity-60">
                                                                {m.initial_credits ?? 0}
                                                            </span>
                                                        </td>
                                                        <td className="py-6 text-center">
                                                            <span className="text-xl font-bold text-warning font-mono">
                                                                {usedThisMonth}
                                                            </span>
                                                        </td>
                                                        <td className="py-6 text-center">
                                                            <span className="text-2xl font-black text-primary font-mono drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
                                                                {leftThisMonth}
                                                            </span>
                                                        </td>
                                                        <td className="py-6 px-8 text-right">
                                                            <button className="btn btn-ghost btn-sm btn-circle text-secondary hover:bg-secondary/20">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Settings View */}
                        {activeTab === 'settings' && (
                            <div className="p-12 max-w-2xl">
                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <h3 className="text-3xl font-black tracking-tight">Umbrella Configuration</h3>
                                        <p className="text-secondary-content text-sm">Define global inheritance rules and default allocations.</p>
                                    </div>
                                    <div className="surface-elevated p-10 space-y-10 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"></div>

                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="form-control w-full">
                                                    <label className="label">
                                                        <span className="label-text text-secondary-content uppercase tracking-widest text-[10px] font-black opacity-60">Configuration Name</span>
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            className="input input-bordered w-full bg-base-100 border-base-300 rounded-2xl h-14 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all pr-12"
                                                            value={tempSettingName}
                                                            onChange={e => setTempSettingName(e.target.value)}
                                                            placeholder="e.g. Default"
                                                        />
                                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 dropdown dropdown-end">
                                                            <label tabIndex={0} className="btn btn-ghost btn-sm btn-circle text-primary">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </label>
                                                            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-2xl bg-base-100 rounded-box w-52 border border-base-300 mt-2">
                                                                <li className="menu-title text-[10px] uppercase font-black tracking-widest opacity-50 px-4 py-2">Stored Configs</li>
                                                                {settings.map((s: any) => (
                                                                    <li key={s.id}>
                                                                        <button
                                                                            type="button"
                                                                            className="py-3 px-4 text-xs font-bold hover:bg-primary/10 hover:text-primary transition-all"
                                                                            onClick={() => {
                                                                                setTempSettingName(s.name === 'default-credits' ? 'Default' : s.name);
                                                                                setTempDefaultCredits(s.wfh_credits);
                                                                                (document.activeElement as HTMLElement)?.blur();
                                                                            }}
                                                                        >
                                                                            {s.name === 'default-credits' ? 'Default' : s.name} ({s.wfh_credits})
                                                                        </button>
                                                                    </li>
                                                                ))}
                                                                {settings.length === 0 && <li className="px-4 py-3 text-[10px] opacity-40 italic">No existing configs found.</li>}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="form-control w-full">
                                                    <label className="label">
                                                        <span className="label-text text-secondary-content uppercase tracking-widest text-[10px] font-black">Allocation Count</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        className="input input-bordered w-full bg-base-100 border-base-300 rounded-2xl h-14 text-lg font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                                        value={tempDefaultCredits}
                                                        onChange={e => setTempDefaultCredits(parseInt(e.target.value) || 0)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                                <button
                                                    onClick={handleUpdateDefaultCredits}
                                                    className={`btn btn-primary flex-1 rounded-2xl h-14 text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] ${isUpdatingDefault ? 'loading' : ''}`}
                                                    disabled={isUpdatingDefault}
                                                >
                                                    Update
                                                </button>
                                                <button
                                                    onClick={handleApplyTeamCredits}
                                                    className={`btn btn-outline btn-secondary border-2 flex-1 rounded-2xl h-14 text-sm font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] ${isUpdatingDefault ? 'loading' : ''}`}
                                                    disabled={isUpdatingDefault}
                                                >
                                                    Apply to Team
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex gap-5 p-6 rounded-[24px] bg-primary/5 border border-primary/10">
                                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-inner">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div className="flex flex-col justify-center">
                                                <p className="text-[11px] text-secondary-content leading-relaxed font-bold">
                                                    <span className="text-primary mr-1">○ UPDATE:</span> Restructures the allocation default for future personnel.
                                                </p>
                                                <p className="text-[11px] text-secondary-content leading-relaxed font-bold mt-1">
                                                    <span className="text-secondary mr-1">○ APPLY:</span> Executes a global reset for all currently managed identities.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals remain same as before */}
            {isAddMemberModalOpen && createPortal(
                <div className="modal modal-open backdrop-blur-md z-[9999]">
                    <div className="modal-box glass-panel !rounded-3xl p-6 md:p-10 bg-base-100/95 shadow-[0_32px_64px_rgba(0,0,0,0.4)] max-w-2xl w-[95%] border border-white/20">
                        <div className="mb-8">
                            <h3 className="text-2xl md:text-3xl font-black tracking-tight">Onboard Personnel</h3>
                            <p className="text-secondary-content text-sm mt-2">Initialize a new identity within your departmental cluster.</p>
                        </div>
                        <form onSubmit={handleAddMember} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="form-control md:col-span-2">
                                    <label className="label"><span className="label-text text-secondary-content uppercase tracking-widest text-[10px] font-black">Legal Name</span></label>
                                    <input type="text" className="input input-bordered w-full bg-base-200 rounded-xl h-14 font-bold focus:border-primary transition-all" placeholder="Full Name" value={newMember.name} onChange={e => setNewMember({ ...newMember, name: e.target.value })} required />
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text text-secondary-content uppercase tracking-widest text-[10px] font-black">Reference ID</span></label>
                                    <input type="text" className="input input-bordered w-full bg-base-200 rounded-xl font-mono h-14 font-bold focus:border-primary transition-all" placeholder="XXXX-XXXX" value={newMember.id_num} onChange={e => {
                                        const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
                                        setNewMember({ ...newMember, id_num: digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits });
                                    }} maxLength={9} required />
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text text-secondary-content uppercase tracking-widest text-[10px] font-black">Allocation</span></label>
                                    <input type="number" className="input input-bordered w-full bg-base-200 rounded-xl h-14 font-bold focus:border-primary transition-all" value={newMember.initial_credits} onChange={e => setNewMember({ ...newMember, initial_credits: parseInt(e.target.value) })} required />
                                </div>
                                <div className="form-control md:col-span-2">
                                    <label className="label"><span className="label-text text-secondary-content uppercase tracking-widest text-[10px] font-black">Department</span></label>
                                    <select className="select select-bordered w-full bg-base-200 rounded-xl h-14 font-bold focus:border-primary transition-all text-base-content" value={newMember.dept_id} onChange={e => setNewMember({ ...newMember, dept_id: e.target.value })} required>
                                        <option value="" disabled className="text-base-content/50">Select Department</option>
                                        {departments.map(d => (
                                            <option key={d.id} value={d.id} className="text-black bg-white">
                                                {d.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 pt-6">
                                <button type="button" className="btn btn-ghost flex-1 rounded-xl h-14 text-sm font-black uppercase tracking-widest order-2 sm:order-1" onClick={() => setAddMemberModalOpen(false)}>Abort</button>
                                <button type="submit" className="btn btn-primary flex-[2] rounded-xl h-14 text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/30 order-1 sm:order-2">Authorize</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

        </DashboardLayout>
    );
};

export default SupervisorDashboard;
