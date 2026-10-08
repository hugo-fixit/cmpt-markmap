/**
 * FixIt integration for markmap.
 *
 * - Sync mindmap colors with the FixIt theme (`markmap-dark` on <html>).
 * - Replace the default toolbar: drop brand/dark, use a focus-fit icon, add web fullscreen.
 * - Initialize the resizable split layout on the `markmap` page type.
 */

import type { MarkmapFactory, MarkmapInstance, ToolbarFactory } from './types';

// ─── Constants ───

const SVG_NS = 'http://www.w3.org/2000/svg';

// 24x24 paths, compatible with markmap-toolbar's default icons.
const ICON_FULLSCREEN = 'M4 4h5v2H6v3H4zM16 4v5h-2V6h-3V4zM4 16v-5h2v3h3v2zM16 16h-5v-2h3v-3h2z';
const ICON_FULLSCREEN_EXIT = 'M6.4 5L10 8.6 13.6 5 15 6.4 11.4 10 15 13.6 13.6 15 10 11.4 6.4 15 5 13.6 8.6 10 5 6.4z';

// Focus-style icon (1024x1024): center ring + outer ring with four ticks.
// Toolbar.icon() is 20x20 only, so this is rendered via createFitIcon().
const ICON_FIT_PATHS = [
  'M512 406.53125c-58.16601563 0-105.46875 47.30273438-105.46875 105.46875 0 58.16601563 47.30273438 105.46875 105.46875 105.46875 58.16601563 0 105.46875-47.30273438 105.46875-105.46875C617.46875 453.83398437 570.16601563 406.53125 512 406.53125zM512 564.734375c-29.08300781 0-52.734375-23.65136719-52.734375-52.734375 0-29.08300781 23.65136719-52.734375 52.734375-52.734375 29.08300781 0 52.734375 23.65136719 52.734375 52.734375C564.734375 541.08300781 541.08300781 564.734375 512 564.734375z',
  'M854.7734375 485.6328125l-0.76464844 0C841.11523438 317.35742187 706.64257813 182.88476562 538.3671875 169.99121094L538.3671875 169.2265625c0-14.5546875-11.8125-26.3671875-26.3671875-26.3671875s-26.3671875 11.8125-26.3671875 26.3671875l0 0.76464844C317.35742187 182.88476562 182.88476562 317.35742187 169.99121094 485.6328125L169.2265625 485.6328125c-14.5546875 0-26.3671875 11.8125-26.3671875 26.3671875s11.8125 26.3671875 26.3671875 26.3671875l0.76464844 0C182.88476562 706.64257813 317.35742187 841.11523438 485.6328125 854.00878906L485.6328125 854.7734375c0 14.58105469 11.8125 26.3671875 26.3671875 26.3671875s26.3671875-11.78613281 26.3671875-26.3671875l0-0.76464844C706.64257813 841.11523438 841.11523438 706.64257813 854.00878906 538.3671875L854.7734375 538.3671875c14.58105469 0 26.3671875-11.8125 26.3671875-26.3671875S869.35449219 485.6328125 854.7734375 485.6328125zM538.3671875 801.27441406L538.3671875 749.3046875c0-14.58105469-11.8125-26.3671875-26.3671875-26.3671875s-26.3671875 11.78613281-26.3671875 26.3671875l0 51.96972656C346.4140625 788.67089844 235.32910156 677.55957031 222.72558594 538.3671875L274.6953125 538.3671875c14.5546875 0 26.3671875-11.8125 26.3671875-26.3671875s-11.8125-26.3671875-26.3671875-26.3671875L222.72558594 485.6328125C235.32910156 346.4140625 346.4140625 235.32910156 485.6328125 222.72558594L485.6328125 274.6953125c0 14.5546875 11.8125 26.3671875 26.3671875 26.3671875s26.3671875-11.8125 26.3671875-26.3671875L538.3671875 222.72558594C677.55957031 235.32910156 788.67089844 346.4140625 801.27441406 485.6328125L749.3046875 485.6328125c-14.58105469 0-26.3671875 11.8125-26.3671875 26.3671875s11.78613281 26.3671875 26.3671875 26.3671875l51.96972656 0C788.67089844 677.55957031 677.55957031 788.67089844 538.3671875 801.27441406z',
];

// ─── Small helpers ───

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Resolve the SVG element from a markmap instance.
 * `mm.svg` may be a d3 selection (with `.node()`) or a raw SVG node.
 */
const getSvgElement = (mm: MarkmapInstance | null | undefined): SVGElement | null => {
  const svgLike = (mm as { svg?: unknown } | null | undefined)?.svg as unknown;
  if (!svgLike) return null;
  const svgNode = (svgLike as { node?: unknown } | null | undefined)?.node;
  const el =
    typeof svgNode === 'function'
      ? (svgNode as (this: unknown) => unknown).call(svgLike)
      : svgLike;
  return el instanceof SVGElement ? el : null;
};

