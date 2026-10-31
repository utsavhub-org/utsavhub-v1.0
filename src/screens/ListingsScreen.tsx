import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  ChevronLeft,
  Calendar,
  Users,
  MapPin,
  Wind,
  Utensils,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Building,
  Flower2,
  Camera,
  Music,
  Heart,
} from 'lucide-react-native';
import ShimmerSkeleton from '../components/ShimmerSkeleton';
import ListingCard from '../components/ListingCard';
import { getFilteredBusinesses, getUserWishlists, toggleUserWishlist } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Business } from '../types';
import { THEME } from '../theme/colors';
import { playTabPop, playButtonClick } from '../lib/soundManager';

interface ListingsScreenProps {
  initialLocation?: string;
  initialDate?: string;
  initialGuests?: number;
  initialCategory?: string;
  onBack: () => void;
  onSelectVendor: (id: string, date: string, guests: number) => void;
}

const EXPLORE_CATEGORIES = [
  { id: 'all', label: 'All Services', icon: Sparkles },
  { id: 'venue', label: 'AC Halls', icon: Building },
  { id: 'decoration', label: 'Mandapam Decor', icon: Flower2 },
  { id: 'catering', label: 'Catering', icon: Utensils },
  { id: 'photography', label: 'Photography', icon: Camera },
  { id: 'dj_sound', label: 'DJ & Sound', icon: Music },
  { id: 'wishlist', label: 'Wishlist', icon: Heart },
];

