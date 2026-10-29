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
  decor_catalogues?: DecorCatalogue[];
  media_reels?: MediaReel[];
  availability_calendar?: AvailabilitySlot[];
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

export interface BookingInquiry {
  id?: string;
  business_id: string;
  customer_name: string;
  customer_phone: string;
  event_date: string;
  guest_count: number;
  total_estimated_amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  notes?: string;
  created_at?: string;
}
