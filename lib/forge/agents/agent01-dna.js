import { SAFETY_SETTINGS } from '../safety.js';
import { DNA_EXTRACTION_PROMPTS, ANCHOR_LABELS } from '../config/anchors.js';

export async function runAgent01DNA({ genAI, TEXT_MODEL, anchors, isKeepGarment, config, rawImageData, rawMimeType, garmentImageData, garmentMimeType, additionalModelImages, additionalGarmentImages, isGarmentMode }) {
  const isAiGenerated = !isKeepGarment && config?.strategy !== 'keep';
  const dnaMap = {};
  let modelIdentityDNA = null;
  let modelHairDNA     = null;

  console.log(`[FORGE] AGENT 01: Extracting DNA for anchors: ${anchors.join(', ')}...`);
  const textModel = genAI.getGenerativeModel({ model: TEXT_MODEL });

  const identityTask = async () => {
    try {
      const identityPrompt = `FORENSIC MODEL IDENTITY ANALYST — Extract ONLY the permanent physical characteristics of the person in this image. Ignore everything they are wearing.

EXTRACT ONLY:
1. SKIN TONE: Fitzpatrick scale (I–VI), undertone (warm/cool/neutral), precise descriptor.
2. ETHNICITY/HERITAGE: Based on bone structure and facial features only.
3. AGE: Estimated range.
4. BODY TYPE: Frame, build, proportions.
5. FACE STRUCTURE: Cheekbones, nose shape, lip fullness, eye shape, jaw angle, brow.
6. EYE COLOR & SHAPE: Precise iris color and eye shape.
7. DISTINGUISHING FEATURES: Birthmarks, freckles, dimples, or permanent visible traits.

ABSOLUTELY FORBIDDEN — Do NOT mention, reference, or describe:
- Any clothing, swimwear, garments, or fabrics of any kind
- Any accessories, jewelry, or wearable items
- Hair (extracted separately)
- Makeup (extracted separately)
- The background or setting

OUTPUT: Physical identity profile only. Clothing is invisible to you.`;
      const extraParts = additionalModelImages.slice(0, 2)
        .map(d => ({ inlineData: { mimeType: 'image/jpeg', data: d } }));
      const scan = await textModel.generateContent({
        contents: [{ role: 'user', parts: [
          { inlineData: { mimeType: rawMimeType, data: rawImageData } },
          ...extraParts,
          { text: identityPrompt },
        ]}],
        safetySettings: isAiGenerated ? SAFETY_SETTINGS : null,
      });
      modelIdentityDNA = scan.response.text() || null;
      console.log(`[FORGE] MODEL IDENTITY extracted (${modelIdentityDNA?.length || 0} chars)`);
    } catch (err) {
      console.warn('[FORGE] MODEL IDENTITY extraction failed — slot fallback:', err?.message);
    }
  };

  const shouldExtractHairDNA = isKeepGarment || config?.strategy === 'keep' || anchors.includes('HAIR');
  const hairTask = shouldExtractHairDNA ? async () => {
    try {
      const hairPrompt = DNA_EXTRACTION_PROMPTS.HAIR + `\n\nPRECISION REQUIREMENT: This schematic will be used as the SOLE hair reference by an image generator that will NOT see the original photo. Be exhaustive — capture every detail of color, length, curl pattern, texture, styling, and silhouette.`;
      const scan = await textModel.generateContent({
        contents: [{ role: 'user', parts: [
          { inlineData: { mimeType: rawMimeType, data: rawImageData } },
          { text: hairPrompt },
        ]}],
        safetySettings: isAiGenerated ? SAFETY_SETTINGS : null,
      });
      modelHairDNA = scan.response.text() || null;
      console.log(`[FORGE] MODEL HAIR DNA extracted (${modelHairDNA?.length || 0} chars)`);
    } catch (err) {
      console.warn('[FORGE] MODEL HAIR DNA extraction failed:', err?.message);
    }
  } : () => Promise.resolve();

  const anchorTasks = anchors.map(async (anc) => {
    try {
      const basePrompt = DNA_EXTRACTION_PROMPTS[anc] || DNA_EXTRACTION_PROMPTS.HAIR;
      const extractionPrompt = basePrompt + `
      
PRECISION REQUIREMENT: This schematic will be used as the SOLE reference by an image generator that will NOT see the original photo. Your description must be precise enough that a skilled artist could recreate the ${ANCHOR_LABELS[anc] || anc} without seeing the image.
- Use specific color terminology
- Use measurements where applicable
- Name specific techniques
- Describe placement with anatomical precision
- Describe visible texture, finish, and surface quality in tactile terms
Be exhaustive. Every observable detail must be captured.`;
      const useGarmentImage = isGarmentMode && anc === 'FULL_OUTFIT' && garmentImageData;
      const dnaImageData    = useGarmentImage ? garmentImageData : rawImageData;
      const dnaMimeType     = useGarmentImage ? garmentMimeType  : rawMimeType;
      const extraParts      = (useGarmentImage ? additionalGarmentImages : additionalModelImages)
        .slice(0, 2)
        .map(d => ({ inlineData: { mimeType: 'image/jpeg', data: d } }));
      const scan = await textModel.generateContent({
        contents: [{ role: 'user', parts: [
          { inlineData: { mimeType: dnaMimeType, data: dnaImageData } },
          ...extraParts,
          { text: extractionPrompt },
        ]}],
        safetySettings: isAiGenerated ? SAFETY_SETTINGS : null,
      });
      dnaMap[anc] = scan.response.text() || `${ANCHOR_LABELS[anc] || anc} extracted from source.`;
    } catch (err) {
      console.warn(`[FORGE] DNA extraction fallback for ${anc}:`, err?.message);
      dnaMap[anc] = `Preserve the exact ${ANCHOR_LABELS[anc] || anc} from the source reference with 100% fidelity.`;
    }
  });

  try {
    await Promise.all([identityTask(), hairTask(), ...anchorTasks]);
    console.log(`[FORGE] DNA extraction complete. Keys: ${Object.keys(dnaMap).join(', ')}`);
  } catch (err) {
    console.warn('[FORGE] DNA batch extraction error:', err?.message);
    anchors.forEach(anc => {
      dnaMap[anc] = `Preserve the exact ${ANCHOR_LABELS[anc] || anc} from the source reference with 100% fidelity.`;
    });
  }

  return { dnaMap, modelIdentityDNA, modelHairDNA };
}
