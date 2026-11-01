import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Building,
  Flower2,
  Utensils,
  Camera,
  Music,
  MapPin,
  Phone,
  MessageCircle,
  FileText,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Check,
  Tag,
  Ruler,
  Clock,
  ArrowRight,
  Lock,
} from 'lucide-react-native';
import { THEME } from '../theme/colors';
import { BusinessCategory, UserProfile } from '../types';
import { submitVendorApplication } from '../lib/supabaseClient';

interface VendorRegistrationScreenProps {
  currentUser: UserProfile | null;
  onBack: () => void;
  onSuccess: () => void;
}

const CAPABILITY_OPTIONS: {
  key: BusinessCategory;
  title: string;
  subtitle: string;
  icon: any;
  defaultPrice: number;
}[] = [
  {
    key: 'decoration',
    title: 'Mandapam & Decor Sets',
    subtitle: 'Mandapams, way works, sangeeth stages, rata muhurtham, kalagollu, home decor',
    icon: Flower2,
    defaultPrice: 65000,
  },
  {
    key: 'catering',
    title: 'Catering & Royal Feasts',
    subtitle: 'Authentic Andhra & Telugu feasts, pure veg sattvik, live counters & stalls',
    icon: Utensils,
    defaultPrice: 450,
  },
  {
    key: 'photography',
    title: '4K Photography & Cinema',
    subtitle: 'Full-service cinematography, candid stills, heirloom photobooks & drone aerials',
    icon: Camera,
    defaultPrice: 45000,
  },
  {
    key: 'dj_sound',
    title: 'DJ, Concert Sound & FX',
    subtitle: 'Line-array concert audio, barat sound trucks, acoustic folk, truss & cold pyro',
    icon: Music,
    defaultPrice: 25000,
  },
  {
    key: 'venue',
    title: 'Convention Hall & Lawns',
    subtitle: 'AC kalyana mandapams, banquet halls, beachfront royal lawns & wedding resorts',
    icon: Building,
    defaultPrice: 150000,
  },
];

const ANDHRA_TELANGANA_CITIES = [
  'Visakhapatnam',
  'Vijayawada',
  'Guntur',
  'Rajahmundry',
  'Hyderabad',
  'Tirupati',
  'Kakinada',
];

const SAMPLE_KYC_DOCS = [
  {
    id: 'aadhaar_1',
    label: 'Aadhaar Card (Govt of India)',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'gst_1',
    label: 'GST / Business Certificate',
    url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'trade_1',
    label: 'Trade License / Electricity Bill',
    url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
  },
];

