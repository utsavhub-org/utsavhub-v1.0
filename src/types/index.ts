export type BusinessCategory = 'venue' | 'catering' | 'decoration' | 'photography' | 'dj_sound';

export interface Business {
  id: string;
  name: string;
  category: BusinessCategory;
  city: string;
  area_locality: string;
  latitude: number;
  longitude: number;
  cover_image_url: string;
  gallery_images: string[];
  rating_avg: number;
  review_count: number;
  phone: string;
  whatsapp_number: string;
  is_verified: boolean;
  venue_details?: VenueDetails;
  catering_packages?: CateringPackage[];
  catering_addons?: CateringAddon[];
  decor_catalogues?: DecorCatalogue[];
  decor_items?: DecorItem[];
  media_reels?: MediaReel[];
  availability_calendar?: AvailabilitySlot[];
  vendor_pdfs?: VendorDocPdf[];
}

export interface VenueDetails {
  id: string;
  business_id: string;
  is_ac: boolean;
  seating_capacity: number;
  floating_capacity: number;
  ac_rooms_count: number;
  parking_capacity_cars: number;
  outside_catering_allowed: boolean;
  base_rental_price: number;
  power_backup_kva: number;
}

export type CateringPackageType = 'veg' | 'non_veg' | 'mixed';

export interface CateringPackage {
  id: string;
  business_id: string;
  package_name: string;
  package_type: CateringPackageType;
  price_per_plate: number;
  min_guest_count: number;
  menu_highlights: string[];
  menu_pdf_url: string;
}

export interface CateringAddon {
  id: string;
  business_id: string;
  stall_name: string;
  price_per_plate_extra: number;
  description?: string;
}

export type DecorElementType = 'mandapam' | 'wayworks_entrance' | 'reception_backdrop' | 'haldi_mehendi' | 'lighting_fx';

export interface DecorItem {
  id: string;
  business_id: string;
  element_type: DecorElementType;
  title: string;
  dimensions?: string;
  flower_type?: string;
  base_price: number;
  sample_images: string[];
  is_customizable?: boolean;
}

export interface DecorCatalogue {
  id: string;
  business_id: string;
  title: string;
  category_type: 'mandapam' | 'reception_backdrop' | 'entry_arch';
  base_price: number;
  dimensions: string;
  sample_images: string[];
  lookbook_pdf_url: string;
}

export interface MediaReel {
  id: string;
  business_id: string;
  title: string;
  video_url: string;
  thumbnail_url: string;
  duration_seconds: number;
}

export interface AvailabilitySlot {
  id: string;
  business_id: string;
  blocked_date: string;
  slot: 'morning' | 'evening' | 'full_day';
  is_booked: boolean;
}

export type UserRole = 'customer' | 'vendor';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  partnerName?: string;
  weddingDate?: string;
  selectedCity: string;
  area_locality?: string;
  avatar_url?: string;
  businessId?: string;
  businessName?: string;
  businessCategory?: BusinessCategory;
  isProfileComplete?: boolean;
}

export interface VendorDocPdf {
  id: string;
  business_id: string;
  title: string;
  pdf_url: string;
  type: 'menu' | 'lookbook' | 'brochure' | 'license';
  file_size_kb?: number;
  uploaded_at: string;
}

export interface PriceUpdateRequest {
  id: string;
  business_id: string;
  business_name: string;
  item_type: 'venue_rental' | 'catering_plate' | 'decor_package';
  item_name: string;
  current_price: number;
  proposed_base_price: number;
  admin_percentage: number; // e.g. 10 (%)
  admin_markup_amount: number;
  final_customer_price: number;
  status: 'pending_approval' | 'approved' | 'rejected';
  submitted_at: string;
  approved_at?: string;
  notes?: string;
}

export interface BookingInquiry {
  id?: string;
  business_id: string;
  customer_name: string;
  customer_phone: string;
  event_date: string;
  guest_count: number;
  total_estimated_amount: number;
  selected_decor_ids?: string[];
  selected_catering_package_id?: string;
  selected_addon_ids?: string[];
  vendor_base_amount?: number;
  admin_commission_percentage?: number;
  final_customer_amount?: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  notes?: string;
  created_at?: string;
}
