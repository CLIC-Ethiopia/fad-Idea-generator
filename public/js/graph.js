// The idea canvas: a force layout on an infinite pan/zoom plane.
//
// Linked ideas pull together (springs along the edges), all ideas push apart,
// and collisions are resolved, so families cluster. A ball grows with its jury
// score. Drag an idea onto another to cross them. Hovering lights up the
// idea's whole family line. Everything is drawn on one <canvas>.

import { medal, scoreSum } from './score.js';
import { t } from './i18n.js';

// Validated with the dataviz palette checks against the canvas background (#0f1116).
export const KIND_COLORS = { seed: '#3987e5', expand: '#199e70', combine: '#9085e9', guest: '#d55181' };
const MEDAL_COLORS = [null, '#cd7f32', '#c9d1d9', '#f5c542'];
const BG = '#0f1116';
const TEXT = '#eef0f4';
const FONT = 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';

export function radiusFor(idea) {
  const s = scoreSum(idea);
  if (s != null) return 32 + (s - 3) * 3.2; // 3 → 32, 9 → 51, 13 → 64, 15 → 70
  if (Number.isInteger(idea.medalOverride)) return [44, 52, 60, 68][idea.medalOverride];
  return 46;
}

const easeOutBack = (t) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2;

export class Graph {
  constructor(canvas, handlers) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.h = handlers; // select, combine, create, expand, moved, dropLead
    this.nodes = new Map();
    this.edges = [];
    this.edgeKeys = new Set();
    this.ghosts = [];
    this.bursts = [];
    this.judging = new Set();
    this.busy = new Set();
    this.cam = { x: 0, y: 0, k: 1 };
    this.camTarget = null;
    this.alpha = 1;
    this.hover = null;
    this.selected = null;
    this.pick = null;
    this.dropTarget = null;
    this.drag = null;
    this.pointers = new Map();
    this.lastUser = 0;
    this.followNewest = false;
    this.dirty = true;
    this.wasSettled = true;
    this.focusCache = { id: null, set: null, edges: null };
    /** Screen space covered by overlays (seed bar, exhibition title) that fit() should keep clear. */
    this.insets = { top: 30, right: 30, bottom: 100, left: 30 };
    this.viewMode = 'organic'; // 'organic' | 'tree' | 'matrix'
    this.collapsed = new Set();
    this.minimapBounds = null;
    this.wireDrag = null;

