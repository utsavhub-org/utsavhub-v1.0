import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Sparkles, ShoppingBag, ArrowRight } from 'lucide-react-native';
import { useQuotationCart } from '../context/QuotationCartContext';
import { THEME } from '../theme/colors';
import { playButtonClick } from '../lib/soundManager';

interface QuotationFloatingBarProps {
  onPress: () => void;
}

export default function QuotationFloatingBar({ onPress }: QuotationFloatingBarProps) {
  const { cartCount, totalCartAmount, vendorNameInCart } = useQuotationCart();

  if (cartCount === 0) return null;

  return (
    <View style={styles.floatingWrapper}>
      <TouchableOpacity
        style={styles.floatingBar}
        onPress={() => {
          playButtonClick();
          onPress();
        }}
        activeOpacity={0.9}
      >
        <View style={styles.leftMeta}>
          <View style={styles.bagIconWrap}>
            <ShoppingBag size={18} color="#D4AF37" />
            <View style={styles.badgeCount}>
              <Text style={styles.badgeCountText}>{cartCount}</Text>
            </View>
          </View>
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.vendorName} numberOfLines={1}>
              {vendorNameInCart || 'Custom Wedding Quotation'}
            </Text>
            <Text style={styles.cartValue}>
              ₹{totalCartAmount.toLocaleString('en-IN')}{' '}
              <Text style={styles.cartValueSub}>Est. Total</Text>
            </Text>
          </View>
        </View>

        <View style={styles.rightAction}>
          <Text style={styles.actionText}>Ask Quote</Text>
          <ArrowRight size={15} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 999,
  },
  floatingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0B0B0E',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  leftMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  bagIconWrap: {
    position: 'relative',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCount: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeCountText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 9.5,
    color: '#FFFFFF',
  },
  vendorName: {
    fontFamily: THEME.fonts.semiBold,
    fontSize: 12,
    color: '#D1D5DB',
  },
  cartValue: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  cartValueSub: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11,
    color: '#9CA3AF',
  },
  rightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#C5A059',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  actionText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 13,
    color: '#0B0B0E',
  },
});

