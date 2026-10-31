-- ====================================================================
-- UTSAVHUB MASTER DATABASE SETUP & SEED SCRIPT
-- Visakhapatnam's #1 Ultra-Luxury Wedding & Event Operating Platform
-- Run this directly in Supabase SQL Editor (Dashboard -> SQL Editor -> New Query -> Run)
-- ====================================================================

-- 1. CLEAN UP EXISTING SCHEMAS SAFELY
DROP TABLE IF EXISTS public.support_messages CASCADE;
DROP TABLE IF EXISTS public.user_wishlists CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.reel_comments CASCADE;
DROP TABLE IF EXISTS public.catering_items CASCADE;
DROP TABLE IF EXISTS public.catering_addons CASCADE;
DROP TABLE IF EXISTS public.price_update_requests CASCADE;
DROP TABLE IF EXISTS public.booking_inquiries CASCADE;
DROP TABLE IF EXISTS public.media_reels CASCADE;
DROP TABLE IF EXISTS public.catering_packages CASCADE;
DROP TABLE IF EXISTS public.decor_items CASCADE;
DROP TABLE IF EXISTS public.venue_details CASCADE;
DROP TABLE IF EXISTS public.businesses CASCADE;
DROP TABLE IF EXISTS public.vendors CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- 2. VENDORS MASTER TABLE
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
    is_verified BOOLEAN DEFAULT true,
    rating_avg NUMERIC(3,2) DEFAULT 4.9,
    review_count INT DEFAULT 18,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BUSINESSES TABLE (Venues, Caterers, Decorators, Photography, DJ Sound)
CREATE TABLE public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('venue', 'catering', 'decoration', 'photography', 'dj_sound')),
    name TEXT NOT NULL,
    cover_image_url TEXT,
    gallery_images TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    display_order INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CONVENTION HALL / VENUE SPECIFICATIONS
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

-- 5. MODULAR DECOR ELEMENTS
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

-- 6. TIERED CATERING PACKAGES
CREATE TABLE public.catering_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    package_name TEXT NOT NULL,
    diet_type TEXT NOT NULL CHECK (diet_type IN ('veg', 'non_veg', 'mixed')),
    service_type TEXT NOT NULL DEFAULT 'buffet',
    price_per_plate NUMERIC(8,2) NOT NULL,
    min_guest_count INT DEFAULT 100,
    menu_pdf_url TEXT,
    sweets_count INT DEFAULT 3,
    curries_count INT DEFAULT 4,
    menu_highlights TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ITEMIZED CATERING ITEMS (Negotiable / Custom Selection)
CREATE TABLE public.catering_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('starter', 'curry', 'rice', 'sweet', 'bread', 'live_stall', 'beverage')),
    item_name TEXT NOT NULL,
    is_veg BOOLEAN DEFAULT true,
    base_price_per_plate NUMERIC(8,2) NOT NULL,
    negotiable_price_per_plate NUMERIC(8,2),
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CATERING ADD-ON LIVE STALLS
CREATE TABLE public.catering_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    stall_name TEXT NOT NULL,
    price_per_plate_extra NUMERIC(6,2) NOT NULL,
    description TEXT
);

-- 9. MEDIA VIDEO WALKTHROUGH REELS
CREATE TABLE public.media_reels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    duration_seconds INT DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. REEL COMMENTS
CREATE TABLE public.reel_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reel_id UUID REFERENCES public.media_reels(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. CUSTOMER BOOKING INQUIRIES & DATES
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

-- 12. VERIFIED REVIEWS & RATINGS
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.booking_inquiries(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. USER PERSISTENT WISHLISTS
CREATE TABLE public.user_wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, business_id)
);

-- 14. SUPPORT CHAT MESSAGES
CREATE TABLE public.support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    user_name TEXT,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'support', 'vendor')),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. VENDOR PRICE UPDATE REQUESTS (Admin Approvals)
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

-- 16. USER PROFILES
CREATE TABLE public.user_profiles (
    id TEXT PRIMARY KEY,
    phone TEXT,
    email TEXT,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'vendor')),
    city TEXT DEFAULT 'Visakhapatnam',
    area_locality TEXT,
    avatar_url TEXT,
    wedding_date DATE,
    partner_name TEXT,
    business_id UUID,
    business_name TEXT,
    business_category TEXT,
    is_profile_complete BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Permissive policies for mobile app & vendor dashboard access
