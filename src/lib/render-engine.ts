import { auth } from './firebase';

/**
 * LuxAura Render Engine — Sovereign Edition v9.0
 *
 * Routes all generation through the /api/forge SSE endpoint.
 * Sends a Firebase ID token on every request (server-side auth enforcement).
 * Streams images to the caller as each slot completes via onProgress callback.
 */

export interface MantisRenderConfig {
  aspect_ratio: string;
  fidelity: string;
  isWhaleContract: boolean;
  sourceImage?: string;
  garmentImage?: string;   // Garment Studio: second image (mannequin, lookbook, flat-lay)
  locationPreset?: string;   // Full vivid location description — overrides background dropdown
  anchor?: string;
  anchors?: string[];
  strategy?: string;
  // Director Console selections — all become non-negotiable once set
  skinTone?: string;
  lighting?: string;
  background?: string;
  camera?: string;
  photoDirection?: string;  // 'full-spread' | style ID | 'high-fashion' | 'commercial'
  colorGrade?: string;  // Color grade preset label — keys from COLOR_GRADE_MAP in forge.js
  cameraFormat?: string;  // Camera format label — keys from CAMERA_FORMAT_MAP in forge.js
  userPrompt?: string;  // User's raw creative direction — passed separately from PBP string
  additionalModelImages?: string[];  // Extra model angle reference images (base64)
  additionalGarmentImages?: string[];  // Extra garment angle reference images (base64)
  gender?: string;          // Subject gender — keys from GENDER_MAP
  modelArchetype?: string;  // Model casting archetype — keys from MODEL_ARCHETYPE_MAP
  pose?: string;            // Pose direction — keys from POSE_MAP
  expression?: string;      // Expression direction — keys from EXPRESSION_MAP
  ageRange?: string;        // Age range — keys from AGE_RANGE_MAP
  shotType?: string;        // Shot type — keys from SHOT_TYPE_MAP
  atmosphere?: string;      // Atmosphere/weather — keys from ATMOSPHERE_MAP
  styling?: string;         // Styling direction — keys from STYLING_MAP
}

export class RenderEngine {
  constructor(_apiKey: string) {
    // API key unused — all Gemini calls are server-side only.
  }

  /**
   * Execute the 7-agent forge pipeline.
   *
   * @param pbpPrompt  — Assembled PBP prompt string
   * @param config     — Director Console selections + image payloads
   * @param onProgress — Optional callback fired as each slot image arrives (slot 0-8, data URL)
   * @returns          — Promise resolving to the complete array of data URL strings
   */
  /**
   * Execute the Phase 2 iterative refinement loop.
   * Sends a master image + adjustment prompt → receives 3 refined variants.
   * Costs 2 image credits.
   */
  async executeIterationLoop(
    masterImage: string,
    adjustmentPrompt: string,
    iterationType: 'composition_shift' | 'pose_variant' | 'feature_enhance',
    onProgress?: (slot: number, image: string) => void,
  ): Promise<string[]> {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('UNAUTHORIZED: You must be signed in.');
    const idToken = await currentUser.getIdToken();

    const response = await fetch('/api/forge-iterate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({ masterImage, adjustmentPrompt, iterationType }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      const msg = err?.error || `Iterate Error: ${response.status}`;
      if (response.status === 401) throw new Error('Session expired — please sign out and back in.');
      if (response.status === 402) throw new Error('Insufficient credits — upgrade your plan to continue.');
      if (response.status === 429) throw new Error('Too many requests — wait 60 seconds and try again.');
      throw new Error(msg);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    const grid: string[] = [];
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        const line = part.trim();
        if (!line.startsWith('data: ')) continue;
        let event: Record<string, unknown>;
        try { event = JSON.parse(line.slice(6)); } catch { continue; }

        if (event.type === 'image') {
          const slot = event.slot as number;
          const image = event.image as string;
          grid[slot] = image;
          if (onProgress) onProgress(slot, image);
        } else if (event.type === 'error') {
          throw new Error(String(event.error) || 'Iteration returned an error event.');
        }
      }
    }

    return grid.filter(Boolean);
  }

  async executeMantisLoop(
    pbpPrompt: string,
    config: MantisRenderConfig,
    onProgress?: (slot: number, image: string) => void,
  ): Promise<string[]> {
    console.log('[ARCHITECT] Translating PBP Hierarchy to Proxy Payload...');
    console.log('[PRODUCER] Sovereign Forge v9.0 — SSE stream active.');

    // Size guard — Vercel serverless body limit
    if (config.sourceImage && config.sourceImage.length > 5_500_000) {
      throw new Error('DNA_OVERSIZE: Source image exceeds 4.2MB limit. Please use a smaller file.');
    }

    // Require a signed-in user — the forge endpoint enforces this server-side too,
    // but failing here gives a clear client-side error before any network call.
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('UNAUTHORIZED: You must be signed in to generate images.');
    }
    const idToken = await currentUser.getIdToken();

    const response = await fetch('/api/forge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        prompt: pbpPrompt,
        config,
        additionalModelImages: (config.additionalModelImages || []).map((b64: string) => b64.split(',')[1] || b64),
        additionalGarmentImages: (config.additionalGarmentImages || []).map((b64: string) => b64.split(',')[1] || b64),
      }),
    });

    // Non-2xx before SSE stream started → standard JSON error
    if (!response.ok) {
      const err = await response.json().catch(() => null);
      const msg = err?.error || `Proxy Error: ${response.status}`;
      // Map status codes to user-friendly messages
      if (response.status === 401) throw new Error('Session expired — please sign out and back in.');
      if (response.status === 402) throw new Error('Insufficient credits — upgrade your plan to continue.');
      if (response.status === 429) throw new Error('Too many requests — wait 60 seconds and try again.');
      throw new Error(msg);
    }

    // Parse SSE stream — forge sends `data: {...}\n\n` per event
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    const grid: string[] = [];
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';   // keep incomplete trailing chunk

      for (const part of parts) {
        const line = part.trim();
        if (!line.startsWith('data: ')) continue;

        let event: Record<string, unknown>;
        try { event = JSON.parse(line.slice(6)); }
        catch { continue; }

        if (event.type === 'image') {
          const slot = event.slot as number;
          const image = event.image as string;
          grid[slot] = image;
          if (onProgress) onProgress(slot, image);
        } else if (event.type === 'done') {
          // Server confirmed all slots processed — fall through to return
        } else if (event.type === 'error') {
          throw new Error(String(event.error) || 'Forge returned an error event.');
        }
      }
    }

    const finalGrid = grid.filter(Boolean);
    if (finalGrid.length === 0) {
      throw new Error('Zero-Byte Response: The forge cluster returned no images.');
    }

    console.log(`[PRODUCER] ${finalGrid.length}/6 master assets extracted successfully.`);
    return finalGrid;
  }
}
