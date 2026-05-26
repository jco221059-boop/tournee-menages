import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const s = size / 100;

  // Background
  ctx.fillStyle = '#0F1117';
  roundRect(ctx, 0, 0, size, size, 20 * s);
  ctx.fill();

  // Inner surface
  ctx.fillStyle = '#1A1D27';
  roundRect(ctx, 10 * s, 10 * s, 80 * s, 80 * s, 16 * s);
  ctx.fill();

  // House shape
  ctx.beginPath();
  ctx.moveTo(50 * s, 20 * s);
  ctx.lineTo(80 * s, 45 * s);
  ctx.lineTo(80 * s, 80 * s);
  ctx.lineTo(20 * s, 80 * s);
  ctx.lineTo(20 * s, 45 * s);
  ctx.closePath();
  ctx.fillStyle = 'rgba(79, 126, 255, 0.8)';
  ctx.fill();

  // Door
  ctx.fillStyle = '#0F1117';
  roundRect(ctx, 38 * s, 58 * s, 24 * s, 22 * s, 4 * s);
  ctx.fill();

  // Roof line
  ctx.beginPath();
  ctx.moveTo(50 * s, 25 * s);
  ctx.lineTo(73 * s, 43 * s);
  ctx.strokeStyle = '#3ECF6B';
  ctx.lineWidth = 3 * s;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Dot
  ctx.beginPath();
  ctx.arc(50 * s, 20 * s, 4 * s, 0, Math.PI * 2);
  ctx.fillStyle = '#3ECF6B';
  ctx.fill();

  return canvas.toBuffer('image/png');
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

writeFileSync('public/pwa-192x192.png', drawIcon(192));
writeFileSync('public/pwa-512x512.png', drawIcon(512));
console.log('Icônes créées !');
