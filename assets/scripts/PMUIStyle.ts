import { Color, Graphics } from 'cc';

export interface UIMotion {
  pressScale: number;
  pressIn: number;
  release: number;
  overshoot: number;
  commit: number;
  enter: number;
  travel: number;
}

/** Seconds and logical pixels; reduced motion also removes the action delay. */
export function uiMotion(nativeApp: boolean, reduced = false): UIMotion {
  if (reduced) return { pressScale: 1, pressIn: 0, release: 0, overshoot: 1, commit: 0, enter: 0, travel: 0 };
  return nativeApp
    ? { pressScale: .965, pressIn: .05, release: .16, overshoot: 1.012, commit: .075, enter: .22, travel: 10 }
    : { pressScale: .975, pressIn: .045, release: .10, overshoot: 1, commit: .065, enter: .14, travel: 0 };
}

function color(value: string, alpha = 255): Color {
  const c = new Color();
  Color.fromHEX(c, value);
  c.a = alpha;
  return c;
}

/** Paint in the existing component so buttons need no permanent animated child. */
export function drawButtonSurface(g: Graphics, w: number, h: number, fill: string, enabled: boolean): void {
  g.clear();
  if (w <= 2 || h <= 3) return;
  const x = -w / 2, y = -h / 2, r = Math.min(14, (w - 2) / 2, (h - 3) / 2);
  g.fillColor = color('#183852', enabled ? 25 : 10);
  g.roundRect(x + 1, y - 1, w - 2, h - 1, r);
  g.fill();

  // Keep semantic fills exact: custom icons and labels also use these colours.
  g.fillColor = color(fill);
  g.roundRect(x, y + 1, w, h - 1, r);
  g.fill();
  g.lineWidth = 1;
  g.strokeColor = color('#183852', enabled ? 35 : 17);
  g.roundRect(x + .5, y + 1.5, w - 1, h - 2, r);
  g.stroke();

  g.strokeColor = color('#ffffff', enabled ? 83 : 34);
  g.moveTo(x + r + 1, h / 2 - 2.5);
  g.lineTo(w / 2 - r - 1, h / 2 - 2.5);
  g.stroke();
}

/** Edge-to-edge sheets, masks, translucent HUDs and small chips stay flat. */
export function drawPanelSurface(g: Graphics, w: number, h: number, fill: string, r: number, alpha: number): void {
  g.clear();
  const elevated = alpha === 255 && r > 2 && w >= 100 && w < 380 && h >= 50;
  if (elevated) {
    g.fillColor = color('#183852', 15);
    g.roundRect(-w / 2 + 1, -h / 2 - 1.5, w - 2, h, r);
    g.fill();
  }
  g.fillColor = color(fill, alpha);
  g.roundRect(-w / 2, -h / 2, w, h, r);
  g.fill();
  if (elevated) {
    g.lineWidth = 1;
    g.strokeColor = color('#183852', 19);
    g.roundRect(-w / 2 + .5, -h / 2 + .5, w - 1, h - 1, r);
    g.stroke();
  }
}
