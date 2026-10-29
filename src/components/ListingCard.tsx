import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Star, MapPin, Users, Wind, CheckCircle2, ChevronRight } from 'lucide-react-native';
import { Business } from '../types';

interface ListingCardProps {
  business: Business;
  date?: string;
  onPress: () => void;
}

export default function ListingCard({ business, date, onPress }: ListingCardProps) {
  const vSpecs = business.venue_details;
  const cPackages = business.catering_packages;
  const dCatalogues = business.decor_catalogues;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Top Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: business.cover_image_url }}
          style={styles.image}
        />

        {/* Availability Badge */}
        <View style={styles.badgeTopLeft}>
          <View style={styles.availBadge}>
            <CheckCircle2 size={11} color="#FFFFFF" />
            <Text style={styles.availText}>
              {date ? `Available ${date}` : 'Verified Open'}
            </Text>
          </View>

          {vSpecs?.is_ac && (
            <View style={styles.acBadge}>
              <Wind size={10} color="#FFFFFF" />
              <Text style={styles.acText}>Central AC</Text>
            </View>
          )}
        </View>

        {/* Rating */}
        <View style={styles.ratingBadge}>
          <Star size={11} color="#FBBF24" fill="#FBBF24" />
          <Text style={styles.ratingText}>
            {business.rating_avg.toFixed(1)} ({business.review_count})
          </Text>
        </View>
      </View>

      {/* Body Info */}
      <View style={styles.body}>
        <View style={styles.categoryRow}>
          <Text style={styles.categoryText}>
            {business.category === 'venue' && 'AC CONVENTION HALL'}
            {business.category === 'catering' && 'GOURMET CATERER'}
            {business.category === 'decoration' && 'MANDAPAM DECOR'}
          </Text>
          <View style={styles.locRow}>
            <MapPin size={11} color="#B89324" />
            <Text style={styles.locText} numberOfLines={1}>
              {business.city}
            </Text>
          </View>
        </View>

        <Text style={styles.titleText} numberOfLines={1}>
          {business.name}
        </Text>
        <Text style={styles.areaText} numberOfLines={1}>
          {business.area_locality}
        </Text>

        {/* Capacity / Spec Highlights */}
        {vSpecs && (
          <View style={styles.specsRow}>
            <View style={styles.specChip}>
              <Users size={12} color="#D4AF37" />
              <Text style={styles.specChipText}>
                {vSpecs.seating_capacity} Seating / {vSpecs.floating_capacity} Float
              </Text>
            </View>
            <View style={styles.specChip}>
              <Text style={styles.specChipText}>
                {vSpecs.parking_capacity_cars} Cars Parking
              </Text>
            </View>
          </View>
        )}

        {cPackages && cPackages.length > 0 && (
          <View style={styles.cateringPricingRow}>
            <Text style={styles.catPlateText}>
              Veg: <Text style={{ fontWeight: '700' }}>₹{cPackages[0]?.price_per_plate}/plate</Text>
            </Text>
            {cPackages[1] && (
              <Text style={styles.catPlateText}>
                Non-Veg: <Text style={{ fontWeight: '700' }}>₹{cPackages[1]?.price_per_plate}/plate</Text>
              </Text>
            )}
          </View>
        )}

        {dCatalogues && dCatalogues.length > 0 && (
          <View style={styles.decorDimensionsRow}>
            <Text style={styles.decorDimText}>
              Setup: {dCatalogues[0].title} ({dCatalogues[0].dimensions})
            </Text>
          </View>
        )}

        {/* Price & Action Footer */}
        <View style={styles.footerRow}>
          <View>
            <Text style={styles.pricePrefix}>Starting from</Text>
            <Text style={styles.priceValue}>
              {business.category === 'venue' && vSpecs && (
                <>₹{vSpecs.base_rental_price.toLocaleString('en-IN')}<Text style={styles.priceUnit}> / day</Text></>
              )}
              {business.category === 'catering' && cPackages && (
                <>₹{cPackages[0]?.price_per_plate}<Text style={styles.priceUnit}> / plate</Text></>
              )}
              {business.category === 'decoration' && dCatalogues && (
                <>₹{dCatalogues[0]?.base_price.toLocaleString('en-IN')}<Text style={styles.priceUnit}> base</Text></>
              )}
            </Text>
          </View>

          <View style={styles.viewSpecsBtn}>
            <Text style={styles.viewSpecsText}>View Specs</Text>
            <ChevronRight size={13} color="#FFFFFF" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 12,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  imageContainer: {
    height: 170,
    width: '100%',
    backgroundColor: '#E2E8F0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgeTopLeft: {
    position: 'absolute',
    top: 10,
    left: 10,
    gap: 4,
  },
  availBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(5, 150, 105, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  acBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(2, 132, 199, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  acText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  ratingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 12,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  body: {
    padding: 14,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#C59B27',
    letterSpacing: 0.5,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locText: {
    fontSize: 12.5,
    color: '#64748B',
  },
  titleText: {
    fontSize: 17.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  areaText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 8,
  },
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  specChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexShrink: 1,
  },
  specChipText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  cateringPricingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: '#F0FDF4',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginBottom: 8,
  },
  catPlateText: {
    fontSize: 12,
    color: '#166534',
  },
  decorDimensionsRow: {
    backgroundColor: '#FFFBEB',
    padding: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    marginBottom: 8,
  },
  decorDimText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  pricePrefix: {
    fontSize: 11.5,
    color: '#94A3B8',
  },
  priceValue: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#0F172A',
  },
  priceUnit: {
    fontSize: 12.5,
    fontWeight: '400',
    color: '#64748B',
  },
  viewSpecsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexShrink: 0,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  viewSpecsText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
