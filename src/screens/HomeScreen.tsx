import React, { useState, useRef, useEffect } from 'react';
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
  Music,
  Play,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react-native';
import Header from '../components/Header';
import SearchCard from '../components/SearchCard';
import ListingCard from '../components/ListingCard';
import ReelModal from '../components/ReelModal';
import ShimmerSkeleton from '../components/ShimmerSkeleton';
import { getFilteredBusinesses } from '../lib/supabaseClient';
import { Business, MediaReel } from '../types';
import { THEME } from '../theme/colors';
import { playButtonClick, playTabPop } from '../lib/soundManager';

interface HomeScreenProps {
  onNavigateToListings: (params: { location?: string; date?: string; guests?: number; category?: string }) => void;
  onNavigateToVendor: (businessId: string, date?: string, guests?: number) => void;
  onNavigateToWishlist?: () => void;
  wishlistCount?: number;
}

const CATEGORIES = [
  // Line 1
  {
    id: 'all',
    label: 'All Services',
    subtitle: 'Full Directory',
    icon: Sparkles,
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'venue',
    label: 'AC Halls',
    subtitle: 'Mandapams',
    icon: Building,
    image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'decoration',
    label: 'Decor',
    subtitle: 'Floral Stages',
    icon: Flower2,
    image: 'https://images.unsplash.com/photo-1544077960-604201fe74bc?auto=format&fit=crop&w=400&q=80',
  },
  // Line 2
  {
    id: 'catering',
    label: 'Catering',
    subtitle: 'Royal Feasts',
    icon: Utensils,
    image: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'photography',
    label: 'Photography',
    subtitle: '4K & Drone',
    icon: Camera,
    image: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'dj_sound',
    label: 'Music & DJ',
    subtitle: 'Sound & Band',
    icon: Music,
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=400&q=80',
  },
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

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getFilteredBusinesses({})
      .then((res) => {
        if (isMounted) {
          setBusinesses(res.businesses.filter((b) => b.is_active !== false));
          setLoadingBusinesses(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingBusinesses(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const reelsList = businesses.flatMap((b) =>
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

        {/* Two-Line Visual Category Tiles (Matching UtsavHub Luxury Style) */}
        <View style={styles.categoryTilesSection}>
          <View style={styles.sectionHeaderInner}>
            <Text style={styles.sectionTitle}>EXPLORE BY SERVICE</Text>
            <Text style={styles.sectionHint}>Select category to filter</Text>
          </View>

          <View style={styles.twoLineTilesGrid}>
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCat === cat.id;

              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryTile,
                    isSelected && styles.categoryTileSelected,
                  ]}
                  onPress={() => {
                    playTabPop();
                    setSelectedCat(cat.id);
                    onNavigateToListings({ category: cat.id });
                  }}
                  activeOpacity={0.82}
                >
                  {/* Photo Container */}
                  <View style={styles.tileImageContainer}>
                    <Image
                      source={{ uri: cat.image }}
                      style={styles.tileImage}
                      fadeDuration={200}
                    />
                    <View style={styles.tileImageOverlay} />

                    {/* Translucent Corner Icon Pill */}
                    <View
                      style={[
                        styles.tileIconBadge,
                        isSelected && styles.tileIconBadgeActive,
                      ]}
                    >
                      <Icon
                        size={12}
                        color={isSelected ? '#0B0B0E' : '#FFFFFF'}
                      />
                    </View>

                    {/* Selected Golden Check */}
                    {isSelected && (
                      <View style={styles.tileSelectedDot}>
                        <CheckCircle2 size={13} color="#C5A059" />
                      </View>
                    )}
                  </View>

                  {/* Tile Typography with Name & Subtitle */}
                  <View style={styles.tileTextContainer}>
                    <Text
                      style={[
                        styles.tileName,
                        isSelected && styles.tileNameSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {cat.label}
                    </Text>
                    <Text style={styles.tileSubtitle} numberOfLines={1}>
                      {cat.subtitle}
                    </Text>
                  </View>

                  {/* Active Indicator Bar at bottom of tile */}
                  {isSelected && <View style={styles.tileActiveIndicator} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

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

        {/* Listing Cards with Shimmer Skeleton loading */}
        {loadingBusinesses ? (
          <ShimmerSkeleton count={3} />
        ) : (
          businesses.map((b) => (
            <ListingCard
              key={b.id}
              business={b}
              date="2026-11-20"
              onPress={() => onNavigateToVendor(b.id, '2026-11-20', 300)}
            />
          ))
        )}

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
  categoryTilesSection: {
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
  },
  sectionHeaderInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  twoLineTilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  categoryTile: {
    width: '31.6%',
    backgroundColor: THEME.colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: 5,
    paddingBottom: 7,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: THEME.colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  categoryTileSelected: {
    borderColor: THEME.colors.gold,
    borderWidth: 1.8,
    backgroundColor: '#FAF7F0',
    shadowColor: THEME.colors.gold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 3,
  },
  tileImageContainer: {
    width: '100%',
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  tileImageOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(11, 11, 14, 0.16)',
  },
  tileIconBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(11, 11, 14, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  tileIconBadgeActive: {
    backgroundColor: THEME.colors.gold,
    borderColor: THEME.colors.gold,
  },
  tileSelectedDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  tileTextContainer: {
    paddingTop: 5,
    paddingHorizontal: 2,
    alignItems: 'center',
  },
  tileName: {
    fontFamily: THEME.fonts.bold,
    fontSize: 11.5,
    color: THEME.colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  tileNameSelected: {
    color: THEME.colors.textPrimary,
    fontFamily: THEME.fonts.extraBold,
  },
  tileSubtitle: {
    fontFamily: THEME.fonts.medium,
    fontSize: 9.5,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: 1,
  },
  tileActiveIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 2.5,
    backgroundColor: THEME.colors.gold,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
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
    ...StyleSheet.absoluteFill,
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
