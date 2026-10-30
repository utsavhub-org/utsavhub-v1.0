-- ====================================================================
-- UtsavHub Supabase Database Schema (Complete Production Architecture)
-- Modules: Multi-Vendor Businesses, Venues, Modular Decor, Itemized Catering,
--          Booking Holds, Verified Reviews, Reel Comments, Wishlist & Support Chat
-- ====================================================================

-- Step 0: Clean up old versions of tables if they existed previously
DROP TABLE IF EXISTS public.support_messages CASCADE;
DROP TABLE IF EXISTS public.user_wishlists CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.reel_comments CASCADE;
DROP TABLE IF EXISTS public.catering_items CASCADE;
DROP TABLE IF EXISTS public.price_update_requests CASCADE;
DROP TABLE IF EXISTS public.booking_inquiries CASCADE;
DROP TABLE IF EXISTS public.media_reels CASCADE;
DROP TABLE IF EXISTS public.catering_addons CASCADE;
DROP TABLE IF EXISTS public.catering_packages CASCADE;
DROP TABLE IF EXISTS public.decor_items CASCADE;
DROP TABLE IF EXISTS public.venue_details CASCADE;
DROP TABLE IF EXISTS public.businesses CASCADE;
DROP TABLE IF EXISTS public.vendors CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

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

-- 2. Multi-Business Offerings Table (Vendor can post multiple businesses and toggle visibility)
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

-- 6. Itemized Catering Menu Items (Negotiable / customizable price after discussion)
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

-- 7. Catering Add-on Live Stalls
CREATE TABLE public.catering_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    stall_name TEXT NOT NULL,
    price_per_plate_extra NUMERIC(6,2) NOT NULL,
    description TEXT
);

-- 8. Media Video Walkthrough Reels
CREATE TABLE public.media_reels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    duration_seconds INT DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Reel Comments (Public reel interactive comments)
CREATE TABLE public.reel_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reel_id UUID REFERENCES public.media_reels(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Customer Booking Inquiries & Custom Holds
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

-- 11. Verified Reviews & Ratings (RESTRICTED ONLY TO CONFIRMED/COMPLETED BOOKINGS)
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.booking_inquiries(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. User Persistent Wishlists
CREATE TABLE public.user_wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, business_id)
);

-- 13. Support Chat Messages (Customer / Vendor chat with UtsavHub Concierge)
CREATE TABLE public.support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    user_name TEXT,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'support', 'vendor')),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Vendor Price Update Requests (Requires Admin Approval)
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

-- 15. User Profiles (Customer & Vendor sync from Supabase Auth)
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

-- 16. Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
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

-- 17. Permissive Policies for seamless connectivity
CREATE POLICY "Public read profiles" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Public insert profiles" ON public.user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update profiles" ON public.user_profiles FOR UPDATE USING (true);

CREATE POLICY "Public read vendors" ON public.vendors FOR SELECT USING (true);
CREATE POLICY "Public read businesses" ON public.businesses FOR SELECT USING (true);
CREATE POLICY "Vendor insert businesses" ON public.businesses FOR INSERT WITH CHECK (true);
CREATE POLICY "Vendor update businesses" ON public.businesses FOR UPDATE USING (true);

CREATE POLICY "Public read venue_details" ON public.venue_details FOR SELECT USING (true);
CREATE POLICY "Public read decor_items" ON public.decor_items FOR SELECT USING (true);
CREATE POLICY "Vendor update decor_items" ON public.decor_items FOR ALL USING (true);

CREATE POLICY "Public read catering_packages" ON public.catering_packages FOR SELECT USING (true);
CREATE POLICY "Public read catering_items" ON public.catering_items FOR SELECT USING (true);
CREATE POLICY "Vendor manage catering_items" ON public.catering_items FOR ALL USING (true);

CREATE POLICY "Public read reels" ON public.media_reels FOR SELECT USING (true);
CREATE POLICY "Vendor insert reels" ON public.media_reels FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read reel comments" ON public.reel_comments FOR SELECT USING (true);
CREATE POLICY "Public insert reel comments" ON public.reel_comments FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read inquiries" ON public.booking_inquiries FOR SELECT USING (true);
CREATE POLICY "Public insert inquiries" ON public.booking_inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update inquiries" ON public.booking_inquiries FOR UPDATE USING (true);

CREATE POLICY "Public read reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Verified insert reviews" ON public.reviews FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.booking_inquiries b
        WHERE b.id = booking_id AND b.status IN ('approved', 'completed')
    )
);

CREATE POLICY "Public manage wishlists" ON public.user_wishlists FOR ALL USING (true);
CREATE POLICY "Public manage support_messages" ON public.support_messages FOR ALL USING (true);
CREATE POLICY "Public manage price_requests" ON public.price_update_requests FOR ALL USING (true);

-- 18. Seed Live Vendor, Multiple Businesses, Catering Items, and Verified Review
INSERT INTO public.vendors (id, business_name, primary_contact_name, phone, whatsapp_number, city, area_locality)
VALUES 
('11111111-1111-1111-1111-111111111111', 'Grand Swarna Group', 'K. Narayana Rao', '+91 98480 12345', '919848012345', 'Visakhapatnam', 'Madhurawada, NH16 Highway');