/** Resolve the `.markmap` wrapper that owns a markmap instance. */
const getMarkmapContainer = (mm: MarkmapInstance | null | undefined): Element | null => {
  const svg = getSvgElement(mm);
  return (
    svg?.closest?.('.markmap') ||
    svg?.parentElement?.closest?.('.markmap') ||
    svg?.parentElement ||
    svg ||
    null
  );
};

/**
 * Build the "fit window size" toolbar icon (focus ring).
 * The 1024 artwork already has built-in padding matching Toolbar.icon() glyphs.
 */
const createFitIcon = (): SVGElement => {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', '20');
  svg.setAttribute('height', '20');
  svg.setAttribute('viewBox', '0 0 1024 1024');
  ICON_FIT_PATHS.forEach((d) => {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'currentColor');
    path.setAttribute('fill-rule', 'evenodd');
    svg.appendChild(path);
  });
  return svg;
};

/** Fit the mindmap inside its `.markmap` container. */
const fitMarkmap = (root: ParentNode) => {
  const el = root.querySelector<HTMLElement>('.markmap');
  const mm = el?.__markmap || el?.querySelector<SVGElement>('svg')?.__markmap;
  if (mm?.fit) mm.fit();
};

// ─── Theme sync ───

/** Toggle `markmap-dark` on <html> so markmap-view switches its palette. */
const applyMarkmapTheme = (isDark: boolean) => {
  document.documentElement.classList.toggle('markmap-dark', isDark);
};

/** Apply the current FixIt theme and follow later `fixit:switch-theme` events. */
const initMarkmapTheme = () => {
  const fixit = window.fixit;
  if (!fixit) return;
  applyMarkmapTheme(!!fixit.isDark);
  fixit.eventBus?.on('fixit:switch-theme', ({ detail }) => {
    if (detail.isChanged) applyMarkmapTheme(detail.isDark);
  });
};

// ─── markmap patches ───

/** Attach `__markmap` to the wrapper/SVG so split layout can call `fit()`. */
const patchMarkmapCreate = (Markmap: MarkmapFactory) => {
  if (Markmap.__fixitMarkmapCreatePatched) return;
  Markmap.__fixitMarkmapCreatePatched = true;
  const originalCreate = Markmap.create;
  Markmap.create = (...args: any[]) => {
    const mm = originalCreate(...args);
    try {
      const container = getMarkmapContainer(mm);
      const svg = getSvgElement(mm);
      if (container) container.__markmap = mm;
      if (svg) svg.__markmap = mm;
    } catch (_) {}
    return mm;
  };
};

/**
 * Customize the markmap toolbar:
 * - hide brand and the built-in dark toggle (FixIt theme handles dark mode)
 * - replace the fit icon with a focus ring
 * - add web fullscreen (`.is-fullscreen`), with Esc to exit
 */
const patchToolbarCreate = (Toolbar: ToolbarFactory) => {
  if (Toolbar.__fixitMarkmapToolbarPatched) return;
  Toolbar.__fixitMarkmapToolbarPatched = true;

  const create = Toolbar.create;
  Toolbar.create = (mm: MarkmapInstance) => {
    const tb = create(mm);
    const container = getMarkmapContainer(mm);
    tb.setBrand(false);
    tb.setItems(tb.items.filter((i: string) => i !== 'dark' && i !== 'fullscreen' && i !== 'fullscreen-exit'));

    tb.register({
      id: 'fit',
      title: 'Fit window size',
      content: createFitIcon(),
      onClick: () => mm.fit?.(),
    });

    const isFullscreen = () =>
      !!container && container.classList.contains('is-fullscreen');

    // Swap the fullscreen / fullscreen-exit item so only one is visible.
    const setFullscreenButton = () => {
      if (!container) return;
      const shouldShowExit = isFullscreen();
      const desired = shouldShowExit ? 'fullscreen-exit' : 'fullscreen';
      const other = shouldShowExit ? 'fullscreen' : 'fullscreen-exit';
      const nextItems = tb.items.map((i: string) => (i === other ? desired : i));
      if (!nextItems.includes(desired)) nextItems.push(desired);
      tb.setItems(nextItems.filter((i: string, idx: number) => nextItems.indexOf(i) === idx));
    };

    const setFullscreen = (show: boolean) => {
      if (!container || isFullscreen() === show) return;
      container.classList.toggle('is-fullscreen', show);
      document.body.style.overflow = show ? 'hidden' : '';
      document.body.style.touchAction = show ? 'none' : '';
      mm.fit?.();
      setFullscreenButton();
    };

    tb.register({
      id: 'fullscreen',
      title: 'Fullscreen',
      content: Toolbar.icon(ICON_FULLSCREEN),
      onClick: () => setFullscreen(true),
    });
    tb.register({
      id: 'fullscreen-exit',
      title: 'Exit Fullscreen',
      content: Toolbar.icon(ICON_FULLSCREEN_EXIT),
      onClick: () => setFullscreen(false),
    });
    if (container) {
      container.__fixitMarkmapExitFullscreen = () => setFullscreen(false);
    }
    setFullscreenButton();
    return tb;
  };

  // Esc exits any web-fullscreen markmap.
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll<HTMLElement>('.markmap.is-fullscreen').forEach((el) => {
      el.__fixitMarkmapExitFullscreen?.();
    });
  });
};

