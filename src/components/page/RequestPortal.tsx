import React, { useState, useEffect } from 'react';
import { useDepartments, useRequestPortal } from '../../hooks/useWFH';
import { profileService } from '../../supabaseService';

const RequestPortal = () => {
    const { departments, loading: deptsLoading } = useDepartments();
    const { member, loading: portalLoading, error, verify, submitRequest, reset } = useRequestPortal();

    const [selectedDept, setSelectedDept] = useState('');
    const [selectedSupervisor, setSelectedSupervisor] = useState('');
    const [idNum, setIdNum] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [supervisors, setSupervisors] = useState<any[]>([]);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        const fetchSupervisors = async () => {
            try {
                const data = await profileService.getSupervisors();
                setSupervisors(data);
            } catch (err) {
                console.error('Failed to fetch supervisors', err);
            }
        };
        fetchSupervisors();
    }, []);

    const filteredSupervisors = selectedDept
        ? supervisors.filter(s => s.dept_id === selectedDept)
        : [];

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDept || !selectedSupervisor || !idNum) return;
        await verify(selectedDept, selectedSupervisor, idNum);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!member || !selectedDate) return;
        const success = await submitRequest(member.id, selectedDate);
        if (success) {
            setSuccessMsg('WFH Request submitted successfully! Your supervisor will review it shortly.');
            setSelectedDate('');
            setTimeout(() => {
                setSuccessMsg('');
                reset();
                setIdNum('');
            }, 5000);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
            <div className="gradient-shell w-full max-w-xl">
                <div className="surface-elevated p-10 md:p-14 relative z-10">
                    <div className="flex flex-col gap-8">
                        <div className="space-y-2">
                            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                Request Portal
                            </h1>
                            <p className="text-secondary-content text-sm">Submit your Work From Home request quickly.</p>
                        </div>

                        {!member ? (
                            <form onSubmit={handleVerify} className="space-y-6">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text text-secondary-content uppercase tracking-widest text-[10px] font-bold">Department</span>
                                    </label>
                                    <select
                                        className="select select-bordered w-full bg-base-200 border-base-300 rounded-xl focus:border-primary transition-all"
                                        value={selectedDept}
                                        onChange={(e) => {
                                            setSelectedDept(e.target.value);
                                            setSelectedSupervisor('');
                                        }}
                                        required
                                    >
                                        <option value="" disabled>Select Department</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text text-secondary-content uppercase tracking-widest text-[10px] font-bold">Supervisor</span>
                                    </label>
                                    <select
                                        className="select select-bordered w-full bg-base-200 border-base-300 rounded-xl focus:border-primary transition-all"
                                        value={selectedSupervisor}
                                        onChange={(e) => setSelectedSupervisor(e.target.value)}
                                        disabled={!selectedDept}
                                        required
                                    >
                                        <option value="" disabled>Select Supervisor</option>
                                        {filteredSupervisors.map(sup => (
                                            <option key={sup.id} value={sup.id}>{sup.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text text-secondary-content uppercase tracking-widest text-[10px] font-bold">Reference ID</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="XXXX-XXXX"
                                        className="input input-bordered w-full bg-base-200 border-base-300 rounded-xl focus:border-primary transition-all font-mono"
                                        value={idNum}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            const digits = value.replace(/\D/g, '').slice(0, 8);
                                            let newValue = digits;
                                            if (digits.length > 4) {
                                                newValue = `${digits.slice(0, 4)}-${digits.slice(4)}`;
                                            }
                                            setIdNum(newValue);
                                        }}
                                        maxLength={9}
                                        required
                                    />
                                </div>

                                {error && (
                                    <div className="text-error text-xs p-3 bg-error/10 rounded-lg border border-error/20">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className={`btn-primary-custom w-full h-14 text-sm uppercase tracking-widest font-bold shadow-lg shadow-primary/20 transition-all ${portalLoading ? 'opacity-50' : ''}`}
                                    disabled={portalLoading}
                                >
                                    {portalLoading ? <span className="loading loading-spinner"></span> : 'Verify Identity'}
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="surface-elevated-sm p-8 flex flex-col gap-4">
                                    <div className="space-y-1">
                                        <div className="text-[10px] text-secondary-content uppercase font-bold tracking-widest">Identified Member</div>
                                        <h2 className="text-2xl font-bold text-base-content leading-none">{member.name}</h2>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text text-secondary-content uppercase tracking-widest text-[10px] font-bold">WFH Request Date</span>
                                        </label>
                                        <input
                                            type="date"
                                            className="input input-bordered w-full bg-base-200 border-base-300 rounded-xl focus:border-primary transition-all font-mono"
                                            value={selectedDate}
                                            min={new Date().toISOString().split('T')[0]}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            required
                                        />
                                    </div>

                                    {successMsg && (
                                        <div className="text-success text-xs p-4 bg-success/10 rounded-lg border border-success/20 text-center font-medium">
                                            {successMsg}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className={`btn-primary-custom w-full h-14 text-sm uppercase tracking-widest font-bold shadow-lg shadow-primary/20 transition-all ${portalLoading ? 'opacity-50' : ''}`}
                                        disabled={portalLoading}
                                    >
                                        {portalLoading ? <span className="loading loading-spinner"></span> : 'Submit WFH Request'}
                                    </button>

                                    <button
                                        type="button"
                                        className="text-secondary-content hover:text-primary text-xs uppercase tracking-widest font-bold w-full pt-4 transition-colors"
                                        onClick={reset}
                                    >
                                        Change Identity
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequestPortal;
