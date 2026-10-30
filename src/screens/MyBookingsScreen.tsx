import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native';
import {
  Calendar,
  Users,
  MapPin,
  CheckCircle2,
  Clock,
  MessageCircle,
  Phone,
  FileText,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react-native';
import { THEME } from '../theme/colors';

interface MyBookingsScreenProps {
  onExploreMore: () => void;
  onSelectVendor?: (vendorId: string) => void;
}

const MOCK_BOOKINGS = [
  {
    id: 'UH-2026-8942',
    vendorId: 'venue-1',
    name: 'Sri Venkateswara Grand AC Hall',
    locality: 'Madhurawada, NH16 Highway',
    image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=80',
    date: 'Nov 20, 2026',
    muhurthamLabel: 'Shukla Paksha Auspicious Muhurtham',
    guests: 500,
    amount: '₹1,80,000',
    status: 'confirmed',
    phone: '+919848011223',
    whatsapp: '919848011223',
    statusLabel: 'Date Hold Confirmed',
  },
  {
    id: 'UH-2026-9104',
    vendorId: 'venue-2',
    name: 'Royal Orchid Mandapam & AC Convention',
    locality: 'Rushikonda Beach Road',
    image: 'https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?auto=format&fit=crop&w=600&q=80',
    date: 'Dec 14, 2026',
    muhurthamLabel: 'Peak Winter Muhurtham',
    guests: 800,
    amount: '₹2,50,000',
    status: 'under_review',
    phone: '+919848044556',
    whatsapp: '919848044556',
    statusLabel: 'Inquiry Under Review',
  },
];

export default function MyBookingsScreen({ onExploreMore, onSelectVendor }: MyBookingsScreenProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'confirmed' | 'under_review'>('all');

  const filteredBookings = MOCK_BOOKINGS.filter((b) => {
    if (activeFilter === 'all') return true;
    return b.status === activeFilter;
  });

  const handleWhatsApp = (number: string, name: string, date: string) => {
    const clean = number.replace(/\D/g, '');
    const msg = `Hi%20Manager%2C%20regarding%20my%20UtsavHub%20date%20hold%20for%20${encodeURIComponent(name)}%20on%20${date}`;
    Linking.openURL(`whatsapp://send?phone=${clean}&text=${msg}`).catch(() => {
      Linking.openURL(`https://wa.me/${clean}`);
    });
  };

  const handleCall = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.screenTitle}>My Bookings</Text>
        <Text style={styles.screenSub}>Auspicious Dates & Venue Holds</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeFilter === 'all' && styles.tabBtnActive]}
          onPress={() => setActiveFilter('all')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabBtnText, activeFilter === 'all' && styles.tabBtnTextActive]}>
            All ({MOCK_BOOKINGS.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeFilter === 'confirmed' && styles.tabBtnActive]}
          onPress={() => setActiveFilter('confirmed')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabBtnText, activeFilter === 'confirmed' && styles.tabBtnTextActive]}>
            Confirmed (1)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeFilter === 'under_review' && styles.tabBtnActive]}
          onPress={() => setActiveFilter('under_review')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabBtnText, activeFilter === 'under_review' && styles.tabBtnTextActive]}>
            Under Review (1)
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollList}
        contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredBookings.map((b) => {
          const isConfirmed = b.status === 'confirmed';

          return (
            <View key={b.id} style={styles.card}>
              {/* Header row with Status Pill */}
              <View style={styles.cardTopRow}>
                <View style={styles.idGroup}>
                  <FileText size={13} color="#64748B" />
                  <Text style={styles.bookingIdText}>{b.id}</Text>
                </View>

                <View style={[styles.statusPill, isConfirmed ? styles.statusConfirmed : styles.statusReview]}>
                  {isConfirmed ? (
                    <CheckCircle2 size={12} color="#059669" />
                  ) : (
                    <Clock size={12} color="#D97706" />
                  )}
                  <Text style={[styles.statusText, isConfirmed ? styles.statusTextConfirmed : styles.statusTextReview]}>
                    {b.statusLabel}
                  </Text>
                </View>
              </View>

              {/* Venue image + main details */}
              <TouchableOpacity
                style={styles.venueRow}
                onPress={() => onSelectVendor?.(b.vendorId)}
                activeOpacity={0.8}
              >
                <Image source={{ uri: b.image }} style={styles.venueThumb} />
                <View style={styles.venueInfo}>
                  <Text style={styles.venueName} numberOfLines={2}>
                    {b.name}
                  </Text>
                  <View style={styles.locRow}>
                    <MapPin size={12} color="#D4AF37" />
                    <Text style={styles.locText} numberOfLines={1}>{b.locality}</Text>
                  </View>
                  <Text style={styles.amountText}>{b.amount} <Text style={styles.amountSub}>est. total</Text></Text>
                </View>
              </TouchableOpacity>

              {/* Event specifications banner */}
              <View style={styles.specsBanner}>
                <View style={styles.specItem}>
                  <Calendar size={14} color="#D4AF37" />
                  <View>
                    <Text style={styles.specLabel}>EVENT DATE</Text>
                    <Text style={styles.specValue}>{b.date}</Text>
                    <Text style={styles.muhurthamSub}>{b.muhurthamLabel}</Text>
                  </View>
                </View>

                <View style={styles.specDivider} />

                <View style={styles.specItem}>
                  <Users size={14} color="#D4AF37" />
                  <View>
                    <Text style={styles.specLabel}>EXPECTED GUESTS</Text>
                    <Text style={styles.specValue}>{b.guests} Guests</Text>
                  </View>
                </View>
              </View>

              {/* Quick Actions */}
              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  style={styles.waBtn}
                  onPress={() => handleWhatsApp(b.whatsapp, b.name, b.date)}
                  activeOpacity={0.8}
                >
                  <MessageCircle size={15} color="#FFFFFF" />
                  <Text style={styles.waBtnText}>WhatsApp Manager</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => handleCall(b.phone)}
                  activeOpacity={0.8}
                >
                  <Phone size={14} color="#334155" />
                  <Text style={styles.callBtnText}>Call</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Guarantee Info Card */}
        <View style={styles.guaranteeBox}>
          <ShieldCheck size={22} color="#D4AF37" />
          <View style={{ flex: 1 }}>
            <Text style={styles.guaranteeTitle}>Double-Booking Protected</Text>
            <Text style={styles.guaranteeSub}>
              Dates held on UtsavHub are directly blocked in the venue manager diary.
            </Text>
          </View>
        </View>

        {/* Explore More CTA */}
        <TouchableOpacity style={styles.exploreMoreBtn} onPress={onExploreMore} activeOpacity={0.85}>
          <Text style={styles.exploreMoreText}>Hold Another Venue or Decorator</Text>
          <ArrowRight size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: '#FAF8F5',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  screenSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtnActive: {
    backgroundColor: THEME.colors.accentDark,
    borderColor: THEME.colors.accentDark,
  },
  tabBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  scrollList: {
    flex: 1,
    paddingTop: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    marginBottom: 16,
    shadowColor: '#0B0B0F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  idGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bookingIdText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusConfirmed: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  statusReview: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  statusTextConfirmed: {
    color: '#15803D',
  },
  statusTextReview: {
    color: '#B45309',
  },
  venueRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
  },
  venueThumb: {
    width: 75,
    height: 75,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
  },
  venueInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  venueName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 20,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    marginBottom: 4,
  },
  locText: {
    fontSize: 12,
    color: '#64748B',
  },
  amountText: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 16,
    color: THEME.colors.textPrimary,
  },
  amountSub: {
    fontSize: 11.5,
    fontWeight: '400',
    color: '#64748B',
  },
  specsBanner: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  specItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  specDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  specLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  specValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  muhurthamSub: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
    marginTop: 1,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  waBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 14,
  },
  waBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    borderRadius: 14,
  },
  callBtnText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFBEB',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    marginBottom: 16,
  },
  guaranteeTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#92400E',
  },
  guaranteeSub: {
    fontSize: 12,
    color: '#78350F',
    marginTop: 2,
    lineHeight: 16,
  },
  exploreMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  exploreMoreText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
});
