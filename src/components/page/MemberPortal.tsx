import React, { useState } from 'react';
import { useMemberPortal } from '../../hooks/useWFH';
import { useLoading } from '../../context/LoadingContext';

const MemberPortal = () => {
    const [name, setName] = useState('');
    const [idNum, setIdNum] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const { member, loading, error, verify, submitRequest } = useMemberPortal();
    const { showLoading, hideLoading } = useLoading();
    const [successMsg, setSuccessMsg] = useState('');

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        showLoading();
        await verify(name, idNum);
        hideLoading();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDate) return;
        showLoading();
        const success = await submitRequest(selectedDate);
        hideLoading();
        if (success) {
            setSuccessMsg('WFH Request submitted successfully!');
            setSelectedDate('');
            setTimeout(() => setSuccessMsg(''), 5000);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
            <div className="gradient-shell w-full max-w-xl">
                <div className="surface-elevated p-10 md:p-14 relative z-10">
                    <div className="flex flex-col gap-8">
                        <div className="space-y-2">
                            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                Member Portal
                            </h1>
                            <p className="text-secondary-content text-sm">Submit your Work From Home request securely.</p>
                        </div>

                        {!member ? (
                            <form onSubmit={handleVerify} className="space-y-6">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text text-secondary-content uppercase tracking-widest text-[10px] font-bold">Full Identity</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Full Name as registered"
                                        className="input input-bordered w-full bg-base-200 border-base-300 rounded-xl focus:border-primary transition-all"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
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
                                    className={`btn-primary-custom w-full h-14 text-sm uppercase tracking-widest font-bold shadow-lg shadow-primary/20 transition-all ${loading ? 'opacity-50' : ''}`}
                                >
                                    Verify Access
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="surface-elevated-sm p-8 flex flex-col gap-4">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <h2 className="text-2xl font-bold text-base-content leading-none">{member.name}</h2>
                                            <p className="text-secondary-content text-xs uppercase tracking-wider font-semibold">{member.department?.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-primary text-3xl font-bold font-mono">{member.credits?.wfh_credits ?? 0}</div>
                                            <div className="text-[10px] text-secondary-content uppercase font-bold tracking-widest">Available Credits</div>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text text-secondary-content uppercase tracking-widest text-[10px] font-bold">WFH Provisioning Date</span>
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
                                        className={`btn-primary-custom w-full h-14 text-sm uppercase tracking-widest font-bold shadow-lg shadow-primary/20 transition-all ${loading ? 'opacity-50' : ''}`}
                                        disabled={loading || (member.credits?.wfh_credits ?? 0) <= 0}
                                    >
                                        {(member.credits?.wfh_credits ?? 0) <= 0 ? 'Allocation Exhausted' : 'Initialize WFH Request'}
                                    </button>

                                    <button
                                        type="button"
                                        className="text-secondary-content hover:text-primary text-xs uppercase tracking-widest font-bold w-full pt-4 transition-colors"
                                        onClick={() => {
                                            window.location.reload();
                                        }}
                                    >
                                        Switch Ecosystem Profile
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

export default MemberPortal;
