import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Star,
  MapPin,
  Phone,
  MessageCircle,
  Wind,
  Users,
  Car,
  Zap,
  Building,
  Utensils,
  Flower2,
  Calendar,
  Sparkles,
  Play,
  FileText,
  Share2,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react-native';
import ReelModal from '../components/ReelModal';
import BookingModal from '../components/BookingModal';
import CateringCalculator from '../components/CateringCalculator';
import { getBusinessById } from '../lib/supabaseClient';
import { Business, MediaReel } from '../types';
import { THEME } from '../theme/colors';

interface VendorDetailScreenProps {
  businessId: string;
  initialDate?: string;
  initialGuests?: number;
  onBack: () => void;
}

export default function VendorDetailScreen({
  businessId,
  initialDate = '2026-11-20',
  initialGuests = 300,
  onBack,
}: VendorDetailScreenProps) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'specs' | 'decor' | 'catering' | 'gallery'>('specs');
  const insets = useSafeAreaInsets();

  const [activeReel, setActiveReel] = useState<MediaReel | null>(null);
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);

  const [estimatedPrice, setEstimatedPrice] = useState<number>(0);
  const [customPackageNote, setCustomPackageNote] = useState<string>('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getBusinessById(businessId);
      setBusiness(data);

      if (data) {
        if (data.category === 'decoration' || (data.decor_catalogues && data.decor_catalogues.length > 0)) {
          setActiveTab('decor');
          setEstimatedPrice(data.decor_catalogues?.[0]?.base_price || 115000);
        } else if (data.category === 'catering' || (data.catering_packages && data.catering_packages.length > 0)) {
          setActiveTab('catering');
          const perPlate = data.catering_packages?.[0]?.price_per_plate || 450;
          setEstimatedPrice(perPlate * initialGuests);
        } else {
          setActiveTab('specs');
          setEstimatedPrice(data.venue_details?.base_rental_price || 125000);
        }
      }
      setLoading(false);
    }
    load();
  }, [businessId, initialGuests]);

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  if (!business) {
    return (
      <View style={[styles.loadingScreen, { backgroundColor: '#09090B', paddingHorizontal: 24 }]}>
        <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 18, marginBottom: 6 }}>Business Not Found</Text>
        <Text style={{ color: '#A1A1AA', fontSize: 13, textAlign: 'center', marginBottom: 20 }}>
          This business listing is currently unavailable or being updated in the live registry.
        </Text>
        <TouchableOpacity
          onPress={onBack}
          style={{
            backgroundColor: '#C5A059',
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#09090B', fontWeight: '700', fontSize: 14 }}>Back to Listings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const vSpecs = business.venue_details;
  const cPackages = business.catering_packages || [];
  const dCatalogues = business.decor_catalogues || [];
  const reels = business.media_reels || [];

  const handleCall = () => {
    Linking.openURL(`tel:${business.phone}`);
  };

  const handleWhatsApp = () => {
    const cleanNum = business.whatsapp_number.replace(/\D/g, '');
    const url = `whatsapp://send?phone=${cleanNum}&text=Hi%2C%20I%20am%20inquiring%20about%20${encodeURIComponent(business.name)}%20on%20UtsavHub%20for%20date%20${initialDate}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://wa.me/${cleanNum}`);
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${business.name} on UtsavHub! Location: ${business.area_locality}, ${business.city}`,
      });
    } catch {
      // ignore
    }
  };

  return (
    <View style={styles.screen}>
      {/* Top Navbar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ChevronLeft size={22} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {business.name}
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={handleShare}>
          <Share2 size={18} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Reels Carousel (if available) */}
        {reels.length > 0 && (
          <View style={styles.reelsBox}>
            <View style={styles.reelsHeadingRow}>
              <Sparkles size={13} color="#D4AF37" />
              <Text style={styles.reelsHeading}>VERTICAL VIDEO REELS</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reelsRow}>
              {reels.map((reel) => (
                <TouchableOpacity
                  key={reel.id}
                  style={styles.reelCard}
                  onPress={() => setActiveReel(reel)}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: reel.thumbnail_url }} style={styles.reelImage} />
                  <View style={styles.reelOverlay} />
                  <View style={styles.reelPlayBadge}>
                    <Play size={12} color="#FFFFFF" style={{ marginLeft: 2 }} />
                  </View>
                  <Text style={styles.reelCardTitle} numberOfLines={2}>
                    {reel.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Business Header Card */}
        <View style={styles.mainInfoCard}>
          <View style={styles.tagsRow}>
            <View style={styles.availPill}>
              <CheckCircle2 size={11} color="#059669" />
              <Text style={styles.availPillText}>Available {initialDate}</Text>
            </View>
            <View style={styles.ratingPill}>
              <Star size={11} color="#FBBF24" fill="#FBBF24" />
              <Text style={styles.ratingPillText}>
                {Number(business.rating_avg || 4.8).toFixed(1)} ({business.review_count || 12})
              </Text>
            </View>
          </View>

          <Text style={styles.businessTitle}>{business.name}</Text>
          <View style={styles.localityRow}>
            <MapPin size={13} color="#D4AF37" />
            <Text style={styles.localityText}>
              {business.area_locality}, {business.city}
            </Text>
          </View>

          {/* Quick Action Buttons */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.waBtn} onPress={handleWhatsApp} activeOpacity={0.85}>
              <MessageCircle size={15} color="#FFFFFF" />
              <Text style={styles.waBtnText}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.callBtn} onPress={handleCall} activeOpacity={0.85}>
              <Phone size={15} color="#334155" />
              <Text style={styles.callBtnText}>Call Vendor</Text>
            </TouchableOpacity>
          </View>

          {/* Hall Specs (if venue) */}
          {vSpecs && (
            <View style={styles.specsGrid}>
              <View style={styles.specCell}>
                <Users size={14} color="#D4AF37" />
                <Text style={styles.specCellTitle}>Capacity</Text>
                <Text style={styles.specCellValue}>
                  {vSpecs.seating_capacity} Seat / {vSpecs.floating_capacity} Float
                </Text>
              </View>

              <View style={styles.specCell}>
                <Wind size={14} color="#D4AF37" />
                <Text style={styles.specCellTitle}>Climate</Text>
                <Text style={styles.specCellValue}>
                  {vSpecs.is_ac ? 'Central AC' : 'Non-AC'}
                </Text>
              </View>

              <View style={styles.specCell}>
                <Building size={14} color="#D4AF37" />
                <Text style={styles.specCellTitle}>Rooms</Text>
                <Text style={styles.specCellValue}>
                  {vSpecs.ac_rooms_count} AC Rooms
                </Text>
              </View>

              <View style={styles.specCell}>
                <Zap size={14} color="#D4AF37" />
                <Text style={styles.specCellTitle}>Generator</Text>
                <Text style={styles.specCellValue}>
                  {vSpecs.power_backup_kva} KVA Backup
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Tab Selector (Horizontally Scrollable) */}
        <View style={styles.tabBarWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBarScroll}
          >
            {vSpecs && (
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'specs' && styles.tabBtnActive]}
                onPress={() => setActiveTab('specs')}
              >
                <Text style={[styles.tabBtnText, activeTab === 'specs' && styles.tabBtnTextActive]}>
                  Specs & Policy
                </Text>
              </TouchableOpacity>
            )}

            {(dCatalogues.length > 0 || business.category === 'decoration') && (
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'decor' && styles.tabBtnActive]}
                onPress={() => setActiveTab('decor')}
              >
                <Text style={[styles.tabBtnText, activeTab === 'decor' && styles.tabBtnTextActive]}>
                  Mandapam Lookbook
                </Text>
              </TouchableOpacity>
            )}

            {(cPackages.length > 0 || business.category === 'catering') && (
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'catering' && styles.tabBtnActive]}
                onPress={() => setActiveTab('catering')}
              >
                <Text style={[styles.tabBtnText, activeTab === 'catering' && styles.tabBtnTextActive]}>
                  Plate Calculator
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'gallery' && styles.tabBtnActive]}
              onPress={() => setActiveTab('gallery')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'gallery' && styles.tabBtnTextActive]}>
                Photos
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Tab A: Mandapam & Decor Lookbook */}
        {activeTab === 'decor' && (
          <View style={styles.tabContent}>
            {/* Modular Decor Elements: Mandapams, Wayworks, Haldi/Mehendi */}
            {business.decor_items && business.decor_items.length > 0 && (
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.sectionSubHeader}>
                  MODULAR DECOR ELEMENTS & WAYWORKS ({business.decor_items.length})
                </Text>
                {business.decor_items.map((item) => (
                  <View key={item.id} style={styles.decorCard}>
                    <Image
                      source={{ uri: item.sample_images?.[0] || business.cover_image_url }}
                      style={styles.decorImage}
                    />
                    <View style={styles.decorBody}>
                      <View style={styles.decorTypeBadge}>
                        <Text style={styles.decorTypeBadgeText}>
                          {item.element_type === 'mandapam' && 'MANDAPAM STAGE'}
                          {item.element_type === 'wayworks_entrance' && 'WAYWORKS / ENTRY TUNNEL'}
                          {item.element_type === 'haldi_mehendi' && 'HALDI / MEHENDI JHULA'}
                          {item.element_type === 'reception_backdrop' && 'RECEPTION BACKDROP'}
                          {item.element_type === 'lighting_fx' && 'LIGHTING & FX'}
                        </Text>
                      </View>

                      <View style={styles.decorTopRow}>
                        <Text style={styles.decorTitle}>{item.title}</Text>
                        <Text style={styles.decorPrice}>₹{Number(item.base_price || 0).toLocaleString('en-IN')}</Text>
                      </View>
                      {item.dimensions && (
                        <Text style={styles.decorDimensions}>Dimensions: {item.dimensions}</Text>
                      )}
                      {item.flower_type && (
                        <Text style={styles.decorFlowerText}>Flowers: {item.flower_type}</Text>
                      )}

                      <View style={styles.decorBtnRow}>
                        <TouchableOpacity
                          style={styles.decorWaBtn}
                          onPress={() => {
                            const cleanNum = business.whatsapp_number.replace(/\D/g, '');
                            const url = `whatsapp://send?phone=${cleanNum}&text=Hi%2C%20inquiring%20about%20${encodeURIComponent(item.title)}%20(${item.element_type})`;
                            Linking.openURL(url).catch(() => Linking.openURL(`https://wa.me/${cleanNum}`));
                          }}
                        >
                          <MessageCircle size={13} color="#FFFFFF" />
                          <Text style={styles.decorWaBtnText}>Inquire for this Setup</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {dCatalogues.length > 0 && (
              <View>
                {business.decor_items && business.decor_items.length > 0 && (
                  <Text style={[styles.sectionSubHeader, { marginTop: 8 }]}>
                    COMPLETE THEME LOOKBOOKS & CATALOGUES
                  </Text>
                )}
                {dCatalogues.map((item) => (
                  <View key={item.id} style={styles.decorCard}>
                    <Image
                      source={{ uri: item.sample_images?.[0] || business.cover_image_url }}
                      style={styles.decorImage}
                    />
                    <View style={styles.decorBody}>
                      <View style={styles.decorTopRow}>
                        <Text style={styles.decorTitle}>{item.title}</Text>
                        <Text style={styles.decorPrice}>₹{Number(item.base_price || 0).toLocaleString('en-IN')}</Text>
                      </View>
                      <Text style={styles.decorDimensions}>Dimensions: {item.dimensions}</Text>

                      <View style={styles.decorBtnRow}>
                        <TouchableOpacity
                          style={styles.lookbookBtn}
                          onPress={() => {
                            Linking.openURL(item.lookbook_pdf_url);
                          }}
                        >
                          <FileText size={13} color="#B89324" />
                          <Text style={styles.lookbookBtnText}>View PDF Lookbook</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.decorWaBtn}
                          onPress={() => {
                            const cleanNum = business.whatsapp_number.replace(/\D/g, '');
                            const url = `whatsapp://send?phone=${cleanNum}&text=Hi%2C%20inquiring%20about%20mandapam%20${encodeURIComponent(item.title)}`;
                            Linking.openURL(url).catch(() => Linking.openURL(`https://wa.me/${cleanNum}`));
                          }}
                        >
                          <MessageCircle size={13} color="#FFFFFF" />
                          <Text style={styles.decorWaBtnText}>Inquire</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Tab B: Catering & Menu Cost Calculator */}
        {activeTab === 'catering' && (
          <View style={styles.tabContent}>
            <CateringCalculator
              packages={cPackages}
              business={business}
              defaultGuests={initialGuests}
              onTotalChange={(amt, pkg) => {
                setEstimatedPrice(amt);
                setCustomPackageNote(pkg);
              }}
            />
          </View>
        )}

        {/* Tab C: Venue Specs */}
        {activeTab === 'specs' && vSpecs && (
          <View style={styles.tabContent}>
            <View style={styles.specsCard}>
              <Text style={styles.specsCardHeader}>INFRASTRUCTURE & DETAILS</Text>

              <View style={styles.specRowItem}>
                <Text style={styles.specLabel}>Main Hall Seating</Text>
                <Text style={styles.specVal}>{vSpecs.seating_capacity} Chairs</Text>
              </View>

              <View style={styles.specRowItem}>
                <Text style={styles.specLabel}>Dining Hall Floating</Text>
                <Text style={styles.specVal}>{vSpecs.floating_capacity} Guests</Text>
              </View>

              <View style={styles.specRowItem}>
                <Text style={styles.specLabel}>Car Parking</Text>
                <Text style={styles.specVal}>{vSpecs.parking_capacity_cars} Dedicated Stalls</Text>
              </View>

              <View style={styles.specRowItem}>
                <Text style={styles.specLabel}>Outside Catering</Text>
                <Text style={styles.specVal}>
                  {vSpecs.outside_catering_allowed ? 'Allowed (Full Kitchen)' : 'In-House Only'}
                </Text>
              </View>

              <View style={styles.specRowItem}>
                <Text style={styles.specLabel}>Power Backup</Text>
                <Text style={styles.specVal}>{vSpecs.power_backup_kva} KVA Auto Diesel</Text>
              </View>

              <View style={styles.auditBox}>
                <ShieldCheck size={16} color="#059669" />
                <Text style={styles.auditText}>
                  Licensed and fire-safety approved for auspicious midnight muhurtham ceremonies.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Tab D: Photo Gallery */}
        {activeTab === 'gallery' && (
          <View style={styles.tabContent}>
            {[business.cover_image_url, ...(business.gallery_images || [])].map((uri, idx) => (
              <Image key={idx} source={{ uri }} style={styles.galleryImage} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Booking Bar */}
      <View style={[styles.stickyBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View>
          <View style={styles.stickyDateRow}>
            <Calendar size={11} color="#D4AF37" />
            <Text style={styles.stickyDateText}>
              {initialDate} • {initialGuests} Guests
            </Text>
          </View>
          <Text style={styles.stickyAmount}>
            ₹{Math.round(Number(estimatedPrice || vSpecs?.base_rental_price || 125000)).toLocaleString('en-IN')}
            <Text style={styles.stickySubText}>
              {business.category === 'venue' ? ' / day' : customPackageNote ? ` (${customPackageNote})` : ' est.'}
            </Text>
          </Text>
        </View>

        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => setIsBookingModalVisible(true)}
          activeOpacity={0.85}
        >
          <Sparkles size={14} color="#FFFFFF" />
          <Text style={styles.bookBtnText}>Request Hold</Text>
        </TouchableOpacity>
      </View>

      {/* Reel Modal */}
      <ReelModal
        visible={activeReel !== null}
        reel={activeReel}
        business={business}
        onClose={() => setActiveReel(null)}
      />

      {/* Booking Modal */}
      <BookingModal
        visible={isBookingModalVisible}
        business={business}
        defaultDate={initialDate}
        defaultGuests={initialGuests}
        estimatedTotal={estimatedPrice || vSpecs?.base_rental_price}
        onClose={() => setIsBookingModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  scrollContainer: {
    flex: 1,
  },
  reelsBox: {
    backgroundColor: '#FAF8F5',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  reelsHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  reelsHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B89324',
    letterSpacing: 0.5,
  },
  reelsRow: {
    paddingHorizontal: 16,
    gap: 10,
  },
  reelCard: {
    width: 120,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  reelImage: {
    width: '100%',
    height: '100%',
  },
  reelOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  reelPlayBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelCardTitle: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  mainInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 12,
    marginTop: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFE8DA',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  availPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  availPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ratingPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  businessTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1E293B',
    lineHeight: 28,
  },
  localityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    marginBottom: 14,
  },
  localityText: {
    fontSize: 13,
    color: '#64748B',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  waBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 14,
  },
  waBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F8F6F0',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFE8DA',
  },
  callBtnText: {
    color: '#334155',
    fontSize: 13.5,
    fontWeight: '700',
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 12,
  },
  specCell: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  specCellTitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  specCellValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  tabBarWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginTop: 12,
  },
  tabBarScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  tabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#D4AF37',
  },
  tabBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#1E293B',
  },
  tabContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  sectionSubHeader: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 11,
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },
  decorTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  decorTypeBadgeText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 9.5,
    color: THEME.colors.goldDark,
    letterSpacing: 0.6,
  },
  decorFlowerText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginBottom: 10,
  },
  decorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFE8DA',
    marginBottom: 14,
  },
  decorImage: {
    height: 170,
    width: '100%',
  },
  decorBody: {
    padding: 14,
  },
  decorTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  decorTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#1E293B',
    flex: 1,
  },
  decorPrice: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#D4AF37',
  },
  decorDimensions: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 3,
    marginBottom: 12,
  },
  decorBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  lookbookBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    paddingVertical: 9,
    borderRadius: 12,
  },
  lookbookBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#92400E',
  },
  decorWaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingVertical: 9,
    borderRadius: 12,
  },
  decorWaBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  specsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  specsCardHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  specRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  specLabel: {
    fontSize: 13.5,
    color: '#64748B',
  },
  specVal: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  auditBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginTop: 14,
  },
  auditText: {
    fontSize: 12,
    color: '#166534',
    flex: 1,
  },
  galleryImage: {
    height: 180,
    width: '100%',
    borderRadius: 16,
    marginBottom: 10,
  },
  stickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
  },
  stickyDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stickyDateText: {
    fontSize: 12,
    color: '#64748B',
  },
  stickyAmount: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 20,
    color: THEME.colors.textPrimary,
    marginTop: 2,
  },
  stickySubText: {
    fontFamily: THEME.fonts.regular,
    fontSize: 12,
    color: '#64748B',
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.accentDark,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  bookBtnText: {
    fontFamily: THEME.fonts.bold,
    color: '#FFFFFF',
    fontSize: 14.5,
  },
});
