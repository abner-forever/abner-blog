import { mergeStorage } from './session-storage.js';
import type { EnvToolInitOptions, EnvToolStorage } from './types.js';
import { EnvEntry } from './ui/env-entry.js';
import { EnvMainModal } from './ui/env-modal.js';

export class EnvTool {
  initComplete = false;
  debug = false;
  storage!: EnvToolStorage;
  entryBtnStyle: NonNullable<EnvToolInitOptions['entryBtnStyle']> = {};
  $container!: HTMLDivElement;
  entry!: EnvEntry;
  mainModal: EnvMainModal | undefined;

  private initContainer(): void {
    const n = document.createElement('div');
    n.className = 'abner-env-tool';
    this.$container = n;
    document.body.appendChild(this.$container);
  }

  private initEntryBtn(): void {
    this.entry = new EnvEntry(this);
    this.$container.appendChild(this.entry.$el);
  }

  private initMainModal(): void {
    this.mainModal = new EnvMainModal(this);
    this.$container.appendChild(this.mainModal.$mask);
  }

  toggleModal(): void {
    if (this.getMainModal()) {
      this.closeMainModal();
    } else {
      this.openMainModal();
    }
  }

  getMainModal(): Element | null {
    return this.$container.querySelector('.env-mask');
  }

  openMainModal(): void {
    this.initMainModal();
    this.mainModal!.open();
  }

  closeMainModal(): void {
    const n = this.getMainModal();
    if (n?.parentNode) {
      this.$container.removeChild(n);
    }
    this.mainModal = undefined;
  }

  reRenderEntryBtn(): void {
    const el = this.entry.$el;
    if (el.parentNode) {
      this.$container.removeChild(el);
    }
    this.initEntryBtn();
  }

  init(options: EnvToolInitOptions = {}): void {
    const d = options.debug ?? this.debug;
    this.debug = d;
    if (d) console.error('init start');
    if (this.initComplete) return;
    this.initComplete = true;
    this.storage = mergeStorage(options.storage);
    this.entryBtnStyle = { ...options.entryBtnStyle };

    const boot = (): void => {
      this.initContainer();
      this.initEntryBtn();
    };
    if (document.readyState === 'complete') {
      boot();
    } else {
      window.addEventListener('load', boot);
    }
  }

  async getEnv(): Promise<string> {
    if (!this.initComplete) {
      console.warn('AbnerEnvTool: 请执行 `init` 操作后再调用 `getEnv`');
      return '';
    }
    const e = await this.storage.getEnv();
    const t = e.env;
    const o = e.key;
    if (t === 'CUSTOM') {
      return o || '';
    }
    return o ? `${t}-${o}` : t;
  }
}

export const AbnerEnvTool = new EnvTool();
