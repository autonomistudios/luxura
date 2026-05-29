export type SocialFormat = 'original' | 'ig_story' | 'ig_post' | 'tiktok' | 'pinterest' | 'linkedin';

export const FORMAT_SPECS: Record<SocialFormat, { label: string; width: number; height: number | null }> = {
  original:  { label: 'Native (4:5)', width: 1080, height: null }, // Original aspect ratio
  ig_story:  { label: 'IG Story (9:16)', width: 1080, height: 1920 },
  ig_post:   { label: 'IG Square (1:1)', width: 1080, height: 1080 },
  tiktok:    { label: 'TikTok Cover (9:16)', width: 1080, height: 1920 },
  pinterest: { label: 'Pinterest (2:3)', width: 1000, height: 1500 },
  linkedin:  { label: 'LinkedIn (1.91:1)', width: 1200, height: 627 },
};

/**
 * Client-side Social Export Engine.
 * Resizes the generated base64 image onto a canvas with the target dimensions.
 * Uses object-fit: cover logic (center cropped) for the fill.
 */
export async function exportSocialImage(
  base64Src: string,
  format: SocialFormat,
  onComplete: (dataUrl: string) => void
) {
  if (format === 'original') {
    onComplete(base64Src);
    return;
  }

  const spec = FORMAT_SPECS[format];
  if (!spec.height) return;

  const img = new Image();
  img.crossOrigin = 'anonymous';

  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = spec.width;
    canvas.height = spec.height as number;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill background black just in case of alpha
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate "cover" crop dimensions
    const imgRatio = img.width / img.height;
    const targetRatio = canvas.width / canvas.height;

    let drawWidth = canvas.width;
    let drawHeight = canvas.height;
    let offsetX = 0;
    let offsetY = 0;

    if (imgRatio > targetRatio) {
      // Source image is wider than target
      drawWidth = img.height * targetRatio;
      drawHeight = img.height;
      offsetX = (img.width - drawWidth) / 2;
    } else {
      // Source image is taller than target
      drawWidth = img.width;
      drawHeight = img.width / targetRatio;
      offsetY = (img.height - drawHeight) / 2;
    }

    ctx.drawImage(
      img,
      offsetX, offsetY, drawWidth, drawHeight, // Source crop
      0, 0, canvas.width, canvas.height        // Target bounds
    );

    // High quality JPEG output
    const outUrl = canvas.toDataURL('image/jpeg', 0.95);
    onComplete(outUrl);
  };

  img.src = base64Src;
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
