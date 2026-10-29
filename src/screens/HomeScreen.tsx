import React, { useState, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  Crown,
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
  { id: 'catering', label: 'Catering Menus', icon: Utensils },
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

  // Dynamic Collapsible Header Animation State
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
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    } else if (diff > 10 && currentY > 50) {
      // Scrolling down past 50px: hide header
      if (isHeaderVisible.current) {
        isHeaderVisible.current = false;
        Animated.timing(headerAnim, {
          toValue: -85,
          duration: 220,
          useNativeDriver: true,
        }).start();
      }
    } else if (diff < -8) {
      // Scrolling up a little bit: slide down and show header
      if (!isHeaderVisible.current) {
        isHeaderVisible.current = true;
        Animated.timing(headerAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    }

    scrollOffset.current = currentY;
  };

  // Flat list of all media reels with business metadata
  const reelsList = MOCK_BUSINESSES.flatMap((b) =>
    (b.media_reels || []).map((r) => ({ reel: r, business: b }))
  );

  return (
    <View style={styles.screen}>
      {/* Animated Collapsible Header (Hides when scrolling down, reveals when scrolling up) */}
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
        contentContainerStyle={{ paddingTop: 64, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Top Hero Section with Curvy Background Split */}
        <View style={styles.heroSplitSection}>
          {/* Curvy background layer behind the search card */}
          <View style={styles.curvyBgWrapper} pointerEvents="none">
            <View style={styles.curvyTopSolid} />
            <Svg
              height={50}
              width="100%"
              viewBox="0 0 100 50"
              preserveAspectRatio="none"
              style={styles.curvySvg}
            >
              <Path
                d="M 0,0 L 100,0 L 100,6 Q 50,50 0,6 Z"
                fill="#FAF8F5"
              />
            </Svg>
          </View>

          <View style={{ height: 10 }} />

          {/* Search Hero Card floating over the curvy split */}
          <SearchCard
            onSearch={(params) => {
              onNavigateToListings(params);
            }}
          />
        </View>

        {/* Categories Horizontal Scroll */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>EXPLORE CATEGORIES</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <TouchableOpacity
                key={cat.id}
                style={styles.catPill}
                onPress={() => onNavigateToListings({ category: cat.id })}
                activeOpacity={0.7}
              >
                <View style={styles.catIconCircle}>
                  <Icon size={16} color="#D4AF37" />
                </View>
                <Text style={styles.catText}>{cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Video Reels Walkthrough Horizontal Carousel */}
        {reelsList.length > 0 && (
          <View style={styles.reelsSection}>
            <View style={styles.reelsHeaderRow}>
              <View>
                <View style={styles.subRow}>
                  <Sparkles size={12} color="#D4AF37" />
                  <Text style={styles.reelsSub}>LIVE INSPECTION</Text>
                </View>
                <Text style={styles.reelsTitle}>Vertical Reels & Tours</Text>
              </View>
              <Text style={styles.reelsHint}>Tap to view in fullscreen</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.reelsScroll}
            >
              {reelsList.map(({ reel, business }) => (
                <TouchableOpacity
                  key={reel.id}
                  style={styles.reelThumbCard}
                  onPress={() => {
                    setActiveReel(reel);
                    setActiveReelBiz(business);
                  }}
                  activeOpacity={0.85}
                >
                  <Image
                    source={{ uri: reel.thumbnail_url }}
                    style={styles.reelThumbImage}
                  />
                  <View style={styles.reelGradient} />

                  <View style={styles.playBadge}>
                    <Play size={14} color="#FFFFFF" style={{ marginLeft: 2 }} />
                  </View>

                  <View style={styles.reelInfo}>
                    <Text style={styles.reelBizName} numberOfLines={1}>
                      {business.name}
                    </Text>
                    <Text style={styles.reelVideoTitle} numberOfLines={2}>
                      {reel.title}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Trending Highlights */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <View style={styles.subRow}>
              <Crown size={12} color="#D4AF37" />
              <Text style={styles.reelsSub}>VERIFIED & TOP-RATED</Text>
            </View>
            <Text style={styles.sectionTitleLarge}>Trending Venues & Decor</Text>
          </View>
          <TouchableOpacity
            style={styles.viewAllRow}
            onPress={() => onNavigateToListings({})}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <ArrowRight size={13} color="#D4AF37" />
          </TouchableOpacity>
        </View>

        {MOCK_BUSINESSES.slice(0, 3).map((biz) => (
          <ListingCard
            key={biz.id}
            business={biz}
            date="2026-11-20"
            onPress={() => onNavigateToVendor(biz.id, '2026-11-20', 300)}
          />
        ))}

        {/* Anti-Disappointment Guarantee Card */}
        <View style={styles.guaranteeCard}>
          <ShieldCheck size={28} color="#D4AF37" />
          <Text style={styles.guaranteeTitle}>Anti-Disappointment Guarantee</Text>
          <Text style={styles.guaranteeText}>
            UtsavHub checks real-time availability calendars and guest capacity limits before showing any hall or caterer. You only see vendors available for your special muhurtham.
          </Text>
        </View>
      </ScrollView>

      {/* Reel Modal */}
      <ReelModal
        visible={activeReel !== null}
        reel={activeReel}
        business={activeReelBiz}
        onClose={() => {
          setActiveReel(null);
          setActiveReelBiz(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: '#FAF8F5',
    elevation: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  container: {
    flex: 1,
  },
  heroSplitSection: {
    position: 'relative',
    width: '100%',
  },
  curvyBgWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '62%',
  },
  curvyTopSolid: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  curvySvg: {
    width: '100%',
    height: 50,
  },
  heroTextContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    alignItems: 'center',
  },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    marginBottom: 6,
  },
  heroTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  heroTitle: {
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  goldTitle: {
    color: '#D4AF37',
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 5,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  categoriesScroll: {
    paddingHorizontal: 12,
    gap: 8,
    paddingBottom: 10,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  catIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  reelsSection: {
    marginVertical: 16,
  },
  reelsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  reelsSub: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 0.6,
  },
  reelsTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  reelsHint: {
    fontSize: 12,
    color: '#64748B',
  },
  reelsScroll: {
    paddingHorizontal: 12,
    gap: 12,
  },
  reelThumbCard: {
    width: 140,
    height: 215,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  reelThumbImage: {
    width: '100%',
    height: '100%',
  },
  reelGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  playBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  reelInfo: {
    position: 'absolute',
    bottom: 12,
    left: 10,
    right: 10,
  },
  reelBizName: {
    color: '#FDE68A',
    fontSize: 12,
    fontWeight: '700',
  },
  reelVideoTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitleLarge: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#D4AF37',
  },
  guaranteeCard: {
    backgroundColor: '#0F172A',
    borderRadius: 22,
    marginHorizontal: 12,
    marginTop: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  guaranteeTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  guaranteeText: {
    color: '#94A3B8',
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
  },
});
