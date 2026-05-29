// Asset_Matrix_V1

interface ForgeTileProps {
  id: number;
  image?: string;
  category: string;
  fidelity: number;
  onSelect: (id: number) => void;
}

function ForgeTile({ id, image, category, fidelity, onSelect }: ForgeTileProps) {
  return (
    <button
      type="button"
      className="forge-tile dna-helix-scan text-left w-full block focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50"
      onClick={() => onSelect(id)}
    >
      <div className="fidelity-score">
        FID_ROI: <span style={{ color: 'white' }}>{fidelity}%</span>
      </div>
      
      {image ? (
        <img src={image} alt={`Style ${id}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ textAlign: 'center', opacity: 0.1 }}>
            <h4 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>PBP_DRAFT</h4>
            <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{category.toUpperCase()}_L4_V{id}</p>
          </div>
        </div>
      )}
      
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '16px', opacity: 0.8 }}>
        <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'white' }}>Asset_Matrix_V{id}</h4>
        <p style={{ fontSize: '0.6rem', color: 'var(--accent-gold)' }}>LATENT_SAMPLER: IMAGEN_3_FAST</p>
      </div>
    </button>
  );
}

interface ForgeMatrixProps {
  category: string;
  onSelect: (id: number) => void;
}

export default function ForgeMatrix({ category, onSelect }: ForgeMatrixProps) {
  return (
    <div className="forge-matrix">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((id) => (
        <ForgeTile 
          key={id} 
          id={id} 
          category={category} 
          fidelity={id === 1 ? 98 : 88 + (id % 10)} 
          onSelect={onSelect} 
        />
      ))}
    </div>
  );
}