-- ====================================================================

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decor_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catering_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catering_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catering_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reel_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_update_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public full vendors" ON public.vendors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full businesses" ON public.businesses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full venue_details" ON public.venue_details FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full decor_items" ON public.decor_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full catering_packages" ON public.catering_packages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full catering_items" ON public.catering_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full catering_addons" ON public.catering_addons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full media_reels" ON public.media_reels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full reel_comments" ON public.reel_comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full booking_inquiries" ON public.booking_inquiries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full reviews" ON public.reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full user_wishlists" ON public.user_wishlists FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full support_messages" ON public.support_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full price_requests" ON public.price_update_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full user_profiles" ON public.user_profiles FOR ALL USING (true) WITH CHECK (true);

-- ====================================================================
-- SEED DATA: 7 VERIFIED VENDORS & MULTI-CATEGORY BUSINESS CATALOG
-- ====================================================================

-- 1. Vendors
INSERT INTO public.vendors (id, business_name, primary_contact_name, phone, whatsapp_number, email, city, area_locality, address, is_verified, rating_avg, review_count)
VALUES
('00000000-0000-0000-0000-000000000001', 'Grand Swarna Luxury Group', 'K. Narayana Rao', '+91 98480 12345', '919848012345', 'info@grandswarna.com', 'Visakhapatnam', 'Madhurawada, NH16 Highway', 'Plot 45-52, Near Car Shed Junction, Madhurawada, Visakhapatnam', true, 4.9, 186),
('00000000-0000-0000-0000-000000000002', 'Mayuri Hospitality & Resorts', 'P. Ramesh Varma', '+91 98481 23456', '919848123456', 'contact@royalmayuri.com', 'Visakhapatnam', 'Rushikonda Beach Road', 'Beach Road, Opposite IT SEZ, Rushikonda, Visakhapatnam', true, 4.8, 142),
('00000000-0000-0000-0000-000000000003', 'Sree Venkateswara Mandapam Trust', 'B. Satyanarayana', '+91 98482 34567', '919848234567', 'svkalyana@gmail.com', 'Visakhapatnam', 'MVP Colony, Sector 3', 'Sector 3, MVP Double Road, MVP Colony, Visakhapatnam', true, 4.7, 98),
('00000000-0000-0000-0000-000000000004', 'Annapurna Royal Caterers & Sweets', 'G. Krishna Murthy', '+91 99880 11223', '919988011223', 'orders@annapurnaroyal.in', 'Visakhapatnam', 'Dwaraka Nagar, Main Road', 'D.No 47-10-18, Diamond Park Road, Dwaraka Nagar, Visakhapatnam', true, 4.9, 312),
('00000000-0000-0000-0000-000000000005', 'Sanskriti Luxury Decorators', 'M. Venkat Rao', '+91 97770 33445', '919777033445', 'events@sanskritimandapam.com', 'Visakhapatnam', 'Siripuram Junction', 'Siripuram Towers, VIP Road, Visakhapatnam', true, 4.9, 240),
('00000000-0000-0000-0000-000000000006', 'Vedic Stories 4K Wedding Cinema', 'S. Aditya', '+91 98480 33445', '919848033445', 'aditya@vedicstories.com', 'Visakhapatnam', 'Siripuram Junction', '3rd Floor, Dutt Island, Siripuram, Visakhapatnam', true, 4.95, 94),
('00000000-0000-0000-0000-000000000007', 'Royal Swara DJ & Acoustic Orchestra', 'D. Praveen Kumar', '+91 98480 77889', '919848077889', 'praveen@royalswara.com', 'Visakhapatnam', 'Dwaraka Nagar, Main Road', 'Lane 4, Beside RTC Complex, Dwaraka Nagar, Visakhapatnam', true, 4.88, 67);

