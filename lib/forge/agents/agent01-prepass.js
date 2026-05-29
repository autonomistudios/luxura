import { SAFETY_SETTINGS } from '../safety.js';
import { runAgent01fVTO, runAgent01fAiVTO }  from './agent01f-vto.js';
import { runAgent01gAiCharacter }            from './agent01g-ai-character.js';
import { withGeminiBackoff } from '../services/gemini-client.js';
import { ANCHOR_LABELS } from '../config/anchors.js';

const ISOLATION_INSTRUCTIONS = {
  FULL_OUTFIT: `You are looking at a reference photograph containing a complete outfit. Your task: extract ONLY the clothing from this image and present it as a professional FLAT LAY on a clean white surface. [SURGICAL ISOLATION]: Identify the garment(s) precisely. [ABSOLUTE PROHIBITION]: Do NOT include any human body, skin, face, mannequins, stands, hangers, or studio shadows. [NO HALLUCINATIONS]: Do not add ribbons, lace, side pieces, fasteners, or any "creative" elements not present in the reference. The garments must be laid flat, perfectly arranged to show every cut, color, and detail. [CRITICAL]: Every repeating pattern, intricate print, floral motif, and micro-texture must be preserved with 100% fidelity. [STATEMENT ELEMENTS — HIGHEST PRIORITY]: Any 3D structural element (feathers, 3D floral appliqués, bows, ruffle clusters, fringe, tassels, sequin zones, sculptural pleating) MUST be reproduced exactly — in its correct position on the garment, at full scale, with exact color and texture. These elements define the garment's identity. A feather at center chest must appear at center chest, full size, exact color. Zero drift on statement embellishments.`,
  DRESS:       `You are looking at a reference photograph of a dress or gown. Your task: extract ONLY the dress from this image and present it as a professional FLAT LAY on a clean white surface. [SURGICAL ISOLATION]: If a model or mannequin is wearing the dress, you must surgically isolate the garment and discard the person/mannequin completely. [NO HALLUCINATIONS]: You are strictly forbidden from adding any new elements (ribbons, clips, side panels, etc.) that are not in the source. [CRITICAL]: The repeating pattern, fabric weave, and intricate prints of the dress must be reproduced with 100% pixel-perfect fidelity. [STATEMENT ELEMENTS — HIGHEST PRIORITY]: Any 3D structural element on the dress (feathers, 3D floral appliqués, bows, ruffle clusters, sequin embellishment zones, sculptural pleating, fringe) MUST be reproduced exactly — in its correct position on the dress (bodice/neckline/shoulder/hem), at full scale, with exact color and texture. A large feather at center bodice must appear at center bodice, full size, exact color. These define the dress — they are non-negotiable.`,
  SHIRT:       `Re-photograph ONLY the shirt/top from this reference image on a headless mannequin. The garment must be exactly as shown — same color, cut, fabric, and every detail. Head/face: not visible. Background: clean studio.`,
  PANTS:       `Re-photograph ONLY the pants/trousers from this reference image on a headless lower-body mannequin. Exactly as shown — same color, cut, and detail. Head and torso cropped. Background: clean studio.`,
  SHORTS:      `Re-photograph ONLY the shorts from this reference image on a headless lower-body mannequin. Exactly as shown. Background: clean studio.`,
  SWIMWEAR:    `Re-photograph ONLY the swimwear from this reference image on a headless mannequin. Exactly as shown — same style, color, and cut. Face not visible. Background: clean neutral.`,
  HAIR:        `Re-photograph ONLY the hairstyle from this reference image. Show an extreme tight crop from the crown of the head down to the base of the neck — NO body, NO shoulders, NO clothing visible below the hairline. Face completely turned away or cropped out. Only hair architecture, color, texture, layers, and styling visible. Background: clean neutral studio. CRITICAL: No clothing, swimwear, or any garment may appear in this image.`,
  BARBER:      `Re-photograph ONLY the haircut and fade from this reference image. Tight crop showing only the hair from crown to the base of the neck — NO shoulders, NO body, NO clothing below the hairline. Show the back and sides of the cut structure. No face visible. Background: clean studio. CRITICAL: No clothing or garments may appear.`,
  NAILS:       `Re-photograph ONLY the nail art from this reference image. Show only the hands from wrist to fingertip — no face, no body above the wrists. Reproduce the nail design, colors, and finish exactly as shown. Background: clean white.`,
  MAKEUP:      `Reproduce ONLY the makeup look from this reference image — same colors, technique, and application — on a completely anonymous, featureless, generic placeholder face. No recognizable identity or resemblance to the original person. The makeup must match exactly. Background: clean white.`,
  SHOES:       `Re-photograph ONLY the footwear from this reference image. Show the shoes exactly as they appear — same style, color, material — either on a foot (ankle only, nothing above) or as a standalone product shot. Background: clean white.`,
  EARRINGS:    `Re-photograph ONLY the earrings from this reference image. Macro close-up. No face visible — just the earrings against a neutral background or on an earlobe. Reproduce exactly.`,
  NECKLACE:    `Re-photograph ONLY the necklace from this reference image. Show it against a neutral backdrop or on a collarbone (face cropped). Reproduce exactly.`,
};
const defaultIsolation = (anc) => `Re-photograph ONLY the ${ANCHOR_LABELS[anc] || anc} from this reference image, exactly as it appears — same color, texture, and detail — without showing the person's face or any identifying features. Background: clean studio.`;

