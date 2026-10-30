import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, UserRole } from '../types';
import {
  DEMO_PROFILES,
  supabase,
  syncUserProfileToSupabase,
  fetchUserProfileFromSupabase,
} from '../lib/supabaseClient';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

const STORAGE_KEY_USER = '@utsavhub_active_user';

type ScreenType = 'home' | 'listings' | 'bookings' | 'profile' | 'vendor';
type TabType = 'home' | 'explore' | 'bookings' | 'profile';

interface AuthContextType {
  currentUser: UserProfile | null;
  userRole: UserRole;
  isLoggedIn: boolean;
  isLoadingAuth: boolean;
  loginAs: (role: UserRole, profile?: Partial<UserProfile>) => Promise<void>;
  loginWithPhone: (phone: string, firebaseUid?: string, role?: UserRole) => Promise<UserProfile>;
  loginWithGoogle: (data: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    role?: UserRole;
  }) => Promise<UserProfile>;
  loginWithEmailPassword: (
    email: string,
    fullName?: string,
    role?: UserRole
  ) => Promise<UserProfile>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  logout: () => Promise<void>;
  switchRole: () => void;
  isAuthModalVisible: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  registerNavHandler: (fn: (screen: ScreenType, tab?: TabType) => void) => void;
  navigateTo: (screen: ScreenType, tab?: TabType) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);
  const [navHandler, setNavHandler] = useState<((screen: ScreenType, tab?: TabType) => void) | null>(null);

  // 1. Restore persisted session on initial app boot
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedUser = await AsyncStorage.getItem(STORAGE_KEY_USER);
        if (storedUser) {
          const parsed: UserProfile = JSON.parse(storedUser);
          setCurrentUser(parsed);

          // Refresh profile from Supabase in background if available
          if (parsed.phone) {
            fetchUserProfileFromSupabase(parsed.phone)
              .then((fresh) => {
                if (fresh) {
                  setCurrentUser(fresh);
                  AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(fresh)).catch(() => {});
                }
              })
              .catch(() => {});
          }
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.warn('Error restoring user session:', err);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    restoreSession();
  }, []);

  const userRole: UserRole = currentUser?.role || 'customer';
  const isLoggedIn = currentUser !== null;

  const registerNavHandler = useCallback((fn: (screen: ScreenType, tab?: TabType) => void) => {
    setNavHandler(() => fn);
  }, []);

  const navigateTo = (screen: ScreenType, tab?: TabType) => {
    if (navHandler) {
      navHandler(screen, tab);
    }
  };

  // Quick preset login
  const loginAs = async (role: UserRole, profile?: Partial<UserProfile>) => {
    const base = role === 'customer' ? DEMO_PROFILES.customer : DEMO_PROFILES.vendor;
    const finalProfile: UserProfile = {
      ...base,
      ...profile,
      role,
      isProfileComplete: true,
    };
    setCurrentUser(finalProfile);
    setIsAuthModalVisible(false);
    await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(finalProfile));
    await syncUserProfileToSupabase(finalProfile);
  };

  // Real phone OTP sign in
  const loginWithPhone = async (
    phone: string,
    firebaseUid?: string,
    role: UserRole = 'customer'
  ): Promise<UserProfile> => {
    let profile = await fetchUserProfileFromSupabase(phone);

    if (!profile) {
      profile = {
        id: firebaseUid || `user-${Date.now()}`,
        phone,
        name: '',
        email: `${phone.replace(/\D/g, '').slice(-10)}@utsavhub.com`,
        role,
        selectedCity: 'Visakhapatnam',
        area_locality: '',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
        isProfileComplete: false,
      };
      await syncUserProfileToSupabase(profile);
    }

    setCurrentUser(profile);
    await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
    setIsAuthModalVisible(false);

    if (navHandler) {
      navHandler('profile', 'profile');
    }

    return profile;
  };

  // Google Sign-In Connectivity
  const loginWithGoogle = async (data: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    role?: UserRole;
  }): Promise<UserProfile> => {
    const role = data.role || 'customer';
    let profile = await fetchUserProfileFromSupabase(data.id);

    if (!profile) {
      profile = {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: '+91 98480 12345',
        role,
        selectedCity: 'Visakhapatnam',
        area_locality: '',
        avatar_url:
          data.avatar_url ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
        isProfileComplete: false,
      };
      await syncUserProfileToSupabase(profile);
    }

    setCurrentUser(profile);
    await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
    setIsAuthModalVisible(false);

    if (navHandler) {
      navHandler('profile', 'profile');
    }

    return profile;
  };

  // Email & Password Sign In
  const loginWithEmailPassword = async (
    email: string,
    fullName?: string,
    role: UserRole = 'customer'
  ): Promise<UserProfile> => {
    const cleanEmail = email.trim().toLowerCase();
    const hasName = Boolean(fullName && fullName.trim().length > 1);
    const derivedName = fullName?.trim() || cleanEmail.split('@')[0];

    const profile: UserProfile = {
      id: `usr-${Date.now()}`,
      name: derivedName,
      email: cleanEmail,
      phone: '+91 98480 12345',
      role,
      selectedCity: 'Visakhapatnam',
      area_locality: '',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      isProfileComplete: hasName,
    };

    setCurrentUser(profile);
    await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
    await syncUserProfileToSupabase(profile);
    setIsAuthModalVisible(false);

    if (navHandler) {
      navHandler('profile', 'profile');
    }

    return profile;
  };

  // Update profile in local state, AsyncStorage, and Supabase
  const updateProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    if (!currentUser) return false;

    const updatedUser: UserProfile = {
      ...currentUser,
      ...updates,
      isProfileComplete: true,
    };

    setCurrentUser(updatedUser);
    await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
    const saved = await syncUserProfileToSupabase(updatedUser);
    return saved;
  };

  // Complete Logout: clears AsyncStorage, Firebase auth, and Supabase auth
  const logout = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY_USER);
      if (auth) {
        await signOut(auth).catch(() => {});
      }
      if (supabase) {
        await supabase.auth.signOut().catch(() => {});
      }
    } catch (e) {
      console.warn('Logout error:', e);
    } finally {
      setCurrentUser(null);
    }
  };

  const switchRole = () => {
    if (!currentUser) return;
    const newRole: UserRole = userRole === 'customer' ? 'vendor' : 'customer';
    updateProfile({ role: newRole });
  };

  const openAuthModal = () => setIsAuthModalVisible(true);
  const closeAuthModal = () => setIsAuthModalVisible(false);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userRole,
        isLoggedIn,
        isLoadingAuth,
        loginAs,
        loginWithPhone,
        loginWithGoogle,
        loginWithEmailPassword,
        updateProfile,
        logout,
        switchRole,
        isAuthModalVisible,
        openAuthModal,
        closeAuthModal,
        registerNavHandler,
        navigateTo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
