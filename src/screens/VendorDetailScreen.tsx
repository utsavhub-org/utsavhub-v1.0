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
  Camera,
  Music,
  Tag,
  Ruler,
  Check,
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
  const [activeTab, setActiveTab] = useState<'specs' | 'decor' | 'catering' | 'photography' | 'dj_sound' | 'gallery'>('specs');
  const [decorCeremonyFilter, setDecorCeremonyFilter] = useState<string>('all');
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
        if (data.category === 'decoration' || (data.decor_items && data.decor_items.length > 0)) {
          setActiveTab('decor');
          setEstimatedPrice(data.decor_items?.[0]?.base_price || 65000);
        } else if (data.category === 'catering' || (data.catering_packages && data.catering_packages.length > 0)) {
          setActiveTab('catering');
          const perPlate = data.catering_packages?.[0]?.price_per_plate || 450;
          setEstimatedPrice(perPlate * initialGuests);
        } else if (data.category === 'photography' || (data.photography_packages && data.photography_packages.length > 0)) {
          setActiveTab('photography');
          setEstimatedPrice(data.photography_packages?.[0]?.base_price || 45000);
        } else if (data.category === 'dj_sound' || (data.dj_sound_packages && data.dj_sound_packages.length > 0)) {
          setActiveTab('dj_sound');
          setEstimatedPrice(data.dj_sound_packages?.[0]?.base_price || 25000);
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

        {/* Base Starting Price & Negotiable Banner */}
        <View style={styles.startingPriceBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.startingPriceLabel}>BASE PRICE STARTS FROM</Text>
            <View style={styles.startingPriceValueRow}>
              <Text style={styles.startingPriceValue}>
                ₹{Number(
                  business.starting_price ||
                  (business.category === 'catering'
                    ? 450
                    : business.category === 'decoration'
                    ? 65000
                    : business.category === 'photography'
                    ? 45000
                    : business.category === 'dj_sound'
                    ? 25000
                    : 150000)
                ).toLocaleString('en-IN')}
              </Text>
              {business.category === 'catering' && (
                <Text style={styles.perPlateSuffix}> / plate</Text>
              )}
            </View>
          </View>
          <View style={styles.negotiablePill}>
            <Tag size={13} color="#B89324" />
            <Text style={styles.negotiablePillText}>Price Negotiable</Text>
          </View>
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
                <Building size={13} color={activeTab === 'specs' ? '#D4AF37' : '#94A3B8'} style={{ marginRight: 5 }} />
                <Text style={[styles.tabBtnText, activeTab === 'specs' && styles.tabBtnTextActive]}>
                  Specs & Policy
                </Text>
              </TouchableOpacity>
            )}

            {(dCatalogues.length > 0 || (business.decor_items && business.decor_items.length > 0) || business.category === 'decoration') && (
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'decor' && styles.tabBtnActive]}
                onPress={() => setActiveTab('decor')}
              >
                <Flower2 size={13} color={activeTab === 'decor' ? '#D4AF37' : '#94A3B8'} style={{ marginRight: 5 }} />
                <Text style={[styles.tabBtnText, activeTab === 'decor' && styles.tabBtnTextActive]}>
                  Mandapam & Sets
                </Text>
              </TouchableOpacity>
            )}

            {(cPackages.length > 0 || business.category === 'catering') && (
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'catering' && styles.tabBtnActive]}
                onPress={() => setActiveTab('catering')}
              >
                <Utensils size={13} color={activeTab === 'catering' ? '#D4AF37' : '#94A3B8'} style={{ marginRight: 5 }} />
                <Text style={[styles.tabBtnText, activeTab === 'catering' && styles.tabBtnTextActive]}>
                  Feast & Calculator
                </Text>
              </TouchableOpacity>
            )}

            {((business.photography_packages && business.photography_packages.length > 0) || business.category === 'photography') && (
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'photography' && styles.tabBtnActive]}
                onPress={() => setActiveTab('photography')}
              >
                <Camera size={13} color={activeTab === 'photography' ? '#D4AF37' : '#94A3B8'} style={{ marginRight: 5 }} />
                <Text style={[styles.tabBtnText, activeTab === 'photography' && styles.tabBtnTextActive]}>
                  Cinema Packages
                </Text>
              </TouchableOpacity>
            )}

            {((business.dj_sound_packages && business.dj_sound_packages.length > 0) || business.category === 'dj_sound') && (
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'dj_sound' && styles.tabBtnActive]}
                onPress={() => setActiveTab('dj_sound')}
              >
                <Music size={13} color={activeTab === 'dj_sound' ? '#D4AF37' : '#94A3B8'} style={{ marginRight: 5 }} />
                <Text style={[styles.tabBtnText, activeTab === 'dj_sound' && styles.tabBtnTextActive]}>
                  Sound & DJ FX
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

        {/* Tab A: Mandapam & Decor Sets */}
        {activeTab === 'decor' && (
          <View style={styles.tabContent}>
            {/* Ceremony Filter Chips */}
            <View style={{ marginBottom: 14 }}>
              <Text style={styles.sectionSubHeader}>TELUGU CEREMONY OFFERINGS</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                {[
                  { key: 'all', label: 'All Sets' },
                  { key: 'mandapam', label: '🏛️ Mandapams' },
                  { key: 'wayworks_entrance', label: '✨ Way Works' },
                  { key: 'sangeeth', label: '🎉 Sangeeth' },
                  { key: 'rata_muhurtham', label: '🪔 Rata Muhurtham' },
                  { key: 'kalagollu_sambaralu', label: '🌼 Kalagollu Sambaralu' },
                  { key: 'home_decor', label: '🏡 Home Decor' },
                ].map((c) => {
                  const isSel = decorCeremonyFilter === c.key;
                  return (
                    <TouchableOpacity
                      key={c.key}
                      style={[styles.ceremonyFilterChip, isSel && styles.ceremonyFilterChipActive]}
                      onPress={() => setDecorCeremonyFilter(c.key)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.ceremonyFilterChipText, isSel && styles.ceremonyFilterChipTextActive]}>
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Modular Decor Elements: Mandapams, Wayworks, Haldi/Mehendi */}
            {business.decor_items && business.decor_items.length > 0 && (
              <View style={{ marginBottom: 12 }}>
                {business.decor_items
                  .filter((item) => decorCeremonyFilter === 'all' || item.element_type === decorCeremonyFilter)
                  .map((item) => (
                    <View key={item.id} style={styles.decorCard}>
                      <Image
                        source={{ uri: item.sample_images?.[0] || business.cover_image_url }}
                        style={styles.decorImage}
                      />
                      <View style={styles.decorBody}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <View style={styles.decorTypeBadge}>
                            <Text style={styles.decorTypeBadgeText}>
                              {item.element_type === 'mandapam' && '🏛️ MANDAPAM STAGE'}
                              {item.element_type === 'wayworks_entrance' && '✨ WAYWORKS / ENTRY TUNNEL'}
                              {item.element_type === 'sangeeth' && '🎉 SANGEETH & RECEPTION'}
                              {item.element_type === 'rata_muhurtham' && '🪔 RATA MUHURTHAM (GAURI POOJA)'}
                              {item.element_type === 'kalagollu_sambaralu' && '🌼 KALAGOLLU SAMBARALU (HALDI)'}
                              {item.element_type === 'home_decor' && '🏡 HOME DECOR & HOUSE LIGHTS'}
                              {item.element_type === 'haldi_mehendi' && '🌼 HALDI / MEHENDI JHULA'}
                              {item.element_type === 'reception_backdrop' && 'RECEPTION BACKDROP'}
                              {item.element_type === 'lighting_fx' && 'LIGHTING & FX'}
                            </Text>
                          </View>

                          <View style={styles.cardNegotiablePill}>
                            <Text style={styles.cardNegotiablePillText}>Price Negotiable</Text>
                          </View>
                        </View>

                        <Text style={styles.decorTitle}>{item.title}</Text>

                        {/* Dimensions, Height & Flower Specs */}
                        <View style={styles.decorSpecsRow}>
                          {item.dimensions && (
                            <View style={styles.decorSpecChip}>
                              <Ruler size={11} color="#B89324" />
                              <Text style={styles.decorSpecChipText}>Size: {item.dimensions}</Text>
                            </View>
                          )}
                          {item.height && (
                            <View style={styles.decorSpecChip}>
                              <Text style={styles.decorSpecChipText}>Height: {item.height}</Text>
                            </View>
                          )}
                        </View>

                        {item.flower_type && (
                          <Text style={styles.decorFlowerText}>🌸 Composition: {item.flower_type}</Text>
                        )}

                        <View style={styles.decorPriceActionRow}>
                          <View>
                            <Text style={styles.decorPriceLabel}>ESTIMATED RATE</Text>
                            <Text style={styles.decorPrice}>₹{Number(item.base_price || 0).toLocaleString('en-IN')}</Text>
                          </View>

                          <TouchableOpacity
                            style={styles.decorWaBtn}
                            onPress={() => {
                              const cleanNum = business.whatsapp_number.replace(/\D/g, '');
                              const url = `whatsapp://send?phone=${cleanNum}&text=Hi%2C%20inquiring%20about%20the%20${encodeURIComponent(item.title)}%20setup%20(${encodeURIComponent(item.dimensions || '')}%2C%20${encodeURIComponent(item.height || '')})%20for%20my%20auspicious%20date%20${initialDate}.`;
                              Linking.openURL(url).catch(() => Linking.openURL(`https://wa.me/${cleanNum}`));
                            }}
                          >
                            <MessageCircle size={14} color="#FFFFFF" />
                            <Text style={styles.decorWaBtnText}>Inquire for Setup</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
              </View>
            )}

            {dCatalogues.length > 0 && (
              <View>
                <Text style={[styles.sectionSubHeader, { marginTop: 8 }]}>
                  COMPLETE THEME LOOKBOOKS & CATALOGUES
                </Text>
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

        {/* Tab C: Photography & Cinema Packages */}
        {activeTab === 'photography' && (
          <View style={styles.tabContent}>
            <View style={{ marginBottom: 14 }}>
              <Text style={styles.sectionSubHeader}>4K WEDDING CINEMA & PHOTOGRAPHY PACKAGES</Text>
              <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>
                Full-service cinematography, candid stills, heirloom photo albums & drone aerial coverage.
              </Text>
            </View>

            {(business.photography_packages || []).map((pkg) => (
              <View key={pkg.id} style={styles.decorCard}>
                <Image
                  source={{ uri: pkg.sample_images?.[0] || business.cover_image_url }}
                  style={styles.decorImage}
                />
                <View style={styles.decorBody}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <View style={styles.decorTypeBadge}>
                      <Text style={styles.decorTypeBadgeText}>
                        🎬 {pkg.package_type.toUpperCase().replace('_', ' ')}
                      </Text>
                    </View>
                    <View style={styles.cardNegotiablePill}>
                      <Text style={styles.cardNegotiablePillText}>Price Negotiable</Text>
                    </View>
                  </View>

                  <Text style={styles.decorTitle}>{pkg.title}</Text>

                  <View style={styles.decorSpecsRow}>
                    {pkg.duration && (
                      <View style={styles.decorSpecChip}>
                        <Calendar size={11} color="#B89324" />
                        <Text style={styles.decorSpecChipText}>{pkg.duration}</Text>
                      </View>
                    )}
                    {pkg.crew_count && (
                      <View style={styles.decorSpecChip}>
                        <Users size={11} color="#B89324" />
                        <Text style={styles.decorSpecChipText}>{pkg.crew_count}</Text>
                      </View>
                    )}
                  </View>

                  {/* Deliverables list */}
                  <View style={{ marginTop: 10, marginBottom: 12, gap: 5 }}>
                    {pkg.deliverables.map((deliv, dIdx) => (
                      <View key={dIdx} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                        <Check size={13} color="#059669" style={{ marginTop: 2 }} />
                        <Text style={{ fontSize: 12.5, color: '#334155', flex: 1 }}>{deliv}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.decorPriceActionRow}>
                    <View>
                      <Text style={styles.decorPriceLabel}>PACKAGE RATE</Text>
                      <Text style={styles.decorPrice}>₹{Number(pkg.base_price || 0).toLocaleString('en-IN')}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.decorWaBtn}
                      onPress={() => {
                        const cleanNum = business.whatsapp_number.replace(/\D/g, '');
                        const url = `whatsapp://send?phone=${cleanNum}&text=Hi%2C%20inquiring%20about%20the%20${encodeURIComponent(pkg.title)}%20package%20for%20my%20wedding%20on%20${initialDate}.`;
                        Linking.openURL(url).catch(() => Linking.openURL(`https://wa.me/${cleanNum}`));
                      }}
                    >
                      <MessageCircle size={14} color="#FFFFFF" />
                      <Text style={styles.decorWaBtnText}>Inquire Package</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Tab D: Sound & DJ FX Packages */}
        {activeTab === 'dj_sound' && (
          <View style={styles.tabContent}>
            <View style={{ marginBottom: 14 }}>
              <Text style={styles.sectionSubHeader}>CONCERT SOUND, DJ & LIGHTING PACKAGES</Text>
              <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>
                High-impact line-array audio, moving head trusses, Barat sound trucks, and cold pyrotechnics.
              </Text>
            </View>

            {(business.dj_sound_packages || []).map((pkg) => (
              <View key={pkg.id} style={styles.decorCard}>
                <Image
                  source={{ uri: pkg.sample_images?.[0] || business.cover_image_url }}
                  style={styles.decorImage}
                />
                <View style={styles.decorBody}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <View style={styles.decorTypeBadge}>
                      <Text style={styles.decorTypeBadgeText}>
                        🎵 {pkg.package_type.toUpperCase().replace('_', ' ')}
                      </Text>
                    </View>
                    <View style={styles.cardNegotiablePill}>
                      <Text style={styles.cardNegotiablePillText}>Price Negotiable</Text>
                    </View>
                  </View>

                  <Text style={styles.decorTitle}>{pkg.title}</Text>

                  {pkg.power_output_watts && (
                    <View style={styles.decorSpecsRow}>
                      <View style={styles.decorSpecChip}>
                        <Zap size={11} color="#B89324" />
                        <Text style={styles.decorSpecChipText}>Power: {pkg.power_output_watts}</Text>
                      </View>
                    </View>
                  )}

                  {/* Highlights list */}
                  <View style={{ marginTop: 10, marginBottom: 12, gap: 5 }}>
                    {pkg.equipment_highlights.map((equip, eIdx) => (
                      <View key={eIdx} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                        <Check size={13} color="#059669" style={{ marginTop: 2 }} />
                        <Text style={{ fontSize: 12.5, color: '#334155', flex: 1 }}>{equip}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.decorPriceActionRow}>
                    <View>
                      <Text style={styles.decorPriceLabel}>SETUP TARIFF</Text>
                      <Text style={styles.decorPrice}>₹{Number(pkg.base_price || 0).toLocaleString('en-IN')}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.decorWaBtn}
                      onPress={() => {
                        const cleanNum = business.whatsapp_number.replace(/\D/g, '');
                        const url = `whatsapp://send?phone=${cleanNum}&text=Hi%2C%20inquiring%20about%20${encodeURIComponent(pkg.title)}%20(${encodeURIComponent(pkg.power_output_watts || '')})%20for%20my%20event%20on%20${initialDate}.`;
                        Linking.openURL(url).catch(() => Linking.openURL(`https://wa.me/${cleanNum}`));
                      }}
                    >
                      <MessageCircle size={14} color="#FFFFFF" />
                      <Text style={styles.decorWaBtnText}>Inquire Setup</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Tab E: Venue Specs */}
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

        {/* Tab F: Photo Gallery */}
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
  startingPriceBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFFDF9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8DEC8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  startingPriceLabel: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 10,
    color: '#8A723D',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  startingPriceValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  startingPriceValue: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 22,
    color: '#0F172A',
  },
  perPlateSuffix: {
    fontFamily: THEME.fonts.medium,
    fontSize: 13,
    color: '#64748B',
  },
  negotiablePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF9EE',
    borderWidth: 1,
    borderColor: '#E8DEC8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  negotiablePillText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 11,
    color: '#8A723D',
  },
  ceremonyFilterChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
  },
  ceremonyFilterChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  ceremonyFilterChipText: {
    fontFamily: THEME.fonts.semiBold,
    fontSize: 12,
    color: '#475569',
  },
  ceremonyFilterChipTextActive: {
    fontFamily: THEME.fonts.bold,
    color: '#D4AF37',
  },
  cardNegotiablePill: {
    backgroundColor: '#FEF9EE',
    borderWidth: 1,
    borderColor: '#E8DEC8',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  cardNegotiablePillText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 10,
    color: '#8A723D',
  },
  decorSpecsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
    marginBottom: 6,
  },
  decorSpecChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  decorSpecChipText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11,
    color: '#475569',
  },
  decorPriceActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  decorPriceLabel: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 9.5,
    color: '#94A3B8',
    letterSpacing: 0.5,
  },

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
