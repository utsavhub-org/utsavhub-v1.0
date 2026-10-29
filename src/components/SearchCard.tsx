import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
} from 'react-native';
import { MapPin, Calendar, Users, Search, Sparkles, Check, ChevronDown, X } from 'lucide-react-native';

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
  { label: 'Nov 20, 2026 (Auspicious)', value: '2026-11-20' },
  { label: 'Dec 14, 2026 (Peak Muhurtham)', value: '2026-12-14' },
  { label: 'Dec 25, 2026 (Holiday Season)', value: '2026-12-25' },
  { label: 'Jan 15, 2027 (Sankranti Auspicious)', value: '2027-01-15' },
];

const GUEST_OPTIONS = [
  { label: '50-100', value: 100 },
  { label: '100-300', value: 300 },
  { label: '300-500', value: 500 },
  { label: '500-1000', value: 800 },
  { label: '1000+', value: 1200 },
];

interface SearchCardProps {
  onSearch: (params: { location: string; date: string; guests: number }) => void;
}

export default function SearchCard({ onSearch }: SearchCardProps) {
  const [location, setLocation] = useState('Visakhapatnam (All Areas)');
  const [selectedDate, setSelectedDate] = useState('2026-11-20');
  const [selectedGuests, setSelectedGuests] = useState<number>(300);

  const [localityModalVisible, setLocalityModalVisible] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState(false);

  const handleSearchPress = () => {
    const cleanLoc = location.replace(' (All Areas)', '');
    onSearch({
      location: cleanLoc === 'Visakhapatnam' ? '' : cleanLoc,
      date: selectedDate,
      guests: selectedGuests,
    });
  };

  const buttonScale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const selectedDateLabel =
    DATES.find((d) => d.value === selectedDate)?.label || selectedDate;

  return (
    <View style={styles.card}>
      {/* Field 1: Locality */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>EVENT LOCALITY</Text>
        <TouchableOpacity
          style={styles.inputBox}
          onPress={() => setLocalityModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.inputLeft}>
            <MapPin size={16} color="#D4AF37" />
            <Text style={styles.inputText} numberOfLines={1}>
              {location}
            </Text>
          </View>
          <ChevronDown size={16} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Field 2: Date */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>EVENT DATE (MUHURTHAM)</Text>
        <TouchableOpacity
          style={styles.inputBox}
          onPress={() => setDateModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.inputLeft}>
            <Calendar size={16} color="#D4AF37" />
            <Text style={styles.inputText} numberOfLines={1}>
              {selectedDateLabel}
            </Text>
          </View>
          <ChevronDown size={16} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Field 3: Guest Capacity Quick Chips */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>EXPECTED GUEST COUNT</Text>
        <View style={styles.chipsRow}>
          {GUEST_OPTIONS.map((opt) => {
            const isSelected = selectedGuests === opt.value;
            return (
              <TouchableOpacity
                key={opt.label}
                onPress={() => setSelectedGuests(opt.value)}
                style={[
                  styles.chip,
                  isSelected && styles.chipSelected,
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.chipText,
                    isSelected && styles.chipTextSelected,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Search CTA Button with Spring Micro-Animation */}
      <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearchPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          <Search size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.searchButtonText}>
            Search Available Venues & Services
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Locality Selector Modal */}
      <Modal visible={localityModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Event Locality</Text>
              <TouchableOpacity onPress={() => setLocalityModalVisible(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 350 }}>
              {LOCALITIES.map((loc) => (
                <TouchableOpacity
                  key={loc}
                  style={styles.modalItem}
                  onPress={() => {
                    setLocation(loc);
                    setLocalityModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, location === loc && styles.modalItemActive]}>
                    {loc}
                  </Text>
                  {location === loc && <Check size={16} color="#D4AF37" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date Selector Modal */}
      <Modal visible={dateModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Auspicious Muhurtham</Text>
              <TouchableOpacity onPress={() => setDateModalVisible(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 350 }}>
              {DATES.map((d) => (
                <TouchableOpacity
                  key={d.value}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedDate(d.value);
                    setDateModalVisible(false);
                  }}
                >
                  <View>
                    <Text style={[styles.modalItemText, selectedDate === d.value && styles.modalItemActive]}>
                      {d.label}
                    </Text>
                    <Text style={styles.modalSubText}>Date: {d.value}</Text>
                  </View>
                  {selectedDate === d.value && <Check size={16} color="#D4AF37" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFBEB',
    padding: 9,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  bannerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bannerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  bannerSubtitle: {
    fontSize: 11.5,
    color: '#78350F',
    marginTop: 2,
  },
  fieldContainer: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  inputText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 62,
  },
  chipSelected: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4AF37',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginTop: 8,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  modalItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#334155',
  },
  modalItemActive: {
    color: '#B89324',
    fontWeight: '700',
  },
  modalSubText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 3,
  },
});
