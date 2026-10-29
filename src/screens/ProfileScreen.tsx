import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import {
  User,
  Heart,
  Calendar,
  Utensils,
  MessageCircle,
  ShieldCheck,
  Phone,
  MapPin,
  Bell,
  ChevronRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react-native';

interface ProfileScreenProps {
  onNavigateToWishlist: () => void;
  onNavigateToBookings: () => void;
  onNavigateToExplore: () => void;
}

export default function ProfileScreen({
  onNavigateToWishlist,
  onNavigateToBookings,
  onNavigateToExplore,
}: ProfileScreenProps) {
  const handleSupportWhatsApp = () => {
    const url = 'whatsapp://send?phone=919848012345&text=Hi%20UtsavHub%20Concierge%2C%20I%20need%20help%20with%20my%20wedding%20venue%20booking';
    Linking.openURL(url).catch(() => {
      Linking.openURL('https://wa.me/919848012345');
    });
  };

  const handleSupportCall = () => {
    Linking.openURL('tel:18004259988');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 80 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <User size={34} color="#D4AF37" />
        </View>
        <Text style={styles.userName}>Ananya & Rahul</Text>
        <Text style={styles.userSub}>Visakhapatnam • Muhurtham in Nov 2026</Text>

        <View style={styles.verifiedRow}>
          <CheckCircle2 size={13} color="#059669" />
          <Text style={styles.verifiedText}>+91 98480 12345 (Verified)</Text>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsCard}>
          <TouchableOpacity
            style={styles.statCol}
            onPress={onNavigateToBookings}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>2</Text>
            <Text style={styles.statLabel}>Venue Holds</Text>
          </TouchableOpacity>

          <View style={styles.statDivider} />

          <TouchableOpacity
            style={styles.statCol}
            onPress={onNavigateToWishlist}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Wishlisted</Text>
          </TouchableOpacity>

          <View style={styles.statDivider} />

          <TouchableOpacity
            style={styles.statCol}
            onPress={onNavigateToExplore}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>1</Text>
            <Text style={styles.statLabel}>Quote Saved</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Section 1: Wedding Planning */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>MY WEDDING PLANNING</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={onNavigateToWishlist}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconCircle, { backgroundColor: '#FFE4E6' }]}>
            <Heart size={18} color="#E11D48" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>My Saved Wishlist</Text>
            <Text style={styles.menuSub}>3 Halls & Mandapams favorited</Text>
          </View>
          <ChevronRight size={18} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={onNavigateToBookings}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconCircle, { backgroundColor: '#FEF3C7' }]}>
            <Calendar size={18} color="#D4AF37" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>My Active Holds & Bookings</Text>
            <Text style={styles.menuSub}>2 auspicious dates locked</Text>
          </View>
          <ChevronRight size={18} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={onNavigateToExplore}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconCircle, { backgroundColor: '#DCFCE7' }]}>
            <Utensils size={18} color="#059669" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Plate Cost Calculator</Text>
            <Text style={styles.menuSub}>Interactive per-plate menu estimator</Text>
          </View>
          <ChevronRight size={18} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* Section 2: Trust & Support */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>CONCIERGE & TRUST</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleSupportWhatsApp}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconCircle, { backgroundColor: '#D1FAE5' }]}>
            <MessageCircle size={18} color="#059669" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Direct WhatsApp Concierge</Text>
            <Text style={styles.menuSub}>Talk directly with our local coordinator</Text>
          </View>
          <ChevronRight size={18} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleSupportCall}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconCircle, { backgroundColor: '#F1F5F9' }]}>
            <Phone size={18} color="#334155" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Helpline: 1800-425-9988</Text>
            <Text style={styles.menuSub}>Toll-free 9 AM – 9 PM daily</Text>
          </View>
          <ChevronRight size={18} color="#94A3B8" />
        </TouchableOpacity>

        <View style={styles.menuItem}>
          <View style={[styles.menuIconCircle, { backgroundColor: '#FFFBEB' }]}>
            <ShieldCheck size={18} color="#D4AF37" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Date-Hold Guarantee Policy</Text>
            <Text style={styles.menuSub}>100% verified venue manager contracts</Text>
          </View>
        </View>
      </View>

      {/* Section 3: Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>PREFERENCES</Text>

        <View style={styles.menuItem}>
          <View style={[styles.menuIconCircle, { backgroundColor: '#F8FAFC' }]}>
            <MapPin size={18} color="#64748B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Selected City</Text>
            <Text style={styles.menuSub}>Visakhapatnam, Andhra Pradesh</Text>
          </View>
        </View>

        <View style={styles.menuItem}>
          <View style={[styles.menuIconCircle, { backgroundColor: '#F8FAFC' }]}>
            <Bell size={18} color="#64748B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>WhatsApp & SMS Alerts</Text>
            <Text style={styles.menuSub}>Instant date availability alerts enabled</Text>
          </View>
        </View>
      </View>

      {/* App Version Stamp */}
      <View style={styles.footerBox}>
        <View style={styles.footerLogoRow}>
          <Sparkles size={14} color="#D4AF37" />
          <Text style={styles.footerBrand}>UtsavHub</Text>
        </View>
        <Text style={styles.footerVersion}>Version 1.2.0 • Made for Andhra Wedding Celebrations</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 10,
  },
  userName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  userSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    paddingVertical: 14,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  menuIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  menuSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  footerBox: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 4,
  },
  footerLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerBrand: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  footerVersion: {
    fontSize: 12,
    color: '#94A3B8',
  },
});
