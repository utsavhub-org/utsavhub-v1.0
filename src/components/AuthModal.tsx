import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  User,
  Building,
  Sparkles,
  Phone,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  UtensilsCrossed,
  KeyRound,
  AlertCircle,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { DEMO_PROFILES, supabase } from '../lib/supabaseClient';
import { THEME } from '../theme/colors';

export default function AuthModal() {
  const { isAuthModalVisible, closeAuthModal, loginAs, loginWithPhone, navigateTo } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');

  // Auth Channels: Phone OTP vs Email/Password
  const [authChannel, setAuthChannel] = useState<'phone' | 'email'>('phone');

  // Phone OTP State
  const [phoneNumber, setPhoneNumber] = useState('9848012345');
  const [otpCode, setOtpCode] = useState('');
  const [phoneStep, setPhoneStep] = useState<'input' | 'verify'>('input');
  const [resendTimer, setResendTimer] = useState(30);

  // Email State
  const [emailMode, setEmailMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isAuthModalVisible) return null;

  const formatPhoneWithCountryCode = (p: string) => {
    const digits = p.replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length === 12) {
      return `+${digits}`;
    }
    return `+91${digits.slice(-10)}`;
  };

  // 1. Send OTP to Phone
  const handleSendOtp = async () => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    const fullPhone = formatPhoneWithCountryCode(phoneNumber);

    if (supabase) {
      try {
        const { error } = await supabase.auth.signInWithOtp({
          phone: fullPhone,
        });

        if (error) {
          // If SMS gateway not configured on Supabase project, inform gracefully
          console.warn('Supabase signInWithOtp notice:', error.message);
          setSuccessMessage(`Demo OTP active. Use code: 123456`);
        } else {
          setSuccessMessage(`Verification OTP sent to ${fullPhone}`);
        }
      } catch (e: any) {
        setSuccessMessage(`Demo OTP active. Use code: 123456`);
      }
    } else {
      setSuccessMessage(`Demo OTP active. Use code: 123456`);
    }

    setIsLoading(false);
    setPhoneStep('verify');
    setResendTimer(30);
  };

  // 2. Verify Phone OTP
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.trim().length < 4) {
      setErrorMessage('Please enter the 6-digit OTP code.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    const fullPhone = formatPhoneWithCountryCode(phoneNumber);

    let authSuccess = false;

    if (supabase) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          phone: fullPhone,
          token: otpCode.trim(),
          type: 'sms',
        });

        if (!error && data?.user) {
          authSuccess = true;
        } else if (otpCode === '123456') {
          // Dev test passcode fallback
          authSuccess = true;
        } else if (error) {
          setErrorMessage(error.message);
        }
      } catch (err: any) {
        if (otpCode === '123456') authSuccess = true;
        else setErrorMessage(err.message || 'OTP verification failed.');
      }
    } else if (otpCode === '123456') {
      authSuccess = true;
    }

    setIsLoading(false);

    if (authSuccess) {
      await loginWithPhone(fullPhone, undefined, selectedRole);
      navigateTo('profile', 'profile');
      closeAuthModal();
    }
  };

  // 3. Email & Password Sign In / Sign Up
  const handleEmailAuth = async () => {
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    if (supabase) {
      try {
        if (emailMode === 'signup') {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                role: selectedRole,
                full_name: fullName || email.split('@')[0],
              },
            },
          });
          if (error) {
            setErrorMessage(error.message);
            setIsLoading(false);
            return;
          }
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) {
            setErrorMessage(error.message);
            setIsLoading(false);
            return;
          }
        }
      } catch (err: any) {
        console.warn('Supabase auth notice:', err);
      }
    }

    setIsLoading(false);
    await loginAs(selectedRole, {
      name: fullName || (selectedRole === 'customer' ? 'Telugu Family' : 'Vendor Partner'),
      email,
      phone: '+91 98480 12345',
    });
    navigateTo('profile', 'profile');
    closeAuthModal();
  };

  return (
    <Modal
      visible={isAuthModalVisible}
      animationType="slide"
      transparent
      onRequestClose={closeAuthModal}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={closeAuthModal}
        />

        <View style={styles.sheetContainer}>
          {/* Header Bar */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.logoBadge}>
                <Image
                  source={require('../../assets/1.png')}
                  style={styles.logoImg}
                  resizeMode="contain"
                />
              </View>
              <View>
                <Text style={styles.sheetTitle}>
                  Utsav<Text style={{ color: THEME.colors.gold }}>Hub</Text>
                </Text>
                <Text style={styles.sheetSubTitle}>VERIFIED WEDDING CONCIERGE</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={closeAuthModal}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Role Switcher Tabs */}
            <View style={styles.roleTabsContainer}>
              <TouchableOpacity
                style={[
                  styles.roleTab,
                  selectedRole === 'customer' && styles.roleTabActive,
                ]}
                onPress={() => setSelectedRole('customer')}
                activeOpacity={0.8}
              >
                <User
                  size={16}
                  color={selectedRole === 'customer' ? '#FFFFFF' : '#64748B'}
                />
                <Text
                  style={[
                    styles.roleTabText,
                    selectedRole === 'customer' && styles.roleTabTextActive,
                  ]}
                >
                  Customer Login
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleTab,
                  selectedRole === 'vendor' && styles.roleTabActive,
                ]}
                onPress={() => setSelectedRole('vendor')}
                activeOpacity={0.8}
              >
                <Building
                  size={16}
                  color={selectedRole === 'vendor' ? '#FFFFFF' : '#64748B'}
                />
                <Text
                  style={[
                    styles.roleTabText,
                    selectedRole === 'vendor' && styles.roleTabTextActive,
                  ]}
                >
                  Vendor Partner
                </Text>
              </TouchableOpacity>
            </View>

            {/* Auth Channel Switcher: Phone OTP vs Email */}
            <View style={styles.channelRow}>
              <TouchableOpacity
                style={[styles.channelBtn, authChannel === 'phone' && styles.channelBtnActive]}
                onPress={() => {
                  setAuthChannel('phone');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                activeOpacity={0.7}
              >
                <Phone size={14} color={authChannel === 'phone' ? '#0B0B0E' : '#64748B'} />
                <Text style={[styles.channelBtnText, authChannel === 'phone' && styles.channelBtnTextActive]}>
                  Mobile Number (OTP)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.channelBtn, authChannel === 'email' && styles.channelBtnActive]}
                onPress={() => {
                  setAuthChannel('email');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                activeOpacity={0.7}
              >
                <Mail size={14} color={authChannel === 'email' ? '#0B0B0E' : '#64748B'} />
                <Text style={[styles.channelBtnText, authChannel === 'email' && styles.channelBtnTextActive]}>
                  Email & Password
                </Text>
              </TouchableOpacity>
            </View>

            {/* Feedback Alerts */}
            {errorMessage && (
              <View style={styles.errorAlert}>
                <AlertCircle size={15} color={THEME.colors.danger} />
                <Text style={styles.errorAlertText}>{errorMessage}</Text>
              </View>
            )}

            {successMessage && (
              <View style={styles.successAlert}>
                <CheckCircle2 size={15} color={THEME.colors.success} />
                <Text style={styles.successAlertText}>{successMessage}</Text>
              </View>
            )}

            {/* CHANNEL 1: Phone OTP Authentication */}
            {authChannel === 'phone' && (
              <View style={styles.formContainer}>
                {phoneStep === 'input' ? (
                  <View>
                    <Text style={styles.inputLabel}>Enter 10-Digit Mobile Number</Text>
                    <View style={styles.phoneInputWrapper}>
                      <View style={styles.flagPill}>
                        <Text style={styles.flagText}>🇮🇳 +91</Text>
                      </View>
                      <TextInput
                        style={styles.phoneInput}
                        placeholder="98480 12345"
                        placeholderTextColor="#94A3B8"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                        maxLength={10}
                      />
                    </View>
                    <Text style={styles.helperText}>
                      We will verify your phone via instant SMS OTP.
                    </Text>

                    <TouchableOpacity
                      style={styles.primaryAuthBtn}
                      onPress={handleSendOtp}
                      disabled={isLoading}
                      activeOpacity={0.85}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Text style={styles.primaryAuthBtnText}>Send Verification OTP</Text>
                          <ArrowRight size={16} color="#FFFFFF" />
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    <Text style={styles.inputLabel}>Enter 6-Digit Verification Code</Text>
                    <View style={styles.inputWrapper}>
                      <KeyRound size={18} color="#94A3B8" />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter 6-digit OTP (e.g. 123456)"
                        placeholderTextColor="#94A3B8"
                        value={otpCode}
                        onChangeText={setOtpCode}
                        keyboardType="number-pad"
                        maxLength={6}
                        autoFocus
                      />
                    </View>

                    <View style={styles.otpActionRow}>
                      <TouchableOpacity
                        onPress={() => {
                          setPhoneStep('input');
                          setOtpCode('');
                        }}
                      >
                        <Text style={styles.linkText}>Change Phone Number</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleSendOtp}
                        disabled={isLoading}
                      >
                        <Text style={[styles.linkText, { color: THEME.colors.goldDark }]}>
                          Resend Code
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={styles.primaryAuthBtn}
                      onPress={handleVerifyOtp}
                      disabled={isLoading}
                      activeOpacity={0.85}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Text style={styles.primaryAuthBtnText}>Verify & Sign In</Text>
                          <CheckCircle2 size={16} color="#FFFFFF" />
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* CHANNEL 2: Email & Password Authentication */}
            {authChannel === 'email' && (
              <View style={styles.formContainer}>
                {/* Sign In vs Sign Up Toggle */}
                <View style={styles.emailSubTabs}>
                  <TouchableOpacity
                    style={[styles.emailSubTab, emailMode === 'signin' && styles.emailSubTabActive]}
                    onPress={() => setEmailMode('signin')}
                  >
                    <Text style={[styles.emailSubTabText, emailMode === 'signin' && styles.emailSubTabTextActive]}>
                      Sign In
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.emailSubTab, emailMode === 'signup' && styles.emailSubTabActive]}
                    onPress={() => setEmailMode('signup')}
                  >
                    <Text style={[styles.emailSubTabText, emailMode === 'signup' && styles.emailSubTabTextActive]}>
                      Create Account
                    </Text>
                  </TouchableOpacity>
                </View>

                {emailMode === 'signup' && (
                  <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>
                      {selectedRole === 'customer' ? 'Bride / Groom / Family Name' : 'Business / Manager Name'}
                    </Text>
                    <View style={styles.inputWrapper}>
                      <User size={16} color="#94A3B8" />
                      <TextInput
                        style={styles.textInput}
                        placeholder={selectedRole === 'customer' ? 'Ananya & Rahul' : 'K. Narayana Rao'}
                        placeholderTextColor="#94A3B8"
                        value={fullName}
                        onChangeText={setFullName}
                      />
                    </View>
                  </View>
                )}

                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={styles.inputWrapper}>
                    <Mail size={16} color="#94A3B8" />
                    <TextInput
                      style={styles.textInput}
                      placeholder="name@example.com"
                      placeholderTextColor="#94A3B8"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <Lock size={16} color="#94A3B8" />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Minimum 6 characters"
                      placeholderTextColor="#94A3B8"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.primaryAuthBtn}
                  onPress={handleEmailAuth}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.primaryAuthBtnText}>
                        {emailMode === 'signup' ? 'Create New Account' : 'Sign In to UtsavHub'}
                      </Text>
                      <ArrowRight size={16} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Quick Demo Instant Logins */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR 1-CLICK INSTANT DEMO</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.demoButtonsContainer}>
              <TouchableOpacity
                style={[styles.demoCard, selectedRole === 'customer' && styles.demoCardHighlight]}
                onPress={() => {
                  loginAs('customer', DEMO_PROFILES.customer);
                  closeAuthModal();
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.demoIconBadge, { backgroundColor: '#FDF2F8' }]}>
                  <User size={16} color="#DB2777" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.demoTitle}>Bride & Groom Demo</Text>
                  <Text style={styles.demoSub}>Ananya & Rahul • Muhurtham Nov 2026</Text>
                </View>
                <CheckCircle2 size={16} color="#059669" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.demoCard, selectedRole === 'vendor' && styles.demoCardHighlight]}
                onPress={() => {
                  loginAs('vendor', DEMO_PROFILES.vendor);
                  closeAuthModal();
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.demoIconBadge, { backgroundColor: '#FEF3C7' }]}>
                  <Building size={16} color="#D4AF37" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.demoTitle}>Grand Swarna Palace (Venue Partner)</Text>
                  <Text style={styles.demoSub}>Upload reels, pics, PDF & update hall prices</Text>
                </View>
                <CheckCircle2 size={16} color="#059669" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(11, 11, 14, 0.7)',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#09090B',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImg: {
    width: '90%',
    height: '90%',
  },
  sheetTitle: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 18,
    color: THEME.colors.textPrimary,
    letterSpacing: -0.3,
  },
  sheetSubTitle: {
    fontFamily: THEME.fonts.bold,
    fontSize: 8.5,
    color: THEME.colors.textMuted,
    letterSpacing: 1.1,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  roleTabsContainer: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
  },
  roleTabActive: {
    backgroundColor: THEME.colors.accentDark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  roleTabText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 13,
    color: THEME.colors.textSecondary,
  },
  roleTabTextActive: {
    fontFamily: THEME.fonts.bold,
    color: '#FFFFFF',
  },
  channelRow: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  channelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
  },
  channelBtnActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  channelBtnText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12,
    color: THEME.colors.textMuted,
  },
  channelBtnTextActive: {
    fontFamily: THEME.fonts.bold,
    color: THEME.colors.textPrimary,
  },
  formContainer: {
    marginBottom: 14,
  },
  inputLabel: {
    fontFamily: THEME.fonts.bold,
    fontSize: 12,
    color: THEME.colors.textPrimary,
    marginBottom: 6,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 14,
    overflow: 'hidden',
    height: 48,
  },
  flagPill: {
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 12,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: THEME.colors.border,
  },
  flagText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 13,
    color: THEME.colors.textPrimary,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    fontFamily: THEME.fonts.bold,
    fontSize: 15,
    color: THEME.colors.textPrimary,
    letterSpacing: 0.5,
  },
  helperText: {
    fontFamily: THEME.fonts.regular,
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 6,
    marginBottom: 14,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  textInput: {
    flex: 1,
    fontFamily: THEME.fonts.medium,
    fontSize: 14,
    color: THEME.colors.textPrimary,
  },
  otpActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  linkText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  primaryAuthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: THEME.colors.accentDark,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 6,
  },
  primaryAuthBtnText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  emailSubTabs: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  emailSubTab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: THEME.colors.surface,
  },
  emailSubTabActive: {
    backgroundColor: THEME.colors.accentDark,
  },
  emailSubTabText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  emailSubTabTextActive: {
    color: '#FFFFFF',
  },
  formGroup: {
    marginBottom: 12,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: THEME.colors.dangerBg,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.2)',
    padding: 10,
    borderRadius: 12,
    marginBottom: 14,
  },
  errorAlertText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12,
    color: THEME.colors.danger,
    flex: 1,
  },
  successAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: THEME.colors.successBg,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)',
    padding: 10,
    borderRadius: 12,
    marginBottom: 14,
  },
  successAlertText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12,
    color: THEME.colors.success,
    flex: 1,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: THEME.colors.border,
  },
  dividerText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 10,
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
  },
  demoButtonsContainer: {
    gap: 8,
  },
  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: 12,
    borderRadius: 14,
  },
  demoCardHighlight: {
    borderColor: THEME.colors.gold,
    backgroundColor: '#FAF8F3',
  },
  demoIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoTitle: {
    fontFamily: THEME.fonts.bold,
    fontSize: 13,
    color: THEME.colors.textPrimary,
  },
  demoSub: {
    fontFamily: THEME.fonts.regular,
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 1,
  },
});
