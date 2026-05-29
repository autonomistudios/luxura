import { SAFETY_SETTINGS } from '../safety.js';

export async function runAgent025Auditor({ genAI, TEXT_MODEL, directorBriefs, config, lockedBgRaw, lockedBgDesc, userPromptText, modelIdentityDNA, skinToneDesc, genderLabel, anchorDesc }) {
  try {
    if (!directorBriefs || directorBriefs.length < 6) return directorBriefs;

    console.log('[FORGE] AGENT 02.5: Cross-slot consistency audit...');
    const consistencyModel   = genAI.getGenerativeModel({ model: TEXT_MODEL });
    const bgLockForAudit     = config?.locationPreset
      ? config.locationPreset
      : (lockedBgRaw === 'custom-bg' && userPromptText) ? userPromptText : lockedBgDesc;
    const skinLockForAudit   = modelIdentityDNA
      ? 'match the extracted model identity skin tone — no lightening, darkening, or override'
      : skinToneDesc;
    const briefsBlock        = directorBriefs.map((b, i) => `SLOT ${i + 1}:\n${b}`).join('\n\n---\n\n');
    const clientDirectionLine = userPromptText
      ? `5. CLIENT SCENE DIRECTION: Every corrected brief MUST include this client directive verbatim or as a direct visual description: "${userPromptText}". Do NOT remove or omit it when correcting any slot.`
      : '';

    const consistencyTask = `You are a CONSISTENCY AUDITOR for a luxury fashion shoot. Review the image generation prompt for compliance.

INVARIANTS — every slot must comply:
1. GENDER: ${genderLabel === 'male' ? 'MALE only. Zero female pronouns (she/her/hers/woman/feminine). Any female reference = violation.' : 'FEMALE only. Zero male pronouns (he/him/his/man/masculine). Any male reference = violation.'}
2. BACKGROUND: Must describe exactly this environment: "${bgLockForAudit}". Any other background = violation.
3. SKIN TONE: Must ${skinLockForAudit}.
4. ANCHOR PRESENCE: The ${anchorDesc} must be described.
${clientDirectionLine}
5. GARMENT ARCHITECTURE: Every slot must feature the EXACT same garment structure. No ribbons, lace, or accessories added to one slot that aren't in all others.
6. PATTERN CONTINUITY: Repeating patterns and prints must match across all slots.
7. IDENTITY: All slots must describe the SAME physical identity and bone structure. Distinct poses, but same person.

POSE PRESERVATION: Each slot intentionally has a DIFFERENT pose, crop, and composition. Do NOT standardize poses. Preserve the unique framing of each slot exactly as written.

REVIEW THESE 6 PROMPTS:
${briefsBlock}

OUTPUT FORMAT:
SLOT 1: PASS
or
SLOT 1: CORRECTED
[full corrected prompt here]

Rules: ONLY correct slots that actually violate an invariant above. Do not rewrite passing slots. Do not homogenize poses. Output all 6 results.`;

    const consistencyResult = await consistencyModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: consistencyTask }] }],
      generationConfig: { temperature: 0.1 },
      safetySettings: SAFETY_SETTINGS,
    });
    const consistencyOutput = consistencyResult.response.text() || '';

    const slotPattern = /SLOT\s+(\d+)\s*:\s*(PASS|CORRECTED)\s*([\s\S]*?)(?=SLOT\s+\d+\s*:|$)/gi;
    let match;
    let correctionCount = 0;
    while ((match = slotPattern.exec(consistencyOutput)) !== null) {
      const slotNum    = parseInt(match[1], 10) - 1;
      const verdict    = match[2].toUpperCase().trim();
      const correction = match[3].trim();
      if (verdict === 'CORRECTED' && correction.length > 80 && slotNum >= 0 && slotNum < 6) {
        directorBriefs[slotNum] = correction;
        correctionCount++;
      }
    }
    console.log(`[FORGE] AGENT 02.5: Consistency audit complete — ${correctionCount}/6 slot(s) corrected.`);
    return directorBriefs;
  } catch (err) {
    console.warn('[FORGE] AGENT 02.5: Audit failed — proceeding with original briefs:', err?.message);
    return directorBriefs;
  }
}
