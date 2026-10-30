import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Business,
  BookingInquiry,
  UserProfile,
  VendorDocPdf,
  PriceUpdateRequest,
  MediaReel,
} from '../types';
import { MOCK_BUSINESSES } from './mockData';

// Standard Supabase credentials (reads from Expo env or runtime config)
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://dckmxhqpextqzoreogva.supabase.co';

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_aYk2pFVQSJi0cvD8E8tdbQ_wPGq6qTm';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co'
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const DEFAULT_ADMIN_PERCENTAGE = 10; // 10% platform fee added to vendor base price

// Seed initial inquiries for realistic testing
const localInquiries: BookingInquiry[] = [
  {
    id: 'INQ-948102',
    business_id: '11111111-1111-1111-1111-111111111111',
    customer_name: 'Ananya & Rahul',
    customer_phone: '+91 98480 12345',
    event_date: '2026-11-20',
    guest_count: 500,
    total_estimated_amount: 192500,
    status: 'pending',
    notes: 'Auspicious Muhurtham evening ceremony. Require 6 AC groom/bride rooms & generator backup.',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'INQ-832104',
    business_id: '11111111-1111-1111-1111-111111111111',
    customer_name: 'K. Sridhar Raju (Bride’s Father)',
    customer_phone: '+91 98661 22334',
    event_date: '2026-12-08',
    guest_count: 750,
    total_estimated_amount: 215000,
    status: 'approved',
    notes: 'Holding date for Reception. Requested outside catering setup in dining hall.',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

// Seed initial price update requests
const localPriceRequests: PriceUpdateRequest[] = [
  {
    id: 'REQ-101',
    business_id: '11111111-1111-1111-1111-111111111111',
    business_name: 'Grand Swarna Palace Convention Hall',
    item_type: 'venue_rental',
    item_name: 'Main AC Kalyana Mandapam (Full Day)',
    current_price: 175000,
    proposed_base_price: 185000,
    admin_percentage: 10,
    admin_markup_amount: 18500,
    final_customer_price: 203500,
    status: 'pending_approval',
    submitted_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    notes: 'Updated for peak auspicious wedding season 2026-2027.',
  },
];

export const DEMO_PROFILES: { customer: UserProfile; vendor: UserProfile; catererVendor: UserProfile } = {
  customer: {
    id: 'usr-cust-1',
    name: 'Ananya & Rahul',
    email: 'ananya.rahul@example.com',
    phone: '+91 98480 12345',
    role: 'customer',
    partnerName: 'Rahul',
    weddingDate: '2026-11-20',
    selectedCity: 'Visakhapatnam',
  },
  vendor: {
    id: 'usr-vend-1',
    name: 'K. Narayana Rao (General Manager)',
    email: 'manager@grandswarna.com',
    phone: '+91 98480 12345',
    role: 'vendor',
    selectedCity: 'Visakhapatnam',
    businessId: '11111111-1111-1111-1111-111111111111',
    businessName: 'Grand Swarna Palace Convention Hall',
  },
  catererVendor: {
    id: 'usr-vend-2',
    name: 'Chef Rambabu',
    email: 'rambabu@annapurnacatering.com',
    phone: '+91 99880 11223',
    role: 'vendor',
    selectedCity: 'Visakhapatnam',
    businessId: '44444444-4444-4444-4444-444444444444',
    businessName: 'Annapurna Royal Caterers & Sweets',
  },
};

// ---------------------------------------------------------------------------
// USER & VENDOR PROFILE PERSISTENCE (SUPABASE + FALLBACK)
// ---------------------------------------------------------------------------

export async function syncUserProfileToSupabase(profile: UserProfile): Promise<boolean> {
  if (!supabase) return true;

  try {
    const payload = {
      id: profile.id,
      phone: profile.phone,
      full_name: profile.name,
      role: profile.role,
      city: profile.selectedCity || 'Visakhapatnam',
      area_locality: profile.area_locality || null,
      avatar_url: profile.avatar_url || null,
      wedding_date: profile.weddingDate || null,
      partner_name: profile.partnerName || null,
      business_name: profile.businessName || null,
      business_category: profile.businessCategory || null,
      is_profile_complete: profile.isProfileComplete ?? true,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('user_profiles')
      .upsert(payload, { onConflict: 'phone' });

    if (error) {
      console.warn('Notice syncing user_profiles table (table may need creation in SQL editor):', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('Sync profile error:', err?.message || err);
    return false;
  }
}

export async function fetchUserProfileFromSupabase(phoneOrId: string): Promise<UserProfile | null> {
  if (!supabase) return null;

  try {
    const isPhone = phoneOrId.startsWith('+') || /^\d{10,12}$/.test(phoneOrId);
    let query = supabase.from('user_profiles').select('*');
    
    if (isPhone) {
      query = query.eq('phone', phoneOrId);
    } else {
      query = query.eq('id', phoneOrId);
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      phone: data.phone,
      name: data.full_name || 'Guest User',
      email: `${data.role}-${data.phone.slice(-4)}@utsavhub.com`,
      role: (data.role as any) || 'customer',
      selectedCity: data.city || 'Visakhapatnam',
      area_locality: data.area_locality || '',
      avatar_url: data.avatar_url || '',
      weddingDate: data.wedding_date || undefined,
      partnerName: data.partner_name || undefined,
      businessName: data.business_name || undefined,
      businessCategory: data.business_category || undefined,
      isProfileComplete: Boolean(data.is_profile_complete),
    };
  } catch (err) {
    return null;
  }
}

export interface FilterParams {
  location?: string;
  date?: string;
  guests?: number;
  category?: string;
  acOnly?: boolean;
  outsideCatering?: boolean;
  maxBudget?: number;
}

export async function getFilteredBusinesses(filters: FilterParams): Promise<{
  businesses: Business[];
  blockedCount: number;
}> {
  let results: Business[] = [];
  let blocked = 0;

  // 1. Fetch live records from Supabase
  if (supabase) {
    try {
      const { data: dbData, error } = await supabase
        .from('businesses')
        .select(`
          *,
          vendors (*),
          venue_details (*),
          decor_items (*),
          catering_packages (*),
          media_reels (*)
        `);

      if (!error && dbData && dbData.length > 0) {
        const mapped: Business[] = dbData.map((b: any) => {
          const v = Array.isArray(b.vendors) ? b.vendors[0] : b.vendors;
          const vd = Array.isArray(b.venue_details) ? b.venue_details[0] : b.venue_details;
          return {
            id: b.id,
            name: b.name,
            category: b.category,
            city: v?.city || 'Visakhapatnam',
            area_locality: v?.area_locality || 'Madhurawada',
            latitude: 17.72,
            longitude: 83.31,
            cover_image_url: b.cover_image_url,
            gallery_images: b.gallery_images || [],
            rating_avg: v?.rating_avg ? Number(v.rating_avg) : 4.8,
            review_count: v?.review_count || 12,
            phone: v?.phone || '+91 98480 12345',
            whatsapp_number: v?.whatsapp_number || '+91 98480 12345',
            is_verified: v?.is_verified ?? true,
            venue_details: vd
              ? {
                  id: vd.id,
                  business_id: vd.business_id,
                  is_ac: vd.is_ac,
                  seating_capacity: vd.seating_capacity,
                  floating_capacity: vd.floating_capacity,
                  ac_rooms_count: vd.ac_rooms_count,
                  parking_capacity_cars: vd.parking_cars || 100,
                  outside_catering_allowed: vd.outside_catering_allowed,
                  base_rental_price: Number(vd.base_rental_price),
                  power_backup_kva: vd.power_backup_kva,
                }
              : undefined,
            decor_items: b.decor_items || [],
            catering_packages: b.catering_packages || [],
            media_reels: b.media_reels || [],
          };
        });

        // Merge with other mock business categories (e.g. Photography, Decor) if not yet added to Supabase
        const existingIds = new Set(mapped.map((m) => m.id));
        const others = MOCK_BUSINESSES.filter((m) => !existingIds.has(m.id));
        results = [...mapped, ...others];
      }
    } catch (err) {
      console.warn('Supabase fetch error, fallback to mock:', err);
    }
  }

  if (results.length === 0) {
    results = [...MOCK_BUSINESSES];
  }

  if (filters.location && filters.location.trim().length > 0) {
    const loc = filters.location.toLowerCase();
    results = results.filter(
      (b) =>
        b.city.toLowerCase().includes(loc) ||
        b.area_locality.toLowerCase().includes(loc)
    );
  }

  if (filters.category && filters.category !== 'all') {
    if (filters.category === 'wishlist') {
      results = results.filter((b) => ['venue-1', 'venue-2', 'decor-1'].includes(b.id));
    } else {
      results = results.filter((b) => b.category === filters.category);
    }
  }

  // Date-First Gatekeeper
  if (filters.date) {
    const targetDate = filters.date;
    results = results.filter((b) => {
      const isBooked = b.availability_calendar?.some(
        (slot) => slot.blocked_date === targetDate && slot.is_booked
      );
      if (isBooked) {
        blocked++;
        return false;
      }
      return true;
    });
  }

  // Capacity Gatekeeper
  if (filters.guests && filters.guests > 0) {
    const req = filters.guests;
    results = results.filter((b) => {
      if (b.category === 'venue' && b.venue_details) {
        return (
          b.venue_details.floating_capacity >= req ||
          b.venue_details.seating_capacity >= req
        );
      }
      return true;
    });
  }

  // AC Only
  if (filters.acOnly) {
    results = results.filter((b) => {
      if (b.category === 'venue') {
        return b.venue_details?.is_ac === true;
      }
      return true;
    });
  }

  // Outside Catering
  if (filters.outsideCatering) {
    results = results.filter((b) => {
      if (b.category === 'venue') {
        return b.venue_details?.outside_catering_allowed === true;
      }
      return true;
    });
  }

  return { businesses: results, blockedCount: blocked };
}

export async function getBusinessById(id: string): Promise<Business | null> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select(`
          *,
          vendors (*),
          venue_details (*),
          decor_items (*),
          catering_packages (*),
          media_reels (*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        const v = Array.isArray(data.vendors) ? data.vendors[0] : data.vendors;
        const vd = Array.isArray(data.venue_details) ? data.venue_details[0] : data.venue_details;
        return {
          id: data.id,
          name: data.name,
          category: data.category,
          city: v?.city || 'Visakhapatnam',
          area_locality: v?.area_locality || 'Madhurawada',
          latitude: 17.72,
          longitude: 83.31,
          cover_image_url: data.cover_image_url,
          gallery_images: data.gallery_images || [],
          rating_avg: v?.rating_avg ? Number(v.rating_avg) : 4.8,
          review_count: v?.review_count || 12,
          phone: v?.phone || '+91 98480 12345',
          whatsapp_number: v?.whatsapp_number || '+91 98480 12345',
          is_verified: v?.is_verified ?? true,
          venue_details: vd
            ? {
                id: vd.id,
                business_id: vd.business_id,
                is_ac: vd.is_ac,
                seating_capacity: vd.seating_capacity,
                floating_capacity: vd.floating_capacity,
                ac_rooms_count: vd.ac_rooms_count,
                parking_capacity_cars: vd.parking_cars || 100,
                outside_catering_allowed: vd.outside_catering_allowed,
                base_rental_price: Number(vd.base_rental_price),
                power_backup_kva: vd.power_backup_kva,
              }
            : undefined,
          decor_items: data.decor_items || [],
          catering_packages: data.catering_packages || [],
          media_reels: data.media_reels || [],
        };
      }
    } catch (err) {
      console.warn('Supabase getBusinessById error:', err);
    }
  }

  const found = MOCK_BUSINESSES.find((b) => b.id === id);
  return found || null;
}

export async function createBookingInquiry(
  inquiry: Omit<BookingInquiry, 'id' | 'created_at' | 'status'>
): Promise<{ success: boolean; id: string }> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('booking_inquiries')
        .insert({
          business_id: inquiry.business_id,
          customer_name: inquiry.customer_name,
          customer_phone: inquiry.customer_phone,
          event_date: inquiry.event_date,
          guest_count: inquiry.guest_count,
          vendor_base_amount: inquiry.vendor_base_amount || inquiry.total_estimated_amount,
          admin_commission_percentage: inquiry.admin_commission_percentage || 10,
          final_customer_amount: inquiry.final_customer_amount || inquiry.total_estimated_amount,
          status: 'pending',
          notes: inquiry.notes || '',
        })
        .select('id')
        .maybeSingle();

      if (!error && data?.id) {
        return { success: true, id: data.id };
      }
    } catch (err) {
      console.warn('Supabase booking insert error:', err);
    }
  }

  const mockId = 'INQ-' + Math.floor(100000 + Math.random() * 900000);
  localInquiries.push({
    ...inquiry,
    id: mockId,
    status: 'pending',
    created_at: new Date().toISOString(),
  });
  return { success: true, id: mockId };
}

// ---------------------------------------------------------------------------
// VENDOR PORTAL: INQUIRY MANAGEMENT
// ---------------------------------------------------------------------------

export async function getVendorInquiries(businessId: string): Promise<BookingInquiry[]> {
  return localInquiries.filter((inq) => inq.business_id === businessId);
}

export async function updateInquiryStatus(
  inquiryId: string,
  newStatus: 'pending' | 'approved' | 'rejected' | 'completed'
): Promise<boolean> {
  const target = localInquiries.find((inq) => inq.id === inquiryId);
  if (target) {
    target.status = newStatus;
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// VENDOR PORTAL: PRICE UPDATE WITH ADMIN PERCENTAGE & APPROVAL WORKFLOW
// ---------------------------------------------------------------------------

export async function getPriceRequestsForBusiness(businessId: string): Promise<PriceUpdateRequest[]> {
  return localPriceRequests.filter((r) => r.business_id === businessId);
}

export async function submitPriceUpdateRequest(params: {
  businessId: string;
  businessName: string;
  itemType: 'venue_rental' | 'catering_plate' | 'decor_package';
  itemName: string;
  currentPrice: number;
  proposedBasePrice: number;
  adminPercentage?: number;
  notes?: string;
}): Promise<PriceUpdateRequest> {
  const adminPct = params.adminPercentage ?? DEFAULT_ADMIN_PERCENTAGE;
  const markup = Math.round(params.proposedBasePrice * (adminPct / 100));
  const finalPrice = params.proposedBasePrice + markup;

  const newRequest: PriceUpdateRequest = {
    id: 'REQ-' + Math.floor(100 + Math.random() * 900),
    business_id: params.businessId,
    business_name: params.businessName,
    item_type: params.itemType,
    item_name: params.itemName,
    current_price: params.currentPrice,
    proposed_base_price: params.proposedBasePrice,
    admin_percentage: adminPct,
    admin_markup_amount: markup,
    final_customer_price: finalPrice,
    status: 'pending_approval',
    submitted_at: new Date().toISOString(),
    notes: params.notes,
  };

  localPriceRequests.unshift(newRequest);
  return newRequest;
}

export async function approvePriceRequest(requestId: string): Promise<boolean> {
  const req = localPriceRequests.find((r) => r.id === requestId);
  if (!req) return false;

  req.status = 'approved';
  req.approved_at = new Date().toISOString();

  // Apply to actual business data so customer-facing prices reflect the approved pricing
  const biz = MOCK_BUSINESSES.find((b) => b.id === req.business_id);
  if (biz) {
    if (req.item_type === 'venue_rental' && biz.venue_details) {
      biz.venue_details.base_rental_price = req.final_customer_price;
    } else if (req.item_type === 'catering_plate' && biz.catering_packages) {
      const pkg = biz.catering_packages.find((p) => p.package_name === req.item_name) || biz.catering_packages[0];
      if (pkg) pkg.price_per_plate = req.final_customer_price;
    } else if (req.item_type === 'decor_package' && biz.decor_catalogues) {
      const dec = biz.decor_catalogues.find((d) => d.title === req.item_name) || biz.decor_catalogues[0];
      if (dec) dec.base_price = req.final_customer_price;
    }
  }

  return true;
}

export async function rejectPriceRequest(requestId: string, notes?: string): Promise<boolean> {
  const req = localPriceRequests.find((r) => r.id === requestId);
  if (!req) return false;
  req.status = 'rejected';
  if (notes) req.notes = notes;
  return true;
}

// ---------------------------------------------------------------------------
// VENDOR PORTAL: MEDIA MANAGEMENT (REELS, PICS & PDFS)
// ---------------------------------------------------------------------------

export async function addVendorReel(
  businessId: string,
  reelData: { title: string; videoUrl: string; thumbnailUrl: string; durationSeconds?: number }
): Promise<MediaReel | null> {
  const biz = MOCK_BUSINESSES.find((b) => b.id === businessId);
  if (!biz) return null;

  const newReel: MediaReel = {
    id: 'reel-up-' + Date.now(),
    business_id: businessId,
    title: reelData.title,
    video_url: reelData.videoUrl,
    thumbnail_url: reelData.thumbnailUrl,
    duration_seconds: reelData.durationSeconds || 30,
  };

  if (!biz.media_reels) biz.media_reels = [];
  biz.media_reels.unshift(newReel);
  return newReel;
}

export async function addVendorPhoto(businessId: string, imageUrl: string): Promise<boolean> {
  const biz = MOCK_BUSINESSES.find((b) => b.id === businessId);
  if (!biz) return false;

  if (!biz.gallery_images) biz.gallery_images = [];
  biz.gallery_images.unshift(imageUrl);
  return true;
}

export async function removeVendorPhoto(businessId: string, imageUrl: string): Promise<boolean> {
  const biz = MOCK_BUSINESSES.find((b) => b.id === businessId);
  if (!biz || !biz.gallery_images) return false;

  biz.gallery_images = biz.gallery_images.filter((img) => img !== imageUrl);
  return true;
}

export async function addVendorPdf(
  businessId: string,
  pdfData: { title: string; pdfUrl: string; type: 'menu' | 'lookbook' | 'brochure' | 'license'; fileSizeKb?: number }
): Promise<VendorDocPdf | null> {
  const biz = MOCK_BUSINESSES.find((b) => b.id === businessId);
  if (!biz) return null;

  const newPdf: VendorDocPdf = {
    id: 'pdf-' + Date.now(),
    business_id: businessId,
    title: pdfData.title,
    pdf_url: pdfData.pdfUrl,
    type: pdfData.type,
    file_size_kb: pdfData.fileSizeKb || 450,
    uploaded_at: new Date().toISOString(),
  };

  if (!biz.vendor_pdfs) biz.vendor_pdfs = [];
  biz.vendor_pdfs.unshift(newPdf);
  return newPdf;
}

export async function getVendorPdfs(businessId: string): Promise<VendorDocPdf[]> {
  const biz = MOCK_BUSINESSES.find((b) => b.id === businessId);
  return biz?.vendor_pdfs || [];
}
