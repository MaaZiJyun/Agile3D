// The menus stay mounted so scene and project controls keep their DOM bindings.
export function setupMenuBar(bar: HTMLElement) {
  const triggers = Array.from(bar.querySelectorAll<HTMLElement>('[data-menu-trigger]'));
  let active: HTMLElement | null = null;
  const panel = (trigger: HTMLElement) => {
    const id = trigger.getAttribute('aria-controls');
    const element = id ? document.getElementById(id) : null;
    if (!element) throw new Error('Missing menu panel');
    return element;
  };
  const items = (trigger: HTMLElement) => Array.from(panel(trigger).querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)'))
    .filter(item => !item.closest('[hidden]'));

  function close(restoreFocus = false) {
    if (!active) return;
    const trigger = active;
    panel(trigger).hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    const addMenu = bar.querySelector<HTMLElement>('#addObjectMenu');
    if (addMenu) addMenu.hidden = true;
    bar.querySelector<HTMLElement>('#addObjectMenuButton')?.setAttribute('aria-expanded', 'false');
    active = null;
    if (restoreFocus) trigger.focus();
  }

  function open(trigger: HTMLElement, focus = false, last = false) {
    close();
    active = trigger;
    panel(trigger).hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    const dropdown = panel(trigger);
    dropdown.style.left = `${Math.max(8, Math.min(trigger.getBoundingClientRect().left, window.innerWidth - dropdown.offsetWidth - 8))}px`;
    if (focus) {
      const choices = items(trigger);
      (last ? choices.at(-1) : choices[0])?.focus();
    }
  }

  function click(event: MouseEvent) {
    const trigger = (event.target as Element).closest<HTMLElement>('[data-menu-trigger]');
    if (trigger) {
      if (active === trigger) close();
      else open(trigger);
      return;
    }
    const item = (event.target as Element).closest<HTMLButtonElement>('button');
    if (!item || !active || !event.composedPath().includes(panel(active))) return;
    if (item.id === 'addObjectMenuButton') {
      if (event.detail === 0) bar.querySelector<HTMLElement>('#addObjectMenu button')?.focus();
      return;
    }
    close(true);
  }

  function pointerOver(event: PointerEvent) {
    if (event.pointerType === 'touch') return;
    const trigger = (event.target as Element).closest<HTMLElement>('[data-menu-trigger]');
    if (active && trigger && active !== trigger) open(trigger);
  }

  function keydown(event: KeyboardEvent) {
    const trigger = (event.target as Element).closest<HTMLElement>('[data-menu-trigger]');
    const current = trigger ?? active;
    if (!current) return;
    if (event.key === 'Tab') return close(true);
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      const addMenu = bar.querySelector<HTMLElement>('#addObjectMenu');
      if (addMenu && !addMenu.hidden) {
        addMenu.hidden = true;
        bar.querySelector<HTMLElement>('#addObjectMenuButton')?.setAttribute('aria-expanded', 'false');
        bar.querySelector<HTMLElement>('#addObjectMenuButton')?.focus();
      } else close(true);
      return;
    }
    if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      const next = triggers[(triggers.indexOf(current) + (event.key === 'ArrowRight' ? 1 : triggers.length - 1)) % triggers.length];
      if (active) open(next, true);
      else next.focus();
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    if (trigger) return open(trigger, true, event.key === 'ArrowUp' || event.key === 'End');
    const choices = items(current);
    const index = choices.findIndex(choice => choice === document.activeElement);
    const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? choices.length - 1
      : (index + (event.key === 'ArrowDown' ? 1 : choices.length - 1)) % choices.length;
    choices[nextIndex]?.focus();
  }

  const outside = (event: PointerEvent) => { if (!bar.contains(event.target as Node)) close(); };
  const focusout = (event: FocusEvent) => { if (!bar.contains(event.relatedTarget as Node | null)) close(); };
  const blur = () => close();
  bar.addEventListener('click', click);
  bar.addEventListener('pointerover', pointerOver);
  bar.addEventListener('keydown', keydown);
  bar.addEventListener('focusout', focusout);
  document.addEventListener('pointerdown', outside);
  window.addEventListener('blur', blur);
  return () => {
    close();
    bar.removeEventListener('click', click);
    bar.removeEventListener('pointerover', pointerOver);
    bar.removeEventListener('keydown', keydown);
    bar.removeEventListener('focusout', focusout);
    document.removeEventListener('pointerdown', outside);
    window.removeEventListener('blur', blur);
  };
}
