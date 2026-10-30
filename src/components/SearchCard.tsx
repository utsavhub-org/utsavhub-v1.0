import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { MapPin, Calendar, Users, Search, ChevronRight, X, Check } from 'lucide-react-native';
import MuhurthamCalendar, { HINDU_MUHURTHAMS } from './MuhurthamCalendar';
import { THEME } from '../theme/colors';

const LOCALITIES = [
  'Visakhapatnam (All Areas)',
  'Madhurawada, NH16 Highway',
  'Rushikonda Beach Road',
  'MVP Colony, Sector 3',
  'Dwaraka Nagar, Main Road',
  'Gajuwaka Main Road',
  'Siripuram Junction',
];

const DATES = [
  { label: 'Nov 20, 2026', sub: 'Auspicious Muhurtham', value: '2026-11-20' },
  { label: 'Dec 14, 2026', sub: 'Peak Winter Muhurtham', value: '2026-12-14' },
  { label: 'Dec 25, 2026', sub: 'Holiday Season', value: '2026-12-25' },
  { label: 'Jan 15, 2027', sub: 'Sankranti Auspicious', value: '2027-01-15' },
];

const GUEST_OPTIONS = [150, 300, 500, 800, 1200];

interface SearchCardProps {
  onSearch: (params: { location: string; date: string; guests: number }) => void;
}

export default function SearchCard({ onSearch }: SearchCardProps) {
  const [location, setLocation] = useState('Visakhapatnam');
  const [selectedDate, setSelectedDate] = useState('2026-11-20');
  const [selectedGuests, setSelectedGuests] = useState<number>(300);

  const [localityModalVisible, setLocalityModalVisible] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [guestModalVisible, setGuestModalVisible] = useState(false);

  const handleSearchPress = () => {
    const cleanLoc = location.replace(' (All Areas)', '');
    onSearch({
      location: cleanLoc === 'Visakhapatnam' ? '' : cleanLoc,
      date: selectedDate,
      guests: selectedGuests,
    });
  };

  const currentMuhurtham = HINDU_MUHURTHAMS[selectedDate];
  const dateFormatted = new Date(selectedDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <View style={styles.cardContainer}>
      {/* Segment 1: Where */}
      <TouchableOpacity
        style={styles.searchRow}
        onPress={() => setLocalityModalVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.iconBox}>
          <MapPin size={16} color={THEME.colors.textPrimary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowLabel}>WHERE</Text>
          <Text style={styles.rowValue} numberOfLines={1}>{location}</Text>
        </View>
        <ChevronRight size={16} color={THEME.colors.textMuted} />
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* Segment 2: When */}
      <TouchableOpacity
        style={styles.searchRow}
        onPress={() => setDateModalVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.iconBox}>
          <Calendar size={16} color={THEME.colors.textPrimary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowLabel}>WHEN</Text>
          <Text style={styles.rowValue} numberOfLines={1}>
            {dateFormatted}
            {currentMuhurtham ? ` · ${currentMuhurtham.name}` : ''}
          </Text>
        </View>
        <ChevronRight size={16} color={THEME.colors.textMuted} />
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* Segment 3: Guests */}
      <TouchableOpacity
        style={styles.searchRow}
        onPress={() => setGuestModalVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.iconBox}>
          <Users size={16} color={THEME.colors.textPrimary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowLabel}>GUESTS</Text>
          <Text style={styles.rowValue}>{selectedGuests} Guests Capacity</Text>
        </View>
        <ChevronRight size={16} color={THEME.colors.textMuted} />
      </TouchableOpacity>

      {/* Primary Search CTA */}
      <TouchableOpacity
        style={styles.searchBtn}
        onPress={handleSearchPress}
        activeOpacity={0.85}
      >
        <Search size={16} color="#FFFFFF" />
        <Text style={styles.searchBtnText}>Search Venues & Vendors</Text>
      </TouchableOpacity>

      {/* Locality Modal */}
      <Modal visible={localityModalVisible} transparent animationType="fade" onRequestClose={() => setLocalityModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Destination</Text>
              <TouchableOpacity onPress={() => setLocalityModalVisible(false)}>
                <X size={18} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 320 }}>
              {LOCALITIES.map((loc) => (
                <TouchableOpacity
                  key={loc}
                  style={styles.modalRow}
                  onPress={() => {
                    setLocation(loc);
                    setLocalityModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalRowText, location === loc && styles.modalRowActive]}>
                    {loc}
                  </Text>
                  {location === loc && <Check size={16} color={THEME.colors.textPrimary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Interactive Hindu Muhurtham Calendar Modal */}
      <Modal
        visible={dateModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDateModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { padding: 0, overflow: 'hidden', maxWidth: 440 }]}>
            <MuhurthamCalendar
              initialDate={selectedDate}
              onSelectDate={(date) => {
                setSelectedDate(date);
                setDateModalVisible(false);
              }}
              onClose={() => setDateModalVisible(false)}
            />
          </View>
        </View>
      </Modal>

      {/* Guests Modal */}
      <Modal visible={guestModalVisible} transparent animationType="fade" onRequestClose={() => setGuestModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Guest Capacity</Text>
              <TouchableOpacity onPress={() => setGuestModalVisible(false)}>
                <X size={18} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={{ gap: 8, paddingVertical: 8 }}>
              {GUEST_OPTIONS.map((num) => (
                <TouchableOpacity
                  key={num}
                  style={styles.modalRow}
                  onPress={() => {
                    setSelectedGuests(num);
                    setGuestModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalRowText, selectedGuests === num && styles.modalRowActive]}>
                    {num} Guests
                  </Text>
                  {selectedGuests === num && <Check size={16} color={THEME.colors.textPrimary} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 12,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: THEME.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontFamily: THEME.fonts.bold,
    fontSize: 10,
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
  },
  rowValue: {
    fontFamily: THEME.fonts.bold,
    fontSize: 14,
    color: THEME.colors.textPrimary,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginHorizontal: 12,
  },
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: THEME.colors.accentDark,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 8,
  },
  searchBtnText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    marginBottom: 8,
  },
  modalTitle: {
    fontFamily: THEME.fonts.bold,
    fontSize: 16,
    color: THEME.colors.textPrimary,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  modalRowText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 14,
    color: THEME.colors.textSecondary,
  },
  modalRowActive: {
    fontFamily: THEME.fonts.bold,
    color: THEME.colors.textPrimary,
  },
  modalRowSub: {
    fontFamily: THEME.fonts.regular,
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
});
