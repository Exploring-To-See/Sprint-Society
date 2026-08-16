/**
 * Downscale a user-picked image to a square JPEG data URI.
 *
 * Phone camera shots are 3-8MB; stored raw as base64 they blow past the API's
 * body limit AND get inlined into every list payload that carries an avatar
 * (feed, members, admin runners). 512px @ q0.85 lands around 40-120KB.
 */
export async function toSquareDataUrl(file: File, size = 512, quality = 0.85): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('unreadable image'));
      el.src = url;
    });
    const side = Math.min(img.width, img.height);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas unavailable');
    // Center-crop to square, then scale down.
    ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}
