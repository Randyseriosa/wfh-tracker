import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { authService, wfhService, profileService } from '../../supabaseService';

const Login: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const isRegistering = location.pathname === '/register';
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [departments, setDepartments] = useState<{ id: string, name: string }[]>([]);
    const [supervisors, setSupervisors] = useState<{ id: string, name: string, dept_id?: string }[]>([]);

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        name: '',
        role: 'member',
        code: '',
        dept_id: '',
        supervisor_id: '',
        id_num: ''
    });

    React.useEffect(() => {
        if (isRegistering) {
            const fetchData = async () => {
                try {
                    const depts = await wfhService.getDepartments();
                    const sups = await profileService.getSupervisors();
                    setDepartments(depts);
                    setSupervisors(sups);
                } catch (err) {
                    console.error('Error fetching data:', err);
                }
            };
            fetchData();
        }
    }, [isRegistering]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        let newValue = value;
        if (name === 'id_num') {
            // Remove all non-digits and limit to 8
            const digits = value.replace(/\D/g, '').slice(0, 8);
            // Format as XXXX-XXXX
            if (digits.length <= 4) {
                newValue = digits;
            } else {
                newValue = `${digits.slice(0, 4)}-${digits.slice(4)}`;
            }
        }

        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }));
        if (error) setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isRegistering) {
                if (formData.password !== formData.confirmPassword) {
                    throw new Error('Passwords do not match');
                }

                // Basic validation for new fields
                if (formData.role === 'supervisor' && !formData.dept_id) {
                    throw new Error('Please select a department');
                }
                if (formData.role === 'member') {
                    if (!formData.dept_id) throw new Error('Please select a department');
                    if (!formData.supervisor_id) throw new Error('Please select a supervisor');
                    if (!formData.id_num) throw new Error('Please enter your ID number');
                    if (!/^\d{4}-\d{4}$/.test(formData.id_num)) {
                        throw new Error('ID Number must be in XXXX-XXXX format');
                    }
                }

                await authService.register(formData);
                // After successful registration, redirect to login
                alert('Registration successful! Please log in.');
                navigate('/login');
            } else {
                await authService.login(formData.username, formData.password);
                navigate('/'); // Redirect to dashboard
            }
        } catch (err: any) {
            console.error('Auth error:', err);
            setError(err.message || 'An error occurred during authentication');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-6 relative overflow-hidden">
            <div className="gradient-shell w-full max-w-xl">
                <div className="surface-elevated p-10 md:p-14 relative z-10">
                    <div className="flex flex-col gap-8">
                        <div className="space-y-2">
                            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                {isRegistering ? 'Create Account' : 'Welcome Back'}
                            </h1>
                            <p className="text-secondary-content text-sm">
                                {isRegistering ? 'Join the WFH Portal ecosystem' : 'Access your hybrid workspace dashboard'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {isRegistering && (
                                    <>
                                        <div className="form-control md:col-span-2">
                                            <label className="label">
                                                <span className="label-text text-secondary-content uppercase tracking-widest text-[10px] font-bold">Role</span>
                                            </label>
                                            <select
                                                name="role"
                                                className="select select-bordered w-full bg-base-200 border-base-300 rounded-xl"
                                                value={formData.role}
                                                onChange={handleChange}
                                            >
                                                <option value="member">Team Member</option>
                                                <option value="supervisor">Supervisor</option>
                                                <option value="admin">Administrator</option>
                                            </select>
                                        </div>

                                        {(formData.role === 'member' || formData.role === 'supervisor') && (
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text text-secondary-content uppercase tracking-widest text-[10px] font-bold">Department</span>
                                                </label>
                                                <select
                                                    name="dept_id"
                                                    className="select select-bordered w-full bg-base-200 border-base-300 rounded-xl"
                                                    value={formData.dept_id}
                                                    onChange={handleChange}
                                                    required
                                                >
                                                    <option value="">Select Department</option>
                                                    {departments.map(dept => (
                                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {formData.role === 'member' && (
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text text-secondary-content uppercase tracking-widest text-[10px] font-bold">Supervisor</span>
                                                </label>
                                                <select
                                                    name="supervisor_id"
                                                    className="select select-bordered w-full bg-base-200 border-base-300 rounded-xl"
                                                    value={formData.supervisor_id}
                                                    onChange={handleChange}
                                                    required
                                                    disabled={!formData.dept_id}
                                                >
                                                    <option value="">Select Supervisor</option>
                                                    {supervisors
                                                        .filter(sup => !formData.dept_id || sup.dept_id === formData.dept_id)
                                                        .map(sup => (
                                                            <option key={sup.id} value={sup.id}>{sup.name}</option>
                                                        ))}
                                                </select>
                                            </div>
                                        )}

                                        <div className="form-control md:col-span-2">
                                            <label className="label">
                                                <span className="label-text text-secondary-content uppercase tracking-widest text-[10px] font-bold">Full Name</span>
                                            </label>
                                            <input
                                                name="name"
                                                className="input input-bordered w-full bg-base-200 border-base-300 rounded-xl"
                                                placeholder="John Doe"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        {formData.role === 'member' && (
                                            <div className="form-control md:col-span-2">
                                                <label className="label">
                                                    <span className="label-text text-secondary-content uppercase tracking-widest text-[10px] font-bold">ID Number</span>
                                                </label>
                                                <input
                                                    name="id_num"
                                                    className="input input-bordered w-full bg-base-200 border-base-300 rounded-xl font-mono"
                                                    placeholder="XXXX-XXXX"
                                                    value={formData.id_num}
                                                    onChange={handleChange}
                                                    maxLength={9}
                                                    required
                                                />
                                            </div>
                                        )}
                                    </>
                                )}

                                <div className="form-control md:col-span-2">
                                    <label className="label">
                                        <span className="label-text text-secondary-content uppercase tracking-widest text-[10px] font-bold">Username</span>
                                    </label>
                                    <input
                                        name="username"
                                        className={`input input-bordered w-full bg-base-200 border-base-300 rounded-xl ${error && error.includes('Username') ? 'border-error' : ''}`}
                                        placeholder="user_123"
                                        value={formData.username}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-control md:col-span-2">
                                    <label className="label">
                                        <span className="label-text text-secondary-content uppercase tracking-widest text-[10px] font-bold">Password</span>
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        className="input input-bordered w-full bg-base-200 border-base-300 rounded-xl"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                {isRegistering && (
                                    <>
                                        <div className="form-control md:col-span-2">
                                            <label className="label">
                                                <span className="label-text text-secondary-content uppercase tracking-widest text-[10px] font-bold">Confirm Password</span>
                                            </label>
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                className={`input input-bordered w-full bg-base-200 border-base-300 rounded-xl ${error === 'Passwords do not match' ? 'border-error' : ''}`}
                                                placeholder="••••••••"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        <div className="form-control md:col-span-2">
                                            <label className="label">
                                                <span className="label-text text-secondary-content uppercase tracking-widest text-[10px] font-bold">Invitation Code</span>
                                            </label>
                                            <input
                                                name="code"
                                                className="input input-bordered w-full bg-base-200 border-base-300 rounded-xl"
                                                placeholder="Secure Entry Code"
                                                value={formData.code}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            {error && !error.includes('Username') && !error.includes('Passwords') && (
                                <div className="text-error text-xs p-3 bg-error/10 rounded-lg border border-error/20">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className={`btn-primary-custom w-full h-14 text-sm uppercase tracking-widest font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98] ${loading ? 'opacity-50' : ''}`}
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : (isRegistering ? 'Initialize Account' : 'Authenticate')}
                            </button>
                        </form>

                        <div className="pt-6 border-t border-white/5 text-center">
                            <span className="text-secondary-content text-xs">
                                {isRegistering ? (
                                    <>
                                        Already institutionalized?{' '}
                                        <Link to="/login" className="text-primary hover:underline font-bold">Log in</Link>
                                    </>
                                ) : (
                                    <>
                                        New to the system?{' '}
                                        <Link to="/register" className="text-primary hover:underline font-bold">Create Credentials</Link>
                                    </>
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