-- 2. Businesses
INSERT INTO public.businesses (id, vendor_id, category, name, cover_image_url, gallery_images, is_active, display_order)
VALUES
(
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000001',
    'venue',
    'Grand Swarna Palace Convention Hall',
    'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
    ARRAY['https://images.unsplash.com/photo-1544077960-604201fe74bc?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80'],
    true,
    1
),
(
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000002',
    'venue',
    'Royal Mayuri AC Mandapam & Resort',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    ARRAY['https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80'],
    true,
    2
),
(
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000003',
    'venue',
    'Sree Venkateswara AC Kalyana Mandapam',
    'https://images.unsplash.com/photo-1519225438855-879e602484f9?auto=format&fit=crop&w=1200&q=80',
    ARRAY['https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80'],
    true,
    3
),
(
    '44444444-4444-4444-4444-444444444444',
    '00000000-0000-0000-0000-000000000004',
    'catering',
    'Annapurna Royal Caterers & Sweets',
    'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80',
    ARRAY['https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80'],
    true,
    4
),
(
    '66666666-6666-6666-6666-666666666666',
    '00000000-0000-0000-0000-000000000005',
    'decoration',
    'Sanskriti Mandapam & Luxury Decor',
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
    ARRAY['https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&w=800&q=80'],
    true,
    5
),
(
    '77777777-7777-7777-7777-777777777777',
    '00000000-0000-0000-0000-000000000006',
    'photography',
    'Vedic Stories 4K Wedding Cinema',
    'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=80',
    ARRAY['https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80'],
    true,
    6
),
(
    '88888888-8888-8888-8888-888888888888',
    '00000000-0000-0000-0000-000000000007',
    'dj_sound',
    'Royal Swara DJ & Acoustic Orchestra',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
    ARRAY['https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80'],
    true,
    7
);

-- 3. Venue Details
INSERT INTO public.venue_details (business_id, is_ac, seating_capacity, floating_capacity, ac_rooms_count, parking_cars, outside_catering_allowed, base_rental_price, power_backup_kva, dining_hall_capacity)
VALUES
('11111111-1111-1111-1111-111111111111', true, 800, 1500, 6, 120, true, 175000.00, 150, 450),
('22222222-2222-2222-2222-222222222222', true, 500, 1000, 4, 80, false, 125000.00, 120, 300),
('33333333-3333-3333-3333-333333333333', true, 350, 700, 2, 45, true, 85000.00, 80, 200);

-- 4. Decor Items
INSERT INTO public.decor_items (business_id, element_type, title, dimensions, flower_type, base_price, sample_images, is_customizable)
VALUES
('66666666-6666-6666-6666-666666666666', 'mandapam', 'Tirumala Temple Gopuram Mandapam', '30x20 ft', 'Fresh Marigold & Jasmine', 125000.00, ARRAY['https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80'], true),
('66666666-6666-6666-6666-666666666666', 'mandapam', 'Pastel Blossom Floral Canopy Mandapam', '24x18 ft', 'Exotic Lilies & Carnations', 160000.00, ARRAY['https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&w=800&q=80'], true),
('66666666-6666-6666-6666-666666666666', 'wayworks_entrance', '100ft Royal Archway Tunnel with Fairylights', '100 ft length', 'Floral Garlands & Fairy Lights', 45000.00, ARRAY['https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80'], true),
('66666666-6666-6666-6666-666666666666', 'haldi_mehendi', 'Traditional Marigold Jhula & Photo-Booth', '15x12 ft', 'Pure Yellow & Orange Marigold', 28000.00, ARRAY['https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80'], true);

-- 5. Catering Packages
INSERT INTO public.catering_packages (business_id, package_name, diet_type, service_type, price_per_plate, min_guest_count, sweets_count, curries_count, menu_highlights, menu_pdf_url)
VALUES
(
    '44444444-4444-4444-4444-444444444444',
    'Royal Andhra Grand Feast (Veg)',
    'veg',
    'buffet',
    450.00,
    100,
    4,
    5,
    ARRAY['Paneer Tikka Live Counter', 'Shahi Kaju Curry', 'Authentic Gutti Vankaya', 'Traditional Bellam Pulihora', 'Gongura Rice & Pure Ghee', 'Hot Gulab Jamun with Rabdi'],
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
),
(
    '44444444-4444-4444-4444-444444444444',
    'Maharaja Sovereign Buffet (Non-Veg)',
    'non_veg',
    'buffet',
    750.00,
    100,
    4,
    6,
    ARRAY['Authentic Mutton Dum Biryani', 'Spicy Natukodi Vepudu', 'Apollo Fish Fillet', 'Butter Naan & Paneer Masala', 'Apricot Delight Dessert'],
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
);

