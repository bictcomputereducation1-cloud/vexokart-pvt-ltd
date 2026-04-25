import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { Profile } from './types';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and subscribe to auth changes
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id, session.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id, session.user);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, authUser?: User) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        setProfile(data);
        setLoading(false);
      } else {
        // If profile doesn't exist in 'users' table, create it
        // This handles cases where signup insert failed or third-party auth was used
        const name = authUser?.user_metadata?.name || authUser?.user_metadata?.full_name || 'Vexokart User';
        const email = authUser?.email || '';
        
        const { data: newProfile, error: insertError } = await supabase
          .from('users')
          .insert([{ 
            id: userId, 
            email, 
            name, 
            role: 'user' 
          }])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
          // Still set a temporary profile from auth data to avoid "Vexokart User" if we have metadata
          setProfile({
            id: userId,
            email,
            name,
            role: 'user',
            created_at: new Date().toISOString()
          });
        } else {
          setProfile(newProfile);
        }
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
