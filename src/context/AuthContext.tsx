import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, UserRole } from '../types';
import { DEMO_PROFILES, supabase, syncUserProfileToSupabase, fetchUserProfileFromSupabase } from '../lib/supabaseClient';
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
          
          // Optionally refresh fresh profile from Supabase in background
          if (parsed.phone) {
            fetchUserProfileFromSupabase(parsed.phone).then((fresh) => {
              if (fresh) {
                setCurrentUser(fresh);
                AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(fresh)).catch(() => {});
              }
            }).catch(() => {});
          }
        } else {
          // Default unauthenticated state so user can log in with their phone
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

  const registerNavHandler = (fn: (screen: ScreenType, tab?: TabType) => void) => {
    setNavHandler(() => fn);
  };

  const navigateTo = (screen: ScreenType, tab?: TabType) => {
    if (navHandler) {
      navHandler(screen, tab);
    }
  };

  // Login with quick demo profile
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
  const loginWithPhone = async (phone: string, firebaseUid?: string, role: UserRole = 'customer'): Promise<UserProfile> => {
    // 1. Try fetching existing Supabase profile for this phone
    let profile = await fetchUserProfileFromSupabase(phone);

    if (!profile) {
      // 2. If first time login, create starter profile
      profile = {
        id: firebaseUid || `user-${Date.now()}`,
        phone,
        name: '', // Will prompt to complete in Profile Screen
        email: `${phone.replace(/\D/g, '').slice(-10)}@utsavhub.com`,
        role,
        selectedCity: 'Visakhapatnam',
        area_locality: '',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
        isProfileComplete: false,
      };
      // Save initial record to Supabase
      await syncUserProfileToSupabase(profile);
    }

    setCurrentUser(profile);
    await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
    setIsAuthModalVisible(false);

    // Redirect user directly to Profile page to complete name and details!
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
