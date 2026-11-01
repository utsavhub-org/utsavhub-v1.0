import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import {
  X,
  Trash2,
  Plus,
  Minus,
  Sparkles,
  Calendar,
  Users,
  DollarSign,
  MessageCircle,
  CheckCircle2,
  ShieldCheck,
  Package,
} from 'lucide-react-native';
import { useQuotationCart } from '../context/QuotationCartContext';
import { useAuth } from '../context/AuthContext';
import { createBookingInquiry } from '../lib/supabaseClient';
import { THEME } from '../theme/colors';
import { playSuccessSound, playButtonClick } from '../lib/soundManager';

interface QuotationCartModalProps {
  visible: boolean;
  onClose: () => void;
  onQuotationSuccess?: (inquiryId: string) => void;
}

export default function QuotationCartModal({
  visible,
  onClose,
  onQuotationSuccess,
}: QuotationCartModalProps) {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    totalCartAmount,
    vendorIdInCart,
    vendorNameInCart,
  } = useQuotationCart();
  const { currentUser, openAuthModal } = useAuth();

  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [eventDate, setEventDate] = useState('2026-11-20');
  const [guestCount, setGuestCount] = useState('300');
  const [targetBudget, setTargetBudget] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedInquiryId, setSubmittedInquiryId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmitQuotation = async () => {
    if (!currentUser) {
      openAuthModal();
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMsg('Please provide your name and phone number so the vendor can send the quote.');
      return;
    }

    if (items.length === 0) {
      setErrorMsg('Your quotation cart is empty. Add items or packages to proceed.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const budgetNum = targetBudget.trim() ? Number(targetBudget.replace(/\D/g, '')) : undefined;

      const res = await createBookingInquiry({
        business_id: vendorIdInCart || '11111111-1111-1111-1111-111111111111',
        customer_name: customerName,
        customer_phone: customerPhone,
        event_date: eventDate,
        guest_count: Number(guestCount) || 300,
        total_estimated_amount: totalCartAmount,
        vendor_base_amount: totalCartAmount,
        final_customer_amount: budgetNum || totalCartAmount,
        cart_items: items,
        customer_target_budget: budgetNum,
        negotiation_status: 'quotation_requested',
        status: 'pending',
        notes: `[Quotation Request for ${items.length} items] ${notes}`.trim(),
      });

      if (res.success) {
        playSuccessSound();
        setSubmittedInquiryId(res.id);
        clearCart();
        if (onQuotationSuccess) onQuotationSuccess(res.id);
      } else {
        setErrorMsg('Failed to submit quotation. Please try again.');
      }
    } catch {
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmittedInquiryId(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Top Sheet Header */}
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <Sparkles size={12} color="#C5A059" />
                <Text style={styles.badgeText}>CUSTOM QUOTATION & NEGOTIATION</Text>
              </View>
              <Text style={styles.sheetTitle} numberOfLines={1}>
                {vendorNameInCart || 'Vendor Offerings Cart'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#0B0B0E" />
            </TouchableOpacity>
          </View>

          {/* Success Screen */}
          {submittedInquiryId ? (
            <View style={styles.successContainer}>
              <View style={styles.successIconCircle}>
                <CheckCircle2 size={48} color="#059669" />
              </View>
              <Text style={styles.successHeading}>Quotation Sent to Vendor!</Text>
              <Text style={styles.successSub}>
                Your requested items and initial price offer have been sent to{' '}
                <Text style={{ fontWeight: '700', color: '#0B0B0E' }}>{vendorNameInCart}</Text>.
              </Text>

              <View style={styles.ticketCard}>
                <Text style={styles.ticketLabel}>QUOTATION TICKET NUMBER</Text>
                <Text style={styles.ticketId}>{submittedInquiryId}</Text>
                <Text style={styles.ticketSub}>
                  The vendor will review your specifications. You will receive quotation updates,
                  counter-offers, or acceptance in your <Text style={{ fontWeight: '700' }}>My Bookings</Text> screen.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.doneBtn}
                onPress={handleClose}
                activeOpacity={0.85}
              >
                <Text style={styles.doneBtnText}>View in My Bookings</Text>
              </TouchableOpacity>
            </View>
          ) : items.length === 0 ? (
            /* Empty State */
            <View style={styles.emptyContainer}>
              <Package size={44} color="#C5A059" />
              <Text style={styles.emptyTitle}>Your Quotation Cart is Empty</Text>
              <Text style={styles.emptySub}>
                Add mandapam sets, stage works, royal catering feasts, photo plans, or utility rentals
                (chairs, tents, coolers) to request a customized price quotation.
              </Text>
              <TouchableOpacity style={styles.browseBtn} onPress={handleClose} activeOpacity={0.85}>
                <Text style={styles.browseBtnText}>Browse Offerings</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Main Cart & Quotation Form */
            <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
              {/* Items List */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionLabel}>SELECTED ITEMS & UTILITIES ({items.length})</Text>
                <TouchableOpacity onPress={clearCart} activeOpacity={0.7}>
                  <Text style={styles.clearCartText}>Clear All</Text>
                </TouchableOpacity>
              </View>

              {items.map((item) => (
                <View key={item.id} style={styles.itemRowCard}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.itemCatBadge}>
                      <Text style={styles.itemCatBadgeText}>
                        {item.categoryType?.toUpperCase().replace(/_/g, ' ') || 'OFFERING'}
                      </Text>
                    </View>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    {item.specsSummary ? (
                      <Text style={styles.itemSpecs}>{item.specsSummary}</Text>
                    ) : null}
                    <Text style={styles.itemPrice}>
                      ₹{Number(item.unitPrice || 0).toLocaleString('en-IN')}{' '}
                      <Text style={styles.itemUnit}>/ {item.unitLabel || 'item'}</Text>
                    </Text>
                  </View>

                  {/* Quantity & Delete Controls */}
                  <View style={styles.qtyContainer}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateQuantity(item.id, item.quantity - 1)}
                      activeOpacity={0.7}
                    >
                      <Minus size={13} color="#0B0B0E" />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateQuantity(item.id, item.quantity + 1)}
                      activeOpacity={0.7}
                    >
                      <Plus size={13} color="#0B0B0E" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => removeItem(item.id)}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={15} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* Total Calculation */}
              <View style={styles.totalBox}>
                <Text style={styles.totalBoxLabel}>Estimated Quotation Value</Text>
                <Text style={styles.totalBoxValue}>
                  ₹{totalCartAmount.toLocaleString('en-IN')}
                </Text>
              </View>

              {/* Event & Negotiation Inputs */}
              <Text style={[styles.sectionLabel, { marginTop: 18 }]}>EVENT & NEGOTIATION DETAILS</Text>

              {/* Name & Phone */}
              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Your Name</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="e.g. Sravan Varma"
                    placeholderTextColor="#8E8B99"
                    value={customerName}
                    onChangeText={setCustomerName}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Mobile Number</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="10-digit phone"
                    placeholderTextColor="#8E8B99"
                    keyboardType="phone-pad"
                    value={customerPhone}
                    onChangeText={setCustomerPhone}
                  />
                </View>
              </View>

              {/* Date & Guests */}
              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Muhurtham Date</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#8E8B99"
                    value={eventDate}
                    onChangeText={setEventDate}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Guest Count</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="e.g. 500"
                    placeholderTextColor="#8E8B99"
                    keyboardType="numeric"
                    value={guestCount}
                    onChangeText={setGuestCount}
                  />
                </View>
              </View>

              {/* Target Budget / Negotiation Offer */}
              <View style={styles.budgetOfferCard}>
                <View style={styles.budgetOfferTop}>
                  <Sparkles size={16} color="#C5A059" />
                  <Text style={styles.budgetOfferHeading}>Your Target Budget / Price Offer (Optional)</Text>
                </View>
                <Text style={styles.budgetOfferSub}>
                  You can propose an initial price offer. The vendor can accept or send a counter-offer.
                </Text>
                <View style={styles.budgetInputWrap}>
                  <Text style={styles.rupeeSign}>₹</Text>
                  <TextInput
                    style={styles.budgetInputField}
                    placeholder={`e.g. ${Math.round(totalCartAmount * 0.9).toLocaleString('en-IN')}`}
                    placeholderTextColor="#8E8B99"
                    keyboardType="numeric"
                    value={targetBudget}
                    onChangeText={setTargetBudget}
                  />
                </View>
              </View>

              {/* Custom Requirements / Notes */}
              <View style={{ marginTop: 12 }}>
                <Text style={styles.inputLabel}>Special Requirements / Venue Notes</Text>
                <TextInput
                  style={[styles.inputField, styles.textArea]}
                  placeholder="e.g. Need shamiana setup on open lawn; extra 4 mist coolers for afternoon lunch..."
                  placeholderTextColor="#8E8B99"
                  multiline
                  numberOfLines={3}
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>

              {errorMsg ? (
                <Text style={styles.errorText}>{errorMsg}</Text>
              ) : null}

              {/* Action Button */}
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmitQuotation}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Sparkles size={17} color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>Ask Vendor for Quotation</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '40%',
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  badgeText: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 10,
    color: '#8A723D',
    letterSpacing: 0.8,
  },
  sheetTitle: {
    fontFamily: THEME.fonts.bold,
    fontSize: 18,
    color: '#0B0B0E',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionLabel: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 11,
    color: '#6B7280',
    letterSpacing: 0.8,
  },
  clearCartText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 12,
    color: '#EF4444',
  },
  itemRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  itemCatBadge: {
    backgroundColor: '#FEF9EE',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 3,
  },
  itemCatBadgeText: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 9,
    color: '#8A723D',
  },
  itemTitle: {
    fontFamily: THEME.fonts.bold,
    fontSize: 14,
    color: '#0B0B0E',
    marginBottom: 2,
  },
  itemSpecs: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  itemPrice: {
    fontFamily: THEME.fonts.bold,
    fontSize: 13,
    color: '#0B0B0E',
  },
  itemUnit: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11,
    color: '#8E8B99',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 10,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 13,
    color: '#0B0B0E',
    minWidth: 18,
    textAlign: 'center',
  },
  deleteBtn: {
    padding: 6,
    marginLeft: 4,
  },
  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0B0B0E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 8,
  },
  totalBoxLabel: {
    fontFamily: THEME.fonts.medium,
    fontSize: 13,
    color: '#E5E7EB',
  },
  totalBoxValue: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 18,
    color: '#D4AF37',
  },
  formRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  inputLabel: {
    fontFamily: THEME.fonts.bold,
    fontSize: 11.5,
    color: '#374151',
    marginBottom: 4,
  },
  inputField: {
    height: 42,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontFamily: THEME.fonts.medium,
    fontSize: 13,
    color: '#0B0B0E',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  budgetOfferCard: {
    backgroundColor: '#FFFDF9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8DEC8',
    padding: 12,
    marginTop: 12,
  },
  budgetOfferTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  budgetOfferHeading: {
    fontFamily: THEME.fonts.bold,
    fontSize: 13,
    color: '#8A723D',
  },
  budgetOfferSub: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 8,
  },
  budgetInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#C5A059',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
  },
  rupeeSign: {
    fontFamily: THEME.fonts.bold,
    fontSize: 16,
    color: '#8A723D',
    marginRight: 6,
  },
  budgetInputField: {
    flex: 1,
    height: 40,
    fontFamily: THEME.fonts.bold,
    fontSize: 14,
    color: '#0B0B0E',
  },
  errorText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12,
    color: '#EF4444',
    marginTop: 8,
    textAlign: 'center',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0B0B0E',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 16,
    marginBottom: 20,
  },
  submitBtnText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontFamily: THEME.fonts.bold,
    fontSize: 16,
    color: '#0B0B0E',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySub: {
    fontFamily: THEME.fonts.medium,
    fontSize: 12.5,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  browseBtn: {
    backgroundColor: '#0B0B0E',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  browseBtnText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  successContainer: {
    padding: 24,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successHeading: {
    fontFamily: THEME.fonts.bold,
    fontSize: 19,
    color: '#0B0B0E',
    marginBottom: 6,
  },
  successSub: {
    fontFamily: THEME.fonts.medium,
    fontSize: 13,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  ticketCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  ticketLabel: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 10,
    color: '#6B7280',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  ticketId: {
    fontFamily: THEME.fonts.extraBold,
    fontSize: 20,
    color: '#C5A059',
    marginBottom: 6,
  },
  ticketSub: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11.5,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 17,
  },
  doneBtn: {
    backgroundColor: '#0B0B0E',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  doneBtnText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});

