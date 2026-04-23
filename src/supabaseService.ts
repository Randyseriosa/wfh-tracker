import { createClient } from '@supabase/supabase-js';
import { UserRole, Profile, Code } from './types/wfh';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are missing. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const profileService = {
    async getProfile(userId: string) {
        const { data, error } = await supabase
            .from('profile')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data as Profile;
    },

    async getTeamBySupervisor(supervisorId: string) {
        // This would require a supervisor_members table or similar
        // For now, returning empty or placeholder if needed
        return [];
    },

    async getSupervisors() {
        const { data, error } = await supabase
            .from('profile')
            .select('id, name, dept_id')
            .eq('role', 'supervisor');

        if (error) throw error;
        return data;
    }
};

export const codeService = {
    async getLatestCode() {
        const { data, error } = await supabase
            .from('code')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) throw error;
        return data as Code;
    }
};

export const authService = {
    async register(formData: any) {
        const { data, error } = await supabase.functions.invoke('register', {
            body: formData
        });

        if (error) {
            let errorMessage = error.message;
            if (error.context && typeof error.context.json === 'function') {
                try {
                    const body = await error.context.json();
                    if (body && body.error) {
                        errorMessage = body.error;
                    }
                } catch (e) {
                    // Fallback to original error message
                }
            }
            throw new Error(errorMessage);
        }
        return data;
    },

    async login(username: string, password: string) {
        // Since we use username@wfh.tracker internally
        const email = `${username.trim()}@wfh.tracker`.toLowerCase();
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        return data;
    },

    async logout() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    }
};

export const wfhService = {
    // Departments
    async getDepartments() {
        const { data, error } = await supabase.from('department').select('*');
        if (error) throw error;
        return data;
    },

    async addDepartment(name: string) {
        const { data, error } = await supabase.functions.invoke('wfh-operations', {
            body: { action: 'add_department', payload: { name } }
        });
        if (error) throw error;
        return data;
    },

    // Members
    async getTeamMembers(supervisorId: string) {
        const { data, error } = await supabase
            .from('members')
            .select(`
                *,
                initial_credits,
                department:dept_id(name),
                credits:credits(wfh_credits)
            `)
            .eq('supervisor_id', supervisorId);
        if (error) throw error;
        return data;
    },

    async addMember(payload: { id_num: string; name: string; dept_id: string; supervisor_id: string; initial_credits: number }) {
        const { data, error } = await supabase.functions.invoke('wfh-operations', {
            body: { action: 'add_member', payload }
        });
        if (error) throw error;
        return data;
    },

    // Requests
    async getTeamRequests(supervisorId: string) {
        const { data, error } = await supabase
            .from('wfhrequest')
            .select(`
                *,
                member:member_id!inner(
                    name, 
                    id_num, 
                    supervisor_id,
                    department:dept_id(name)
                )
            `)
            .eq('member.supervisor_id', supervisorId);

        if (error) throw error;
        return data as any[];
    },

    async approveRequest(requestId: string) {
        const { data, error } = await supabase.functions.invoke('wfh-operations', {
            body: { action: 'approve_wfh_request', payload: { request_id: requestId } }
        });
        if (error) throw error;
        return data;
    },

    async denyRequest(requestId: string) {
        const { data, error } = await supabase.functions.invoke('wfh-operations', {
            body: { action: 'deny_wfh_request', payload: { request_id: requestId } }
        });
        if (error) throw error;
        return data;
    },

    async revertRequest(requestId: string) {
        const { data, error } = await supabase.functions.invoke('wfh-operations', {
            body: { action: 'revert_wfh_request', payload: { request_id: requestId } }
        });
        if (error) throw error;
        return data;
    },

    // Member Portal (Login-free)
    async verifyMember(name: string, id_num: string) {
        const { data, error } = await supabase.functions.invoke('member-portal', {
            body: { action: 'verify_member', payload: { name, id_num } }
        });
        if (error) throw error;
        return data;
    },

    async submitWFHRequest(memberId: string, date: string) {
        const { data, error } = await supabase.functions.invoke('member-portal', {
            body: { action: 'submit_wfh_request', payload: { member_id: memberId, date } }
        });
        if (error) throw error;
        return data;
    },

    // Settings
    async getSettings(supervisorId: string) {
        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .eq('supervisor_id', supervisorId);
        if (error) throw error;
        return data;
    },

    async upsertSetting(payload: { name: string; wfh_credits: number; supervisor_id: string }) {
        const { data, error } = await supabase.functions.invoke('wfh-operations', {
            body: { action: 'upsert_setting', payload }
        });
        if (error) throw error;
        return data;
    },

    async setTeamCredits(wfh_credits: number, supervisor_id: string) {
        const { data, error } = await supabase.functions.invoke('wfh-operations', {
            body: { action: 'set_team_credits', payload: { wfh_credits, supervisor_id } }
        });
        if (error) throw error;
        return data;
    },

    // Request Portal
    async verifyMemberPortal(payload: { dept_id: string; supervisor_id: string; id_num: string }) {
        const { data, error } = await supabase.functions.invoke('request-portal', {
            body: { action: 'verify_member', payload }
        });
        if (error) {
            let errorMessage = error.message;
            if (error.context && typeof error.context.json === 'function') {
                try {
                    const body = await error.context.json();
                    if (body && body.error) {
                        errorMessage = body.error;
                    }
                } catch (e) { }
            }
            throw new Error(errorMessage);
        }
        return data as { id: string; name: string };
    },

    async submitRequestPortal(member_id: string, date: string) {
        const { data, error } = await supabase.functions.invoke('request-portal', {
            body: { action: 'submit_request', payload: { member_id, date } }
        });
        if (error) {
            let errorMessage = error.message;
            if (error.context && typeof error.context.json === 'function') {
                try {
                    const body = await error.context.json();
                    if (body && body.error) {
                        errorMessage = body.error;
                    }
                } catch (e) { }
            }
            throw new Error(errorMessage);
        }
        return data;
    }
};
