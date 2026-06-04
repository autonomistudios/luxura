import { Shield, Cpu } from "lucide-react";

export default function SovereignHeader() {
  return (
    <header className="sovereign-header" style={{
      height: 'var(--header-height)',
      borderBottom: '1px solid rgba(197,162,83, 0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2.5rem',
      background: 'rgba(13, 13, 13, 0.8)',
      backdropFilter: 'blur(10px)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div className="brand-logo">
          <Shield size={24} />
        </div>
        <div>
          <h2 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.2em', margin: 0 }}>LuxAura | <span style={{ color: 'var(--accent-gold)' }}>Studio 2</span></h2>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-gold)', boxShadow: '0 0 10px var(--accent-gold)' }}></div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            System: <span style={{ color: 'white' }}>Idle</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '8px 16px', background: 'rgba(197,162,83, 0.03)', borderRadius: '8px', border: '1px solid rgba(197,162,83, 0.05)' }}>
          <div className="ledger-item">
            <span className="ledger-label">Session_Fidelity:</span>
            <span className="ledger-value" style={{ color: 'white' }}>Ultra-2K</span>
          </div>
          <div style={{ width: '1px', height: '16px', background: 'rgba(197,162,83, 0.1)' }}></div>
          <div className="ledger-item">
            <Cpu size={14} style={{ color: 'var(--accent-gold)' }} />
            <span className="ledger-label">Aura_Latency:</span>
            <span className="ledger-value">12ms</span>
          </div>
        </div>
      </div>
    </header>
  );
}
