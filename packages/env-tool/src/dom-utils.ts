export function bem(block: string) {
  return (element?: string) =>
    element ? `${block}-${element}` : block;
}

export function hasClass(el: Element, name: string): boolean {
  return el.classList.contains(name);
}

export function addClass(el: Element, name: string): void {
  if (!hasClass(el, name)) el.classList.add(name);
}

export function removeClass(el: Element, name: string): void {
  if (hasClass(el, name)) el.classList.remove(name);
}

export function replaceClass(
  el: Element,
  oldName: string,
  newName: string,
): void {
  if (hasClass(el, oldName)) el.classList.replace(oldName, newName);
}

export function closestClass(el: EventTarget | null, className: string): boolean {
  return el instanceof Element && hasClass(el, className);
}