    new ResizeObserver(() => this.resize()).observe(canvas);
    this.resize();
    this.bind();
    const loop = (t) => {
      this.frame(t);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // ------------------------------------------------------------ data

  setData(ideas, edges, judging = []) {
    this.nodes.clear();
    this.edges = [];
    this.edgeKeys.clear();
    this.ghosts = [];
    this.judging = new Set(judging);
    this.busy.clear();
    this.selected = this.hover = this.pick = null;
    for (const i of ideas) this.upsert(i, false);
    this.addEdges(edges);
    this.alpha = 0.6;
    this.fit(true);
  }

  upsert(idea, animate = true) {
    const n = this.nodes.get(idea.id);
    if (n) {
      n.idea = idea;
      n.tr = radiusFor(idea);
    } else {
      const r = radiusFor(idea);
      this.nodes.set(idea.id, {
        id: idea.id, idea, x: idea.x, y: idea.y, vx: 0, vy: 0, r: animate ? r * 0.3 : r, tr: r,
        born: animate ? performance.now() : 0, fx: null, fy: null,
      });
      this.alpha = Math.max(this.alpha, 0.5);
      if (animate && this.followNewest && performance.now() - this.lastUser > 8000) this.focusOn(idea.id, null);
    }
    this.focusCache.id = null;
    this.dirty = true;
  }

  remove(id) {
    this.nodes.delete(id);
    this.edges = this.edges.filter((e) => e.from !== id && e.to !== id);
    this.edgeKeys = new Set(this.edges.map((e) => `${e.from}-${e.to}`));
    if (this.selected === id) this.selected = null;
    this.focusCache.id = null;
    this.alpha = Math.max(this.alpha, 0.3);
    this.dirty = true;
  }

  addEdges(edges) {
    for (const e of edges) {
      const k = `${e.from}-${e.to}`;
      if (this.edgeKeys.has(k)) continue;
      this.edgeKeys.add(k);
      this.edges.push({ from: e.from, to: e.to });
    }
    this.focusCache.id = null;
    this.alpha = Math.max(this.alpha, 0.4);
    if (this.viewMode !== 'organic') this.applyViewLayout();
    this.dirty = true;
  }

  // ------------------------------------------------------------ view modes & layout

  setViewMode(mode) {
    if (this.viewMode === mode) return;
    this.viewMode = mode;
    this.applyViewLayout();
    this.fit();
    this.dirty = true;
  }

  applyViewLayout() {
    if (this.viewMode === 'organic') {
      for (const n of this.nodes.values()) {
        n.fx = n.fy = null;
        if (n.idea.x != null && n.idea.y != null) {
          n.x = n.idea.x;
          n.y = n.idea.y;
        }
      }
      this.alpha = 0.6;
      return;
    }

    if (this.viewMode === 'tree') {
      const parentsOf = new Map();
      for (const e of this.edges) {
        (parentsOf.get(e.to) ?? parentsOf.set(e.to, []).get(e.to)).push(e.from);
      }
      const depths = new Map();
      const getDepth = (id, visited = new Set()) => {
        if (depths.has(id)) return depths.get(id);
        if (visited.has(id)) return 0;
        visited.add(id);
        const pars = parentsOf.get(id) ?? [];
        if (!pars.length) { depths.set(id, 0); return 0; }
        const d = 1 + Math.max(...pars.map((p) => getDepth(p, new Set(visited))));
        depths.set(id, d);
        return d;
      };
      for (const id of this.nodes.keys()) getDepth(id);

      const levels = new Map();
      for (const [id, d] of depths.entries()) {
        (levels.get(d) ?? levels.set(d, []).get(d)).push(id);
      }
      const maxD = Math.max(0, ...levels.keys());
      for (const [d, ids] of levels.entries()) {
        const count = ids.length;
        const spacing = Math.max(160, Math.min(260, 1100 / count));
        const totalW = (count - 1) * spacing;
        ids.forEach((id, i) => {
          const n = this.nodes.get(id);
          if (n) {
            n.fx = -totalW / 2 + i * spacing;
            n.fy = (d - maxD / 2) * 210;
            n.vx = n.vy = 0;
          }
        });
      }
      this.alpha = 0.35;
      return;
    }

    if (this.viewMode === 'matrix') {
      for (const n of this.nodes.values()) {
        const i = n.idea;
        const feas = i.feasibility ?? 3;
        const orig = i.originality ?? 3;
        const imp = i.impact ?? 3;
        const impactScore = (orig + imp) / 2;
        const jitterX = ((n.id * 19) % 70) - 35;
        const jitterY = ((n.id * 31) % 70) - 35;
        n.fx = (feas - 3) * 180 + jitterX;
        n.fy = -(impactScore - 3) * 160 + jitterY;
        n.vx = n.vy = 0;
      }
      this.alpha = 0.35;
      return;
    }
  }

  // ------------------------------------------------------------ branch folding

  toggleCollapse(id) {
    if (this.collapsed.has(id)) this.collapsed.delete(id);
    else this.collapsed.add(id);
    this.focusCache.id = null;
    this.dirty = true;
    this.alpha = Math.max(this.alpha, 0.4);
  }

  getHiddenNodeIds() {
    if (!this.collapsed.size) return new Set();
    const childrenOf = new Map();
    for (const e of this.edges) {
      (childrenOf.get(e.from) ?? childrenOf.set(e.from, []).get(e.from)).push(e.to);
    }
    const hidden = new Set();
    for (const cid of this.collapsed) {
      const q = [...(childrenOf.get(cid) ?? [])];
      while (q.length) {
        const curr = q.pop();
        if (!hidden.has(curr)) {
          hidden.add(curr);
          for (const next of childrenOf.get(curr) ?? []) q.push(next);
        }
      }
    }
    return hidden;
  }

  collapsedChildCount(id) {
    const childrenOf = new Map();
    for (const e of this.edges) {
      (childrenOf.get(e.from) ?? childrenOf.set(e.from, []).get(e.from)).push(e.to);
    }
    const seen = new Set();
    const q = [...(childrenOf.get(id) ?? [])];
    while (q.length) {
      const curr = q.pop();
      if (!seen.has(curr)) {
        seen.add(curr);
        for (const next of childrenOf.get(curr) ?? []) q.push(next);
      }
    }
    return seen.size;
  }

  collapsePillAt(wx, wy) {
    for (const n of this.nodes.values()) {
      if (this.collapsedChildCount(n.id) > 0) {
        const px = n.x + n.r * 0.75, py = n.y + n.r * 0.75;
        if (Math.hypot(wx - px, wy - py) <= 16) return n;
      }
    }
    return null;
  }

  setJudging(ids, on) {
    for (const id of ids) on ? this.judging.add(id) : this.judging.delete(id);
    this.dirty = true;
  }

  setBusy(ids, on) {
    for (const id of ids) on ? this.busy.add(id) : this.busy.delete(id);
    this.dirty = true;
  }

  /** Placeholders where new ideas will appear while the model works. */
  addGhosts(points) {
    const now = performance.now();
    const ghosts = points.map((p) => ({ ...p, born: now }));
    this.ghosts.push(...ghosts);
    this.dirty = true;
    return () => {
      this.ghosts = this.ghosts.filter((g) => !ghosts.includes(g));
      this.dirty = true;
    };
  }

  ghostsAround(id, n = 3) {
    const node = this.nodes.get(id);
    if (!node) return [];
    return Array.from({ length: n }, (_, i) => {
      const a = (Math.PI * 2 * i) / n - Math.PI / 2;
      return { x: node.x + Math.cos(a) * 170, y: node.y + Math.sin(a) * 170 };
    });
  }

  burst(id, color = MEDAL_COLORS[3]) {
    const n = this.nodes.get(id);
    if (n) this.bursts.push({ x: n.x, y: n.y, r: n.r, color, born: performance.now() });
    this.dirty = true;
  }

  select(id) {
    this.selected = id;
    this.focusCache.id = null;
    this.dirty = true;
  }

  setPick(id) {
    this.pick = id;
    this.c.style.cursor = id ? 'crosshair' : '';
    this.dirty = true;
  }

  positions() {
    return [...this.nodes.values()].map((n) => ({ id: n.id, x: n.x, y: n.y }));
  }

  viewCenter() {
    return { x: this.cam.x + (Math.random() - 0.5) * 80, y: this.cam.y + (Math.random() - 0.5) * 80 };
  }

  focusOn(id, k = 1) {
    const n = this.nodes.get(id);
    if (n) this.camTarget = { x: n.x, y: n.y, k: k ?? this.cam.k };
    this.dirty = true;
  }

  fit(instant = false) {
    if (!this.nodes.size) {
      this.cam = { x: 0, y: 0, k: 1 };
      this.camTarget = null;
      return;
    }
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const n of this.nodes.values()) {
      x0 = Math.min(x0, n.x - n.tr); y0 = Math.min(y0, n.y - n.tr);
      x1 = Math.max(x1, n.x + n.tr); y1 = Math.max(y1, n.y + n.tr);
    }
    const { top, right, bottom, left } = this.insets;
    const w = Math.max(100, this.c.clientWidth - left - right), h = Math.max(100, this.c.clientHeight - top - bottom);
    const k = Math.min(1.4, Math.max(0.15, Math.min(w / (x1 - x0 + 80), h / (y1 - y0 + 80))));
    // Center the board in the free area, not behind the overlays.
    const target = { x: (x0 + x1) / 2 - (left - right) / (2 * k), y: (y0 + y1) / 2 - (top - bottom) / (2 * k), k };
    if (instant) this.cam = target;
    else this.camTarget = target;
    this.dirty = true;
  }

