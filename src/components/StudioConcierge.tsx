import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CREDIT_COST } from '../contexts/AuthContext';

// ─── Editorial image pools per domain (8-12 curated Unsplash shots each) ─────
// Each pool is offset per card so no two cards ever show the same image simultaneously.

const U = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&q=85&auto=format&fit=crop&crop=faces,center`;

const DOMAIN_POOLS: Record<string, string[]> = {
  hair: [
    U('1522337360-4ce9c940de0d'), U('1605497788044-5a32c7078486'), U('1492106087820-0b04dc9c954c'),
    U('1559599101-f09722fb4948'), U('1494790108377-be9c29b29330'), U('1523264941-4eba57c47f3e'),
    U('1571645163964-3d76a1dc89c6'), U('1519699047748-de8e457a634e'), U('1522338242992-e1d3abb1df60'),
    U('1531746020798-e6953c6e8e04'),
  ],
  barber: [
    U('1503951914875-452162b0f3f1'), U('1621605815971-8f5a57f5ef5a'), U('1534297635766-a262cdcb8ee9'),
    U('1605497788044-5a32c7078486'), U('1599351193864-b2494a2a2a2a'), U('1542623671-33cf3dcc0832'),
    U('1585747860715-2ba37e788b70'), U('1536766820879-059fec98ec0a'), U('1622286342621-4bd2a3e4b9b4'),
    U('1619451682008-4b8a42e5b1d1'),
  ],
  makeup: [
    U('1487412947147-5cebf100d293'), U('1457972851976-6b3f4fe36fa9'), U('1526510747491-58f928ec870f'),
    U('1560717789-9e12f10e2ffd'), U('1519440335-00a40da53c89'), U('1596462502278-27bfdc0c5c7c'),
    U('1508214751196-bcfd4ca60f91'), U('1517841905240-472988babdf9'), U('1522688032-4eec0a0b1bda'),
    U('1534528741775-53994a69daeb'),
  ],
  nails: [
    U('1604654894610-df63bc536371'), U('1604654894610-df63bc536371'), U('1604655406264-8b7bcb0ec2de'),
    U('1604655406264-8b7bcb0ec2de'), U('1609357605129-74f8b2fb0b3a'), U('1604654894610-df63bc536371'),
    U('1616394584738-fc6e612e71b9'), U('1604655406264-8b7bcb0ec2de'), U('1609357605129-74f8b2fb0b3a'),
    U('1589710046942-99a62d5b7d33'),
  ],
  clothing: [
    U('1539109136881-3be0616acf4b'), U('1483985988355-763728e1feb3'), U('1558618666-fcd25c85cd64'),
    U('1509631179647-0177331693ae'), U('1485968579580-b6d095142e6e'), U('1469334031218-e382a71b716b'),
    U('1515886657613-9f3515b0c78f'), U('1529139574466-a303027f1573'), U('1490481651871-ab68de25d43d'),
    U('1475180098004-ca85ac6bda5a'), U('1496747986456-6e1f38a50984'), U('1445205170230-053b83016050'),
  ],
  shirt: [
    U('1596462502278-27bfdc0c5c7c'), U('1490481651871-ab68de25d43d'), U('1529139574466-a303027f1573'),
    U('1539109136881-3be0616acf4b'), U('1509631179647-0177331693ae'), U('1515886657613-9f3515b0c78f'),
    U('1496747986456-6e1f38a50984'), U('1434389677669-e08b4cac3105'), U('1458071103292-7bbcaa9acdb8'),
    U('1551488831-00ddcb6c6bd3'),
  ],
  pants: [
    U('1509631179647-0177331693ae'), U('1548036328-c9fa89d128fa'), U('1515886657613-9f3515b0c78f'),
    U('1475180098004-ca85ac6bda5a'), U('1490481651871-ab68de25d43d'), U('1558618666-fcd25c85cd64'),
    U('1496747986456-6e1f38a50984'), U('1434389677669-e08b4cac3105'), U('1529139574466-a303027f1573'),
    U('1483985988355-763728e1feb3'),
  ],
  shorts: [
    U('1502234402759-845e8ad35d08'), U('1515886657613-9f3515b0c78f'), U('1529139574466-a303027f1573'),
    U('1469334031218-e382a71b716b'), U('1475180098004-ca85ac6bda5a'), U('1496747986456-6e1f38a50984'),
    U('1558618666-fcd25c85cd64'), U('1483985988355-763728e1feb3'), U('1445205170230-053b83016050'),
  ],
  swimwear: [
    U('1506905925346-21bda4d32df4'), U('1504703395-8ed40b390e98'), U('1531746020798-e6953c6e8e04'),
    U('1502234402759-845e8ad35d08'), U('1520333789090-1bee5c7a3914'), U('1469334031218-e382a71b716b'),
    U('1519699047748-de8e457a634e'), U('1507003211169-0a1dd7228f2d'), U('1445205170230-053b83016050'),
    U('1559825481-12a05cc00344'),
  ],
  hat: [
    U('1520333789090-1bee5c7a3914'), U('1529139574466-a303027f1573'), U('1445205170230-053b83016050'),
    U('1496747986456-6e1f38a50984'), U('1515886657613-9f3515b0c78f'), U('1483985988355-763728e1feb3'),
    U('1558618666-fcd25c85cd64'), U('1469334031218-e382a71b716b'), U('1502234402759-845e8ad35d08'),
  ],
  shoes: [
    U('1543163521-1bf539c55dd2'), U('1542291026-7eec264c27ff'), U('1490481651871-ab68de25d43d'),
    U('1515347850060-ce68b3a1082c'), U('1562273138-f46be4ebdf33'), U('1465877861265-d466a66a3d2f'),
    U('1583743814966-8d4f4a7db48a'), U('1525966222134-84af29c66f9a'), U('1539306094-c57afd3e8d36'),
    U('1518049512924-a8b40d8c3cf5'),
  ],
  earrings: [
    U('1617038260897-41a533ad3306'), U('1599643478518-a784e5dc4c8f'), U('1522688032-4eec0a0b1bda'),
    U('1508214751196-bcfd4ca60f91'), U('1519440335-00a40da53c89'), U('1457972851976-6b3f4fe36fa9'),
    U('1536243288391-a7c02f85ade1'), U('1540552394-11e82b265b04'), U('1587836374828-07e5d2a5a57b'),
    U('1534528741775-53994a69daeb'),
  ],
  necklace: [
    U('1599643478518-a784e5dc4c8f'), U('1617038260897-41a533ad3306'), U('1508214751196-bcfd4ca60f91'),
    U('1535632066927-ab7c9ab60908'), U('1519440335-00a40da53c89'), U('1536243288391-a7c02f85ade1'),
    U('1540552394-11e82b265b04'), U('1487412947147-5cebf100d293'), U('1522688032-4eec0a0b1bda'),
    U('1534528741775-53994a69daeb'),
  ],
  bracelet: [
    U('1535632066927-ab7c9ab60908'), U('1599643478518-a784e5dc4c8f'), U('1617038260897-41a533ad3306'),
    U('1536243288391-a7c02f85ade1'), U('1540552394-11e82b265b04'), U('1587836374828-07e5d2a5a57b'),
    U('1519440335-00a40da53c89'), U('1508214751196-bcfd4ca60f91'), U('1522688032-4eec0a0b1bda'),
  ],
  watch: [
    U('1523275335684-37898b6baf30'), U('1547996160-3c1768e18a0c'), U('1585386959604-600f84ccd98e'),
    U('1622434641406-a158123450f9'), U('1539185483977-ebf076e21cda'), U('1619134778072-1bbf88d68d07'),
    U('1508685096489-eafad6ae69af'), U('1548169878-6f6a7a447f74'), U('1526045431048-f857369baa9c'),
    U('1612817288484-6f916006741a'),
  ],
  ring: [
    U('1605100804763-247f67b3557e'), U('1535632066927-ab7c9ab60908'), U('1599643478518-a784e5dc4c8f'),
    U('1540552394-11e82b265b04'), U('1587836374828-07e5d2a5a57b'), U('1536243288391-a7c02f85ade1'),
    U('1617038260897-41a533ad3306'), U('1519440335-00a40da53c89'), U('1508214751196-bcfd4ca60f91'),
    U('1534528741775-53994a69daeb'),
  ],
  belt: [
    U('1548036328-c9fa89d128fa'), U('1509631179647-0177331693ae'), U('1483985988355-763728e1feb3'),
    U('1515886657613-9f3515b0c78f'), U('1529139574466-a303027f1573'), U('1490481651871-ab68de25d43d'),
    U('1434389677669-e08b4cac3105'), U('1496747986456-6e1f38a50984'), U('1475180098004-ca85ac6bda5a'),
    U('1558618666-fcd25c85cd64'),
  ],
};

// ─── All available creation domains ──────────────────────────────────────────

const SECTIONS = [
  {
    section: 'Beauty',
    domains: [
      {
        id:       'hair',
        title:    'Hair Architecture',
        subtitle: 'Style, color, texture & cut',
        anchors:  ['HAIR'],
      },
      {
        id:       'barber',
        title:    'Barber Studio',
        subtitle: 'Fade, taper & line work',
        anchors:  ['BARBER'],
      },
      {
        id:       'makeup',
        title:    'Makeup Artist',
        subtitle: 'Eyes, lips, contour & finish',
        anchors:  ['MAKEUP'],
      },
      {
        id:       'nails',
        title:    'Nail Designer',
        subtitle: 'Art, shape, finish & detail',
        anchors:  ['NAILS'],
      },
    ],
  },
  {
    section: 'Clothing',
    domains: [
      {
        id:       'clothing',
        title:    'Full Outfit Stylist',
        subtitle: 'Complete head-to-toe editorial look',
        anchors:  ['FULL_OUTFIT'],
      },
      {
        id:       'shirt',
        title:    'Tops & Blouses',
        subtitle: 'Shirts, blouses & upper garments',
        anchors:  ['SHIRT'],
      },
      {
        id:       'pants',
        title:    'Trousers & Bottoms',
        subtitle: 'Pants, wide-leg, tailored cuts',
        anchors:  ['PANTS'],
      },
      {
        id:       'shorts',
        title:    'Shorts',
        subtitle: 'Casual, tailored & bermuda cuts',
        anchors:  ['SHORTS'],
      },
      {
        id:       'swimwear',
        title:    'Swimwear',
        subtitle: 'One-piece, bikini & resort looks',
        anchors:  ['SWIMWEAR'],
      },
      {
        id:       'hat',
        title:    'Headwear',
        subtitle: 'Hats, caps, berets & fascinators',
        anchors:  ['HAT'],
      },
    ],
  },
  {
    section: 'Accessories',
    domains: [
      {
        id:       'shoes',
        title:    'Footwear',
        subtitle: 'Heels, sneakers, boots & loafers',
        anchors:  ['SHOES'],
      },
      {
        id:       'earrings',
        title:    'Earrings',
        subtitle: 'Studs, hoops, drops & statement',
        anchors:  ['EARRINGS'],
      },
      {
        id:       'necklace',
        title:    'Necklace',
        subtitle: 'Chains, pendants & layered looks',
        anchors:  ['NECKLACE'],
      },
      {
        id:       'bracelet',
        title:    'Bracelet',
        subtitle: 'Cuffs, bangles & stacked wrists',
        anchors:  ['BRACELET'],
      },
      {
        id:       'watch',
        title:    'Watch',
        subtitle: 'Sport, dress & luxury timepieces',
        anchors:  ['WATCH'],
      },
      {
        id:       'ring',
        title:    'Ring',
        subtitle: 'Statement, stacked & fine jewelry',
        anchors:  ['RING'],
      },
      {
        id:       'belt',
        title:    'Belt',
        subtitle: 'Leather, chain & waist detail',
        anchors:  ['BELT'],
      },
    ],
  },
];

// Roman numeral section labels for luxury aesthetic
const SECTION_NUMERALS: Record<string, string> = {
  Beauty:      'I',
  Clothing:    'II',
  Accessories: 'III',
};

interface StudioConciergeProps {
  onSelect: (id: string, name: string) => void;
}

export const StudioConcierge: React.FC<StudioConciergeProps> = ({ onSelect }) => {
  const { profile, isAdmin } = useAuth();
  const [hovered, setHovered] = useState<string | null>(null);

  // Cycling image indices — each domain advances independently, offset so they're never in sync
  const allDomainIds = SECTIONS.flatMap(s => s.domains.map(d => d.id));
  const [imgIndices, setImgIndices] = useState<Record<string, number>>(() =>
    Object.fromEntries(allDomainIds.map((id, i) => [id, i % (DOMAIN_POOLS[id]?.length ?? 1)]))
  );
  const tickRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      tickRef.current += 1;
      setImgIndices(prev => {
        const next = { ...prev };
        // Advance one domain per tick in round-robin so cards don't all flip simultaneously
        const domainToAdvance = allDomainIds[tickRef.current % allDomainIds.length];
        const pool = DOMAIN_POOLS[domainToAdvance];
        if (pool) next[domainToAdvance] = (prev[domainToAdvance] + 1) % pool.length;
        return next;
      });
    }, 2800);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const creditsPerRun = CREDIT_COST.forgeRun; // standard — concierge routes to standard editorial
  const canForge = isAdmin || (profile ? profile.imageCredits >= creditsPerRun : false);

  return (
    <div className="min-h-[80vh] px-6 md:px-16 py-16 space-y-20 bg-[#050505]">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-12"
      >
        <div>
          <p className="text-[9px] font-mono uppercase tracking-[0.6em] text-[#C5A253]/50 mb-3">
            Sovereign Session Initialization
          </p>
          <h2 className="text-5xl font-serif italic text-white">Select Your Domain</h2>
        </div>

        {/* Credit status */}
        {profile && (
          <div className="flex items-center gap-4 shrink-0">
            <div className={`flex items-center gap-2 px-4 py-2 border ${canForge ? 'border-[#C5A253]/20 bg-[#C5A253]/[0.03]' : 'border-red-500/20 bg-red-500/[0.03]'}`}>
              <Zap size={10} className={canForge ? 'text-[#C5A253]' : 'text-red-400'} />
              <span className={`text-[9px] font-mono ${canForge ? 'text-[#C5A253]' : 'text-red-400'}`}>
                {profile.imageCredits} credits available
              </span>
            </div>
            <div className="text-[9px] font-mono text-white/20 uppercase tracking-[0.3em]">
              1 credit per run
            </div>
          </div>
        )}
      </motion.div>

      {/* Low credit warning */}
      {profile && !canForge && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 border border-red-500/20 bg-red-500/[0.03] text-center"
        >
          <p className="text-red-400 text-[10px] font-mono uppercase tracking-widest">
            Insufficient credits — each forge run costs {creditsPerRun} image credit.
            <a href="/pricing" className="ml-2 underline hover:text-red-300">Upgrade your plan →</a>
          </p>
        </motion.div>
      )}

      {/* Domain sections */}
      {SECTIONS.map((sec, sIdx) => (
        <motion.div
          key={sec.section}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: sIdx * 0.12, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6"
        >
          {/* Section label */}
          <div className="flex items-center gap-6">
            <span className="text-[9px] font-mono uppercase tracking-[0.5em] text-white/20">
              {SECTION_NUMERALS[sec.section]}
            </span>
            <span className="text-[11px] font-mono uppercase tracking-[0.5em] text-white/40">
              {sec.section}
            </span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* Domain cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {sec.domains.map((domain, dIdx) => {
              const isHovered = hovered === domain.id;
              return (
                <motion.button
                  key={domain.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: sIdx * 0.12 + dIdx * 0.05, duration: 0.6 }}
                  whileHover={{ scale: canForge ? 1.02 : 1 }}
                  whileTap={{ scale: canForge ? 0.98 : 1 }}
                  onMouseEnter={() => setHovered(domain.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => canForge && onSelect(domain.id, domain.title)}
                  disabled={!canForge}
                  className={`group relative text-left p-6 border transition-all duration-500 overflow-hidden min-h-[140px] flex flex-col justify-end ${
                    canForge
                      ? isHovered
                        ? 'border-[#C5A253]/50 cursor-pointer shadow-[0_0_30px_-5px_rgba(197,162,83,0.15)]'
                        : 'border-white/5 cursor-pointer hover:border-white/20 hover:shadow-2xl'
                      : 'border-white/[0.03] cursor-not-allowed opacity-40'
                  }`}
                >
                  {/* CYCLING EDITORIAL IMAGE */}
                  <div className="absolute inset-0 z-0 bg-black overflow-hidden flex items-center justify-center">
                    <img
                      key={`${domain.id}-${imgIndices[domain.id]}`}
                      src={DOMAIN_POOLS[domain.id]?.[imgIndices[domain.id] ?? 0] ?? ''}
                      alt={domain.title}
                      className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-[1200ms] mix-blend-screen scale-100 group-hover:scale-110"
                      loading="lazy"
                    />
                    {/* Gradient overlay to ensure text legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/70 to-transparent" />
                  </div>

                  {/* DOMAIN CONTENT (Z-10 so it sits above image) */}
                  <div className="relative z-10 w-full mt-auto">
                    {/* Title */}
                    <p className={`text-[13px] font-serif text-white mb-1 transition-colors duration-500 drop-shadow-md ${
                      isHovered && canForge ? 'text-[#C5A253]' : ''
                    }`}>
                      {domain.title}
                    </p>

                    {/* Subtitle */}
                    <p className="text-[8px] font-mono uppercase tracking-[0.3em] text-white/50 leading-relaxed drop-shadow-md">
                      {domain.subtitle}
                    </p>

                    {/* Credit cost chip */}
                    <div className={`mt-4 w-fit flex items-center gap-1.5 transition-opacity duration-300 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-sm border border-[#C5A253]/10 ${
                      isHovered && canForge ? 'opacity-100' : 'opacity-0'
                    }`}>
                      <Zap size={8} className="text-[#C5A253]" />
                      <span className="text-[8px] font-mono text-[#C5A253]/80 uppercase tracking-widest drop-shadow-md">
                        1 credit
                      </span>
                    </div>
                  </div>

                  {/* Corner mark on hover */}
                  {isHovered && canForge && (
                    <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-[#C5A253]/60 z-10 transition-all duration-300" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      ))}

      {/* Footer note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center text-[9px] font-mono uppercase tracking-[0.4em] text-white/15 pb-8"
      >
        Each session generates 1 unique editorial image · 1 image credit per run
      </motion.p>
    </div>
  );
};
