/**
 * lib/forge/safety.js
 * Gemini content safety settings for all forge generation calls.
 *
 * HARASSMENT + HATE_SPEECH: BLOCK_NONE — required for diverse editorial photography.
 *   (descriptions of skin tone, ethnicity, and body type would otherwise trigger false positives)
 * SEXUALLY_EXPLICIT: BLOCK_MEDIUM_AND_ABOVE — fashion photography does not require explicit content.
 * DANGEROUS_CONTENT: BLOCK_MEDIUM_AND_ABOVE — no legitimate fashion use case.
 */
export const SAFETY_SETTINGS = [
  { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_HATE_SPEECH",        threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",  threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT",  threshold: "BLOCK_MEDIUM_AND_ABOVE" },
];
