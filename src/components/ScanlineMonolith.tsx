import { useEffect, useRef } from 'react';

interface ScanlineMonolithProps {
  isDark?: boolean;
}

export function ScanlineMonolith({ isDark }: ScanlineMonolithProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI scaling
    const dpr = window.devicePixelRatio || 2;
    const width = 460;
    const height = 540;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear background
    ctx.fillStyle = isDark ? '#111216' : '#f5f5f2';
    ctx.fillRect(0, 0, width, height);

    // Primary stroke color
    const lineCol = isDark ? '#ffffff' : '#141416';
    const bgCol = isDark ? '#111216' : '#f5f5f2';

    // Total scanlines
    const lineCount = 120;
    const lineSpacing = height / lineCount;

    // Tower geometry
    const towerCenterX = width * 0.65;
    const towerWidth = 110;
    const towerTopY = height * 0.12;
    const towerBottomY = height * 0.95;

    for (let i = 0; i < lineCount; i++) {
      const y = i * lineSpacing;
      const progress = i / lineCount;

      ctx.strokeStyle = lineCol;
      ctx.lineWidth = 1.4;

      // Determine if within tower vertical range
      const inTower = y >= towerTopY && y <= towerBottomY;
      const towerProgress = inTower ? (y - towerTopY) / (towerBottomY - towerTopY) : 0;

      // Skyscraper shape: rounded domed/curved top
      let currentTowerWidth = towerWidth;
      if (inTower && towerProgress < 0.22) {
        // Curve to dome top
        const domeAngle = Math.sin((towerProgress / 0.22) * (Math.PI / 2));
        currentTowerWidth = towerWidth * domeAngle;
      }

      const towerLeft = towerCenterX - currentTowerWidth / 2;
      const towerRight = towerCenterX + currentTowerWidth / 2;

      // Draw background horizon/sky scanlines (left and right of monolith)
      if (y < height * 0.85) {
        // Left sky lines
        if (i % 2 === 0) {
          ctx.beginPath();
          ctx.moveTo(width * 0.15, y);
          ctx.lineTo(inTower ? Math.max(width * 0.15, towerLeft - 10) : width * 0.88, y);
          ctx.stroke();
        }

        // Right sky lines
        if (inTower && i % 2 === 0 && towerRight + 10 < width * 0.88) {
          ctx.beginPath();
          ctx.moveTo(towerRight + 10, y);
          ctx.lineTo(width * 0.88, y);
          ctx.stroke();
        }
      }

      // Draw Monolith Tower scanline patterns
      if (inTower) {
        // Shadow and specular highlights on the cylinder/monolith
        const segCount = 28;
        const segWidth = currentTowerWidth / segCount;

        for (let s = 0; s < segCount; s++) {
          const segX = towerLeft + s * segWidth;
          const u = s / segCount; // 0 (left edge) to 1 (right edge)

          // Light source comes from left: left is illuminated, right is in shadow
          // Heavy dense dark lines on right side, dashed/perforated on left
          const isRightShadow = u > 0.45;
          const isHighlight = u > 0.18 && u < 0.32;

          if (isRightShadow) {
            // Dense horizontal fill for dark shadow side
            ctx.fillStyle = lineCol;
            ctx.fillRect(segX, y - 1.2, segWidth + 0.5, 2.4);
          } else if (isHighlight) {
            // White reflective highlight column
            if (i % 4 === 0) {
              ctx.fillStyle = lineCol;
              ctx.fillRect(segX, y - 0.7, segWidth * 0.4, 1.4);
            }
          } else {
            // Textured midtones
            if ((i + s) % 2 === 0) {
              ctx.fillStyle = lineCol;
              ctx.fillRect(segX, y - 0.9, segWidth * 0.75, 1.8);
            }
          }
        }
      }

      // Ground plane reflections and dashed base
      if (y > height * 0.84) {
        const groundDashes = 35;
        const gStep = (width * 0.8) / groundDashes;
        const startX = width * 0.1;

        for (let g = 0; g < groundDashes; g++) {
          const gx = startX + g * gStep;
          const distToCenter = Math.abs(gx - towerCenterX) / (width * 0.4);
          const prob = 1 - distToCenter;

          if (Math.random() < prob * 0.85) {
            ctx.fillStyle = lineCol;
            ctx.fillRect(gx, y - 1, gStep * 0.6, 2);
          }
        }
      }
    }
  }, [isDark]);

  return (
    <div className="relative w-full aspect-[4/5] max-w-[460px] mx-auto rounded-xl overflow-hidden border border-neutral-300 dark:border-neutral-800 bg-[#f5f5f2] dark:bg-[#111216] shadow-sm">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%' }}
        className="block"
      />
    </div>
  );
}
