export async function generateShareCard(options: {
  title: string;
  subtitle?: string;
  stats: { label: string; value: string }[];
  awards?: { icon: string; title: string }[];
  footer?: string;
}): Promise<Blob | null> {
  const { title, subtitle, stats, awards, footer } = options;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Instagram story dimensions (9:16)
  canvas.width = 1080;
  canvas.height = 1920;

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bg.addColorStop(0, '#0a0a0f');
  bg.addColorStop(0.5, '#0f1118');
  bg.addColorStop(1, '#0a0a0f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Decorative accent glow
  ctx.beginPath();
  const glow = ctx.createRadialGradient(540, 500, 0, 540, 500, 400);
  glow.addColorStop(0, 'rgba(0, 200, 200, 0.08)');
  glow.addColorStop(1, 'rgba(0, 200, 200, 0)');
  ctx.fillStyle = glow;
  ctx.arc(540, 500, 400, 0, Math.PI * 2);
  ctx.fill();

  // Sprint Society branding
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SPRINT SOCIETY', 540, 200);

  ctx.fillStyle = 'rgba(0, 200, 200, 0.8)';
  ctx.font = '24px system-ui, -apple-system, sans-serif';
  ctx.fillText('Powered by AI', 540, 250);

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 56px system-ui, -apple-system, sans-serif';
  ctx.fillText(title, 540, 450);

  // Subtitle
  if (subtitle) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '28px system-ui, -apple-system, sans-serif';
    ctx.fillText(subtitle, 540, 510);
  }

  // Stats
  const statsY = 650;
  const statsSpacing = canvas.width / (stats.length + 1);
  stats.forEach((stat, i) => {
    const x = statsSpacing * (i + 1);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 72px system-ui, -apple-system, monospace';
    ctx.fillText(stat.value, x, statsY);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '22px system-ui, -apple-system, sans-serif';
    ctx.fillText(stat.label.toUpperCase(), x, statsY + 45);
  });

  // Awards
  if (awards && awards.length > 0) {
    const awardsY = 880;
    ctx.fillStyle = 'rgba(0, 200, 200, 0.6)';
    ctx.font = '22px system-ui, -apple-system, sans-serif';
    ctx.fillText('AWARDS', 540, awardsY - 40);

    awards.forEach((award, i) => {
      const y = awardsY + i * 70;
      ctx.fillStyle = '#ffffff';
      ctx.font = '32px system-ui, -apple-system, sans-serif';
      ctx.fillText(`${award.icon} ${award.title}`, 540, y);
    });
  }

  // Footer
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.font = '22px system-ui, -apple-system, sans-serif';
  ctx.fillText(footer || 'sprintsociety.app', 540, 1800);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

export async function shareOrDownload(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: 'image/png' });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'Sprint Society' });
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
