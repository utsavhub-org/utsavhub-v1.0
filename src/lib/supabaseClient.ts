import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Business,
  BookingInquiry,
  UserProfile,
  VendorDocPdf,
  PriceUpdateRequest,
  MediaReel,
  Review,
  ReelComment,
  SupportMessage,
  CateringItem,
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
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your-supabase')
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
  userId?: string;
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
      if (filters.userId) {
        const savedIds = await getUserWishlists(filters.userId);
        results = results.filter((b) => savedIds.includes(b.id));
      } else {
        results = [];
      }
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
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  if (supabase && isUuid) {
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
        const mockMatch = MOCK_BUSINESSES.find((m) => m.name === data.name || m.id === data.id);

        return {
          id: data.id,
          name: data.name,
          category: data.category,
          city: v?.city || mockMatch?.city || 'Visakhapatnam',
          area_locality: v?.area_locality || mockMatch?.area_locality || 'Madhurawada',
          latitude: mockMatch?.latitude || 17.72,
          longitude: mockMatch?.longitude || 83.31,
          cover_image_url: data.cover_image_url || mockMatch?.cover_image_url,
          gallery_images: data.gallery_images && data.gallery_images.length > 0 ? data.gallery_images : (mockMatch?.gallery_images || []),
          rating_avg: v?.rating_avg ? Number(v.rating_avg) : (mockMatch?.rating_avg || 4.8),
          review_count: v?.review_count || mockMatch?.review_count || 18,
          phone: v?.phone || mockMatch?.phone || '+91 98480 12345',
          whatsapp_number: v?.whatsapp_number || mockMatch?.whatsapp_number || '919848012345',
          is_verified: v?.is_verified ?? true,
          venue_details: vd
            ? {
                id: vd.id,
                business_id: vd.business_id,
                is_ac: vd.is_ac ?? true,
                seating_capacity: vd.seating_capacity || 600,
                floating_capacity: vd.floating_capacity || 1200,
                ac_rooms_count: vd.ac_rooms_count || 8,
                parking_capacity_cars: vd.parking_cars || 100,
                outside_catering_allowed: vd.outside_catering_allowed ?? true,
                base_rental_price: Number(vd.base_rental_price || 175000),
                power_backup_kva: vd.power_backup_kva || 125,
              }
            : mockMatch?.venue_details,
          decor_items: data.decor_items && data.decor_items.length > 0
            ? data.decor_items.map((di: any) => ({
                ...di,
                base_price: Number(di.base_price || 0),
                sample_images: Array.isArray(di.sample_images) ? di.sample_images : [],
              }))
            : (mockMatch?.decor_items || []),
          decor_catalogues: mockMatch?.decor_catalogues || [],
          catering_packages: data.catering_packages && data.catering_packages.length > 0
            ? data.catering_packages.map((cp: any) => ({
                ...cp,
                package_type: cp.package_type || cp.diet_type || 'veg',
                price_per_plate: Number(cp.price_per_plate || 450),
              }))
            : (mockMatch?.catering_packages || []),
          catering_addons: mockMatch?.catering_addons || [],
          media_reels: data.media_reels && data.media_reels.length > 0 ? data.media_reels : (mockMatch?.media_reels || []),
          availability_calendar: mockMatch?.availability_calendar || [],
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
// VENDOR PORTAL: INQUIRY MANAGEMENT (REAL-TIME SUPABASE)
// ---------------------------------------------------------------------------

export async function getVendorInquiries(businessId: string): Promise<BookingInquiry[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('booking_inquiries')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          business_id: d.business_id,
          customer_name: d.customer_name,
          customer_phone: d.customer_phone,
          event_date: d.event_date,
          guest_count: d.guest_count,
          total_estimated_amount: Number(d.final_customer_amount || d.vendor_base_amount || 0),
          vendor_base_amount: Number(d.vendor_base_amount || 0),
          admin_commission_percentage: Number(d.admin_commission_percentage || 10),
          final_customer_amount: Number(d.final_customer_amount || 0),
          status: d.status || 'pending',
          notes: d.notes || '',
          created_at: d.created_at,
        }));
      }
    } catch (e) {
      console.warn('Supabase getVendorInquiries notice:', e);
    }
  }
  return localInquiries.filter((inq) => inq.business_id === businessId);
}

