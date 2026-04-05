import type { EnvTool } from '../env-tool.js';
import { bem } from '../dom-utils.js';

const cls = bem('env-entry');

const viewW = () => document.documentElement.clientWidth;
const viewH = () => document.documentElement.clientHeight;

export class EnvEntry {
  root: EnvTool;
  $el!: HTMLDivElement;

  constructor(root: EnvTool) {
    this.root = root;
    this.create();
    void this.member();
    this.bindToggle();
    this.makeDraggable();
  }

  private genZIndexAndPositionStyle(): string {
    const n = this.root.entryBtnStyle;
    const z = n?.zIndex;
    const pos = n?.position ?? {};
    let r = '';
    if (Number.isInteger(Number(z))) {
      r += `z-index: ${Number(z)};`;
    }
    r += Object.keys(pos)
      .map((key) => {
        const raw = String(pos[key]).replace(/px/gi, '');
        return Number.isNaN(Number(raw))
          ? `${key}: ${raw};`
          : raw.length
            ? `${key}: ${raw}px;`
            : '';
      })
      .filter(Boolean)
      .join(' ');
    return r;
  }

  private create(): void {
    const n = document.createElement('div');
    n.className = cls();
    if (this.root.entryBtnStyle && Object.keys(this.root.entryBtnStyle).length) {
      n.setAttribute('style', this.genZIndexAndPositionStyle());
    }
    this.$el = n;
  }

  private async member(): Promise<void> {
    const e = await this.root.storage.getEnv();
    const env = e.env;
    const letter = env[0] ?? '?';
    this.$el.insertAdjacentHTML(
      'beforeend',
      `<span class="${cls('member')}">${letter}</span>`,
    );
  }

  private bindToggle(): void {
    this.$el.addEventListener('click', () => {
      this.root.toggleModal();
    });
  }

  private makeDraggable(): void {
    let translateX = 0;
    let translateY = 0;
    let grabDx = 0;
    let grabDy = 0;
    let dragging = false;

    const applyTranslate = (x: number, y: number) => {
      this.$el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const onStart = (ev: MouseEvent | TouchEvent) => {
      let cx: number;
      let cy: number;
      if (ev.type === 'touchstart' && 'touches' in ev) {
        const t = ev.touches[0];
        cx = t.clientX;
        cy = t.clientY;
      } else if (ev instanceof MouseEvent) {
        cx = ev.clientX;
        cy = ev.clientY;
      } else {
        return;
      }
      grabDx = cx - translateX;
      grabDy = cy - translateY;
      dragging = true;
    };

    const onMove = (ev: MouseEvent | TouchEvent) => {
      if (!dragging) return;
      ev.preventDefault();
      let cx: number;
      let cy: number;
      if (ev.type === 'touchmove' && 'touches' in ev) {
        const t = ev.touches[0];
        cx = t.clientX;
        cy = t.clientY;
      } else if (ev instanceof MouseEvent) {
        cx = ev.clientX;
        cy = ev.clientY;
      } else {
        return;
      }
      if (cx + 10 > viewW() || cy + 10 > viewH()) return;
      translateX = cx - grabDx;
      translateY = cy - grabDy;
      applyTranslate(translateX, translateY);
    };

    const onEnd = () => {
      dragging = false;
    };

    this.$el.addEventListener('touchstart', onStart);
    this.$el.addEventListener('touchmove', onMove);
    this.$el.addEventListener('touchend', onEnd);
    this.$el.addEventListener('mousedown', onStart);
    this.$el.addEventListener('mousemove', onMove);
    this.$el.addEventListener('mouseup', onEnd);
  }
}
