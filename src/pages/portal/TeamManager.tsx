import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Trash2, Crown, Shield, Edit3, Eye } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { BrandRole } from '../../contexts/AuthContext';

import { ROLE_LABELS } from '../../lib/permissions';

// Labels come from the canonical permission model (job titles over role tiers);
// icon/color/desc are presentation only.
const ROLE_CONFIG: Record<BrandRole, { label: string; icon: any; color: string; desc: string }> = {
  owner:  { label: ROLE_LABELS.owner,  icon: Crown,  color: '#D4AF37', desc: 'Full access · billing · API keys' },
  admin:  { label: ROLE_LABELS.admin,  icon: Shield, color: '#B8952A', desc: 'Forge, SKUs, team — no billing' },
  editor: { label: ROLE_LABELS.editor, icon: Edit3,  color: 'rgba(255,255,255,0.6)', desc: 'Forge, enroll SKUs, refine, export' },
  viewer: { label: ROLE_LABELS.viewer, icon: Eye,    color: 'rgba(255,255,255,0.3)', desc: 'Browse & export assets only' },
};

interface Member { uid: string; email: string; role: BrandRole; joinedAt: string; }

export default function TeamManager() {
  const { user, brand, can } = useAuth();
  const canManageTeam = can('manageTeam');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<BrandRole>('editor');
  const [inviting, setInviting] = useState(false);
  const [members, setMembers] = useState<Member[]>([
    { uid: user?.uid || 'owner', email: user?.email || 'owner@brand.com', role: 'owner', joinedAt: brand?.billing?.currentPeriodEnd || new Date().toISOString() },
  ]);

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const idToken = await user?.getIdToken();
      const res = await fetch('/api/v1/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (res.ok) {
        setMembers(prev => [...prev, {
          uid: `invite_${Date.now()}`, email: inviteEmail, role: inviteRole, joinedAt: new Date().toISOString(),
        }]);
        setInviteEmail('');
      }
    } catch (err) { console.error(err); }
    setInviting(false);
  }

  return (
    <div className="p-8 min-h-full max-w-3xl">
      <div className="mb-8">
        <h1 className="font-serif italic text-4xl text-white mb-2">Team</h1>
        <p className="text-[9px] font-mono tracking-[0.35em] uppercase text-white/25">
          Manage brand workspace access and permissions
        </p>
      </div>

      {/* Role permissions reference */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {(Object.entries(ROLE_CONFIG) as [BrandRole, typeof ROLE_CONFIG[BrandRole]][]).map(([role, cfg]) => (
          <div key={role} className="rounded p-4 flex flex-col gap-2"
            style={{ background: 'linear-gradient(145deg, #111116 0%, #0B0B0E 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <cfg.icon size={12} style={{ color: cfg.color }} />
              <span className="text-[9px] font-mono" style={{ color: cfg.color }}>{cfg.label}</span>
            </div>
            <p className="text-[7px] font-mono text-white/25 leading-relaxed">{cfg.desc}</p>
          </div>
        ))}
      </div>

      {/* Invite form — Creative Director (admin) and Owner only */}
      {canManageTeam ? (
      <div className="rounded p-6 mb-6 flex flex-col gap-4"
        style={{ background: 'linear-gradient(145deg, #111116 0%, #0B0B0E 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-[7px] font-mono tracking-[0.45em] uppercase text-white/25">Invite Team Member</p>
        <div className="flex gap-3">
          <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
            placeholder="colleague@brand.com" type="email"
            className="flex-1 px-3 py-2.5 rounded text-[11px] font-mono text-white/60 outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}
            onKeyDown={e => e.key === 'Enter' && handleInvite()} />
          <select value={inviteRole} onChange={e => setInviteRole(e.target.value as BrandRole)}
            className="px-3 py-2.5 rounded text-[10px] font-mono text-white/60 outline-none appearance-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}>
            {(['editor', 'admin', 'viewer'] as BrandRole[]).map(r => (
              <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
            ))}
          </select>
          <button onClick={handleInvite} disabled={!inviteEmail || inviting}
            className="flex items-center gap-2 px-5 py-2.5 rounded bg-[#B8952A] text-black text-[10px] font-mono tracking-[0.2em] uppercase font-semibold disabled:opacity-40 transition-all">
            <UserPlus size={12} /> Invite
          </button>
        </div>
      </div>
      ) : (
        <div className="rounded p-4 mb-6 flex items-center gap-2"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Eye size={11} className="text-white/25" />
          <p className="text-[8px] font-mono text-white/30 tracking-[0.15em] uppercase">
            Your role can view the team but cannot invite or change members
          </p>
        </div>
      )}

      {/* Members list */}
      <div className="rounded overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #111116 0%, #0B0B0E 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <p className="text-[7px] font-mono tracking-[0.45em] uppercase text-white/25">
            {members.length} Member{members.length !== 1 ? 's' : ''}
          </p>
        </div>
        {members.map((member, i) => {
          const cfg = ROLE_CONFIG[member.role];
          const isCurrentUser = member.uid === user?.uid;
          return (
            <motion.div key={member.uid}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 px-5 py-4 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.01] transition-colors">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: `${cfg.color}20`, border: `1px solid ${cfg.color}40` }}>
                <span className="text-[9px] font-mono" style={{ color: cfg.color }}>
                  {member.email[0].toUpperCase()}
                </span>
              </div>

              {/* Email + joined */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-mono text-white/70 truncate">{member.email}</p>
                  {isCurrentUser && (
                    <span className="text-[6px] font-mono text-white/25 bg-white/[0.04] px-1.5 py-0.5 rounded tracking-[0.2em] uppercase">You</span>
                  )}
                </div>
                <p className="text-[8px] font-mono text-white/25 mt-0.5">
                  Joined {new Date(member.joinedAt).toLocaleDateString()}
                </p>
              </div>

              {/* Role */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded"
                style={{ background: `${cfg.color}10`, border: `1px solid ${cfg.color}30` }}>
                <cfg.icon size={9} style={{ color: cfg.color }} />
                <span className="text-[8px] font-mono" style={{ color: cfg.color }}>{cfg.label}</span>
              </div>

              {/* Remove (not self, not owner, requires manage-team) */}
              {canManageTeam && !isCurrentUser && member.role !== 'owner' && (
                <button
                  onClick={() => setMembers(prev => prev.filter(m => m.uid !== member.uid))}
                  className="text-white/15 hover:text-rose-400 transition-colors p-1">
                  <Trash2 size={12} />
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
