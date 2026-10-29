import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { X, CheckCircle2, Phone, Sparkles, ShieldCheck } from 'lucide-react-native';
import { Business } from '../types';
import { createBookingInquiry } from '../lib/supabaseClient';

interface BookingModalProps {
  visible: boolean;
  business: Business;
  onClose: () => void;
  defaultDate?: string;
  defaultGuests?: number;
  estimatedTotal?: number;
}

export default function BookingModal({
  visible,
  business,
  onClose,
  defaultDate = '2026-11-20',
  defaultGuests = 300,
  estimatedTotal = 125000,
}: BookingModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [guests, setGuests] = useState(defaultGuests.toString());
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [inquiryId, setInquiryId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim() || !date.trim()) {
      setErrorMsg('Please enter your name, phone number, and event date.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await createBookingInquiry({
        business_id: business.id,
        customer_name: name,
        customer_phone: phone,
        event_date: date,
        guest_count: Number(guests) || 300,
        total_estimated_amount: estimatedTotal,
        notes: notes || undefined,
      });

      if (res.success) {
        setInquiryId(res.id);
        setIsSuccess(true);
      }
    } catch {
      setErrorMsg('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    onClose();
  };

  const handleWhatsApp = () => {
    const cleanNum = business.whatsapp_number.replace(/\D/g, '');
    const url = `whatsapp://send?phone=${cleanNum}&text=Hi%2C%20I%20just%20submitted%20booking%20hold%20(${inquiryId})%20on%20UtsavHub%20for%20${date}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://wa.me/${cleanNum}`);
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.subTitleRow}>
                <Sparkles size={12} color="#D4AF37" />
                <Text style={styles.subTitle}>DIRECT VENDOR HOLD</Text>
              </View>
              <Text style={styles.title} numberOfLines={1}>
                {business.name}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {isSuccess ? (
              <View style={styles.successBox}>
                <View style={styles.successIconCircle}>
                  <CheckCircle2 size={44} color="#059669" />
                </View>
                <Text style={styles.successTitle}>Inquiry Sent Directly!</Text>
                <Text style={styles.successSub}>
                  Reference Ticket: <Text style={{ fontWeight: '700' }}>{inquiryId}</Text>
                </Text>

                <View style={styles.detailCard}>
                  <Text style={styles.detailText}>
                    Date: <Text style={{ fontWeight: '700' }}>{date}</Text> • {guests} Guests
                  </Text>
                  <Text style={styles.detailText}>
                    Estimated Total: <Text style={{ fontWeight: '700', color: '#1E293B' }}>₹{estimatedTotal.toLocaleString('en-IN')}</Text>
                  </Text>
                </View>

                <TouchableOpacity style={styles.waConfirmBtn} onPress={handleWhatsApp}>
                  <Phone size={16} color="#FFFFFF" />
                  <Text style={styles.waConfirmText}>Message Manager on WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.doneBtn} onPress={handleClose}>
                  <Text style={styles.doneText}>Close</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.form}>
                {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

                <Text style={styles.inputLabel}>YOUR FULL NAME *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Ramesh Varma"
                  value={name}
                  onChangeText={setName}
                />

                <Text style={styles.inputLabel}>WHATSAPP NUMBER *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="+91 98480 12345"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />

                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.inputLabel}>EVENT DATE *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={date}
                      onChangeText={setDate}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>GUESTS *</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={guests}
                      onChangeText={setGuests}
                    />
                  </View>
                </View>

                <Text style={styles.inputLabel}>SPECIAL NOTES / REQUIREMENTS</Text>
                <TextInput
                  style={[styles.textInput, { height: 70, textAlignVertical: 'top' }]}
                  placeholder="Specify muhurtham timing, AC rooms or outside catering needs..."
                  multiline
                  value={notes}
                  onChangeText={setNotes}
                />

                <View style={styles.estimateBanner}>
                  <Text style={styles.estLabel}>Calculated Estimate</Text>
                  <Text style={styles.estAmount}>₹{estimatedTotal.toLocaleString('en-IN')}</Text>
                </View>

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitText}>Submit & Request Date Hold</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
  },
  subTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 2,
    flexShrink: 1,
  },
  closeBtn: {
    padding: 6,
    flexShrink: 0,
  },
  body: {
    padding: 16,
  },
  form: {
    paddingBottom: 30,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    marginTop: 10,
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14.5,
    color: '#0F172A',
  },
  row: {
    flexDirection: 'row',
  },
  estimateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
  },
  estLabel: {
    fontSize: 13.5,
    color: '#92400E',
  },
  estAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  submitBtn: {
    backgroundColor: '#D4AF37',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
    elevation: 3,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginBottom: 8,
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 40,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  successSub: {
    fontSize: 13.5,
    color: '#64748B',
    marginTop: 4,
  },
  detailCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    width: '100%',
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailText: {
    fontSize: 13.5,
    color: '#475569',
    marginBottom: 4,
  },
  waConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    width: '100%',
    paddingVertical: 13,
    borderRadius: 16,
    marginBottom: 10,
  },
  waConfirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  doneBtn: {
    paddingVertical: 10,
  },
  doneText: {
    color: '#64748B',
    fontSize: 13.5,
    fontWeight: '600',
  },
});
