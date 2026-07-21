import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from './lib/supabase';
import { Profile } from './types';
import { User } from '@supabase/supabase-js';
import { apiCache } from './lib/apiCache';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: string | null;
  loading: boolean;
  isLoadingAuth: boolean;
  isAdmin: boolean;
  isVendor: boolean;
  isDelivery: boolean;
  isCustomer: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setSessionAndProfile: (user: User, profile: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Helper to fetch user profiles with caching and deduplication
  const fetchProfileDirect = async (userId: string, force = false): Promise<Profile | null> => {
    try {
      console.log(`[AuthContext] Querying public.users. Fetching UUID: ${userId}`);
      return await apiCache.fetchOnce<Profile | null>(`profile_${userId}`, async () => {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (error) {
          console.error("[AuthContext] Error retrieving user profile from public.users:", error.message);
          return null;
        }
        
        return data as Profile;
      }, { forceRefetch: force });
    } catch (err) {
      console.error("[AuthContext] Exception while retrieving user profile from public.users:", err);
      return null;
    }
  };

  useEffect(() => {
    let active = true;
    let subscription: any = null;

    const initializeAuth = async () => {
      setLoading(true);
      try {
        console.log("[AuthContext] Setting up initial session and profile...");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("[AuthContext] getSession returned an auth error:", error);
        }

        if (!active) return;

        const session = data?.session;
        console.log("Session Loaded");

        if (session?.user) {
          setUser(session.user);
          const dbProfile = await fetchProfileDirect(session.user.id);
          if (active) {
            setProfile(dbProfile);
            console.log("Profile Loaded");
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error("[AuthContext] Exception caught during setupAuthAndProfile:", err);
      } finally {
        if (active) {
          console.log("Loading False");
          setLoading(false);
        }
      }

      // ONLY set up the auth state listener AFTER getting the initial session,
      // and guard it so it doesn't query the profile if the session user is the same.
      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log(`[AuthContext] onAuthStateChange Detected Event: "${event}"`);
        if (!active) return;

        try {
          if (session?.user) {
            setUser(prevUser => {
              if (prevUser?.id === session.user.id) {
                // No change, return same user
                return prevUser;
              }
              
              // Only load profile if user is different
              setLoading(true);
              fetchProfileDirect(session.user.id).then((dbProfile) => {
                if (active) {
                  setProfile(dbProfile);
                  console.log("Profile Loaded");
                  console.log("Loading False");
                  setLoading(false);
                }
              });
              
              return session.user;
            });
          } else {
            setUser(null);
            setProfile(null);
            console.log("Loading False");
            setLoading(false);
          }
        } catch (err) {
          console.error("[AuthContext] Exception in onAuthStateChange:", err);
          if (active) {
            console.log("Loading False");
            setLoading(false);
          }
        }
      });
      subscription = sub;
    };

    initializeAuth();

    return () => {
      active = false;
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

  const refreshProfile = async () => {
    if (user) {
      setLoading(true);
      try {
        const fresh = await fetchProfileDirect(user.id, true);
        setProfile(fresh);
        console.log("Database Profile (Refresh):", fresh);
        console.log("Database Role (Refresh):", fresh?.role || null);
      } catch (err) {
        console.error("[AuthContext] Failed to refresh profile:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const signOut = async () => {
    console.log("[AuthContext] SignOut requested. Clearing all stored credentials and context.");
    apiCache.clearAll();
    setUser(null);
    setProfile(null);
    setLoading(false);
    
    // Clear all localStorage and sessionStorage caches
    try {
      localStorage.clear();
      sessionStorage.clear();
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Supabase auth signOut failed, ignored:", e);
    }
  };

  const setSessionAndProfile = (newUser: User, newProfile: any) => {
    console.log("[AuthContext] Direct synchronous state update for User ID:", newUser.id);
    setUser(newUser);
    setProfile(newProfile);
    console.log("Database Profile:", newProfile);
    console.log("Database Role:", newProfile?.role || null);
  };

  const role = profile?.role || null;
  const isAdmin = role === 'admin';
  const isVendor = role === 'vendor';
  const isDelivery = role === 'delivery';
  const isCustomer = role === 'customer' || role === 'user';

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      role,
      loading, 
      isLoadingAuth: loading, 
      isAdmin, 
      isVendor, 
      isDelivery, 
      isCustomer, 
      signOut,
      refreshProfile,
      setSessionAndProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
