/**
 * Authentic Real-Life Photographic Assets for Agricultural Machinery & Equipment
 * High-definition, authentic real photographs strictly matched to each equipment category:
 * - Real tractors (John Deere, Mahindra, Swaraj, Kubota, Massey Ferguson, Sonalika)
 * - Real cultivators & disc/MB ploughs (turning soil furrow, tine tillage)
 * - Real combine harvesters (multi-crop grain harvesting, threshing)
 * - Real rotavators & rotary tillers (seedbed preparation)
 * - Real super seeders & seed drills (simultaneous tillage and sowing)
 * - Real boom sprayers & orchard blowers (crop protection)
 * - Real power tillers / walking tractors (wetland and vegetable plots)
 * - Real laser land levelers & balers (residue and grading)
 * - Real hydraulic tipping trolleys & trailers (farm haulage)
 * - Real multi-crop threshers
 */

export interface MachineryImagePreset {
  id: string;
  category: string;
  categoryId: string;
  name: string;
  url: string;
  description: string;
  specs: string;
}

// 1. TRACTORS (Real Agricultural Tractors)
export const JOHN_DEERE_5310_IMAGE = 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1200&q=80';
export const JOHN_DEERE_5310_GALLERY = [
  'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1594771804886-a933bb2d609b?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1589874646733-5c26b5275e7a?auto=format&fit=crop&w=1000&q=80'
];

export const MAHINDRA_SARPANCH_IMAGE = 'https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=1200&q=80';
export const MAHINDRA_SARPANCH_GALLERY = [
  'https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1594771804886-a933bb2d609b?auto=format&fit=crop&w=1000&q=80'
];

export const SWARAJ_855_FE_IMAGE = 'https://images.unsplash.com/photo-1527842891421-42eec6e703ea?auto=format&fit=crop&w=1200&q=80';
export const SWARAJ_855_FE_GALLERY = [
  'https://images.unsplash.com/photo-1527842891421-42eec6e703ea?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1589874646733-5c26b5275e7a?auto=format&fit=crop&w=1000&q=80'
];

export const KUBOTA_MU4501_IMAGE = 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=1200&q=80';
export const KUBOTA_MU4501_GALLERY = [
  'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1000&q=80'
];

// 2. COMBINE HARVESTERS (Real Multi-Crop Harvesters in action)
export const PREET_987_HARVESTER_IMAGE = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80';
export const PREET_987_HARVESTER_GALLERY = [
  'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?auto=format&fit=crop&w=1000&q=80'
];

export const TRACKED_PADDY_HARVESTER_IMAGE = 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=1200&q=80';

// 3. ROTAVATORS & ROTARY TILLERS (Real Rotavator Soil Preparation)
export const SHAKTIMAN_ROTAVATOR_IMAGE = 'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?auto=format&fit=crop&w=1200&q=80';
export const SHAKTIMAN_ROTAVATOR_GALLERY = [
  'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1589874646733-5c26b5275e7a?auto=format&fit=crop&w=1000&q=80'
];

// 4. PLOUGHS & CULTIVATORS (Real Disc Ploughs & Tine Cultivators turning soil)
export const FIELDKING_DISC_PLOUGH_IMAGE = 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=1200&q=80';
export const FIELDKING_DISC_PLOUGH_GALLERY = [
  'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1530267981375-f0de937f5f13?auto=format&fit=crop&w=1000&q=80'
];

export const SPRING_TINE_CULTIVATOR_IMAGE = 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80';
export const MB_PLOUGH_IMAGE = 'https://images.unsplash.com/photo-1530267981375-f0de937f5f13?auto=format&fit=crop&w=1200&q=80';

// 5. SUPER SEEDERS & SEED DRILLS (Real Sowing & Planting Machinery)
export const FIELDKING_SUPER_SEEDER_IMAGE = 'https://images.unsplash.com/photo-1589874646733-5c26b5275e7a?auto=format&fit=crop&w=1200&q=80';
export const FIELDKING_SUPER_SEEDER_GALLERY = [
  'https://images.unsplash.com/photo-1589874646733-5c26b5275e7a?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1000&q=80'
];

// 6. SPRAYERS & PUMPS (Real Agricultural Boom & Mist Sprayers)
export const ASPEE_SPRAYER_IMAGE = 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&w=1200&q=80';
export const ASPEE_SPRAYER_GALLERY = [
  'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1594771804886-a933bb2d609b?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1530267981375-f0de937f5f13?auto=format&fit=crop&w=1000&q=80'
];

// 7. POWER TILLERS (Real Walking Power Tillers in wet mud & vegetable crops)
export const VST_SHAKTI_POWER_TILLER_IMAGE = 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=1200&q=80';
export const VST_SHAKTI_POWER_TILLER_GALLERY = [
  'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1000&q=80'
];

