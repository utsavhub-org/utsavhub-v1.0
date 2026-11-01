import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Building,
  Flower2,
  Utensils,
  Camera,
  Music,
  MapPin,
  Phone,
  MessageCircle,
  Users,
  Eye,
  RefreshCw,
  LogOut,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Clock,
  Layers,
  Check,
  X,
  AlertCircle,
} from 'lucide-react-native';
import { THEME } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import {
  getPendingVendorApplications,
  verifyAndApprovePartner,
  rejectVendorApplication,
  getFilteredBusinesses,
} from '../lib/supabaseClient';
import { Business, BusinessCategory } from '../types';
import { playButtonClick, playActionSuccess } from '../lib/soundManager';

interface AdminDashboardScreenProps {
  onSwitchToCustomer: () => void;
  onLogout: () => void;
  onPreviewBusiness?: (businessId: string) => void;
}

export default function AdminDashboardScreen({
  onSwitchToCustomer,
  onLogout,
  onPreviewBusiness,
}: AdminDashboardScreenProps) {
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'pending' | 'active_stores'>('pending');
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const [pendingApplications, setPendingApplications] = useState<any[]>([]);
  const [activeBusinesses, setActiveBusinesses] = useState<Business[]>([]);
  const [stats, setStats] = useState({
    pendingCount: 0,
    activeCount: 0,
    totalCount: 0,
  });

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [pending, bizRes] = await Promise.all([
        getPendingVendorApplications(),
        getFilteredBusinesses({}),
      ]);

      const liveBiz = bizRes.businesses || [];
      setPendingApplications(pending);
      setActiveBusinesses(liveBiz);
      setStats({
        pendingCount: pending.length,
        activeCount: liveBiz.length,
        totalCount: pending.length + liveBiz.length,
      });
    } catch (err) {
      console.warn('Admin dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Handle Verify & Approve
  const handleApprove = async (app: any) => {
    playButtonClick();
    setActionInProgress(app.userId || app.id);
    try {
      const success = await verifyAndApprovePartner(
        app.id,
        app.userId,
        app.businessId,
        {
          businessName: app.businessName,
          category: app.category,
          city: app.city,
          locality: app.locality,
          phone: app.phone,
          startingPrice: app.startingPrice,
          contactName: app.applicantName,
        }
      );

      if (success) {
        playActionSuccess();
        Alert.alert(
          'Partner Verified!',
          `"${app.businessName}" is now an approved partner. Their store is LIVE in Explore & Home, and they can now access their Vendor Dashboard.`
        );
        // Refresh list
        await loadDashboardData();
      } else {
        Alert.alert('Notice', 'Could not complete verification. Please check network connection.');
      }
    } catch (e) {
      console.warn('Approve error:', e);
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle Reject
  const handleReject = async (app: any) => {
    playButtonClick();
    Alert.alert(
      'Decline Application',
      `Are you sure you want to decline the partner application for "${app.businessName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setActionInProgress(app.userId || app.id);
            try {
              await rejectVendorApplication(app.userId, app.businessId);
              await loadDashboardData();
            } finally {
              setActionInProgress(null);
            }
          },
        },
      ]
    );
  };

  const handleCallApplicant = (phone: string) => {
    const clean = phone.replace(/[^0-9]/g, '');
    Linking.openURL(`tel:${clean}`);
  };

  const handleWhatsAppApplicant = (phone: string, bizName: string) => {
    const clean = phone.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(
      `Hello, this is UtsavHub Partner Verification Desk regarding your application for "${bizName}".`
    );
    Linking.openURL(`whatsapp://send?phone=${clean}&text=${msg}`).catch(() => {
      Linking.openURL(`https://wa.me/${clean}?text=${msg}`);
    });
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* 1. ADMIN HEADER BAR */}
      <View style={styles.topHeader}>
        <View style={styles.topHeaderLeft}>
          <View style={styles.adminBadge}>
            <ShieldCheck size={16} color="#0B0B0E" />
            <Text style={styles.adminBadgeText}>SUPERADMIN CONSOLE</Text>
          </View>
          <Text style={styles.headerTitle}>UtsavHub Platform Registry</Text>
          <Text style={styles.headerSub}>Verify vendor applications & manage live database</Text>
        </View>

        <View style={styles.topHeaderRight}>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={loadDashboardData}
            activeOpacity={0.7}
          >
            <RefreshCw size={14} color="#C5A059" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchModeBtn}
            onPress={onSwitchToCustomer}
            activeOpacity={0.8}
          >
            <Eye size={13} color="#FFFFFF" />
            <Text style={styles.switchModeBtnText}>Customer View</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. STATS KPI CARDS */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>PENDING AUDIT</Text>
          <Text style={[styles.kpiValue, { color: '#D97706' }]}>{stats.pendingCount}</Text>
          <Text style={styles.kpiSub}>Awaiting verification</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>ACTIVE STORES</Text>
          <Text style={[styles.kpiValue, { color: '#059669' }]}>{stats.activeCount}</Text>
          <Text style={styles.kpiSub}>Live on Explore & Home</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>DATABASE TOTAL</Text>
          <Text style={styles.kpiValue}>{stats.totalCount}</Text>
          <Text style={styles.kpiSub}>Registered entities</Text>
        </View>
      </View>

      {/* 3. TABS */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'pending' && styles.tabBtnActive]}
          onPress={() => setActiveTab('pending')}
          activeOpacity={0.8}
        >
          <Clock size={14} color={activeTab === 'pending' ? '#C5A059' : '#8E8B99'} />
          <Text style={[styles.tabBtnText, activeTab === 'pending' && styles.tabBtnTextActive]}>
            Pending Applications ({stats.pendingCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'active_stores' && styles.tabBtnActive]}
          onPress={() => setActiveTab('active_stores')}
          activeOpacity={0.8}
        >
          <Building size={14} color={activeTab === 'active_stores' ? '#C5A059' : '#8E8B99'} />
          <Text style={[styles.tabBtnText, activeTab === 'active_stores' && styles.tabBtnTextActive]}>
            Active Stores ({stats.activeCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4. CONTENT AREA */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C5A059" />
          <Text style={styles.loadingText}>Syncing Server Records...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* TAB 1: PENDING APPLICATIONS */}
          {activeTab === 'pending' && (
            <View style={{ paddingHorizontal: 16 }}>
              {pendingApplications.length === 0 ? (
                <View style={styles.emptyCard}>
                  <CheckCircle2 size={44} color="#059669" />
                  <Text style={styles.emptyTitle}>All Applications Reviewed</Text>
                  <Text style={styles.emptySub}>
                    There are no unverified vendor applications pending audit right now. New customer registration requests will appear here instantly.
                  </Text>
                </View>
              ) : (
                pendingApplications.map((app) => {
                  const isProcessing = actionInProgress === (app.userId || app.id);
                  const cat: BusinessCategory = app.category || 'decoration';

                  return (
                    <View key={app.id || app.userId} style={styles.appCard}>
                      {/* Card Header */}
                      <View style={styles.appCardHeader}>
                        <View style={styles.appIconWrap}>
                          {cat === 'venue' && <Building size={18} color="#0284C7" />}
                          {cat === 'decoration' && <Flower2 size={18} color="#C5A059" />}
                          {cat === 'catering' && <Utensils size={18} color="#059669" />}
                          {cat === 'photography' && <Camera size={18} color="#7C3AED" />}
                          {cat === 'dj_sound' && <Music size={18} color="#D97706" />}
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.appBizName}>{app.businessName}</Text>
                            <View style={styles.pendingPill}>
                              <Text style={styles.pendingPillText}>AWAITING VERIFICATION</Text>
                            </View>
                          </View>
                          <Text style={styles.appCategoryText}>
                            {cat === 'venue'
                              ? 'Function Hall / Kalyana Mandapam'
                              : cat === 'decoration'
                              ? 'Mandapams & Event Decor'
                              : cat === 'catering'
                              ? 'Royal Feasts & Catering'
                              : cat === 'photography'
                              ? '4K Photography & Cinema'
                              : 'Concert DJ & Sound FX'}
                          </Text>
                        </View>
                      </View>

                      {/* Info Matrix */}
                      <View style={styles.appMetaGrid}>
                        <View style={styles.metaRow}>
                          <Users size={13} color="#8E8B99" />
                          <Text style={styles.metaLabel}>Applicant:</Text>
                          <Text style={styles.metaValue}>{app.applicantName || 'Partner Applicant'}</Text>
                        </View>

                        <View style={styles.metaRow}>
                          <Phone size={13} color="#8E8B99" />
                          <Text style={styles.metaLabel}>Mobile Phone:</Text>
                          <Text style={styles.metaValue}>{app.phone || 'N/A'}</Text>
                        </View>

                        <View style={styles.metaRow}>
                          <MapPin size={13} color="#8E8B99" />
                          <Text style={styles.metaLabel}>Location:</Text>
                          <Text style={styles.metaValue}>
                            {app.locality ? `${app.locality}, ` : ''}{app.city || 'Visakhapatnam'}
                          </Text>
                        </View>

                        <View style={styles.metaRow}>
                          <ShieldCheck size={13} color="#10B981" />
                          <Text style={styles.metaLabel}>KYC Verification:</Text>
                          <Text style={[styles.metaValue, { color: '#059669', fontWeight: '700' }]}>
                            {app.idProofType ? app.idProofType.toUpperCase() : 'AADHAAR'} Masked (XXXX-{app.idProofLast4 || '4892'})
                          </Text>
                        </View>

                        <View style={styles.metaRow}>
                          <Sparkles size={13} color="#C5A059" />
                          <Text style={styles.metaLabel}>Starting Tariff:</Text>
                          <Text style={[styles.metaValue, { fontWeight: '800', color: '#0B0B0E' }]}>
                            ₹{Number(app.startingPrice || 50000).toLocaleString('en-IN')}{' '}
                            {cat === 'catering' ? '/ plate' : '/ setup'}
                          </Text>
                        </View>
                      </View>

                      {/* Contact Fast-Actions */}
                      <View style={styles.contactActionsRow}>
                        <TouchableOpacity
                          style={styles.contactMiniBtn}
                          onPress={() => handleCallApplicant(app.phone)}
                          activeOpacity={0.7}
                        >
                          <Phone size={12} color="#0B0B0E" />
                          <Text style={styles.contactMiniBtnText}>Call Applicant</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.contactMiniBtnWhatsApp}
                          onPress={() => handleWhatsAppApplicant(app.phone, app.businessName)}
                          activeOpacity={0.7}
                        >
                          <MessageCircle size={12} color="#059669" />
                          <Text style={styles.contactMiniBtnWhatsAppText}>WhatsApp Chat</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Admin Decision Actions */}
                      <View style={styles.decisionRow}>
                        <TouchableOpacity
                          style={[styles.declineBtn, isProcessing && { opacity: 0.5 }]}
                          onPress={() => handleReject(app)}
                          disabled={isProcessing}
                          activeOpacity={0.75}
                        >
                          <X size={14} color="#EF4444" />
                          <Text style={styles.declineBtnText}>Decline</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.approveBtn, isProcessing && { opacity: 0.7 }]}
                          onPress={() => handleApprove(app)}
                          disabled={isProcessing}
                          activeOpacity={0.85}
                        >
                          {isProcessing ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <>
                              <CheckCircle2 size={15} color="#FFFFFF" />
                              <Text style={styles.approveBtnText}>✓ Verify & Approve Partner</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* TAB 2: ACTIVE LIVE STORES IN DATABASE */}
          {activeTab === 'active_stores' && (
            <View style={{ paddingHorizontal: 16 }}>
              <View style={styles.activeStoresNotice}>
                <Building size={16} color="#059669" />
                <Text style={styles.activeStoresNoticeText}>
                  All {activeBusinesses.length} verified businesses below are live in the database and visible to customers on Explore & Home.
                </Text>
              </View>

              {activeBusinesses.map((biz) => (
                <View key={biz.id} style={styles.liveBizCard}>
                  <View style={styles.liveBizTop}>
                    <View style={styles.liveBizIconWrap}>
                      {biz.category === 'venue' && <Building size={16} color="#0284C7" />}
                      {biz.category === 'decoration' && <Flower2 size={16} color="#C5A059" />}
                      {biz.category === 'catering' && <Utensils size={16} color="#059669" />}
                      {biz.category === 'photography' && <Camera size={16} color="#7C3AED" />}
                      {biz.category === 'dj_sound' && <Music size={16} color="#D97706" />}
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.liveBizName}>{biz.name}</Text>
                        <View style={styles.verifiedLivePill}>
                          <Text style={styles.verifiedLivePillText}>LIVE STORE</Text>
                        </View>
                      </View>
                      <Text style={styles.liveBizSub}>
                        {biz.area_locality}, {biz.city} •{' '}
                        <Text style={{ fontWeight: '700' }}>
                          ₹{Number(biz.starting_price || 50000).toLocaleString('en-IN')}
                        </Text>
                      </Text>
                    </View>

                    {onPreviewBusiness && (
                      <TouchableOpacity
                        style={styles.previewStoreBtn}
                        onPress={() => onPreviewBusiness(biz.id)}
                        activeOpacity={0.8}
                      >
                        <Eye size={12} color="#0B0B0E" />
                        <Text style={styles.previewStoreBtnText}>Inspect</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Log Out Bar */}
      <View style={styles.logoutBar}>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
          <LogOut size={14} color="#EF4444" />
          <Text style={styles.logoutBtnText}>Log Out Admin Session</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  topHeaderLeft: {
    flex: 1,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FDE047',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0B0B0E',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0B0B0E',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
  },
  topHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  switchModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0B0B0E',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  switchModeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0B0B0E',
    marginVertical: 2,
  },
  kpiSub: {
    fontSize: 10,
    color: '#94A3B8',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 10,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtnActive: {
    backgroundColor: '#0B0B0E',
    borderColor: '#0B0B0E',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  scrollArea: {
    flex: 1,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0B0B0E',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  appCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  appCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  appIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appBizName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0B0B0E',
  },
  appCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  pendingPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pendingPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400E',
  },
  appMetaGrid: {
    paddingVertical: 10,
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaLabel: {
    fontSize: 12,
    color: '#64748B',
    width: 120,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  contactActionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  contactMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  contactMiniBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0B0B0E',
  },
  contactMiniBtnWhatsApp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  contactMiniBtnWhatsAppText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  decisionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  declineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  declineBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#059669',
    shadowColor: '#059669',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 2,
  },
  approveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  activeStoresNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  activeStoresNoticeText: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '600',
    flex: 1,
  },
  liveBizCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  liveBizTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveBizIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveBizName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0B0B0E',
  },
  liveBizSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  verifiedLivePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedLivePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#166534',
  },
  previewStoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  previewStoreBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0B0B0E',
  },
  logoutBar: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoutBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
});
