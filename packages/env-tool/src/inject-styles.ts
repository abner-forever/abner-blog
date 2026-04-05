import entryCss from './styles/entry.css';
import modalContentCss from './styles/modal-content.css';
import maskCss from './styles/mask.css';

let injected = false;

export function injectEnvToolStyles(): void {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const el = document.createElement('style');
  el.setAttribute('data-abner-env-tool', '1');
  el.textContent = `${entryCss}\n${modalContentCss}\n${maskCss}`;
  document.head.appendChild(el);
}