  zoomBy(f) {
    this.camTarget = { ...this.cam, k: Math.min(3, Math.max(0.1, this.cam.k * f)) };
  }

  // ------------------------------------------------------------ geometry

  resize() {
    this.dpr = window.devicePixelRatio || 1;
    this.c.width = Math.round(this.c.clientWidth * this.dpr);
    this.c.height = Math.round(this.c.clientHeight * this.dpr);
    this.dirty = true;
  }

  toWorld(sx, sy) {
    const r = this.c.getBoundingClientRect();
    return {
      x: (sx - r.left - this.c.clientWidth / 2) / this.cam.k + this.cam.x,
      y: (sy - r.top - this.c.clientHeight / 2) / this.cam.k + this.cam.y,
    };
  }

  toScreen(wx, wy) {
    const r = this.c.getBoundingClientRect();
    return {
      x: (wx - this.cam.x) * this.cam.k + this.c.clientWidth / 2 + r.left,
      y: (wy - this.cam.y) * this.cam.k + this.c.clientHeight / 2 + r.top,
    };
  }

  nodeAt(wx, wy, except = null) {
    const list = [...this.nodes.values()];
    for (let i = list.length - 1; i >= 0; i--) {
      const n = list[i];
      if (n.id !== except && Math.hypot(n.x - wx, n.y - wy) <= n.r + 4) return n;
    }
    return null;
  }

