import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  { id: 'nails',      name: 'Nail Designer',    artifact: '/assets/icon_nails.png',           result: '/assets/master_nails.png',          subtext: '3D Gold-Leaf Architecture' },
  { id: 'hairstylist',name: 'Hair Stylist',      artifact: '/assets/icon_hair.png',            result: '/assets/master_hair.png',           subtext: 'Topological Fiber Integrity' },
  { id: 'clothing',   name: 'Noir Kinetic',      artifact: '/assets/icon_clothing.png',        result: '/assets/master_clothing_noir.png',  subtext: 'Bespoke Obsidian Velvet' },
  { id: 'makeup',     name: 'Makeup Artist',     artifact: '/assets/icon_makeup.png',          result: '/assets/master_makeup.png',         subtext: 'Macro-Pigment Blending' },
  { id: 'barber',     name: 'Barber Director',   artifact: '/assets/icon_barber_mercury.png',  result: '/assets/master_barber_noir.png',    subtext: 'Follicle Fade Precision' },
];

export default function EditorialGrid() {
  const navigate = useNavigate();

  const handleSelect = (id: string) => {
    setTimeout(() => { navigate(`/workflow/${id}`); }, 800);
  };

  return (
    <div className="max-w-[1600px] mx-auto px-8 py-32 transition-colors duration-1000">
      <header className="mb-32 border-b border-[#1C1C1C]/8 pb-10 blur-in" style={{ animationDelay: '0.2s' }}>
        <h1 className="text-7xl font-serif text-[#1C1C1C] tracking-tighter leading-none mb-6 luxury-script">
          The <span className="text-[#D4AF37]">Atelier</span>
        </h1>
        <p className="text-[11px] font-mono uppercase tracking-[0.6em] text-[#1C1C1C]/40">
          SELECT A DISCIPLINE TO INITIALIZE THE MASTER RENDER
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-24">
        {CATEGORIES.map((cat, i) => (
          <button
            key={i}
            type="button"
            className="group cursor-pointer blur-in text-left w-full block focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50"
            style={{ animationDelay: `${0.3 + (i * 0.1)}s` }}
            onClick={() => handleSelect(cat.id)}
          >
            {/* Artifact tile */}
            <div className="aspect-square mb-6 bg-[#F2EFE9] border border-[#1C1C1C]/8 flex items-center justify-center overflow-hidden transition-all duration-700 group-hover:border-[#D4AF37]/30">
              <img src={cat.artifact} alt={`${cat.name} Artifact`} className="w-1/2 object-contain opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
            </div>

            {/* Result photography */}
            <div className="aspect-[4/5] overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-[1.5s] ease-out">
              <img src={cat.result} alt={`${cat.name} Master`} className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-[2s] ease-out" />
            </div>

            {/* Typography */}
            <div className="mt-8 border-l border-[#1C1C1C]/10 pl-6 transition-colors duration-700 group-hover:border-[#D4AF37]/30">
              <h3 className="text-4xl font-serif text-[#1C1C1C] mb-2 group-hover:text-[#D4AF37] transition-colors luxury-script">
                {cat.name}
              </h3>
              <p className="text-[9px] font-mono uppercase tracking-[0.4em] text-[#1C1C1C]/40">
                {cat.subtext}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
