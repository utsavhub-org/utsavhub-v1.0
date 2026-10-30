-- ====================================================================
-- UtsavHub Supabase Database Schema (Clean Migration)
-- Modules: Venues, Modular Decor, Tiered Catering, Booking Holds & Inquiries
-- ====================================================================

-- Step 0: Clean up old versions of tables if they existed previously
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.price_update_requests CASCADE;
DROP TABLE IF EXISTS public.booking_inquiries CASCADE;
DROP TABLE IF EXISTS public.media_reels CASCADE;
DROP TABLE IF EXISTS public.catering_addons CASCADE;
DROP TABLE IF EXISTS public.catering_packages CASCADE;
DROP TABLE IF EXISTS public.decor_items CASCADE;
DROP TABLE IF EXISTS public.venue_details CASCADE;
DROP TABLE IF EXISTS public.businesses CASCADE;
DROP TABLE IF EXISTS public.vendors CASCADE;

-- 1. Vendors Master Table
CREATE TABLE public.vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    business_name TEXT NOT NULL,
    primary_contact_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    email TEXT,
    city TEXT NOT NULL DEFAULT 'Visakhapatnam',
    area_locality TEXT NOT NULL,
    address TEXT,
    is_verified BOOLEAN DEFAULT false,
    rating_avg NUMERIC(3,2) DEFAULT 4.8,
    review_count INT DEFAULT 12,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Businesses Category Table (Linked to vendors)
CREATE TABLE public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('venue', 'catering', 'decoration', 'photography')),
    name TEXT NOT NULL,
    cover_image_url TEXT,
    gallery_images TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Convention Hall / Venue Specifications
CREATE TABLE public.venue_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
    is_ac BOOLEAN DEFAULT true,
    seating_capacity INT NOT NULL,
    floating_capacity INT NOT NULL,
    ac_rooms_count INT DEFAULT 4,
    parking_cars INT DEFAULT 100,
    outside_catering_allowed BOOLEAN DEFAULT true,
    base_rental_price NUMERIC(10,2) NOT NULL,
    power_backup_kva INT DEFAULT 125,
    dining_hall_capacity INT DEFAULT 350
);

-- 4. Modular Decor Elements (Mandapam stage, Wayworks tunnel, Haldi/Mehendi)
CREATE TABLE public.decor_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    element_type TEXT NOT NULL CHECK (element_type IN ('mandapam', 'wayworks_entrance', 'reception_backdrop', 'haldi_mehendi', 'lighting_fx')),
    title TEXT NOT NULL,
    dimensions TEXT,
    flower_type TEXT,
    base_price NUMERIC(10,2) NOT NULL,
    sample_images TEXT[] DEFAULT '{}',
    is_customizable BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tiered Catering Packages
CREATE TABLE public.catering_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    package_name TEXT NOT NULL,
    diet_type TEXT NOT NULL CHECK (diet_type IN ('veg', 'non_veg', 'mixed')),
    service_type TEXT NOT NULL DEFAULT 'buffet',
    price_per_plate NUMERIC(8,2) NOT NULL,
    min_guest_count INT DEFAULT 200,
    menu_pdf_url TEXT,
    sweets_count INT DEFAULT 3,
    curries_count INT DEFAULT 4,
    menu_highlights TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Catering Add-on Live Stalls
CREATE TABLE public.catering_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    stall_name TEXT NOT NULL,
    price_per_plate_extra NUMERIC(6,2) NOT NULL,
    description TEXT
);

-- 7. Media Video Walkthrough Reels
CREATE TABLE public.media_reels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    duration_seconds INT DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Customer Booking Inquiries & Custom Choices
CREATE TABLE public.booking_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    event_date DATE NOT NULL,
    guest_count INT NOT NULL,
    selected_decor_ids UUID[] DEFAULT '{}',
    selected_catering_package_id UUID REFERENCES public.catering_packages(id) ON DELETE SET NULL,
    selected_addon_ids UUID[] DEFAULT '{}',
    vendor_base_amount NUMERIC(10,2) NOT NULL,
    admin_commission_percentage NUMERIC(4,2) DEFAULT 10.0,
    final_customer_amount NUMERIC(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Vendor Price Update Requests (Requires Admin Approval)
CREATE TABLE public.price_update_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL,
    item_id UUID,
    current_price NUMERIC(10,2) NOT NULL,
    proposed_base_price NUMERIC(10,2) NOT NULL,
    admin_percentage NUMERIC(4,2) DEFAULT 10.0,
    admin_markup_amount NUMERIC(10,2) NOT NULL,
    final_customer_price NUMERIC(10,2) NOT NULL,
    status TEXT DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'rejected')),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- 10. User Profiles (Customer & Vendor sync from Firebase Phone Auth)