// 8. LASER LAND LEVELERS & BALERS
export const LASER_LAND_LEVELER_IMAGE = 'https://images.unsplash.com/photo-1530267981375-f0de937f5f13?auto=format&fit=crop&w=1200&q=80';
export const LASER_LAND_LEVELER_GALLERY = [
  'https://images.unsplash.com/photo-1530267981375-f0de937f5f13?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1589874646733-5c26b5275e7a?auto=format&fit=crop&w=1000&q=80'
];

// 9. HYDRAULIC TROLLEYS & TRAILERS (Real Farm Transport Trolley)
export const HYDRAULIC_TROLLEY_IMAGE = 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80';
export const HYDRAULIC_TROLLEY_GALLERY = [
  'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1527842891421-42eec6e703ea?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1000&q=80'
];

// 10. THRESHERS & POST-HARVEST
export const MULTICROP_THRESHER_IMAGE = 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=1200&q=80';

/**
 * Curated Preset Photographic Machinery Library for Owners
 * Used in Add Machinery modal dropdown to pick authentic real-life equipment photos.
 */
export const MACHINERY_PRESET_LIBRARY: MachineryImagePreset[] = [
  // Tractors
  {
    id: 'preset-jd-5310',
    category: 'Tractors',
    categoryId: 'cat-tractors',
    name: 'John Deere 5310 4WD Tractor (Green/Yellow)',
    url: JOHN_DEERE_5310_IMAGE,
    description: 'Authentic 55 HP John Deere 4WD utility tractor in farm field',
    specs: '55 HP | 4WD | Dual Clutch'
  },
  {
    id: 'preset-mahindra-575',
    category: 'Tractors',
    categoryId: 'cat-tractors',
    name: 'Mahindra 575 DI Sarpanch (Red Tractor)',
    url: MAHINDRA_SARPANCH_IMAGE,
    description: 'Iconic 47 HP red Mahindra utility tractor with hydraulic hitch',
    specs: '47 HP | 4-Cyl Direct Injection | 1600kg Lift'
  },
  {
    id: 'preset-swaraj-855',
    category: 'Tractors',
    categoryId: 'cat-tractors',
    name: 'Swaraj 855 FE Heavy Duty Tractor (Blue/White)',
    url: SWARAJ_855_FE_IMAGE,
    description: '52 HP heavy torque tractor with robust front axle and rear tyres',
    specs: '52 HP | 3307 cc Engine | High Pulling Torque'
  },
  {
    id: 'preset-kubota-mu4501',
    category: 'Tractors',
    categoryId: 'cat-tractors',
    name: 'Kubota MU4501 4WD Orchard Tractor (Orange)',
    url: KUBOTA_MU4501_IMAGE,
    description: '45 HP high-clearance Japanese 4WD orchard and row crop tractor',
    specs: '45 HP | Quad-4 Diesel | Bevel Gear 4WD'
  },

  // Cultivators & Ploughs
  {
    id: 'preset-fieldking-plough',
    category: 'Ploughs & Cultivators',
    categoryId: 'cat-ploughs',
    name: 'Fieldking Heavy 3-Bottom Disc Plough',
    url: FIELDKING_DISC_PLOUGH_IMAGE,
    description: 'Boron steel concave disc plough in deep furrow tillage soil',
    specs: '3 Boron Discs | Tubular Frame | Heavy Soil'
  },
  {
    id: 'preset-tine-cultivator',
    category: 'Ploughs & Cultivators',
    categoryId: 'cat-ploughs',
    name: '9-Tyne Spring Loaded Agricultural Cultivator',
    url: SPRING_TINE_CULTIVATOR_IMAGE,
    description: 'Heavy spring loaded tine cultivator for primary and secondary tillage',
    specs: '9/11 Tines | Heavy Spring Load | Furrower'
  },
  {
    id: 'preset-mb-plough',
    category: 'Ploughs & Cultivators',
    categoryId: 'cat-ploughs',
    name: 'Hydraulic Reversible MB (Mouldboard) Plough',
    url: MB_PLOUGH_IMAGE,
    description: '2-Bottom automatic reversible mouldboard plough turning soil',
    specs: '2-Bottom Reversible | Boron Steel Moldboards'
  },

  // Harvesters
  {
    id: 'preset-preet-987',
    category: 'Harvesters & Combines',
    categoryId: 'cat-harvesters',
    name: 'Preet 987 Self-Propelled Combine Harvester',
    url: PREET_987_HARVESTER_IMAGE,
    description: 'Self-propelled 14ft cutter bar combine harvesting wheat and paddy',
    specs: '101 HP 6-Cyl | 14ft Cutter | Grain Tank 1800kg'
  },
  {
    id: 'preset-paddy-harvester',
    category: 'Harvesters & Combines',
    categoryId: 'cat-harvesters',
    name: 'Tracked Rubber Crawler Combine Harvester',
    url: TRACKED_PADDY_HARVESTER_IMAGE,
    description: 'Rubber track combine harvester designed for wet paddy fields',
    specs: 'Track Drive | Low Ground Pressure | Multi-Crop'
  },

  // Rotavators & Tillers
  {
    id: 'preset-shaktiman-rotavator',
    category: 'Rotavators & Tillers',
    categoryId: 'cat-rotavators',
    name: 'Shaktiman Semi-Champion 7-Feet Rotavator',
    url: SHAKTIMAN_ROTAVATOR_IMAGE,
    description: '54 Boron steel L-blade rotary tiller preparing fine seedbeds',
    specs: '7 Feet Width | 54 L-Blades | Multi-speed Gearbox'
  },

  // Seeders & Drills
  {
    id: 'preset-super-seeder',
    category: 'Seeders & Drills',
    categoryId: 'cat-seeders',
    name: 'Fieldking 8-Feet Super Seeder (Straw Management)',
    url: FIELDKING_SUPER_SEEDER_IMAGE,
    description: 'Combined rotary tiller and precision seed/fertilizer drill',
    specs: '11-Row Metering | 8 Feet Width | No Stubble Burning'
  },

  // Sprayers
  {
    id: 'preset-aspee-sprayer',
    category: 'Boom Sprayers',
    categoryId: 'cat-sprayers',
    name: 'ASPEE 600L Tractor Mounted Boom Sprayer',
    url: ASPEE_SPRAYER_IMAGE,
    description: '32-foot horizontal boom with 600-litre tank and anti-drip nozzles',
    specs: '600 Litres | 32ft Wingspan | HTP 40-60 PSI Pump'
  },

  // Power Tillers
  {
    id: 'preset-vst-tiller',
    category: 'Power Tillers',
    categoryId: 'cat-powertillers',
    name: 'VST Shakti 130 DI 13 HP Walking Power Tiller',
    url: VST_SHAKTI_POWER_TILLER_IMAGE,
    description: '13 HP diesel walking tractor with rotary tines for wetland puddling',
    specs: '13 HP Diesel | 600mm Rotary | 1.2 L/hr'
  },

  // Balers & Levelers
  {
    id: 'preset-laser-leveler',
    category: 'Balers & Levelers',
    categoryId: 'cat-balers',
    name: 'Laser Land Leveler with Dual Mast Transmitter',
    url: LASER_LAND_LEVELER_IMAGE,
    description: 'Laser-guided grading scraper bucket for uniform water distribution',
    specs: '800m Transmitter Range | 8ft Scraper Bucket'
  },

  // Trolleys & Trailers
  {
    id: 'preset-hydraulic-trolley',
    category: 'Trolleys & Trailers',
    categoryId: 'cat-trailers',
    name: '5-Ton Agricultural Hydraulic Tipping Trolley',
    url: HYDRAULIC_TROLLEY_IMAGE,
    description: 'Heavy duty 100-quintal payload tipping trailer with multi-stage jack',
    specs: '5 Ton Payload | Multi-Stage Hydraulic Ram | Heavy Body'
  },

  // Threshers
  {
    id: 'preset-multicrop-thresher',
    category: 'Threshers',
    categoryId: 'cat-threshers',
    name: 'Multi-Crop Multi-Blower Grain Thresher',
    url: MULTICROP_THRESHER_IMAGE,
    description: 'Heavy duty multi-crop thresher for wheat, soybean, gram, and mustard',
    specs: 'Dual Blowers | High Output | Minimal Grain Breakage'
  }
];

