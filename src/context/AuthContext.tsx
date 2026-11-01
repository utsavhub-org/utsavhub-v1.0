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
import { signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

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

  // 1. Restore local session immediately on startup, then monitor Firebase Auth State
  useEffect(() => {
    let isMounted = true;

    // Fast-path: immediately restore saved session from AsyncStorage
    AsyncStorage.getItem(STORAGE_KEY_USER).then((storedUser) => {
      if (storedUser && isMounted) {
        try {
          const parsed: UserProfile = JSON.parse(storedUser);
          if (parsed && (parsed.id || parsed.role)) {
            setCurrentUser(parsed);
          }
        } catch {}
      }
    }).catch(() => {});

    // Listen to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (!isMounted) return;

      if (firebaseUser) {
        // User is authenticated with Firebase (Phone OTP, Google, or Email/Password)
        const isGoogle = firebaseUser.providerData?.some((p) => p.providerId === 'google.com');
        const isPhone = Boolean(firebaseUser.phoneNumber);
        const provider: 'google' | 'phone' | 'email' = isGoogle ? 'google' : isPhone ? 'phone' : 'email';

        // Read local storage first to preserve any locally saved profile details
        let existingLocal: UserProfile | null = null;
        try {
          const stored = await AsyncStorage.getItem(STORAGE_KEY_USER);
          if (stored) existingLocal = JSON.parse(stored);
        } catch {}

        try {
          // Look up by UID first, then email, then phone
          let profile = await fetchUserProfileFromSupabase(firebaseUser.uid);
          if (!profile && firebaseUser.email) {
            profile = await fetchUserProfileFromSupabase(firebaseUser.email);
          }
          if (!profile && firebaseUser.phoneNumber) {
            profile = await fetchUserProfileFromSupabase(firebaseUser.phoneNumber);
          }

          if (profile && isMounted) {
            const isCompleted =
              profile.isProfileComplete ??
              existingLocal?.isProfileComplete ??
              Boolean(profile.name && (profile.phone || profile.email));

            const enriched: UserProfile = {
              ...existingLocal,
              ...profile,
              email: profile.email || firebaseUser.email || existingLocal?.email || '',
              phone: profile.phone || existingLocal?.phone || firebaseUser.phoneNumber || '',
              authProvider: provider,
              isEmailVerified: firebaseUser.emailVerified || isGoogle,
              isProfileComplete: isCompleted,
            };
            setCurrentUser(enriched);
            AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(enriched)).catch(() => {});
          } else if (isMounted) {
            // Check if existing local storage has completed details for this user
            const isSameUser =
              existingLocal &&
              (existingLocal.id === firebaseUser.uid ||
                (firebaseUser.email && existingLocal.email === firebaseUser.email) ||
                (firebaseUser.phoneNumber && existingLocal.phone === firebaseUser.phoneNumber));

            if (isSameUser && existingLocal) {
              const enriched: UserProfile = {
                ...existingLocal,
                id: firebaseUser.uid,
                email: existingLocal.email || firebaseUser.email || '',
                phone: existingLocal.phone || firebaseUser.phoneNumber || '',
                authProvider: provider,
                isEmailVerified: firebaseUser.emailVerified || isGoogle,
                isProfileComplete: existingLocal.isProfileComplete ?? Boolean(existingLocal.name),
              };
              setCurrentUser(enriched);
              AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(enriched)).catch(() => {});
              syncUserProfileToSupabase(enriched).catch(() => {});
            } else {
              const hasName = Boolean(firebaseUser.displayName);
              const newProfile: UserProfile = {
                id: firebaseUser.uid,
                phone: firebaseUser.phoneNumber || '',
                email: firebaseUser.email || `${firebaseUser.uid.slice(0, 8)}@utsavhub.com`,
                name: firebaseUser.displayName || '',
                avatar_url:
                  firebaseUser.photoURL ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
                role: 'customer',
                authProvider: provider,
                isEmailVerified: firebaseUser.emailVerified || isGoogle,
                selectedCity: 'Visakhapatnam',
                area_locality: '',
                isProfileComplete: hasName,
              };
              setCurrentUser(newProfile);
              AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newProfile)).catch(() => {});
              syncUserProfileToSupabase(newProfile).catch(() => {});
            }
          }
        } catch (e) {
          console.warn('Firebase auth state user profile sync notice:', e);
        }
      } else {
        // No Firebase user; check local AsyncStorage for offline / stored session
        try {
          const storedUser = await AsyncStorage.getItem(STORAGE_KEY_USER);
          if (storedUser && isMounted) {
            const parsed: UserProfile = JSON.parse(storedUser);
            if (parsed && (parsed.id || parsed.role)) {
              setCurrentUser(parsed);
            }
          }
        } catch (err) {
          console.warn('Error reading stored session:', err);
        }
      }

      if (isMounted) {
        setIsLoadingAuth(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
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
        authProvider: 'phone',
        isEmailVerified: false,
        selectedCity: 'Visakhapatnam',
        area_locality: '',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
        isProfileComplete: false,
      };
      await syncUserProfileToSupabase(profile);
    } else {
      profile.authProvider = 'phone';
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
    if (!profile && data.email) {
      profile = await fetchUserProfileFromSupabase(data.email);
    }

    if (!profile) {
      profile = {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: '',
        role,
        authProvider: 'google',
        isEmailVerified: true,
        selectedCity: 'Visakhapatnam',
        area_locality: '',
        avatar_url:
          data.avatar_url ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
        isProfileComplete: Boolean(data.name),
      };
      await syncUserProfileToSupabase(profile);
    } else {
      profile.authProvider = 'google';
      profile.isEmailVerified = true;
      if (data.avatar_url && !profile.avatar_url) profile.avatar_url = data.avatar_url;
      if (data.name && !profile.name) profile.name = data.name;
      if (data.email && !profile.email) profile.email = data.email;
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

    let profile = await fetchUserProfileFromSupabase(cleanEmail);

    if (!profile) {
      profile = {
        id: `usr-${Date.now()}`,
        name: derivedName,
        email: cleanEmail,
        phone: '', // No fake sample number!
        role,
        authProvider: 'email',
        isEmailVerified: auth.currentUser?.emailVerified ?? false,
        selectedCity: 'Visakhapatnam',
        area_locality: '',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
        isProfileComplete: hasName,
      };
      await syncUserProfileToSupabase(profile);
    } else {
      profile.authProvider = 'email';
      profile.isEmailVerified = auth.currentUser?.emailVerified ?? false;
    }

    setCurrentUser(profile);
    await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
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
    if (userRole === 'customer') {
      // Only permit switching to vendor if user is approved partner
      if (currentUser.role === 'vendor' || currentUser.vendorApplicationStatus === 'approved') {
        updateProfile({ role: 'vendor' });
      }
    } else {
      updateProfile({ role: 'customer' });
    }
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
