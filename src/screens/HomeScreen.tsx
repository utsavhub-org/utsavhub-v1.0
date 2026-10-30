import React, { useState, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import {
  Sparkles,
  Building,
  Utensils,
  Flower2,
  Camera,
  Play,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react-native';
import Header from '../components/Header';
import SearchCard from '../components/SearchCard';
import ListingCard from '../components/ListingCard';
import ReelModal from '../components/ReelModal';
import { MOCK_BUSINESSES } from '../lib/mockData';
import { Business, MediaReel } from '../types';
import { THEME } from '../theme/colors';

interface HomeScreenProps {
  onNavigateToListings: (params: { location?: string; date?: string; guests?: number; category?: string }) => void;
  onNavigateToVendor: (businessId: string, date?: string, guests?: number) => void;
  onNavigateToWishlist?: () => void;
  wishlistCount?: number;
}

const CATEGORIES = [
  { id: 'all', label: 'All Services', icon: Sparkles },
  { id: 'venue', label: 'AC Halls', icon: Building },
  { id: 'decoration', label: 'Mandapam Decor', icon: Flower2 },
  { id: 'catering', label: 'Catering', icon: Utensils },
  { id: 'photography', label: 'Photography', icon: Camera },
];

export default function HomeScreen({
  onNavigateToListings,
  onNavigateToVendor,
  onNavigateToWishlist,
  wishlistCount = 3,
}: HomeScreenProps) {
  const [activeReel, setActiveReel] = useState<MediaReel | null>(null);
  const [activeReelBiz, setActiveReelBiz] = useState<Business | null>(null);
  const [selectedCat, setSelectedCat] = useState('all');

  // Dynamic Collapsible Top Navbar (Hides on scroll down, reappears on little scroll up)
  const scrollOffset = useRef(0);
  const isHeaderVisible = useRef(true);
  const headerAnim = useRef(new Animated.Value(0)).current;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const diff = currentY - scrollOffset.current;

    if (currentY <= 15) {
      // Near top of page: always slide down into view
      if (!isHeaderVisible.current) {
        isHeaderVisible.current = true;
        Animated.timing(headerAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }).start();
      }
    } else if (diff > 8 && currentY > 60) {
      // Scrolling down past 60px: hide navbar smoothly
      if (isHeaderVisible.current) {
        isHeaderVisible.current = false;
        Animated.timing(headerAnim, {
          toValue: -95,
          duration: 220,
          useNativeDriver: true,
        }).start();
      }
    } else if (diff < -6) {
      // Scrolling up a little bit: immediately reveal navbar
      if (!isHeaderVisible.current) {
        isHeaderVisible.current = true;
        Animated.timing(headerAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }).start();
      }
    }

    scrollOffset.current = currentY;
  };

  const reelsList = MOCK_BUSINESSES.flatMap((b) =>
    (b.media_reels || []).map((r) => ({ reel: r, business: b }))
  );

  return (
    <View style={styles.screen}>
      {/* Animated Collapsible Header */}
      <Animated.View
        style={[
          styles.headerWrapper,
          { transform: [{ translateY: headerAnim }] },
        ]}
      >
        <Header
          onPressWishlist={onNavigateToWishlist}
          wishlistCount={wishlistCount}
        />
      </Animated.View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: 78, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Floating Minimalist Search Dock */}
        <SearchCard
          onSearch={(params) => {
            onNavigateToListings({ ...params, category: selectedCat });
          }}
        />

        {/* Minimalist Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCat === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catPill, isSelected && styles.catPillActive]}
                onPress={() => {
                  setSelectedCat(cat.id);
                  onNavigateToListings({ category: cat.id });
                }}
                activeOpacity={0.7}
              >
                <Icon size={14} color={isSelected ? '#FFFFFF' : THEME.colors.textPrimary} />
                <Text style={[styles.catText, isSelected && styles.catTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Cinematic Vertical Reels */}
        {reelsList.length > 0 && (
          <View style={styles.reelsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>VIDEO WALKTHROUGHS</Text>
              <Text style={styles.sectionHint}>Live Stage & Hall Inspection</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.reelsScroll}
            >
              {reelsList.map(({ reel, business }) => (
                <TouchableOpacity
                  key={reel.id}
                  style={styles.reelCard}
                  onPress={() => {
                    setActiveReel(reel);
                    setActiveReelBiz(business);
                  }}
                  activeOpacity={0.88}
                >
                  <Image source={{ uri: reel.thumbnail_url }} style={styles.reelImage} />
                  <View style={styles.reelOverlay} />
                  <View style={styles.playIconBox}>
                    <Play size={14} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
                  </View>
                  <View style={styles.reelMeta}>
                    <Text style={styles.reelBiz} numberOfLines={1}>{business.name}</Text>
                    <Text style={styles.reelCaption} numberOfLines={2}>{reel.title}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Featured Listings Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>FEATURED MANDAPAMS & VENUES</Text>
          <TouchableOpacity
            onPress={() => onNavigateToListings({ category: 'all' })}
            style={styles.viewAllBtn}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <ArrowRight size={13} color={THEME.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Listing Cards */}
        {MOCK_BUSINESSES.map((b) => (
          <ListingCard
            key={b.id}
            business={b}
            date="2026-11-20"
            onPress={() => onNavigateToVendor(b.id, '2026-11-20', 300)}
          />
        ))}

        {/* Minimalist Trust Footer Banner */}
        <View style={styles.trustBanner}>
          <View style={styles.shieldIcon}>
            <ShieldCheck size={20} color={THEME.colors.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.trustTitle}>Date-Hold Guarantee Policy</Text>
            <Text style={styles.trustSub}>
              100% verified direct contracts with hall owners across Andhra Pradesh.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Reel Modal */}
      {activeReel && (
        <ReelModal
          reel={activeReel}
          business={activeReelBiz}
          visible={!!activeReel}
          onClose={() => {
            setActiveReel(null);
            setActiveReelBiz(null);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: THEME.colors.canvas,
  },
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  container: {
    flex: 1,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 8,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  catPillActive: {
    backgroundColor: THEME.colors.accentDark,
    borderColor: THEME.colors.accentDark,
  },
  catText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 12.5,
    color: THEME.colors.textPrimary,
  },
  catTextActive: {
    color: '#FFFFFF',
  },
  reelsSection: {
    marginVertical: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 10,
  },
  sectionTitle: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 11,
    color: THEME.colors.textMuted,
    letterSpacing: 1,
  },
  sectionHint: {
    fontFamily: THEME.fonts.semiBold,
    fontSize: 11.5,
    color: THEME.colors.textSecondary,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 12,
    color: THEME.colors.textPrimary,
  },
  reelsScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  reelCard: {
    width: 135,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#09090B',
    position: 'relative',
  },
  reelImage: {
    width: '100%',
    height: '100%',
  },
  reelOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playIconBox: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelMeta: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
  },
  reelBiz: {
    fontFamily: THEME.fonts.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  reelCaption: {
    fontFamily: THEME.fonts.regular,
    fontSize: 11,
    color: '#D4D4D8',
    marginTop: 2,
    lineHeight: 14,
  },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#09090B',
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 20,
    padding: 18,
  },
  shieldIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustTitle: {
    fontFamily: THEME.fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  trustSub: {
    fontFamily: THEME.fonts.regular,
    fontSize: 12,
    color: '#A1A1AA',
    marginTop: 2,
    lineHeight: 16,
  },
});