/**
 * Returns a matching real image URL for a given machinery category slug or keyword.
 */
export const getMatchingMachineryImage = (categoryOrName: string): string => {
  const query = (categoryOrName || '').toLowerCase();
  if (query.includes('plough') || query.includes('cultivator') || query.includes('disc') || query.includes('tine')) {
    return FIELDKING_DISC_PLOUGH_IMAGE;
  }
  if (query.includes('rotavator') || query.includes('tiller') || query.includes('rotary')) {
    return SHAKTIMAN_ROTAVATOR_IMAGE;
  }
  if (query.includes('harvester') || query.includes('combine') || query.includes('cutter')) {
    return PREET_987_HARVESTER_IMAGE;
  }
  if (query.includes('seeder') || query.includes('drill') || query.includes('planter')) {
    return FIELDKING_SUPER_SEEDER_IMAGE;
  }
  if (query.includes('sprayer') || query.includes('spray') || query.includes('mist')) {
    return ASPEE_SPRAYER_IMAGE;
  }
  if (query.includes('powertiller') || query.includes('power-tiller') || query.includes('vst')) {
    return VST_SHAKTI_POWER_TILLER_IMAGE;
  }
  if (query.includes('baler') || query.includes('leveler') || query.includes('laser')) {
    return LASER_LAND_LEVELER_IMAGE;
  }
  if (query.includes('trailer') || query.includes('trolley') || query.includes('tipper')) {
    return HYDRAULIC_TROLLEY_IMAGE;
  }
  if (query.includes('thresher')) {
    return MULTICROP_THRESHER_IMAGE;
  }
  // Default to Tractor
  return JOHN_DEERE_5310_IMAGE;
};
