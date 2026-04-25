import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, profileService } from '../supabaseService';
import { Profile } from '../types/wfh';
import { useLoading } from './LoadingContext';

interface AuthContextType {
    user: any;
    profile: Profile | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const { showLoading, hideLoading } = useLoading();

    const fetchProfile = async (userId: string) => {
        setLoading(true);
        showLoading();
        setProfile(null);
        try {
            const data = await profileService.getProfile(userId);
            setProfile(data);
        } catch (error: any) {
            console.error('Error fetching profile:', error);
            setProfile(null);

            if (error.code === 'PGRST301' || error.code === 'PGRST303' || error.code === 'PGRST116' || error.status === 401) {
                console.warn('Stale session detected, signing out...');
                await supabase.auth.signOut();
                setUser(null);
            }
        } finally {
            setLoading(false);
            hideLoading();
        }
    };

    useEffect(() => {
        showLoading();
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            const initialUser = session?.user ?? null;
            setUser(initialUser);
            if (initialUser) {
                fetchProfile(initialUser.id);
            } else {
                setLoading(false);
                hideLoading();
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            const newUser = session?.user ?? null;

            if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                setLoading(true);
                showLoading();
                setUser(newUser);
                if (newUser) {
                    fetchProfile(newUser.id);
                }
            } else if (event === 'SIGNED_OUT') {
                showLoading();
                setUser(null);
                setProfile(null);
                setLoading(false);
                // Artificial delay to show logout smooth transition
                setTimeout(() => hideLoading(), 500);
            } else if (event === 'TOKEN_REFRESHED') {
                setUser(newUser);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, profile, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
};
