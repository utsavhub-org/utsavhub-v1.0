import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  ActivityIndicator,
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
  CalendarCheck,
  Sparkles,
  AlertCircle,
  XCircle,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { getCustomerBookings } from '../lib/supabaseClient';
import { THEME } from '../theme/colors';

interface MyBookingsScreenProps {
  onExploreMore: () => void;
  onSelectVendor?: (vendorId: string) => void;
}

export default function MyBookingsScreen({ onExploreMore, onSelectVendor }: MyBookingsScreenProps) {
  const { currentUser, isLoggedIn, openAuthModal } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'confirmed' | 'under_review'>('all');

  const loadLiveBookings = async () => {
    if (!currentUser) {
      setBookings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const identifier = currentUser.phone || currentUser.email || '';
    const liveData = await getCustomerBookings(identifier);
    setBookings(liveData);
    setLoading(false);
  };

  useEffect(() => {
    loadLiveBookings();
  }, [currentUser]);

  // 1. Logged Out State: Prompt to Login
  if (!isLoggedIn || !currentUser) {
    return (
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.screenTitle}>My Bookings</Text>
          <Text style={styles.screenSub}>Auspicious Dates & Venue Holds</Text>
        </View>

        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <CalendarCheck size={40} color={THEME.colors.gold} />
          </View>
          <Text style={styles.emptyTitle}>Sign In to View Your Bookings</Text>
          <Text style={styles.emptySub}>
            Log in with your phone number or Google account to track your Muhurtham date holds, check vendor confirmations, and view detailed wedding contracts.
          </Text>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={openAuthModal}
            activeOpacity={0.85}
          >
            <Text style={styles.loginBtnText}>Sign In / Join UtsavHub</Text>
            <ArrowRight size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 2. Filter bookings
  const filteredBookings = bookings.filter((b) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'confirmed') return b.status === 'approved' || b.status === 'confirmed';
    if (activeFilter === 'under_review') return b.status === 'pending' || b.status === 'under_review';
    return true;
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
        <View>
          <Text style={styles.screenTitle}>My Bookings</Text>
          <Text style={styles.screenSub}>Auspicious Dates & Venue Holds</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadLiveBookings}>
          <Text style={styles.refreshBtnText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeFilter === 'all' && styles.tabBtnActive]}
          onPress={() => setActiveFilter('all')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabBtnText, activeFilter === 'all' && styles.tabBtnTextActive]}>
            All ({bookings.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeFilter === 'confirmed' && styles.tabBtnActive]}
          onPress={() => setActiveFilter('confirmed')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabBtnText, activeFilter === 'confirmed' && styles.tabBtnTextActive]}>
            Confirmed ({bookings.filter((b) => b.status === 'approved' || b.status === 'confirmed').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeFilter === 'under_review' && styles.tabBtnActive]}
          onPress={() => setActiveFilter('under_review')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabBtnText, activeFilter === 'under_review' && styles.tabBtnTextActive]}>
            Pending ({bookings.filter((b) => b.status === 'pending' || b.status === 'under_review').length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.colors.gold} />
          <Text style={styles.loadingText}>Fetching live booking inquiries from Supabase...</Text>
        </View>
      ) : filteredBookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Calendar size={38} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>No Booking Holds Found</Text>
          <Text style={styles.emptySub}>
            You haven't requested any date holds yet. Browse our verified Kalyana Mandapams, modular floral decor stages, and royal catering menus.
          </Text>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={onExploreMore}
            activeOpacity={0.85}
          >
            <Text style={styles.loginBtnText}>Explore Vendors & Halls</Text>
            <ArrowRight size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {filteredBookings.map((booking) => {
            const isConfirmed = booking.status === 'approved' || booking.status === 'confirmed';
            const isRejected = booking.status === 'rejected';

            return (
              <View key={booking.id} style={styles.bookingCard}>
                {/* Image & Status Tag */}
                <View style={styles.cardCoverWrapper}>
                  <Image source={{ uri: booking.image }} style={styles.cardCover} />
                  <View
                    style={[
                      styles.statusBadge,
                      isConfirmed
                        ? styles.statusBadgeConfirmed
                        : isRejected
                        ? styles.statusBadgeRejected
                        : styles.statusBadgePending,
                    ]}
                  >
                    {isConfirmed ? (
                      <CheckCircle2 size={12} color="#059669" />
                    ) : isRejected ? (
                      <XCircle size={12} color="#E11D48" />
                    ) : (
                      <Clock size={12} color="#D97706" />
                    )}
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isConfirmed
                          ? styles.statusBadgeTextConfirmed
                          : isRejected
                          ? styles.statusBadgeTextRejected
                          : styles.statusBadgeTextPending,
                      ]}
                    >
                      {booking.statusLabel}
                    </Text>
                  </View>
                </View>

                {/* Card Content */}
                <View style={styles.cardBody}>
                  <Text style={styles.venueName}>{booking.name}</Text>
                  <View style={styles.localityRow}>
                    <MapPin size={12} color="#64748B" />
                    <Text style={styles.localityText}>{booking.locality}</Text>
                  </View>

                  <View style={styles.infoGrid}>
                    <View style={styles.infoCol}>
                      <Text style={styles.infoLabel}>EVENT DATE</Text>
                      <View style={styles.infoValueRow}>
                        <Calendar size={13} color={THEME.colors.gold} />
                        <Text style={styles.infoValue}>{booking.date}</Text>
                      </View>
                      <Text style={styles.muhurthamSub}>{booking.muhurthamLabel}</Text>
                    </View>

                    <View style={styles.infoDivider} />

                    <View style={styles.infoCol}>
                      <Text style={styles.infoLabel}>GUESTS & QUOTE</Text>
                      <View style={styles.infoValueRow}>
                        <Users size={13} color="#64748B" />
                        <Text style={styles.infoValue}>{booking.guests} Guests</Text>
                      </View>
                      <Text style={styles.amountText}>{booking.amount}</Text>
                    </View>
                  </View>

                  {booking.notes ? (
                    <View style={styles.notesBox}>
                      <Text style={styles.notesText} numberOfLines={2}>
                        "{booking.notes}"
                      </Text>
                    </View>
                  ) : null}

                  {/* Action Buttons */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.whatsappBtn}
                      onPress={() => handleWhatsApp(booking.whatsapp, booking.name, booking.date)}
                      activeOpacity={0.8}
                    >
                      <MessageCircle size={14} color="#FFFFFF" />
                      <Text style={styles.whatsappBtnText}>WhatsApp Manager</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.callBtn}
                      onPress={() => handleCall(booking.phone)}
                      activeOpacity={0.8}
                    >
                      <Phone size={14} color="#0F172A" />
                    </TouchableOpacity>

                    {onSelectVendor && (
                      <TouchableOpacity
                        style={styles.detailsBtn}
                        onPress={() => onSelectVendor(booking.vendorId)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.detailsBtnText}>View Hall</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.canvas,
  },
  topBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  screenTitle: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 20,
    color: THEME.colors.textPrimary,
  },
  screenSub: {
    fontFamily: THEME.fonts.regular,
    fontSize: 12.5,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  refreshBtn: {
    backgroundColor: THEME.colors.surface,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  refreshBtnText: {
    fontFamily: THEME.fonts.semiBold,
    fontSize: 11.5,
    color: THEME.colors.accentDark,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  tabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  tabBtnActive: {
    backgroundColor: THEME.colors.accentDark,
    borderColor: THEME.colors.accentDark,
  },
  tabBtnText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  tabBtnTextActive: {
    fontFamily: THEME.fonts.bold,
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 13,
    color: THEME.colors.textMuted,
    marginTop: 12,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FAF6ED',
    borderWidth: 1.5,
    borderColor: 'rgba(197, 160, 89, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 19,
    color: THEME.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySub: {
    fontFamily: THEME.fonts.regular,
    fontSize: 13,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 320,
    marginBottom: 24,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: THEME.colors.accentDark,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loginBtnText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
    padding: 16,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardCoverWrapper: {
    height: 140,
    position: 'relative',
  },
  cardCover: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusBadgeConfirmed: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusBadgePending: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusBadgeRejected: {
    backgroundColor: '#FFE4E6',
    borderWidth: 1,
    borderColor: '#FDA4AF',
  },
  statusBadgeText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 11,
  },
  statusBadgeTextConfirmed: {
    color: '#065F46',
  },
  statusBadgeTextPending: {
    color: '#B45309',
  },
  statusBadgeTextRejected: {
    color: '#BE123C',
  },
  cardBody: {
    padding: 16,
  },
  venueName: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 17,
    color: THEME.colors.textPrimary,
  },
  localityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    marginBottom: 12,
  },
  localityText: {
    fontFamily: THEME.fonts.regular,
    fontSize: 12,
    color: '#64748B',
  },
  infoGrid: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 12,
  },
  infoCol: {
    flex: 1,
  },
  infoDivider: {
    width: 1,
    backgroundColor: THEME.colors.border,
    marginHorizontal: 12,
  },
  infoLabel: {
    fontFamily: THEME.fonts.bold,
    fontSize: 9.5,
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  infoValue: {
    fontFamily: THEME.fonts.bold,
    fontSize: 13,
    color: THEME.colors.textPrimary,
  },
  muhurthamSub: {
    fontFamily: THEME.fonts.regular,
    fontSize: 10.5,
    color: THEME.colors.goldDark,
    marginTop: 2,
  },
  amountText: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 13.5,
    color: '#059669',
    marginTop: 2,
  },
  notesBox: {
    backgroundColor: '#FAF6ED',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: THEME.colors.gold,
  },
  notesText: {
    fontFamily: THEME.fonts.regular,
    fontSize: 11.5,
    color: '#78350F',
    fontStyle: 'italic',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  whatsappBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#25D366',
    borderRadius: 12,
    paddingVertical: 10,
  },
  whatsappBtnText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  detailsBtnText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 12,
    color: THEME.colors.textPrimary,
  },
});