export default function ListingsScreen({
  initialLocation = '',
  initialDate = '2026-11-20',
  initialGuests = 300,
  initialCategory = 'all',
  onBack,
  onSelectVendor,
}: ListingsScreenProps) {
  const { currentUser, isLoggedIn, openAuthModal } = useAuth();
  const [location, setLocation] = useState(initialLocation);
  const [date, setDate] = useState(initialDate);
  const [guests, setGuests] = useState<number>(initialGuests);
  const [category, setCategory] = useState(initialCategory);
  const [acOnly, setAcOnly] = useState(false);
  const [outsideCatering, setOutsideCatering] = useState(false);

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [blockedCount, setBlockedCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Load live user wishlist from Supabase
  useEffect(() => {
    async function fetchUserWishlist() {
      if (isLoggedIn && currentUser) {
        const uid = currentUser.id || currentUser.phone || currentUser.email || '';
        const saved = await getUserWishlists(uid);
        setWishlistIds(saved);
      } else {
        setWishlistIds([]);
      }
    }
    fetchUserWishlist();
  }, [isLoggedIn, currentUser]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const uid = currentUser ? (currentUser.id || currentUser.phone || currentUser.email) : undefined;
      const res = await getFilteredBusinesses({
        location,
        date,
        guests,
        category,
        acOnly,
        outsideCatering,
        userId: uid,
      });
      setBusinesses(res.businesses);
      setBlockedCount(res.blockedCount);
      setLoading(false);
    }
    load();
  }, [location, date, guests, category, acOnly, outsideCatering, currentUser]);

  return (
    <View style={styles.screen}>
      {/* Top App Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ChevronLeft size={22} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {category === 'wishlist'
            ? 'My Saved Wishlist'
            : category === 'venue'
            ? 'AC Convention Halls'
            : category === 'catering'
            ? 'Royal Catering Services'
            : category === 'decoration'
            ? 'Mandapam & Stage Decor'
            : category === 'photography'
            ? 'Wedding Photography'
            : category === 'dj_sound'
            ? 'DJ, Sound & Band'
            : 'Available Verified Listings'}
        </Text>
        <View style={{ width: 34 }} />
      </View>

      {/* Sticky Active Filter Bar */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {/* Active chips */}
          <View style={styles.activePill}>
            <Calendar size={11} color="#B89324" />
            <Text style={styles.activePillText}>{date}</Text>
          </View>

          <View style={styles.activePill}>
            <Users size={11} color="#B89324" />
            <Text style={styles.activePillText}>{guests}+ Guests</Text>
          </View>

          <View style={styles.activePill}>
            <MapPin size={11} color="#B89324" />
            <Text style={styles.activePillText}>{location || 'Visakhapatnam'}</Text>
          </View>

          {/* Toggles */}
          <TouchableOpacity
            style={[styles.toggleBtn, acOnly && styles.toggleBtnActive]}
            onPress={() => setAcOnly(!acOnly)}
          >
            <Wind size={11} color={acOnly ? '#FFFFFF' : '#334155'} />
            <Text style={[styles.toggleText, acOnly && styles.toggleTextActive]}>
              Central AC
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, outsideCatering && styles.toggleBtnActive]}
            onPress={() => setOutsideCatering(!outsideCatering)}
          >
            <Utensils size={11} color={outsideCatering ? '#FFFFFF' : '#334155'} />
            <Text style={[styles.toggleText, outsideCatering && styles.toggleTextActive]}>
              Outside Food Allowed
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Category Pills with Icons (Horizontally Scrollable) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {EXPLORE_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = category === cat.id;

            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catBtn, isSelected && styles.catBtnActive]}
                onPress={() => {
                  playTabPop();
                  setCategory(cat.id);
                }}
                activeOpacity={0.75}
              >
                <Icon
                  size={14}
                  color={isSelected ? '#C5A059' : '#64748B'}
                />
                <Text
                  style={[
                    styles.catBtnText,
                    isSelected && styles.catBtnTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={{ paddingBottom: 60, paddingTop: 10 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Gatekeeper Live Status Banner */}
        <View style={styles.gatekeeperBanner}>
          <CheckCircle2 size={16} color="#059669" />
          <View style={{ flex: 1 }}>
            <Text style={styles.gatekeeperTitle}>
              Real-Time Calendar Sync Active
            </Text>
            <Text style={styles.gatekeeperSub}>
              Showing only open venues for {date} ({guests} guests).
            </Text>
          </View>
          {blockedCount > 0 && (
            <View style={styles.blockedBadge}>
              <Text style={styles.blockedBadgeText}>
                {blockedCount} booked
              </Text>
            </View>
          )}
        </View>

        {/* Results Header */}
        <View style={styles.resultsCountRow}>
          <Text style={styles.resultsCountText}>
            {category === 'wishlist'
              ? !isLoggedIn || !currentUser
                ? 'Sign in to access your saved items'
                : `${businesses.length} Shortlisted Items`
              : `${businesses.length} Verified Providers Found`}
          </Text>
        </View>

        {category === 'wishlist' && (!isLoggedIn || !currentUser) ? (
          <View style={styles.authPromptCard}>
            <View style={styles.authPromptIconWrap}>
              <Heart size={38} color="#C5A059" fill="rgba(197, 160, 89, 0.25)" />
            </View>
            <Text style={styles.authPromptTitle}>Sign In to View Your Shortlist</Text>
            <Text style={styles.authPromptSub}>
              Save your favorite royal convention halls, mandapams, and catering packages to access them across all your devices.
            </Text>
            <TouchableOpacity
              style={styles.authPromptBtn}
              onPress={() => openAuthModal()}
              activeOpacity={0.85}
            >
              <Sparkles size={16} color="#09090B" />
              <Text style={styles.authPromptBtnText}>Sign In / Join UtsavHub</Text>
            </TouchableOpacity>
          </View>
        ) : category === 'wishlist' && businesses.length === 0 && !loading ? (
          <View style={styles.emptyWishlistCard}>
            <View style={styles.emptyIconCircle}>
              <Heart size={36} color="#C5A059" />
            </View>
            <Text style={styles.emptyWishlistTitle}>Your Wishlist is Empty</Text>
            <Text style={styles.emptyWishlistSub}>
              Tap the heart icon on any convention hall, decorator, or caterer to save them to your personal wedding shortlist.
            </Text>
            <TouchableOpacity
              style={styles.exploreBtn}
              onPress={() => setCategory('all')}
              activeOpacity={0.85}
            >
              <Text style={styles.exploreBtnText}>Explore All Verified Services</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <ShimmerSkeleton count={3} />
        ) : businesses.length > 0 ? (
          businesses.map((biz) => (
            <ListingCard
              key={biz.id}
              business={biz}
              date={date}
              isWishlisted={wishlistIds.includes(biz.id)}
              onToggleWishlist={async () => {
                if (!isLoggedIn || !currentUser) {
                  openAuthModal();
                  return;
                }
                const uid = currentUser.id || currentUser.phone || currentUser.email || '';
                const isNowSaved = await toggleUserWishlist(uid, biz.id);
                setWishlistIds((prev) =>
                  isNowSaved ? [...prev, biz.id] : prev.filter((id) => id !== biz.id)
                );
                if (category === 'wishlist' && !isNowSaved) {
                  setBusinesses((prev) => prev.filter((b) => b.id !== biz.id));
                }
              }}
              onPress={() => onSelectVendor(biz.id, date, guests)}
            />
          ))
        ) : (
          <View style={styles.emptyCard}>
            <AlertCircle size={36} color="#D4AF37" />
            <Text style={styles.emptyTitle}>No Matches for this Criteria</Text>
            <Text style={styles.emptySub}>
              Venues are booked on {date} or do not accommodate {guests} guests.
            </Text>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => {
                setDate('2026-11-20');
                setAcOnly(false);
                setOutsideCatering(false);
                setCategory('all');
              }}
            >
              <Text style={styles.resetBtnText}>Switch to Nov 20, 2026</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  backBtn: {
    padding: 6,
    flexShrink: 0,
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginHorizontal: 4,
  },
  filterBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  activePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  toggleBtnActive: {
    backgroundColor: THEME.colors.accentDark,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 8,
  },
  catBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    shadowColor: '#0B0B0E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  catBtnActive: {
    backgroundColor: '#0B0B0E',
    borderColor: '#0B0B0E',
  },
  catBtnText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  catBtnTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    flex: 1,
  },
  gatekeeperBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 10,
    borderRadius: 14,
  },
  gatekeeperTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },
  gatekeeperSub: {
    fontSize: 11.5,
    color: '#15803D',
    marginTop: 2,
  },
  blockedBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  blockedBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#B45309',
  },
  resultsCountRow: {
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 4,
  },
  resultsCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#EFE8DA',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 17.5,
    fontWeight: '800',
    color: '#1E293B',
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  resetBtn: {
    backgroundColor: THEME.colors.accentDark,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 14,
    marginTop: 10,
  },
  resetBtnText: {
    fontFamily: THEME.fonts.bold,
    color: '#FFFFFF',
    fontSize: 13.5,
  },
  authPromptCard: {
    backgroundColor: '#09090B',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  authPromptIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#18181B',
    borderWidth: 1.5,
    borderColor: 'rgba(197, 160, 89, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  authPromptTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  authPromptSub: {
    fontSize: 14,
    color: '#A1A1AA',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  authPromptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#C5A059',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    width: '100%',
  },
  authPromptBtnText: {
    color: '#09090B',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  emptyWishlistCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FDFBF7',
    borderWidth: 1.5,
    borderColor: 'rgba(197, 160, 89, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyWishlistTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptyWishlistSub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  exploreBtn: {
    backgroundColor: '#09090B',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  exploreBtnText: {
    color: '#C5A059',
    fontSize: 14,
    fontWeight: '700',
  },
});
