-- ============================================================================
-- UTSAVHUB: PRODUCTION DATABASE MIGRATION & SCHEMA FIXES
-- Apply this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/dckmxhqpextqzoreogva/sql
-- ============================================================================

-- 1. Create vendor_applications table (for official vendor registration & review)
CREATE TABLE IF NOT EXISTS public.vendor_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    business_name TEXT NOT NULL,
    primary_contact_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp_number TEXT,
    categories TEXT[] NOT NULL DEFAULT '{}',
    address_line TEXT,
    area_locality TEXT NOT NULL,
    city TEXT NOT NULL,
    pincode TEXT,
    id_proof_type TEXT DEFAULT 'aadhaar',
    id_proof_last4 TEXT,
    id_proof_doc_url TEXT,
    portfolio_images TEXT[] DEFAULT '{}',
    base_starting_price NUMERIC(12,2) DEFAULT 0,
    specs_notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'under_review', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookup by user_id and phone
CREATE INDEX IF NOT EXISTS idx_vendor_apps_user_phone ON public.vendor_applications(user_id, phone);

-- 2. Create photography_packages table
CREATE TABLE IF NOT EXISTS public.photography_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    package_type TEXT NOT NULL DEFAULT '3day_wedding',
    base_price NUMERIC(12,2) NOT NULL DEFAULT 50000,
    is_negotiable BOOLEAN DEFAULT true,
    duration TEXT DEFAULT 'Full Day',
    crew_count TEXT DEFAULT '3 Professionals',
    deliverables TEXT[] DEFAULT '{}',
    sample_images TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photo_pkg_biz ON public.photography_packages(business_id);

-- 3. Create dj_sound_packages table
CREATE TABLE IF NOT EXISTS public.dj_sound_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    package_type TEXT NOT NULL DEFAULT 'sangeeth_dj',
    base_price NUMERIC(12,2) NOT NULL DEFAULT 25000,
    is_negotiable BOOLEAN DEFAULT true,
    power_output_watts TEXT DEFAULT '10,000 Watts RMS',
    equipment_highlights TEXT[] DEFAULT '{}',
    sample_images TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dj_sound_pkg_biz ON public.dj_sound_packages(business_id);

-- 4. Add missing column item_name to price_update_requests
ALTER TABLE public.price_update_requests 
ADD COLUMN IF NOT EXISTS item_name TEXT;

-- 5. Expand decor_items element_type check constraint to include all Telugu wedding & utility types
DO $$
BEGIN
    -- Drop old restrictive constraint if it exists
    ALTER TABLE public.decor_items 
    DROP CONSTRAINT IF EXISTS decor_items_element_type_check;

    -- Add updated check constraint with utilities, tents, chairs, and all ceremonies
    ALTER TABLE public.decor_items 
    ADD CONSTRAINT decor_items_element_type_check 
    CHECK (element_type IN (
        'mandapam', 
        'wayworks_entrance', 
        'reception_backdrop', 
        'haldi_mehendi', 
        'lighting_fx', 
        'sangeeth', 
        'rata_muhurtham', 
        'kalagollu_sambaralu', 
        'home_decor', 
        'utilities', 
        'other'
    ));
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Constraint update notice: %', SQLERRM;
END $$;

-- 6. Expand booking_inquiries check constraint and add quotation negotiation columns
DO $$
BEGIN
    -- Drop old status constraint if it exists
    ALTER TABLE public.booking_inquiries 
    DROP CONSTRAINT IF EXISTS booking_inquiries_status_check;

    -- Add flexible status constraint covering negotiation states
    ALTER TABLE public.booking_inquiries 
    ADD CONSTRAINT booking_inquiries_status_check 
    CHECK (status IN (
        'pending', 
        'approved', 
        'rejected', 
        'confirmed', 
        'declined', 
        'completed', 
        'negotiating', 
        'counter_offered'
    ));
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Inquiries constraint notice: %', SQLERRM;
END $$;

-- Add quotation and negotiation columns to booking_inquiries
ALTER TABLE public.booking_inquiries 
ADD COLUMN IF NOT EXISTS cart_items JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS customer_target_budget NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS vendor_counter_price NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS vendor_counter_notes TEXT,
ADD COLUMN IF NOT EXISTS negotiation_status TEXT DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS negotiation_history JSONB DEFAULT '[]'::jsonb;

-- 7. Add vendor_application_status to user_profiles if missing
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS vendor_application_status TEXT DEFAULT 'not_applied';

-- 8. Enable Row Level Security (RLS) & permissive policies for active app access
ALTER TABLE public.vendor_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photography_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dj_sound_packages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Public read vendor applications" ON public.vendor_applications;
    CREATE POLICY "Public read vendor applications" ON public.vendor_applications FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public insert vendor applications" ON public.vendor_applications;
    CREATE POLICY "Public insert vendor applications" ON public.vendor_applications FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS "Public update vendor applications" ON public.vendor_applications;
    CREATE POLICY "Public update vendor applications" ON public.vendor_applications FOR UPDATE USING (true);

    DROP POLICY IF EXISTS "Public read photography packages" ON public.photography_packages;
    CREATE POLICY "Public read photography packages" ON public.photography_packages FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public insert photography packages" ON public.photography_packages;
    CREATE POLICY "Public insert photography packages" ON public.photography_packages FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS "Public read dj sound packages" ON public.dj_sound_packages;
    CREATE POLICY "Public read dj sound packages" ON public.dj_sound_packages FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public insert dj sound packages" ON public.dj_sound_packages;
    CREATE POLICY "Public insert dj sound packages" ON public.dj_sound_packages FOR INSERT WITH CHECK (true);
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Policy setup notice: %', SQLERRM;
END $$;

