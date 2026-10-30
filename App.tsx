import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, useWindowDimensions, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Home, Compass, CalendarCheck, User, Building } from 'lucide-react-native';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import HomeScreen from './src/screens/HomeScreen';
import ListingsScreen from './src/screens/ListingsScreen';
import VendorDetailScreen from './src/screens/VendorDetailScreen';
import MyBookingsScreen from './src/screens/MyBookingsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AuthModal from './src/components/AuthModal';
import { THEME } from './src/theme/colors';

type ScreenType = 'home' | 'listings' | 'bookings' | 'profile' | 'vendor';

function MainNavigator() {
  const { userRole, currentUser, registerNavHandler } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [activeTabNav, setActiveTabNav] = useState<'home' | 'explore' | 'bookings' | 'profile'>('home');
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  useEffect(() => {
    registerNavHandler((screen, tab) => {
      setCurrentScreen(screen);
      if (tab) setActiveTabNav(tab);
    });
  }, [registerNavHandler]);

  // Navigation state parameters
  const [navParams, setNavParams] = useState<{
    location?: string;
    date: string;
    guests: number;
    category?: string;
    vendorId?: string;
  }>({
    location: '',
    date: '2026-11-20',
    guests: 300,
    category: 'all',
  });

  const navigateToListings = (params: { location?: string; date?: string; guests?: number; category?: string }) => {
    setNavParams((prev) => ({
      ...prev,
      ...params,
      date: params.date || prev.date,
      guests: params.guests || prev.guests,
    }));
    setCurrentScreen('listings');
    setActiveTabNav('explore');
  };

  const navigateToVendor = (vendorId: string, date?: string, guests?: number) => {
    setNavParams((prev) => ({
      ...prev,
      vendorId,
      date: date || prev.date,
      guests: guests || prev.guests,
    }));
    setCurrentScreen('vendor');
  };

  const isTablet = width >= 768;
  const isWide = width > 520;

  return (
    <View style={[styles.outerContainer, isWide && styles.outerContainerWide]}>
      <SafeAreaView
        style={[
          styles.container,
          isWide && styles.containerWide,
          isTablet && styles.containerTablet,
        ]}
        edges={['top', 'left', 'right']}
      >
        <StatusBar style="light" backgroundColor="#09090B" />

        <View style={styles.content}>
          {currentScreen === 'home' && (
            <HomeScreen
              onNavigateToListings={navigateToListings}
              onNavigateToVendor={navigateToVendor}
              onNavigateToWishlist={() => navigateToListings({ category: 'wishlist' })}
              wishlistCount={3}
            />
          )}

          {currentScreen === 'listings' && (
            <ListingsScreen
              initialLocation={navParams.location}
              initialDate={navParams.date}
              initialGuests={navParams.guests}
              initialCategory={navParams.category}
              onBack={() => {
                setCurrentScreen('home');
                setActiveTabNav('home');
              }}
              onSelectVendor={navigateToVendor}
            />
          )}

          {currentScreen === 'bookings' && (
            <MyBookingsScreen
              onExploreMore={() => navigateToListings({ category: 'all' })}
              onSelectVendor={navigateToVendor}
            />
          )}

          {currentScreen === 'profile' && (
            <ProfileScreen
              onNavigateToWishlist={() => navigateToListings({ category: 'wishlist' })}
              onNavigateToBookings={() => {
                setActiveTabNav('bookings');
                setCurrentScreen('bookings');
              }}
              onNavigateToExplore={() => navigateToListings({ category: 'all' })}
              onSelectVendor={navigateToVendor}
            />
          )}

          {currentScreen === 'vendor' && navParams.vendorId && (
            <VendorDetailScreen
              businessId={navParams.vendorId}
              initialDate={navParams.date}
              initialGuests={navParams.guests}
              onBack={() => setCurrentScreen('listings')}
            />
          )}
        </View>

        {/* Global Auth Modal */}
        <AuthModal />

        {/* Bottom Tab Navigation Bar (1. Home, 2. Explore, 3. My Bookings, 4. Profile / Vendor Portal) */}
        {currentScreen !== 'vendor' && (
          <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => {
                setActiveTabNav('home');
                setCurrentScreen('home');
              }}
              activeOpacity={0.7}
            >
              <Home
                size={22}
                color={activeTabNav === 'home' ? THEME.colors.textPrimary : '#A1A1AA'}
              />
              <Text
                style={[
                  styles.navLabel,
                  activeTabNav === 'home' && styles.navLabelActive,
                ]}
                numberOfLines={1}
              >
                Home
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => {
                setActiveTabNav('explore');
                navigateToListings({ category: 'all' });
              }}
              activeOpacity={0.7}
            >
              <Compass
                size={22}
                color={activeTabNav === 'explore' ? THEME.colors.textPrimary : '#A1A1AA'}
              />
              <Text
                style={[
                  styles.navLabel,
                  activeTabNav === 'explore' && styles.navLabelActive,
                ]}
                numberOfLines={1}
              >
                Explore
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => {
                setActiveTabNav('bookings');
                setCurrentScreen('bookings');
              }}
              activeOpacity={0.7}
            >
              <CalendarCheck
                size={22}
                color={activeTabNav === 'bookings' ? THEME.colors.textPrimary : '#A1A1AA'}
              />
              <Text
                style={[
                  styles.navLabel,
                  activeTabNav === 'bookings' && styles.navLabelActive,
                ]}
                numberOfLines={1}
              >
                My Bookings
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => {
                setActiveTabNav('profile');
                setCurrentScreen('profile');
              }}
              activeOpacity={0.7}
            >
              {userRole === 'vendor' ? (
                <Building
                  size={22}
                  color={activeTabNav === 'profile' ? THEME.colors.textPrimary : '#A1A1AA'}
                />
              ) : (
                <User
                  size={22}
                  color={activeTabNav === 'profile' ? THEME.colors.textPrimary : '#A1A1AA'}
                />
              )}
              <Text
                style={[
                  styles.navLabel,
                  activeTabNav === 'profile' && styles.navLabelActive,
                ]}
                numberOfLines={1}
              >
                {userRole === 'vendor' ? 'Vendor Portal' : 'Profile'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MainNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    width: '100%',
  },
  outerContainerWide: {
    backgroundColor: '#09090B',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#09090B',
    width: '100%',
  },
  containerWide: {
    maxWidth: 520,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#EEEEF0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
  },
  containerTablet: {
    maxWidth: 720,
  },
  content: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEF0',
    paddingTop: 10,
    paddingBottom: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  navLabel: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11,
    color: '#8E8B99',
  },
  navLabelActive: {
    fontFamily: THEME.fonts.bold,
    color: '#0B0B0E',
  },
});
