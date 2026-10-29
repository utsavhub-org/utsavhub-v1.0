import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Utensils, Users, Check, MessageCircle, FileText } from 'lucide-react-native';
import { CateringPackage, Business } from '../types';

interface CateringCalculatorProps {
  packages: CateringPackage[];
  business: Business;
  defaultGuests?: number;
  onTotalChange?: (amount: number, packageName: string) => void;
}

export default function CateringCalculator({
  packages,
  business,
  defaultGuests = 300,
  onTotalChange,
}: CateringCalculatorProps) {
  const [selectedPkgId, setSelectedPkgId] = useState<string>(packages[0]?.id || '');
  const [guests, setGuests] = useState<number>(defaultGuests);

  const currentPkg = packages.find((p) => p.id === selectedPkgId) || packages[0];
  const pricePerPlate = currentPkg ? currentPkg.price_per_plate : 450;
  const total = guests * pricePerPlate;

  const handleSlider = (val: number) => {
    const rounded = Math.round(val / 25) * 25;
    setGuests(rounded);
    if (onTotalChange && currentPkg) {
      onTotalChange(rounded * currentPkg.price_per_plate, currentPkg.package_name);
    }
  };

  const handleSelectPkg = (pkg: CateringPackage) => {
    setSelectedPkgId(pkg.id);
    if (onTotalChange) {
      onTotalChange(guests * pkg.price_per_plate, pkg.package_name);
    }
  };

  const handleWhatsAppQuote = () => {
    const cleanNum = business.whatsapp_number.replace(/\D/g, '');
    const url = `whatsapp://send?phone=${cleanNum}&text=Hi%2C%20I%20used%20the%20UtsavHub%20calculator%20for%20${guests}%20guests%20(${encodeURIComponent(currentPkg.package_name)})%20totaling%20₹${total.toLocaleString('en-IN')}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://wa.me/${cleanNum}`);
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Utensils size={16} color="#D4AF37" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Plate Cost Calculator</Text>
          <Text style={styles.subTitle}>
            Live pricing for {business.name}
          </Text>
        </View>
      </View>

      {/* Package Selector */}
      <Text style={styles.sectionLabel}>SELECT CATERING MENU</Text>
      <View style={styles.pkgRow}>
        {packages.map((pkg) => {
          const isSelected = pkg.id === selectedPkgId;
          return (
            <TouchableOpacity
              key={pkg.id}
              style={[styles.pkgCard, isSelected && styles.pkgCardActive]}
              onPress={() => handleSelectPkg(pkg)}
              activeOpacity={0.8}
            >
              <View style={styles.pkgTop}>
                <Text style={[styles.pkgName, isSelected && styles.pkgNameActive]} numberOfLines={1}>
                  {pkg.package_name}
                </Text>
                <View
                  style={[
                    styles.tag,
                    pkg.package_type === 'veg' ? styles.tagVeg : styles.tagNonVeg,
                  ]}
                >
                  <Text
                    style={[
                      styles.tagText,
                      pkg.package_type === 'veg' ? styles.tagTextVeg : styles.tagTextNonVeg,
                    ]}
                  >
                    {pkg.package_type.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.pkgPrice}>
                ₹{pkg.price_per_plate} <Text style={styles.pkgPriceSub}>/ plate</Text>
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Interactive Guest Slider */}
      <View style={styles.sliderBox}>
        <View style={styles.sliderHeader}>
          <View style={styles.sliderTitleRow}>
            <Users size={14} color="#D4AF37" />
            <Text style={styles.sliderTitle}>Guest Count Slider</Text>
          </View>
          <View style={styles.guestCountPill}>
            <Text style={styles.guestCountPillText}>{guests} Guests</Text>
          </View>
        </View>

        <Slider
          style={{ width: '100%', height: 40 }}
          minimumValue={100}
          maximumValue={1500}
          step={25}
          value={guests}
          onValueChange={handleSlider}
          minimumTrackTintColor="#D4AF37"
          maximumTrackTintColor="#CBD5E1"
          thumbTintColor="#D4AF37"
        />

        <View style={styles.sliderTicks}>
          <Text style={styles.tickText}>100</Text>
          <Text style={styles.tickText}>500</Text>
          <Text style={styles.tickText}>1000</Text>
          <Text style={styles.tickText}>1500+</Text>
        </View>

        {/* Live dynamic total calculation banner */}
        <View style={styles.calcBanner}>
          <View>
            <Text style={styles.calcFormulaText}>
              {guests} guests × ₹{pricePerPlate}/plate
            </Text>
            <Text style={styles.calcNoteText}>Includes live counters & staff</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.calcTotalLabel}>Calculated Total</Text>
            <Text style={styles.calcTotalValue}>
              ₹{total.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
      </View>

      {/* Itemized Dish Highlights */}
      {currentPkg && currentPkg.menu_highlights && (
        <View style={styles.menuBox}>
          <Text style={styles.sectionLabel}>
            INCLUDED DISHES ({currentPkg.package_name})
          </Text>
          <View style={styles.dishList}>
            {currentPkg.menu_highlights.map((dish, i) => (
              <View key={i} style={styles.dishItem}>
                <View style={styles.checkIcon}>
                  <Check size={11} color="#059669" />
                </View>
                <Text style={styles.dishText}>{dish}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* WhatsApp Quick CTA */}
      <TouchableOpacity
        style={styles.waBtn}
        onPress={handleWhatsAppQuote}
        activeOpacity={0.8}
      >
        <MessageCircle size={16} color="#FFFFFF" />
        <Text style={styles.waBtnText}>WhatsApp This Quote to Caterer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFE8DA',
    marginBottom: 20,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
  },
  subTitle: {
    fontSize: 12,
    color: '#64748B',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  pkgRow: {
    gap: 8,
    marginBottom: 16,
  },
  pkgCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 12,
  },
  pkgCardActive: {
    borderColor: '#D4AF37',
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
  },
  pkgTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pkgName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 6,
  },
  pkgNameActive: {
    color: '#92400E',
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tagVeg: {
    backgroundColor: '#DCFCE7',
  },
  tagNonVeg: {
    backgroundColor: '#FFE4E6',
  },
  tagText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  tagTextVeg: {
    color: '#166534',
  },
  tagTextNonVeg: {
    color: '#9F1239',
  },
  pkgPrice: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#0F172A',
  },
  pkgPriceSub: {
    fontSize: 12.5,
    fontWeight: '400',
    color: '#64748B',
  },
  sliderBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sliderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sliderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  guestCountPill: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  guestCountPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  sliderTicks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  tickText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  calcBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 11,
    borderWidth: 1,
    borderColor: '#EFE8DA',
    flexWrap: 'wrap',
    gap: 8,
  },
  calcFormulaText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
  },
  calcNoteText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  calcTotalLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  calcTotalValue: {
    fontSize: 18.5,
    fontWeight: '900',
    color: '#1E293B',
  },
  menuBox: {
    marginBottom: 16,
  },
  dishList: {
    gap: 6,
  },
  dishItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    padding: 9,
    borderRadius: 12,
  },
  checkIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dishText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  waBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 13,
    borderRadius: 16,
  },
  waBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
