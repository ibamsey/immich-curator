/** SVG viewBox 0 0 400 400; angles in radians, 0 = east, -π/2 = top. */

export const VIEW_SIZE = 400;
export const CENTER = VIEW_SIZE / 2;
export const TOP_ANGLE = -Math.PI / 2;
export const TOP_GAP_RAD = Math.PI / 5;

export type SpokeLayout = {
  index: number;
  x: number;
  y: number;
  angle: number;
  radius: number;
  connectorPath: string;
  segmentStart: number;
  segmentEnd: number;
};

export type WheelMetrics = {
  hubRadius: number;
  orbitRadius: number;
  spokeRadius: number;
  spokes: SpokeLayout[];
};

function normalizeAngle(a: number): number {
  let x = a % (2 * Math.PI);
  if (x > Math.PI) x -= 2 * Math.PI;
  if (x <= -Math.PI) x += 2 * Math.PI;
  return x;
}

export function spokeAngleForIndex(
  index: number,
  count: number,
  rotationRad: number,
): number {
  const arc = 2 * Math.PI - TOP_GAP_RAD;
  const step = arc / count;
  const start = TOP_ANGLE + TOP_GAP_RAD / 2;
  return start + rotationRad + (index + 0.5) * step;
}

export function snapRotationForSpoke(
  index: number,
  count: number,
): number {
  const arc = 2 * Math.PI - TOP_GAP_RAD;
  const step = arc / count;
  const start = TOP_ANGLE + TOP_GAP_RAD / 2;
  const current = start + (index + 0.5) * step;
  return normalizeAngle(TOP_ANGLE - current);
}

export function focusedSpokeIndex(
  count: number,
  rotationRad: number,
): number {
  if (count === 0) return -1;
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < count; i++) {
    const a = spokeAngleForIndex(i, count, rotationRad);
    const d = Math.abs(normalizeAngle(a - TOP_ANGLE));
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

function connectorPath(
  cx: number,
  cy: number,
  hubR: number,
  sx: number,
  sy: number,
  spokeR: number,
): string {
  const dx = sx - cx;
  const dy = sy - cy;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;
  const x1 = cx + ux * hubR;
  const y1 = cy + uy * hubR;
  const x2 = sx - ux * spokeR;
  const y2 = sy - uy * spokeR;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const px = -uy * 28;
  const py = ux * 28;
  return `M ${x1} ${y1} Q ${mx + px} ${my + py} ${x2} ${y2}`;
}

export function computeWheelMetrics(
  spokeCount: number,
  rotationRad: number,
): WheelMetrics {
  const hubRadius = 52;
  const orbitRadius = Math.min(138, 118 + spokeCount * 2);
  const spokeRadius = Math.max(20, Math.min(34, 300 / Math.max(spokeCount, 1)));

  const spokes: SpokeLayout[] = [];
  for (let i = 0; i < spokeCount; i++) {
    const angle = spokeAngleForIndex(i, spokeCount, rotationRad);
    const x = CENTER + orbitRadius * Math.cos(angle);
    const y = CENTER + orbitRadius * Math.sin(angle);
    const segmentStart = spokeAngleForIndex(i, spokeCount, 0) - TOP_GAP_RAD / 4;
    const segmentEnd = spokeAngleForIndex(i, spokeCount, 0) + TOP_GAP_RAD / 4;
    spokes.push({
      index: i,
      x,
      y,
      angle,
      radius: spokeRadius,
      connectorPath: connectorPath(
        CENTER,
        CENTER,
        hubRadius,
        x,
        y,
        spokeRadius,
      ),
      segmentStart,
      segmentEnd,
    });
  }

  return { hubRadius, orbitRadius, spokeRadius, spokes };
}

export function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const large = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

/** Hub ring segment colors (theme-friendly hues). */
export const SPOKE_HUES = [145, 48, 12, 185, 220, 280, 32, 95, 260, 170];

export function spokeStroke(index: number): string {
  const h = SPOKE_HUES[index % SPOKE_HUES.length];
  return `hsl(${h} 55% 48%)`;
}
