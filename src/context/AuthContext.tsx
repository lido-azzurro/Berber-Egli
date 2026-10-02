import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, type Profile } from '@/lib/supabase';

type AuthContextType = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (details: { email: string; password: string; fullName: string; phone: string }) => Promise<{ error: string | null }>;
  sendPasswordReset: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<Profile | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function loadProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  return data as Profile | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session) setProfile(await loadProfile(data.session.user.id));
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) {
        setProfile(null);
        return;
      }
      void (async () => {
        const nextProfile = await loadProfile(newSession.user.id);
        if (mounted) setProfile(nextProfile);
      })();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return { error: error ? 'Email ose fjalëkalim i pasaktë.' : null };
  };

  const signUp = async ({ email, password, fullName, phone }: { email: string; password: string; fullName: string; phone: string }) => {
    if (password.length < 10 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      return { error: 'Fjalëkalimi duhet të ketë të paktën 10 karaktere, shkronja të mëdha e të vogla, numër dhe simbol.' };
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim(), phone: phone.trim() } },
    });
    if (error || !data.user) {
      if (error?.code === 'weak_password') return { error: 'Ky fjalëkalim është në listën e fjalëkalimeve të komprometuara. Zgjidhni një fjalëkalim tjetër unik.' };
      if (error?.code === 'email_exists' || error?.message.toLowerCase().includes('already registered')) return { error: 'Ky email ka tashmë një llogari. Provoni të hyni ose përdorni një email tjetër.' };
      if (error?.code === 'invalid_email') return { error: 'Vendosni një adresë emaili të vlefshme.' };
      return { error: 'Regjistrimi nuk u krye. Kontrolloni të dhënat dhe provoni përsëri.' };
    }
    if (data.session) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName.trim(),
        phone: phone.trim(),
        role: 'customer',
      });
      if (profileError) return { error: 'Profili nuk u krijua. Provoni përsëri.' };
      setProfile(await loadProfile(data.user.id));
    }
    return { error: null };
  };

  const sendPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });
    return { error: error ? 'Nuk mund të dërgohej lidhja e rikuperimit.' : null };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error ? 'Fjalëkalimi nuk u ndryshua.' : null };
  };

  const refreshProfile = async () => {
    if (!session) return null;
    const nextProfile = await loadProfile(session.user.id);
    setProfile(nextProfile);
    return nextProfile;
  };

  const signOut = () => supabase.auth.signOut().then(() => {
    setSession(null);
    setProfile(null);
  });

  return (
    <AuthContext.Provider value={{ session, profile, loading, signIn, signUp, sendPasswordReset, updatePassword, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
