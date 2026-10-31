const { createClient } = require('@supabase/supabase-js');
const s = createClient(
  'https://dckmxhqpextqzoreogva.supabase.co',
  'sb_publishable_aYk2pFVQSJi0cvD8E8tdbQ_wPGq6qTm'
);

async function inspect() {
  const { data: b } = await s.from('businesses').select('*');
  console.log('Businesses in Supabase:', b);

  const { data: dec } = await s.from('decor_items').select('*');
  console.log('Decor items count:', dec ? dec.length : 0);

  const { data: cat } = await s.from('catering_packages').select('*');
  console.log('Catering packages count:', cat ? cat.length : 0);
}
inspect();
