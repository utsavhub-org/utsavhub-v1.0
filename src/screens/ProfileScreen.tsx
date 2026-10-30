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
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import VendorDashboardScreen from './VendorDashboardScreen';
import { THEME } from '../theme/colors';
import { BusinessCategory, UserRole } from '../types';

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

  // Profile Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('customer');
  const [formCity, setFormCity] = useState('Visakhapatnam');
  const [formArea, setFormArea] = useState('');
  const [formAvatar, setFormAvatar] = useState('');
  const [formWeddingDate, setFormWeddingDate] = useState('2026-11-20');
  const [formPartnerName, setFormPartnerName] = useState('');
  const [formBusinessName, setFormBusinessName] = useState('');
  const [formBusinessCategory, setFormBusinessCategory] = useState<BusinessCategory>('venue');

  // Auto prompt setup modal if newly signed in with incomplete profile
  useEffect(() => {
    if (currentUser) {
      setFormName(currentUser.name || '');
      setFormRole(currentUser.role || 'customer');
      setFormCity(currentUser.selectedCity || 'Visakhapatnam');
      setFormArea(currentUser.area_locality || '');
      setFormAvatar(currentUser.avatar_url || PRESET_AVATARS[0].url);
      setFormWeddingDate(currentUser.weddingDate || '2026-11-20');
      setFormPartnerName(currentUser.partnerName || '');
      setFormBusinessName(currentUser.businessName || '');
      setFormBusinessCategory(currentUser.businessCategory || 'venue');

      if (currentUser.isProfileComplete === false || !currentUser.name) {
        setIsEditModalOpen(true);
      }
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
      role: formRole,
      selectedCity: formCity,
      area_locality: formArea.trim(),
      avatar_url: formAvatar.trim() || PRESET_AVATARS[0].url,
      weddingDate: formWeddingDate.trim(),
      partnerName: formPartnerName.trim(),
      businessName: formBusinessName.trim(),
      businessCategory: formBusinessCategory,
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
          <TouchableOpacity
            style={styles.switchRoleBtn}
            onPress={switchRole}
            activeOpacity={0.7}
          >
            <Building size={14} color={THEME.colors.textPrimary} />
            <Text style={styles.switchRoleBtnText}>Switch to Vendor Mode</Text>
          </TouchableOpacity>

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
          {currentUser.selectedCity || 'Visakhapatnam'}
          {currentUser.weddingDate ? ` · Muhurtham in ${currentUser.weddingDate}` : ''}
        </Text>

        <View style={styles.verifiedRow}>
          <ShieldCheck size={13} color="#10B981" />
          <Text style={styles.verifiedText}>{currentUser.phone} (OTP Verified)</Text>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsCard}>
          <TouchableOpacity
            style={styles.statCol}
            onPress={onNavigateToBookings}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>2</Text>
            <Text style={styles.statLabel}>Venue Holds</Text>
          </TouchableOpacity>

          <View style={styles.statDivider} />

          <TouchableOpacity
            style={styles.statCol}
            onPress={onNavigateToWishlist}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Wishlisted</Text>
          </TouchableOpacity>

          <View style={styles.statDivider} />

          <TouchableOpacity
            style={styles.statCol}
            onPress={onNavigateToExplore}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>1</Text>
            <Text style={styles.statLabel}>Quote Saved</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Partner Callout Banner */}
      <View style={styles.partnerCallout}>
        <View style={{ flex: 1 }}>
          <Text style={styles.partnerTitle}>Are you a Convention Hall or Caterer?</Text>
          <Text style={styles.partnerSub}>
            Manage calendar holds, upload video reels & update prices.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.partnerActionBtn}
          onPress={switchRole}
          activeOpacity={0.8}
        >
          <Text style={styles.partnerActionText}>Open Partner Portal</Text>
          <ArrowRight size={13} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

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
            <Text style={styles.menuSub}>3 Halls & Mandapams favorited</Text>
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
            <Text style={styles.menuSub}>2 auspicious dates locked</Text>
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

              {/* Role Toggle */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Type</Text>
                <View style={styles.roleToggleRow}>
                  <TouchableOpacity
                    style={[
                      styles.roleToggleBtn,
                      formRole === 'customer' && styles.roleToggleBtnActive,
                    ]}
                    onPress={() => setFormRole('customer')}
                  >
                    <User
                      size={15}
                      color={formRole === 'customer' ? '#FFFFFF' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.roleToggleText,
                        formRole === 'customer' && styles.roleToggleTextActive,
                      ]}
                    >
                      Customer (Family)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.roleToggleBtn,
                      formRole === 'vendor' && styles.roleToggleBtnActive,
                    ]}
                    onPress={() => setFormRole('vendor')}
                  >
                    <Briefcase
                      size={15}
                      color={formRole === 'vendor' ? '#FFFFFF' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.roleToggleText,
                        formRole === 'vendor' && styles.roleToggleTextActive,
                      ]}
                    >
                      Vendor Partner
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Destination City Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Wedding / Event City</Text>
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

              {/* Customer Specific Fields */}
              {formRole === 'customer' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Partner / Spouse Name</Text>
                    <TextInput
                      style={styles.textInput}
                      value={formPartnerName}
                      onChangeText={setFormPartnerName}
                      placeholder="e.g. Rahul"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Wedding Date / Muhurtham</Text>
                    <TextInput
                      style={styles.textInput}
                      value={formWeddingDate}
                      onChangeText={setFormWeddingDate}
                      placeholder="YYYY-MM-DD or Month Year"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </>
              )}

              {/* Vendor Specific Fields */}
              {formRole === 'vendor' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Business / Hall Name</Text>
                    <TextInput
                      style={styles.textInput}
                      value={formBusinessName}
                      onChangeText={setFormBusinessName}
                      placeholder="e.g. Grand Swarna Palace Convention Hall"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Business Category</Text>
                    <View style={styles.categoryPillsRow}>
                      {(['venue', 'catering', 'decoration', 'photography'] as BusinessCategory[]).map(
                        (cat) => {
                          const isSelected = formBusinessCategory === cat;
                          return (
                            <TouchableOpacity
                              key={cat}
                              style={[
                                styles.catPill,
                                isSelected && styles.catPillActive,
                              ]}
                              onPress={() => setFormBusinessCategory(cat)}
                            >
                              <Text
                                style={[
                                  styles.catPillText,
                                  isSelected && styles.catPillTextActive,
                                ]}
                              >
                                {cat.toUpperCase()}
                              </Text>
                            </TouchableOpacity>
                          );
                        }
                      )}
                    </View>
                  </View>
                </>
              )}

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
});
