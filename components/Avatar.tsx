import React from "react";

/**
 * Deterministic on-chain identicon — derived purely from the wallet address.
 * No dependencies, SSR-safe (no Math.random / Date). Same address → same art.
 * 5×5 vertically-mirrored grid, GitHub-identicon style, in PixelTip colors.
 */
function xorshift(seed: number) {
  let x = seed | 0 || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return x >>> 0;
  };
}

function hashAddr(addr: string): number {
  let h = 5381;
  const s = (addr || "0x0").toLowerCase();
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 33) + s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

export default function Avatar({
  address,
  size = 40,
  rounded = false,
}: {
  address: string;
  size?: number;
  rounded?: boolean;
}) {
  const seed = hashAddr(address);
  const rng = xorshift(seed);
  const hue1 = seed % 360;
  const hue2 = (Math.floor(seed / 7) % 360);
  const fg = `hsl(${hue1} 72% 56%)`;
  const fg2 = `hsl(${hue2} 70% 60%)`;
  const bg = `hsl(${hue1} 35% 10%)`;

  // Build a 5-wide grid from 3 columns mirrored.
  const grid: boolean[][] = [];
  for (let y = 0; y < 5; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < 3; x++) row[x] = (rng() & 1) === 1;
    row[3] = row[1];
    row[4] = row[0];
    grid.push(row);
  }

  const unit = size / 5;
  const rects: React.ReactElement[] = [];
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 5; x++) {
      if (grid[y][x]) {
        rects.push(
          <rect
            key={`${x}-${y}`}
            x={x * unit}
            y={y * unit}
            width={unit + 0.5}
            height={unit + 0.5}
            fill={(x + y) % 2 ? fg : fg2}
          />
        );
      }
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ borderRadius: rounded ? "50%" : 4, display: "block", flexShrink: 0 }}
      aria-hidden="true"
    >
      <rect width={size} height={size} fill={bg} />
      {rects}
    </svg>
  );
}
