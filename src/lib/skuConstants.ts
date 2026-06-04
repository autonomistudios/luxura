export const ANCHOR_TYPES = [
  { id: 'FULL_OUTFIT', label: 'Full Outfit',  desc: 'Complete look' },
  { id: 'DRESS',       label: 'Dress / Gown', desc: 'One-piece garments' },
  { id: 'SHIRT',       label: 'Top / Shirt',  desc: 'Upper body' },
  { id: 'PANTS',       label: 'Trousers',      desc: 'Lower body' },
  { id: 'SHORTS',      label: 'Shorts',        desc: 'Lower body' },
  { id: 'SWIMWEAR',    label: 'Swimwear',      desc: 'Swim / activewear' },
  { id: 'SHOES',       label: 'Footwear',      desc: 'Shoes / boots' },
  { id: 'HAIR',        label: 'Hair',          desc: 'Hairstyle' },
  { id: 'MAKEUP',      label: 'Makeup',        desc: 'Beauty look' },
  { id: 'EARRINGS',    label: 'Earrings',      desc: 'Ear accessories' },
  { id: 'NECKLACE',    label: 'Necklace',      desc: 'Neck jewelry' },
  { id: 'WATCH',       label: 'Watch',         desc: 'Timepiece' },
] as const;

export const SKU_CATEGORIES = [
  'Outerwear', 'Tops', 'Dresses', 'Trousers',
  'Footwear', 'Accessories', 'Swimwear', 'Beauty',
] as const;
