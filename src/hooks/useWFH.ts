import { useState, useEffect } from 'react';
import { wfhService } from '../supabaseService';
import { Department, Member, WFHRequest } from '../types/wfh';

export function useDepartments() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const data = await wfhService.getDepartments();
            setDepartments(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    return { departments, loading, error, refresh: fetchDepartments };
}

export function useTeamMembers(supervisorId: string | undefined) {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMembers = async () => {
        if (!supervisorId) return;
        try {
            setLoading(true);
            const data = await wfhService.getTeamMembers(supervisorId);
            setMembers(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, [supervisorId]);

    return { members, loading, error, refresh: fetchMembers };
}

export function useTeamRequests(supervisorId: string | undefined) {
    const [requests, setRequests] = useState<WFHRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRequests = async () => {
        if (!supervisorId) return;
        try {
            setLoading(true);
            const data = await wfhService.getTeamRequests(supervisorId);
            setRequests(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [supervisorId]);

    return { requests, loading, error, refresh: fetchRequests };
}

export function useMemberPortal() {
    const [member, setMember] = useState<Member | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const verify = async (name: string, id_num: string) => {
        try {
            setLoading(true);
            setError(null);
            const data = await wfhService.verifyMember(name, id_num);
            setMember(data);
            return data;
        } catch (err: any) {
            setError(err.message);
            setMember(null);
        } finally {
            setLoading(false);
        }
    };

    const submitRequest = async (date: string) => {
        if (!member) return;
        try {
            setLoading(true);
            await wfhService.submitWFHRequest(member.id, date);
            // Refresh member data to update credits if necessary (though credits only update on approval)
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { member, loading, error, verify, submitRequest };
}

export function useSupervisorSettings(supervisorId: string | undefined) {
    const [settings, setSettings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSettings = async () => {
        if (!supervisorId) return;
        try {
            setLoading(true);
            const data = await wfhService.getSettings(supervisorId);
            setSettings(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, [supervisorId]);

    const updateDefaultCredits = async (name: string, wfh_credits: number) => {
        if (!supervisorId) return;
        const dbName = name.toLowerCase() === 'default' ? 'default-credits' : name;
        try {
            await wfhService.upsertSetting({
                name: dbName,
                wfh_credits,
                supervisor_id: supervisorId
            });
            await fetchSettings();
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const applyTeamCredits = async (wfh_credits: number) => {
        if (!supervisorId) return;
        try {
            await wfhService.setTeamCredits(wfh_credits, supervisorId);
            await fetchSettings();
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const defaultCredits = settings.find(s => s.name === 'default-credits')?.wfh_credits ?? 0;

    return {
        settings,
        defaultCredits,
        loading,
        error,
        refresh: fetchSettings,
        updateDefaultCredits,
        applyTeamCredits
    };
}

export function useRequestPortal() {
    const [member, setMember] = useState<{ id: string; name: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const verify = async (dept_id: string, supervisor_id: string, id_num: string) => {
        try {
            setLoading(true);
            setError(null);
            const data = await wfhService.verifyMemberPortal({ dept_id, supervisor_id, id_num });
            setMember(data);
            return data;
        } catch (err: any) {
            setError(err.message);
            setMember(null);
        } finally {
            setLoading(false);
        }
    };

    const submitRequest = async (memberId: string, date: string) => {
        try {
            setLoading(true);
            setError(null);
            await wfhService.submitRequestPortal(memberId, date);
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { member, loading, error, verify, submitRequest, reset: () => setMember(null) };
}
