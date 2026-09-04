/* ============================================================================
   products.js · SINGLE SOURCE OF TRUTH
   ----------------------------------------------------------------------------
   Filenames are HAND-AUTHORED. There is no `${slug}-1.webp` interpolation
   anywhere in this codebase, and there must never be one, because Warrior
   Spirit has no `-1` file at all. Verified 2026-09-04: `Warrior-spirit-2` is
   the front, `-4` is a clean back shot (戦士 + WARRIOR SPIRIT + seal), `-5` is
   the ink composite used as its byobu leaf.

   Case matters. The Pages server is Linux and case-sensitive; macOS git is
   not. Copy these names, never retype them.

   Every path is RELATIVE with no leading slash: this is a project page served
   from /zenji_shop/, so a leading slash escapes to a different site entirely.

   `plate` values are MEASURED from each file's outer 2% border ring, so the
   card mount matches the photograph's own seamless backdrop and the edge
   never seams during the turn.

   `pos` biases object-position for images narrower than the 3/4 card box
   (ratio 0.667 crops top and bottom; 0.750 is exact; 0.800 crops the sides).
   ========================================================================= */

export const CARD_RATIO = 3 / 4;

export const PRODUCTS = [
  {
    id: 'will-of-the-sun', order: 1, sku: 'ZJ-001-MRG',
    name: 'Will of the Sun', kanji: '太陽の意志', romaji: 'taiyō no ishi',
    ref: 'Naruto', sfx: 'ゴウ', featured: true,
    colorway: { name: 'Marigold', hex: '#F2A310' },
    accentInk: '#7E5609',        /* 5.4:1 on washi — the only accent legal as text */
    accentHot: '#F2A310',        /* only ever on --ground-inv grounds */
    price: 39.99, salePrice: 33.99, onSale: true,
    front: { src: 'image/Will-of-the-sun-1.webp', w: 1023, h: 1537, plate: '#D5D5D5', pos: '50% 34%' },
    back:  { src: 'image/Will-of-the-sun-2.webp', w: 1122, h: 1402, plate: '#BBBBBB', pos: '50% 50%' },
    hero:  { src: 'image/Will-of-the-sun-4.webp', w: 1254, h: 1254, plate: '#AEAAA7', pos: '50% 38%' },
    blurb: 'Sumi-e sun, dry-brush edge.',
    lore: 'In the depths of darkness, we seek the light that shines our path. The will that does not go out.'
  },
  {
    id: 'warrior-spirit', order: 2, sku: 'ZJ-002-FST',
    name: 'Warrior Spirit', kanji: '緑の戦士', romaji: 'midori no senshi',
    ref: 'Zoro', sfx: 'ズシャ', featured: true,
    colorway: { name: 'Deep Forest', hex: '#1E3B2E' },
    accentInk: '#1E3B2E',        /* 10.1:1 — already dark enough, unchanged */
    accentHot: '#34D98F',        /* forest is 1.6:1 on taku; jade lights the chrome */
    price: 39.99, salePrice: 33.99, onSale: true,
    front: { src: 'image/Warrior-spirit-2.webp', w: 1024, h: 1536, plate: '#E9E9E9', pos: '50% 36%' },
    back:  { src: 'image/Warrior-spirit-4.webp', w: 1024, h: 1536, plate: '#F4F1F2', pos: '50% 36%' },
    hero:  { src: 'image/Warrior-spirit-5.webp', w: 1086, h: 1448, plate: '#CFCBCA', pos: '50% 50%' },
    blurb: 'Three-blade silhouette in wet ink.',
    lore: 'Strength is not about dominance, but mastery of self. The courage to stand alone.'
  },
  {
    id: 'blue-flame', order: 3, sku: 'ZJ-003-PRW',
    name: 'Blue Flame', kanji: '青い炎', romaji: 'aoi honō',
    ref: 'Gojo', sfx: 'ゴォ', featured: true,
    colorway: { name: 'Periwinkle', hex: '#5B79BE' },
    accentInk: '#3C4B6F',        /* 7.2:1 */
    accentHot: '#8FA6E0',
    price: 39.99, salePrice: 33.99, onSale: true,
    front: { src: 'image/Blue-flame-1.webp', w: 1122, h: 1402, plate: '#ADABA9', pos: '50% 50%' },
    back:  { src: 'image/Blue-flame-2.webp', w: 1024, h: 1536, plate: '#D1CFCF', pos: '50% 36%' },
    hero:  { src: 'image/Blue-flame-4.webp', w: 1086, h: 1448, plate: '#B6B4B4', pos: '50% 50%' },
    blurb: 'Cold fire, infinite void.',
    lore: 'The flame that burns coldest burns longest. Throughout heaven and earth, alone.'
  },
  {
    id: 'demon-blood', order: 4, sku: 'ZJ-004-SKR',
    name: 'Demon Blood', kanji: '鬼の血', romaji: 'oni no chi',
    ref: 'Nezuko', sfx: 'ヒュン', featured: true,
    colorway: { name: 'Sakura Pink', hex: '#EE9CC0' },
    accentInk: '#7A4E60',        /* 5.6:1 */
    accentHot: '#EE9CC0',
    price: 39.99, salePrice: 33.99, onSale: true,
    front: { src: 'image/Demon-blood-1.webp', w: 1024, h: 1536, plate: '#AAA9AA', pos: '50% 36%' },
    back:  { src: 'image/Demon-blood-2.webp', w: 1024, h: 1536, plate: '#C8C8C8', pos: '50% 36%' },
    hero:  { src: 'image/Demon-blood-4.webp', w: 1086, h: 1448, plate: '#C0BBBB', pos: '50% 50%' },
    blurb: 'Bloom held in blackened ink.',
    lore: 'Cursed by night, unbroken by it. What was taken does not define what remains.'
  },

  /* ---- full price, no hero composite, featured:false ---------------------- */
  {
    id: 'domain-expansion', order: 5, sku: 'ZJ-005-VLT',
    name: 'Domain Expansion', kanji: '領域展開', romaji: 'ryōiki tenkai',
    ref: 'Gojo', sfx: 'ドン', featured: false,
    colorway: { name: 'Violet', hex: '#6B34B0' },
    accentInk: '#452568', accentHot: '#A855F7',
    price: 39.99, salePrice: null, onSale: false,
    front: { src: 'image/Domain-expansion-1.webp', w: 1024, h: 1536, plate: '#A5A5A5', pos: '50% 34%' },
    back:  { src: 'image/Domain-expansion-2.webp', w: 1023, h: 1537, plate: '#F1EFF0', pos: '50% 36%' },
    hero: null,
    blurb: 'A sure-hit space, drawn in one stroke.',
    lore: 'Within this territory, the outcome is already decided.'
  },
  {
    id: 'water-breathing', order: 6, sku: 'ZJ-006-TEA',
    name: 'Water Breathing', kanji: '水の呼吸', romaji: 'mizu no kokyū',
    ref: 'Tanjiro', sfx: 'ザアッ', featured: false,
    colorway: { name: 'Teal', hex: '#1B7F92' },
    accentInk: '#194E57', accentHot: '#22D3EE',
    price: 39.99, salePrice: null, onSale: false,
    front: { src: 'image/Water-breathing-1.webp', w: 1024, h: 1536, plate: '#B8B8B8', pos: '50% 36%' },
    back:  { src: 'image/Water-breathing-2.webp', w: 1024, h: 1536, plate: '#B6B6B6', pos: '50% 36%' },
    hero: null,
    blurb: 'Ten forms, one current.',
    lore: 'Flow without breaking. The blade follows the water, never the other way.'
  },

  /* ---- NEAR-NEUTRAL colorways -------------------------------------------
     Sand, bone and greige are invisible against washi: their mixes measure
     2.88-3.81:1. accentInk falls back to --ink, splatter switches to --accent,
     and the true colorway survives only as the 14px chip beside its name.
     ---------------------------------------------------------------------- */
  {
    id: 'bushido', order: 7, sku: 'ZJ-007-SND',
    name: 'Bushido', kanji: '武士道', romaji: 'bushidō',
    ref: 'Samurai', sfx: 'シャッ', featured: false, nearNeutral: true,
    colorway: { name: 'Sand', hex: '#D9CDBC' },
    accentInk: null, accentHot: '#D9CDBC',
    price: 39.99, salePrice: null, onSale: false,
    front: { src: 'image/Bushido-1.webp', w: 1086, h: 1448, plate: '#8B8989', pos: '50% 50%' },
    back:  { src: 'image/Bushido-2.webp', w: 1086, h: 1448, plate: '#939192', pos: '50% 50%' },
    hero: null,
    blurb: 'Path, practicality, honour.',
    lore: 'Seven virtues carried without display. The way is walked, not spoken.'
  },
  {
    id: 'free-soul', order: 8, sku: 'ZJ-008-BNE',
    name: 'Free Soul', kanji: '自由な魂', romaji: 'jiyū na tamashii',
    ref: 'Luffy', sfx: 'ドドン', featured: false, nearNeutral: true,
    colorway: { name: 'Bone', hex: '#EFE9DE' },
    accentInk: null, accentHot: '#EFE9DE',
    price: 39.99, salePrice: null, onSale: false,
    front: { src: 'image/Free-soul-1.webp', w: 1122, h: 1402, plate: '#D3D3D3', pos: '50% 50%' },
    back:  { src: 'image/Free-soul-2.webp', w: 1122, h: 1402, plate: '#D1CECF', pos: '50% 50%' },
    hero: null,
    blurb: 'Straw brim, open horizon.',
    lore: 'Freedom is not given at the end of the voyage. It is the voyage.'
  },
  {
    id: 'limitless', order: 9, sku: 'ZJ-009-GRG',
    name: 'Limitless', kanji: '無制限', romaji: 'museigen',
    ref: 'Gojo', sfx: 'シュン', featured: false, nearNeutral: true,
    colorway: { name: 'Greige', hex: '#CFC3B0' },
    accentInk: null, accentHot: '#CFC3B0',
    price: 39.99, salePrice: null, onSale: false,
    front: { src: 'image/Limitless-1.webp', w: 1086, h: 1449, plate: '#D4D4D4', pos: '50% 50%' },
    back:  { src: 'image/Limitless-2.webp', w: 1023, h: 1537, plate: '#D9D8DA', pos: '50% 36%' },
    hero: null,
    blurb: 'The space between never closes.',
    lore: 'Distance is a decision. Nothing arrives that is not permitted to arrive.'
  },
  {
    id: 'paradise-spirit', order: 10, sku: 'ZJ-010-OLV',
    name: 'Paradise Spirit', kanji: '自由のために', romaji: 'jiyū no tame ni',
    ref: null, sfx: 'ゴゴ', featured: false,
    colorway: { name: 'Olive', hex: '#5A5C42' },
    accentInk: '#5A5C42',        /* 6.8:1 — dark enough as-is */
    accentHot: '#A3A878',
    price: 39.99, salePrice: null, onSale: false,
    front: { src: 'image/Paradise-spirit-1.webp', w: 1023, h: 1537, plate: '#DBDBDB', pos: '50% 36%' },
    back:  { src: 'image/Paradise-spirit-2.webp', w: 1122, h: 1402, plate: '#D1D0D0', pos: '50% 50%' },
    hero: null,
    blurb: 'For the sake of freedom.',
    lore: 'Some walk out of paradise on purpose. That is the whole story.'
  }
];

export const FEATURED = PRODUCTS.filter(p => p.featured);

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const CURRENCY = 'A$';

export const fmt = n => CURRENCY + n.toFixed(2);

/** The price a customer actually pays. */
export const priceOf = p => (p.onSale && p.salePrice != null ? p.salePrice : p.price);

/** Percent off, rounded, or 0. Used for the SALE tag. */
export const discountOf = p =>
  p.onSale && p.salePrice != null ? Math.round((1 - p.salePrice / p.price) * 100) : 0;

export const byId = id => PRODUCTS.find(p => p.id === id) || null;
