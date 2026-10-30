import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Modal,
  Linking,
  ActivityIndicator,
} from 'react-native';
import {
  Building,
  Video,
  Image as ImageIcon,
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
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import {
  getBusinessById,
  getPriceRequestsForBusiness,
  submitPriceUpdateRequest,
  approvePriceRequest,
  rejectPriceRequest,
  addVendorReel,
  addVendorPhoto,
  removeVendorPhoto,
  addVendorPdf,
  getVendorInquiries,
  updateInquiryStatus,
  DEFAULT_ADMIN_PERCENTAGE,
} from '../lib/supabaseClient';
import {
  Business,
  PriceUpdateRequest,
  VendorDocPdf,
  MediaReel,
  BookingInquiry,
} from '../types';
import ReelModal from '../components/ReelModal';
import { THEME } from '../theme/colors';

interface VendorDashboardScreenProps {
  onSwitchToCustomer: () => void;
  onPreviewPublicListing: (businessId: string) => void;
}

export default function VendorDashboardScreen({
  onSwitchToCustomer,
  onPreviewPublicListing,
}: VendorDashboardScreenProps) {
  const { currentUser, logout, openAuthModal } = useAuth();
  const businessId = currentUser?.businessId || '11111111-1111-1111-1111-111111111111';

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pricing' | 'media' | 'inquiries'>('pricing');

  // Pricing State
  const [priceRequests, setPriceRequests] = useState<PriceUpdateRequest[]>([]);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedItemType, setSelectedItemType] = useState<'venue_rental' | 'catering_plate' | 'decor_package'>('venue_rental');
  const [proposedBasePrice, setProposedBasePrice] = useState<string>('190000');
  const [adminPercentage, setAdminPercentage] = useState<number>(DEFAULT_ADMIN_PERCENTAGE);
  const [priceNotes, setPriceNotes] = useState<string>('Peak Muhurtham season pricing update.');
  const [submittingPrice, setSubmittingPrice] = useState(false);

  // Media State
  const [activeReelModal, setActiveReelModal] = useState<MediaReel | null>(null);
  const [showReelModal, setShowReelModal] = useState(false);
  const [newReelTitle, setNewReelTitle] = useState('New Hall Lighting & Dining Walkthrough');
  const [newReelUrl, setNewReelUrl] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
  const [newReelThumb, setNewReelThumb] = useState('https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=80');

  // Photo Upload State
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80');

  // PDF Upload State
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [newPdfTitle, setNewPdfTitle] = useState('Royal Andhra Wedding Catering Menu 2026.pdf');
  const [newPdfType, setNewPdfType] = useState<'menu' | 'lookbook' | 'brochure'>('menu');
  const [newPdfUrl, setNewPdfUrl] = useState('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');

  // Inquiries State
  const [inquiries, setInquiries] = useState<BookingInquiry[]>([]);

  const loadData = async () => {
    setLoading(true);
    const biz = await getBusinessById(businessId);
    setBusiness(biz);

    const requests = await getPriceRequestsForBusiness(businessId);
    setPriceRequests(requests);

    const inqs = await getVendorInquiries(businessId);
    setInquiries(inqs);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [businessId]);

  // Calculations for Price with Admin Percentage
  const numBasePrice = parseFloat(proposedBasePrice) || 0;
  const adminMarkup = Math.round(numBasePrice * (adminPercentage / 100));
  const finalPriceToCustomer = numBasePrice + adminMarkup;

  const handleSubmitPrice = async () => {
    if (!numBasePrice || numBasePrice <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid base price.');
      return;
    }

    setSubmittingPrice(true);
    const currentPrice =
      selectedItemType === 'venue_rental'
        ? business?.venue_details?.base_rental_price || 175000
        : selectedItemType === 'catering_plate'
        ? business?.catering_packages?.[0]?.price_per_plate || 450
        : business?.decor_catalogues?.[0]?.base_price || 140000;

    const itemName =
      selectedItemType === 'venue_rental'
        ? 'Main AC Kalyana Mandapam (Full Day)'
        : selectedItemType === 'catering_plate'
        ? 'Per Plate Wedding Buffet Package'
        : 'Grand Floral Mandapam Decor';

    await submitPriceUpdateRequest({
      businessId,
      businessName: business?.name || 'Convention Hall Partner',
      itemType: selectedItemType,
      itemName,
      currentPrice,
      proposedBasePrice: numBasePrice,
      adminPercentage,
      notes: priceNotes,
    });

    await loadData();
    setSubmittingPrice(false);
    setShowPriceModal(false);
    Alert.alert(
      'Price Submitted for Approval',
      `Your base quote of ₹${numBasePrice.toLocaleString('en-IN')} with ${adminPercentage}% platform fee (Customer Total: ₹${finalPriceToCustomer.toLocaleString('en-IN')}) has been sent for admin review.`
    );
  };

  const handleApprovePrice = async (reqId: string) => {
    await approvePriceRequest(reqId);
    await loadData();
    Alert.alert('Approved & Published', 'The new price with admin markup is now active on the customer listing!');
  };

  const handleRejectPrice = async (reqId: string) => {
    await rejectPriceRequest(reqId, 'Price exceeds current seasonal benchmark');
    await loadData();
  };

  // Media Actions
  const handleAddReel = async () => {
    if (!newReelTitle.trim()) return;
    await addVendorReel(businessId, {
      title: newReelTitle,
      videoUrl: newReelUrl,
      thumbnailUrl: newReelThumb,
      durationSeconds: 26,
    });
    await loadData();
    setShowReelModal(false);
    Alert.alert('Reel Uploaded', 'Your video reel has been added to your listing.');
  };

  const handleAddPhoto = async () => {
    if (!newPhotoUrl.trim()) return;
    await addVendorPhoto(businessId, newPhotoUrl);
    await loadData();
    setShowPhotoModal(false);
    Alert.alert('Photo Added', 'New venue photo has been published to your gallery.');
  };

  const handleRemovePhoto = async (url: string) => {
    await removeVendorPhoto(businessId, url);
    await loadData();
  };

  const handleAddPdf = async () => {
    if (!newPdfTitle.trim()) return;
    await addVendorPdf(businessId, {
      title: newPdfTitle,
      pdfUrl: newPdfUrl,
      type: newPdfType,
      fileSizeKb: 680,
    });
    await loadData();
    setShowPdfModal(false);
    Alert.alert('PDF Document Uploaded', 'The PDF is now available for customers to view and download.');
  };

  // Inquiries Actions
  const handleUpdateInquiry = async (inqId: string, status: 'approved' | 'rejected') => {
    await updateInquiryStatus(inqId, status);
    await loadData();
    Alert.alert(
      status === 'approved' ? 'Booking Hold Approved' : 'Booking Hold Declined',
      `Inquiry ${inqId} status updated to ${status}.`
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loadingText}>Loading Vendor Partner Portal...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Vendor Status Header */}
      <View style={styles.topHeader}>
        <View style={styles.bizInfoRow}>
          <View style={styles.bizAvatar}>
            <Image
              source={require('../../assets/1.png')}
              style={styles.bizAvatarImg}
              resizeMode="contain"
            />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <View style={styles.partnerBadge}>
                <Sparkles size={11} color={THEME.colors.goldDark} />
                <Text style={styles.partnerBadgeText}>VERIFIED VENDOR PARTNER</Text>
              </View>
            </View>
            <Text style={styles.bizName} numberOfLines={1}>
              {business?.name || 'Grand Swarna Palace'}
            </Text>
            <Text style={styles.bizSub}>
              {business?.area_locality}, {business?.city}
            </Text>
          </View>
        </View>

        {/* Quick Action Toolbar */}
        <View style={styles.quickActionsBar}>
          <TouchableOpacity
            style={styles.previewBtn}
            onPress={() => onPreviewPublicListing(businessId)}
            activeOpacity={0.7}
          >
            <ExternalLink size={14} color="#0F172A" />
            <Text style={styles.previewBtnText}>Customer View</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchModeBtn}
            onPress={onSwitchToCustomer}
            activeOpacity={0.7}
          >
            <UserCheck size={14} color="#059669" />
            <Text style={styles.switchModeBtnText}>Switch to Bride/Groom</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={openAuthModal}
            activeOpacity={0.7}
          >
            <LogOut size={14} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Segmented Navigation Tabs */}
      <View style={styles.tabNavContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'pricing' && styles.tabBtnActive]}
          onPress={() => setActiveTab('pricing')}
          activeOpacity={0.7}
        >
          <DollarSign size={16} color={activeTab === 'pricing' ? '#0F172A' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'pricing' && styles.tabTextActive]}>
            Prices & Admin Fee
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'media' && styles.tabBtnActive]}
          onPress={() => setActiveTab('media')}
          activeOpacity={0.7}
        >
          <Video size={16} color={activeTab === 'media' ? '#0F172A' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'media' && styles.tabTextActive]}>
            Reels, Pics & PDFs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'inquiries' && styles.tabBtnActive]}
          onPress={() => setActiveTab('inquiries')}
          activeOpacity={0.7}
        >
          <Calendar size={16} color={activeTab === 'inquiries' ? '#0F172A' : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'inquiries' && styles.tabTextActive]}>
            Holds ({inquiries.filter((i) => i.status === 'pending').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Tab Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ================================================================= */}
        {/* TAB 1: PRICING & ADMIN PERCENTAGE APPROVAL WORKFLOW               */}
        {/* ================================================================= */}
        {activeTab === 'pricing' && (
          <View>
            {/* Live Pricing Overview Card */}
            <View style={styles.pricingSummaryCard}>
              <View style={styles.pricingCardHeader}>
                <View>
                  <Text style={styles.summaryTitle}>Live Published Pricing</Text>
                  <Text style={styles.summarySub}>
                    Includes platform fee & Andhra date-hold guarantee
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.requestPriceBtn}
                  onPress={() => setShowPriceModal(true)}
                  activeOpacity={0.8}
                >
                  <Plus size={16} color="#0F172A" />
                  <Text style={styles.requestPriceBtnText}>Update Price</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.priceItemsGrid}>
                <View style={styles.priceItemBox}>
                  <Text style={styles.priceItemLabel}>Full Day Hall Rental</Text>
                  <Text style={styles.priceItemValue}>
                    ₹{(business?.venue_details?.base_rental_price || 175000).toLocaleString('en-IN')}
                  </Text>
                  <View style={styles.activeTag}>
                    <CheckCircle2 size={11} color="#059669" />
                    <Text style={styles.activeTagText}>Approved & Live</Text>
                  </View>
                </View>

                {business?.catering_packages?.[0] && (
                  <View style={styles.priceItemBox}>
                    <Text style={styles.priceItemLabel}>Catering Per Plate</Text>
                    <Text style={styles.priceItemValue}>
                      ₹{business.catering_packages[0].price_per_plate.toLocaleString('en-IN')}
                    </Text>
                    <View style={styles.activeTag}>
                      <CheckCircle2 size={11} color="#059669" />
                      <Text style={styles.activeTagText}>Approved & Live</Text>
                    </View>
                  </View>
                )}

                {business?.decor_catalogues?.[0] && (
                  <View style={styles.priceItemBox}>
                    <Text style={styles.priceItemLabel}>Mandapam Decor Base</Text>
                    <Text style={styles.priceItemValue}>
                      ₹{business.decor_catalogues[0].base_price.toLocaleString('en-IN')}
                    </Text>
                    <View style={styles.activeTag}>
                      <CheckCircle2 size={11} color="#059669" />
                      <Text style={styles.activeTagText}>Approved & Live</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Commission Explanation */}
              <View style={styles.commissionBanner}>
                <Percent size={18} color="#D4AF37" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.commissionTitle}>
                    Standard Admin Markup: {DEFAULT_ADMIN_PERCENTAGE}%
                  </Text>
                  <Text style={styles.commissionText}>
                    When you update your base quote, the platform adds {DEFAULT_ADMIN_PERCENTAGE}% admin fee for concierge services and payment handling. Changes are sent for instant admin approval.
                  </Text>
                </View>
              </View>
            </View>

            {/* Price Update History & Approval Queue */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>PRICE APPROVAL QUEUE</Text>
              <TouchableOpacity onPress={loadData} style={styles.refreshIconBtn}>
                <RefreshCw size={14} color="#64748B" />
              </TouchableOpacity>
            </View>

            {priceRequests.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No price updates in queue.</Text>
              </View>
            ) : (
              priceRequests.map((req) => (
                <View key={req.id} style={styles.requestCard}>
                  <View style={styles.requestCardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reqItemName}>{req.item_name}</Text>
                      <Text style={styles.reqId}>Ref ID: {req.id} • {new Date(req.submitted_at).toLocaleDateString()}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        req.status === 'approved'
                          ? styles.statusBadgeApproved
                          : req.status === 'rejected'
                          ? styles.statusBadgeRejected
                          : styles.statusBadgePending,
                      ]}
                    >
                      {req.status === 'approved' ? (
                        <>
                          <CheckCircle2 size={12} color="#059669" />
                          <Text style={styles.statusTextApproved}>Approved</Text>
                        </>
                      ) : req.status === 'rejected' ? (
                        <>
                          <X size={12} color="#DC2626" />
                          <Text style={styles.statusTextRejected}>Rejected</Text>
                        </>
                      ) : (
                        <>
                          <Clock size={12} color="#D97706" />
                          <Text style={styles.statusTextPending}>Pending Admin</Text>
                        </>
                      )}
                    </View>
                  </View>

                  {/* Math Breakdown Card */}
                  <View style={styles.breakdownBox}>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Vendor Base Quote:</Text>
                      <Text style={styles.breakdownVal}>₹{req.proposed_base_price.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>+ Admin Platform Markup ({req.admin_percentage}%):</Text>
                      <Text style={[styles.breakdownVal, { color: '#D4AF37' }]}>
                        +₹{req.admin_markup_amount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.breakdownDivider} />
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownTotalLabel}>Final Customer Listing Price:</Text>
                      <Text style={styles.breakdownTotalVal}>
                        ₹{req.final_customer_price.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  {req.notes && (
                    <Text style={styles.reqNotes}>Note: "{req.notes}"</Text>
                  )}

                  {/* Admin Test Simulation Actions */}
                  {req.status === 'pending_approval' && (
                    <View style={styles.adminActionRow}>
                      <Text style={styles.adminTestLabel}>Admin Testing Action:</Text>
                      <TouchableOpacity
                        style={styles.adminApproveBtn}
                        onPress={() => handleApprovePrice(req.id)}
                        activeOpacity={0.8}
                      >
                        <Check size={14} color="#FFFFFF" />
                        <Text style={styles.adminApproveText}>Approve & Publish Now</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.adminRejectBtn}
                        onPress={() => handleRejectPrice(req.id)}
                        activeOpacity={0.8}
                      >
                        <X size={14} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* ================================================================= */}
        {/* TAB 2: MEDIA MANAGEMENT (REELS, PICS & PDFS)                      */}
        {/* ================================================================= */}
        {activeTab === 'media' && (
          <View>
            {/* Section A: Video Reels */}
            <View style={styles.mediaSectionHeader}>
              <View>
                <Text style={styles.sectionHeading}>VIDEO REELS ({business?.media_reels?.length || 0})</Text>
                <Text style={styles.sectionSub}>Short video walkthroughs shown to wedding planners</Text>
              </View>
              <TouchableOpacity
                style={styles.addMediaSmallBtn}
                onPress={() => setShowReelModal(true)}
                activeOpacity={0.7}
              >
                <Plus size={14} color="#0F172A" />
                <Text style={styles.addMediaSmallText}>Add Reel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reelsScroll}>
              {(business?.media_reels || []).map((reel) => (
                <TouchableOpacity
                  key={reel.id}
                  style={styles.reelCard}
                  onPress={() => setActiveReelModal(reel)}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: reel.thumbnail_url }} style={styles.reelThumb} />
                  <View style={styles.reelPlayOverlay}>
                    <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
                  </View>
                  <View style={styles.reelDurationBadge}>
                    <Text style={styles.reelDurationText}>{reel.duration_seconds}s</Text>
                  </View>
                  <Text style={styles.reelCardTitle} numberOfLines={2}>
                    {reel.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Section B: Photo Gallery */}
            <View style={[styles.mediaSectionHeader, { marginTop: 24 }]}>
              <View>
                <Text style={styles.sectionHeading}>PHOTO GALLERY ({business?.gallery_images?.length || 0})</Text>
                <Text style={styles.sectionSub}>High-resolution hall, stage, & dining photographs</Text>
              </View>
              <TouchableOpacity
                style={styles.addMediaSmallBtn}
                onPress={() => setShowPhotoModal(true)}
                activeOpacity={0.7}
              >
                <Plus size={14} color="#0F172A" />
                <Text style={styles.addMediaSmallText}>Add Photo</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.photoGrid}>
              {(business?.gallery_images || []).map((imgUrl, idx) => (
                <View key={idx} style={styles.photoBox}>
                  <Image source={{ uri: imgUrl }} style={styles.photoImg} />
                  <TouchableOpacity
                    style={styles.deletePhotoBtn}
                    onPress={() => handleRemovePhoto(imgUrl)}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={13} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Section C: PDF Documents */}
            <View style={[styles.mediaSectionHeader, { marginTop: 24 }]}>
              <View>
                <Text style={styles.sectionHeading}>PDF BROCHURES & MENUS</Text>
                <Text style={styles.sectionSub}>Catering package menus & decor catalogues</Text>
              </View>
              <TouchableOpacity
                style={styles.addMediaSmallBtn}
                onPress={() => setShowPdfModal(true)}
                activeOpacity={0.7}
              >
                <Plus size={14} color="#0F172A" />
                <Text style={styles.addMediaSmallText}>Upload PDF</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.pdfList}>
              {/* Default existing sample PDF */}
              <View style={styles.pdfCard}>
                <View style={styles.pdfIconCircle}>
                  <FileText size={20} color="#DC2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pdfTitle}>Grand Swarna Hall Dimensions & Layout.pdf</Text>
                  <Text style={styles.pdfSub}>Floor Plan & Seating Capacity Chart • 1.2 MB</Text>
                </View>
                <TouchableOpacity
                  style={styles.pdfDownloadBtn}
                  onPress={() => Linking.openURL('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf')}
                  activeOpacity={0.7}
                >
                  <ExternalLink size={16} color="#0F172A" />
                </TouchableOpacity>
              </View>

              {(business?.vendor_pdfs || []).map((pdf) => (
                <View key={pdf.id} style={styles.pdfCard}>
                  <View style={styles.pdfIconCircle}>
                    <FileText size={20} color="#DC2626" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pdfTitle}>{pdf.title}</Text>
                    <Text style={styles.pdfSub}>
                      {pdf.type.toUpperCase()} • {pdf.file_size_kb} KB • Uploaded {new Date(pdf.uploaded_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.pdfDownloadBtn}
                    onPress={() => Linking.openURL(pdf.pdf_url)}
                    activeOpacity={0.7}
                  >
                    <ExternalLink size={16} color="#0F172A" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ================================================================= */}
        {/* TAB 3: CUSTOMER INQUIRIES & DATE HOLDS                            */}
        {/* ================================================================= */}
        {activeTab === 'inquiries' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>INCOMING DATE-HOLD INQUIRIES</Text>
              <TouchableOpacity onPress={loadData} style={styles.refreshIconBtn}>
                <RefreshCw size={14} color="#64748B" />
              </TouchableOpacity>
            </View>

            {inquiries.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No inquiries received yet.</Text>
              </View>
            ) : (
              inquiries.map((inq) => (
                <View key={inq.id} style={styles.inquiryCard}>
                  <View style={styles.inquiryTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inqCustName}>{inq.customer_name}</Text>
                      <View style={styles.inqPhoneRow}>
                        <Phone size={13} color="#059669" />
                        <Text style={styles.inqPhone}>{inq.customer_phone}</Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        inq.status === 'approved'
                          ? styles.statusBadgeApproved
                          : inq.status === 'rejected'
                          ? styles.statusBadgeRejected
                          : styles.statusBadgePending,
                      ]}
                    >
                      <Text
                        style={
                          inq.status === 'approved'
                            ? styles.statusTextApproved
                            : inq.status === 'rejected'
                            ? styles.statusTextRejected
                            : styles.statusTextPending
                        }
                      >
                        {inq.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.inqDetailsGrid}>
                    <View style={styles.inqDetailCol}>
                      <Text style={styles.inqDetailLabel}>Requested Date</Text>
                      <Text style={styles.inqDetailVal}>{inq.event_date}</Text>
                    </View>
                    <View style={styles.inqDetailCol}>
                      <Text style={styles.inqDetailLabel}>Guests</Text>
                      <Text style={styles.inqDetailVal}>{inq.guest_count} persons</Text>
                    </View>
                    <View style={styles.inqDetailCol}>
                      <Text style={styles.inqDetailLabel}>Estimated Total</Text>
                      <Text style={styles.inqDetailVal}>₹{inq.total_estimated_amount.toLocaleString('en-IN')}</Text>
                    </View>
                  </View>

                  {inq.notes && (
                    <Text style={styles.inqNotes}>Note: {inq.notes}</Text>
                  )}

                  {inq.status === 'pending' && (
                    <View style={styles.inquiryActionButtons}>
                      <TouchableOpacity
                        style={styles.approveHoldBtn}
                        onPress={() => handleUpdateInquiry(inq.id!, 'approved')}
                        activeOpacity={0.8}
                      >
                        <Check size={16} color="#FFFFFF" />
                        <Text style={styles.approveHoldText}>Accept Date Hold</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.rejectHoldBtn}
                        onPress={() => handleUpdateInquiry(inq.id!, 'rejected')}
                        activeOpacity={0.8}
                      >
                        <X size={16} color="#DC2626" />
                        <Text style={styles.rejectHoldText}>Decline</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* =================================================================== */}
      {/* MODAL: SUBMIT NEW PRICE WITH ADMIN PERCENTAGE                       */}
      {/* =================================================================== */}
      <Modal visible={showPriceModal} transparent animationType="slide" onRequestClose={() => setShowPriceModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Price & Calculate Admin Fee</Text>
              <TouchableOpacity onPress={() => setShowPriceModal(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
              {/* Item Type Picker */}
              <Text style={styles.inputLabel}>Select Pricing Item</Text>
              <View style={styles.typeSelectorRow}>
                <TouchableOpacity
                  style={[styles.typeBtn, selectedItemType === 'venue_rental' && styles.typeBtnActive]}
                  onPress={() => setSelectedItemType('venue_rental')}
                >
                  <Text style={[styles.typeBtnText, selectedItemType === 'venue_rental' && styles.typeBtnTextActive]}>
                    Full Hall
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeBtn, selectedItemType === 'catering_plate' && styles.typeBtnActive]}
                  onPress={() => setSelectedItemType('catering_plate')}
                >
                  <Text style={[styles.typeBtnText, selectedItemType === 'catering_plate' && styles.typeBtnTextActive]}>
                    Catering Plate
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeBtn, selectedItemType === 'decor_package' && styles.typeBtnActive]}
                  onPress={() => setSelectedItemType('decor_package')}
                >
                  <Text style={[styles.typeBtnText, selectedItemType === 'decor_package' && styles.typeBtnTextActive]}>
                    Decor Set
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Base Price Input */}
              <Text style={styles.inputLabel}>Vendor Base Quote (₹)</Text>
              <View style={styles.modalInputWrapper}>
                <DollarSign size={18} color="#94A3B8" />
                <TextInput
                  style={styles.modalTextInput}
                  value={proposedBasePrice}
                  onChangeText={setProposedBasePrice}
                  keyboardType="numeric"
                  placeholder="e.g. 190000"
                />
              </View>

              {/* Admin Percentage Markup Box */}
              <View style={styles.adminPercentCard}>
                <View style={styles.adminPercentHeader}>
                  <Percent size={18} color="#D4AF37" />
                  <Text style={styles.adminPercentTitle}>Admin Platform Commission</Text>
                  <View style={styles.percentBadge}>
                    <Text style={styles.percentBadgeText}>{adminPercentage}%</Text>
                  </View>
                </View>

                {/* Calculation breakdown */}
                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Your Base Price:</Text>
                  <Text style={styles.calcVal}>₹{numBasePrice.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>+ Admin Markup ({adminPercentage}%):</Text>
                  <Text style={[styles.calcVal, { color: '#D4AF37' }]}>+₹{adminMarkup.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.calcDivider} />
                <View style={styles.calcRow}>
                  <Text style={styles.calcTotalLabel}>Customer Final Display Price:</Text>
                  <Text style={styles.calcTotalVal}>₹{finalPriceToCustomer.toLocaleString('en-IN')}</Text>
                </View>
              </View>

              {/* Reason / Notes */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Notes for Admin Review</Text>
              <View style={[styles.modalInputWrapper, { height: 70, alignItems: 'flex-start', paddingTop: 8 }]}>
                <TextInput
                  style={[styles.modalTextInput, { height: '100%', textAlignVertical: 'top' }]}
                  value={priceNotes}
                  onChangeText={setPriceNotes}
                  placeholder="Reason for change..."
                  multiline
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSubmitPrice}
                disabled={submittingPrice}
                activeOpacity={0.8}
              >
                {submittingPrice ? (
                  <ActivityIndicator size="small" color="#0F172A" />
                ) : (
                  <>
                    <Text style={styles.modalSubmitBtnText}>Submit for Admin Approval</Text>
                    <ArrowRight size={18} color="#0F172A" />
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* =================================================================== */}
      {/* MODAL: ADD REEL                                                     */}
      {/* =================================================================== */}
      <Modal visible={showReelModal} transparent animationType="slide" onRequestClose={() => setShowReelModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload New Video Reel</Text>
              <TouchableOpacity onPress={() => setShowReelModal(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 20 }}>
              <Text style={styles.inputLabel}>Reel Title</Text>
              <View style={styles.modalInputWrapper}>
                <TextInput
                  style={styles.modalTextInput}
                  value={newReelTitle}
                  onChangeText={setNewReelTitle}
                  placeholder="e.g. Stage Decoration Walkthrough"
                />
              </View>

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Video URL (MP4 / HLS Stream)</Text>
              <View style={styles.modalInputWrapper}>
                <TextInput
                  style={styles.modalTextInput}
                  value={newReelUrl}
                  onChangeText={setNewReelUrl}
                  placeholder="https://..."
                />
              </View>

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Thumbnail Cover URL</Text>
              <View style={styles.modalInputWrapper}>
                <TextInput
                  style={styles.modalTextInput}
                  value={newReelThumb}
                  onChangeText={setNewReelThumb}
                  placeholder="https://images.unsplash..."
                />
              </View>

              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleAddReel} activeOpacity={0.8}>
                <Text style={styles.modalSubmitBtnText}>Publish Video Reel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* =================================================================== */}
      {/* MODAL: ADD PHOTO                                                    */}
      {/* =================================================================== */}
      <Modal visible={showPhotoModal} transparent animationType="slide" onRequestClose={() => setShowPhotoModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Gallery Photo</Text>
              <TouchableOpacity onPress={() => setShowPhotoModal(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 20 }}>
              <Text style={styles.inputLabel}>Photo Image URL</Text>
              <View style={styles.modalInputWrapper}>
                <TextInput
                  style={styles.modalTextInput}
                  value={newPhotoUrl}
                  onChangeText={setNewPhotoUrl}
                  placeholder="https://images.unsplash.com/..."
                />
              </View>

              {newPhotoUrl ? (
                <View style={{ marginVertical: 12, alignItems: 'center' }}>
                  <Image source={{ uri: newPhotoUrl }} style={{ width: '100%', height: 160, borderRadius: 12 }} />
                </View>
              ) : null}

              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleAddPhoto} activeOpacity={0.8}>
                <Text style={styles.modalSubmitBtnText}>Add Photo to Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* =================================================================== */}
      {/* MODAL: ADD PDF                                                      */}
      {/* =================================================================== */}
      <Modal visible={showPdfModal} transparent animationType="slide" onRequestClose={() => setShowPdfModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload PDF Document</Text>
              <TouchableOpacity onPress={() => setShowPdfModal(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 20 }}>
              <Text style={styles.inputLabel}>Document Title</Text>
              <View style={styles.modalInputWrapper}>
                <TextInput
                  style={styles.modalTextInput}
                  value={newPdfTitle}
                  onChangeText={setNewPdfTitle}
                  placeholder="e.g. Wedding Menu Package 2026.pdf"
                />
              </View>

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Document Type</Text>
              <View style={styles.typeSelectorRow}>
                <TouchableOpacity
                  style={[styles.typeBtn, newPdfType === 'menu' && styles.typeBtnActive]}
                  onPress={() => setNewPdfType('menu')}
                >
                  <Text style={[styles.typeBtnText, newPdfType === 'menu' && styles.typeBtnTextActive]}>Menu Card</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeBtn, newPdfType === 'lookbook' && styles.typeBtnActive]}
                  onPress={() => setNewPdfType('lookbook')}
                >
                  <Text style={[styles.typeBtnText, newPdfType === 'lookbook' && styles.typeBtnTextActive]}>Lookbook</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeBtn, newPdfType === 'brochure' && styles.typeBtnActive]}
                  onPress={() => setNewPdfType('brochure')}
                >
                  <Text style={[styles.typeBtnText, newPdfType === 'brochure' && styles.typeBtnTextActive]}>Brochure</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>PDF File Link</Text>
              <View style={styles.modalInputWrapper}>
                <TextInput
                  style={styles.modalTextInput}
                  value={newPdfUrl}
                  onChangeText={setNewPdfUrl}
                  placeholder="https://..."
                />
              </View>

              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleAddPdf} activeOpacity={0.8}>
                <Text style={styles.modalSubmitBtnText}>Upload & Attach PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reel Player Modal */}
      {activeReelModal && (
        <ReelModal
          reel={activeReelModal}
          visible={!!activeReelModal}
          onClose={() => setActiveReelModal(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF8F5',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  topHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  bizInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bizAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: THEME.colors.gold,
    overflow: 'hidden',
    backgroundColor: '#0B0B0F',
  },
  bizAvatarImg: {
    width: '100%',
    height: '100%',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  partnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  partnerBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
    letterSpacing: 0.5,
  },
  bizName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  bizSub: {
    fontSize: 12,
    color: '#64748B',
  },
  quickActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  previewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  switchModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  switchModeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  logoutBtn: {
    padding: 7,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    marginLeft: 'auto',
  },
  tabNavContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: THEME.colors.textPrimary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: THEME.colors.textPrimary,
    fontWeight: '900',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  pricingSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  pricingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  summarySub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  requestPriceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.accentDark,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  requestPriceBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  priceItemsGrid: {
    gap: 10,
  },
  priceItemBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    borderRadius: 12,
  },
  priceItemLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  priceItemValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  activeTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  commissionBanner: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 12,
    borderRadius: 14,
    marginTop: 14,
  },
  commissionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  commissionText: {
    fontSize: 11.5,
    color: '#78350F',
    marginTop: 2,
    lineHeight: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  sectionSub: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  refreshIconBtn: {
    padding: 6,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  requestCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reqItemName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  reqId: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeApproved: {
    backgroundColor: '#ECFDF5',
  },
  statusBadgeRejected: {
    backgroundColor: '#FEE2E2',
  },
  statusTextPending: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  statusTextApproved: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
  },
  statusTextRejected: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B91C1C',
  },
  breakdownBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '600',
  },
  breakdownVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  breakdownTotalLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  breakdownTotalVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#059669',
  },
  reqNotes: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 8,
  },
  adminActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    padding: 10,
    borderRadius: 12,
    marginTop: 12,
  },
  adminTestLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7E22CE',
  },
  adminApproveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  adminApproveText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  adminRejectBtn: {
    padding: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  mediaSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addMediaSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addMediaSmallText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  reelsScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  reelCard: {
    width: 140,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reelThumb: {
    width: '100%',
    height: 180,
    backgroundColor: '#1E293B',
  },
  reelPlayOverlay: {
    position: 'absolute',
    top: 75,
    left: 55,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelDurationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reelDurationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  reelCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    padding: 8,
    lineHeight: 16,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoBox: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  deletePhotoBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(220, 38, 38, 0.85)',
    padding: 5,
    borderRadius: 6,
  },
  pdfList: {
    gap: 10,
  },
  pdfCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pdfIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  pdfSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  pdfDownloadBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  inquiryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  inquiryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  inqCustName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  inqPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  inqPhone: {
    fontSize: 12.5,
    color: '#059669',
    fontWeight: '700',
  },
  inqDetailsGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'space-between',
  },
  inqDetailCol: {
    flex: 1,
  },
  inqDetailLabel: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
  },
  inqDetailVal: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  inqNotes: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 10,
  },
  inquiryActionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  approveHoldBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 10,
  },
  approveHoldText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  rejectHoldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  rejectHoldText: {
    color: '#DC2626',
    fontWeight: '800',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  typeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  typeBtnActive: {
    backgroundColor: '#0F172A',
  },
  typeBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
  },
  modalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 12,
  },
  modalTextInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  adminPercentCard: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    marginVertical: 6,
    gap: 8,
  },
  adminPercentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  adminPercentTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  percentBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  percentBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#B45309',
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcLabel: {
    fontSize: 12.5,
    color: '#64748B',
  },
  calcVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  calcDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  calcTotalLabel: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#0F172A',
  },
  calcTotalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#059669',
  },
  modalSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D4AF37',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 14,
  },
  modalSubmitBtnText: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#0F172A',
  },
});

