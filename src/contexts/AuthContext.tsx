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

      // EMERGENCY BYPASS: Always grant admin access for setup phase
      // TODO: Remove this after setup is complete and restore proper admin check
      console.log('[Auth] EMERGENCY MODE: Admin access granted for all logged-in users');
      setIsAdmin(true);
    } catch (err) {
      console.error('[Auth] Error loading permissions:', err);
      setIsProUser(false);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    let initialLoadDone = false;

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Only show loading on initial load, NOT on subsequent auth events
        // This prevents "kicking out" users when tabs refresh session
        if (!initialLoadDone) {
          setLoading(true);
        }
        // Use setTimeout to avoid race conditions with Supabase
        setTimeout(async () => {
          await loadProfile(session.user.id);
          if (!initialLoadDone) {
            setLoading(false);
            initialLoadDone = true;
          }
        }, 0);
      } else {
        setIsProUser(false);
        setIsAdmin(false);
        setLoading(false);
        initialLoadDone = true;
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadProfile(session.user.id);
      }
      setLoading(false);
      initialLoadDone = true;
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