// ─── Split layout (markmap page) ───

/**
 * Make the content/map panes of `[data-markmap-split]` resizable.
 * Width ratio is persisted per path and restored on load.
 */
const initSplit = (split: HTMLElement) => {
  if (!split || split.__fixitSplitInited) return;
  split.__fixitSplitInited = true;

  const divider = split.querySelector<HTMLElement>('.markmap-divider');
  const mapPane = split.querySelector<HTMLElement>('.markmap-pane--map');
  if (!divider || !mapPane) return;

  const storageKey = `fixit-markmap-split:${location.pathname}`;
  const applyRatio = () => {
    const ratio = Number(localStorage.getItem(storageKey));
    if (!Number.isFinite(ratio) || ratio <= 0 || ratio >= 1) return;
    const rect = split.getBoundingClientRect();
    const dividerRect = divider.getBoundingClientRect();
    const width = clamp(rect.width * ratio, 320, rect.width - dividerRect.width - 320);
    split.style.setProperty('--markmap-pane-width', `${Math.round(width)}px`);
    fitMarkmap(split);
  };

  const mediaQuery = window.matchMedia('(max-width: 960px)');
  if (!mediaQuery.matches) applyRatio();

  const setWidthFromClientX = (clientX: number) => {
    const rect = split.getBoundingClientRect();
    const dividerRect = divider.getBoundingClientRect();
    const contentWidth = clamp(clientX - rect.left, 320, rect.width - dividerRect.width - 320);
    const mapWidth = rect.width - dividerRect.width - contentWidth;
    split.style.setProperty('--markmap-pane-width', `${Math.round(mapWidth)}px`);
    fitMarkmap(split);
  };

  const persistRatio = () => {
    const rect = split.getBoundingClientRect();
    const dividerRect = divider.getBoundingClientRect();
    const mapRect = mapPane.getBoundingClientRect();
    const mapWidth = clamp(mapRect.width, 320, rect.width - dividerRect.width - 320);
    const ratio = mapWidth / rect.width;
    localStorage.setItem(storageKey, String(ratio));
  };

  let dragging = false;
  let originalCursor = '';
  let originalUserSelect = '';

  const stopDragging = () => {
    if (!dragging) return;
    dragging = false;
    divider.classList.remove('is-dragging');
    document.body.style.cursor = originalCursor;
    document.body.style.userSelect = originalUserSelect;
    persistRatio();
  };

  divider.addEventListener('pointerdown', (e: PointerEvent) => {
    if (mediaQuery.matches) return;
    dragging = true;
    divider.classList.add('is-dragging');
    originalCursor = document.body.style.cursor;
    originalUserSelect = document.body.style.userSelect;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    divider.setPointerCapture(e.pointerId);
    setWidthFromClientX(e.clientX);
  });

  divider.addEventListener('pointermove', (e: PointerEvent) => {
    if (!dragging) return;
    setWidthFromClientX(e.clientX);
  });

  divider.addEventListener('pointerup', () => stopDragging());
  divider.addEventListener('pointercancel', () => stopDragging());
  divider.addEventListener('lostpointercapture', () => stopDragging());

  // Keyboard resize: ← widens the map pane, → narrows it.
  divider.addEventListener('keydown', (e: KeyboardEvent) => {
    if (mediaQuery.matches) return;
    const rect = split.getBoundingClientRect();
    const dividerWidth = divider.getBoundingClientRect().width;
    const maxMapWidth = rect.width - dividerWidth - 320;
    const step = Math.max(12, Math.round(rect.width * 0.02));
    const computed = getComputedStyle(split).getPropertyValue('--markmap-pane-width').trim();
    const current = computed.endsWith('px') ? Number(computed.slice(0, -2)) : mapPane.getBoundingClientRect().width;
    if (!Number.isFinite(current)) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      split.style.setProperty('--markmap-pane-width', `${clamp(current + step, 320, maxMapWidth)}px`);
      persistRatio();
      fitMarkmap(split);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      split.style.setProperty('--markmap-pane-width', `${clamp(current - step, 320, maxMapWidth)}px`);
      persistRatio();
      fitMarkmap(split);
    }
  });

  window.addEventListener('resize', () => {
    if (mediaQuery.matches) return;
    applyRatio();
  });
};

// ─── Entry: configure markmap-autoloader ───

const markmap = (window.markmap = window.markmap || {});
const autoLoader = (markmap.autoLoader = markmap.autoLoader || {});
markmap.autoLoader = Object.assign({}, autoLoader, {
  provider: autoLoader.provider ?? 'unpkg',
  toolbar: true,
  onReady: () => {
    initMarkmapTheme();
    if (markmap.Markmap) patchMarkmapCreate(markmap.Markmap);
    if (markmap.Toolbar) patchToolbarCreate(markmap.Toolbar);
    document.querySelectorAll<HTMLElement>('[data-markmap-split]').forEach(initSplit);
  },
});
