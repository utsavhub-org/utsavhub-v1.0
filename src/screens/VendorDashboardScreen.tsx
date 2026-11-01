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
  Camera,
  Music,
  ChevronDown,
  Layers,
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
  addVendorOffering,
  getVendorInquiries,
  updateInquiryStatus,
  sendQuotationCounterOffer,
  createVendorBusiness,
  updateBusinessProfile,
  DEFAULT_ADMIN_PERCENTAGE,
} from '../lib/supabaseClient';
import {
  Business,
  BusinessCategory,
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

const SERVICE_CAPABILITIES: {
  id: BusinessCategory;
  name: string;
  subtitle: string;
  icon: any;
  badge: string;
}[] = [
  {
    id: 'venue',
    name: 'Function Hall / Kalyana Mandapam',
    subtitle: 'Hall specs, guest capacity, suites & 24-hr base tariff',
    icon: Building,
    badge: 'Hall Specs',
  },
  {
    id: 'decoration',
    name: 'Mandapam & Wedding Decor',
    subtitle: 'Mandapam sets, entrance wayworks, sangeeth & home decor',
    icon: Flower2,
    badge: 'Sets & Themes',
  },
  {
    id: 'catering',
    name: 'Royal Catering & Feasts',
    subtitle: 'Meal plans with menu items, price per plate & min plates',
    icon: Utensils,
    badge: 'Meal Plans',
  },
  {
    id: 'photography',
    name: '4K Photography & Cinema',
    subtitle: 'Wedding cinema, traditional shoot, teaser reels & albums',
    icon: Camera,
    badge: 'Shoot Plans',
  },
  {
    id: 'dj_sound',
    name: 'DJ, Concert Sound & Stage Lights',
    subtitle: 'Watts RMS line arrays, sharpie trusses & cold spark pyro',
    icon: Music,
    badge: 'Audio & Light',
  },
];

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
  const [phoneContact, setPhoneContact] = useState(currentUser?.phone || '');
  const [whatsappContact, setWhatsappContact] = useState(currentUser?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Active Capability / Service Dropdown State
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<BusinessCategory>('decoration');
  const [serviceDropdownVisible, setServiceDropdownVisible] = useState(false);
  const [offeringSubFilter, setOfferingSubFilter] = useState<string>('all');

  // Add Offering Modal State
  const [addOfferingModalVisible, setAddOfferingModalVisible] = useState(false);
  const [isSubmittingOffering, setIsSubmittingOffering] = useState(false);

  // Negotiation Modal State
  const [counterModalVisible, setCounterModalVisible] = useState(false);
  const [selectedInquiryForCounter, setSelectedInquiryForCounter] = useState<BookingInquiry | null>(null);
  const [counterPriceInput, setCounterPriceInput] = useState('');
  const [counterNotesInput, setCounterNotesInput] = useState('');
  const [submittingCounter, setSubmittingCounter] = useState(false);

  // Business item sub-filter per business ID
  const [businessSubFilters, setBusinessSubFilters] = useState<Record<string, string>>({});

  // Add Business Capability Modal State
  const [addBusinessModalVisible, setAddBusinessModalVisible] = useState(false);
  const [newBizCategory, setNewBizCategory] = useState<BusinessCategory>('catering');
  const [newBizName, setNewBizName] = useState('');
  const [newBizPrice, setNewBizPrice] = useState('450');
  const [creatingBusiness, setCreatingBusiness] = useState(false);

  // Offering form fields
  const [offeringTitle, setOfferingTitle] = useState('');
  const [offeringPrice, setOfferingPrice] = useState('');
  const [offeringCeremonyType, setOfferingCeremonyType] = useState('mandapam');
  const [offeringDimensions, setOfferingDimensions] = useState('30x25 ft');
  const [offeringHeight, setOfferingHeight] = useState('16 ft');
  const [offeringFlowers, setOfferingFlowers] = useState('Fresh Jasmine, Marigold & Lotus');
  const [offeringDietType, setOfferingDietType] = useState<'veg' | 'non_veg' | 'mixed'>('veg');
  const [offeringMinPlates, setOfferingMinPlates] = useState('100');
  const [offeringHighlights, setOfferingHighlights] = useState('');
  const [offeringDuration, setOfferingDuration] = useState('Full Day (Muhurtham & Reception)');
  const [offeringCrew, setOfferingCrew] = useState('3 Cinematographers + 2 Traditional Photographers + Drone');
  const [offeringPowerWatts, setOfferingPowerWatts] = useState('15,000 Watts RMS');
  const [offeringEquipment, setOfferingEquipment] = useState('Line Array System, 16 Sharpie Beams, Cold Spark Pyro');
  const [offeringPhotoUrl, setOfferingPhotoUrl] = useState('');

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
        if (bizData.category) {
          setSelectedServiceCategory(bizData.category);
        }
        setBizName(bizData.name);
        setPhoneContact(bizData.phone || currentUser?.phone || '');
        setWhatsappContact(bizData.whatsapp_number || currentUser?.phone || '');
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

  // Open Counter-Offer Negotiation Modal
  const handleOpenCounterModal = (inq: BookingInquiry) => {
    playButtonClick();
    setSelectedInquiryForCounter(inq);
    setCounterPriceInput(
      String(inq.customer_target_budget || inq.final_customer_amount || inq.total_estimated_amount || '')
    );
    setCounterNotesInput('');
    setCounterModalVisible(true);
  };

  // Send Revised Quotation Counter-Offer
  const handleSendCounterOffer = async () => {
    if (!selectedInquiryForCounter?.id || !counterPriceInput) return;
    const price = Number(counterPriceInput);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid numeric amount for your counter-offer.');
      return;
    }

    setSubmittingCounter(true);
    playButtonClick();
    try {
      const ok = await sendQuotationCounterOffer(
        selectedInquiryForCounter.id,
        price,
        counterNotesInput || 'Special discounted quotation package for your event.'
      );
      if (ok) {
        playActionSuccess();
        setInquiries((prev) =>
          prev.map((i) =>
            i.id === selectedInquiryForCounter.id
              ? {
                  ...i,
                  vendor_counter_price: price,
                  vendor_counter_notes: counterNotesInput,
                  negotiation_status: 'counter_offered',
                  status: 'approved',
                }
              : i
          )
        );
        setCounterModalVisible(false);
        Alert.alert(
          'Counter-Offer Sent!',
          `Your revised quotation of ₹${price.toLocaleString('en-IN')} has been sent to ${selectedInquiryForCounter.customer_name}.`
        );
      }
    } catch {
      Alert.alert('Notice', 'Unable to submit counter offer. Please try again.');
    } finally {
      setSubmittingCounter(false);
    }
  };

  // Add Business Capability to Stack
  const handleCreateBusinessCapability = async () => {
    if (!newBizName.trim()) {
      Alert.alert('Required', 'Please enter a business or brand name.');
      return;
    }
    setCreatingBusiness(true);
    playButtonClick();
    try {
      const created = await createVendorBusiness(currentUser as any, {
        name: newBizName,
        category: newBizCategory,
        city: business?.city || 'Visakhapatnam',
        area_locality: business?.area_locality || 'Madhurawada',
        phone: phoneContact || currentUser?.phone || '',
        whatsapp_number: whatsappContact || currentUser?.phone || '',
        base_price: Number(newBizPrice) || 50000,
      });
      if (created) {
        playActionSuccess();
        setAvailableBusinesses((prev) => [created, ...prev]);
        setAddBusinessModalVisible(false);
        setNewBizName('');
        Alert.alert('Capability Added', `${created.name} has been added to your business stack.`);
      }
    } catch (e) {
      console.warn('Create business capability error:', e);
    } finally {
      setCreatingBusiness(false);
    }
  };

  // Open Add Offering for specific business in the stack
  const openAddOfferingForBusiness = (biz: Business) => {
    playButtonClick();
    setSelectedBusinessId(biz.id);
    setSelectedServiceCategory(biz.category);
    setOfferingCeremonyType(
      biz.category === 'decoration'
        ? 'mandapam'
        : biz.category === 'catering'
        ? 'veg'
        : biz.category === 'photography'
        ? '3day_wedding'
        : 'sangeeth_dj'
    );
    setAddOfferingModalVisible(true);
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

  // Add Custom Ad / Offering Server-Side
  const handleCreateOffering = async () => {
    if (!offeringTitle.trim()) {
      Alert.alert('Required Details', 'Please enter a title or package name for this setup.');
      return;
    }
    const cat = selectedServiceCategory;
    const defaultFallbackPrice =
      cat === 'catering' ? 450 : cat === 'photography' ? 45000 : cat === 'dj_sound' ? 25000 : 65000;
    const parsedPrice = Number(offeringPrice || defaultFallbackPrice);

    setIsSubmittingOffering(true);
    playButtonClick();

    try {
      const success = await addVendorOffering(selectedBusinessId, cat, {
        title: offeringTitle.trim(),
        category: cat,
        ceremony_type: offeringCeremonyType,
        dimensions: offeringDimensions.trim(),
        height: offeringHeight.trim(),
        flower_type: offeringFlowers.trim(),
        diet_type: offeringDietType,
        min_guest_count: Number(offeringMinPlates) || 100,
        price: parsedPrice,
        menu_highlights: offeringHighlights
          ? offeringHighlights.split(',').map((s) => s.trim()).filter(Boolean)
          : ['Special Andhra Sweets', 'Paneer Butter Masala', 'Dum Biryani'],
        deliverables: offeringHighlights
          ? offeringHighlights.split(',').map((s) => s.trim()).filter(Boolean)
          : ['4K Cinematic Teaser (60s)', 'Full Ceremony Recording', 'Heirloom Photobook'],
        duration: offeringDuration.trim(),
        crew_count: offeringCrew.trim(),
        power_output_watts: offeringPowerWatts.trim(),
        equipment_highlights: offeringEquipment
          ? offeringEquipment.split(',').map((s) => s.trim()).filter(Boolean)
          : ['Line Array Sound System', 'Digital DJ Console', 'Cold Spark Pyro Guns'],
        photo_url: offeringPhotoUrl.trim() || undefined,
      });

      if (success) {
        playActionSuccess();
        const updated = await getBusinessById(selectedBusinessId);
        if (updated) setBusiness(updated);
        setAddOfferingModalVisible(false);
        setOfferingTitle('');
        setOfferingPrice('');
        setOfferingHighlights('');
        Alert.alert('🎉 Published to Registry!', `"${offeringTitle}" has been saved server-side to the database and is live on UtsavHub.`);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to add offering');
    } finally {
      setIsSubmittingOffering(false);
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
          placeholderTextColor="#8E8B99"
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
          placeholderTextColor="#8E8B99"
        />

        <View style={styles.formRowTwoCol}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>PHONE CONTACT *</Text>
            <TextInput
              style={styles.textInput}
              value={newBizPhone}
              onChangeText={setNewBizPhone}
              placeholder="Enter 10-digit mobile number"
              placeholderTextColor="#8E8B99"
              keyboardType="phone-pad"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>WHATSAPP NUMBER *</Text>
            <TextInput
              style={styles.textInput}
              value={newBizWhatsapp}
              onChangeText={setNewBizWhatsapp}
              placeholder="Enter 10-digit mobile number"
              placeholderTextColor="#8E8B99"
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
                  placeholderTextColor="#8E8B99"
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
                  placeholderTextColor="#8E8B99"
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
                  placeholderTextColor="#8E8B99"
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
                  placeholderTextColor="#8E8B99"
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
              placeholderTextColor="#8E8B99"
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
                  placeholderTextColor="#8E8B99"
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
                  placeholderTextColor="#8E8B99"
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
              placeholderTextColor="#8E8B99"
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
          placeholderTextColor="#8E8B99"
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
              color={activeTab === 'inquiries' ? '#C5A059' : '#4A4852'}
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
              color={activeTab === 'pricing' ? '#C5A059' : '#4A4852'}
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
              color={activeTab === 'media' ? '#C5A059' : '#4A4852'}
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
              color={activeTab === 'profile' ? '#C5A059' : '#4A4852'}
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
                    <Calendar size={40} color="#8E8B99" />
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

                        {/* Custom Quotation Items Breakdown */}
                        {inq.cart_items && inq.cart_items.length > 0 && (
                          <View style={styles.quoteItemsBox}>
                            <View style={styles.quoteItemsHeader}>
                              <Sparkles size={12} color="#C5A059" />
                              <Text style={styles.quoteItemsHeaderText}>
                                REQUESTED OFFERINGS & UTILITIES ({inq.cart_items.length})
                              </Text>
                            </View>
                            {inq.cart_items.map((cItem, cIdx) => (
                              <View key={cIdx} style={styles.quoteItemRow}>
                                <Text style={styles.quoteItemTitle} numberOfLines={1}>
                                  • {cItem.quantity}x {cItem.title}
                                </Text>
                                <Text style={styles.quoteItemRate}>
                                  ₹{(Number(cItem.unitPrice || 0) * (cItem.quantity || 1)).toLocaleString('en-IN')}
                                </Text>
                              </View>
                            ))}
                            {inq.customer_target_budget ? (
                              <View style={styles.targetBudgetRow}>
                                <Text style={styles.targetBudgetLabel}>Customer Proposed Budget:</Text>
                                <Text style={styles.targetBudgetValue}>
                                  ₹{inq.customer_target_budget.toLocaleString('en-IN')}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        )}

                        {/* Existing Counter-Offer Status Banner */}
                        {inq.vendor_counter_price ? (
                          <View style={styles.counterOfferBadge}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Text style={styles.counterOfferBadgeLabel}>YOUR COUNTER-OFFER SENT:</Text>
                              <Text style={styles.counterOfferBadgeVal}>
                                ₹{inq.vendor_counter_price.toLocaleString('en-IN')}
                              </Text>
                            </View>
                            {inq.vendor_counter_notes ? (
                              <Text style={styles.counterOfferNotesText}>"{inq.vendor_counter_notes}"</Text>
                            ) : null}
                            {inq.negotiation_status === 'negotiation_accepted' && (
                              <View style={styles.negotiationAcceptedTag}>
                                <Check size={12} color="#059669" />
                                <Text style={styles.negotiationAcceptedTagText}>Customer Accepted Your Offer!</Text>
                              </View>
                            )}
                          </View>
                        ) : null}

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
                                <Text style={styles.approveBtnText}>Approve</Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={styles.counterBtn}
                                onPress={() => handleOpenCounterModal(inq)}
                                activeOpacity={0.8}
                              >
                                <Sparkles size={13} color="#C5A059" />
                                <Text style={styles.counterBtnText}>Negotiate Price</Text>
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

            {/* TAB 2: SERVICES & PRICING (MULTI-BUSINESS STACK) */}
            {activeTab === 'pricing' && (
              <View style={styles.tabSection}>
                {/* 1. Header with Add Business Action */}
                <View style={styles.stackHeaderCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stackHeaderTitle}>MY BUSINESSES & SERVICE STACK</Text>
                    <Text style={styles.stackHeaderSub}>
                      Manage associated businesses, equipment, utility rentals, meal plans & shoot packages
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.addBizBtn}
                    onPress={() => {
                      playButtonClick();
                      setAddBusinessModalVisible(true);
                    }}
                    activeOpacity={0.85}
                  >
                    <Plus size={14} color="#0B0B0E" />
                    <Text style={styles.addBizBtnText}>+ Add Business</Text>
                  </TouchableOpacity>
                </View>

                {/* 2. Stack of Associated Businesses */}
                {(availableBusinesses.length > 0 ? availableBusinesses : business ? [business] : []).map((bizItem, bIdx) => {
                  const bId = bizItem.id;
                  const bCat = bizItem.category;
                  const currentSubFilter = businessSubFilters[bId] || 'all';

                  const setSubFilterForBiz = (filterId) => {
                    playButtonClick();
                    setBusinessSubFilters((prev) => ({ ...prev, [bId]: filterId }));
                  };

                  return (
                    <View key={bId || bIdx} style={styles.bizStackCard}>
                      {/* Business Card Top Row */}
                      <View style={styles.bizStackHeader}>
                        <View style={styles.bizStackIconWrap}>
                          {bCat === 'venue' && <Building size={20} color="#0284C7" />}
                          {bCat === 'decoration' && <Flower2 size={20} color="#C5A059" />}
                          {bCat === 'catering' && <Utensils size={20} color="#059669" />}
                          {bCat === 'photography' && <Camera size={20} color="#7C3AED" />}
                          {bCat === 'dj_sound' && <Music size={20} color="#D97706" />}
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.bizStackName}>{bizItem.name}</Text>
                            <View style={styles.bizActivePill}>
                              <Text style={styles.bizActivePillText}>Active Store</Text>
                            </View>
                          </View>
                          <Text style={styles.bizStackMeta}>
                            {bizItem.area_locality || 'Madhurawada'}, {bizItem.city || 'Visakhapatnam'} •{' '}
                            <Text style={{ fontWeight: '700', color: '#8A723D' }}>
                              {bCat === 'venue'
                                ? 'Function Hall / Kalyana Mandapam'
                                : bCat === 'decoration'
                                ? 'Mandapams, Decor & Utilities'
                                : bCat === 'catering'
                                ? 'Catering & Royal Feasts'
                                : bCat === 'photography'
                                ? '4K Shoot & Cinema Plans'
                                : 'Concert Sound & DJ Setups'}
                            </Text>
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.bizAddOfferingBtn}
                          onPress={() => openAddOfferingForBusiness(bizItem)}
                          activeOpacity={0.8}
                        >
                          <Plus size={13} color="#0B0B0E" />
                          <Text style={styles.bizAddOfferingBtnText}>+ Add Offering</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Dropdown / Sub-filters for this business */}
                      {bCat === 'decoration' && (
                        <View style={{ marginTop: 12 }}>
                          <Text style={styles.itemCategoryFilterLabel}>FILTER DECOR & UTILITY ITEMS:</Text>
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.subfilterScrollContent}
                          >
                            {[
                              { id: 'all', label: 'All Offerings' },
                              { id: 'mandapam', label: '🏛️ Mandapam Sets' },
                              { id: 'sangeeth', label: '🎉 Sangeeth Stages' },
                              { id: 'wayworks_entrance', label: '✨ Wayworks & Entrance' },
                              { id: 'reception_backdrop', label: 'Reception Backdrops' },
                              { id: 'haldi_mehendi', label: '🌼 Haldi & Mehendi' },
                              { id: 'rata_muhurtham', label: '🪔 Rata Muhurtham' },
                              { id: 'kalagollu_sambaralu', label: 'Kalagollu Sambaralu' },
                              { id: 'utilities', label: '🪑 Chairs, Tents & Coolers' },
                              { id: 'home_decor', label: '🏡 Home Decor' },
                              { id: 'other', label: '⚡ Other' },
                            ].map((chip) => (
                              <TouchableOpacity
                                key={chip.id}
                                style={[
                                  styles.subfilterChip,
                                  currentSubFilter === chip.id && styles.subfilterChipActive,
                                ]}
                                onPress={() => setSubFilterForBiz(chip.id)}
                                activeOpacity={0.8}
                              >
                                <Text
                                  style={[
                                    styles.subfilterChipText,
                                    currentSubFilter === chip.id && styles.subfilterChipTextActive,
                                  ]}
                                >
                                  {chip.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>

                          {/* Items List */}
                          {(bizItem.decor_items || (bizItem.id === business?.id ? business?.decor_items : []) || [])
                            .filter((item) => currentSubFilter === 'all' || item.element_type === currentSubFilter)
                            .map((item) => (
                              <View key={item.id} style={styles.pricingCard}>
                                <View style={styles.pricingCardTop}>
                                  <Flower2 size={20} color="#C5A059" />
                                  <View style={{ flex: 1, marginLeft: 12 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                      <Text style={styles.vendorCategoryBadgeText}>
                                        {item.element_type.toUpperCase().replace(/_/g, ' ')}
                                      </Text>
                                      <View style={styles.vendorMiniNegotiableTag}>
                                        <Text style={styles.vendorMiniNegotiableTagText}>Approved by UtsavHub</Text>
                                      </View>
                                    </View>
                                    <Text style={styles.pricingTitle}>{item.title}</Text>
                                    <Text style={styles.pricingSub}>
                                      {item.dimensions ? `Size: ${item.dimensions}` : ''}
                                      {item.height ? ` • Height: ${item.height}` : ''}
                                      {item.flower_type ? ` • ${item.flower_type}` : ''}
                                    </Text>
                                  </View>
                                  <View style={styles.pricePill}>
                                    <Text style={styles.pricePillText}>
                                      ₹{Number(item.base_price || 0).toLocaleString('en-IN')}
                                    </Text>
                                    <Text style={styles.pricePillUnit}>/ event</Text>
                                  </View>
                                </View>
                              </View>
                            ))}

                          {(!bizItem.decor_items || bizItem.decor_items.length === 0) &&
                            (!business?.decor_items || business.decor_items.length === 0) && (
                              <View style={styles.emptyOfferingCard}>
                                <Flower2 size={28} color="#C5A059" />
                                <Text style={styles.emptyOfferingTitle}>No Items in this Category Yet</Text>
                                <Text style={styles.emptyOfferingSub}>
                                  Add Mandapams, Sangeeth stages, entrance tunnels, or utility rentals (chairs, tents, coolers).
                                </Text>
                                <TouchableOpacity
                                  style={styles.emptyAddBtn}
                                  onPress={() => openAddOfferingForBusiness(bizItem)}
                                >
                                  <Text style={styles.emptyAddBtnText}>+ Add First Item</Text>
                                </TouchableOpacity>
                              </View>
                            )}
                        </View>
                      )}

                      {/* Catering Sub-filter & Offerings */}
                      {bCat === 'catering' && (
                        <View style={{ marginTop: 12 }}>
                          <Text style={styles.itemCategoryFilterLabel}>FILTER CATERING MENUS & FEASTS:</Text>
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.subfilterScrollContent}
                          >
                            {[
                              { id: 'all', label: 'All Feasts' },
                              { id: 'veg', label: 'Pure Veg Feasts' },
                              { id: 'non_veg', label: 'Non-Veg Feasts' },
                              { id: 'mixed', label: 'Grand Buffets' },
                              { id: 'breakfast', label: 'Breakfast & Tiffin' },
                              { id: 'high_tea', label: 'High Tea & Snacks' },
                              { id: 'live_stall', label: 'Live Counters' },
                            ].map((chip) => (
                              <TouchableOpacity
                                key={chip.id}
                                style={[
                                  styles.subfilterChip,
                                  currentSubFilter === chip.id && styles.subfilterChipActive,
                                ]}
                                onPress={() => setSubFilterForBiz(chip.id)}
                                activeOpacity={0.8}
                              >
                                <Text
                                  style={[
                                    styles.subfilterChipText,
                                    currentSubFilter === chip.id && styles.subfilterChipTextActive,
                                  ]}
                                >
                                  {chip.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>

                          {(bizItem.catering_packages || (bizItem.id === business?.id ? business?.catering_packages : []) || [])
                            .filter(
                              (pkg) =>
                                currentSubFilter === 'all' ||
                                (pkg.package_type || pkg.diet_type) === currentSubFilter
                            )
                            .map((pkg) => (
                              <View key={pkg.id} style={styles.pricingCard}>
                                <View style={styles.pricingCardTop}>
                                  <Utensils size={20} color="#059669" />
                                  <View style={{ flex: 1, marginLeft: 12 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                      <Text style={styles.vendorCategoryBadgeText}>
                                        {(pkg.package_type || pkg.diet_type || 'VEG').toUpperCase()} FEAST
                                      </Text>
                                      <View style={styles.minGuestPill}>
                                        <Text style={styles.minGuestPillText}>Min {pkg.min_guest_count || 100} plates</Text>
                                      </View>
                                      <View style={styles.vendorMiniNegotiableTag}>
                                        <Text style={styles.vendorMiniNegotiableTagText}>Approved</Text>
                                      </View>
                                    </View>
                                    <Text style={styles.pricingTitle}>{pkg.package_name}</Text>
                                    <Text style={styles.pricingSub} numberOfLines={2}>
                                      Highlights: {(pkg.menu_highlights || []).join(' • ')}
                                    </Text>
                                  </View>
                                  <View style={styles.pricePill}>
                                    <Text style={styles.pricePillText}>
                                      ₹{Number(pkg.price_per_plate || 0).toLocaleString('en-IN')}
                                    </Text>
                                    <Text style={styles.pricePillUnit}>/ plate</Text>
                                  </View>
                                </View>
                              </View>
                            ))}

                          {(!bizItem.catering_packages || bizItem.catering_packages.length === 0) &&
                            (!business?.catering_packages || business.catering_packages.length === 0) && (
                              <View style={styles.emptyOfferingCard}>
                                <Utensils size={28} color="#059669" />
                                <Text style={styles.emptyOfferingTitle}>No Catering Packages Published</Text>
                                <Text style={styles.emptyOfferingSub}>
                                  Publish Veg, Non-Veg, or Grand Buffet menus with minimum plates and dishes.
                                </Text>
                                <TouchableOpacity
                                  style={styles.emptyAddBtn}
                                  onPress={() => openAddOfferingForBusiness(bizItem)}
                                >
                                  <Text style={styles.emptyAddBtnText}>+ Add First Feast</Text>
                                </TouchableOpacity>
                              </View>
                            )}
                        </View>
                      )}

                      {/* Photography Sub-filter & Offerings */}
                      {bCat === 'photography' && (
                        <View style={{ marginTop: 12 }}>
                          <Text style={styles.itemCategoryFilterLabel}>FILTER SHOOT PACKAGES:</Text>
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.subfilterScrollContent}
                          >
                            {[
                              { id: 'all', label: 'All Packages' },
                              { id: '3day_wedding', label: '3-Day Wedding' },
                              { id: 'candid_cinematic', label: 'Candid & Cinema' },
                              { id: 'pre_wedding', label: 'Pre-Wedding' },
                              { id: 'muhurtham_traditional', label: 'Muhurtham Traditional' },
                              { id: 'drone_led', label: 'Drone & LED Wall' },
                            ].map((chip) => (
                              <TouchableOpacity
                                key={chip.id}
                                style={[
                                  styles.subfilterChip,
                                  currentSubFilter === chip.id && styles.subfilterChipActive,
                                ]}
                                onPress={() => setSubFilterForBiz(chip.id)}
                                activeOpacity={0.8}
                              >
                                <Text
                                  style={[
                                    styles.subfilterChipText,
                                    currentSubFilter === chip.id && styles.subfilterChipTextActive,
                                  ]}
                                >
                                  {chip.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>

                          {(bizItem.photography_packages || (bizItem.id === business?.id ? business?.photography_packages : []) || [])
                            .filter((pkg) => currentSubFilter === 'all' || pkg.package_type === currentSubFilter)
                            .map((pkg) => (
                              <View key={pkg.id} style={styles.pricingCard}>
                                <View style={styles.pricingCardTop}>
                                  <Camera size={20} color="#7C3AED" />
                                  <View style={{ flex: 1, marginLeft: 12 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                      <Text style={styles.vendorCategoryBadgeText}>
                                        {pkg.package_type.toUpperCase().replace(/_/g, ' ')}
                                      </Text>
                                      <View style={styles.vendorMiniNegotiableTag}>
                                        <Text style={styles.vendorMiniNegotiableTagText}>Approved</Text>
                                      </View>
                                    </View>
                                    <Text style={styles.pricingTitle}>{pkg.title}</Text>
                                    <Text style={styles.pricingSub}>
                                      {pkg.duration ? `Duration: ${pkg.duration} • ` : ''}
                                      {pkg.crew_count ? `Crew: ${pkg.crew_count} • ` : ''}
                                      {pkg.deliverables.join(' • ')}
                                    </Text>
                                  </View>
                                  <View style={styles.pricePill}>
                                    <Text style={styles.pricePillText}>
                                      ₹{Number(pkg.base_price || 0).toLocaleString('en-IN')}
                                    </Text>
                                    <Text style={styles.pricePillUnit}>/ package</Text>
                                  </View>
                                </View>
                              </View>
                            ))}

                          {(!bizItem.photography_packages || bizItem.photography_packages.length === 0) &&
                            (!business?.photography_packages || business.photography_packages.length === 0) && (
                              <View style={styles.emptyOfferingCard}>
                                <Camera size={28} color="#7C3AED" />
                                <Text style={styles.emptyOfferingTitle}>No Photography Packages Published</Text>
                                <Text style={styles.emptyOfferingSub}>
                                  Publish 4K Cinematic shoot, candid photography, or pre-wedding drone packages.
                                </Text>
                                <TouchableOpacity
                                  style={styles.emptyAddBtn}
                                  onPress={() => openAddOfferingForBusiness(bizItem)}
                                >
                                  <Text style={styles.emptyAddBtnText}>+ Add First Shoot Plan</Text>
                                </TouchableOpacity>
                              </View>
                            )}
                        </View>
                      )}

                      {/* DJ & Sound Sub-filter & Offerings */}
                      {bCat === 'dj_sound' && (
                        <View style={{ marginTop: 12 }}>
                          <Text style={styles.itemCategoryFilterLabel}>FILTER SOUND & LIGHTING SETUPS:</Text>
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.subfilterScrollContent}
                          >
                            {[
                              { id: 'all', label: 'All Setups' },
                              { id: 'sangeeth_dj', label: 'Sangeeth DJ & Lights' },
                              { id: 'concert_audio', label: 'Line Array Audio' },
                              { id: 'traditional_melam', label: 'Traditional Melam' },
                              { id: 'truss_pyro', label: 'Cold Pyro & Truss' },
                            ].map((chip) => (
                              <TouchableOpacity
                                key={chip.id}
                                style={[
                                  styles.subfilterChip,
                                  currentSubFilter === chip.id && styles.subfilterChipActive,
                                ]}
                                onPress={() => setSubFilterForBiz(chip.id)}
                                activeOpacity={0.8}
                              >
                                <Text
                                  style={[
                                    styles.subfilterChipText,
                                    currentSubFilter === chip.id && styles.subfilterChipTextActive,
                                  ]}
                                >
                                  {chip.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>

                          {(bizItem.dj_sound_packages || (bizItem.id === business?.id ? business?.dj_sound_packages : []) || [])
                            .filter((pkg) => currentSubFilter === 'all' || pkg.package_type === currentSubFilter)
                            .map((pkg) => (
                              <View key={pkg.id} style={styles.pricingCard}>
                                <View style={styles.pricingCardTop}>
                                  <Music size={20} color="#D97706" />
                                  <View style={{ flex: 1, marginLeft: 12 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                      <Text style={styles.vendorCategoryBadgeText}>
                                        {pkg.package_type.toUpperCase().replace(/_/g, ' ')}
                                      </Text>
                                      <View style={styles.vendorMiniNegotiableTag}>
                                        <Text style={styles.vendorMiniNegotiableTagText}>Approved</Text>
                                      </View>
                                    </View>
                                    <Text style={styles.pricingTitle}>{pkg.title}</Text>
                                    <Text style={styles.pricingSub}>
                                      {pkg.power_output_watts ? `Output: ${pkg.power_output_watts} • ` : ''}
                                      {pkg.equipment_highlights.join(' • ')}
                                    </Text>
                                  </View>
                                  <View style={styles.pricePill}>
                                    <Text style={styles.pricePillText}>
                                      ₹{Number(pkg.base_price || 0).toLocaleString('en-IN')}
                                    </Text>
                                    <Text style={styles.pricePillUnit}>/ setup</Text>
                                  </View>
                                </View>
                              </View>
                            ))}

                          {(!bizItem.dj_sound_packages || bizItem.dj_sound_packages.length === 0) &&
                            (!business?.dj_sound_packages || business.dj_sound_packages.length === 0) && (
                              <View style={styles.emptyOfferingCard}>
                                <Music size={28} color="#D97706" />
                                <Text style={styles.emptyOfferingTitle}>No Sound Setups Published</Text>
                                <Text style={styles.emptyOfferingSub}>
                                  Publish Line Array concert sound, DJ console setups, and cold spark pyrotechnics.
                                </Text>
                                <TouchableOpacity
                                  style={styles.emptyAddBtn}
                                  onPress={() => openAddOfferingForBusiness(bizItem)}
                                >
                                  <Text style={styles.emptyAddBtnText}>+ Add First Sound Setup</Text>
                                </TouchableOpacity>
                              </View>
                            )}
                        </View>
                      )}

                      {/* Function Hall Technical Specs */}
                      {bCat === 'venue' && (
                        <View style={styles.venueSpecsSection}>
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
                                <Text style={styles.specGridVal}>{roomsCount} Deluxe Rooms</Text>
                                <Text style={styles.specGridName}>AC Guest Suites</Text>
                              </View>
                              <View style={styles.specGridDivider} />
                              <View style={styles.specGridItem}>
                                <Car size={18} color="#C5A059" />
                                <Text style={styles.specGridVal}>{parkingCars} Cars</Text>
                                <Text style={styles.specGridName}>Parking Bays</Text>
                              </View>
                            </View>
                          </View>

                          <View style={styles.pricingCard}>
                            <View style={styles.pricingCardTop}>
                              <Building size={20} color="#C5A059" />
                              <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.pricingTitle}>AC Grand Hall 24-Hour Rental Tariff</Text>
                                <Text style={styles.pricingSub}>Includes {roomsCount} AC Deluxe Rooms & Generator</Text>
                              </View>
                              <View style={styles.pricePill}>
                                <Text style={styles.pricePillText}>
                                  ₹{Number(currentBasePrice).toLocaleString('en-IN')}
                                </Text>
                                <Text style={styles.pricePillUnit}>/ 24-hr day</Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}

                {/* 3. Register Additional Business Capability Card */}
                <TouchableOpacity
                  style={styles.addCapabilityCard}
                  onPress={() => {
                    playButtonClick();
                    setAddBusinessModalVisible(true);
                  }}
                  activeOpacity={0.85}
                >
                  <View style={styles.addCapabilityIconWrap}>
                    <Plus size={22} color="#C5A059" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.addCapabilityTitle}>+ Register Another Business Capability</Text>
                    <Text style={styles.addCapabilitySub}>
                      Add separate entities for In-House Catering, Floral Decor & Utilities, or Photography
                    </Text>
                  </View>
                </TouchableOpacity>

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
                          <Text style={styles.historyTime}>
                            Submitted {new Date(req.submitted_at).toLocaleDateString('en-IN')}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.historyPrice}>
                            ₹{req.proposed_base_price.toLocaleString('en-IN')}
                          </Text>
                          <View
                            style={[
                              styles.historyStatusPill,
                              req.status === 'approved' && styles.historyStatusApproved,
                            ]}
                          >
                            <Text
                              style={[
                                styles.historyStatusText,
                                req.status === 'approved' && styles.historyStatusTextApproved,
                              ]}
                            >
                              {req.status.toUpperCase().replace('_', ' ')}
                            </Text>
                          </View>
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
                placeholderTextColor="#8E8B99"
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
                placeholderTextColor="#8E8B99"
              />

              <Text style={styles.inputLabel}>Reason / Notes for Admin</Text>
              <TextInput
                style={[styles.textInput, { height: 70 }]}
                value={priceNotes}
                onChangeText={setPriceNotes}
                placeholder="e.g. Upgraded central AC chillers and banquet furniture"
                placeholderTextColor="#8E8B99"
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
                placeholderTextColor="#8E8B99"
              />

              <Text style={styles.inputLabel}>4K Video URL (.mp4 / stream)</Text>
              <TextInput
                style={styles.textInput}
                value={reelVideoUrl}
                onChangeText={setReelVideoUrl}
                placeholder="https://assets.utsavhub.com/videos/hall_walkthrough.mp4"
                placeholderTextColor="#8E8B99"
              />

              <Text style={styles.inputLabel}>Thumbnail Image URL (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={reelThumbUrl}
                onChangeText={setReelThumbUrl}
                placeholder="https://images.unsplash.com/photo-..."
                placeholderTextColor="#8E8B99"
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
                placeholderTextColor="#8E8B99"
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
                placeholder="Enter 10-digit mobile number"
                placeholderTextColor="#8E8B99"
              />

              <Text style={styles.inputLabel}>WhatsApp Desk</Text>
              <TextInput
                style={styles.textInput}
                value={whatsappContact}
                onChangeText={setWhatsappContact}
                placeholder="Enter 10-digit mobile number"
                placeholderTextColor="#8E8B99"
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

      {/* 8. MODAL: SERVICE CAPABILITY SELECTOR */}
      <Modal visible={serviceDropdownVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.dropdownDialog}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Business Service</Text>
                <Text style={styles.modalSubTitle}>Choose capability to manage offerings & pricing</Text>
              </View>
              <TouchableOpacity onPress={() => setServiceDropdownVisible(false)}>
                <X size={20} color="#A1A1AA" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {SERVICE_CAPABILITIES.map((cap) => {
                const isSelected = selectedServiceCategory === cap.id;
                const IconComponent = cap.icon;
                return (
                  <TouchableOpacity
                    key={cap.id}
                    style={[styles.serviceOptionRow, isSelected && styles.serviceOptionRowActive]}
                    onPress={() => {
                      playButtonClick();
                      setSelectedServiceCategory(cap.id);
                      setOfferingSubFilter('all');
                      setServiceDropdownVisible(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.serviceOptionIconCircle, isSelected && styles.serviceOptionIconCircleActive]}>
                      <IconComponent size={20} color={isSelected ? '#C5A059' : '#0B0B0E'} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.serviceOptionTitle, isSelected && styles.serviceOptionTitleActive]}>
                          {cap.name}
                        </Text>
                        <View style={[styles.serviceOptionBadge, isSelected && styles.serviceOptionBadgeActive]}>
                          <Text style={[styles.serviceOptionBadgeText, isSelected && styles.serviceOptionBadgeTextActive]}>
                            {cap.badge}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.serviceOptionSub}>{cap.subtitle}</Text>
                    </View>
                    {isSelected && <Check size={18} color="#C5A059" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 9. MODAL: ADD CUSTOM OFFERING / AD */}
      <Modal visible={addOfferingModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalDialog, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {selectedServiceCategory === 'decoration'
                    ? 'Publish Decor / Mandapam Set'
                    : selectedServiceCategory === 'catering'
                    ? 'Publish Catering Meal Plan'
                    : selectedServiceCategory === 'photography'
                    ? 'Publish Photography Plan'
                    : 'Publish Sound & Lighting Setup'}
                </Text>
                <Text style={styles.modalSubTitle}>
                  Saved server-side to database and displayed in Explore
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setAddOfferingModalVisible(false);
                  setOfferingTitle('');
                }}
              >
                <X size={20} color="#A1A1AA" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flexGrow: 0 }}>
              {/* CATEGORY A: DECORATION */}
              {selectedServiceCategory === 'decoration' && (
                <>
                  <Text style={styles.inputLabel}>DECOR ELEMENT TYPE *</Text>
                  <View style={styles.chipSelectorWrap}>
                    {[
                      { id: 'mandapam', label: 'Mandapam Set' },
                      { id: 'wayworks_entrance', label: 'Wayworks & Entrance' },
                      { id: 'sangeeth', label: 'Sangeeth Stage' },
                      { id: 'rata_muhurtham', label: 'Rata Muhurtham' },
                      { id: 'kalagollu_sambaralu', label: 'Kalagollu Sambaralu' },
                      { id: 'home_decor', label: 'Home Decor' },
                      { id: 'utilities', label: '🪑 Chairs, Tents & Coolers' },
                      { id: 'other', label: '⚡ Utilities & FX' },
                    ].map((opt) => (
                      <TouchableOpacity
                        key={opt.id}
                        style={[styles.selectorChip, offeringCeremonyType === opt.id && styles.selectorChipActive]}
                        onPress={() => setOfferingCeremonyType(opt.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.selectorChipText, offeringCeremonyType === opt.id && styles.selectorChipTextActive]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>SET / AD TITLE *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={offeringTitle}
                    onChangeText={setOfferingTitle}
                    placeholder="e.g. Royal Temple Gopuram Grand Mandapam"
                    placeholderTextColor="#8E8B99"
                  />

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>DIMENSIONS</Text>
                      <TextInput
                        style={styles.textInput}
                        value={offeringDimensions}
                        onChangeText={setOfferingDimensions}
                        placeholder="e.g. 30x25 ft"
                        placeholderTextColor="#8E8B99"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>HEIGHT</Text>
                      <TextInput
                        style={styles.textInput}
                        value={offeringHeight}
                        onChangeText={setOfferingHeight}
                        placeholder="e.g. 16 ft"
                        placeholderTextColor="#8E8B99"
                      />
                    </View>
                  </View>

                  <Text style={styles.inputLabel}>FLOWER MATERIALS & THEME</Text>
                  <TextInput
                    style={styles.textInput}
                    value={offeringFlowers}
                    onChangeText={setOfferingFlowers}
                    placeholder="e.g. Fresh Jasmine, Marigold, Lotus & Imported Orchids"
                    placeholderTextColor="#8E8B99"
                  />

                  <Text style={styles.inputLabel}>TARIFF / PRICE (₹) *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={offeringPrice}
                    onChangeText={setOfferingPrice}
                    placeholder="e.g. 85000"
                    placeholderTextColor="#8E8B99"
                    keyboardType="numeric"
                  />
                </>
              )}

              {/* CATEGORY B: CATERING */}
              {selectedServiceCategory === 'catering' && (
                <>
                  <Text style={styles.inputLabel}>DIET TYPE *</Text>
                  <View style={styles.chipSelectorWrap}>
                    {[
                      { id: 'veg', label: 'Pure Veg Feast' },
                      { id: 'non_veg', label: 'Non-Veg Royal Feast' },
                      { id: 'mixed', label: 'Grand Mixed Buffet' },
                    ].map((opt) => (
                      <TouchableOpacity
                        key={opt.id}
                        style={[styles.selectorChip, offeringDietType === opt.id && styles.selectorChipActive]}
                        onPress={() => setOfferingDietType(opt.id as any)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.selectorChipText, offeringDietType === opt.id && styles.selectorChipTextActive]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>MEAL PLAN NAME *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={offeringTitle}
                    onChangeText={setOfferingTitle}
                    placeholder="e.g. Traditional Andhra Muhurtham Bhojanam"
                    placeholderTextColor="#8E8B99"
                  />

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>PRICE PER PLATE (₹) *</Text>
                      <TextInput
                        style={styles.textInput}
                        value={offeringPrice}
                        onChangeText={setOfferingPrice}
                        placeholder="e.g. 480"
                        placeholderTextColor="#8E8B99"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>MINIMUM PLATES *</Text>
                      <TextInput
                        style={styles.textInput}
                        value={offeringMinPlates}
                        onChangeText={setOfferingMinPlates}
                        placeholder="e.g. 150"
                        placeholderTextColor="#8E8B99"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <Text style={styles.inputLabel}>VARIETY OF ITEMS / MENU HIGHLIGHTS *</Text>
                  <TextInput
                    style={[styles.textInput, { height: 75 }]}
                    value={offeringHighlights}
                    onChangeText={setOfferingHighlights}
                    placeholder="e.g. Ghee Pulav, Poori, Paneer Butter Masala, Bobbatlu, Gutti Vankaya, Kakinada Kaja, Veg Dum Biryani, Special Raita, Ice Cream"
                    placeholderTextColor="#8E8B99"
                    multiline
                  />
                </>
              )}

              {/* CATEGORY C: PHOTOGRAPHY */}
              {selectedServiceCategory === 'photography' && (
                <>
                  <Text style={styles.inputLabel}>PACKAGE TYPE *</Text>
                  <View style={styles.chipSelectorWrap}>
                    {[
                      { id: '3day_wedding', label: 'Wedding Cinema' },
                      { id: 'muhurtham_traditional', label: 'Traditional Muhurtham' },
                      { id: 'song_teaser', label: 'Song / Teaser Shoot' },
                      { id: 'pre_wedding', label: 'Pre-Wedding Shoot' },
                    ].map((opt) => (
                      <TouchableOpacity
                        key={opt.id}
                        style={[styles.selectorChip, offeringCeremonyType === opt.id && styles.selectorChipActive]}
                        onPress={() => setOfferingCeremonyType(opt.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.selectorChipText, offeringCeremonyType === opt.id && styles.selectorChipTextActive]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>PLAN TITLE *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={offeringTitle}
                    onChangeText={setOfferingTitle}
                    placeholder="e.g. 4K Cinematic Wedding Film + Drone + Heirloom Album"
                    placeholderTextColor="#8E8B99"
                  />

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>SHOOT DURATION</Text>
                      <TextInput
                        style={styles.textInput}
                        value={offeringDuration}
                        onChangeText={setOfferingDuration}
                        placeholder="e.g. Full Day"
                        placeholderTextColor="#8E8B99"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>CREW DETAILS</Text>
                      <TextInput
                        style={styles.textInput}
                        value={offeringCrew}
                        onChangeText={setOfferingCrew}
                        placeholder="e.g. 3 Cinematographers + 2 Stills + Drone"
                        placeholderTextColor="#8E8B99"
                      />
                    </View>
                  </View>

                  <Text style={styles.inputLabel}>DELIVERABLES (COMMA SEPARATED)</Text>
                  <TextInput
                    style={[styles.textInput, { height: 60 }]}
                    value={offeringHighlights}
                    onChangeText={setOfferingHighlights}
                    placeholder="e.g. 4K Teaser Reel (60s), 35-min Wedding Film, 350-page Layflat Album"
                    placeholderTextColor="#8E8B99"
                    multiline
                  />

                  <Text style={styles.inputLabel}>PACKAGE TARIFF (₹) *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={offeringPrice}
                    onChangeText={setOfferingPrice}
                    placeholder="e.g. 120000"
                    placeholderTextColor="#8E8B99"
                    keyboardType="numeric"
                  />
                </>
              )}

              {/* CATEGORY D: DJ, SOUND & STAGE LIGHTS */}
              {selectedServiceCategory === 'dj_sound' && (
                <>
                  <Text style={styles.inputLabel}>SETUP TYPE *</Text>
                  <View style={styles.chipSelectorWrap}>
                    {[
                      { id: 'sangeeth_dj', label: 'Sangeeth DJ Concert' },
                      { id: 'custom', label: 'Reception Live Sound' },
                      { id: 'truss_pyro', label: 'Truss, Lights & Pyro' },
                    ].map((opt) => (
                      <TouchableOpacity
                        key={opt.id}
                        style={[styles.selectorChip, offeringCeremonyType === opt.id && styles.selectorChipActive]}
                        onPress={() => setOfferingCeremonyType(opt.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.selectorChipText, offeringCeremonyType === opt.id && styles.selectorChipTextActive]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>SETUP TITLE *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={offeringTitle}
                    onChangeText={setOfferingTitle}
                    placeholder="e.g. 20,000 Watts RMS Line Array & Concert Stage Lighting"
                    placeholderTextColor="#8E8B99"
                  />

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>POWER OUTPUT</Text>
                      <TextInput
                        style={styles.textInput}
                        value={offeringPowerWatts}
                        onChangeText={setOfferingPowerWatts}
                        placeholder="e.g. 15,000 Watts RMS"
                        placeholderTextColor="#8E8B99"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>TARIFF / PRICE (₹) *</Text>
                      <TextInput
                        style={styles.textInput}
                        value={offeringPrice}
                        onChangeText={setOfferingPrice}
                        placeholder="e.g. 45000"
                        placeholderTextColor="#8E8B99"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <Text style={styles.inputLabel}>EQUIPMENT & EFFECTS</Text>
                  <TextInput
                    style={[styles.textInput, { height: 60 }]}
                    value={offeringEquipment}
                    onChangeText={setOfferingEquipment}
                    placeholder="e.g. Line Array System, 16 Sharpie Beams, Fog Machine, Cold Spark Pyro Guns"
                    placeholderTextColor="#8E8B99"
                    multiline
                  />
                </>
              )}

              {/* Photo Preset Selector */}
              <Text style={[styles.inputLabel, { marginTop: 12 }]}>CHOOSE PREVIEW IMAGE (OR ENTER URL)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                {(CATEGORY_IMAGE_PRESETS[selectedServiceCategory] || CATEGORY_IMAGE_PRESETS.decoration).map((preset, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.presetThumbWrap, offeringPhotoUrl === preset.url && styles.presetThumbWrapActive]}
                    onPress={() => setOfferingPhotoUrl(preset.url)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: preset.url }} style={styles.presetThumb} />
                    <Text style={styles.presetThumbText} numberOfLines={1}>{preset.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput
                style={styles.textInput}
                value={offeringPhotoUrl}
                onChangeText={setOfferingPhotoUrl}
                placeholder="Or paste custom image URL (https://...)"
                placeholderTextColor="#8E8B99"
              />

              <TouchableOpacity
                style={styles.submitModalBtn}
                onPress={handleCreateOffering}
                disabled={isSubmittingOffering}
                activeOpacity={0.85}
              >
                {isSubmittingOffering ? (
                  <ActivityIndicator color="#09090B" />
                ) : (
                  <Text style={styles.submitModalBtnText}>Publish to UtsavHub Registry</Text>
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
    
      {/* MODAL: COUNTER-OFFER PRICE NEGOTIATION */}
      <Modal visible={counterModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalDialog, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Negotiate Price / Counter-Offer</Text>
                <Text style={styles.modalSubTitle}>
                  Send revised package price directly to {selectedInquiryForCounter?.customer_name}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setCounterModalVisible(false)}>
                <X size={20} color="#A1A1AA" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.negotiationOverviewBox}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={styles.negotiationOverviewLabel}>Customer Reference:</Text>
                  <Text style={styles.negotiationOverviewVal}>{selectedInquiryForCounter?.customer_name}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={styles.negotiationOverviewLabel}>Event Muhurtham Date:</Text>
                  <Text style={styles.negotiationOverviewVal}>{selectedInquiryForCounter?.event_date}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={styles.negotiationOverviewLabel}>Estimated Total Amount:</Text>
                  <Text style={styles.negotiationOverviewValGold}>
                    ₹{(selectedInquiryForCounter?.final_customer_amount || selectedInquiryForCounter?.total_estimated_amount || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
                {selectedInquiryForCounter?.customer_target_budget ? (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
                    <Text style={[styles.negotiationOverviewLabel, { color: '#8A723D' }]}>Customer's Proposed Budget:</Text>
                    <Text style={{ fontWeight: '800', color: '#8A723D' }}>
                      ₹{selectedInquiryForCounter.customer_target_budget.toLocaleString('en-IN')}
                    </Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.inputLabel}>YOUR REVISED QUOTED PRICE (₹) *</Text>
              <TextInput
                style={styles.textInput}
                value={counterPriceInput}
                onChangeText={setCounterPriceInput}
                keyboardType="numeric"
                placeholder="e.g. 95000"
                placeholderTextColor="#8E8B99"
              />

              <Text style={styles.inputLabel}>MESSAGE / INCLUSIONS FOR CUSTOMER</Text>
              <TextInput
                style={[styles.textInput, { height: 75, textAlignVertical: 'top' }]}
                value={counterNotesInput}
                onChangeText={setCounterNotesInput}
                multiline
                placeholder="e.g. We can do ₹95,000 package including complimentary 4 mist coolers and extra entrance arch."
                placeholderTextColor="#8E8B99"
              />

              <TouchableOpacity
                style={styles.submitModalBtn}
                onPress={handleSendCounterOffer}
                disabled={submittingCounter}
                activeOpacity={0.85}
              >
                {submittingCounter ? (
                  <ActivityIndicator color="#09090B" />
                ) : (
                  <Text style={styles.submitModalBtnText}>Send Counter-Offer to Customer</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL: ADD BUSINESS CAPABILITY */}
      <Modal visible={addBusinessModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalDialog, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Add Business Capability</Text>
                <Text style={styles.modalSubTitle}>
                  Register a separate entity to manage and publish unique offerings
                </Text>
              </View>
              <TouchableOpacity onPress={() => setAddBusinessModalVisible(false)}>
                <X size={20} color="#A1A1AA" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>SERVICE CATEGORY *</Text>
              <View style={styles.chipSelectorWrap}>
                {SERVICE_CAPABILITIES.map((cap) => (
                  <TouchableOpacity
                    key={cap.id}
                    style={[styles.selectorChip, newBizCategory === cap.id && styles.selectorChipActive]}
                    onPress={() => setNewBizCategory(cap.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.selectorChipText, newBizCategory === cap.id && styles.selectorChipTextActive]}>
                      {cap.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>BRAND / BUSINESS NAME *</Text>
              <TextInput
                style={styles.textInput}
                value={newBizName}
                onChangeText={setNewBizName}
                placeholder="e.g. Swarna Royal Catering & Feasts"
                placeholderTextColor="#8E8B99"
              />

              <Text style={styles.inputLabel}>STARTING PRICE / TARIFF (₹) *</Text>
              <TextInput
                style={styles.textInput}
                value={newBizPrice}
                onChangeText={setNewBizPrice}
                keyboardType="numeric"
                placeholder="e.g. 450"
                placeholderTextColor="#8E8B99"
              />

              <TouchableOpacity
                style={styles.submitModalBtn}
                onPress={handleCreateBusinessCapability}
                disabled={creatingBusiness}
                activeOpacity={0.85}
              >
                {creatingBusiness ? (
                  <ActivityIndicator color="#09090B" />
                ) : (
                  <Text style={styles.submitModalBtnText}>Add Business to Stack</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  topBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E6E1',
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
    backgroundColor: '#F5F5F7',
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
    color: '#0B0B0E',
    letterSpacing: -0.2,
    maxWidth: '85%',
  },
  partnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  partnerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    letterSpacing: 0.3,
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
    backgroundColor: '#FCFAF5',
    borderWidth: 1,
    borderColor: '#E8DEC8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  previewBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8C6F34',
  },
  switchRoleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0B0B0E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  businessSwitcherContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E6E1',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  businessSwitcherHeader: {
    marginBottom: 8,
  },
  businessSwitcherLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8C6F34',
    letterSpacing: 0.8,
  },
  businessSwitcherScroll: {
    gap: 8,
    alignItems: 'center',
  },
  businessSwitchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F5F7',
    borderWidth: 1,
    borderColor: '#E8E6E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  businessSwitchPillActive: {
    backgroundColor: '#FCFAF5',
    borderColor: '#C5A059',
  },
  businessPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  businessSwitchPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A4852',
    maxWidth: 160,
  },
  businessSwitchPillTextActive: {
    fontWeight: '700',
    color: '#0B0B0E',
  },
  addBizPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F5F7',
    borderWidth: 1,
    borderColor: '#E8E6E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addBizPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0B0B0E',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E6E1',
    padding: 14,
    shadowColor: '#0B0B0E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  kpiCardActive: {
    borderColor: '#C5A059',
    backgroundColor: '#FCFAF5',
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8E8B99',
    letterSpacing: 0.8,
  },
  kpiIconWrapAmber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiIconWrapGold: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FAF2DF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiIconWrapGreen: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiIconWrapStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIndicatorDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#059669',
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0B0B0E',
    letterSpacing: -0.5,
  },
  kpiValueStatus: {
    fontSize: 15,
    fontWeight: '800',
    color: '#059669',
  },
  kpiSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  pulseDotAmber: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#F59E0B',
  },
  kpiSubAmber: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  kpiSubMuted: {
    fontSize: 11,
    color: '#8E8B99',
    marginTop: 4,
  },
  kpiSubGreen: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E8E6E1',
    marginVertical: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F5F5F7',
  },
  tabButtonActive: {
    backgroundColor: '#0B0B0E',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A4852',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: '#8E8B99',
    marginTop: 10,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E6E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  filterChipActive: {
    backgroundColor: '#0B0B0E',
    borderColor: '#0B0B0E',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A4852',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  inquiryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E6E1',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0B0B0E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  inquiryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  customerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FAF2DF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8DEC8',
  },
  customerInitial: {
    fontSize: 15,
    fontWeight: '800',
    color: '#8C6F34',
  },
  customerMeta: {
    marginLeft: 10,
    flex: 1,
  },
  customerName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0B0B0E',
  },
  customerPhone: {
    fontSize: 11.5,
    color: '#8E8B99',
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusPillAmber: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  statusPillEmerald: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusPillRed: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusPillTextAmber: {
    color: '#D97706',
  },
  statusPillTextEmerald: {
    color: '#059669',
  },
  statusPillTextRed: {
    color: '#E11D48',
  },
  inquirySpecsBox: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E6E1',
  },
  inquirySpecItem: {
    flex: 1,
    alignItems: 'center',
  },
  inquirySpecLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#8E8B99',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  inquirySpecValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0B0B0E',
  },
  inquirySpecValueGold: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8C6F34',
  },
  notesBox: {
    backgroundColor: '#FCFAF5',
    borderWidth: 1,
    borderColor: '#E8DEC8',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  notesText: {
    fontSize: 12,
    color: '#4A4852',
    lineHeight: 16,
  },
  inquiryActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  approveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 12,
  },
  approveBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  declineBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F5F5F7',
    borderWidth: 1,
    borderColor: '#E8E6E1',
  },
  actionIconBtnWhatsApp: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconBtnPhone: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#0B0B0E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0B0B0E',
  },
  sectionSub: {
    fontSize: 12,
    color: '#8E8B99',
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0B0B0E',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pricingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E6E1',
    padding: 14,
    marginBottom: 10,
    shadowColor: '#0B0B0E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  pricingCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pricingTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0B0B0E',
  },
  pricingSub: {
    fontSize: 12,
    color: '#4A4852',
    marginTop: 2,
  },
  pricePill: {
    backgroundColor: '#F5F5F7',
    borderWidth: 1,
    borderColor: '#E8E6E1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    alignItems: 'flex-end',
  },
  pricePillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0B0B0E',
  },
  pricePillUnit: {
    fontSize: 10,
    color: '#8E8B99',
  },
  vendorStartingPriceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#C5A059',
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#C5A059',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  vendorStartingPriceLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8C6F34',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  vendorStartingPriceValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0B0B0E',
  },
  vendorNegotiableBadge: {
    backgroundColor: '#FCFAF5',
    borderWidth: 1,
    borderColor: '#C5A059',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  vendorNegotiableBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8C6F34',
  },
  vendorCategoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8C6F34',
    letterSpacing: 0.5,
  },
  vendorMiniNegotiableTag: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  vendorMiniNegotiableTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#059669',
  },
  ceremonyOfferChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F5F7',
    borderWidth: 1,
    borderColor: '#E8E6E1',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  ceremonyOfferChipText: {
    fontSize: 11,
    color: '#0B0B0E',
    fontWeight: '600',
  },
  marginExplanationCard: {
    backgroundColor: '#FCFAF5',
    borderWidth: 1,
    borderColor: '#E8DEC8',
    borderRadius: 16,
    padding: 14,
    marginVertical: 10,
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
    color: '#8C6F34',
  },
  marginBody: {
    fontSize: 12,
    color: '#4A4852',
    lineHeight: 16,
  },
  marginFormulaRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E8DEC8',
  },
  formulaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8C6F34',
  },
  historyContainer: {
    marginTop: 10,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0B0B0E',
    marginBottom: 8,
  },
  historyEmptyText: {
    fontSize: 12,
    color: '#8E8B99',
    textAlign: 'center',
    paddingVertical: 14,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E6E1',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  historyItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0B0B0E',
  },
  historyProposed: {
    fontSize: 11.5,
    color: '#8E8B99',
    marginTop: 2,
  },
  historyStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#FEF3C7',
  },
  historyStatusApproved: {
    backgroundColor: '#ECFDF5',
  },
  historyStatusRejected: {
    backgroundColor: '#FFF1F2',
  },
  historyStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  historyStatusTextApproved: {
    color: '#059669',
  },
  historyStatusTextRejected: {
    color: '#E11D48',
  },
  reelsGrid: {
    gap: 12,
  },
  reelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8E6E1',
    shadowColor: '#0B0B0E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  reelThumb: {
    width: '100%',
    height: 180,
  },
  reelPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 11, 14, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelInfoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(11, 11, 14, 0.75)',
  },
  reelCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reelDuration: {
    fontSize: 11,
    color: '#C5A059',
    marginTop: 2,
  },
  gallerySection: {
    marginTop: 14,
  },
  galleryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0B0B0E',
    marginBottom: 8,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoWrap: {
    width: '31%',
    height: 90,
    borderRadius: 10,
    overflow: 'hidden',
  },
  photoItem: {
    width: '100%',
    height: '100%',
  },
  specsMatrixCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E6E1',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0B0B0E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
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
    color: '#0B0B0E',
  },
  specGridName: {
    fontSize: 11,
    color: '#8E8B99',
    marginTop: 2,
  },
  specGridDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E8E6E1',
  },
  specGridRowDivider: {
    height: 1,
    backgroundColor: '#E8E6E1',
    marginVertical: 4,
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E6E1',
    padding: 16,
    marginBottom: 12,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0B0B0E',
    marginBottom: 10,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F7',
  },
  contactText: {
    fontSize: 13,
    color: '#4A4852',
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E6E1',
    padding: 30,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0B0B0E',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12.5,
    color: '#8E8B99',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 11, 14, 0.55)',
    justifyContent: 'flex-end',
  },
  modalDialog: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0B0B0E',
  },
  inputLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#8C6F34',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F5F5F7',
    borderWidth: 1,
    borderColor: '#E8E6E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0B0B0E',
  },
  textInputDisabled: {
    backgroundColor: '#E8E6E1',
    color: '#8E8B99',
  },
  submitModalBtn: {
    backgroundColor: '#0B0B0E',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  submitModalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  onboardingContainer: {
    padding: 16,
  },
  onboardingHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E6E1',
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  goldCrestCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FAF2DF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  onboardingBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 8,
  },
  onboardingBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#059669',
  },
  onboardingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0B0B0E',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  onboardingSubtitle: {
    fontSize: 13,
    color: '#4A4852',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  onboardingFormCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E6E1',
    padding: 16,
  },
  onboardingFormTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0B0B0E',
    marginBottom: 12,
  },
  categorySelectGrid: {
    gap: 8,
  },
  categoryOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F5F5F7',
    borderWidth: 1.5,
    borderColor: '#E8E6E1',
    borderRadius: 14,
    padding: 12,
  },
  categoryOptionCardActive: {
    backgroundColor: '#FCFAF5',
    borderColor: '#C5A059',
  },
  categoryOptionText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#4A4852',
  },
  categoryOptionTextActive: {
    color: '#8C6F34',
  },
  localityChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
    marginBottom: 12,
  },
  localityChip: {
    backgroundColor: '#F5F5F7',
    borderWidth: 1,
    borderColor: '#E8E6E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  localityChipActive: {
    backgroundColor: '#0B0B0E',
    borderColor: '#0B0B0E',
  },
  localityChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#4A4852',
  },
  localityChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  formRowTwoCol: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  presetsPhotoRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 10,
  },
  presetPhotoCard: {
    width: 90,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E8E6E1',
    backgroundColor: '#F5F5F7',
  },
  presetPhotoCardActive: {
    borderColor: '#C5A059',
  },
  presetPhotoImg: {
    width: '100%',
    height: 60,
  },
  presetSelectedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetPhotoLabel: {
    fontSize: 9.5,
    color: '#0B0B0E',
    padding: 4,
    fontWeight: '600',
  },
  publishSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0B0B0E',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 16,
  },
  publishSubmitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalFormCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0B0B0E',
  },
  modalSubheading: {
    fontSize: 12,
    color: '#8E8B99',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyOnboardingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#E8DFD0',
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  emptyOnboardingIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FCFAF5',
    borderWidth: 1,
    borderColor: '#C5A059',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyOnboardingTitle: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 18,
    color: '#0B0B0E',
    letterSpacing: -0.3,
  },
  emptyOnboardingSub: {
    fontFamily: THEME.fonts.regular,
    fontSize: 13,
    color: '#4A4852',
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 16,
  },
  onboardingStepsList: {
    gap: 12,
    backgroundColor: '#FAF9F6',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E6E1',
    marginBottom: 16,
  },
  onboardingStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0B0B0E',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  stepTitle: {
    fontFamily: THEME.fonts.bold,
    fontSize: 13,
    color: '#0B0B0E',
  },
  stepDesc: {
    fontFamily: THEME.fonts.regular,
    fontSize: 11.5,
    color: '#4A4852',
    lineHeight: 15,
    marginTop: 2,
  },
  onboardingCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 14,
  },
  onboardingCreateBtnText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  serviceSelectorContainer: {
    marginBottom: 16,
  },
  serviceSelectorHeading: {
    fontSize: 10.5,
    fontFamily: THEME.fonts.bold,
    color: '#8C6F34',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  serviceDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#C5A059',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#C5A059',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  serviceDropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  serviceDropdownIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FCFAF5',
    borderWidth: 1,
    borderColor: '#E8DEC8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceDropdownTitle: {
    fontSize: 14.5,
    fontFamily: THEME.fonts.bold,
    color: '#0B0B0E',
    letterSpacing: -0.2,
  },
  serviceDropdownSub: {
    fontSize: 11,
    fontFamily: THEME.fonts.regular,
    color: '#6B6875',
    marginTop: 2,
  },
  serviceDropdownChevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#E8E6E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  venueSpecsSection: {
    marginBottom: 16,
  },
  venueSpecsHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E6E1',
    marginBottom: 12,
  },
  venueSpecsHeaderTitle: {
    fontSize: 14,
    fontFamily: THEME.fonts.bold,
    color: '#0B0B0E',
  },
  venueSpecsHeaderSub: {
    fontSize: 11.5,
    fontFamily: THEME.fonts.regular,
    color: '#6B6875',
    marginTop: 2,
  },
  editSpecsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FAF6ED',
    borderWidth: 1,
    borderColor: '#C5A059',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginLeft: 8,
  },
  editSpecsBtnText: {
    fontSize: 11.5,
    fontFamily: THEME.fonts.bold,
    color: '#0B0B0E',
  },
  subfilterScroll: {
    marginBottom: 12,
  },
  subfilterScrollContent: {
    gap: 8,
    paddingVertical: 2,
  },
  subfilterChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E6E1',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
  },
  subfilterChipActive: {
    backgroundColor: '#0B0B0E',
    borderColor: '#0B0B0E',
  },
  subfilterChipText: {
    fontSize: 11.5,
    fontFamily: THEME.fonts.semiBold,
    color: '#4A4852',
  },
  subfilterChipTextActive: {
    color: '#FFFFFF',
  },
  minGuestPill: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  minGuestPillText: {
    fontSize: 9.5,
    fontFamily: THEME.fonts.bold,
    color: '#1D4ED8',
  },
  emptyOfferingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E6E1',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  emptyOfferingTitle: {
    fontSize: 15,
    fontFamily: THEME.fonts.bold,
    color: '#0B0B0E',
    marginTop: 10,
  },
  emptyOfferingSub: {
    fontSize: 12,
    fontFamily: THEME.fonts.regular,
    color: '#6B6875',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 17,
  },
  emptyAddBtn: {
    backgroundColor: '#0B0B0E',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  emptyAddBtnText: {
    fontSize: 12.5,
    fontFamily: THEME.fonts.bold,
    color: '#FFFFFF',
  },
  dropdownDialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    width: '92%',
    maxWidth: 480,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 8,
  },
  modalSubTitle: {
    fontSize: 11.5,
    fontFamily: THEME.fonts.regular,
    color: '#6B6875',
    marginTop: 2,
  },
  serviceOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#E8E6E1',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  serviceOptionRowActive: {
    backgroundColor: '#FCFAF5',
    borderColor: '#C5A059',
  },
  serviceOptionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E6E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceOptionIconCircleActive: {
    backgroundColor: '#FAF6ED',
    borderColor: '#C5A059',
  },
  serviceOptionTitle: {
    fontSize: 13.5,
    fontFamily: THEME.fonts.bold,
    color: '#0B0B0E',
  },
  serviceOptionTitleActive: {
    color: '#8C6F34',
  },
  serviceOptionBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  serviceOptionBadgeActive: {
    backgroundColor: '#FAF6ED',
  },
  serviceOptionBadgeText: {
    fontSize: 9.5,
    fontFamily: THEME.fonts.bold,
    color: '#475569',
  },
  serviceOptionBadgeTextActive: {
    color: '#8C6F34',
  },
  serviceOptionSub: {
    fontSize: 11,
    fontFamily: THEME.fonts.regular,
    color: '#6B6875',
    marginTop: 2,
  },
  chipSelectorWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 12,
  },
  selectorChip: {
    backgroundColor: '#F5F5F7',
    borderWidth: 1,
    borderColor: '#E8E6E1',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
  },
  selectorChipActive: {
    backgroundColor: '#0B0B0E',
    borderColor: '#0B0B0E',
  },
  selectorChipText: {
    fontSize: 11.5,
    fontFamily: THEME.fonts.medium,
    color: '#4A4852',
  },
  selectorChipTextActive: {
    fontFamily: THEME.fonts.bold,
    color: '#FFFFFF',
  },
  presetThumbWrap: {
    width: 80,
    marginRight: 8,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E8E6E1',
  },
  presetThumbWrapActive: {
    borderColor: '#C5A059',
  },
  presetThumb: {
    width: '100%',
    height: 55,
    resizeMode: 'cover',
  },
  presetThumbText: {
    fontSize: 9,
    fontFamily: THEME.fonts.semiBold,
    color: '#4A4852',
    padding: 3,
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
  },

  stackHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0B0B0E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.3)',
  },
  stackHeaderTitle: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 12,
    color: '#D4AF37',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  stackHeaderSub: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11.5,
    color: '#9CA3AF',
    lineHeight: 16,
  },
  addBizBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#C5A059',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 10,
  },
  addBizBtnText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 12,
    color: '#0B0B0E',
  },
  bizStackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  bizStackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  bizStackIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bizStackName: {
    fontFamily: THEME.fonts.bold,
    fontSize: 15,
    color: '#0B0B0E',
  },
  bizActivePill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bizActivePillText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 9.5,
    color: '#059669',
  },
  bizStackMeta: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 2,
  },
  bizAddOfferingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  bizAddOfferingBtnText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 11,
    color: '#0B0B0E',
  },
  itemCategoryFilterLabel: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 10,
    color: '#6B7280',
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  addCapabilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF9',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E8DEC8',
    borderStyle: 'dashed',
    padding: 16,
    marginBottom: 16,
  },
  addCapabilityIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF9EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCapabilityTitle: {
    fontFamily: THEME.fonts.bold,
    fontSize: 14,
    color: '#8A723D',
  },
  addCapabilitySub: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 2,
  },
  quoteItemsBox: {
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 10,
    marginTop: 8,
    marginBottom: 8,
  },
  quoteItemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  quoteItemsHeaderText: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 9.5,
    color: '#8A723D',
    letterSpacing: 0.6,
  },
  quoteItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  quoteItemTitle: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12,
    color: '#374151',
    flex: 1,
    marginRight: 8,
  },
  quoteItemRate: {
    fontFamily: THEME.fonts.bold,
    fontSize: 12,
    color: '#0B0B0E',
  },
  targetBudgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  targetBudgetLabel: {
    fontFamily: THEME.fonts.bold,
    fontSize: 11.5,
    color: '#8A723D',
  },
  targetBudgetValue: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 13,
    color: '#8A723D',
  },
  counterOfferBadge: {
    backgroundColor: '#FFFDF9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C5A059',
    padding: 10,
    marginTop: 8,
    marginBottom: 8,
  },
  counterOfferBadgeLabel: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 9.5,
    color: '#8A723D',
    letterSpacing: 0.7,
  },
  counterOfferBadgeVal: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 16,
    color: '#0B0B0E',
  },
  counterOfferNotesText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  negotiationAcceptedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  negotiationAcceptedTagText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 11,
    color: '#059669',
  },
  counterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0B0B0E',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#C5A059',
  },
  counterBtnText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 12,
    color: '#D4AF37',
  },
  negotiationOverviewBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginBottom: 14,
  },
  negotiationOverviewLabel: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12,
    color: '#6B7280',
  },
  negotiationOverviewVal: {
    fontFamily: THEME.fonts.bold,
    fontSize: 12,
    color: '#0B0B0E',
  },
  negotiationOverviewValGold: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 14,
    color: '#8A723D',
  },

});
