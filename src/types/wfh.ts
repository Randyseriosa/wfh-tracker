export type UserRole = 'admin' | 'supervisor' | 'member';

export type ShiftType =
    | 'morning'
    | 'afternoon'
    | 'night'
    | 'custom-morning'
    | 'custom-afternoon'
    | 'custom-night';

export type SettingType = 'default' | 'custom';

export interface Profile {
    id: string;
    name: string;
    username: string;
    role: UserRole;
    dept_id?: string;
    created_at: string;
    updated_at: string;
}

export interface Code {
    id: string;
    codex: string;
    created_at: string;
}

export interface Department {
    id: string;
    name: string;
    created_at: string;
}

export interface Member {
    id: string;
    id_num: string;
    name: string;
    dept_id: string;
    supervisor_id: string;
    initial_credits: number;
    created_at: string;
    department?: { name: string };
    credits?: { wfh_credits: number };
}

export interface WFHRequest {
    id: string;
    member_id: string;
    date_requested: string;
    date_approved?: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    member?: Member;
}

export interface Settings {
    id: string;
    name: string;
    date: string;
    wfh_credits: number;
    supervisor_id?: string;
    created_at: string;
}

export interface Credits {
    member_id: string;
    date: string;
    wfh_credits: number;
    updated_at: string;
}