const PORTFOLIO_PRESETS: Record<BusinessCategory, { label: string; url: string }[]> = {
  decoration: [
    { label: 'Tirumala Gopuram Mandapam', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80' },
    { label: 'Pastel Blossom Canopy', url: 'https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&w=800&q=80' },
    { label: '100ft Fairy Tunnel Wayworks', url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80' },
    { label: 'Haldi Marigold Jhula', url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80' },
  ],
  catering: [
    { label: 'Royal Andhra Grand Feast', url: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80' },
    { label: 'Live Dosa & Chaat Counter', url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80' },
  ],
  photography: [
    { label: '4K Muhurtham Candid Cinema', url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=80' },
    { label: 'Pre-Wedding Scenic Shoot', url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80' },
  ],
  dj_sound: [
    { label: 'Concert Line Array & DJ', url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80' },
    { label: 'Barat Sound Truck & Dhol', url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80' },
  ],
  venue: [
    { label: 'AC Grand Ballroom', url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80' },
    { label: 'Beachfront Royal Lawns', url: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=800&q=80' },
  ],
};

export default function VendorRegistrationScreen({
  currentUser,
  onBack,
  onSuccess,
}: VendorRegistrationScreenProps) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<number>(1);

  // Form State
  const [selectedCategories, setSelectedCategories] = useState<BusinessCategory[]>(['decoration']);
  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [whatsappNumber, setWhatsappNumber] = useState(currentUser?.phone || '');
  const [addressLine, setAddressLine] = useState('');
  const [locality, setLocality] = useState('Siripuram Junction');
  const [city, setCity] = useState(currentUser?.selectedCity || 'Visakhapatnam');
  const [pincode, setPincode] = useState('530003');

  // KYC Identity & Address Proof State
  const [idProofType, setIdProofType] = useState<'aadhaar' | 'pan' | 'trade_license' | 'gst'>('aadhaar');
  const [idProofLast4, setIdProofLast4] = useState('4892');
  const [idProofDocUrl, setIdProofDocUrl] = useState(SAMPLE_KYC_DOCS[0].url);

  // Offerings & Pricing State
  const [baseStartingPrice, setBaseStartingPrice] = useState('65000');
  const [specsNotes, setSpecsNotes] = useState('Tirumala Temple Gopuram Mandapam 30x20 ft, 16 ft Height, Fresh Jasmine & Roses');
  const [selectedPortfolioUrls, setSelectedPortfolioUrls] = useState<string[]>([
    PORTFOLIO_PRESETS.decoration[0].url,
    PORTFOLIO_PRESETS.decoration[1].url,
  ]);

  const [submitting, setSubmitting] = useState(false);

  // Toggle category capabilities
  const toggleCategory = (cat: BusinessCategory) => {
    setSelectedCategories((prev) => {
      if (prev.includes(cat)) {
        if (prev.length === 1) {
          Alert.alert('Required', 'Please select at least one service category.');
          return prev;
        }
        return prev.filter((c) => c !== cat);
      } else {
        const next = [...prev, cat];
        const defaultP = CAPABILITY_OPTIONS.find((c) => c.key === cat)?.defaultPrice;
        if (defaultP) setBaseStartingPrice(String(defaultP));
        return next;
      }
    });
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (selectedCategories.length === 0) {
        Alert.alert('Select Capability', 'Please choose at least one service offering.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!businessName.trim()) {
        Alert.alert('Required Field', 'Please enter your business or studio brand name.');
        return;
      }
      if (!addressLine.trim()) {
        Alert.alert('Address Required', 'Please enter your registered street/shop address.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!idProofLast4.trim() || idProofLast4.trim().length !== 4) {
        Alert.alert('KYC Required', 'Please enter the last 4 digits of your Aadhaar or ID proof.');
        return;
      }
      setStep(4);
    }
  };

  const handleSubmitApplication = async () => {
    if (!currentUser) {
      Alert.alert('Sign In', 'Please sign in to submit your partner application.');
      return;
    }

    setSubmitting(true);
    try {
      const applicationData = {
        user_id: currentUser.id,
        business_name: businessName.trim(),
        primary_contact_name: contactName.trim() || currentUser.name || businessName.trim(),
        phone: phone.trim() || currentUser.phone || '+91 98480 12345',
        whatsapp_number: whatsappNumber.trim() || phone.trim() || '+91 98480 12345',
        categories: selectedCategories,
        address_line: addressLine.trim(),
        area_locality: locality.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        id_proof_type: idProofType,
        id_proof_last4: idProofLast4.trim(),
        id_proof_doc_url: idProofDocUrl,
        portfolio_images: selectedPortfolioUrls,
        base_starting_price: Number(baseStartingPrice || 50000),
        specs_notes: specsNotes.trim(),
        status: 'pending_verification' as const,
      };

      const success = await submitVendorApplication(currentUser, applicationData);

      if (success) {
        Alert.alert(
          '🎉 Registration Successful!',
          'Your partner registration has been submitted and will be verified by UtsavHub shortly.',
          [
            {
              text: 'Go to Profile',
              onPress: onSuccess,
            },
          ]
        );
      } else {
        Alert.alert('Notice', 'Unable to submit application. Please check your network connection.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Submission error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* 1. CLEAN TOP HEADER */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ChevronLeft size={22} color="#0B0B0E" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.topBarTitle}>Become a Partner</Text>
          <Text style={styles.topBarSub}>UtsavHub Verified Vendor Registry</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* 2. PROGRESS STEP BAR */}
      <View style={styles.stepProgressBar}>
        {[
          { num: 1, label: 'Services' },
          { num: 2, label: 'Address' },
          { num: 3, label: 'KYC Proof' },
          { num: 4, label: 'Tariff & Photos' },
        ].map((s) => {
          const isActive = step === s.num;
          const isDone = step > s.num;
          return (
            <View key={s.num} style={styles.stepItem}>
              <View
                style={[
                  styles.stepBadge,
                  isActive && styles.stepBadgeActive,
                  isDone && styles.stepBadgeDone,
                ]}
              >
                {isDone ? (
                  <Check size={12} color="#FFFFFF" />
                ) : (
                  <Text
                    style={[
                      styles.stepBadgeText,
                      isActive && styles.stepBadgeTextActive,
                    ]}
                  >
                    {s.num}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  isActive && styles.stepLabelActive,
                  isDone && styles.stepLabelDone,
                ]}
              >
                {s.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* 3. FORM BODY */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= STEP 1: CAPABILITIES & CATEGORIES ================= */}
        {step === 1 && (
          <View>
            <View style={styles.sectionHeaderBox}>
              <Text style={styles.sectionHeading}>What services do you provide?</Text>
              <Text style={styles.sectionSubheading}>
                Select all services you can fulfill. You can manage multiple service categories under one account.
              </Text>
            </View>

            <View style={{ gap: 10, marginTop: 14 }}>
              {CAPABILITY_OPTIONS.map((opt) => {
                const isSelected = selectedCategories.includes(opt.key);
                const IconComponent = opt.icon;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.capabilityCard, isSelected && styles.capabilityCardActive]}
                    onPress={() => toggleCategory(opt.key)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.capabilityIconCircle,
                        isSelected && styles.capabilityIconCircleActive,
                      ]}
                    >
                      <IconComponent size={20} color={isSelected ? '#C5A059' : '#4A4852'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.capabilityTitle,
                          isSelected && styles.capabilityTitleActive,
                        ]}
                      >
                        {opt.title}
                      </Text>
                      <Text style={styles.capabilitySub}>{opt.subtitle}</Text>
                    </View>
                    <View
                      style={[
                        styles.capabilityCheckCircle,
                        isSelected && styles.capabilityCheckCircleActive,
                      ]}
                    >
                      {isSelected && <Check size={14} color="#FFFFFF" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.infoBanner}>
              <Sparkles size={16} color="#C5A059" />
              <Text style={styles.infoBannerText}>
                Telugu wedding specialists offering both Mandapams & Catering can manage all bookings together.
              </Text>
            </View>
          </View>
        )}

        {/* ================= STEP 2: BUSINESS & REGISTERED PHYSICAL ADDRESS ================= */}
        {step === 2 && (
          <View>
            <View style={styles.sectionHeaderBox}>
              <Text style={styles.sectionHeading}>Business & Location Details</Text>
              <Text style={styles.sectionSubheading}>
                Provide your registered studio/office address. Customers will see your locality on storefronts.
              </Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.inputLabel}>BUSINESS / BRAND NAME *</Text>
              <TextInput
                style={styles.textInput}
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="e.g. Sri Venkateswara Mandapams & Luxury Decor"
                placeholderTextColor="#8E8B99"
              />

              <Text style={[styles.inputLabel, { marginTop: 14 }]}>PRIMARY CONTACT PERSON *</Text>
              <TextInput
                style={styles.textInput}
                value={contactName}
                onChangeText={setContactName}
                placeholder="e.g. Ramesh Naidu"
                placeholderTextColor="#8E8B99"
              />

              <View style={styles.twoColRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>PHONE NUMBER *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+91 98480 12345"
                    placeholderTextColor="#8E8B99"
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>WHATSAPP NUMBER *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={whatsappNumber}
                    onChangeText={setWhatsappNumber}
                    placeholder="+91 98480 12345"
                    placeholderTextColor="#8E8B99"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <Text style={[styles.inputLabel, { marginTop: 14 }]}>REGISTERED STREET ADDRESS *</Text>
              <TextInput
                style={[styles.textInput, { height: 60, textAlignVertical: 'top' }]}
                value={addressLine}
                onChangeText={setAddressLine}
                placeholder="Shop No. 4, Ground Floor, Sri Nilayam, Main Road"
                placeholderTextColor="#8E8B99"
                multiline
              />

              <View style={styles.twoColRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>AREA / LOCALITY *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={locality}
                    onChangeText={setLocality}
                    placeholder="Siripuram Junction"
                    placeholderTextColor="#8E8B99"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>PINCODE *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={pincode}
                    onChangeText={setPincode}
                    placeholder="530003"
                    placeholderTextColor="#8E8B99"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={[styles.inputLabel, { marginTop: 14 }]}>CITY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                {ANDHRA_TELANGANA_CITIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.cityChip, city === c && styles.cityChipActive]}
                    onPress={() => setCity(c)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.cityChipText, city === c && styles.cityChipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* ================= STEP 3: IDENTITY & ADDRESS PROOF (KYC) ================= */}
        {step === 3 && (
          <View>
            <View style={styles.sectionHeaderBox}>
              <Text style={styles.sectionHeading}>Identity & Address Verification (KYC)</Text>
              <Text style={styles.sectionSubheading}>
                To maintain a safe, trusted ecosystem for wedding families, our Admin team verifies all partners via valid Govt ID.
              </Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.inputLabel}>SELECT PROOF DOCUMENT TYPE</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                {[
                  { key: 'aadhaar', label: 'Aadhaar Card' },
                  { key: 'gst', label: 'GST Certificate' },
                  { key: 'trade_license', label: 'Trade License' },
                  { key: 'pan', label: 'Business PAN' },
                ].map((doc) => (
                  <TouchableOpacity
                    key={doc.key}
                    style={[styles.docTypeChip, idProofType === doc.key && styles.docTypeChipActive]}
                    onPress={() => setIdProofType(doc.key as any)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.docTypeChipText,
                        idProofType === doc.key && styles.docTypeChipTextActive,
                      ]}
                    >
                      {doc.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { marginTop: 16 }]}>
                {idProofType.toUpperCase()} NUMBER (LAST 4 DIGITS ONLY) *
              </Text>
              <View style={styles.maskedInputRow}>
                <Text style={styles.maskedPrefix}>XXXX - XXXX - </Text>
                <TextInput
                  style={styles.maskedTextInput}
                  value={idProofLast4}
                  onChangeText={(val) => setIdProofLast4(val.replace(/\D/g, '').slice(0, 4))}
                  placeholder="4892"
                  placeholderTextColor="#8E8B99"
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
              <Text style={styles.helperText}>
                For compliance with UIDAI regulations, we only store the masked identifier.
              </Text>

              <Text style={[styles.inputLabel, { marginTop: 16 }]}>CHOOSE DOCUMENT SAMPLE / UPLOAD</Text>
              <View style={{ gap: 8, marginTop: 6 }}>
                {SAMPLE_KYC_DOCS.map((doc) => {
                  const isSelected = idProofDocUrl === doc.url;
                  return (
                    <TouchableOpacity
                      key={doc.id}
                      style={[styles.docSampleRow, isSelected && styles.docSampleRowActive]}
                      onPress={() => setIdProofDocUrl(doc.url)}
                      activeOpacity={0.8}
                    >
                      <Image source={{ uri: doc.url }} style={styles.docSampleThumb} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.docSampleTitle, isSelected && styles.docSampleTitleActive]}>
                          {doc.label}
                        </Text>
                        <Text style={styles.docSampleSub}>Tap to attach this document proof</Text>
                      </View>
                      {isSelected && (
                        <View style={styles.docSelectedBadge}>
                          <Check size={12} color="#FFFFFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.securityAuditBox}>
                <Lock size={15} color="#059669" />
                <Text style={styles.securityAuditText}>
                  Documents are encrypted and reviewed solely by authorized UtsavHub verification personnel.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ================= STEP 4: TARIFF, SPECIFICATIONS & PORTFOLIO ================= */}
        {step === 4 && (
          <View>
            <View style={styles.sectionHeaderBox}>
              <Text style={styles.sectionHeading}>Base Tariff & Portfolio Showcase</Text>
              <Text style={styles.sectionSubheading}>
                Set your baseline pricing. All published prices will carry the gold "Price Negotiable" badge.
              </Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.inputLabel}>
                BASE STARTING PRICE (₹){' '}
                {selectedCategories.includes('catering') ? 'PER PLATE' : 'BASE SETUP'} *
              </Text>
              <TextInput
                style={[styles.textInput, { fontSize: 18, fontWeight: '800' }]}
                value={baseStartingPrice}
                onChangeText={setBaseStartingPrice}
                placeholder="65000"
                placeholderTextColor="#8E8B99"
                keyboardType="numeric"
              />

              <View style={styles.negotiablePillRow}>
                <Tag size={13} color="#C5A059" />
                <Text style={styles.negotiablePillText}>
                  Marked as "Price Negotiable on Discussion" for brides & grooms
                </Text>
              </View>

              <Text style={[styles.inputLabel, { marginTop: 16 }]}>PORTFOLIO SHOWCASE PHOTOS</Text>
              <Text style={{ fontSize: 12, color: '#4A4852', marginBottom: 8 }}>
                Select showcase photos for your customer storefront:
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {(PORTFOLIO_PRESETS[selectedCategories[0]] || PORTFOLIO_PRESETS.decoration).map(
                  (photo, pIdx) => {
                    const isSelected = selectedPortfolioUrls.includes(photo.url);
                    return (
                      <TouchableOpacity
                        key={pIdx}
                        style={[styles.portfolioThumbCard, isSelected && styles.portfolioThumbCardActive]}
                        onPress={() => {
                          setSelectedPortfolioUrls((prev) =>
                            prev.includes(photo.url)
                              ? prev.filter((u) => u !== photo.url)
                              : [...prev, photo.url]
                          );
                        }}
                        activeOpacity={0.8}
                      >
                        <Image source={{ uri: photo.url }} style={styles.portfolioThumbImg} />
                        {isSelected && (
                          <View style={styles.portfolioCheckBadge}>
                            <Check size={10} color="#FFFFFF" />
                          </View>
                        )}
                        <Text style={styles.portfolioThumbLabel} numberOfLines={1}>
                          {photo.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                )}
              </View>
            </View>
          </View>
        )}

        {/* 4. BOTTOM ACTION BUTTON */}
        <View style={styles.bottomActionRow}>
          {step > 1 && (
            <TouchableOpacity
              style={styles.prevBtn}
              onPress={() => setStep((s) => s - 1)}
              activeOpacity={0.7}
            >
              <Text style={styles.prevBtnText}>Previous</Text>
            </TouchableOpacity>
          )}

          {step < 4 ? (
            <TouchableOpacity
              style={styles.nextBtn}
              onPress={handleNextStep}
              activeOpacity={0.85}
            >
              <Text style={styles.nextBtnText}>Continue</Text>
              <ArrowRight size={15} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
              onPress={handleSubmitApplication}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Sparkles size={16} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Submit to Admin for Verification</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E6E1',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 16,
    color: '#0B0B0E',
  },
  topBarSub: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11,
    color: '#8E8B99',
  },
  stepProgressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E6E1',
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F5F5F7',
    borderWidth: 1,
    borderColor: '#E8E6E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeActive: {
    backgroundColor: '#0B0B0E',
    borderColor: '#0B0B0E',
  },
  stepBadgeDone: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  stepBadgeText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 11,
    color: '#8E8B99',
  },
  stepBadgeTextActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontFamily: THEME.fonts.medium,
    fontSize: 10,
    color: '#8E8B99',
  },
  stepLabelActive: {
    fontFamily: THEME.fonts.bold,
    color: '#0B0B0E',
  },
  stepLabelDone: {
    color: '#059669',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionHeaderBox: {
    marginBottom: 8,
  },
  sectionHeading: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 18,
    color: '#0B0B0E',
    letterSpacing: -0.3,
  },
  sectionSubheading: {
    fontFamily: THEME.fonts.regular,
    fontSize: 13,
    color: '#4A4852',
    lineHeight: 18,
    marginTop: 4,
  },
  capabilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E8E6E1',
  },
  capabilityCardActive: {
    borderColor: '#C5A059',
    backgroundColor: '#FCFAF5',
  },
  capabilityIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  capabilityIconCircleActive: {
    backgroundColor: '#FAF2DF',
  },
  capabilityTitle: {
    fontFamily: THEME.fonts.bold,
    fontSize: 15,
    color: '#0B0B0E',
  },
  capabilityTitleActive: {
    color: '#8C6F34',
  },
  capabilitySub: {
    fontFamily: THEME.fonts.regular,
    fontSize: 12,
    color: '#4A4852',
    marginTop: 2,
  },
  capabilityCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#E8E6E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  capabilityCheckCircleActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FCFAF5',
    borderWidth: 1,
    borderColor: '#E8E6E1',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  infoBannerText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12,
    color: '#8C6F34',
    flex: 1,
    lineHeight: 16,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E6E1',
    marginTop: 10,
  },
  inputLabel: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 10.5,
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
    fontFamily: THEME.fonts.medium,
    fontSize: 14,
    color: '#0B0B0E',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cityChip: {
    backgroundColor: '#F5F5F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E6E1',
  },
  cityChipActive: {
    backgroundColor: '#0B0B0E',
    borderColor: '#0B0B0E',
  },
  cityChipText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12,
    color: '#4A4852',
  },
  cityChipTextActive: {
    fontFamily: THEME.fonts.bold,
    color: '#FFFFFF',
  },
  docTypeChip: {
    backgroundColor: '#F5F5F7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E6E1',
  },
  docTypeChipActive: {
    backgroundColor: '#0B0B0E',
    borderColor: '#0B0B0E',
  },
  docTypeChipText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12,
    color: '#4A4852',
  },
  docTypeChipTextActive: {
    fontFamily: THEME.fonts.bold,
    color: '#FFFFFF',
  },
  maskedInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    borderWidth: 1,
    borderColor: '#E8E6E1',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  maskedPrefix: {
    fontFamily: THEME.fonts.bold,
    fontSize: 14,
    color: '#8E8B99',
    letterSpacing: 2,
  },
  maskedTextInput: {
    flex: 1,
    paddingVertical: 10,
    fontFamily: THEME.fonts.bold,
    fontSize: 15,
    color: '#0B0B0E',
    letterSpacing: 2,
  },
  helperText: {
    fontFamily: THEME.fonts.regular,
    fontSize: 11,
    color: '#8E8B99',
    marginTop: 4,
  },
  docSampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F5F5F7',
    borderWidth: 1,
    borderColor: '#E8E6E1',
    borderRadius: 12,
    padding: 10,
  },
  docSampleRowActive: {
    backgroundColor: '#FCFAF5',
    borderColor: '#C5A059',
  },
  docSampleThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  docSampleTitle: {
    fontFamily: THEME.fonts.bold,
    fontSize: 13,
    color: '#0B0B0E',
  },
  docSampleTitleActive: {
    color: '#8C6F34',
  },
  docSampleSub: {
    fontFamily: THEME.fonts.regular,
    fontSize: 11,
    color: '#8E8B99',
    marginTop: 2,
  },
  docSelectedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityAuditBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 10,
    marginTop: 14,
  },
  securityAuditText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11.5,
    color: '#059669',
    flex: 1,
    lineHeight: 15,
  },
  negotiablePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FCFAF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E8E6E1',
  },
  negotiablePillText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11.5,
    color: '#8C6F34',
  },
  portfolioThumbCard: {
    width: '47%',
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E8E6E1',
  },
  portfolioThumbCardActive: {
    borderColor: '#C5A059',
  },
  portfolioThumbImg: {
    width: '100%',
    height: 90,
  },
  portfolioThumbLabel: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11,
    color: '#0B0B0E',
    padding: 6,
  },
  portfolioCheckBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  prevBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E6E1',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevBtnText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 14,
    color: '#4A4852',
  },
  nextBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0B0B0E',
    borderRadius: 14,
    paddingVertical: 14,
  },
  nextBtnText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 14,
  },
  submitBtnText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});

