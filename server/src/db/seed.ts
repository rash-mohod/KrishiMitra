import { supabaseAdmin } from '../config/supabase.js';

const users = [
  {
    email: 'amit.farmer@agri.com',
    password: 'password123',
    full_name: 'Amit Farmer',
    phone: '9876543210',
    role: 'FARMER',
    state: 'Maharashtra',
    district: 'Nagpur',
    village: 'Satnavri'
  },
  {
    email: 'sunita.farmer@agri.com',
    password: 'password123',
    full_name: 'Sunita Farmer',
    phone: '9876543211',
    role: 'FARMER',
    state: 'Maharashtra',
    district: 'Wardha',
    village: 'Seloo'
  },
  {
    email: 'rajesh.patil@agri.com',
    password: 'password123',
    full_name: 'Rajesh Patil',
    phone: '9876543220',
    role: 'OWNER',
    state: 'Maharashtra',
    district: 'Nagpur',
    village: 'Hingna'
  },
  {
    email: 'suresh.machinery@agri.com',
    password: 'password123',
    full_name: 'Suresh Machinery',
    phone: '9876543221',
    role: 'OWNER',
    state: 'Maharashtra',
    district: 'Amravati',
    village: 'Badnera'
  },
  {
    email: 'admin@krishimitra.gov.in',
    password: 'password123',
    full_name: 'KrishiMitra Admin',
    phone: '9876543200',
    role: 'ADMIN',
    state: 'Maharashtra',
    district: 'Nagpur',
    village: 'Nagpur'
  }
];

const machinery = [
  {
    name: 'Mahindra 575 DI Tractor',
    category_name: 'Tractors',
    brand: 'Mahindra',
    model: '575 DI',
    manufacturing_year: 2023,
    daily_rate: 1800,
    location: 'Hingna',
    district: 'Nagpur',
    state: 'Maharashtra',
    pincode: '441110',
    condition: 'GOOD',
    description:
      'Reliable tractor for ploughing, cultivation and field preparation.',
    image_urls: [],
    specifications: { horsepower: '45 HP', fuel: 'Diesel' },
    approval_status: 'APPROVED',
    availability_status: 'AVAILABLE',
    is_active: true
  },
  {
    name: 'Rotavator 6 Feet',
    category_name: 'Rotavators',
    brand: 'Shaktiman',
    model: 'SRT-06',
    manufacturing_year: 2022,
    daily_rate: 1200,
    location: 'Hingna',
    district: 'Nagpur',
    state: 'Maharashtra',
    pincode: '441110',
    condition: 'EXCELLENT',
    description:
      'Six-foot rotavator suitable for seedbed preparation.',
    image_urls: [],
    specifications: { width: '6 feet' },
    approval_status: 'APPROVED',
    availability_status: 'AVAILABLE',
    is_active: true
  },
  {
    name: 'Combine Harvester',
    category_name: 'Harvesters',
    brand: 'New Holland',
    model: 'TC5.30',
    manufacturing_year: 2021,
    daily_rate: 6500,
    location: 'Badnera',
    district: 'Amravati',
    state: 'Maharashtra',
    pincode: '444701',
    condition: 'GOOD',
    description:
      'Combine harvester for efficient crop harvesting.',
    image_urls: [],
    specifications: { capacity: 'High' },
    approval_status: 'APPROVED',
    availability_status: 'AVAILABLE',
    is_active: true
  },
  {
    name: 'Seed Drill',
    category_name: 'Seeders',
    brand: 'KS',
    model: 'SD-11',
    manufacturing_year: 2023,
    daily_rate: 900,
    location: 'Badnera',
    district: 'Amravati',
    state: 'Maharashtra',
    pincode: '444701',
    condition: 'GOOD',
    description: 'Seed drill for uniform sowing.',
    image_urls: [],
    specifications: { rows: '11' },
    approval_status: 'APPROVED',
    availability_status: 'AVAILABLE',
    is_active: true
  },
  {
    name: 'Agricultural Sprayer',
    category_name: 'Sprayers',
    brand: 'KisanKraft',
    model: 'AS-500',
    manufacturing_year: 2024,
    daily_rate: 700,
    location: 'Hingna',
    district: 'Nagpur',
    state: 'Maharashtra',
    pincode: '441110',
    condition: 'EXCELLENT',
    description: 'Field sprayer for crop protection.',
    image_urls: [],
    specifications: { tank: '500 L' },
    approval_status: 'APPROVED',
    availability_status: 'AVAILABLE',
    is_active: true
  },
  {
    name: 'Farm Trailer',
    category_name: 'Trailers',
    brand: 'Captain',
    model: 'FT-3T',
    manufacturing_year: 2022,
    daily_rate: 1100,
    location: 'Badnera',
    district: 'Amravati',
    state: 'Maharashtra',
    pincode: '444701',
    condition: 'GOOD',
    description:
      'Farm trailer for transporting agricultural produce.',
    image_urls: [],
    specifications: { capacity: '3 ton' },
    approval_status: 'APPROVED',
    availability_status: 'AVAILABLE',
    is_active: true
  }
];

async function main() {
  // Create demo accounts and ensure their profiles exist.
  for (const user of users) {
    const listed = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000
    });

    if (listed.error) {
      throw listed.error;
    }

    const found = listed.data.users.find(
      (candidate: { email?: string; id: string }) =>
        candidate.email?.toLowerCase() ===
        user.email.toLowerCase()
     );

    let id = found?.id;

    if (!id) {
      const created =
        await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            full_name: user.full_name,
            role: user.role
          }
        });

      if (created.error) {
        throw created.error;
      }

      id = created.data.user.id;
    }

    const profileResult =
      await supabaseAdmin.from('profiles').upsert({
        id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        state: user.state,
        district: user.district,
        village: user.village,
        is_verified: true,
        is_active: true
      });

    if (profileResult.error) {
      throw profileResult.error;
    }
  }

  // Get all owner profiles.
  const profilesResult = await supabaseAdmin
    .from('profiles')
    .select('id, role, email');

  if (profilesResult.error) {
    throw profilesResult.error;
  }

  const owners = (profilesResult.data ?? []).filter(
    (profile) => profile.role === 'OWNER'
  );

  if (owners.length === 0) {
    throw new Error(
      'No OWNER profiles found; cannot assign demo equipment.'
    );
  }

  // Check existing equipment names.
  // This preserves Alex Wan's listing and avoids duplicates.
  const existingResult = await supabaseAdmin
    .from('equipment')
    .select('name');

  if (existingResult.error) {
    throw existingResult.error;
  }

  const existingNames = new Set(
    (existingResult.data ?? []).map((row) => row.name)
  );

  const missingMachinery = machinery.filter(
    (item) => !existingNames.has(item.name)
  );

  // Insert only demo equipment that is missing.
  if (missingMachinery.length > 0) {
    const inserts = missingMachinery.map(
      (item, index) => ({
        ...item,
        owner_id: owners[index % owners.length].id
      })
    );

    const insertResult = await supabaseAdmin
      .from('equipment')
      .insert(inserts);

    if (insertResult.error) {
      throw insertResult.error;
    }

    console.log(
      `Demo equipment inserted: ${missingMachinery.length}`
    );
  } else {
    console.log('All demo equipment already exists.');
  }

  console.log('KrishiMitra demo seed completed.');
  console.log(
    'Demo password for all seeded accounts: password123'
  );
}

main().catch((error) => {
  console.error('Demo seed failed:', error);
  process.exit(1);
});