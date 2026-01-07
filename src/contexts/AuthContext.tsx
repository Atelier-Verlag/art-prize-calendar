import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isProUser: boolean;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  startCheckout: (priceId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isProUser, setIsProUser] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadProfile = async (userId: string) => {
    console.log('[Auth] Loading permissions for user:', userId);

    try {
      // 1) Load profile for is_pro_user flag (NOT roles)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_pro_user')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('[Auth] Error loading profile:', profileError);
      } else {
        console.log('[Auth] Profile loaded:', profile);
        setIsProUser(profile?.is_pro_user ?? false);
      }

      // 2) Admin check: source of truth is user_roles via SECURITY DEFINER function
      const { data: isAdminResult, error: isAdminError } = await supabase.rpc('is_admin', {
        _user_id: userId,
      });

      if (isAdminError) {
        console.error('[Auth] Error checking admin role (rpc is_admin):', isAdminError);
        setIsAdmin(false);
      } else {
        const admin = Boolean(isAdminResult);
        console.log('[Auth] Admin via rpc is_admin:', admin);
        setIsAdmin(admin);
      }
    } catch (err) {
      console.error('[Auth] Error loading permissions:', err);
      setIsProUser(false);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Keep loading=true until permissions are loaded
        setLoading(true);
        setTimeout(async () => {
          await loadProfile(session.user.id);
          setLoading(false);
        }, 0);
      } else {
        setIsProUser(false);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setLoading(true);
        await loadProfile(session.user.id);
        setLoading(false);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsProUser(false);
    setIsAdmin(false);
  };

  const startCheckout = async (priceId: string) => {
    if (!session) {
      toast({
        title: 'Anmeldung erforderlich',
        description: 'Bitte melden Sie sich an, um fortzufahren.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast({
        title: 'Fehler',
        description: 'Checkout konnte nicht gestartet werden.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isProUser,
        isAdmin,
        loading,
        signIn,
        signUp,
        signOut,
        startCheckout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
