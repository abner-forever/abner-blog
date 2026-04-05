import type { EnvMeta } from '../types.js';
import { ENV_OPTIONS, ENV_WITHOUT_BRANCH_KEY } from '../constants.js';
import { colorForEnvKey } from '../color-for-key.js';
import {
  bem,
  addClass,
  removeClass,
  replaceClass,
  closestClass,
} from '../dom-utils.js';
import type { EnvMainModal } from './env-modal.js';
import type { EnvTool } from '../env-tool.js';

const contentCls = bem('env-modal-content');

function isEnvWithoutBranchKey(env: string): boolean {
  return ENV_WITHOUT_BRANCH_KEY.has(env);
}

export class EnvModalContent {
  parent: EnvMainModal;
  root: EnvTool;
  $el!: HTMLDivElement;
  $head!: HTMLElement;
  $environments!: HTMLElement;
  $key!: HTMLElement;
  $action!: HTMLElement;
  $confirmBtn!: HTMLElement;
  $clearBtn!: HTMLElement;
  meta!: EnvMeta;
  env = '';
  private previousSelectedEnvElement: HTMLElement | null = null;

  constructor(parent: EnvMainModal) {
    this.parent = parent;
    this.root = parent.parent;
    this.content();
    this.layout();
    void this.init();
  }

  private content(): void {
    const el = document.createElement('div');
    el.className = contentCls();
    this.$el = el;
  }

  private layout(): void {
    this.$el.insertAdjacentHTML(
      'beforeend',
      `
      <div class="${contentCls('head')}"></div>
      <div class="${contentCls('environments')}"></div>
      <div class="${contentCls('key')}" hidden><input class="env-input" placeholder="独立环境代号"/></div>
      <div class="${contentCls('action')}"></div>
    `,
    );
    this.$head = this.$el.querySelector(
      `.${contentCls('head')}`,
    ) as HTMLElement;
    this.$environments = this.$el.querySelector(
      `.${contentCls('environments')}`,
    ) as HTMLElement;
    this.$key = this.$el.querySelector(
      `.${contentCls('key')}`,
    ) as HTMLElement;
    this.$action = this.$el.querySelector(
      `.${contentCls('action')}`,
    ) as HTMLElement;
  }

  private async init(): Promise<void> {
    this.meta = await this.root.storage.getEnv();
    await this.head();
    this.list();
    this.syncKeyVisibility();
    this.action();
    this.restore();
  }

  private async head(): Promise<void> {
    const env = this.meta.env;
    const bg = colorForEnvKey(env);
    const label = await this.root.getEnv();
    const letter = env[0] ?? '?';
    this.$head.insertAdjacentHTML(
      'beforeend',
      `
        <div class="key-panel">
          <div class="key-panel-avatar" style="background-color: ${bg}">${letter}</div>
          <div class="key-panel-desc">${label}</div>
        </div>
    `,
    );
  }

  private list(): void {
    const items = ENV_OPTIONS.map((opt) => {
      const { key, needKey } = opt;
      const desc = key === 'CUSTOM' ? '自定义' : key;
      return `
          <div class="environment-item-wrapper">
            <div class="environment-item">
              <div
                class="environment-item-avatar ${key}"
                style="background-color: ${colorForEnvKey(key)}"
                data-env="${key}"
                data-needkey="${needKey}"
              >
                ${key[0]}
              </div>
              <div class="environment-item-desc">${desc}</div>
            </div>
          </div>
        `;
    }).join('');
    const panel = `
      <div class="environment-panel">
        ${items}
        <div class="environment-item-holder"></div>
        <div class="environment-item-holder"></div>
        <div class="environment-item-holder"></div>
      </div>
    `;
    this.$environments.insertAdjacentHTML('beforeend', panel);
    this.$environments.addEventListener('click', (ev) => {
      if (closestClass(ev.target, 'environment-item-avatar')) {
        this.selectEnv(ev);
      }
    });
  }

  /** 原压缩包中 key() 末尾误把 hidden 设回 false；此处按环境类型切换输入区显示 */
  private syncKeyVisibility(): void {
    const t = this.env || this.meta.env;
    this.$key.hidden = isEnvWithoutBranchKey(t);
  }

  private action(): void {
    const html = `<div class="${contentCls('action-clear')}">清空</div>
        <div class="${contentCls('action-btn')}">确认</div>`;
    this.$action.insertAdjacentHTML('beforeend', html);
    this.$confirmBtn = this.$el.querySelector(
      `.${contentCls('action-btn')}`,
    ) as HTMLElement;
    this.$clearBtn = this.$el.querySelector(
      `.${contentCls('action-clear')}`,
    ) as HTMLElement;
    this.$confirmBtn.addEventListener('click', () => {
      this.confirm();
    });
    this.$clearBtn.addEventListener('click', () => {
      void this.root.storage.clearEnv();
      this.parentClose();
    });
  }

  private selectEnv(ev: Event): void {
    const target = ev.target as HTMLElement;
    if (this.previousSelectedEnvElement) {
      removeClass(this.previousSelectedEnvElement, 'env-btn-active');
    }
    this.useActiveClass(target);
    this.updateInputKey();
  }

  private useActiveClass(el: HTMLElement): void {
    addClass(el, 'env-btn-active');
    this.previousSelectedEnvElement = el;
    this.env = el.dataset.env ?? '';
  }

  private confirm(): void {
    if (isEnvWithoutBranchKey(this.env)) {
      void this.root.storage.setEnv(JSON.stringify(this.env));
    } else {
      const input = this.getInputKey();
      const v = input.value.trim();
      if (!v) {
        addClass(input, 'input-warn');
        return;
      }
      removeClass(input, 'input-warn');
      void this.root.storage.setEnv(
        JSON.stringify({ env: this.env, key: v }),
      );
    }
    this.parentClose();
  }

  parentClose(): void {
    this.parent.close();
    this.parent.parent.reRenderEntryBtn();
  }

  private restore(): void {
    const { env, key } = this.meta;
    const avatar = this.$el.querySelector(
      `.environment-item-avatar.${env}`,
    ) as HTMLElement | null;
    if (avatar) this.useActiveClass(avatar);
    const input = this.getInputKey();
    if (input && key) input.value = key;
  }

  private getInputKey(): HTMLInputElement {
    return this.$key.querySelector('.env-input') as HTMLInputElement;
  }

  /** 原 bundle 调用了未定义的 genInputKey；在从 QA 切回需代号的环境时补回输入区 */
  private genInputKeyHtml(): string {
    return `<div class="${contentCls('key')}"><input class="env-input" placeholder="独立环境代号"/></div>`;
  }

  private updateInputKey(): void {
    const input = this.getInputKey();
    if (isEnvWithoutBranchKey(this.env)) {
      if (input?.parentElement) {
        this.$el.removeChild(this.$el.querySelector(`.${contentCls('key')}`)!);
      }
    } else if (!input) {
      this.$environments.insertAdjacentHTML('afterend', this.genInputKeyHtml());
      this.$key = this.$el.querySelector(
        `.${contentCls('key')}`,
      ) as HTMLElement;
    }
    this.syncKeyVisibility();
  }
}
