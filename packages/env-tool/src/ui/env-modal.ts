import { bem, addClass, removeClass, replaceClass } from '../dom-utils.js';
import type { EnvTool } from '../env-tool.js';
import { EnvModalContent } from './env-modal-content.js';

const modalCls = bem('env-modal');

export class EnvMainModal {
  parent: EnvTool;
  $mask!: HTMLDivElement;
  $modal!: HTMLElement;
  $closeBtn!: HTMLElement;
  modalContent!: EnvModalContent;

  constructor(parent: EnvTool) {
    this.parent = parent;
    this.mask();
    this.modal();
    this.bind();
    this.content();
  }

  private mask(): void {
    const n = document.createElement('div');
    n.className = 'env-mask';
    this.$mask = n;
  }

  private modal(): void {
    this.$mask.insertAdjacentHTML(
      'beforeend',
      `
        <div class="${modalCls()}">
          <div class="${modalCls('close')}">
            <span class="${modalCls('close-item')} item-left"></span>
            <span class="${modalCls('close-item')} item-right"></span>
          </div>
        </div>
      `,
    );
    this.$modal = this.$mask.querySelector(`.${modalCls()}`) as HTMLElement;
    this.$closeBtn = this.$mask.querySelector(
      `.${modalCls('close')}`,
    ) as HTMLElement;
  }

  private content(): void {
    this.modalContent = new EnvModalContent(this);
    this.$modal.insertBefore(this.modalContent.$el, this.$closeBtn);
  }

  private bind(
    evName: keyof HTMLElementEventMap = 'click',
    handler: (e: Event) => void = () => {
      this.close();
    },
  ): void {
    this.$closeBtn.addEventListener(evName, handler);
  }

  open(): void {
    this.showMask();
    this.showModal();
  }

  private showMask(): void {
    addClass(this.$mask, 'mask-open');
  }

  private closeMask(): void {
    replaceClass(this.$mask, 'mask-open', 'mask-close');
    removeClass(this.$mask, 'mask-close');
  }

  private showModal(): void {
    addClass(this.$modal, 'modal-open');
  }

  private closeModal(): void {
    replaceClass(this.$modal, 'modal-open', 'modal-close');
    removeClass(this.$modal, 'modal-close');
  }

  close(): void {
    this.closeMask();
    this.closeModal();
    this.parent.closeMainModal();
  }
}
