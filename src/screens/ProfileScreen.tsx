import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import {
  User,
  Heart,
  Calendar,
  Utensils,
  MessageCircle,
  Phone,
  MapPin,
  ChevronRight,
  CheckCircle2,
  Building,
  LogOut,
  ArrowRight,
  Edit3,
  Camera,
  X,
  Sparkles,
  Save,
  Check,
  ShieldCheck,
  Briefcase,
  Star,
  Send,
  Navigation,
  Image as ImageIcon,
  MessageSquare,
  Lock,
  AlertCircle,
  MailCheck,
  Clock,
  Mail,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import VendorDashboardScreen from './VendorDashboardScreen';
import VendorRegistrationScreen from './VendorRegistrationScreen';
import { THEME } from '../theme/colors';
import { BusinessCategory, UserRole, Review, SupportMessage } from '../types';
import {
  canUserReviewBusiness,
  submitReview,
  getSupportMessages,
  sendSupportMessage,
  getBusinessReviews,
  getUserWishlists,
  getCustomerBookings,
  getVendorApplication,
  approveVendorApplicationAndCreateBusiness,
} from '../lib/supabaseClient';

interface ProfileScreenProps {
  onNavigateToWishlist: () => void;
  onNavigateToBookings: () => void;
  onNavigateToExplore: () => void;
  onSelectVendor?: (vendorId: string) => void;
}

const ANDHRA_TELANGANA_CITIES = [
  'Visakhapatnam',
  'Vijayawada',
  'Guntur',
  'Rajahmundry',
  'Hyderabad',
  'Tirupati',
  'Kakinada',
];

const PRESET_AVATARS = [
  {
    id: 'bride',
    label: 'Bride',
    url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400',
  },
  {
    id: 'couple',
    label: 'Telugu Couple',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400',
  },
  {
    id: 'groom',
    label: 'Groom',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
  },
  {
    id: 'mandapam',
    label: 'Royal Mandap',
    url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400',
  },
];

export default function ProfileScreen({
  onNavigateToWishlist,
  onNavigateToBookings,
  onNavigateToExplore,
  onSelectVendor,
}: ProfileScreenProps) {
  const { currentUser, userRole, switchRole, openAuthModal, logout, updateProfile } = useAuth();
  const [showVendorRegistration, setShowVendorRegistration] = useState(false);

  // Profile Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCity, setFormCity] = useState('Visakhapatnam');
  const [formArea, setFormArea] = useState('');
  const [formAvatar, setFormAvatar] = useState('');

  // Real Dynamic Counts for User
  const [bookingCount, setBookingCount] = useState<number>(0);
  const [wishlistCount, setWishlistCount] = useState<number>(0);

  // Location & Image Picker States
  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccessMsg, setLocationSuccessMsg] = useState<string | null>(null);

  // Reviews State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewEligibleBookingId, setReviewEligibleBookingId] = useState<string | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [existingReviews, setExistingReviews] = useState<Review[]>([]);

  // Support Chat State
  const [isSupportChatOpen, setIsSupportChatOpen] = useState(false);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [newSupportMsg, setNewSupportMsg] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);

  // Pick Image from Local Phone Gallery
  const handlePickImageFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Please grant permission to choose photos from your device gallery.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedUri = result.assets[0].uri;
        setFormAvatar(pickedUri);
        setSuccessToast('Profile picture selected from device gallery!');
        setTimeout(() => setSuccessToast(null), 3000);
      }
    } catch (err: any) {
      Alert.alert('Image Error', err.message || 'Could not pick image from device.');
    }
  };

  // Detect GPS Location
  const handleDetectLocation = async () => {
    setIsLocating(true);
    setLocationSuccessMsg(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Permission to access location was denied. You can manually select your city below.'
        );
        setIsLocating(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        const cityCandidate = place.city || place.subregion || place.region || 'Visakhapatnam';
        const areaCandidate = [place.name, place.district, place.street].filter(Boolean).join(', ');

        setFormCity(cityCandidate);
        if (areaCandidate) {
          setFormArea(areaCandidate);
        }

        const fullLoc = `${cityCandidate}${areaCandidate ? ` - ${areaCandidate}` : ''}`;
        setLocationSuccessMsg(`Detected: ${fullLoc}`);
      }
    } catch (e: any) {
      console.warn('Location detection note:', e);
      Alert.alert('Location Notice', 'Could not fetch current coordinates. Please select your city manually.');
    } finally {
      setIsLocating(false);
    }
  };

  // Check past booking eligibility for reviews
  const handleOpenReviewsModal = async () => {
    if (!currentUser) return;
    const testBusinessId = '11111111-1111-1111-1111-111111111111';
    const check = await canUserReviewBusiness(currentUser.id, testBusinessId);
    if (check.canReview && check.bookingId) {
      setReviewEligibleBookingId(check.bookingId);
      const revs = await getBusinessReviews(testBusinessId);
      setExistingReviews(revs);
      setIsReviewModalOpen(true);
    } else {
      Alert.alert(
        'Verified Bookings Only',
        check.message ||
          'Reviews on UtsavHub are exclusively reserved for families who have completed a verified venue booking to ensure 100% authentic ratings.'
      );
    }
  };

  const handlePostReview = async () => {
    if (!reviewText.trim()) {
      Alert.alert('Required', 'Please write a brief review of your experience.');
      return;
    }
    if (!currentUser || !reviewEligibleBookingId) return;

    setIsSubmittingReview(true);
    const rev = await submitReview({
      booking_id: reviewEligibleBookingId,
      business_id: '11111111-1111-1111-1111-111111111111',
      user_id: currentUser.id,
      user_name: currentUser.name || 'Verified Family',
      user_avatar: currentUser.avatar_url,
      rating: reviewRating,
      review_text: reviewText.trim(),
    });

    setIsSubmittingReview(false);
    if (rev) {
      setExistingReviews((prev) => [rev, ...prev]);
      setReviewText('');
      Alert.alert('Review Submitted', 'Thank you! Your verified rating is now live.');
      setIsReviewModalOpen(false);
    }
  };

  // Support Chat
  const handleOpenSupportChat = async () => {
    if (!currentUser) return;
    setIsSupportChatOpen(true);
    const msgs = await getSupportMessages(currentUser.id);
    setSupportMessages(msgs);
  };

  const handleSendSupportMessage = async () => {
    if (!newSupportMsg.trim() || !currentUser) return;
    setIsSendingMsg(true);
    const sent = await sendSupportMessage(
      currentUser.id,
      currentUser.name || 'Guest User',
      newSupportMsg.trim(),
      currentUser.role === 'vendor' ? 'vendor' : 'user'
    );
    setIsSendingMsg(false);
    if (sent) {
      setSupportMessages((prev) => [...prev, sent]);
      setNewSupportMsg('');
    }
  };

  const [submittedApp, setSubmittedApp] = useState<any>(null);

  // Fetch real booking and wishlist counts for user + partner application
  useEffect(() => {
    async function loadStats() {
      if (currentUser) {
        const uid = currentUser.id || currentUser.phone || currentUser.email || '';
        const [savedWishlist, savedBookings, app] = await Promise.all([
          getUserWishlists(uid),
          getCustomerBookings(currentUser.phone || currentUser.email || uid),
          getVendorApplication(currentUser.id || uid),
        ]);
        setWishlistCount(savedWishlist.length);
        setBookingCount(savedBookings.length);
        if (app) {
          setSubmittedApp(app);
          if (currentUser.vendorApplicationStatus !== app.status) {
            updateProfile({ vendorApplicationStatus: app.status as any });
          }
        }
      } else {
        setWishlistCount(0);
        setBookingCount(0);
        setSubmittedApp(null);
      }
    }
    loadStats();
  }, [currentUser]);

  // Synchronize form fields when user profile changes (NO auto popup)
  useEffect(() => {
    if (currentUser) {
      setFormName(currentUser.name || '');
      setFormPhone(currentUser.phone || '');
      setFormCity(currentUser.selectedCity || 'Visakhapatnam');
      setFormArea(currentUser.area_locality || '');
      setFormAvatar(currentUser.avatar_url || PRESET_AVATARS[0].url);
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <View style={styles.loggedOutContainer}>
        <View style={styles.loggedOutCard}>
          <View style={styles.loggedOutAvatar}>
            <User size={36} color={THEME.colors.gold} />
          </View>
          <Text style={styles.loggedOutTitle}>Welcome to UtsavHub</Text>
          <Text style={styles.loggedOutSub}>
            Sign in with Google, Phone OTP, or Email to view saved mandapams, track your muhurtham venue holds, or manage your vendor business portal.
          </Text>
          <TouchableOpacity
            style={styles.signInPrimaryBtn}
            onPress={openAuthModal}
            activeOpacity={0.85}
          >
            <Text style={styles.signInPrimaryBtnText}>Sign In with Google, Phone or Email</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (showVendorRegistration) {
    return (
      <VendorRegistrationScreen
        currentUser={currentUser}
        onBack={() => setShowVendorRegistration(false)}
        onSuccess={async () => {
          setShowVendorRegistration(false);
          await updateProfile({
            vendorApplicationStatus: 'pending_verification',
          });
        }}
      />
    );
  }

  if (userRole === 'vendor') {
    return (
      <VendorDashboardScreen
        onSwitchToCustomer={switchRole}
        onPreviewPublicListing={(bizId) => {
          if (onSelectVendor) onSelectVendor(bizId);
        }}
      />
    );
  }

  const handleSupportWhatsApp = () => {
    const url = 'whatsapp://send?phone=919848012345&text=Hi%20UtsavHub%20Concierge%2C%20I%20need%20help%20with%20my%20wedding%20venue%20booking';
    Linking.openURL(url).catch(() => {
      Linking.openURL('https://wa.me/919848012345');
    });
  };

  const handleSupportCall = () => {
    Linking.openURL('tel:18004259988');
  };

  const handleSaveProfile = async () => {
    if (!formName.trim()) {
      Alert.alert('Required', 'Please enter your Name or Family Name.');
      return;
    }

    setIsSaving(true);
    const success = await updateProfile({
      name: formName.trim(),
      phone: formPhone.trim(),
      selectedCity: formCity,
      area_locality: formArea.trim(),
      avatar_url: formAvatar.trim() || PRESET_AVATARS[0].url,
      isProfileComplete: true,
    });

    setIsSaving(false);
    setIsEditModalOpen(false);

    if (success) {
      setSuccessToast('Profile updated & synced to Supabase!');
      setTimeout(() => setSuccessToast(null), 4000);
    } else {
      setSuccessToast('Profile saved locally (Supabase table sync pending)');
      setTimeout(() => setSuccessToast(null), 4000);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 80 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Success Notification Banner */}
      {successToast && (
        <View style={styles.toastBanner}>
          <CheckCircle2 size={16} color="#059669" />
          <Text style={styles.toastBannerText}>{successToast}</Text>
        </View>
      )}

      {/* Profile Incomplete Banner */}
      {currentUser.isProfileComplete === false && (
        <View style={styles.incompleteBanner}>
          <Sparkles size={16} color={THEME.colors.goldDark} />
          <View style={{ flex: 1 }}>
            <Text style={styles.incompleteTitle}>Welcome! Complete Your Profile</Text>
            <Text style={styles.incompleteSub}>
              Set your name, location, and wedding date to personalize bookings.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.incompleteBtn}
            onPress={() => setIsEditModalOpen(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.incompleteBtnText}>Complete</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Top Header Card */}
      <View style={styles.header}>
        <View style={styles.topControlRow}>
          {currentUser.vendorApplicationStatus === 'approved' || userRole === 'vendor' ? (
            <TouchableOpacity
              style={styles.switchRoleBtn}
              onPress={switchRole}
              activeOpacity={0.7}
            >
              <Building size={14} color={THEME.colors.textPrimary} />
              <Text style={styles.switchRoleBtnText}>
                {userRole === 'vendor' ? 'Switch to Customer Mode' : 'Open Vendor Dashboard'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.customerAccountBadge}>
              <User size={13} color="#64748B" />
              <Text style={styles.customerAccountBadgeText}>Customer Account</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.changeUserBtn}
            onPress={() => setIsEditModalOpen(true)}
            activeOpacity={0.7}
          >
            <Edit3 size={13} color={THEME.colors.accentDark} />
            <Text style={styles.changeUserText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Avatar with Photo Edit Badge */}
        <TouchableOpacity
          style={styles.avatarWrapper}
          onPress={() => setIsEditModalOpen(true)}
          activeOpacity={0.85}
        >
          {currentUser.avatar_url ? (
            <Image
              source={{ uri: currentUser.avatar_url }}
              style={styles.avatarImg}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.avatarCircle}>
              <User size={34} color="#FFFFFF" />
            </View>
          )}
          <View style={styles.avatarCameraBadge}>
            <Camera size={13} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        <Text style={styles.userName}>{currentUser.name || 'Telugu Family'}</Text>
        <Text style={styles.userSub}>
          {currentUser.area_locality ? `${currentUser.area_locality}, ` : ''}{currentUser.selectedCity || 'Visakhapatnam'}
        </Text>

        {/* Verification Status Badge */}
        {currentUser.authProvider === 'google' || (currentUser.email && (!currentUser.phone || currentUser.isEmailVerified)) ? (
          <View style={styles.verifiedRow}>
            <ShieldCheck size={14} color="#10B981" />
            <Text style={styles.verifiedText}>
              {currentUser.email} • Google Verified
            </Text>
          </View>
        ) : currentUser.authProvider === 'phone' || (currentUser.phone && !currentUser.email?.includes('@')) ? (
          <View style={styles.verifiedRow}>
            <ShieldCheck size={14} color="#10B981" />
            <Text style={styles.verifiedText}>
              +91 {currentUser.phone.replace('+91', '').trim()} (Phone OTP Verified)
            </Text>
          </View>
        ) : currentUser.isEmailVerified ? (
          <View style={styles.verifiedRow}>
            <ShieldCheck size={14} color="#10B981" />
            <Text style={styles.verifiedText}>
              {currentUser.email} (Email Verified)
            </Text>
          </View>
        ) : (
          <View style={[styles.verifiedRow, styles.unverifiedRow]}>
            <AlertCircle size={14} color="#F59E0B" />
            <Text style={styles.unverifiedText}>
              {currentUser.email} (Email Unverified - App Access Active)
            </Text>
          </View>
        )}

        {currentUser.phone && currentUser.phone.trim().length > 0 ? (
          <View style={styles.phoneDisplayRow}>
            <Phone size={12} color="#64748B" />
            <Text style={styles.phoneDisplayText}>{currentUser.phone}</Text>
          </View>
        ) : null}

        {/* Quick Stats Grid with Real Live Counts */}
        <View style={styles.statsCard}>
          <TouchableOpacity
            style={styles.statCol}
            onPress={onNavigateToBookings}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>{bookingCount}</Text>
            <Text style={styles.statLabel}>Venue Holds</Text>
          </TouchableOpacity>

          <View style={styles.statDivider} />

          <TouchableOpacity
            style={styles.statCol}
            onPress={onNavigateToWishlist}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>{wishlistCount}</Text>
            <Text style={styles.statLabel}>Wishlisted</Text>
          </TouchableOpacity>

          <View style={styles.statDivider} />

          <TouchableOpacity
            style={styles.statCol}
            onPress={onNavigateToExplore}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>{bookingCount > 0 ? 1 : 0}</Text>
            <Text style={styles.statLabel}>Quotes</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dynamic Partner & Vendor Registration Section */}
      {(!currentUser?.vendorApplicationStatus || currentUser?.vendorApplicationStatus === 'not_applied') && userRole !== 'vendor' && (
        <View style={styles.partnerCallout}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Sparkles size={14} color="#C5A059" />
              <Text style={styles.partnerBadgeLabel}>GROW YOUR WEDDING BUSINESS</Text>
            </View>
            <Text style={styles.partnerTitle}>Become an UtsavHub Partner</Text>
            <Text style={styles.partnerSub}>
              List Mandapams, Catering, 4K Photography or DJ Sound. Direct bookings with 0% advance commission.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.partnerActionBtn}
            onPress={() => setShowVendorRegistration(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.partnerActionText}>Register as Partner</Text>
            <ArrowRight size={13} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {currentUser?.vendorApplicationStatus === 'pending_verification' && (
        <View style={styles.partnerPendingCard}>
          <View style={styles.partnerPendingTopRow}>
            <View style={styles.partnerPendingBadge}>
              <Clock size={12} color="#B45309" />
              <Text style={styles.partnerPendingBadgeText}>APPLICATION PENDING UNDER REVIEW</Text>
            </View>
            <View style={styles.partnerPendingEtaBadge}>
              <Text style={styles.partnerPendingEtaText}>Priority Queue</Text>
            </View>
          </View>

          <Text style={styles.partnerPendingTitle}>Application Pending Under Review</Text>
          <Text style={styles.partnerPendingBody}>
            Your business registration documents and address proof have been received and are being verified by the UtsavHub Trust & Safety Team. Call our partner desk now to notify the verification team.
          </Text>

          <View style={styles.partnerPendingActionStack}>
            <TouchableOpacity
              style={styles.partnerCallDeskBtn}
              onPress={() => {
                const phone = '18004259988';
                Linking.openURL(`tel:${phone}`).catch(() => Linking.openURL('tel:919848012345'));
              }}
              activeOpacity={0.88}
            >
              <Phone size={15} color="#C5A059" />
              <Text style={styles.partnerCallDeskBtnText}>Call UtsavHub Team to Notify</Text>
            </TouchableOpacity>

            <View style={styles.partnerPendingSecondaryRow}>
              <TouchableOpacity
                style={styles.partnerWaBtn}
                onPress={() => {
                  const url = 'whatsapp://send?phone=919848012345&text=Namaste%20UtsavHub%20Admin%2C%20I%20have%20submitted%20my%20vendor%20partner%20application%20and%20would%20like%20to%20notify%20the%20onboarding%20team.';
                  Linking.openURL(url).catch(() => Linking.openURL('https://wa.me/919848012345'));
                }}
                activeOpacity={0.8}
              >
                <MessageCircle size={14} color="#059669" />
                <Text style={styles.partnerWaBtnText}>WhatsApp Desk</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.partnerSimulateBtn}
                onPress={async () => {
                  if (!currentUser) return;
                  const createdBiz = await approveVendorApplicationAndCreateBusiness(currentUser);
                  await updateProfile({
                    role: 'vendor',
                    vendorApplicationStatus: 'approved',
                    businessId: createdBiz?.id,
                    businessName: createdBiz?.name || currentUser.businessName,
                  });
                  switchRole();
                }}
                activeOpacity={0.8}
              >
                <CheckCircle2 size={14} color="#059669" />
                <Text style={styles.partnerSimulateBtnText}>Instant Approve (Demo)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {(currentUser?.vendorApplicationStatus === 'approved' || userRole === 'vendor') && (
        <View style={styles.partnerApprovedCard}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <ShieldCheck size={15} color="#059669" />
              <Text style={styles.partnerApprovedTitle}>VERIFIED PARTNER ACCOUNT</Text>
            </View>
            <Text style={styles.partnerApprovedSub}>
              {currentUser?.businessName || 'Your Business'} is active on the UtsavHub Registry.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.partnerApprovedBtn}
            onPress={switchRole}
            activeOpacity={0.85}
          >
            <Text style={styles.partnerApprovedBtnText}>
              {userRole === 'vendor' ? 'View Dashboard' : 'Switch to Partner'}
            </Text>
            <ArrowRight size={13} color="#0B0B0E" />
          </TouchableOpacity>
        </View>
      )}

      {/* Section 1: Wedding Planning */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>MY WEDDING PLANNING</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={onNavigateToWishlist}
          activeOpacity={0.7}
        >
          <View style={styles.menuIconCircle}>
            <Heart size={16} color={THEME.colors.textPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Saved Wishlist</Text>
            <Text style={styles.menuSub}>{wishlistCount} items favorited</Text>
          </View>
          <ChevronRight size={16} color={THEME.colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={onNavigateToBookings}
          activeOpacity={0.7}
        >
          <View style={styles.menuIconCircle}>
            <Calendar size={16} color={THEME.colors.textPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Active Holds & Bookings</Text>
            <Text style={styles.menuSub}>{bookingCount} active holds & inquiries</Text>
          </View>
          <ChevronRight size={16} color={THEME.colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={onNavigateToExplore}
          activeOpacity={0.7}
        >
          <View style={styles.menuIconCircle}>
            <Utensils size={16} color={THEME.colors.textPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Plate Cost Calculator</Text>
            <Text style={styles.menuSub}>Interactive per-plate menu estimator</Text>
          </View>
          <ChevronRight size={16} color={THEME.colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Section 2: Concierge & Support */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>CONCIERGE & SUPPORT</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleOpenSupportChat}
          activeOpacity={0.7}
        >
          <View style={styles.menuIconCircle}>
            <MessageSquare size={16} color={THEME.colors.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Live Support & Inquiries Chat</Text>
            <Text style={styles.menuSub}>Direct concierge assistance saved to Supabase</Text>
          </View>
          <ChevronRight size={16} color={THEME.colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleOpenReviewsModal}
          activeOpacity={0.7}
        >
          <View style={styles.menuIconCircle}>
            <Star size={16} color={THEME.colors.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Verified Past Booking Reviews</Text>
            <Text style={styles.menuSub}>Rate venues & caterers you previously booked</Text>
          </View>
          <ChevronRight size={16} color={THEME.colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleSupportWhatsApp}
          activeOpacity={0.7}
        >
          <View style={styles.menuIconCircle}>
            <MessageCircle size={16} color={THEME.colors.textPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>WhatsApp Concierge</Text>
            <Text style={styles.menuSub}>Connect with our wedding coordinator</Text>
          </View>
          <ChevronRight size={16} color={THEME.colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleSupportCall}
          activeOpacity={0.7}
        >
          <View style={styles.menuIconCircle}>
            <Phone size={16} color={THEME.colors.textPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Helpline: 1800-425-9988</Text>
            <Text style={styles.menuSub}>Toll-free 9 AM – 9 PM daily</Text>
          </View>
          <ChevronRight size={16} color={THEME.colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Section 3: Preferences & Sign Out */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>ACCOUNT</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setIsEditModalOpen(true)}
          activeOpacity={0.7}
        >
          <View style={styles.menuIconCircle}>
            <MapPin size={16} color={THEME.colors.textPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Destination City</Text>
            <Text style={styles.menuSub}>{currentUser.selectedCity || 'Visakhapatnam, Andhra Pradesh'}</Text>
          </View>
          <Edit3 size={15} color={THEME.colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={openAuthModal}
          activeOpacity={0.7}
        >
          <View style={styles.menuIconCircle}>
            <User size={16} color={THEME.colors.textPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Switch / Link Account</Text>
            <Text style={styles.menuSub}>Customer or Vendor partner login</Text>
          </View>
          <ChevronRight size={16} color={THEME.colors.textMuted} />
        </TouchableOpacity>

        {/* Dedicated Log Out Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={logout}
          activeOpacity={0.8}
        >
          <LogOut size={16} color={THEME.colors.danger} />
          <Text style={styles.logoutBtnText}>Log Out of UtsavHub</Text>
        </TouchableOpacity>
      </View>

      {/* ------------------------------------------------------------- */}
      {/* EDIT & COMPLETE PROFILE MODAL (SUPABASE SYNC)                  */}
      {/* ------------------------------------------------------------- */}
      <Modal
        visible={isEditModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Edit Your Profile</Text>
                <Text style={styles.modalSub}>
                  Saved directly to Supabase cloud database
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsEditModalOpen(false)}
                style={styles.closeModalBtn}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollBody}
            >
              {/* Avatar Selector */}
              <Text style={styles.formSectionLabel}>PROFILE PICTURE</Text>
              <View style={styles.avatarSelectionRow}>
                <View style={styles.activeAvatarPreview}>
                  {formAvatar ? (
                    <Image
                      source={{ uri: formAvatar }}
                      style={styles.previewAvatarImg}
                    />
                  ) : (
                    <View style={styles.avatarCircle}>
                      <User size={28} color="#FFFFFF" />
                    </View>
                  )}
                </View>

                <View style={styles.presetAvatarGrid}>
                  {PRESET_AVATARS.map((preset) => {
                    const isSelected = formAvatar === preset.url;
                    return (
                      <TouchableOpacity
                        key={preset.id}
                        style={[
                          styles.presetAvatarBtn,
                          isSelected && styles.presetAvatarBtnActive,
                        ]}
                        onPress={() => setFormAvatar(preset.url)}
                        activeOpacity={0.8}
                      >
                        <Image
                          source={{ uri: preset.url }}
                          style={styles.presetAvatarImg}
                        />
                        {isSelected && (
                          <View style={styles.presetCheckmark}>
                            <Check size={10} color="#FFFFFF" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Browse Photo from Local Device Gallery */}
              <TouchableOpacity
                style={styles.browseGalleryBtn}
                onPress={handlePickImageFromGallery}
                activeOpacity={0.85}
              >
                <ImageIcon size={18} color={THEME.colors.goldDark} />
                <Text style={styles.browseGalleryBtnText}>
                  Browse Photo From My Phone Gallery
                </Text>
              </TouchableOpacity>

              {/* Custom Image URL Option */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Or Enter Photo URL</Text>
                <TextInput
                  style={styles.textInput}
                  value={formAvatar}
                  onChangeText={setFormAvatar}
                  placeholder="https://..."
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                />
              </View>

              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name / Family Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formName}
                  onChangeText={setFormName}
                  placeholder="e.g. Ananya & Rahul or Sridhar Varma"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Mobile Phone Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mobile Phone Number (Optional)</Text>
                <View style={styles.profilePhoneInputRow}>
                  <View style={styles.profileCountryBadge}>
                    <Text style={{ fontSize: 14 }}>🇮🇳</Text>
                    <Text style={styles.profileCountryCode}>+91</Text>
                  </View>
                  <TextInput
                    style={styles.profilePhoneTextInput}
                    value={formPhone.replace(/\D/g, '').slice(0, 10)}
                    onChangeText={(txt) => setFormPhone(txt.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter 10-digit mobile number"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                  {/^[6-9]\d{9}$/.test(formPhone.replace(/\D/g, '')) && (
                    <View style={{ paddingRight: 10 }}>
                      <CheckCircle2 size={16} color="#059669" />
                    </View>
                  )}
                </View>
              </View>



              {/* Destination City Selection with GPS Auto-Detect */}
              <View style={styles.inputGroup}>
                <View style={styles.locationHeaderRow}>
                  <Text style={styles.inputLabel}>Wedding / Event City</Text>
                  <TouchableOpacity
                    style={styles.detectLocationBtn}
                    onPress={handleDetectLocation}
                    disabled={isLocating}
                    activeOpacity={0.8}
                  >
                    {isLocating ? (
                      <ActivityIndicator size="small" color={THEME.colors.goldDark} />
                    ) : (
                      <>
                        <Navigation size={13} color={THEME.colors.goldDark} />
                        <Text style={styles.detectLocationBtnText}>Auto-Detect GPS</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {locationSuccessMsg && (
                  <View style={styles.locationDetectedBadge}>
                    <CheckCircle2 size={13} color="#059669" />
                    <Text style={styles.locationDetectedText}>{locationSuccessMsg}</Text>
                  </View>
                )}

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.cityPillsRow}
                >
                  {ANDHRA_TELANGANA_CITIES.map((city) => {
                    const isSelected = formCity === city;
                    return (
                      <TouchableOpacity
                        key={city}
                        style={[
                          styles.cityPill,
                          isSelected && styles.cityPillActive,
                        ]}
                        onPress={() => setFormCity(city)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.cityPillText,
                            isSelected && styles.cityPillTextActive,
                          ]}
                        >
                          {city}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Area / Locality */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Locality / Area</Text>
                <TextInput
                  style={styles.textInput}
                  value={formArea}
                  onChangeText={setFormArea}
                  placeholder="e.g. Madhurawada, Beach Road, MVP Colony"
                  placeholderTextColor="#94A3B8"
                />
              </View>



              {/* Save Button */}
              <TouchableOpacity
                style={styles.saveProfileBtn}
                onPress={handleSaveProfile}
                disabled={isSaving}
                activeOpacity={0.85}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Save size={18} color="#FFFFFF" />
                    <Text style={styles.saveProfileBtnText}>
                      Save Profile to Supabase
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* VERIFIED PAST-BOOKING REVIEW MODAL                            */}
      {/* ------------------------------------------------------------- */}
      <Modal
        visible={isReviewModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsReviewModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <View style={styles.badgeVerifiedRow}>
                  <ShieldCheck size={14} color="#059669" />
                  <Text style={styles.badgeVerifiedText}>Verified Booking Review</Text>
                </View>
                <Text style={styles.modalTitle}>Rate Your Experience</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsReviewModalOpen(false)}
                style={styles.closeModalBtn}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollBody}
            >
              <Text style={styles.reviewSub}>
                Only clients with completed or approved bookings can submit a review to ensure authenticity.
              </Text>

              {/* Star Rating Selector */}
              <View style={styles.starRatingRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setReviewRating(star)}
                    activeOpacity={0.7}
                    style={{ padding: 4 }}
                  >
                    <Star
                      size={32}
                      color={star <= reviewRating ? '#EAB308' : '#CBD5E1'}
                      fill={star <= reviewRating ? '#EAB308' : 'transparent'}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Review Text Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Your Feedback & Rating Comments</Text>
                <TextInput
                  style={[styles.textInput, { height: 95, textAlignVertical: 'top' }]}
                  multiline
                  numberOfLines={4}
                  value={reviewText}
                  onChangeText={setReviewText}
                  placeholder="Share details regarding AC cooling, hall ambiance, staff support or dining arrangements..."
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <TouchableOpacity
                style={styles.saveProfileBtn}
                onPress={handlePostReview}
                disabled={isSubmittingReview}
                activeOpacity={0.85}
              >
                {isSubmittingReview ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <CheckCircle2 size={18} color="#FFFFFF" />
                    <Text style={styles.saveProfileBtnText}>
                      Publish Verified Review
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Past Reviews List */}
              {existingReviews.length > 0 && (
                <View style={{ marginTop: 24 }}>
                  <Text style={styles.formSectionLabel}>PUBLISHED REVIEWS</Text>
                  {existingReviews.map((rev) => (
                    <View key={rev.id} style={styles.reviewItemCard}>
                      <View style={styles.revHeader}>
                        <Text style={styles.revAuthor}>{rev.user_name}</Text>
                        <View style={styles.starsSmall}>
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} size={13} color="#EAB308" fill="#EAB308" />
                          ))}
                        </View>
                      </View>
                      <Text style={styles.revText}>{rev.review_text}</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* LIVE SUPPORT & CONCIERGE CHAT MODAL                           */}
      {/* ------------------------------------------------------------- */}
      <Modal
        visible={isSupportChatOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsSupportChatOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '85%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>UtsavHub Concierge</Text>
                <Text style={styles.modalSub}>Ask anything about venues, decor, or muhurtham dates</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsSupportChatOpen(false)}
                style={styles.closeModalBtn}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Chat Messages */}
            <ScrollView
              style={{ flex: 1, paddingHorizontal: 16 }}
              contentContainerStyle={{ paddingVertical: 12 }}
              showsVerticalScrollIndicator={false}
            >
              {supportMessages.map((m) => {
                const isUser = m.sender === 'user' || m.user_id === currentUser.id;
                return (
                  <View
                    key={m.id}
                    style={[
                      styles.chatBubbleContainer,
                      isUser ? styles.chatBubbleRight : styles.chatBubbleLeft,
                    ]}
                  >
                    {!isUser && <Text style={styles.chatAuthor}>{m.user_name || 'Concierge'}</Text>}
                    <View
                      style={[
                        styles.chatBubble,
                        isUser ? styles.chatBubbleUser : styles.chatBubbleSupport,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chatBubbleText,
                          isUser ? styles.chatBubbleTextUser : styles.chatBubbleTextSupport,
                        ]}
                      >
                        {m.message}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* Chat Input Bar */}
            <View style={styles.chatInputRow}>
              <TextInput
                style={styles.chatTextInput}
                value={newSupportMsg}
                onChangeText={setNewSupportMsg}
                placeholder="Type your question..."
                placeholderTextColor="#94A3B8"
              />
              <TouchableOpacity
                style={styles.chatSendBtn}
                onPress={handleSendSupportMessage}
                disabled={isSendingMsg || !newSupportMsg.trim()}
                activeOpacity={0.8}
              >
                {isSendingMsg ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Send size={16} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.canvas,
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
  },
  toastBannerText: {
    fontFamily: THEME.fonts.semiBold,
    fontSize: 12.5,
    color: '#065F46',
    flex: 1,
  },
  incompleteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.4)',
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
  },
  incompleteTitle: {
    fontFamily: THEME.fonts.bold,
    fontSize: 13,
    color: '#92400E',
  },
  incompleteSub: {
    fontFamily: THEME.fonts.regular,
    fontSize: 11.5,
    color: '#B45309',
    marginTop: 2,
  },
  incompleteBtn: {
    backgroundColor: THEME.colors.accentDark,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  incompleteBtnText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 22,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  topControlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  customerAccountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  customerAccountBadgeText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 11,
    color: '#64748B',
  },
  profilePhoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  profileCountryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderRightWidth: 1,
    borderRightColor: THEME.colors.border,
  },
  profileCountryCode: {
    fontFamily: THEME.fonts.bold,
    fontSize: 13,
    color: THEME.colors.textPrimary,
  },
  profilePhoneTextInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: THEME.fonts.medium,
    fontSize: 14,
    color: THEME.colors.textPrimary,
  },
  switchRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.surface,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  switchRoleBtnText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 11.5,
    color: THEME.colors.textPrimary,
  },
  changeUserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#FAF6ED',
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.3)',
  },
  changeUserText: {
    fontFamily: THEME.fonts.semiBold,
    fontSize: 11.5,
    color: THEME.colors.accentDark,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImg: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: THEME.colors.gold,
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: THEME.colors.accentDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: THEME.colors.gold,
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: THEME.colors.gold,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 19,
    color: THEME.colors.textPrimary,
    marginBottom: 4,
  },
  userSub: {
    fontFamily: THEME.fonts.regular,
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginBottom: 6,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 18,
  },
  verifiedText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12,
    color: '#059669',
  },
  unverifiedRow: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  unverifiedText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12,
    color: '#D97706',
  },
  phoneDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 14,
  },
  phoneDisplayText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12.5,
    color: '#64748B',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 17,
    color: THEME.colors.textPrimary,
  },
  statLabel: {
    fontFamily: THEME.fonts.regular,
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: THEME.colors.border,
  },
  partnerCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.accentDark,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  partnerTitle: {
    fontFamily: THEME.fonts.bold,
    fontSize: 13.5,
    color: '#FFFFFF',
  },
  partnerSub: {
    fontFamily: THEME.fonts.regular,
    fontSize: 11.5,
    color: '#A1A1AA',
    marginTop: 2,
  },
  partnerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.colors.gold,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  partnerActionText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 11.5,
    color: '#FFFFFF',
  },
  partnerPendingCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#F3E8D0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  partnerPendingTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  partnerPendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  partnerPendingBadgeText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 10,
    color: '#B45309',
    letterSpacing: 0.7,
  },
  partnerPendingEtaBadge: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 10,
  },
  partnerPendingEtaText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 10.5,
    color: '#475569',
  },
  partnerPendingTitle: {
    fontFamily: THEME.fonts.bold,
    fontSize: 16.5,
    color: '#0B0B0E',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  partnerPendingBody: {
    fontFamily: THEME.fonts.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#52505C',
    marginBottom: 16,
  },
  partnerPendingActionStack: {
    gap: 9,
  },
  partnerCallDeskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0B0B0E',
    paddingVertical: 13,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#C5A059',
  },
  partnerCallDeskBtnText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  partnerPendingSecondaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  partnerWaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingVertical: 10,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  partnerWaBtnText: {
    fontFamily: THEME.fonts.semiBold,
    fontSize: 11.5,
    color: '#15803D',
  },
  partnerSimulateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#FAF6ED',
    paddingVertical: 10,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.4)',
  },
  partnerSimulateBtnText: {
    fontFamily: THEME.fonts.semiBold,
    fontSize: 11,
    color: '#92400E',
  },
  partnerApprovedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  partnerApprovedTitle: {
    fontFamily: THEME.fonts.bold,
    fontSize: 11.5,
    color: '#065F46',
    letterSpacing: 0.5,
  },
  partnerApprovedSub: {
    fontFamily: THEME.fonts.regular,
    fontSize: 11.5,
    color: '#475569',
    marginTop: 2,
  },
  partnerApprovedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#C5A059',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  partnerApprovedBtnText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 11.5,
    color: '#0B0B0E',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionHeader: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 11,
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
  },
  menuIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: THEME.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontFamily: THEME.fonts.bold,
    fontSize: 14,
    color: THEME.colors.textPrimary,
  },
  menuSub: {
    fontFamily: THEME.fonts.regular,
    fontSize: 11.5,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: THEME.colors.dangerBg,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.2)',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 14,
    marginBottom: 20,
  },
  logoutBtnText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 13.5,
    color: THEME.colors.danger,
  },
  loggedOutContainer: {
    flex: 1,
    backgroundColor: THEME.colors.canvas,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loggedOutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  loggedOutAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FAF6ED',
    borderWidth: 1.5,
    borderColor: 'rgba(197, 160, 89, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loggedOutTitle: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 20,
    color: THEME.colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  loggedOutSub: {
    fontFamily: THEME.fonts.regular,
    fontSize: 13,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  signInPrimaryBtn: {
    backgroundColor: THEME.colors.accentDark,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInPrimaryBtnText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  modalTitle: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 18,
    color: THEME.colors.textPrimary,
  },
  modalSub: {
    fontFamily: THEME.fonts.regular,
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  closeModalBtn: {
    padding: 6,
  },
  modalScrollBody: {
    padding: 20,
    paddingBottom: 40,
  },
  formSectionLabel: {
    fontFamily: THEME.fonts.bold,
    fontSize: 11,
    color: THEME.colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  avatarSelectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 18,
  },
  activeAvatarPreview: {
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: THEME.colors.gold,
  },
  previewAvatarImg: {
    width: '100%',
    height: '100%',
  },
  presetAvatarGrid: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
  },
  presetAvatarBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: THEME.colors.border,
    position: 'relative',
  },
  presetAvatarBtnActive: {
    borderColor: THEME.colors.gold,
  },
  presetAvatarImg: {
    width: '100%',
    height: '100%',
  },
  presetCheckmark: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: THEME.colors.gold,
    borderRadius: 6,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: THEME.fonts.semiBold,
    fontSize: 12.5,
    color: THEME.colors.textPrimary,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: THEME.fonts.regular,
    fontSize: 14,
    color: THEME.colors.textPrimary,
  },
  roleToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    backgroundColor: THEME.colors.surface,
  },
  roleToggleBtnActive: {
    backgroundColor: THEME.colors.accentDark,
    borderColor: THEME.colors.accentDark,
  },
  roleToggleText: {
    fontFamily: THEME.fonts.semiBold,
    fontSize: 12.5,
    color: '#64748B',
  },
  roleToggleTextActive: {
    color: '#FFFFFF',
  },
  cityPillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  cityPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  cityPillActive: {
    backgroundColor: '#FAF6ED',
    borderColor: THEME.colors.gold,
  },
  cityPillText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12.5,
    color: THEME.colors.textSecondary,
  },
  cityPillTextActive: {
    fontFamily: THEME.fonts.bold,
    color: THEME.colors.accentDark,
  },
  categoryPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  catPillActive: {
    backgroundColor: THEME.colors.accentDark,
    borderColor: THEME.colors.accentDark,
  },
  catPillText: {
    fontFamily: THEME.fonts.semiBold,
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  catPillTextActive: {
    color: '#FFFFFF',
  },
  saveProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: THEME.colors.accentDark,
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 10,
    marginBottom: 20,
  },
  saveProfileBtnText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 14.5,
    color: '#FFFFFF',
  },
  browseGalleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FAF6ED',
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.4)',
    paddingVertical: 11,
    borderRadius: 12,
    marginBottom: 14,
  },
  browseGalleryBtnText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 12.5,
    color: THEME.colors.goldDark,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  detectLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FAF6ED',
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.4)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  detectLocationBtnText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 11,
    color: THEME.colors.goldDark,
  },
  locationDetectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  locationDetectedText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11.5,
    color: '#065F46',
  },
  badgeVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  badgeVerifiedText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 11,
    color: '#059669',
  },
  reviewSub: {
    fontFamily: THEME.fonts.regular,
    fontSize: 12.5,
    color: THEME.colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  starRatingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: THEME.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  reviewItemCard: {
    backgroundColor: THEME.colors.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 10,
  },
  revHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  revAuthor: {
    fontFamily: THEME.fonts.bold,
    fontSize: 12.5,
    color: THEME.colors.textPrimary,
  },
  starsSmall: {
    flexDirection: 'row',
    gap: 2,
  },
  revText: {
    fontFamily: THEME.fonts.regular,
    fontSize: 12,
    color: THEME.colors.textSecondary,
    lineHeight: 17,
  },
  chatBubbleContainer: {
    marginBottom: 12,
    maxWidth: '82%',
  },
  chatBubbleLeft: {
    alignSelf: 'flex-start',
  },
  chatBubbleRight: {
    alignSelf: 'flex-end',
  },
  chatAuthor: {
    fontFamily: THEME.fonts.semiBold,
    fontSize: 10.5,
    color: THEME.colors.textMuted,
    marginBottom: 2,
    marginLeft: 4,
  },
  chatBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  chatBubbleUser: {
    backgroundColor: THEME.colors.accentDark,
    borderBottomRightRadius: 4,
  },
  chatBubbleSupport: {
    backgroundColor: '#F1F5F9',
    borderBottomLeftRadius: 4,
  },
  chatBubbleText: {
    fontFamily: THEME.fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  chatBubbleTextUser: {
    color: '#FFFFFF',
  },
  chatBubbleTextSupport: {
    color: '#0F172A',
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  chatTextInput: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: THEME.fonts.regular,
    fontSize: 13,
    color: THEME.colors.textPrimary,
  },
  chatSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.accentDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
