import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, useWindowDimensions, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Home, Compass, CalendarCheck, User } from 'lucide-react-native';
import HomeScreen from './src/screens/HomeScreen';
import ListingsScreen from './src/screens/ListingsScreen';
import VendorDetailScreen from './src/screens/VendorDetailScreen';
import MyBookingsScreen from './src/screens/MyBookingsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

type ScreenType = 'home' | 'listings' | 'bookings' | 'profile' | 'vendor';

function MainNavigator() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [activeTabNav, setActiveTabNav] = useState<'home' | 'explore' | 'bookings' | 'profile'>('home');
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

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

  const isWide = width > 520;

  return (
    <View style={[styles.outerContainer, isWide && styles.outerContainerWide]}>
      <SafeAreaView style={[styles.container, isWide && styles.containerWide]} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" backgroundColor="#FFFFFF" />

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

        {/* Bottom Tab Navigation Bar (1. Home, 2. Explore, 3. My Bookings, 4. Profile) */}
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
                color={activeTabNav === 'home' ? '#D4AF37' : '#94A3B8'}
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
                color={activeTabNav === 'explore' ? '#D4AF37' : '#94A3B8'}
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
                color={activeTabNav === 'bookings' ? '#D4AF37' : '#94A3B8'}
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
              <User
                size={22}
                color={activeTabNav === 'profile' ? '#D4AF37' : '#94A3B8'}
              />
              <Text
                style={[
                  styles.navLabel,
                  activeTabNav === 'profile' && styles.navLabelActive,
                ]}
                numberOfLines={1}
              >
                Profile
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    width: '100%',
  },
  outerContainerWide: {
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    width: '100%',
  },
  containerWide: {
    maxWidth: 480,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  content: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    paddingBottom: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  navLabelActive: {
    color: '#D4AF37',
    fontWeight: '800',
  },
});
