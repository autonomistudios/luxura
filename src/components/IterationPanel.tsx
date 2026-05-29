import { useState } from 'react';
import { RenderEngine } from '../lib/render-engine';

const engine = new RenderEngine('');

type IterationType = 'composition_shift' | 'pose_variant' | 'feature_enhance';

const ITERATION_TYPES: { id: IterationType; label: string; hint: string }[] = [
  { id: 'feature_enhance',   label: 'Enhance Detail',      hint: 'Sharpen texture, lighting, skin, or accessory' },
  { id: 'composition_shift', label: 'Reframe Shot',        hint: 'Adjust crop, angle, or subject positioning' },
  { id: 'pose_variant',      label: 'Change Pose',         hint: 'New body language — identity & garment locked' },
];

interface IterationPanelProps {
  masterImage: string;  // data URL of the selected grid image
  onClose: () => void;
}

export default function IterationPanel({ masterImage, onClose }: IterationPanelProps) {
  const [iterationType, setIterationType] = useState<IterationType>('feature_enhance');
  const [adjustmentPrompt, setAdjustmentPrompt] = useState('');
  const [results, setResults] = useState<(string | null)[]>([null, null, null]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRefine() {
    if (!adjustmentPrompt.trim()) return;
    setRunning(true);
    setError(null);
    setResults([null, null, null]);

    try {
      await engine.executeIterationLoop(
        masterImage,
        adjustmentPrompt,
        iterationType,
        (slot, image) => {
          setResults((prev) => {
            const next = [...prev];
            next[slot] = image;
            return next;
          });
        },
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Iteration failed.');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-[#FAF9F7] border-t border-[#E5E0D8] rounded-t-2xl p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#8A867D]">Refinement Studio</p>
            <h2 className="text-sm font-light text-[#1A1A1A] mt-0.5">Iterate on Master</h2>
          </div>
          <button onClick={onClose} className="text-[#8A867D] hover:text-[#1A1A1A] text-xs transition-colors">
            ✕ close
          </button>
        </div>

        {/* Master + Controls */}
        <div className="flex gap-6">
          {/* Master thumbnail */}
          <div className="flex-shrink-0">
            <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#8A867D] mb-2">Master</p>
            <img
              src={masterImage}
              alt="Master"
              className="w-28 h-36 object-cover rounded border border-[#E5E0D8]"
            />
          </div>

          {/* Controls */}
          <div className="flex-1 space-y-4">
            {/* Iteration type */}
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#8A867D] mb-2">Refinement Mode</p>
              <div className="grid grid-cols-3 gap-2">
                {ITERATION_TYPES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setIterationType(t.id)}
                    className={`py-2 px-3 text-left rounded border transition-all ${
                      iterationType === t.id
                        ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white'
                        : 'border-[#E5E0D8] bg-white text-[#1A1A1A] hover:border-[#1A1A1A]'
                    }`}
                  >
                    <span className="block text-xs font-medium">{t.label}</span>
                    <span className="block text-[10px] opacity-60 mt-0.5 leading-tight">{t.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt */}
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#8A867D] mb-2">
                Adjustment Directive
              </p>
              <textarea
                value={adjustmentPrompt}
                onChange={(e) => setAdjustmentPrompt(e.target.value)}
                placeholder={
                  iterationType === 'composition_shift' ? 'e.g. Tighten to a three-quarter crop, more negative space on the right' :
                  iterationType === 'pose_variant'      ? 'e.g. Model looks over left shoulder, slight lean into the light' :
                                                          'e.g. Enhance fabric texture on the bodice, deepen shadow definition'
                }
                rows={3}
                className="w-full bg-white border border-[#E5E0D8] rounded text-xs text-[#1A1A1A] p-3 resize-none focus:outline-none focus:border-[#1A1A1A] placeholder:text-[#C5BFB5]"
              />
            </div>

            {/* CTA */}
            <button
              onClick={handleRefine}
              disabled={running || !adjustmentPrompt.trim()}
              className="w-full py-2.5 bg-[#1A1A1A] text-white text-xs font-mono uppercase tracking-widest rounded hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {running ? 'Refining — 3 variants generating...' : 'Refine  ·  2 credits'}
            </button>

            {error && (
              <p className="text-xs text-red-500 mt-1">{error}</p>
            )}
          </div>
        </div>

        {/* Results grid */}
        <div>
          <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#8A867D] mb-3">Refined Variants</p>
          <div className="grid grid-cols-3 gap-3">
            {results.map((img, i) => (
              <div key={i} className="aspect-[3/4] bg-[#F0EDE8] rounded border border-[#E5E0D8] overflow-hidden relative">
                {img ? (
                  <>
                    <img src={img} alt={`Variant ${i + 1}`} className="w-full h-full object-cover" />
                    <a
                      href={img}
                      download={`iteration-${i + 1}.jpg`}
                      className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-mono px-2 py-1 rounded hover:bg-black transition-colors"
                    >
                      ↓
                    </a>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {running ? (
                      <div className="w-5 h-5 border border-[#C5BFB5] border-t-[#1A1A1A] rounded-full animate-spin" />
                    ) : (
                      <span className="font-mono text-[9px] text-[#C5BFB5] uppercase tracking-widest">
                        {i + 1}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