-- 6. Itemized Catering Menu Items
INSERT INTO public.catering_items (business_id, category, item_name, is_veg, base_price_per_plate, negotiable_price_per_plate)
VALUES
('44444444-4444-4444-4444-444444444444', 'sweet', 'Special Pootharekulu with Ghee & Dryfruits', true, 60.00, 50.00),
('44444444-4444-4444-4444-444444444444', 'sweet', 'Kaju Katli & Bellam Jalebi', true, 75.00, 65.00),
('44444444-4444-4444-4444-444444444444', 'starter', 'Crispy Corn Salt & Pepper', true, 45.00, 40.00),
('44444444-4444-4444-4444-444444444444', 'starter', 'Apollo Fish Fry / Gongura Chicken Tikka', false, 110.00, 95.00),
('44444444-4444-4444-4444-444444444444', 'curry', 'Paneer Butter Masala (Rich Cashew Gravy)', true, 65.00, 55.00),
('44444444-4444-4444-4444-444444444444', 'curry', 'Andhra Gutti Vankaya Kura', true, 50.00, 45.00),
('44444444-4444-4444-4444-444444444444', 'curry', 'Natukodi Pulusu with Garelu', false, 140.00, 125.00),
('44444444-4444-4444-4444-444444444444', 'rice', 'Ulava Charu Dum Biryani with Raita', true, 85.00, 75.00),
('44444444-4444-4444-4444-444444444444', 'rice', 'Hyderabadi Zafrani Mutton Dum Biryani', false, 180.00, 160.00),
('44444444-4444-4444-4444-444444444444', 'live_stall', 'Live Pan & Mocktails Bar', true, 55.00, 45.00);

-- 7. Catering Add-on Live Stalls
INSERT INTO public.catering_addons (business_id, stall_name, price_per_plate_extra, description)
VALUES
('44444444-4444-4444-4444-444444444444', 'Live Chaat & Pani Puri Counter', 45.00, '6 varieties of flavored water, dahi puri, sev puri and live chef setup.'),
('44444444-4444-4444-4444-444444444444', 'Tandoori Kebab Live Charcoal Grill', 80.00, 'Paneer tikka, seekh kebabs, and tandoori rotis cooked fresh on live coals.'),
('44444444-4444-4444-4444-444444444444', 'Artisanal Ice Cream & Banarasi Paan Stall', 35.00, 'Rolled stone ice creams with assorted toppings and authentic Banarasi meetha paan.');

-- 8. Media Video Reels
INSERT INTO public.media_reels (business_id, title, video_url, thumbnail_url, duration_seconds)
VALUES
('11111111-1111-1111-1111-111111111111', 'Grand Swarna Night Illumination & Hall Walkthrough', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=80', 24),
('22222222-2222-2222-2222-222222222222', 'Beachside Sunset Mandapam Setup at Royal Mayuri', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80', 18),
('44444444-4444-4444-4444-444444444444', 'Live Dum Biryani Handi & Jalebi Counter in Action', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4', 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=600&q=80', 22),
('66666666-6666-6666-6666-666666666666', 'Behind the Scenes: 40ft Golden Temple Mandapam Erection', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80', 28),
('77777777-7777-7777-7777-777777777777', 'Teaser: Traditional Telugu Muhurtham Cinematic Highlights', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=600&q=80', 30),
('88888888-8888-8888-8888-888888888888', 'Sangeet Night Live Sound & Lighting FX', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80', 22);

-- 9. Verified Reviews
INSERT INTO public.reviews (business_id, user_id, user_name, user_avatar, rating, review_text)
VALUES
('11111111-1111-1111-1111-111111111111', 'cust-v1', 'Ananya & Rahul', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400', 5, 'Grand Swarna Palace was an absolute dream for our 1,200 guest wedding reception! The centralized AC maintained comfortable coolness, parking was seamless, and the venue staff was deeply attentive.'),
('44444444-4444-4444-4444-444444444444', 'cust-v2', 'Dr. S. K. Murthy', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 5, 'Annapurna Caterers delivered exceptional quality. The Pootharekulu with pure cow ghee and authentic Natukodi Pulusu with hot garelu became the talk of our wedding celebration.'),
('66666666-6666-6666-6666-666666666666', 'cust-v3', 'Pooja & Karthik', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', 5, 'Sanskriti Mandapam created a celestial Tirumala Temple backdrop. Every fresh flower garland was vibrant, fragrant, and flawlessly arranged.');

-- ====================================================================
-- SUCCESS NOTICE
-- Tables, RLS, and Catalog Seed Loaded.
-- ====================================================================

