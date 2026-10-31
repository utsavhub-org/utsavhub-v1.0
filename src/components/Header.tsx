import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MapPin, Heart, ChevronDown, User, Building } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { THEME } from '../theme/colors';
import { playButtonClick, playTabPop } from '../lib/soundManager';

interface HeaderProps {
  onPressLocation?: () => void;
  selectedCity?: string;
  onPressWishlist?: () => void;
  wishlistCount?: number;
}

export default function Header({
  onPressLocation,
  selectedCity = 'Visakhapatnam',
  onPressWishlist,
  wishlistCount = 0,
}: HeaderProps) {
  const { userRole, openAuthModal, currentUser, isLoggedIn, navigateTo } = useAuth();

  return (
    <View style={styles.header}>
      {/* Brand & City Dropdown */}
      <View style={styles.brandRow}>
        <View style={styles.logoFrame}>
          <Image
            source={require('../../assets/1.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.titleColumn}>
          <Text style={styles.brandTitle}>
            Utsav<Text style={{ color: THEME.colors.gold }}>Hub</Text>
          </Text>

          {/* Inline City Selector */}
          <TouchableOpacity
            style={styles.citySelectorRow}
            onPress={onPressLocation}
            activeOpacity={0.7}
          >
            <MapPin size={11} color={THEME.colors.gold} />
            <Text style={styles.cityName} numberOfLines={1}>
              {selectedCity}
            </Text>
            <ChevronDown size={11} color="#A1A1AA" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Right Actions: Wishlist Heart & User/Vendor Avatar */}
      <View style={styles.rightGroup}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => {
            playTabPop();
            onPressWishlist?.();
          }}
          activeOpacity={0.7}
          accessibilityLabel="Wishlist"
        >
          <Heart size={18} color="#FFFFFF" />
          {wishlistCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{wishlistCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.roleAvatar}
          onPress={() => {
            playButtonClick();
            if (isLoggedIn) {
              navigateTo('profile', 'profile');
            } else {
              openAuthModal();
            }
          }}
          activeOpacity={0.7}
          accessibilityLabel="Account and Profile"
        >
          {currentUser?.avatar_url ? (
            <Image
              source={{ uri: currentUser.avatar_url }}
              style={styles.headerAvatarImg}
            />
          ) : userRole === 'vendor' ? (
            <Building size={16} color={THEME.colors.gold} />
          ) : (
            <User size={16} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#09090B',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(197, 160, 89, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  logoFrame: {
    width: 50,
    height: 50,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  titleColumn: {
    justifyContent: 'center',
    flexShrink: 1,
  },
  brandTitle: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 19,
    color: '#FFFFFF',
    letterSpacing: -0.3,
    lineHeight: 23,
  },
  citySelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  cityName: {
    fontFamily: THEME.fonts.semiBold,
    fontSize: 11.5,
    color: '#D4D4D8',
    maxWidth: 120,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: THEME.colors.gold,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontFamily: THEME.fonts.bold,
    color: '#09090B',
    fontSize: 9,
  },
  roleAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  headerAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
  },
});
