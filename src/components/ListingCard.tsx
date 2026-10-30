import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Star, Heart } from 'lucide-react-native';
import SpringPressable from './SpringPressable';
import { Business } from '../types';
import { THEME } from '../theme/colors';

interface ListingCardProps {
  business: Business;
  date?: string;
  onPress: () => void;
}

export default function ListingCard({ business, date, onPress }: ListingCardProps) {
  const vSpecs = business.venue_details;
  const cPackages = business.catering_packages;
  const dCatalogues = business.decor_catalogues;

  const priceString =
    business.category === 'venue'
      ? `₹${(vSpecs?.base_rental_price || 175000).toLocaleString('en-IN')}`
      : business.category === 'catering'
      ? `₹${(cPackages?.[0]?.price_per_plate || 450).toLocaleString('en-IN')}`
      : `₹${(dCatalogues?.[0]?.base_price || 140000).toLocaleString('en-IN')}`;

  const priceUnit =
    business.category === 'venue'
      ? ' / day'
      : business.category === 'catering'
      ? ' / plate'
      : ' / setup';

  return (
    <SpringPressable
      style={styles.card}
      onPress={onPress}
      activeScale={0.985}
    >
      {/* Visual Photography Container */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: business.cover_image_url }}
          style={styles.image}
          fadeDuration={250}
        />

        {/* Floating Top Right Wishlist Heart */}
        <TouchableOpacity style={styles.heartBtn} activeOpacity={0.8}>
          <Heart size={16} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Category Pill floating top-left */}
        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>
            {business.category === 'venue' && 'CONVENTION HALL'}
            {business.category === 'catering' && 'CATERING'}
            {business.category === 'decoration' && 'DECOR'}
          </Text>
        </View>
      </View>

      {/* Editorial Information Block */}
      <View style={styles.infoBlock}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{business.name}</Text>
          <View style={styles.ratingRow}>
            <Star size={13} color="#09090B" fill="#09090B" />
            <Text style={styles.ratingText}>{business.rating_avg.toFixed(1)}</Text>
          </View>
        </View>

        <Text style={styles.locationText} numberOfLines={1}>
          {business.area_locality}, {business.city}
        </Text>

        {/* Spec snippet */}
        {vSpecs && (
          <Text style={styles.specsText} numberOfLines={1}>
            {vSpecs.seating_capacity} Seating · {vSpecs.floating_capacity} Floating · {vSpecs.is_ac ? 'Central AC' : 'Standard'}
          </Text>
        )}

        {cPackages && cPackages.length > 0 && (
          <Text style={styles.specsText} numberOfLines={1}>
            Veg: ₹{cPackages[0].price_per_plate} · Non-Veg: ₹{cPackages[1]?.price_per_plate || 750} per plate
          </Text>
        )}

        {/* Clean Modern Price Line */}
        <View style={styles.priceRow}>
          <Text style={styles.priceBold}>
            {priceString}
            <Text style={styles.priceUnit}>{priceUnit}</Text>
          </Text>

          <View style={styles.verifiedTag}>
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        </View>
      </View>
    </SpringPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#F4F4F5',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heartBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 9.5,
    color: THEME.colors.textPrimary,
    letterSpacing: 0.8,
  },
  infoBlock: {
    padding: 14,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: THEME.fonts.bold,
    fontSize: 16.5,
    color: THEME.colors.textPrimary,
    letterSpacing: -0.3,
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 13,
    color: THEME.colors.textPrimary,
  },
  locationText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  specsText: {
    fontFamily: THEME.fonts.regular,
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  priceBold: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 17,
    color: THEME.colors.textPrimary,
  },
  priceUnit: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  verifiedTag: {
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 10.5,
    color: THEME.colors.textSecondary,
  },
});
