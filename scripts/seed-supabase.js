const { createClient } = require('@supabase/supabase-js');
const s = createClient(
  'https://dckmxhqpextqzoreogva.supabase.co',
  'sb_publishable_aYk2pFVQSJi0cvD8E8tdbQ_wPGq6qTm'
);

async function seed() {
  console.log('Seeding full multi-vendor catalog into live Supabase...');

  // 1. Vendors
  const vendors = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      business_name: 'Grand Swarna Palace Convention Hall',
      primary_contact_name: 'K. Narayana Rao (General Manager)',
      phone: '+91 98480 12345',
      whatsapp_number: '919848012345',
      email: 'manager@grandswarna.com',
      city: 'Visakhapatnam',
      area_locality: 'Madhurawada, NH16 Highway',
      address: 'Plot 42, NH16 Highway, Madhurawada, Visakhapatnam',
      is_verified: true,
      rating_avg: 4.9,
      review_count: 28,
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      business_name: 'Annapurna Royal Caterers & Sweets',
      primary_contact_name: 'Chef Rambabu Varma',
      phone: '+91 99880 11223',
      whatsapp_number: '919988011223',
      email: 'rambabu@annapurnacatering.com',
      city: 'Visakhapatnam',
      area_locality: 'Dwaraka Nagar, 3rd Lane',
      address: '3rd Lane, Dwaraka Nagar, Visakhapatnam',
      is_verified: true,
      rating_avg: 4.85,
      review_count: 42,
    },
    {
      id: '55555555-5555-5555-5555-555555555555',
      business_name: 'Sri Krishna Creations & Mandapams',
      primary_contact_name: 'Sridhar Krishna (Creative Director)',
      phone: '+91 98491 55667',
      whatsapp_number: '919849155667',
      email: 'contact@srikrishnadecor.in',
      city: 'Visakhapatnam',
      area_locality: 'Beach Road, MVP Colony',
      address: 'Sector 4, MVP Colony, Visakhapatnam',
      is_verified: true,
      rating_avg: 4.92,
      review_count: 36,
    },
    {
      id: '66666666-6666-6666-6666-666666666666',
      business_name: 'Pranathi 4K Wedding Films & Drone',
      primary_contact_name: 'Pranathi Varma',
      phone: '+91 97012 34567',
      whatsapp_number: '919701234567',
      email: 'films@pranathistudios.com',
      city: 'Visakhapatnam',
      area_locality: 'Siripuram Junction',
      address: 'VIP Road, Siripuram, Visakhapatnam',
      is_verified: true,
      rating_avg: 4.88,
      review_count: 19,
    },
  ];

  for (const v of vendors) {
    const { error } = await s.from('vendors').upsert(v, { onConflict: 'id' });
    if (error) console.log('Vendor upsert notice:', error.message);
  }

  // 2. Businesses
  const businesses = [
    {
      id: '22222222-2222-2222-2222-222222222222',
      vendor_id: '11111111-1111-1111-1111-111111111111',
      category: 'venue',
      name: 'Grand Swarna Palace Convention Hall',
      cover_image_url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800',
      gallery_images: [
        'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800',
        'https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?w=800',
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800',
      ],
      is_active: true,
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      vendor_id: '44444444-4444-4444-4444-444444444444',
      category: 'catering',
      name: 'Annapurna Royal Caterers & Sweets',
      cover_image_url: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800',
      gallery_images: [
        'https://images.unsplash.com/photo-1555244162-803834f70033?w=800',
        'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800',
      ],
      is_active: true,
    },
    {
      id: '77777777-7777-7777-7777-777777777777',
      vendor_id: '55555555-5555-5555-5555-555555555555',
      category: 'decoration',
      name: 'Sri Krishna Creations & Mandapams',
      cover_image_url: 'https://images.unsplash.com/photo-1544077960-604201fe74bc?w=800',
      gallery_images: [
        'https://images.unsplash.com/photo-1544077960-604201fe74bc?w=800',
        'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800',
      ],
      is_active: true,
    },
    {
      id: '88888888-8888-8888-8888-888888888888',
      vendor_id: '66666666-6666-6666-6666-666666666666',
      category: 'photography',
      name: 'Pranathi 4K Wedding Films & Drone',
      cover_image_url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800',
      gallery_images: [
        'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800',
        'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800',
      ],
      is_active: true,
    },
  ];

  for (const b of businesses) {
    const { error } = await s.from('businesses').upsert(b, { onConflict: 'id' });
    if (error) console.log('Business upsert notice:', error.message);
  }

  // 3. Venue Details
  const venueDetails = [
    {
      id: '99999999-9999-9999-9999-999999999999',
      business_id: '22222222-2222-2222-2222-222222222222',
      is_ac: true,
      seating_capacity: 800,
      floating_capacity: 1500,
      ac_rooms_count: 8,
      parking_cars: 120,
      outside_catering_allowed: true,
      base_rental_price: 175000.0,
      power_backup_kva: 150,
      dining_hall_capacity: 450,
    },
  ];

  for (const vd of venueDetails) {
    const { error } = await s.from('venue_details').upsert(vd, { onConflict: 'id' });
    if (error) console.log('Venue details notice:', error.message);
  }

  // 4. Live Catering Stalls
  const addons = [
    {
      id: 'add-1111-1111-1111-111111111111',
      business_id: '33333333-3333-3333-3333-333333333333',
      stall_name: 'Live Delhi Chaat & Pani Puri Counter',
      price_per_plate_extra: 65,
      description: 'Authentic 6 flavors of water, Sev Puri, Dahi Bhalla, Papdi Chaat',
    },
    {
      id: 'add-2222-2222-2222-222222222222',
      business_id: '33333333-3333-3333-3333-333333333333',
      stall_name: 'Tandoori Kebabs & Naan Corner',
      price_per_plate_extra: 95,
      description: 'Live clay oven tandoori paneer tikka, garlic naans, roomali rotis',
    },
    {
      id: 'add-3333-3333-3333-333333333333',
      business_id: '33333333-3333-3333-3333-333333333333',
      stall_name: 'Royal Banarasi Meetha Paan & Mocktails',
      price_per_plate_extra: 45,
      description: 'Fire paan, chocolate paan, and fresh tropical fruit coolers',
    },
  ];

  for (const a of addons) {
    const { error } = await s.from('catering_addons').upsert(a, { onConflict: 'id' });
    if (error) console.log('Catering addon notice:', error.message);
  }

  // 5. Video Reels
  const reels = [
    {
      id: 'reel-1111-1111-1111-111111111111',
      business_id: '22222222-2222-2222-2222-222222222222',
      title: 'Grand Swarna Palace 360° Drone & Mandapam Walkthrough',
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnail_url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600',
      duration_seconds: 35,
    },
    {
      id: 'reel-2222-2222-2222-222222222222',
      business_id: '77777777-7777-7777-7777-777777777777',
      title: 'Royal Jasmine & Rose Telugu Mandapam Assembly',
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnail_url: 'https://images.unsplash.com/photo-1544077960-604201fe74bc?w=600',
      duration_seconds: 28,
    },
  ];

  for (const r of reels) {
    const { error } = await s.from('media_reels').upsert(r, { onConflict: 'id' });
    if (error) console.log('Media reel notice:', error.message);
  }

  // 6. Booking Inquiries (Sample holds)
  const inquiries = [
    {
      id: 'baaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      business_id: '22222222-2222-2222-2222-222222222222',
      customer_name: 'Ananya & Rahul',
      customer_phone: '+91 98480 12345',
      event_date: '2026-11-20',
      guest_count: 500,
      vendor_base_amount: 175000,
      admin_commission_percentage: 10,
      final_customer_amount: 192500,
      status: 'pending',
      notes: 'Auspicious Muhurtham evening ceremony. Require 6 AC rooms & generator backup.',
    },
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      business_id: '22222222-2222-2222-2222-222222222222',
      customer_name: 'K. Sridhar Raju (Bride’s Father)',
      customer_phone: '+91 98661 22334',
      event_date: '2026-12-08',
      guest_count: 750,
      vendor_base_amount: 195000,
      admin_commission_percentage: 10,
      final_customer_amount: 214500,
      status: 'approved',
      notes: 'Holding date for Reception. Requested outside catering setup in dining hall.',
    },
  ];

  for (const inq of inquiries) {
    const { error } = await s.from('booking_inquiries').upsert(inq, { onConflict: 'id' });
    if (error) console.log('Inquiry notice:', error.message);
  }

  // 7. Price Update Requests
  const priceReqs = [
    {
      id: 'caaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      business_id: '22222222-2222-2222-2222-222222222222',
      item_type: 'venue_rental',
      item_name: 'Main AC Kalyana Mandapam (Full Day)',
      current_price: 175000,
      proposed_base_price: 185000,
      admin_percentage: 10,
      admin_markup_amount: 18500,
      final_customer_price: 203500,
      status: 'pending_approval',
      notes: 'Peak winter auspicious dates price revision.',
    },
  ];

  for (const pr of priceReqs) {
    const { error } = await s.from('price_update_requests').upsert(pr, { onConflict: 'id' });
    if (error) console.log('Price request notice:', error.message);
  }

  console.log('Seeding finished successfully!');
}

seed();