  /** The idea's whole family line: ancestors and descendants. */
  focus() {
    const id = this.hover ?? this.selected;
    if (id == null) return null;
    if (this.focusCache.id === id) return this.focusCache;
    const up = new Map(), down = new Map();
    for (const e of this.edges) {
      (up.get(e.to) ?? up.set(e.to, []).get(e.to)).push(e.from);
      (down.get(e.from) ?? down.set(e.from, []).get(e.from)).push(e.to);
    }
    const set = new Set([id]);
    for (const map of [up, down]) {
      const q = [id];
      while (q.length) for (const n of map.get(q.pop()) ?? []) if (!set.has(n)) { set.add(n); q.push(n); }
    }
    const edges = new Set(this.edges.filter((e) => set.has(e.from) && set.has(e.to)).map((e) => `${e.from}-${e.to}`));
    this.focusCache = { id, set, edges };
    return this.focusCache;
  }

  // ------------------------------------------------------------ simulation

  tick() {
    const nodes = [...this.nodes.values()];
    const a = this.alpha;
    for (const e of this.edges) {
      const s = this.nodes.get(e.from), t = this.nodes.get(e.to);
      if (!s || !t) continue;
      let dx = t.x + t.vx - s.x - s.vx, dy = t.y + t.vy - s.y - s.vy;
      const l = Math.hypot(dx, dy) || 1;
      const f = ((l - (s.r + t.r + 90)) / l) * a * 0.22;
      dx *= f; dy *= f;
      t.vx -= dx * 0.5; t.vy -= dy * 0.5; s.vx += dx * 0.5; s.vy += dy * 0.5;
    }
    for (let i = 0; i < nodes.length; i++) {
      const p = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const q = nodes[j];
        const dx = q.x - p.x, dy = q.y - p.y;
        let d2 = dx * dx + dy * dy;
        if (d2 > 640_000) continue;
        d2 = Math.max(d2, 400);
        const f = (-1400 * a) / d2;
        p.vx += dx * f; p.vy += dy * f; q.vx -= dx * f; q.vy -= dy * f;
      }
      p.vx -= p.x * 0.0025 * a;
      p.vy -= p.y * 0.0025 * a;
    }
    for (const n of nodes) {
      n.vx *= 0.58; n.vy *= 0.58;
      if (n.fx != null) { n.x = n.fx; n.y = n.fy; n.vx = n.vy = 0; } else { n.x += n.vx; n.y += n.vy; }
    }
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const p = nodes[i], q = nodes[j];
          const min = p.r + q.r + 14;
          let dx = q.x - p.x, dy = q.y - p.y;
          const d = Math.hypot(dx, dy);
          if (d >= min) continue;
          if (d < 0.01) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; }
          const push = (min - d) / (d || 1) * 0.5;
          if (p.fx == null) { p.x -= dx * push; p.y -= dy * push; }
          if (q.fx == null) { q.x += dx * push; q.y += dy * push; }
        }
      }
    }
    this.alpha += (0 - this.alpha) * 0.02;
  }

  // ------------------------------------------------------------ frame

  frame(now) {
    let animating = this.alpha > 0.004 || !!this.camTarget || this.judging.size || this.busy.size || this.ghosts.length || this.bursts.length;
    for (const n of this.nodes.values()) {
      if (Math.abs(n.r - n.tr) > 0.2) { n.r += (n.tr - n.r) * 0.12; animating = true; }
      if (n.born && now - n.born < 600) animating = true;
    }
    if (this.alpha > 0.004) {
      this.tick();
      this.wasSettled = false;
    } else if (!this.wasSettled) {
      this.wasSettled = true;
      this.h.moved?.();
    }
    if (this.camTarget) {
      const c = this.cam, tg = this.camTarget;
      c.x += (tg.x - c.x) * 0.12; c.y += (tg.y - c.y) * 0.12; c.k += (tg.k - c.k) * 0.12;
      if (Math.abs(tg.x - c.x) < 0.5 && Math.abs(tg.y - c.y) < 0.5 && Math.abs(tg.k - c.k) < 0.002) this.camTarget = null;
    }
    if (!animating && !this.dirty) return;
    this.dirty = false;
    if (this.selected) this.h.camChanged?.();
    this.draw(now);
  }

  draw(now) {
    const { ctx, cam } = this;
    const w = this.c.clientWidth, h = this.c.clientHeight, k = cam.k;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, w, h);

    // Dot grid, in world space, fading out when zoomed far out.
    const step = 48;
    if (step * k > 12) {
      ctx.fillStyle = `rgba(255,255,255,${Math.min(0.07, (step * k - 12) / 300)})`;
      const x0 = Math.floor((cam.x - w / 2 / k) / step) * step, x1 = cam.x + w / 2 / k;
      const y0 = Math.floor((cam.y - h / 2 / k) / step) * step, y1 = cam.y + h / 2 / k;
      for (let x = x0; x < x1; x += step) for (let y = y0; y < y1; y += step) {
        ctx.fillRect((x - cam.x) * k + w / 2 - 1, (y - cam.y) * k + h / 2 - 1, 2, 2);
      }
    }

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(k, k);
    ctx.translate(-cam.x, -cam.y);
    const focus = this.focus();
    const hidden = this.getHiddenNodeIds();

    // 2x2 Matrix Grid & Quadrant Labels
    if (this.viewMode === 'matrix') {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(-900, 0); ctx.lineTo(900, 0);
      ctx.moveTo(0, -700); ctx.lineTo(0, 700);
      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1.5 / k;
      ctx.stroke();
      ctx.setLineDash([]);

      const qFs = Math.max(12, Math.min(22, 16 / k));
      ctx.font = `700 ${qFs}px ${FONT}`;

      // Top-right: Quick Wins
      ctx.fillStyle = 'rgba(245, 197, 66, 0.55)';
      ctx.textAlign = 'right'; ctx.textBaseline = 'top';
      ctx.fillText(t('quadrantQuickWins'), 780, -560);

      // Top-left: Moonshots
      ctx.fillStyle = 'rgba(144, 133, 233, 0.55)';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(t('quadrantMoonshots'), -780, -560);

      // Bottom-right: Low-Hanging Fruit
      ctx.fillStyle = 'rgba(57, 135, 229, 0.55)';
      ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
      ctx.fillText(t('quadrantLowHanging'), 780, 560);

      // Bottom-left: Deprioritize
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText(t('quadrantDeprioritize'), -780, 560);

      // Axes guide
      ctx.font = `600 ${Math.max(10, 13 / k)}px ${FONT}`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(t('axisFeasibility'), 880, -18);
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(t('axisImpact'), 0, -680);
      ctx.restore();
    }

    // Edges: parent → child, smooth Bezier curves
    for (const e of this.edges) {
      if (hidden.has(e.from) || hidden.has(e.to)) continue;
      const s = this.nodes.get(e.from), t = this.nodes.get(e.to);
      if (!s || !t) continue;
      const lit = focus?.edges.has(`${e.from}-${e.to}`);
      const isRecomb = t.idea.kind === 'combine';

      ctx.beginPath();
      if (this.viewMode === 'tree') {
        const dy = (t.y - s.y) * 0.5;
        ctx.moveTo(s.x, s.y);
        ctx.bezierCurveTo(s.x, s.y + dy, t.x, t.y - dy, t.x, t.y);
      } else {
        const mx = (s.x + t.x) / 2, my = (s.y + t.y) / 2;
        const cx = mx + (t.y - s.y) * 0.08, cy = my - (t.x - s.x) * 0.08;
        ctx.moveTo(s.x, s.y);
        ctx.quadraticCurveTo(cx, cy, t.x, t.y);
      }
      if (isRecomb) ctx.setLineDash([5, 5]);
      ctx.strokeStyle = lit ? KIND_COLORS[t.idea.kind] ?? '#fff' : focus ? 'rgba(255,255,255,0.05)' : isRecomb ? 'rgba(144,133,233,0.35)' : 'rgba(255,255,255,0.18)';
      ctx.lineWidth = (lit ? 2.8 : 1.6) / Math.max(k, 0.4);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Ghosts: where new ideas are on their way.
    for (const g of this.ghosts) {
      const pulse = 0.5 + 0.5 * Math.sin((now - g.born) / 260);
      ctx.beginPath();
      ctx.arc(g.x, g.y, 34 + pulse * 6, 0, Math.PI * 2);
      ctx.setLineDash([6, 8]);
      ctx.strokeStyle = `rgba(255,255,255,${0.18 + pulse * 0.2})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    for (const n of this.nodes.values()) {
      if (!hidden.has(n.id)) this.drawNode(n, now, focus, k);
    }

    // Gold bursts.
    this.bursts = this.bursts.filter((b) => now - b.born < 1400);
    for (const b of this.bursts) {
      const p = (now - b.born) / 1400;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r + p * 120, 0, Math.PI * 2);
      ctx.strokeStyle = b.color;
      ctx.globalAlpha = 1 - p;
      ctx.lineWidth = 6 * (1 - p) + 1;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // While dragging onto another idea: the line that will become a cross.
    if (this.drag?.type === 'node' && this.dropTarget) {
      const a = this.nodes.get(this.drag.id), b = this.dropTarget;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = KIND_COLORS.combine;
      ctx.lineWidth = 3 / k;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Live wire drag
    if (this.wireDrag) {
      const a = this.nodes.get(this.wireDrag.fromId);
      if (a) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(this.wireDrag.x, this.wireDrag.y);
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = KIND_COLORS.combine;
        ctx.lineWidth = 2.5 / k;
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    ctx.restore();

    if (this.nodes.size === 0 && this.ghosts.length === 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = `500 15px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t('canvasEmpty'), w / 2, h / 2 - 12);
      ctx.font = `400 13px ${FONT}`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillText(t('canvasEmptySub'), w / 2, h / 2 + 16);
      ctx.restore();
    } else {
      this.drawMinimap(w, h);
    }
  }

  drawMinimap(w, h) {
    const { ctx } = this;
    const mw = 170, mh = 110;
    const mx = 20, my = h - mh - 20;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(mx, my, mw, mh, 10);
    ctx.fillStyle = 'rgba(17, 20, 28, 0.92)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Title
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = `600 9px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('RADAR', mx + 8, my + 6);

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const n of this.nodes.values()) {
      minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x);
      minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y);
    }
    const pad = 120;
    minX -= pad; maxX += pad; minY -= pad; maxY += pad;
    const spanX = Math.max(200, maxX - minX), spanY = Math.max(200, maxY - minY);
    const innerW = mw - 16, innerH = mh - 26;
    const scale = Math.min(innerW / spanX, innerH / spanY);
    const ox = mx + 8 + (innerW - spanX * scale) / 2;
    const oy = my + 18 + (innerH - spanY * scale) / 2;

    const toMini = (wx, wy) => ({
      x: ox + (wx - minX) * scale,
      y: oy + (wy - minY) * scale,
    });

    // Draw node dots
    for (const n of this.nodes.values()) {
      const p = toMini(n.x, n.y);
      const m = medal(n.idea);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = m ? MEDAL_COLORS[m] : KIND_COLORS[n.idea.kind] ?? '#888';
      ctx.fill();
    }

    // Draw camera viewport
    const k = this.cam.k;
    const vtl = toMini(this.cam.x - w / 2 / k, this.cam.y - h / 2 / k);
    const vbr = toMini(this.cam.x + w / 2 / k, this.cam.y + h / 2 / k);
    const vw = Math.max(8, vbr.x - vtl.x), vh = Math.max(6, vbr.y - vtl.y);
    ctx.beginPath();
    ctx.roundRect(vtl.x, vtl.y, vw, vh, 2);
    ctx.strokeStyle = 'rgba(57, 135, 229, 0.85)';
    ctx.fillStyle = 'rgba(57, 135, 229, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();

    this.minimapBounds = { mx, my, mw, mh, minX, minY, scale, ox, oy };
    ctx.restore();
  }

  drawNode(n, now, focus, k) {
    const { ctx } = this;
    const idea = n.idea;
    const age = n.born ? (now - n.born) / 500 : 1;
    const scale = age >= 1 ? 1 : Math.max(0.05, easeOutBack(Math.min(1, age)));
    const r = n.r * scale;
    const color = KIND_COLORS[idea.kind] ?? '#888';
    const m = medal(idea);
    ctx.globalAlpha = focus && !focus.set.has(n.id) ? 0.28 : 1;

    if (m === 3) {
      ctx.shadowColor = 'rgba(245,197,66,0.55)';
      ctx.shadowBlur = 28;
    }
    const g = ctx.createRadialGradient(n.x - r * 0.35, n.y - r * 0.4, r * 0.1, n.x, n.y, r);
    g.addColorStop(0, color + 'cc');
    g.addColorStop(1, '#151821');
    ctx.beginPath();
    ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.lineWidth = m ? 3.5 : 1.5;
    ctx.strokeStyle = m ? MEDAL_COLORS[m] : color + '99';
    ctx.stroke();

    if (idea.kind === 'guest') {
      ctx.beginPath();
      ctx.arc(n.x, n.y, r + 6, 0, Math.PI * 2);
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = KIND_COLORS.guest;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (this.selected === n.id || this.pick === n.id) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, r + 9, 0, Math.PI * 2);
      ctx.strokeStyle = this.pick === n.id ? KIND_COLORS.combine : '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    if (this.dropTarget === n) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, r + 12, 0, Math.PI * 2);
      ctx.strokeStyle = KIND_COLORS.combine;
      ctx.lineWidth = 4;
      ctx.stroke();
    }
    if (this.judging.has(n.id)) {
      const a0 = now / 300;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r + 5, a0, a0 + Math.PI * 0.6);
      ctx.strokeStyle = '#f5c542';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    if (this.busy.has(n.id)) {
      const p = 0.5 + 0.5 * Math.sin(now / 180);
      ctx.beginPath();
      ctx.arc(n.x, n.y, r + 4 + p * 8, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${0.15 + p * 0.35})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Text only when it would be legible on screen.
    if (r * k >= 18) {
      const fs = Math.max(10, Math.min(17, r * 0.24));
      const lines = this.wrap(n, idea.title, fs, r * 1.5, r < 45 ? 3 : 4);
      ctx.fillStyle = TEXT;
      ctx.font = `600 ${fs}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const lh = fs * 1.18;
      const top = n.y - ((lines.length - 1) * lh) / 2 - (scoreSum(idea) != null ? fs * 0.35 : 0);
      lines.forEach((line, i) => ctx.fillText(line, n.x, top + i * lh));

      const sum = scoreSum(idea);
      if (sum != null) {
        const label = String(sum);
        ctx.font = `700 ${fs * 0.78}px ${FONT}`;
        const pw = ctx.measureText(label).width + fs * 0.9, ph = fs * 1.15;
        const py = n.y + r - ph * 0.95;
        ctx.beginPath();
        ctx.roundRect(n.x - pw / 2, py - ph / 2, pw, ph, ph / 2);
        ctx.fillStyle = m ? MEDAL_COLORS[m] : '#2b303c';
        ctx.fill();
        ctx.fillStyle = m ? '#111' : '#d7dbe3';
        ctx.fillText(label, n.x, py + 0.5);
      }
      if (idea.projectPath) {
        const bx = n.x + r * 0.72, by = n.y - r * 0.72, br = Math.max(9, fs * 0.75);
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.fillStyle = '#e8e3d9';
        ctx.fill();
        ctx.fillStyle = '#111';
        ctx.font = `800 ${br * 0.95}px ${FONT}`;
        ctx.fillText('CC', bx, by + 0.5);
      }
    }

    const childCnt = this.collapsedChildCount(idea.id);
    if (childCnt > 0) {
      const isFolded = this.collapsed.has(idea.id);
      const pr = Math.max(10, Math.min(15, r * 0.28));
      const px = n.x + r * 0.72;
      const py = n.y + r * 0.72;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fillStyle = isFolded ? '#3987e5' : '#232733';
      ctx.fill();
      ctx.strokeStyle = isFolded ? '#60a5fa' : 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${pr * 0.9}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isFolded ? `+${childCnt}` : '−', px, py + 0.5);
    }

    ctx.globalAlpha = 1;
  }

  wrap(n, text, fs, maxW, maxLines) {
    const key = `${text}|${fs.toFixed(1)}|${maxW.toFixed(0)}`;
    if (n.wrapKey === key) return n.wrapLines;
    const ctx = this.ctx;
    ctx.font = `600 ${fs}px ${FONT}`;
    const words = text.split(/\s+/);
    const lines = [];
    let cur = '';
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (ctx.measureText(next).width <= maxW || !cur) cur = next;
      else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    if (lines.length > maxLines) {
      lines.length = maxLines;
      let last = lines[maxLines - 1];
      while (last.length > 1 && ctx.measureText(last + '…').width > maxW) last = last.slice(0, -1);
      lines[maxLines - 1] = last.trimEnd() + '…';
    }
    n.wrapKey = key;
    n.wrapLines = lines;
    return lines;
  }

  // ------------------------------------------------------------ input

  bind() {
    const c = this.c;
    c.addEventListener('pointerdown', (e) => {
      c.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.lastUser = performance.now();
      this.camTarget = null;
      if (this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()];
        this.drag = { type: 'pinch', d: Math.hypot(a.x - b.x, a.y - b.y), k: this.cam.k };
        return;
      }

      // Check minimap click
      if (this.minimapBounds) {
        const { mx, my, mw, mh, minX, minY, scale, ox, oy } = this.minimapBounds;
        if (e.clientX >= mx && e.clientX <= mx + mw && e.clientY >= my && e.clientY <= my + mh) {
          const wx = minX + (e.clientX - ox) / scale;
          const wy = minY + (e.clientY - oy) / scale;
          this.centerOn(wx, wy);
          this.drag = { type: 'minimap', minX, minY, scale, ox, oy };
          return;
        }
      }

      const w = this.toWorld(e.clientX, e.clientY);

      // Check branch collapse pill click
      const pillNodeId = this.collapsePillAt(w.x, w.y);
      if (pillNodeId != null) {
        this.toggleCollapse(pillNodeId);
        return;
      }

      const n = this.nodeAt(w.x, w.y);
      if (n) {
        this.drag = { type: 'node', id: n.id, sx: e.clientX, sy: e.clientY, ox: n.x - w.x, oy: n.y - w.y, moved: false };
      } else {
        this.drag = { type: 'pan', sx: e.clientX, sy: e.clientY, cx: this.cam.x, cy: this.cam.y, moved: false };
      }
    });

    c.addEventListener('pointermove', (e) => {
      if (this.pointers.has(e.pointerId)) this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const d = this.drag;
      if (d?.type === 'minimap') {
        const wx = d.minX + (e.clientX - d.ox) / d.scale;
        const wy = d.minY + (e.clientY - d.oy) / d.scale;
        this.centerOn(wx, wy);
        return;
      }
      if (d?.type === 'pinch' && this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()];
        this.cam.k = Math.min(3, Math.max(0.1, d.k * (Math.hypot(a.x - b.x, a.y - b.y) / d.d)));
        this.dirty = true;
        return;
      }
      if (d?.type === 'node') {
        if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 5) {
          d.moved = true;
          if (this.hover != null) {
            this.hover = null; // the hover card must not cover the drop target
            this.h.hover?.(null);
          }
        }
        if (!d.moved) return;
        const w = this.toWorld(e.clientX, e.clientY);
        const n = this.nodes.get(d.id);
        if (!n) return;
        n.fx = w.x + d.ox;
        n.fy = w.y + d.oy;
        this.dropTarget = this.nodeAt(w.x, w.y, d.id);
        this.alpha = Math.max(this.alpha, 0.15);
        this.dirty = true;
        return;
      }
      if (d?.type === 'pan') {
        if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 4) d.moved = true;
        this.cam.x = d.cx - (e.clientX - d.sx) / this.cam.k;
        this.cam.y = d.cy - (e.clientY - d.sy) / this.cam.k;
        this.dirty = true;
        return;
      }
      const w = this.toWorld(e.clientX, e.clientY);
      const n = this.nodeAt(w.x, w.y);
      const id = n?.id ?? null;
      if (id !== this.hover) {
        this.hover = id;
        this.dirty = true;
        c.style.cursor = this.pick ? 'crosshair' : id ? 'pointer' : 'grab';
        this.h.hover?.(id, e);
      }
    });

    const end = (e) => {
      this.pointers.delete(e.pointerId);
      const d = this.drag;
      this.drag = null;
      if (!d || d.type === 'pinch') return;
      if (d.type === 'node') {
        const n = this.nodes.get(d.id);
        if (n) { n.fx = n.fy = null; }
        const target = this.dropTarget;
        this.dropTarget = null;
        this.dirty = true;
        if (!d.moved) {
          if (this.pick && this.pick !== d.id) {
            const a = this.pick;
            this.setPick(null);
            this.h.combine?.(a, d.id);
          } else {
            this.h.select?.(d.id);
          }
        } else if (target) {
          this.h.combine?.(d.id, target.id);
        } else {
          this.h.moved?.();
        }
      } else if (d.type === 'pan' && !d.moved) {
        if (this.pick) this.setPick(null);
        this.h.select?.(null);
      }
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    c.addEventListener('pointerleave', () => {
      if (this.hover != null && !this.drag) {
        this.hover = null;
        this.dirty = true;
        this.h.hover?.(null);
      }
    });

    c.addEventListener('dblclick', (e) => {
      const w = this.toWorld(e.clientX, e.clientY);
      const n = this.nodeAt(w.x, w.y);
      if (n) this.h.expand?.(n.id);
      else this.h.create?.(w.x, w.y);
    });

    c.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this.lastUser = performance.now();
        this.camTarget = null;
        // Pinch (ctrlKey) and mouse wheels zoom; two-finger trackpad scroll pans.
        const mouseWheel = e.deltaMode !== 0 || (e.deltaX === 0 && Number.isInteger(e.deltaY) && Math.abs(e.deltaY) >= 40);
        if (e.ctrlKey || e.metaKey || mouseWheel) {
          const before = this.toWorld(e.clientX, e.clientY);
          const f = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015));
          this.cam.k = Math.min(3, Math.max(0.1, this.cam.k * f));
          const after = this.toWorld(e.clientX, e.clientY);
          this.cam.x += before.x - after.x;
          this.cam.y += before.y - after.y;
        } else {
          this.cam.x += e.deltaX / this.cam.k;
          this.cam.y += e.deltaY / this.cam.k;
        }
        this.dirty = true;
      },
      { passive: false },
    );

    // Leads dragged in from the scouting panel.
    c.addEventListener('dragover', (e) => {
      if (e.dataTransfer?.types.includes('text/x-lead')) e.preventDefault();
    });
    c.addEventListener('drop', (e) => {
      const id = Number(e.dataTransfer?.getData('text/x-lead'));
      if (!id) return;
      e.preventDefault();
      const w = this.toWorld(e.clientX, e.clientY);
      this.h.dropLead?.(id, w.x, w.y);
    });
  }
}
