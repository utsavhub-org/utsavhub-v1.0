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
} from 'lucide-react-native';
import ListingCard from '../components/ListingCard';
import { getFilteredBusinesses } from '../lib/supabaseClient';
import { Business } from '../types';

interface ListingsScreenProps {
  initialLocation?: string;
  initialDate?: string;
  initialGuests?: number;
  initialCategory?: string;
  onBack: () => void;
  onSelectVendor: (id: string, date: string, guests: number) => void;
}

export default function ListingsScreen({
  initialLocation = '',
  initialDate = '2026-11-20',
  initialGuests = 300,
  initialCategory = 'all',
  onBack,
  onSelectVendor,
}: ListingsScreenProps) {
  const [location, setLocation] = useState(initialLocation);
  const [date, setDate] = useState(initialDate);
  const [guests, setGuests] = useState<number>(initialGuests);
  const [category, setCategory] = useState(initialCategory);
  const [acOnly, setAcOnly] = useState(false);
  const [outsideCatering, setOutsideCatering] = useState(false);

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [blockedCount, setBlockedCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await getFilteredBusinesses({
        location,
        date,
        guests,
        category,
        acOnly,
        outsideCatering,
      });
      setBusinesses(res.businesses);
      setBlockedCount(res.blockedCount);
      setLoading(false);
    }
    load();
  }, [location, date, guests, category, acOnly, outsideCatering]);

  return (
    <View style={styles.screen}>
      {/* Top App Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ChevronLeft size={22} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {category === 'wishlist' ? 'My Saved Wishlist' : 'Available Verified Listings'}
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

        {/* Category Pills (Horizontally Scrollable) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {[
            { id: 'all', label: 'All Services' },
            { id: 'venue', label: 'AC Halls' },
            { id: 'catering', label: 'Catering' },
            { id: 'decoration', label: 'Decor' },
          ].map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catBtn, category === cat.id && styles.catBtnActive]}
              onPress={() => setCategory(cat.id)}
            >
              <Text
                style={[
                  styles.catBtnText,
                  category === cat.id && styles.catBtnTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
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
            {businesses.length} Verified Providers Found
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#D4AF37" />
            <Text style={styles.loadingText}>Syncing live availability...</Text>
          </View>
        ) : businesses.length > 0 ? (
          businesses.map((biz) => (
            <ListingCard
              key={biz.id}
              business={biz}
              date={date}
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
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    padding: 6,
    flexShrink: 0,
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginHorizontal: 4,
  },
  filterBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  activePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  toggleBtnActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  categoryScroll: {
    paddingHorizontal: 12,
    gap: 8,
    marginTop: 8,
  },
  catBtn: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  catBtnActive: {
    backgroundColor: '#D4AF37',
  },
  catBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
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
    backgroundColor: '#D4AF37',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 14,
    marginTop: 10,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
});
