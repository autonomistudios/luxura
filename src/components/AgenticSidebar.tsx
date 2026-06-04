import { Terminal, BrainCircuit, ShieldAlert, Cpu } from 'lucide-react';

export interface HeartbeatToken {
  agent: string;
  message: string;
  status: 'active' | 'rejected' | 'verified' | 'refining';
}

interface AgenticSidebarProps {
  tokens: HeartbeatToken[];
}

export default function AgenticSidebar({ tokens }: AgenticSidebarProps) {
  return (
    <aside className="agentic-heartbeat" style={{
      width: '380px',
      height: '100vh',
      position: 'fixed',
      right: 0,
      top: 0,
      zIndex: 100,
      boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.5)'
    }}>
      <div style={{ paddingBottom: '24px', borderBottom: '1px solid rgba(197,162,83, 0.05)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Terminal size={18} style={{ color: 'var(--accent-gold)' }} />
        <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.2em', margin: 0 }}>Thought Stream</h3>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {tokens.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', opacity: 0.3 }}>
            <Cpu size={32} style={{ margin: '0 auto 16px', display: 'block' }} />
            <p>Awaiting Mantis Loop Activation...</p>
          </div>
        )}
        
        {tokens.map((token, index) => (
          <div key={index} className="heartbeat-token">
            <div className="token-agent" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 
                token.status === 'rejected' ? '#ff4444' : 
                token.status === 'verified' ? '#50c878' : 
                token.status === 'refining' ? '#f4a460' : 
                'var(--accent-gold)'
            }}>
              {token.status === 'active' && <BrainCircuit size={12} />}
              {token.status === 'rejected' && <ShieldAlert size={12} />}
              {token.agent.toUpperCase()}:
            </div>
            <div style={{ color: 'rgba(255,255,255,0.8)' }}>{token.message}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid rgba(197,162,83, 0.05)', fontSize: '0.65rem', opacity: 0.5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span>LOOP_LATENCY: <span style={{ color: 'white' }}>1024ms</span></span>
          <span>ROI_SHIELD: <span style={{ color: 'var(--accent-gold)' }}>ACTIVE</span></span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', height: '1px', width: '100%', marginBottom: '8px' }}></div>
        <span>MANTIS_SOUVREIGN_PROTOCOL_V3.8</span>
      </div>
    </aside>
  );
}