export async function updateInquiryStatus(
  inquiryId: string,
  newStatus: 'pending' | 'approved' | 'rejected' | 'completed'
): Promise<boolean> {
  if (supabase) {
    try {
      const { error } = await supabase
        .from('booking_inquiries')
        .update({ status: newStatus })
        .eq('id', inquiryId);

      if (!error) {
        const target = localInquiries.find((inq) => inq.id === inquiryId);
        if (target) target.status = newStatus;
        return true;
      }
    } catch (e) {
      console.warn('Supabase updateInquiryStatus notice:', e);
    }
  }
  const target = localInquiries.find((inq) => inq.id === inquiryId);
  if (target) {
    target.status = newStatus;
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// CUSTOMER BOOKINGS & INQUIRIES (SUPABASE)
// ---------------------------------------------------------------------------

export async function getCustomerBookings(customerPhoneOrEmail: string): Promise<any[]> {
  if (!customerPhoneOrEmail) return [];

  if (supabase) {
    try {
      const cleanPhone = customerPhoneOrEmail.replace(/\D/g, '').slice(-10);
      let query = supabase
        .from('booking_inquiries')
        .select(`
          *,
          businesses (
            name,
            cover_image_url,
            category,
            vendors (
              city,
              area_locality,
              phone,
              whatsapp_number
            )
          )
        `);

      if (cleanPhone.length >= 10) {
        query = query.ilike('customer_phone', `%${cleanPhone}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => {
          const biz = Array.isArray(d.businesses) ? d.businesses[0] : d.businesses;
          const v = biz?.vendors ? (Array.isArray(biz.vendors) ? biz.vendors[0] : biz.vendors) : null;
          return {
            id: d.id,
            vendorId: d.business_id,
            name: biz?.name || 'Grand Swarna Palace Convention Hall',
            locality: v?.area_locality ? `${v.area_locality}, ${v.city}` : 'Visakhapatnam',
            image: biz?.cover_image_url || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800',
            date: d.event_date,
            muhurthamLabel: 'Auspicious Muhurtham Date',
            guests: d.guest_count,
            amount: `₹${Number(d.final_customer_amount || d.vendor_base_amount || 0).toLocaleString('en-IN')}`,
            status: d.status,
            phone: v?.phone || '+91 98480 12345',
            whatsapp: v?.whatsapp_number || '919848012345',
            statusLabel:
              d.status === 'approved'
                ? 'Date Hold Confirmed'
                : d.status === 'rejected'
                ? 'Date Unavailable'
                : 'Inquiry Under Review',
            notes: d.notes,
          };
        });
      }
    } catch (e) {
      console.warn('Supabase getCustomerBookings notice:', e);
    }
  }

  return [];
}

// ---------------------------------------------------------------------------
// CUSTOMER WISHLIST PERSISTENCE (SUPABASE)
// ---------------------------------------------------------------------------

export async function getUserWishlists(userId: string): Promise<string[]> {
  if (!userId) return [];
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('user_wishlists')
        .select('business_id')
        .eq('user_id', userId);

      if (!error && data) {
        return data.map((d: any) => d.business_id);
      }
    } catch (e) {
      console.warn('getUserWishlists notice:', e);
    }
  }
  return [];
}

export async function toggleUserWishlist(userId: string, businessId: string): Promise<boolean> {
  if (!userId || !businessId) return false;
  if (supabase) {
    try {
      const { data: existing } = await supabase
        .from('user_wishlists')
        .select('id')
        .eq('user_id', userId)
        .eq('business_id', businessId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('user_wishlists')
          .delete()
          .eq('user_id', userId)
          .eq('business_id', businessId);
        return false;
      } else {
        await supabase
          .from('user_wishlists')
          .insert({ user_id: userId, business_id: businessId });
        return true;
      }
    } catch (e) {
      console.warn('toggleUserWishlist notice:', e);
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// VENDOR PORTAL: PRICE UPDATE WITH ADMIN PERCENTAGE & APPROVAL WORKFLOW
// ---------------------------------------------------------------------------

export async function updateBusinessProfile(params: {
  businessId: string;
  name?: string;
  phone?: string;
  whatsapp?: string;
  seating_capacity?: number;
  floating_capacity?: number;
  ac_rooms_count?: number;
  parking_cars?: number;
  outside_catering_allowed?: boolean;
  is_ac?: boolean;
  power_backup_kva?: number;
}): Promise<boolean> {
  if (supabase && params.businessId) {
    try {
      if (params.name) {
        await supabase
          .from('businesses')
          .update({ name: params.name })
          .eq('id', params.businessId);
      }

      const venueUpdates: any = {};
      if (params.seating_capacity !== undefined) venueUpdates.seating_capacity = params.seating_capacity;
      if (params.floating_capacity !== undefined) venueUpdates.floating_capacity = params.floating_capacity;
      if (params.ac_rooms_count !== undefined) venueUpdates.ac_rooms_count = params.ac_rooms_count;
      if (params.parking_cars !== undefined) venueUpdates.parking_cars = params.parking_cars;
      if (params.outside_catering_allowed !== undefined) venueUpdates.outside_catering_allowed = params.outside_catering_allowed;
      if (params.is_ac !== undefined) venueUpdates.is_ac = params.is_ac;
      if (params.power_backup_kva !== undefined) venueUpdates.power_backup_kva = params.power_backup_kva;

      if (Object.keys(venueUpdates).length > 0) {
        await supabase
          .from('venue_details')
          .update(venueUpdates)
          .eq('business_id', params.businessId);
      }
    } catch (e) {
      console.warn('updateBusinessProfile live notice:', e);
    }
  }

  const biz = MOCK_BUSINESSES.find((b) => b.id === params.businessId);
  if (biz) {
    if (params.name) biz.name = params.name;
    if (params.phone) biz.phone = params.phone;
    if (params.whatsapp) biz.whatsapp_number = params.whatsapp;
    if (biz.venue_details) {
      if (params.seating_capacity !== undefined) biz.venue_details.seating_capacity = params.seating_capacity;
      if (params.floating_capacity !== undefined) biz.venue_details.floating_capacity = params.floating_capacity;
      if (params.ac_rooms_count !== undefined) biz.venue_details.ac_rooms_count = params.ac_rooms_count;
      if (params.parking_cars !== undefined) biz.venue_details.parking_capacity_cars = params.parking_cars;
      if (params.outside_catering_allowed !== undefined) biz.venue_details.outside_catering_allowed = params.outside_catering_allowed;
      if (params.is_ac !== undefined) biz.venue_details.is_ac = params.is_ac;
      if (params.power_backup_kva !== undefined) biz.venue_details.power_backup_kva = params.power_backup_kva;
    }
  }
  return true;
}

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

// ---------------------------------------------------------------------------
// 1. REVIEWS & RATINGS (VERIFIED PAST BOOKINGS ONLY)
// ---------------------------------------------------------------------------

const localReviews: Review[] = [
  {
    id: 'rev-1',
    booking_id: '66666666-6666-6666-6666-666666666666',
    business_id: '11111111-1111-1111-1111-111111111111',
    user_id: 'usr-cust-1',
    user_name: 'Ananya & Rahul',
    user_avatar: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400',
    rating: 5,
    review_text: 'Exceptional venue! The centralized AC was freezing despite 600 guests, and Narayana Rao sir supported our family throughout the muhurtham.',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

export async function getBusinessReviews(businessId: string): Promise<Review[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data as Review[];
      }
    } catch (e) {
      console.warn('Supabase fetch reviews note:', e);
    }
  }
  return localReviews.filter((r) => r.business_id === businessId);
}

export async function canUserReviewBusiness(
  userId: string,
  businessId: string
): Promise<{ canReview: boolean; bookingId?: string; message?: string }> {
  // Check Supabase or local inquiries for completed or approved booking
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('booking_inquiries')
        .select('id, status')
        .eq('business_id', businessId)
        .in('status', ['approved', 'completed'])
        .limit(1);

      if (!error && data && data.length > 0) {
        return { canReview: true, bookingId: data[0].id };
      }
    } catch (e) {
      console.warn('Supabase canUserReview notice:', e);
    }
  }

  const localBooking = localInquiries.find(
    (inq) =>
      inq.business_id === businessId &&
      (inq.status === 'approved' || inq.status === 'completed')
  );

  if (localBooking) {
    return { canReview: true, bookingId: localBooking.id };
  }

  return {
    canReview: false,
    message: 'Reviews are reserved exclusively for clients with a verified past or approved booking.',
  };
}

export async function submitReview(
  reviewData: Omit<Review, 'id' | 'created_at'>
): Promise<Review | null> {
  const newReview: Review = {
    id: 'rev-' + Date.now(),
    ...reviewData,
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          booking_id: reviewData.booking_id,
          business_id: reviewData.business_id,
          user_id: reviewData.user_id,
          user_name: reviewData.user_name,
          user_avatar: reviewData.user_avatar,
          rating: reviewData.rating,
          review_text: reviewData.review_text,
        })
        .select()
        .single();

      if (!error && data) {
        return data as Review;
      }
    } catch (e) {
      console.warn('Supabase review insert error:', e);
    }
  }

  localReviews.unshift(newReview);
  return newReview;
}

// ---------------------------------------------------------------------------
// 2. REEL COMMENTS
// ---------------------------------------------------------------------------

const localReelComments: ReelComment[] = [
  {
    id: 'com-1',
    reel_id: 'reel-1',
    user_id: 'usr-1',
    user_name: 'Pooja Reddy',
    user_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    comment_text: 'Lighting in the central dining hall looks magnificent! How is the parking access from NH16?',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'com-2',
    reel_id: 'reel-1',
    user_id: 'usr-vend-1',
    user_name: 'Grand Swarna Management',
    user_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    comment_text: 'Hi Pooja garu! We have a dedicated 100-car paved parking area right at the NH16 entrance with valet service.',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

export async function getReelComments(reelId: string): Promise<ReelComment[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('reel_comments')
        .select('*')
        .eq('reel_id', reelId)
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data as ReelComment[];
      }
    } catch (e) {
      console.warn('Supabase reel comments error:', e);
    }
  }
  return localReelComments.filter((c) => c.reel_id === reelId || !c.reel_id);
}

export async function addReelComment(
  commentData: Omit<ReelComment, 'id' | 'created_at'>
): Promise<ReelComment | null> {
  const newComment: ReelComment = {
    id: 'com-' + Date.now(),
    ...commentData,
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('reel_comments')
        .insert({
          reel_id: commentData.reel_id,
          user_id: commentData.user_id,
          user_name: commentData.user_name,
          user_avatar: commentData.user_avatar,
          comment_text: commentData.comment_text,
        })
        .select()
        .single();
      if (!error && data) {
        return data as ReelComment;
      }
    } catch (e) {
      console.warn('Supabase comment insert notice:', e);
    }
  }

  localReelComments.unshift(newComment);
  return newComment;
}

// ---------------------------------------------------------------------------
// 3. PERSISTENT USER WISHLIST
// ---------------------------------------------------------------------------

// 3. PERSISTENT USER WISHLIST (SUPABASE ALIAS)
// ---------------------------------------------------------------------------
export const getUserWishlist = getUserWishlists;

// 4. LIVE SUPPORT CHAT
// ---------------------------------------------------------------------------

const localSupportMessages: SupportMessage[] = [
  {
    id: 'msg-1',
    user_id: 'all',
    user_name: 'UtsavHub Concierge',
    sender: 'support',
    message: 'Namaskaram! Welcome to UtsavHub Concierge. Need assistance comparing venues or checking auspicious muhurtham dates?',
    created_at: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
];

export async function getSupportMessages(userId: string): Promise<SupportMessage[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .or(`user_id.eq.${userId},user_id.eq.all`)
        .order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        return data as SupportMessage[];
      }
    } catch (e) {
      console.warn('Supabase fetch support notice:', e);
    }
  }
  return localSupportMessages.filter((m) => m.user_id === userId || m.user_id === 'all');
}

export async function sendSupportMessage(
  userId: string,
  userName: string,
  message: string,
  sender: 'user' | 'support' | 'vendor' = 'user'
): Promise<SupportMessage | null> {
  const newMsg: SupportMessage = {
    id: 'msg-' + Date.now(),
    user_id: userId,
    user_name: userName,
    sender,
    message,
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .insert({
          user_id: userId,
          user_name: userName,
          sender,
          message,
        })
        .select()
        .single();
      if (!error && data) {
        return data as SupportMessage;
      }
    } catch (e) {
      console.warn('Supabase support send notice:', e);
    }
  }

  localSupportMessages.push(newMsg);
  return newMsg;
}

// ---------------------------------------------------------------------------
// 5. ITEMIZED CATERING ITEMS (NEGOTIABLE PRICING AFTER DISCUSSION)
// ---------------------------------------------------------------------------

let localCateringItems: CateringItem[] = [
  {
    id: 'cat-item-1',
    business_id: '33333333-3333-3333-3333-333333333333',
    category: 'sweet',
    item_name: 'Special Pootharekulu with Pure Ghee & Dryfruits',
    is_veg: true,
    base_price_per_plate: 60.0,
    negotiable_price_per_plate: 50.0,
    is_available: true,
  },
  {
    id: 'cat-item-2',
    business_id: '33333333-3333-3333-3333-333333333333',
    category: 'curry',
    item_name: 'Andhra Gutti Vankaya Kura (Stuffed Brinjal Curry)',
    is_veg: true,
    base_price_per_plate: 50.0,
    negotiable_price_per_plate: 45.0,
    is_available: true,
  },
  {
    id: 'cat-item-3',
    business_id: '33333333-3333-3333-3333-333333333333',
    category: 'curry',
    item_name: 'Natukodi Pulusu with Hot Vada',
    is_veg: false,
    base_price_per_plate: 140.0,
    negotiable_price_per_plate: 125.0,
    is_available: true,
  },
  {
    id: 'cat-item-4',
    business_id: '33333333-3333-3333-3333-333333333333',
    category: 'rice',
    item_name: 'Ulava Charu Dum Biryani with Onion Raita',
    is_veg: true,
    base_price_per_plate: 85.0,
    negotiable_price_per_plate: 75.0,
    is_available: true,
  },
  {
    id: 'cat-item-5',
    business_id: '33333333-3333-3333-3333-333333333333',
    category: 'live_stall',
    item_name: 'Live Tandoor & Fresh Pan Ice Cream Counter',
    is_veg: true,
    base_price_per_plate: 70.0,
    negotiable_price_per_plate: 60.0,
    is_available: true,
  },
];

export async function getCateringItems(businessId: string): Promise<CateringItem[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('catering_items')
        .select('*')
        .eq('business_id', businessId)
        .order('category', { ascending: true });
      if (!error && data && data.length > 0) {
        return data as CateringItem[];
      }
    } catch (e) {
      console.warn('Supabase fetch catering items notice:', e);
    }
  }
  return localCateringItems.filter((i) => i.business_id === businessId || !i.business_id);
}

export async function addCateringItem(
  item: Omit<CateringItem, 'id' | 'created_at'>
): Promise<CateringItem | null> {
  const newItem: CateringItem = {
    id: 'cat-item-' + Date.now(),
    ...item,
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('catering_items')
        .insert({
          business_id: item.business_id,
          category: item.category,
          item_name: item.item_name,
          is_veg: item.is_veg,
          base_price_per_plate: item.base_price_per_plate,
          negotiable_price_per_plate: item.negotiable_price_per_plate,
          is_available: item.is_available,
        })
        .select()
        .single();
      if (!error && data) {
        return data as CateringItem;
      }
    } catch (e) {
      console.warn('Supabase insert catering item error:', e);
    }
  }

  localCateringItems.unshift(newItem);
  return newItem;
}

export async function updateCateringItemNegotiablePrice(
  itemId: string,
  negotiatedPrice: number
): Promise<boolean> {
  const item = localCateringItems.find((i) => i.id === itemId);
  if (item) {
    item.negotiable_price_per_plate = negotiatedPrice;
  }

  if (supabase) {
    try {
      const { error } = await supabase
        .from('catering_items')
        .update({ negotiable_price_per_plate: negotiatedPrice })
        .eq('id', itemId);
      return !error;
    } catch (e) {
      console.warn('Supabase update catering item price:', e);
    }
  }
  return true;
}

// ---------------------------------------------------------------------------
// 6. VENDOR MULTI-BUSINESS PORTAL & VISIBILITY TOGGLE
// ---------------------------------------------------------------------------

let vendorBusinessesStore: Business[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Grand Swarna Palace Convention Hall',
    category: 'venue',
    city: 'Visakhapatnam',
    area_locality: 'Madhurawada',
    latitude: 17.72,
    longitude: 83.31,
    cover_image_url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800',
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
    ],
    rating_avg: 4.9,
    review_count: 28,
    phone: '+91 98480 12345',
    whatsapp_number: '+91 98480 12345',
    is_verified: true,
    is_active: true,
    venue_details: {
      id: 'vd-1',
      business_id: '11111111-1111-1111-1111-111111111111',
      is_ac: true,
      seating_capacity: 800,
      floating_capacity: 1500,
      ac_rooms_count: 8,
      parking_capacity_cars: 120,
      outside_catering_allowed: true,
      base_rental_price: 175000,
      power_backup_kva: 125,
    },
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Swarna Royal Andhra & Mughlai Catering',
    category: 'catering',
    city: 'Visakhapatnam',
    area_locality: 'Madhurawada & MVP Colony',
    latitude: 17.72,
    longitude: 83.31,
    cover_image_url: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800',
    gallery_images: [],
    rating_avg: 4.8,
    review_count: 42,
    phone: '+91 98480 12345',
    whatsapp_number: '+91 98480 12345',
    is_verified: true,
    is_active: true,
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Swarna Kalakshetra Luxury Mandapam & Floral Decor',
    category: 'decoration',
    city: 'Visakhapatnam',
    area_locality: 'Madhurawada',
    latitude: 17.72,
    longitude: 83.31,
    cover_image_url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800',
    gallery_images: [],
    rating_avg: 4.9,
    review_count: 36,
    phone: '+91 98480 12345',
    whatsapp_number: '+91 98480 12345',
    is_verified: true,
    is_active: false,
  },
];

const localUserCreatedBusinesses: { ownerId: string; business: Business }[] = [];

export interface CreateBusinessInput {
  name: string;
  category: 'venue' | 'catering' | 'decoration' | 'photography' | 'dj_sound';
  city?: string;
  area_locality: string;
  cover_image_url?: string;
  phone: string;
  whatsapp_number: string;
  base_price: number;
  seating_capacity?: number;
  floating_capacity?: number;
  ac_rooms_count?: number;
  parking_cars?: number;
  diet_type?: 'veg' | 'non_veg' | 'mixed';
  min_guest_count?: number;
}

const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {
  venue: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800',
  catering: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800',
  decoration: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800',
  photography: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800',
  dj_sound: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
};

export async function getVendorBusinesses(user: UserProfile | null): Promise<Business[]> {
  if (!user) return [];

  // Demo account: GM Narayana Rao for Grand Swarna Group
  if (user.id === 'usr-vend-1') {
    return vendorBusinessesStore;
  }
  // Demo account: Chef Rambabu for Annapurna Royal Caterers
  if (user.id === 'usr-vend-2') {
    return MOCK_BUSINESSES.filter((b) => b.id === '44444444-4444-4444-4444-444444444444');
  }

  // Live Supabase query for actual authenticated user
  if (supabase) {
    try {
      const cleanPhone = user.phone ? user.phone.replace(/[^0-9]/g, '').slice(-10) : '';
      const cleanEmail = user.email ? user.email.trim().toLowerCase() : '';

      // 1. Find vendor IDs owned by this user
      let vendorIds: string[] = [];
      const orClauses: string[] = [];
      if (user.id && !user.id.startsWith('user-')) {
        orClauses.push(`auth_user_id.eq.${user.id}`);
      }
      if (cleanPhone) {
        orClauses.push(`phone.ilike.%${cleanPhone}%`);
      }
      if (cleanEmail) {
        orClauses.push(`email.eq.${cleanEmail}`);
      }

      if (orClauses.length > 0) {
        const { data: vRows } = await supabase
          .from('vendors')
          .select('id')
          .or(orClauses.join(','));
        if (vRows && vRows.length > 0) {
          vendorIds = vRows.map((v) => v.id);
        }
      }

      // 2. Query businesses belonging to this vendor
      let bizQuery = supabase
        .from('businesses')
        .select(`
          *,
          vendors (*),
          venue_details (*),
          catering_packages (*),
          decor_items (*),
          media_reels (*)
        `);

      if (vendorIds.length > 0 && user.businessId) {
        bizQuery = bizQuery.or(`vendor_id.in.(${vendorIds.join(',')}),id.eq.${user.businessId}`);
      } else if (vendorIds.length > 0) {
        bizQuery = bizQuery.in('vendor_id', vendorIds);
      } else if (user.businessId) {
        bizQuery = bizQuery.eq('id', user.businessId);
      } else {
        // Fresh vendor with zero businesses
        const createdForUser = localUserCreatedBusinesses.filter((b) => b.ownerId === user.id);
        return createdForUser.map((c) => c.business);
      }

      const { data, error } = await bizQuery.order('display_order', { ascending: true });
      if (!error && data && data.length > 0) {
        return data.map((b: any) => {
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
            rating_avg: v?.rating_avg ? Number(v.rating_avg) : 5.0,
            review_count: v?.review_count || 0,
            phone: v?.phone || user.phone || '+91 98480 12345',
            whatsapp_number: v?.whatsapp_number || user.phone || '919848012345',
            is_verified: v?.is_verified ?? true,
            is_active: b.is_active ?? true,
            venue_details: vd
              ? {
                  id: vd.id,
                  business_id: vd.business_id,
                  is_ac: vd.is_ac ?? true,
                  seating_capacity: vd.seating_capacity,
                  floating_capacity: vd.floating_capacity,
                  ac_rooms_count: vd.ac_rooms_count,
                  parking_capacity_cars: vd.parking_cars || 50,
                  outside_catering_allowed: vd.outside_catering_allowed ?? true,
                  base_rental_price: Number(vd.base_rental_price || 0),
                  power_backup_kva: vd.power_backup_kva || 100,
                }
              : undefined,
            catering_packages: b.catering_packages || [],
            decor_items: b.decor_items || [],
            media_reels: b.media_reels || [],
          };
        });
      }
    } catch (e) {
      console.warn('Supabase fetch vendor businesses notice:', e);
    }
  }

  // Fallback: If this fresh user created any in this local session
  const createdForUser = localUserCreatedBusinesses.filter((b) => b.ownerId === user.id);
  if (createdForUser.length > 0) {
    return createdForUser.map((c) => c.business);
  }

  // A fresh vendor has 0 businesses!
  return [];
}

export async function toggleBusinessActive(
  businessId: string,
  isActive: boolean
): Promise<boolean> {
  const biz = vendorBusinessesStore.find((b) => b.id === businessId);
  if (biz) {
    biz.is_active = isActive;
  }

  if (supabase) {
    try {
      await supabase
        .from('businesses')
        .update({ is_active: isActive })
        .eq('id', businessId);
    } catch (e) {
      console.warn('Supabase toggle business active notice:', e);
    }
  }
  return true;
}

export async function createVendorBusiness(
  user: UserProfile,
  input: CreateBusinessInput
): Promise<Business | null> {
  const coverUrl =
    input.cover_image_url ||
    CATEGORY_DEFAULT_IMAGES[input.category] ||
    CATEGORY_DEFAULT_IMAGES.venue;

  let vendorId = '00000000-0000-0000-0000-000000000001';
  let createdBizId = 'biz-' + Date.now();

  if (supabase) {
    try {
      // 1. Create or resolve vendor row
      const cleanPhone = input.phone || user.phone || '+91 98480 12345';
      const cleanEmail = user.email || null;

      const { data: vendorData } = await supabase
        .from('vendors')
        .insert({
          business_name: input.name,
          primary_contact_name: user.name || input.name,
          phone: cleanPhone,
          whatsapp_number: input.whatsapp_number || cleanPhone,
          email: cleanEmail,
          city: input.city || 'Visakhapatnam',
          area_locality: input.area_locality || 'Madhurawada',
          is_verified: true,
          rating_avg: 5.0,
          review_count: 0,
        })
        .select()
        .single();

      if (vendorData) {
        vendorId = vendorData.id;
      }

      // 2. Insert into businesses
      const { data: bizData } = await supabase
        .from('businesses')
        .insert({
          vendor_id: vendorId,
          category: input.category,
          name: input.name,
          cover_image_url: coverUrl,
          gallery_images: [coverUrl],
          is_active: true,
          display_order: 1,
        })
        .select()
        .single();

      if (bizData) {
        createdBizId = bizData.id;

        // 3. Category details
        if (input.category === 'venue') {
          await supabase.from('venue_details').insert({
            business_id: createdBizId,
            is_ac: true,
            seating_capacity: Number(input.seating_capacity || 600),
            floating_capacity: Number(input.floating_capacity || 1200),
            ac_rooms_count: Number(input.ac_rooms_count || 4),
            parking_cars: Number(input.parking_cars || 50),
            outside_catering_allowed: true,
            base_rental_price: Number(input.base_price || 125000),
            power_backup_kva: 100,
            dining_hall_capacity: Math.round(Number(input.seating_capacity || 600) * 0.5),
          });
        } else if (input.category === 'catering') {
          await supabase.from('catering_packages').insert({
            business_id: createdBizId,
            package_name: `${input.name} Grand Feast`,
            diet_type: input.diet_type || 'mixed',
            service_type: 'buffet',
            price_per_plate: Number(input.base_price || 450),
            min_guest_count: Number(input.min_guest_count || 100),
            sweets_count: 3,
            curries_count: 4,
            menu_highlights: ['Special Pootharekulu', 'Paneer Butter Masala', 'Dum Biryani'],
          });
        } else if (input.category === 'decoration') {
          await supabase.from('decor_items').insert({
            business_id: createdBizId,
            element_type: 'mandapam',
            title: `${input.name} Celestial Mandapam`,
            dimensions: '25x20 ft',
            flower_type: 'Fresh Marigold & Jasmine',
            base_price: Number(input.base_price || 85000),
            sample_images: [coverUrl],
            is_customizable: true,
          });
        }

        // 4. Update user profile in Supabase
        await supabase.from('user_profiles').upsert({
          id: user.id,
          phone: cleanPhone,
          full_name: user.name || input.name,
          role: 'vendor',
          business_id: createdBizId,
          business_name: input.name,
          business_category: input.category,
          is_profile_complete: true,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('Supabase create vendor business notice:', e);
    }
  }

  const createdBusiness: Business = {
    id: createdBizId,
    name: input.name,
    category: input.category,
    city: input.city || 'Visakhapatnam',
    area_locality: input.area_locality || 'Madhurawada',
    latitude: 17.72,
    longitude: 83.31,
    cover_image_url: coverUrl,
    gallery_images: [coverUrl],
    rating_avg: 5.0,
    review_count: 0,
    phone: input.phone || user.phone || '+91 98480 12345',
    whatsapp_number: input.whatsapp_number || input.phone || '919848012345',
    is_verified: true,
    is_active: true,
    venue_details:
      input.category === 'venue'
        ? {
            id: 'vd-' + createdBizId,
            business_id: createdBizId,
            is_ac: true,
            seating_capacity: Number(input.seating_capacity || 600),
            floating_capacity: Number(input.floating_capacity || 1200),
            ac_rooms_count: Number(input.ac_rooms_count || 4),
            parking_capacity_cars: Number(input.parking_cars || 50),
            outside_catering_allowed: true,
            base_rental_price: Number(input.base_price || 125000),
            power_backup_kva: 100,
          }
        : undefined,
    catering_packages:
      input.category === 'catering'
        ? [
            {
              id: 'cp-' + createdBizId,
              business_id: createdBizId,
              package_name: `${input.name} Grand Feast`,
              package_type: input.diet_type || 'mixed',
              price_per_plate: Number(input.base_price || 450),
              min_guest_count: Number(input.min_guest_count || 100),
              menu_highlights: ['Special Pootharekulu', 'Paneer Butter Masala', 'Dum Biryani'],
            },
          ]
        : [],
    decor_items:
      input.category === 'decoration'
        ? [
            {
              id: 'di-' + createdBizId,
              business_id: createdBizId,
              element_type: 'mandapam',
              title: `${input.name} Celestial Mandapam`,
              dimensions: '25x20 ft',
              flower_type: 'Fresh Marigold & Jasmine',
              base_price: Number(input.base_price || 85000),
              sample_images: [coverUrl],
              is_customizable: true,
            },
          ]
        : [],
    media_reels: [],
    availability_calendar: [],
  };

  localUserCreatedBusinesses.unshift({ ownerId: user.id, business: createdBusiness });
  return createdBusiness;
}