CREATE TABLE public.user_profiles (
    id TEXT PRIMARY KEY,
    phone TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'vendor')),
    city TEXT DEFAULT 'Visakhapatnam',
    area_locality TEXT,
    avatar_url TEXT,
    wedding_date DATE,
    partner_name TEXT,
    business_name TEXT,
    business_category TEXT,
    is_profile_complete BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decor_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catering_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_update_requests ENABLE ROW LEVEL SECURITY;

-- 12. Public Read & Insert Policies
CREATE POLICY "Public can view profiles" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Public can insert profiles" ON public.user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update profiles" ON public.user_profiles FOR UPDATE USING (true);
CREATE POLICY "Public can view vendors" ON public.vendors FOR SELECT USING (true);
CREATE POLICY "Public can view businesses" ON public.businesses FOR SELECT USING (true);
CREATE POLICY "Public can view venue specs" ON public.venue_details FOR SELECT USING (true);
CREATE POLICY "Public can view decor items" ON public.decor_items FOR SELECT USING (true);
CREATE POLICY "Public can view catering packages" ON public.catering_packages FOR SELECT USING (true);
CREATE POLICY "Public can view reels" ON public.media_reels FOR SELECT USING (true);
CREATE POLICY "Public can insert inquiries" ON public.booking_inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can view inquiries" ON public.booking_inquiries FOR SELECT USING (true);
CREATE POLICY "Public can insert price requests" ON public.price_update_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can view price requests" ON public.price_update_requests FOR SELECT USING (true);

-- 12. Seed Real Vendor & Venue
INSERT INTO public.vendors (id, business_name, primary_contact_name, phone, whatsapp_number, city, area_locality)
VALUES 
('11111111-1111-1111-1111-111111111111', 'Grand Swarna Palace Convention Hall', 'K. Narayana Rao', '+91 98480 12345', '919848012345', 'Visakhapatnam', 'Madhurawada, NH16 Highway');

INSERT INTO public.businesses (id, vendor_id, category, name, cover_image_url)
VALUES 
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'venue', 'Grand Swarna Palace Convention Hall', 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800');

INSERT INTO public.venue_details (business_id, seating_capacity, floating_capacity, ac_rooms_count, base_rental_price, is_ac)
VALUES 
('22222222-2222-2222-2222-222222222222', 800, 1500, 8, 175000.00, true);

INSERT INTO public.decor_items (business_id, element_type, title, dimensions, flower_type, base_price)
VALUES 
('22222222-2222-2222-2222-222222222222', 'mandapam', 'Tirumala Temple Gopuram Mandapam', '30x20 ft', 'Fresh Marigold & Jasmine', 125000.00),
('22222222-2222-2222-2222-222222222222', 'mandapam', 'Pastel Blossom Floral Canopy Mandapam', '24x18 ft', 'Exotic Lilies & Carnations', 160000.00),
('22222222-2222-2222-2222-222222222222', 'wayworks_entrance', '100ft Royal Archway Tunnel with Fairylights', '100 ft length', 'Floral Garlands & Fairy Lights', 45000.00),
('22222222-2222-2222-2222-222222222222', 'haldi_mehendi', 'Traditional Marigold Jhula & Photo-Booth', '15x12 ft', 'Pure Yellow & Orange Marigold', 28000.00);

INSERT INTO public.catering_packages (business_id, package_name, diet_type, price_per_plate, min_guest_count, menu_highlights)
VALUES 
('22222222-2222-2222-2222-222222222222', 'South Indian Royal Kalyana Feast', 'veg', 450.00, 300, ARRAY['Pootharekulu', 'Kaju Katli', 'Paneer Butter Masala', 'Gutti Vankaya', 'Ulava Charu Biryani', 'Paan Stall']),
('22222222-2222-2222-2222-222222222222', 'Nawab Non-Veg Grand Spread', 'non_veg', 750.00, 300, ARRAY['Mutton Dum Biryani', 'Natukodi Pulusu', 'Apollo Fish Fry', 'Live Tandoori Kebabs', 'Dum Ka Roat Halwa']);
