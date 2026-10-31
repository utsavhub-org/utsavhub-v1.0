const { createClient } = require('@supabase/supabase-js');
const s = createClient(
  'https://dckmxhqpextqzoreogva.supabase.co',
  'sb_publishable_aYk2pFVQSJi0cvD8E8tdbQ_wPGq6qTm'
);

async function check() {
  const tables = [
    'businesses',
    'vendors',
    'venue_details',
    'decor_items',
    'catering_packages',
    'catering_addons',
    'media_reels',
    'booking_inquiries',
    'price_update_requests',
    'user_profiles',
    'user_wishlists',
    'reviews'
  ];

  for (const t of tables) {
    const { count, error } = await s.from(t).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(t, '-> MISSING or RLS ERROR:', error.message);
    } else {
      console.log(t, '-> OK, rows:', count);
    }
  }
}
check();
