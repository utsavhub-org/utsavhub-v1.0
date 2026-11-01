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
  is_active?: boolean;
  vendor_id?: string;
  venue_details?: VenueDetails;
  catering_packages?: CateringPackage[];
  catering_addons?: CateringAddon[];
  catering_items?: CateringItem[];
  decor_catalogues?: DecorCatalogue[];
  decor_items?: DecorItem[];
  photography_packages?: PhotographyPackage[];
  dj_sound_packages?: SoundDjPackage[];
  starting_price?: number;
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
  is_negotiable?: boolean;
}

export interface CateringAddon {
  id: string;
  business_id: string;
  stall_name: string;
  price_per_plate_extra: number;
  description?: string;
}

export type DecorElementType =
  | 'mandapam'
  | 'wayworks_entrance'
  | 'sangeeth'
  | 'rata_muhurtham'
  | 'kalagollu_sambaralu'
  | 'home_decor'
  | 'reception_backdrop'
  | 'haldi_mehendi'
  | 'lighting_fx'
  | 'utilities'
  | 'other';

export interface DecorItem {
  id: string;
  business_id: string;
  element_type: DecorElementType;
  title: string;
  dimensions?: string;
  height?: string;
  flower_type?: string;
  base_price: number;
  is_negotiable?: boolean;
  sample_images: string[];
  is_customizable?: boolean;
}

export interface PhotographyPackage {
  id: string;
  business_id: string;
  title: string;
  package_type: '3day_wedding' | 'pre_wedding' | 'muhurtham_traditional' | 'drone_led';
  base_price: number;
  is_negotiable?: boolean;
  deliverables: string[];
  crew_count?: string;
  duration?: string;
  sample_images?: string[];
}

export interface SoundDjPackage {
  id: string;
  business_id: string;
  title: string;
  package_type: 'sangeeth_dj' | 'barat_truck' | 'haldi_acoustic' | 'truss_pyro';
  base_price: number;
  is_negotiable?: boolean;
  power_output_watts?: string;
  equipment_highlights: string[];
  sample_images?: string[];
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
  authProvider?: 'google' | 'phone' | 'email';
  isEmailVerified?: boolean;
  partnerName?: string;
  weddingDate?: string;
  selectedCity: string;
  area_locality?: string;
  avatar_url?: string;
  businessId?: string;
  businessName?: string;
  businessCategory?: BusinessCategory;
  isProfileComplete?: boolean;
  vendorApplicationStatus?: 'not_applied' | 'pending_verification' | 'approved' | 'rejected';
  vendorApplicationId?: string;
  vendorCategories?: BusinessCategory[];
  vendorAadhaarLast4?: string;
}

export interface VendorApplication {
  id: string;
  user_id: string;
  business_name: string;
  primary_contact_name: string;
  phone: string;
  whatsapp_number: string;
  categories: BusinessCategory[];
  address_line: string;
  area_locality: string;
  city: string;
  pincode: string;
  id_proof_type: 'aadhaar' | 'pan' | 'trade_license' | 'gst';
  id_proof_last4: string;
  id_proof_doc_url?: string;
  portfolio_images: string[];
  base_starting_price: number;
  specs_notes?: string;
  status: 'pending_verification' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  updated_at?: string;
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

export interface CartQuotationItem {
  id: string;
  businessId: string;
  businessName: string;
  businessCategory: BusinessCategory;
  categoryType: string; // 'mandapam' | 'utilities' | 'catering' | 'photography' | 'sound' | 'other'
  title: string;
  specsSummary?: string;
  unitPrice: number;
  quantity: number;
  unitLabel: string; // 'event' | 'plate' | 'unit' | 'day'
  sampleImage?: string;
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
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'confirmed' | 'declined' | 'negotiating' | 'counter_offered';
  notes?: string;
  created_at?: string;
  cart_items?: CartQuotationItem[];
  customer_target_budget?: number;
  vendor_counter_price?: number;
  vendor_counter_notes?: string;
  negotiation_status?: 'standard' | 'quotation_requested' | 'counter_offered' | 'negotiation_accepted' | 'declined';
  negotiation_history?: Array<{
    sender: 'customer' | 'vendor';
    amount: number;
    notes?: string;
    timestamp: string;
  }>;
}

export type QuotationInquiry = BookingInquiry;

export interface Review {
  id: string;
  booking_id: string;
  business_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  rating: number;
  review_text: string;
  created_at: string;
}

export interface ReelComment {
  id: string;
  reel_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  comment_text: string;
  created_at: string;
}

export interface SupportMessage {
  id: string;
  user_id: string;
  user_name?: string;
  sender: 'user' | 'support' | 'vendor';
  message: string;
  created_at: string;
}

export interface CateringItem {
  id: string;
  business_id: string;
  category: 'starter' | 'curry' | 'rice' | 'sweet' | 'bread' | 'live_stall' | 'beverage';
  item_name: string;
  is_veg: boolean;
  base_price_per_plate: number;
  negotiable_price_per_plate?: number;
  is_available: boolean;
  created_at?: string;
}