export async function runAgent01Prepass({
  genAI, PXL_MODEL, isGarmentMode, isAiGenerated, garmentImageData, garmentMimeType,
  isKeepGarment, rawMimeType, rawImageData, dnaMap, modelIdentityDNA, modelHairDNA,
  FASHN_API_KEY, VERTEX_PROJECT, genderLabel, skinToneDesc, slots, anchors,
  forgeUid, anchor
}) {
  let anchorRefImage      = null;
  let anchorRefAnchorType = null;
  let garmentCleanRef     = null;
  let cleanGarmentRender  = null;
  let modelIdentityRef    = null;
  let clothingMaskedModel = null;
  let fashnVTOImage       = null;

  if (isGarmentMode && isAiGenerated) {
    anchorRefImage      = { data: garmentImageData, mimeType: garmentMimeType };
    anchorRefAnchorType = 'FULL_OUTFIT';
    console.log('[FORGE] GARMENT STUDIO (AI mode): garment image set as anchor ref — Agent 01b skipped.');
  }

  if (isKeepGarment) {
    const pxlModel = genAI.getGenerativeModel({ model: PXL_MODEL });

    // Agent 01b
    const p01b = (async () => {
      try {
        console.log('[FORGE] AGENT 01b: Generating flat lay from garment image...');
        const to = new Promise((_, rej) => setTimeout(() => rej(new Error('AGENT_01b_TIMEOUT: 25s')), 25000));
        const r  = await Promise.race([
          pxlModel.generateContent({
            contents: [{ role: 'user', parts: [
              { inlineData: { mimeType: garmentMimeType, data: garmentImageData } },
              { text: ISOLATION_INSTRUCTIONS.FULL_OUTFIT },
            ]}],
            generationConfig: { responseModalities: ['IMAGE'], temperature: 0.1 },
            safetySettings: SAFETY_SETTINGS,
          }),
          to,
        ]);
        const part = r.response?.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data);
        if (!part) throw new Error('no image returned');
        garmentCleanRef = { data: part.inlineData.data, mimeType: part.inlineData.mimeType || 'image/png' };
      } catch (err) { console.warn(`[FORGE] AGENT 01b failed: ${err?.message}`); }
    })();

    // Agent 01c
    const p01c = (async () => {
      try {
        console.log('[FORGE] AGENT 01c: Generating AI garment render from DNA...');
        const garmentDNA = dnaMap['DRESS'] || dnaMap['FULL_OUTFIT'] || '';
        const prompt = `You are a professional fashion photography studio AI. Generate a pristine studio FLAT LAY photograph of exactly these garments.\n\nGARMENT SPECIFICATION:\n${garmentDNA}\n\nMANDATORY REQUIREMENTS:\n- Clean white seamless background\n- All garments arranged perfectly flat, showing every cut, color, fabric, pattern, and design detail\n- [CRITICAL]: Every repeating pattern, intricate print, and fabric micro-texture must be rendered with 100% fidelity\n- ABSOLUTE PROHIBITION: No human body. No skin. No mannequin. No hands. No arms. No body parts.\n- Every color, pattern, fabric texture, and hardware detail must match the specification exactly\n- Professional overhead studio lighting, sharp and crisp\n- ONLY clothing items on white — nothing else whatsoever`;
        const to = new Promise((_, rej) => setTimeout(() => rej(new Error('AGENT_01c_TIMEOUT: 30s')), 30000));
        const r  = await Promise.race([
          pxlModel.generateContent({
            contents: [{ role: 'user', parts: [
              { inlineData: { mimeType: garmentMimeType, data: garmentImageData } },
              { text: '\n' + prompt },
            ]}],
            generationConfig: { responseModalities: ['IMAGE'], temperature: 0.1 },
            safetySettings: SAFETY_SETTINGS,
          }),
          to,
        ]);
        const part = r.response?.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data);
        if (!part) throw new Error('no image returned');
        cleanGarmentRender = { data: part.inlineData.data, mimeType: part.inlineData.mimeType || 'image/png' };
      } catch (err) { console.warn(`[FORGE] AGENT 01c failed: ${err?.message}`); }
    })();

    // Agent 01d
    const p01d = (async () => {
      try {
        console.log('[FORGE] AGENT 01d: Generating model identity reference sheet...');
        const idBlocks = [
          modelIdentityDNA ? `PHYSICAL IDENTITY:\n${modelIdentityDNA}` : '',
          modelHairDNA     ? `HAIR:\n${modelHairDNA}` : '',
        ].filter(Boolean).join('\n\n');
        const prompt = `You are a character reference artist. Generate a full-body CHARACTER REFERENCE SHEET of the exact person shown in the source photograph.\n\n${idBlocks}\n\nMANDATORY REQUIREMENTS:\n- IDENTICAL to the source photograph — same face, exact skin tone, same hair\n- Neutral standing pose, facing camera directly\n- Plain clean white background\n- Wears ONLY a simple white fitted t-shirt and light grey sweatpants (placeholder garments)\n- Face clearly visible, expression neutral\n- Full body visible from head to toe\n- Professional studio lighting\n- SKIN TONE IS NON-NEGOTIABLE: reproduce exact skin depth, undertone, and warmth from source photo`;
        const to = new Promise((_, rej) => setTimeout(() => rej(new Error('AGENT_01d_TIMEOUT: 30s')), 30000));
        const r  = await Promise.race([
          pxlModel.generateContent({
            contents: [{ role: 'user', parts: [
              { text: 'Source person — use this as your identity reference:\n' },
              { inlineData: { mimeType: rawMimeType, data: rawImageData } },
              { text: '\n\n' + prompt },
            ]}],
            generationConfig: { responseModalities: ['IMAGE'], temperature: 0.1 },
            safetySettings: SAFETY_SETTINGS,
          }),
          to,
        ]);
        const part = r.response?.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data);
        if (!part) throw new Error('no image returned');
        modelIdentityRef = { data: part.inlineData.data, mimeType: part.inlineData.mimeType || 'image/png' };
      } catch (err) { console.warn(`[FORGE] AGENT 01d failed: ${err?.message}`); }
    })();

    // Agent 01e
    const p01e = (async () => {
      try {
        console.log('[FORGE] AGENT 01e: Generating clothing mask (inpainting target)...');
        const maskPrompt = `PHOTO EDITING TASK — CLOTHING MASKING.\n\nYou are a precision photo editor. Your ONLY task: replace ALL clothing and fabric items in this photograph with solid flat LIGHT GREY (#D8D8D8).\n\nREPLACE WITH #D8D8D8 GREY:\n- Every clothing item: shirt, pants, dress, jacket, coat, skirt, top, bodysuit, jumpsuit\n- Footwear: shoes, boots, sandals, heels\n- Wearable accessories: belt, bag, purse\n\nDO NOT TOUCH — FREEZE THESE EXACTLY AS SHOWN:\n- The person's FACE — every single feature, expression, and skin tone preserved pixel-perfect\n- All SKIN — same exact tone, depth, undertone, and warmth as the original\n- The HAIR — identical color, curl pattern, texture, length, silhouette\n- The BACKGROUND — identical to the input\n\nOUTPUT: The exact same photograph with ONLY the clothing/fabric areas replaced by flat solid #D8D8D8 grey.`;
        const to = new Promise((_, rej) => setTimeout(() => rej(new Error('AGENT_01e_TIMEOUT: 30s')), 30000));
        const r  = await Promise.race([
          withGeminiBackoff(() => pxlModel.generateContent({
            contents: [{ role: 'user', parts: [
              { inlineData: { mimeType: rawMimeType, data: rawImageData } },
              { text: '\n' + maskPrompt },
            ]}],
            generationConfig: { responseModalities: ['IMAGE'], temperature: 0.05 },
            safetySettings: SAFETY_SETTINGS,
          })),
          to,
        ]);
        const part = r.response?.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data);
        if (!part) throw new Error('no image returned');
        clothingMaskedModel = { data: part.inlineData.data, mimeType: part.inlineData.mimeType || 'image/png' };
      } catch (err) { console.warn(`[FORGE] AGENT 01e failed: ${err?.message}`); }
    })();

    // Agent 01f
    const p01f = (async () => {
      fashnVTOImage = await runAgent01fVTO({
        rawImageData, rawMimeType, garmentImageData, garmentMimeType, anchor, dnaMap, isAiGenerated, skinToneDesc, designerUid: forgeUid,
      });
    })();

    await Promise.all([p01b, p01c, p01d, p01e, p01f]);
  } else if (!isGarmentMode && isAiGenerated) {
    try {
      const pxlModel = genAI.getGenerativeModel({ model: PXL_MODEL });
      const VISUAL_PRIORITY = ['FULL_OUTFIT','SHIRT','PANTS','SHORTS','SWIMWEAR','SHOES','NAILS','MAKEUP','HAIR','BARBER'];
      const primaryAnc = VISUAL_PRIORITY.find(a => anchors.includes(a)) || anchors[0];
      anchorRefAnchorType = primaryAnc;
      const isolationInstruction = ISOLATION_INSTRUCTIONS[primaryAnc] || defaultIsolation(primaryAnc);
      console.log(`[FORGE] AGENT 01b: Isolating ${primaryAnc} from source image...`);
      const to = new Promise((_, rej) => setTimeout(() => rej(new Error('AGENT_01b_TIMEOUT: 25s exceeded')), 25000));
      const r  = await Promise.race([
        withGeminiBackoff(() => pxlModel.generateContent({
          contents: [{ role: 'user', parts: [
            { inlineData: { mimeType: rawMimeType, data: rawImageData } },
            { text: isolationInstruction },
          ]}],
          generationConfig: { responseModalities: ['IMAGE'], temperature: 0.1 },
          safetySettings: SAFETY_SETTINGS,
        })),
        to,
      ]);
      const part = r.response?.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data);
      if (!part) throw new Error('no image returned');
      anchorRefImage = { data: part.inlineData.data, mimeType: part.inlineData.mimeType || 'image/png' };
    } catch (err) {
      console.warn(`[FORGE] AGENT 01b: Isolation failed, falling back to text-only: ${err?.message}`);
      anchorRefImage = null;
    }
  } else if (isGarmentMode && (FASHN_API_KEY || VERTEX_PROJECT)) {
    const aiCharacterRef = await runAgent01gAiCharacter({
      genAI, PXL_MODEL, genderLabel, skinToneDesc, charEthnicity: slots.ethnicities[0], charFace: slots.faces[0],
      charBodyType: slots.bodyTypes[0], charAge: slots.ages[0], anchors, dnaMap,
    });

    if (aiCharacterRef) {
      fashnVTOImage = await runAgent01fAiVTO({
        aiCharacterRef, garmentImageData, garmentMimeType, anchor, dnaMap, skinToneDesc, designerUid: forgeUid,
      });
    }

    if (!fashnVTOImage) {
      anchorRefImage      = { data: garmentImageData, mimeType: garmentMimeType };
      anchorRefAnchorType = 'FULL_OUTFIT';
    }
  }

  return { anchorRefImage, anchorRefAnchorType, garmentCleanRef, cleanGarmentRender, modelIdentityRef, clothingMaskedModel, fashnVTOImage };
}