-- Business 1: Convention Hall
INSERT INTO public.businesses (id, vendor_id, category, name, cover_image_url, is_active, display_order)
VALUES 
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'venue', 'Grand Swarna Palace Convention Hall', 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800', true, 1);

-- Business 2: Royal Catering Services
INSERT INTO public.businesses (id, vendor_id, category, name, cover_image_url, is_active, display_order)
VALUES 
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'catering', 'Swarna Royal Andhra & Mughlai Catering', 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800', true, 2);

-- Business 3: Luxury Mandapam Decorators
INSERT INTO public.businesses (id, vendor_id, category, name, cover_image_url, is_active, display_order)
VALUES 
('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'decoration', 'Swarna Kalakshetra Luxury Mandapam & Floral Decor', 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800', true, 3);

INSERT INTO public.venue_details (business_id, seating_capacity, floating_capacity, ac_rooms_count, base_rental_price, is_ac)
VALUES 
('22222222-2222-2222-2222-222222222222', 800, 1500, 8, 175000.00, true);

INSERT INTO public.decor_items (business_id, element_type, title, dimensions, flower_type, base_price)
VALUES 
('22222222-2222-2222-2222-222222222222', 'mandapam', 'Tirumala Temple Gopuram Mandapam', '30x20 ft', 'Fresh Marigold & Jasmine', 125000.00),
('22222222-2222-2222-2222-222222222222', 'mandapam', 'Pastel Blossom Floral Canopy Mandapam', '24x18 ft', 'Exotic Lilies & Carnations', 160000.00),
('22222222-2222-2222-2222-222222222222', 'wayworks_entrance', '100ft Royal Archway Tunnel with Fairylights', '100 ft length', 'Floral Garlands & Fairy Lights', 45000.00),
('22222222-2222-2222-2222-222222222222', 'haldi_mehendi', 'Traditional Marigold Jhula & Photo-Booth', '15x12 ft', 'Pure Yellow & Orange Marigold', 28000.00);

-- Itemized Catering Items with base and negotiable prices
INSERT INTO public.catering_items (business_id, category, item_name, is_veg, base_price_per_plate, negotiable_price_per_plate)
VALUES
('33333333-3333-3333-3333-333333333333', 'sweet', 'Special Pootharekulu with Ghee & Dryfruits', true, 60.00, 50.00),
('33333333-3333-3333-3333-333333333333', 'sweet', 'Kaju Katli & Bellam Jalebi', true, 75.00, 65.00),
('33333333-3333-3333-3333-333333333333', 'starter', 'Crispy Corn Salt & Pepper', true, 45.00, 40.00),
('33333333-3333-3333-3333-333333333333', 'starter', 'Apollo Fish Fry / Gongura Chicken Tikka', false, 110.00, 95.00),
('33333333-3333-3333-3333-333333333333', 'curry', 'Paneer Butter Masala (Rich Cashew Gravy)', true, 65.00, 55.00),
('33333333-3333-3333-3333-333333333333', 'curry', 'Andhra Gutti Vankaya Kura', true, 50.00, 45.00),
('33333333-3333-3333-3333-333333333333', 'curry', 'Natukodi Pulusu with Garelu', false, 140.00, 125.00),
('33333333-3333-3333-3333-333333333333', 'rice', 'Ulava Charu Dum Biryani with Raita', true, 85.00, 75.00),
('33333333-3333-3333-3333-333333333333', 'rice', 'Hyderabadi Zafrani Mutton Dum Biryani', false, 180.00, 160.00),
('33333333-3333-3333-3333-333333333333', 'live_stall', 'Live Pan & Mocktails Bar', true, 55.00, 45.00);

-- Reels
INSERT INTO public.media_reels (id, business_id, title, video_url, thumbnail_url, duration_seconds)
VALUES 
('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'Grand Swarna Palace Main Hall Lighting & Mandapam Walkthrough', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600', 30);

-- Booking Seed for Verified Review Testing
INSERT INTO public.booking_inquiries (id, business_id, customer_name, customer_phone, event_date, guest_count, vendor_base_amount, final_customer_amount, status, notes)
VALUES
('66666666-6666-6666-6666-666666666666', '22222222-2222-2222-2222-222222222222', 'Ananya & Rahul', '+91 98480 12345', '2026-10-15', 500, 175000.00, 192500.00, 'completed', 'Grand reception completed beautifully!');

-- Verified Review linked to completed booking
INSERT INTO public.reviews (booking_id, business_id, user_id, user_name, user_avatar, rating, review_text)
VALUES
('66666666-6666-6666-6666-666666666666', '22222222-2222-2222-2222-222222222222', 'usr-cust-1', 'Ananya & Rahul', 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400', 5, 'Exceptional venue! The centralized AC was freezing despite 600 guests, and Narayana Rao sir supported our family throughout the muhurtham.');
