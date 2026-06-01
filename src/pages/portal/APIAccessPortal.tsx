import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, Copy, Eye, EyeOff, RefreshCw, Webhook, Check, AlertTriangle, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="relative rounded overflow-hidden" style={{ background: '#060608', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.05]">
        <span className="text-[7px] font-mono tracking-[0.3em] uppercase text-white/20">{language}</span>
        <button onClick={copy} className="flex items-center gap-1.5 text-[7px] font-mono text-white/20 hover:text-[#B8952A] transition-colors uppercase tracking-[0.2em]">
          {copied ? <><Check size={9} /> Copied</> : <><Copy size={9} /> Copy</>}
        </button>
      </div>
      <pre className="px-4 py-3 text-[10px] font-mono text-white/50 overflow-x-auto leading-relaxed">{code}</pre>
    </div>
  );
}

export default function APIAccessPortal() {
  const { brand, user } = useAuth();
  const [showKey, setShowKey] = useState(false);
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [issuingKey, setIssuingKey] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(brand?.webhookUrl || '');
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [webhookSaved, setWebhookSaved] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; status?: number } | null>(null);

  async function issueApiKey() {
    if (!user) return;
    setIssuingKey(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/v1/api-key/issue', { method: 'POST', headers: { 'Authorization': `Bearer ${idToken}` } });
      if (res.ok) {
        const data = await res.json();
        setRawKey(data.rawKey);
        setShowKey(true);
      }
    } catch (err) { console.error(err); }
    setIssuingKey(false);
  }

  async function saveWebhook() {
    if (!user) return;
    setSavingWebhook(true);
    try {
      const idToken = await user.getIdToken();
      await fetch('/api/v1/webhooks/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ url: webhookUrl }),
      });
      setWebhookSaved(true);
      setTimeout(() => setWebhookSaved(false), 2500);
    } catch (err) { console.error(err); }
    setSavingWebhook(false);
  }

  async function testWebhook() {
    if (!user || !webhookUrl) return;
    setTestingWebhook(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/v1/webhooks/test', { method: 'POST', headers: { 'Authorization': `Bearer ${idToken}` } });
      const data = await res.json();
      setTestResult({ ok: data.delivered, status: data.httpStatus });
    } catch { setTestResult({ ok: false }); }
    setTestingWebhook(false);
  }

  const curlExample = `curl -X POST https://luxaura.app/api/v1/forge/generate \\
  -H "X-Brand-API-Key: ${brand?.apiKeyPrefix || 'lux_live_'}..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "skuId": "sku_xxxxx",
    "config": {
      "lighting": "Clean & Even",
      "camera": "Soft Background (85mm)"
    }
  }'`;

  const nodeExample = `const res = await fetch('https://luxaura.app/api/v1/forge/generate', {
  method: 'POST',
  headers: {
    'X-Brand-API-Key': process.env.LUXAURA_API_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ skuId: 'sku_xxxxx', config: {} }),
});`;

  return (
    <div className="p-8 min-h-full max-w-3xl">
      <div className="mb-8">
        <h1 className="font-serif italic text-4xl text-white mb-2">API Access</h1>
        <p className="text-[9px] font-mono tracking-[0.35em] uppercase text-white/25">
          Integrate LuxAura into your existing workflows via REST API
        </p>
      </div>

      {/* API Key */}
      <div className="rounded p-6 mb-6 flex flex-col gap-5"
        style={{ background: 'linear-gradient(145deg, #111116 0%, #0B0B0E 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-[7px] font-mono tracking-[0.45em] uppercase text-white/25">API Key</p>

        {/* Current key or new key display */}
        {rawKey ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 p-3 rounded"
              style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <Check size={12} className="text-emerald-500 flex-shrink-0" />
              <p className="text-[9px] font-mono text-emerald-400">New API key generated. Copy it now — it will not be shown again.</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(184,149,42,0.3)' }}>
              <code className="text-[10px] font-mono text-[#B8952A] flex-1 break-all">
                {showKey ? rawKey : `${rawKey.slice(0, 12)}${'•'.repeat(32)}`}
              </code>
              <button onClick={() => setShowKey(s => !s)} className="text-white/20 hover:text-white/60 transition-colors p-1">
                {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
              <button onClick={() => { navigator.clipboard.writeText(rawKey); }}
                className="text-white/20 hover:text-[#B8952A] transition-colors p-1">
                <Copy size={13} />
              </button>
            </div>
          </div>
        ) : brand?.apiKeyPrefix ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <code className="text-[10px] font-mono text-white/40">
                {brand.apiKeyPrefix}{'•'.repeat(32)}
              </code>
            </div>
            <button onClick={issueApiKey} disabled={issuingKey}
              className="flex items-center gap-2 px-4 py-2.5 rounded border border-white/[0.08] text-[9px] font-mono text-white/40 hover:text-white hover:border-white/20 transition-all uppercase tracking-[0.2em] flex-shrink-0">
              <RefreshCw size={11} className={issuingKey ? 'animate-spin' : ''} /> Regenerate
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-[9px] font-mono text-white/25">No API key issued yet</p>
            <button onClick={issueApiKey} disabled={issuingKey}
              className="flex items-center gap-2 px-5 py-2.5 rounded bg-[#B8952A] text-black text-[10px] font-mono tracking-[0.2em] uppercase font-semibold transition-all">
              <Code2 size={12} /> Generate API Key
            </button>
          </div>
        )}
      </div>

      {/* Webhook */}
      <div className="rounded p-6 mb-6 flex flex-col gap-4"
        style={{ background: 'linear-gradient(145deg, #111116 0%, #0B0B0E 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <Webhook size={13} className="text-[#B8952A]" />
          <p className="text-[7px] font-mono tracking-[0.45em] uppercase text-white/25">Webhook Endpoint</p>
        </div>
        <p className="text-[8px] font-mono text-white/25">
          LuxAura will POST signed events to this URL for SKU enrollment, campaign completion, and quota alerts.
        </p>
        <div className="flex gap-3">
          <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)}
            placeholder="https://your-system.com/hooks/luxaura" type="url"
            className="flex-1 px-3 py-2.5 rounded text-[11px] font-mono text-white/60 outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }} />
          <button onClick={saveWebhook} disabled={savingWebhook || !webhookUrl}
            className="flex items-center gap-2 px-4 py-2.5 rounded text-[9px] font-mono tracking-[0.2em] uppercase font-semibold disabled:opacity-40 transition-all"
            style={{ background: webhookSaved ? '#10B981' : '#B8952A', color: '#000' }}>
            {webhookSaved ? <><Check size={11} /> Saved</> : 'Save'}
          </button>
          {webhookUrl && (
            <button onClick={testWebhook} disabled={testingWebhook}
              className="flex items-center gap-2 px-4 py-2.5 rounded border border-white/[0.08] text-[9px] font-mono text-white/40 hover:text-white transition-all uppercase tracking-[0.2em]">
              {testingWebhook ? 'Testing...' : 'Test'}
            </button>
          )}
        </div>
        {testResult && (
          <div className="flex items-center gap-2 text-[8px] font-mono"
            style={{ color: testResult.ok ? '#10B981' : '#EF4444' }}>
            {testResult.ok ? <Check size={10} /> : <AlertTriangle size={10} />}
            {testResult.ok ? `Delivery successful (HTTP ${testResult.status})` : 'Delivery failed — check your endpoint'}
          </div>
        )}
      </div>

      {/* API Docs */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-[7px] font-mono tracking-[0.45em] uppercase text-white/25">Quick Reference</p>
          <button className="flex items-center gap-1.5 text-[7px] font-mono text-white/20 hover:text-[#B8952A] transition-colors uppercase tracking-[0.3em]">
            <ExternalLink size={9} /> Full Docs
          </button>
        </div>

        <div className="flex gap-2 mb-2">
          {['curl', 'node.js'].map(lang => (
            <button key={lang} className="px-3 py-1.5 rounded text-[8px] font-mono text-white/30 hover:text-white transition-all uppercase tracking-[0.2em]"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {lang}
            </button>
          ))}
        </div>

        <CodeBlock code={curlExample} language="curl" />
        <CodeBlock code={nodeExample} language="node.js" />

        {/* Event types */}
        <div className="rounded overflow-hidden"
          style={{ background: 'linear-gradient(145deg, #111116 0%, #0B0B0E 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <p className="text-[7px] font-mono tracking-[0.45em] uppercase text-white/25">Webhook Event Types</p>
          </div>
          {[
            ['sku.enrolled',      'SKU enrollment complete — DNA locked'],
            ['campaign.complete', 'Campaign generation finished — images ready'],
            ['campaign.failed',   'Campaign generation failed'],
            ['quota.warning',     '80% quota threshold reached'],
            ['quota.critical',    '95% quota threshold reached'],
            ['set.calibrated',    'Set injection spatial calibration complete'],
          ].map(([event, desc]) => (
            <div key={event} className="flex items-center gap-4 px-5 py-3 border-b border-white/[0.04] last:border-0">
              <code className="text-[9px] font-mono text-[#B8952A] w-40 flex-shrink-0">{event}</code>
              <span className="text-[9px] font-mono text-white/30">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
