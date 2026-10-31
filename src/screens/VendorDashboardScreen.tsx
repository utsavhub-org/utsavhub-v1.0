import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Linking,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import {
  Building,
  Video,
  FileText,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Percent,
  Sparkles,
  Phone,
  Play,
  Check,
  X,
  RefreshCw,
  LogOut,
  UserCheck,
  Utensils,
  Flower2,
  Eye,
  ShieldCheck,
  MessageCircle,
  MapPin,
  Users,
  Wind,
  Car,
  Zap,
  Sliders,
  ChevronRight,
  AlertCircle,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import {
  getBusinessById,
  getVendorBusinesses,
  getPriceRequestsForBusiness,
  submitPriceUpdateRequest,
  addVendorReel,
  getVendorInquiries,
  updateInquiryStatus,
  updateBusinessProfile,
  DEFAULT_ADMIN_PERCENTAGE,
} from '../lib/supabaseClient';
import {
  Business,
  PriceUpdateRequest,
  MediaReel,
  BookingInquiry,
} from '../types';
import ReelModal from '../components/ReelModal';
import { THEME } from '../theme/colors';
import { playButtonClick, playTabPop, playActionSuccess } from '../lib/soundManager';

const LOCALITY_OPTIONS = [
  'Madhurawada',
  'Rushikonda',
  'MVP Colony',
  'Dwaraka Nagar',
  'Gajuwaka',
  'Siripuram',
  'Seethammadhara',
  'Pendurthi',
];

const CATEGORY_IMAGE_PRESETS: Record<string, { label: string; url: string }[]> = {
  venue: [
    { label: 'Royal Mandapam Hall', url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800' },
    { label: 'Grand Banquet Ceiling', url: 'https://images.unsplash.com/photo-1544077960-604201fe74bc?w=800' },
    { label: 'Crystal Chandelier Hall', url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800' },
    { label: 'Beachside Lawn Resort', url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800' },
  ],
  catering: [
    { label: 'Royal Buffet Display', url: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800' },
    { label: 'Traditional Andhra Spread', url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800' },
    { label: 'Sweets & Live Counters', url: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800' },
  ],
  decoration: [
    { label: 'Temple Gopuram Mandapam', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800' },
    { label: 'Pastel Lilies Canopy', url: 'https://images.unsplash.com/photo-1478147427282-58a87a120781?w=800' },
    { label: 'Royal Floral Tunnel', url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800' },
  ],
  photography: [
    { label: 'Cinematic Muhurtham', url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800' },
    { label: 'Royal Couple Portrait', url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800' },
  ],
  dj_sound: [
    { label: 'Sangeet Stage Lighting', url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800' },
    { label: 'Concert Audio System', url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800' },
  ],
};

interface VendorDashboardScreenProps {
  onSwitchToCustomer: () => void;
  onPreviewPublicListing: (businessId: string) => void;
}

export default function VendorDashboardScreen({
  onSwitchToCustomer,
  onPreviewPublicListing,
}: VendorDashboardScreenProps) {
  const { currentUser, logout, openAuthModal } = useAuth();
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>(
    currentUser?.businessId || '11111111-1111-1111-1111-111111111111'
  );
  const [availableBusinesses, setAvailableBusinesses] = useState<Business[]>([]);

  // Navigation & View state
  const [activeTab, setActiveTab] = useState<'inquiries' | 'pricing' | 'media' | 'profile'>('inquiries');
  const [inquiryFilter, setInquiryFilter] = useState<'all' | 'pending' | 'confirmed' | 'declined'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Business data
  const [business, setBusiness] = useState<Business | null>(null);
  const [inquiries, setInquiries] = useState<BookingInquiry[]>([]);
  const [priceRequests, setPriceRequests] = useState<PriceUpdateRequest[]>([]);
  const [isStoreActive, setIsStoreActive] = useState(true);

  // Reel modal player
  const [selectedReel, setSelectedReel] = useState<MediaReel | null>(null);

  // Price Update Modal State
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [priceItemType, setPriceItemType] = useState<'venue_rental' | 'catering_plate' | 'decor_package'>('venue_rental');
  const [priceItemName, setPriceItemName] = useState('AC Main Hall 24-Hr Tariff');
  const [currentBasePrice, setCurrentBasePrice] = useState('175000');
  const [proposedPrice, setProposedPrice] = useState('190000');
  const [priceNotes, setPriceNotes] = useState('');
  const [submittingPrice, setSubmittingPrice] = useState(false);

  // Add Reel Modal State
  const [reelModalVisible, setReelModalVisible] = useState(false);
  const [reelTitle, setReelTitle] = useState('');
  const [reelVideoUrl, setReelVideoUrl] = useState('');
  const [reelThumbUrl, setReelThumbUrl] = useState('');
  const [submittingReel, setSubmittingReel] = useState(false);

  // Edit Profile / Specs Modal State
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [bizName, setBizName] = useState('');
  const [seatingCap, setSeatingCap] = useState('600');
  const [floatingCap, setFloatingCap] = useState('1200');
  const [roomsCount, setRoomsCount] = useState('8');
  const [parkingCars, setParkingCars] = useState('100');
  const [outsideFood, setOutsideFood] = useState(true);
  const [powerBackup, setPowerBackup] = useState('125');
  const [phoneContact, setPhoneContact] = useState('+91 98480 12345');
  const [whatsappContact, setWhatsappContact] = useState('+91 98480 12345');
  const [savingProfile, setSavingProfile] = useState(false);

  // Fetch all business data
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [bizList, bizData, inqs, pReqs] = await Promise.all([
        getVendorBusinesses(currentUser?.phone || ''),
        getBusinessById(selectedBusinessId),
        getVendorInquiries(selectedBusinessId),
        getPriceRequestsForBusiness(selectedBusinessId),
      ]);

      if (bizList && bizList.length > 0) {
        setAvailableBusinesses(bizList);
        if (!bizData && !currentUser?.businessId) {
          setSelectedBusinessId(bizList[0].id);
        }
      }

      if (bizData) {
        setBusiness(bizData);
        setBizName(bizData.name);
        setPhoneContact(bizData.phone || '+91 98480 12345');
        setWhatsappContact(bizData.whatsapp_number || '+91 98480 12345');
        if (bizData.venue_details) {
          const vd = bizData.venue_details;
          setSeatingCap(String(vd.seating_capacity || 600));
          setFloatingCap(String(vd.floating_capacity || 1200));
          setRoomsCount(String(vd.ac_rooms_count || 8));
          setParkingCars(String(vd.parking_capacity_cars || 100));
          setOutsideFood(vd.outside_catering_allowed ?? true);
          setPowerBackup(String(vd.power_backup_kva || 125));
          setCurrentBasePrice(String(vd.base_rental_price || 175000));
        }
      }

      setInquiries(inqs);
      setPriceRequests(pReqs);
    } catch (err) {
      console.warn('Dashboard load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedBusinessId]);

  // Derived Performance Metrics
  const pendingInquiriesCount = useMemo(() => {
    return inquiries.filter((i) => i.status === 'pending').length;
  }, [inquiries]);

  const pipelineValue = useMemo(() => {
    return inquiries
      .filter((i) => i.status !== 'declined' && i.status !== 'rejected')
      .reduce((sum, item) => sum + (item.final_customer_amount || item.vendor_base_amount || 0), 0);
  }, [inquiries]);

  const filteredInquiries = useMemo(() => {
    if (inquiryFilter === 'all') return inquiries;
    if (inquiryFilter === 'pending') return inquiries.filter((i) => i.status === 'pending');
    if (inquiryFilter === 'confirmed') return inquiries.filter((i) => i.status === 'confirmed' || i.status === 'approved');
    if (inquiryFilter === 'declined') return inquiries.filter((i) => i.status === 'declined' || i.status === 'rejected');
    return inquiries;
  }, [inquiries, inquiryFilter]);

  // Inquiry Status Handler
  const handleInquiryStatus = async (inquiryId: string, newStatus: 'confirmed' | 'declined') => {
    playButtonClick();
    const success = await updateInquiryStatus(inquiryId, newStatus);
    if (success) {
      playActionSuccess();
      setInquiries((prev) =>
        prev.map((inq) => (inq.id === inquiryId ? { ...inq, status: newStatus } : inq))
      );
    } else {
      Alert.alert('Notice', 'Unable to update inquiry status. Please try again.');
    }
  };

  // Direct Communication Handlers
  const handleWhatsAppCustomer = (phone: string, customerName: string, date: string) => {
    playButtonClick();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const fullNumber = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const text = `Namaste ${customerName}, this is ${business?.name || 'UtsavHub Partner'}. Thank you for your inquiry for the auspicious Muhurtham on ${date}. We have reviewed your request and would love to assist you.`;
    const url = `whatsapp://send?phone=${fullNumber}&text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://wa.me/${fullNumber}?text=${encodeURIComponent(text)}`);
    });
  };

  const handleCallCustomer = (phone: string) => {
    playButtonClick();
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`);
  };

  // Submit Price Update Request
  const handleSubmitPriceChange = async () => {
    if (!proposedPrice || isNaN(Number(proposedPrice))) {
      Alert.alert('Invalid Price', 'Please enter a valid numeric proposed price.');
      return;
    }

    setSubmittingPrice(true);
    playButtonClick();

    try {
      const newReq = await submitPriceUpdateRequest({
        businessId: selectedBusinessId,
        businessName: business?.name || 'Verified Partner',
        itemType: priceItemType,
        itemName: priceItemName,
        currentPrice: Number(currentBasePrice),
        proposedBasePrice: Number(proposedPrice),
        adminPercentage: DEFAULT_ADMIN_PERCENTAGE,
        notes: priceNotes || 'Vendor annual tariff review',
      });

      playActionSuccess();
      setPriceRequests((prev) => [newReq, ...prev]);
      setPriceModalVisible(false);
      setPriceNotes('');
      Alert.alert(
        'Tariff Update Submitted',
        `Your proposed price of ₹${Number(proposedPrice).toLocaleString('en-IN')} has been sent to the UtsavHub verification team. It will appear on your public listing once verified.`
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to submit price update request.');
    } finally {
      setSubmittingPrice(false);
    }
  };

  // Submit 4K Reel
  const handleAddReel = async () => {
    if (!reelTitle.trim() || !reelVideoUrl.trim()) {
      Alert.alert('Missing Details', 'Please provide a Title and 4K Video URL.');
      return;
    }

    setSubmittingReel(true);
    playButtonClick();

    try {
      const created = await addVendorReel(selectedBusinessId, {
        title: reelTitle.trim(),
        videoUrl: reelVideoUrl.trim(),
        thumbnailUrl: reelThumbUrl.trim() || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80',
        durationSeconds: 30,
      });

      if (created) {
        playActionSuccess();
        if (business) {
          const updatedReels = [created, ...(business.media_reels || [])];
          setBusiness({ ...business, media_reels: updatedReels });
        }
        setReelModalVisible(false);
        setReelTitle('');
        setReelVideoUrl('');
        setReelThumbUrl('');
        Alert.alert('4K Reel Added', 'Your video walkthrough is now live on your profile.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to add video reel.');
    } finally {
      setSubmittingReel(false);
    }
  };

  // Save Hall Specs & Profile
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    playButtonClick();

    try {
      await updateBusinessProfile({
        businessId: selectedBusinessId,
        name: bizName,
        phone: phoneContact,
        whatsapp: whatsappContact,
        seating_capacity: Number(seatingCap),
        floating_capacity: Number(floatingCap),
        ac_rooms_count: Number(roomsCount),
        parking_cars: Number(parkingCars),
        outside_catering_allowed: outsideFood,
        power_backup_kva: Number(powerBackup),
      });

      playActionSuccess();
      if (business) {
        setBusiness({
          ...business,
          name: bizName,
          phone: phoneContact,
          whatsapp_number: whatsappContact,
          venue_details: business.venue_details
            ? {
                ...business.venue_details,
                seating_capacity: Number(seatingCap),
                floating_capacity: Number(floatingCap),
                ac_rooms_count: Number(roomsCount),
                parking_capacity_cars: Number(parkingCars),
                outside_catering_allowed: outsideFood,
                power_backup_kva: Number(powerBackup),
              }
            : undefined,
        });
      }
      setProfileModalVisible(false);
      Alert.alert('Profile Updated', 'Hall specifications saved successfully to database.');
    } catch (e) {
      Alert.alert('Error', 'Failed to update specifications.');
    } finally {
      setSavingProfile(false);
    }
  };

  const renderBusinessForm = (isModal: boolean = false) => {
    const selectedPresets = CATEGORY_IMAGE_PRESETS[newBizCategory] || CATEGORY_IMAGE_PRESETS.venue;
    const currentCover = newBizCoverUrl || selectedPresets[0]?.url;

    return (
      <View style={isModal ? styles.modalFormCard : styles.onboardingFormCard}>
        {isModal && (
          <View style={styles.modalHeaderRow}>
            <View>
              <Text style={styles.modalHeading}>Add Business Offering</Text>
              <Text style={styles.modalSubheading}>Expand your vendor portfolio on UtsavHub</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowNewBizModal(false)}
              style={styles.modalCloseBtn}
            >
              <X size={18} color="#A1A1AA" />
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.onboardingFormTitle}>Step 1: Select Business Category</Text>
        <View style={styles.categorySelectGrid}>
          {[
            { key: 'venue', label: 'Convention Hall', icon: Building },
            { key: 'catering', label: 'Catering & Sweets', icon: Utensils },
            { key: 'decoration', label: 'Mandapam Decor', icon: Flower2 },
            { key: 'photography', label: '4K Photography', icon: Camera },
            { key: 'dj_sound', label: 'DJ & Sound', icon: Music },
          ].map((cat) => {
            const isSelected = newBizCategory === cat.key;
            const IconComp = cat.icon;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.categoryOptionCard, isSelected && styles.categoryOptionCardActive]}
                onPress={() => {
                  playTabPop();
                  setNewBizCategory(cat.key as any);
                  setNewBizCoverUrl(CATEGORY_IMAGE_PRESETS[cat.key]?.[0]?.url || '');
                }}
                activeOpacity={0.8}
              >
                <IconComp size={18} color={isSelected ? '#09090B' : '#C5A059'} />
                <Text style={[styles.categoryOptionText, isSelected && styles.categoryOptionTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* BASIC INFO */}
        <Text style={[styles.onboardingFormTitle, { marginTop: 20 }]}>Step 2: Business Profile</Text>

        <Text style={styles.inputLabel}>OFFICIAL BUSINESS NAME *</Text>
        <TextInput
          style={styles.textInput}
          value={newBizName}
          onChangeText={setNewBizName}
          placeholder="e.g. Sri Krishna Kalyana Mandapam"
          placeholderTextColor="#71717A"
        />

        <Text style={styles.inputLabel}>AREA / LOCALITY (VISAKHAPATNAM) *</Text>
        <View style={styles.localityChipsRow}>
          {LOCALITY_OPTIONS.map((loc) => {
            const isSelected = newBizLocality === loc;
            return (
              <TouchableOpacity
                key={loc}
                style={[styles.localityChip, isSelected && styles.localityChipActive]}
                onPress={() => setNewBizLocality(loc)}
                activeOpacity={0.8}
              >
                <Text style={[styles.localityChipText, isSelected && styles.localityChipTextActive]}>
                  {loc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TextInput
          style={[styles.textInput, { marginTop: 8 }]}
          value={newBizLocality}
          onChangeText={setNewBizLocality}
          placeholder="Or enter custom area / street"
          placeholderTextColor="#71717A"
        />

        <View style={styles.formRowTwoCol}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>PHONE CONTACT *</Text>
            <TextInput
              style={styles.textInput}
              value={newBizPhone}
              onChangeText={setNewBizPhone}
              placeholder="+91 98480 12345"
              placeholderTextColor="#71717A"
              keyboardType="phone-pad"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>WHATSAPP NUMBER *</Text>
            <TextInput
              style={styles.textInput}
              value={newBizWhatsapp}
              onChangeText={setNewBizWhatsapp}
              placeholder="+91 98480 12345"
              placeholderTextColor="#71717A"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* PRICING & SPECIFICATIONS */}
        <Text style={[styles.onboardingFormTitle, { marginTop: 20 }]}>
          Step 3: {newBizCategory === 'venue' ? 'Hall Capacity & Base Tariff' : 'Service Pricing'}
        </Text>

        {newBizCategory === 'venue' ? (
          <>
            <View style={styles.formRowTwoCol}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>24-HR RENTAL PRICE (₹) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newBizBasePrice}
                  onChangeText={setNewBizBasePrice}
                  placeholder="150000"
                  placeholderTextColor="#71717A"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>AC ROOMS COUNT</Text>
                <TextInput
                  style={styles.textInput}
                  value={newBizRoomsCount}
                  onChangeText={setNewBizRoomsCount}
                  placeholder="4"
                  placeholderTextColor="#71717A"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formRowTwoCol}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>SEATING CAPACITY</Text>
                <TextInput
                  style={styles.textInput}
                  value={newBizSeatingCap}
                  onChangeText={setNewBizSeatingCap}
                  placeholder="600"
                  placeholderTextColor="#71717A"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>FLOATING CAPACITY</Text>
                <TextInput
                  style={styles.textInput}
                  value={newBizFloatingCap}
                  onChangeText={setNewBizFloatingCap}
                  placeholder="1200"
                  placeholderTextColor="#71717A"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>PARKING CAPACITY (CARS)</Text>
            <TextInput
              style={styles.textInput}
              value={newBizParkingCars}
              onChangeText={setNewBizParkingCars}
              placeholder="60"
              placeholderTextColor="#71717A"
              keyboardType="numeric"
            />
          </>
        ) : newBizCategory === 'catering' ? (
          <>
            <View style={styles.formRowTwoCol}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>PRICE PER PLATE (₹) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newBizBasePrice}
                  onChangeText={setNewBizBasePrice}
                  placeholder="450"
                  placeholderTextColor="#71717A"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>MIN GUESTS</Text>
                <TextInput
                  style={styles.textInput}
                  value={newBizFloatingCap}
                  onChangeText={setNewBizFloatingCap}
                  placeholder="100"
                  placeholderTextColor="#71717A"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>DIET TYPE</Text>
            <View style={styles.localityChipsRow}>
              {(['veg', 'non_veg', 'mixed'] as const).map((diet) => (
                <TouchableOpacity
                  key={diet}
                  style={[styles.localityChip, newBizDietType === diet && styles.localityChipActive]}
                  onPress={() => setNewBizDietType(diet)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.localityChipText, newBizDietType === diet && styles.localityChipTextActive]}>
                    {diet === 'veg' ? 'Pure Veg' : diet === 'non_veg' ? 'Non-Veg' : 'Mixed (Veg & Non-Veg)'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <View>
            <Text style={styles.inputLabel}>BASE PACKAGE STARTING PRICE (₹) *</Text>
            <TextInput
              style={styles.textInput}
              value={newBizBasePrice}
              onChangeText={setNewBizBasePrice}
              placeholder="75000"
              placeholderTextColor="#71717A"
              keyboardType="numeric"
            />
          </View>
        )}

        {/* STEP 4: COVER IMAGE */}
        <Text style={[styles.onboardingFormTitle, { marginTop: 20 }]}>Step 4: Cover Showcase Photo</Text>
        <Text style={styles.inputLabel}>TAP A PRESET PHOTO OR ENTER URL</Text>
        <View style={styles.presetsPhotoRow}>
          {selectedPresets.map((preset, idx) => {
            const isSelected = currentCover === preset.url;
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.presetPhotoCard, isSelected && styles.presetPhotoCardActive]}
                onPress={() => setNewBizCoverUrl(preset.url)}
                activeOpacity={0.8}
              >
                <Image source={{ uri: preset.url }} style={styles.presetPhotoImg} />
                {isSelected && (
                  <View style={styles.presetSelectedBadge}>
                    <Check size={12} color="#09090B" />
                  </View>
                )}
                <Text style={styles.presetPhotoLabel} numberOfLines={1}>{preset.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TextInput
          style={[styles.textInput, { marginTop: 10 }]}
          value={newBizCoverUrl}
          onChangeText={setNewBizCoverUrl}
          placeholder="Custom Image URL (https://...)"
          placeholderTextColor="#71717A"
        />

        {/* SUBMIT BUTTON */}
        <TouchableOpacity
          style={[styles.publishSubmitBtn, isCreatingBiz && { opacity: 0.7 }]}
          onPress={handleCreateBusiness}
          disabled={isCreatingBiz}
          activeOpacity={0.85}
        >
          {isCreatingBiz ? (
            <ActivityIndicator color="#09090B" size="small" />
          ) : (
            <>
              <Sparkles size={16} color="#09090B" />
              <Text style={styles.publishSubmitBtnText}>
                {isModal ? 'Publish Additional Business' : 'Publish Business & Launch Dashboard'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. EXECUTIVE OBSIDIAN TOP BAR */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Image
            source={{
              uri:
                business?.cover_image_url ||
                'https://images.unsplash.com/photo-1545232979-fbf656513364?auto=format&fit=crop&w=400&q=80',
            }}
            style={styles.bizAvatar}
          />
          <View style={styles.bizInfo}>
            <View style={styles.bizNameRow}>
              <Text style={styles.bizName} numberOfLines={1}>
                {business?.name || 'Sri Venkateswara Grand Palace'}
              </Text>
              <ShieldCheck size={16} color="#C5A059" />
            </View>
            <View style={styles.partnerBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.partnerBadgeText}>Verified Partner Portal</Text>
            </View>
          </View>
        </View>

        <View style={styles.topBarActions}>
          <TouchableOpacity
            style={styles.previewBtn}
            onPress={() => {
              playButtonClick();
              onPreviewPublicListing(selectedBusinessId);
            }}
            activeOpacity={0.8}
          >
            <Eye size={15} color="#C5A059" />
            <Text style={styles.previewBtnText}>Preview</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchRoleBtn}
            onPress={() => {
              playButtonClick();
              onSwitchToCustomer();
            }}
            activeOpacity={0.8}
            accessibilityLabel="Switch to Customer Mode"
          >
            <UserCheck size={16} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => {
              playButtonClick();
              logout();
            }}
            activeOpacity={0.8}
            accessibilityLabel="Sign Out"
          >
            <LogOut size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* MULTI-BUSINESS PORTFOLIO SWITCHER */}
        {availableBusinesses.length > 1 && (
          <View style={styles.businessSwitcherContainer}>
            <View style={styles.businessSwitcherHeader}>
              <Sliders size={13} color="#C5A059" />
              <Text style={styles.businessSwitcherLabel}>Managed Business Offerings ({availableBusinesses.length})</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.businessSwitcherScroll}
            >
              {availableBusinesses.map((b) => {
                const isSelected = b.id === selectedBusinessId;
                return (
                  <TouchableOpacity
                    key={b.id}
                    style={[
                      styles.businessSwitchPill,
                      isSelected && styles.businessSwitchPillActive,
                    ]}
                    onPress={() => {
                      playTabPop();
                      setSelectedBusinessId(b.id);
                    }}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.businessPillDot,
                        isSelected ? { backgroundColor: '#C5A059' } : { backgroundColor: '#71717A' },
                      ]}
                    />
                    <Text
                      style={[
                        styles.businessSwitchPillText,
                        isSelected && styles.businessSwitchPillTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {b.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* 2. EXECUTIVE PERFORMANCE KPI GRID */}
        <View style={styles.kpiGrid}>
          {/* KPI 1: Active Inquiries */}
          <TouchableOpacity
            style={[styles.kpiCard, activeTab === 'inquiries' && styles.kpiCardActive]}
            onPress={() => {
              playTabPop();
              setActiveTab('inquiries');
            }}
            activeOpacity={0.85}
          >
            <View style={styles.kpiHeaderRow}>
              <Text style={styles.kpiLabel}>ACTIVE HOLDS</Text>
              <View style={styles.kpiIconWrapAmber}>
                <Clock size={14} color="#F59E0B" />
              </View>
            </View>
            <Text style={styles.kpiValue}>{inquiries.length}</Text>
            <View style={styles.kpiSubRow}>
              <View style={styles.pulseDotAmber} />
              <Text style={styles.kpiSubAmber}>{pendingInquiriesCount} Require Action</Text>
            </View>
          </TouchableOpacity>

          {/* KPI 2: Pipeline Revenue */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeaderRow}>
              <Text style={styles.kpiLabel}>PIPELINE VALUE</Text>
              <View style={styles.kpiIconWrapGold}>
                <DollarSign size={14} color="#C5A059" />
              </View>
            </View>
            <Text style={styles.kpiValue}>
              ₹{(pipelineValue / 100000).toFixed(1)}L
            </Text>
            <Text style={styles.kpiSubMuted}>Confirmed & Pending</Text>
          </View>

          {/* KPI 3: Store Rating */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeaderRow}>
              <Text style={styles.kpiLabel}>STORE RATING</Text>
              <View style={styles.kpiIconWrapGreen}>
                <Sparkles size={14} color="#10B981" />
              </View>
            </View>
            <Text style={styles.kpiValue}>4.9 ★</Text>
            <Text style={styles.kpiSubGreen}>99% Response Rate</Text>
          </View>

          {/* KPI 4: Listing Status */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => {
              playButtonClick();
              setIsStoreActive(!isStoreActive);
            }}
            activeOpacity={0.85}
          >
            <View style={styles.kpiHeaderRow}>
              <Text style={styles.kpiLabel}>STORE STATUS</Text>
              <View
                style={[
                  styles.kpiIconWrapStatus,
                  { backgroundColor: isStoreActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' },
                ]}
              >
                <View
                  style={[
                    styles.statusIndicatorDot,
                    { backgroundColor: isStoreActive ? '#10B981' : '#EF4444' },
                  ]}
                />
              </View>
            </View>
            <Text
              style={[
                styles.kpiValueStatus,
                { color: isStoreActive ? '#10B981' : '#EF4444' },
              ]}
            >
              {isStoreActive ? 'LIVE' : 'PAUSED'}
            </Text>
            <Text style={styles.kpiSubMuted}>Instant Muhurtham</Text>
          </TouchableOpacity>
        </View>

        {/* 3. SEGMENTED NAVIGATION TABS */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'inquiries' && styles.tabButtonActive]}
            onPress={() => {
              playTabPop();
              setActiveTab('inquiries');
            }}
            activeOpacity={0.8}
          >
            <Calendar
              size={15}
              color={activeTab === 'inquiries' ? '#09090B' : '#A1A1AA'}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'inquiries' && styles.tabButtonTextActive,
              ]}
            >
              Inquiries ({inquiries.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'pricing' && styles.tabButtonActive]}
            onPress={() => {
              playTabPop();
              setActiveTab('pricing');
            }}
            activeOpacity={0.8}
          >
            <DollarSign
              size={15}
              color={activeTab === 'pricing' ? '#09090B' : '#A1A1AA'}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'pricing' && styles.tabButtonTextActive,
              ]}
            >
              Services & Pricing
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'media' && styles.tabButtonActive]}
            onPress={() => {
              playTabPop();
              setActiveTab('media');
            }}
            activeOpacity={0.8}
          >
            <Video
              size={15}
              color={activeTab === 'media' ? '#09090B' : '#A1A1AA'}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'media' && styles.tabButtonTextActive,
              ]}
            >
              4K Reels ({business?.media_reels?.length || 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'profile' && styles.tabButtonActive]}
            onPress={() => {
              playTabPop();
              setActiveTab('profile');
            }}
            activeOpacity={0.8}
          >
            <Building
              size={15}
              color={activeTab === 'profile' ? '#09090B' : '#A1A1AA'}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'profile' && styles.tabButtonTextActive,
              ]}
            >
              Hall Specs
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4. TAB CONTENTS */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#C5A059" />
            <Text style={styles.loadingText}>Syncing Partner Records...</Text>
          </View>
        ) : (
          <>
            {/* TAB 1: INQUIRIES & HOLDS */}
            {activeTab === 'inquiries' && (
              <View style={styles.tabSection}>
                {/* Status Filter Pills */}
                <View style={styles.filterRow}>
                  <TouchableOpacity
                    style={[styles.filterChip, inquiryFilter === 'all' && styles.filterChipActive]}
                    onPress={() => setInquiryFilter('all')}
                  >
                    <Text style={[styles.filterChipText, inquiryFilter === 'all' && styles.filterChipTextActive]}>
                      All ({inquiries.length})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.filterChip, inquiryFilter === 'pending' && styles.filterChipActive]}
                    onPress={() => setInquiryFilter('pending')}
                  >
                    <Text style={[styles.filterChipText, inquiryFilter === 'pending' && styles.filterChipTextActive]}>
                      Pending ({pendingInquiriesCount})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.filterChip, inquiryFilter === 'confirmed' && styles.filterChipActive]}
                    onPress={() => setInquiryFilter('confirmed')}
                  >
                    <Text style={[styles.filterChipText, inquiryFilter === 'confirmed' && styles.filterChipTextActive]}>
                      Confirmed
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.filterChip, inquiryFilter === 'declined' && styles.filterChipActive]}
                    onPress={() => setInquiryFilter('declined')}
                  >
                    <Text style={[styles.filterChipText, inquiryFilter === 'declined' && styles.filterChipTextActive]}>
                      Declined
                    </Text>
                  </TouchableOpacity>
                </View>

                {filteredInquiries.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Calendar size={40} color="#71717A" />
                    <Text style={styles.emptyTitle}>No Inquiries in this Category</Text>
                    <Text style={styles.emptySub}>
                      When prospective brides and grooms request date holds for {business?.name || 'your hall'}, they will appear here instantly.
                    </Text>
                  </View>
                ) : (
                  filteredInquiries.map((inq) => {
                    const isPending = inq.status === 'pending';
                    const isConfirmed = inq.status === 'confirmed' || inq.status === 'approved';
                    const isDeclined = inq.status === 'declined' || inq.status === 'rejected';

                    return (
                      <View key={inq.id} style={styles.inquiryCard}>
                        {/* Card Top Row */}
                        <View style={styles.inquiryTopRow}>
                          <View style={styles.customerAvatar}>
                            <Text style={styles.customerInitial}>
                              {inq.customer_name ? inq.customer_name[0].toUpperCase() : 'G'}
                            </Text>
                          </View>

                          <View style={styles.customerMeta}>
                            <Text style={styles.customerName}>{inq.customer_name}</Text>
                            <Text style={styles.customerPhone}>{inq.customer_phone}</Text>
                          </View>

                          <View
                            style={[
                              styles.statusPill,
                              isPending && styles.statusPillAmber,
                              isConfirmed && styles.statusPillEmerald,
                              isDeclined && styles.statusPillRed,
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusPillText,
                                isPending && styles.statusPillTextAmber,
                                isConfirmed && styles.statusPillTextEmerald,
                                isDeclined && styles.statusPillTextRed,
                              ]}
                            >
                              {isPending ? 'PENDING HOLD' : isConfirmed ? 'CONFIRMED' : 'DECLINED'}
                            </Text>
                          </View>
                        </View>

                        {/* Specs Matrix */}
                        <View style={styles.inquirySpecsBox}>
                          <View style={styles.inquirySpecItem}>
                            <Calendar size={13} color="#C5A059" />
                            <Text style={styles.inquirySpecLabel}>Muhurtham:</Text>
                            <Text style={styles.inquirySpecValue}>{inq.event_date}</Text>
                          </View>

                          <View style={styles.inquirySpecItem}>
                            <Users size={13} color="#C5A059" />
                            <Text style={styles.inquirySpecLabel}>Guests:</Text>
                            <Text style={styles.inquirySpecValue}>{inq.guest_count} Pax</Text>
                          </View>

                          <View style={styles.inquirySpecItem}>
                            <DollarSign size={13} color="#C5A059" />
                            <Text style={styles.inquirySpecLabel}>Estimated:</Text>
                            <Text style={styles.inquirySpecValueGold}>
                              ₹{(inq.final_customer_amount || inq.vendor_base_amount || 175000).toLocaleString('en-IN')}
                            </Text>
                          </View>
                        </View>

                        {inq.notes ? (
                          <View style={styles.notesBox}>
                            <Text style={styles.notesText}>"{inq.notes}"</Text>
                          </View>
                        ) : null}

                        {/* Action Buttons */}
                        <View style={styles.inquiryActionsRow}>
                          {isPending && (
                            <>
                              <TouchableOpacity
                                style={styles.approveBtn}
                                onPress={() => handleInquiryStatus(inq.id, 'confirmed')}
                                activeOpacity={0.8}
                              >
                                <Check size={15} color="#FFFFFF" />
                                <Text style={styles.approveBtnText}>Approve Date Hold</Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={styles.declineBtn}
                                onPress={() => handleInquiryStatus(inq.id, 'declined')}
                                activeOpacity={0.8}
                              >
                                <X size={15} color="#EF4444" />
                              </TouchableOpacity>
                            </>
                          )}

                          <TouchableOpacity
                            style={styles.actionIconBtnWhatsApp}
                            onPress={() =>
                              handleWhatsAppCustomer(inq.customer_phone, inq.customer_name, inq.event_date)
                            }
                            activeOpacity={0.8}
                            accessibilityLabel="WhatsApp Customer"
                          >
                            <MessageCircle size={17} color="#FFFFFF" />
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.actionIconBtnPhone}
                            onPress={() => handleCallCustomer(inq.customer_phone)}
                            activeOpacity={0.8}
                            accessibilityLabel="Call Customer"
                          >
                            <Phone size={17} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {/* TAB 2: SERVICES & PRICING */}
            {activeTab === 'pricing' && (
              <View style={styles.tabSection}>
                {/* Top Action */}
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Published Tariffs</Text>
                    <Text style={styles.sectionSub}>Active pricing shown across customer storefronts</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => {
                      playButtonClick();
                      setPriceModalVisible(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Plus size={15} color="#09090B" />
                    <Text style={styles.addBtnText}>Request Tariff Change</Text>
                  </TouchableOpacity>
                </View>

                {/* Published Service Cards */}
                <View style={styles.pricingCard}>
                  <View style={styles.pricingCardTop}>
                    <Building size={20} color="#C5A059" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.pricingTitle}>AC Grand Hall 24-Hour Rental</Text>
                      <Text style={styles.pricingSub}>Includes 8 AC Deluxe Rooms, Generator & Security</Text>
                    </View>
                    <View style={styles.pricePill}>
                      <Text style={styles.pricePillText}>
                        ₹{Number(currentBasePrice).toLocaleString('en-IN')}
                      </Text>
                      <Text style={styles.pricePillUnit}>/ day</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.pricingCard}>
                  <View style={styles.pricingCardTop}>
                    <Flower2 size={20} color="#C5A059" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.pricingTitle}>Traditional Mandapam Decor Base</Text>
                      <Text style={styles.pricingSub}>Fresh Jasmine, Marigold, Royal Stage Backdrops</Text>
                    </View>
                    <View style={styles.pricePill}>
                      <Text style={styles.pricePillText}>₹1,40,000</Text>
                      <Text style={styles.pricePillUnit}>/ event</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.pricingCard}>
                  <View style={styles.pricingCardTop}>
                    <Utensils size={20} color="#C5A059" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.pricingTitle}>Royal Telugu Wedding Feast</Text>
                      <Text style={styles.pricingSub}>32+ Classic Items on Banana Leaf</Text>
                    </View>
                    <View style={styles.pricePill}>
                      <Text style={styles.pricePillText}>₹450</Text>
                      <Text style={styles.pricePillUnit}>/ plate</Text>
                    </View>
                  </View>
                </View>

                {/* Transparent 10% Margin Math Card */}
                <View style={styles.marginExplanationCard}>
                  <View style={styles.marginHeader}>
                    <Percent size={18} color="#C5A059" />
                    <Text style={styles.marginTitle}>Transparent 10% Platform Protection</Text>
                  </View>
                  <Text style={styles.marginBody}>
                    UtsavHub guarantees you 100% of your agreed base payout. We add a modest 10% platform guarantee markup on customer invoices to fund escrow security, 24/7 power monitoring, and dispute resolution.
                  </Text>
                  <View style={styles.marginFormulaRow}>
                    <Text style={styles.formulaText}>
                      Vendor Base Payout (100%) + Platform Guarantee (10%) = Final Customer Invoice (110%)
                    </Text>
                  </View>
                </View>

                {/* Price Request History */}
                <View style={styles.historyContainer}>
                  <Text style={styles.historyTitle}>Tariff Update Requests</Text>
                  {priceRequests.length === 0 ? (
                    <Text style={styles.historyEmptyText}>No pending tariff update requests.</Text>
                  ) : (
                    priceRequests.map((req) => (
                      <View key={req.id} style={styles.historyRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.historyItemName}>{req.item_name}</Text>
                          <Text style={styles.historyProposed}>
                            ₹{req.current_price.toLocaleString('en-IN')} → ₹{req.proposed_base_price.toLocaleString('en-IN')}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.historyStatusPill,
                            req.status === 'approved' && styles.historyStatusApproved,
                            req.status === 'rejected' && styles.historyStatusRejected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.historyStatusText,
                              req.status === 'approved' && styles.historyStatusTextApproved,
                              req.status === 'rejected' && styles.historyStatusTextRejected,
                            ]}
                          >
                            {req.status === 'pending_approval' ? 'Under Review' : req.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </View>
            )}

            {/* TAB 3: 4K REELS & MEDIA */}
            {activeTab === 'media' && (
              <View style={styles.tabSection}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitle}>4K Video Walkthroughs</Text>
                    <Text style={styles.sectionSub}>Engage wedding planners with cinematic reels</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => {
                      playButtonClick();
                      setReelModalVisible(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Plus size={15} color="#09090B" />
                    <Text style={styles.addBtnText}>Add 4K Reel</Text>
                  </TouchableOpacity>
                </View>

                {/* Reels Grid */}
                <View style={styles.reelsGrid}>
                  {(business?.media_reels || []).map((reel) => (
                    <TouchableOpacity
                      key={reel.id}
                      style={styles.reelCard}
                      onPress={() => {
                        playButtonClick();
                        setSelectedReel(reel);
                      }}
                      activeOpacity={0.85}
                    >
                      <Image source={{ uri: reel.thumbnail_url }} style={styles.reelThumb} />
                      <View style={styles.reelPlayOverlay}>
                        <View style={styles.playIconCircle}>
                          <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
                        </View>
                      </View>
                      <View style={styles.reelInfoOverlay}>
                        <Text style={styles.reelCardTitle} numberOfLines={1}>
                          {reel.title}
                        </Text>
                        <Text style={styles.reelDuration}>
                          {reel.duration_seconds || 30}s • 4K HDR
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Photo Gallery Grid */}
                <View style={styles.gallerySection}>
                  <Text style={styles.galleryTitle}>High-Resolution Photography</Text>
                  <View style={styles.photoGrid}>
                    {(business?.gallery_images || []).map((img, idx) => (
                      <View key={idx} style={styles.photoWrap}>
                        <Image source={{ uri: img }} style={styles.photoItem} />
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* TAB 4: HALL SPECS & PROFILE */}
            {activeTab === 'profile' && (
              <View style={styles.tabSection}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Hall Specifications</Text>
                    <Text style={styles.sectionSub}>Technical capacity, power backup, and amenities</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => {
                      playButtonClick();
                      setProfileModalVisible(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Sliders size={15} color="#09090B" />
                    <Text style={styles.addBtnText}>Edit Specs</Text>
                  </TouchableOpacity>
                </View>

                {/* Technical Specs Matrix Card */}
                <View style={styles.specsMatrixCard}>
                  <View style={styles.specGridRow}>
                    <View style={styles.specGridItem}>
                      <Users size={18} color="#C5A059" />
                      <Text style={styles.specGridVal}>{seatingCap} Guests</Text>
                      <Text style={styles.specGridName}>Seating Capacity</Text>
                    </View>

                    <View style={styles.specGridDivider} />

                    <View style={styles.specGridItem}>
                      <Users size={18} color="#C5A059" />
                      <Text style={styles.specGridVal}>{floatingCap} Guests</Text>
                      <Text style={styles.specGridName}>Floating Capacity</Text>
                    </View>
                  </View>

                  <View style={styles.specGridRowDivider} />

                  <View style={styles.specGridRow}>
                    <View style={styles.specGridItem}>
                      <Building size={18} color="#C5A059" />
                      <Text style={styles.specGridVal}>{roomsCount} Suites</Text>
                      <Text style={styles.specGridName}>AC Guest Rooms</Text>
                    </View>

                    <View style={styles.specGridDivider} />

                    <View style={styles.specGridItem}>
                      <Car size={18} color="#C5A059" />
                      <Text style={styles.specGridVal}>{parkingCars} Cars</Text>
                      <Text style={styles.specGridName}>Parking Bays</Text>
                    </View>
                  </View>

                  <View style={styles.specGridRowDivider} />

                  <View style={styles.specGridRow}>
                    <View style={styles.specGridItem}>
                      <Zap size={18} color="#C5A059" />
                      <Text style={styles.specGridVal}>{powerBackup} kVA</Text>
                      <Text style={styles.specGridName}>Generator Backup</Text>
                    </View>

                    <View style={styles.specGridDivider} />

                    <View style={styles.specGridItem}>
                      <Utensils size={18} color="#C5A059" />
                      <Text style={styles.specGridVal}>{outsideFood ? 'Allowed' : 'In-House'}</Text>
                      <Text style={styles.specGridName}>Outside Catering</Text>
                    </View>
                  </View>
                </View>

                {/* Contact & Location Info */}
                <View style={styles.contactCard}>
                  <Text style={styles.contactTitle}>Verified Contact & Concierge Routing</Text>
                  <View style={styles.contactRow}>
                    <Phone size={15} color="#A1A1AA" />
                    <Text style={styles.contactText}>Direct Phone: {phoneContact}</Text>
                  </View>
                  <View style={styles.contactRow}>
                    <MessageCircle size={15} color="#A1A1AA" />
                    <Text style={styles.contactText}>WhatsApp Booking Desk: {whatsappContact}</Text>
                  </View>
                  <View style={styles.contactRow}>
                    <MapPin size={15} color="#A1A1AA" />
                    <Text style={styles.contactText}>
                      Locality: {business?.area_locality || 'Madhurawada'}, {business?.city || 'Visakhapatnam'}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* 5. MODAL: REQUEST TARIFF UPDATE */}
      <Modal visible={priceModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalDialog}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Tariff Change</Text>
              <TouchableOpacity onPress={() => setPriceModalVisible(false)}>
                <X size={20} color="#A1A1AA" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Service / Package Item</Text>
              <TextInput
                style={styles.textInput}
                value={priceItemName}
                onChangeText={setPriceItemName}
                placeholder="Item name"
                placeholderTextColor="#71717A"
              />

              <Text style={styles.inputLabel}>Current Base Price (₹)</Text>
              <TextInput
                style={[styles.textInput, styles.textInputDisabled]}
                value={currentBasePrice}
                editable={false}
              />

              <Text style={styles.inputLabel}>Proposed New Base Price (₹)</Text>
              <TextInput
                style={styles.textInput}
                value={proposedPrice}
                onChangeText={setProposedPrice}
                keyboardType="numeric"
                placeholder="e.g. 190000"
                placeholderTextColor="#71717A"
              />

              <Text style={styles.inputLabel}>Reason / Notes for Admin</Text>
              <TextInput
                style={[styles.textInput, { height: 70 }]}
                value={priceNotes}
                onChangeText={setPriceNotes}
                placeholder="e.g. Upgraded central AC chillers and banquet furniture"
                placeholderTextColor="#71717A"
                multiline
              />

              <TouchableOpacity
                style={styles.submitModalBtn}
                onPress={handleSubmitPriceChange}
                disabled={submittingPrice}
                activeOpacity={0.85}
              >
                {submittingPrice ? (
                  <ActivityIndicator color="#09090B" />
                ) : (
                  <Text style={styles.submitModalBtnText}>Submit to UtsavHub Admin</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 6. MODAL: ADD 4K REEL */}
      <Modal visible={reelModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalDialog}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add 4K Video Reel</Text>
              <TouchableOpacity onPress={() => setReelModalVisible(false)}>
                <X size={20} color="#A1A1AA" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Reel Title</Text>
              <TextInput
                style={styles.textInput}
                value={reelTitle}
                onChangeText={setReelTitle}
                placeholder="e.g. Royal Grand Dining Hall Walkthrough"
                placeholderTextColor="#71717A"
              />

              <Text style={styles.inputLabel}>4K Video URL (.mp4 / stream)</Text>
              <TextInput
                style={styles.textInput}
                value={reelVideoUrl}
                onChangeText={setReelVideoUrl}
                placeholder="https://assets.utsavhub.com/videos/hall_walkthrough.mp4"
                placeholderTextColor="#71717A"
              />

              <Text style={styles.inputLabel}>Thumbnail Image URL (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={reelThumbUrl}
                onChangeText={setReelThumbUrl}
                placeholder="https://images.unsplash.com/photo-..."
                placeholderTextColor="#71717A"
              />

              <TouchableOpacity
                style={styles.submitModalBtn}
                onPress={handleAddReel}
                disabled={submittingReel}
                activeOpacity={0.85}
              >
                {submittingReel ? (
                  <ActivityIndicator color="#09090B" />
                ) : (
                  <Text style={styles.submitModalBtnText}>Publish 4K Reel</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 7. MODAL: EDIT HALL SPECS */}
      <Modal visible={profileModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalDialog}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Hall Specifications</Text>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                <X size={20} color="#A1A1AA" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Business Listing Name</Text>
              <TextInput
                style={styles.textInput}
                value={bizName}
                onChangeText={setBizName}
                placeholder="Hall name"
                placeholderTextColor="#71717A"
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Seating Capacity</Text>
                  <TextInput
                    style={styles.textInput}
                    value={seatingCap}
                    onChangeText={setSeatingCap}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Floating Capacity</Text>
                  <TextInput
                    style={styles.textInput}
                    value={floatingCap}
                    onChangeText={setFloatingCap}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>AC Guest Rooms</Text>
                  <TextInput
                    style={styles.textInput}
                    value={roomsCount}
                    onChangeText={setRoomsCount}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Parking Bays</Text>
                  <TextInput
                    style={styles.textInput}
                    value={parkingCars}
                    onChangeText={setParkingCars}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Generator Backup (kVA)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={powerBackup}
                    onChangeText={setPowerBackup}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Outside Catering</Text>
                  <TouchableOpacity
                    style={[styles.textInput, { justifyContent: 'center' }]}
                    onPress={() => setOutsideFood(!outsideFood)}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>
                      {outsideFood ? 'Allowed' : 'Not Allowed'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.inputLabel}>Direct Phone</Text>
              <TextInput
                style={styles.textInput}
                value={phoneContact}
                onChangeText={setPhoneContact}
                placeholder="+91 98480 12345"
                placeholderTextColor="#71717A"
              />

              <Text style={styles.inputLabel}>WhatsApp Desk</Text>
              <TextInput
                style={styles.textInput}
                value={whatsappContact}
                onChangeText={setWhatsappContact}
                placeholder="+91 98480 12345"
                placeholderTextColor="#71717A"
              />

              <TouchableOpacity
                style={styles.submitModalBtn}
                onPress={handleSaveProfile}
                disabled={savingProfile}
                activeOpacity={0.85}
              >
                {savingProfile ? (
                  <ActivityIndicator color="#09090B" />
                ) : (
                  <Text style={styles.submitModalBtnText}>Save Specifications</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 8. INTERACTIVE 4K REEL VIEWER MODAL */}
      <ReelModal
        visible={!!selectedReel}
        reel={selectedReel}
        business={business}
        onClose={() => setSelectedReel(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ceremonyOfferChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#2A2A32',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  ceremonyOfferChipText: {
    fontSize: 11,
    color: '#E4E4E7',
    fontWeight: '600',
  },
  vendorStartingPriceCard: {
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C5A059',
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vendorStartingPriceLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C5A059',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  vendorStartingPriceValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  vendorNegotiableBadge: {
    backgroundColor: '#231E12',
    borderWidth: 1,
    borderColor: '#C5A059',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  vendorNegotiableBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C5A059',
  },
  vendorCategoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C5A059',
    letterSpacing: 0.5,
  },
  vendorMiniNegotiableTag: {
    backgroundColor: '#14291E',
    borderWidth: 1,
    borderColor: '#10B981',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  vendorMiniNegotiableTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#10B981',
  },

  container: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  topBar: {
    backgroundColor: '#121215',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bizAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#27272A',
    borderWidth: 1.5,
    borderColor: '#C5A059',
  },
  bizInfo: {
    marginLeft: 12,
    flex: 1,
  },
  bizNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bizName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    maxWidth: '85%',
  },
  partnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  partnerBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(197, 160, 89, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.3)',
  },
  previewBtnText: {
    color: '#C5A059',
    fontSize: 12,
    fontWeight: '700',
  },
  switchRoleBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#1F1F24',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  businessSwitcherContainer: {
    marginBottom: 16,
    backgroundColor: '#121215',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  businessSwitcherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  businessSwitcherLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C5A059',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  businessSwitcherScroll: {
    gap: 8,
    flexDirection: 'row',
  },
  businessSwitchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#1C1C21',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  businessSwitchPillActive: {
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    borderColor: '#C5A059',
  },
  businessPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  businessSwitchPillText: {
    fontSize: 12,
    color: '#A1A1AA',
    fontWeight: '600',
  },
  businessSwitchPillTextActive: {
    color: '#C5A059',
    fontWeight: '700',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#121215',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  kpiCardActive: {
    borderColor: 'rgba(197, 160, 89, 0.5)',
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  kpiLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#71717A',
    letterSpacing: 0.5,
  },
  kpiIconWrapAmber: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiIconWrapGold: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(197, 160, 89, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiIconWrapGreen: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiIconWrapStatus: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  kpiValueStatus: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  kpiSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  pulseDotAmber: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  kpiSubAmber: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
  },
  kpiSubMuted: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 4,
  },
  kpiSubGreen: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#18181B',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 9,
  },
  tabButtonActive: {
    backgroundColor: '#C5A059',
  },
  tabButtonText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#A1A1AA',
  },
  tabButtonTextActive: {
    color: '#09090B',
    fontWeight: '800',
  },
  tabSection: {
    gap: 16,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#A1A1AA',
    fontSize: 13,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    borderColor: '#C5A059',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  filterChipTextActive: {
    color: '#C5A059',
    fontWeight: '800',
  },
  inquiryCard: {
    backgroundColor: '#121215',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  inquiryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#27272A',
    borderWidth: 1,
    borderColor: '#C5A059',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerInitial: {
    fontSize: 16,
    fontWeight: '800',
    color: '#C5A059',
  },
  customerMeta: {
    flex: 1,
    marginLeft: 10,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  customerPhone: {
    fontSize: 12,
    color: '#71717A',
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#27272A',
  },
  statusPillAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  statusPillEmerald: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  statusPillRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  statusPillTextAmber: {
    color: '#F59E0B',
  },
  statusPillTextEmerald: {
    color: '#10B981',
  },
  statusPillTextRed: {
    color: '#EF4444',
  },
  inquirySpecsBox: {
    backgroundColor: '#18181B',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  inquirySpecItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inquirySpecLabel: {
    fontSize: 11,
    color: '#71717A',
  },
  inquirySpecValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  inquirySpecValueGold: {
    fontSize: 12,
    fontWeight: '800',
    color: '#C5A059',
  },
  notesBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  notesText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#A1A1AA',
  },
  inquiryActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 9,
    borderRadius: 8,
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  declineBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconBtnWhatsApp: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconBtnPhone: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionSub: {
    fontSize: 11.5,
    color: '#71717A',
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#C5A059',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#09090B',
    fontSize: 12,
    fontWeight: '800',
  },
  pricingCard: {
    backgroundColor: '#121215',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  pricingCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pricingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pricingSub: {
    fontSize: 11.5,
    color: '#71717A',
    marginTop: 2,
  },
  pricePill: {
    alignItems: 'flex-end',
  },
  pricePillText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#C5A059',
  },
  pricePillUnit: {
    fontSize: 10,
    color: '#71717A',
  },
  marginExplanationCard: {
    backgroundColor: 'rgba(197, 160, 89, 0.08)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.25)',
  },
  marginHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  marginTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#C5A059',
  },
  marginBody: {
    fontSize: 12,
    color: '#A1A1AA',
    lineHeight: 18,
    marginBottom: 8,
  },
  marginFormulaRow: {
    backgroundColor: '#121215',
    borderRadius: 6,
    padding: 8,
  },
  formulaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C5A059',
    textAlign: 'center',
  },
  historyContainer: {
    marginTop: 10,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  historyEmptyText: {
    fontSize: 12,
    color: '#71717A',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#121215',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  historyItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  historyProposed: {
    fontSize: 11.5,
    color: '#C5A059',
    marginTop: 2,
  },
  historyStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  historyStatusApproved: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  historyStatusRejected: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  historyStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
  },
  historyStatusTextApproved: {
    color: '#10B981',
  },
  historyStatusTextRejected: {
    color: '#EF4444',
  },
  reelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  reelCard: {
    width: '48%',
    aspectRatio: 9 / 14,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#18181B',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  reelThumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  reelPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  playIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderWidth: 1.5,
    borderColor: '#C5A059',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 3,
  },
  reelInfoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(9, 9, 11, 0.85)',
  },
  reelCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  reelDuration: {
    fontSize: 10,
    color: '#C5A059',
    marginTop: 2,
    fontWeight: '600',
  },
  gallerySection: {
    marginTop: 16,
  },
  galleryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoWrap: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#18181B',
  },
  photoItem: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  specsMatrixCard: {
    backgroundColor: '#121215',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  specGridRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specGridItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  specGridVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 6,
  },
  specGridName: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 2,
  },
  specGridDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  specGridRowDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 4,
  },
  contactCard: {
    backgroundColor: '#121215',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  contactTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#C5A059',
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 12.5,
    color: '#D4D4D8',
  },
  emptyCard: {
    backgroundColor: '#121215',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12.5,
    color: '#71717A',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalDialog: {
    backgroundColor: '#121215',
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.3)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A1A1AA',
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: '#18181B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#FFFFFF',
  },
  textInputDisabled: {
    backgroundColor: '#1F1F24',
    color: '#71717A',
  },
  submitModalBtn: {
    backgroundColor: '#C5A059',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  submitModalBtnText: {
    color: '#09090B',
    fontSize: 14,
    fontWeight: '800',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#09090B',
    padding: 20,
  },
  loadingText: {
    color: '#A1A1AA',
    marginTop: 12,
    fontSize: 13,
  },
  onboardingContainer: {
    gap: 16,
  },
  onboardingHeroCard: {
    backgroundColor: '#121215',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.3)',
    marginBottom: 16,
  },
  goldCrestCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#C5A059',
    marginBottom: 12,
  },
  onboardingBadge: {
    backgroundColor: 'rgba(197, 160, 89, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  onboardingBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C5A059',
    letterSpacing: 1,
  },
  onboardingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  onboardingSubtitle: {
    fontSize: 13,
    color: '#A1A1AA',
    textAlign: 'center',
    lineHeight: 19,
  },
  onboardingFormCard: {
    backgroundColor: '#121215',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  onboardingFormTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  categorySelectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1C1C21',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  categoryOptionCardActive: {
    backgroundColor: '#C5A059',
    borderColor: '#C5A059',
  },
  categoryOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E4E4E7',
  },
  categoryOptionTextActive: {
    color: '#09090B',
  },
  localityChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  localityChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1C1C21',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  localityChipActive: {
    backgroundColor: 'rgba(197, 160, 89, 0.2)',
    borderColor: '#C5A059',
  },
  localityChipText: {
    fontSize: 11,
    color: '#A1A1AA',
    fontWeight: '600',
  },
  localityChipTextActive: {
    color: '#C5A059',
    fontWeight: '700',
  },
  formRowTwoCol: {
    flexDirection: 'row',
    gap: 10,
  },
  presetsPhotoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetPhotoCard: {
    width: '48%',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: '#1C1C21',
    position: 'relative',
  },
  presetPhotoCardActive: {
    borderColor: '#C5A059',
  },
  presetPhotoImg: {
    width: '100%',
    height: 80,
  },
  presetSelectedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#C5A059',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetPhotoLabel: {
    fontSize: 10,
    color: '#D4D4D8',
    padding: 6,
    fontWeight: '600',
  },
  publishSubmitBtn: {
    backgroundColor: '#C5A059',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 22,
  },
  publishSubmitBtnText: {
    color: '#09090B',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  addBizPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(197, 160, 89, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.4)',
    borderStyle: 'dashed',
    gap: 4,
  },
  addBizPillText: {
    fontSize: 12,
    color: '#C5A059',
    fontWeight: '700',
  },
  modalFormCard: {
    backgroundColor: '#121215',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 40,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.3)',
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalSubheading: {
    fontSize: 12,
    color: '#A1A1AA',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#27272A',
    justifyContent: 'center',
    alignItems: 'center',
  },
});