type MarkmapInstance = {
  svg?: unknown;
  fit?: () => void;
};

type MarkmapFactory = {
  create: (...args: any[]) => MarkmapInstance;
  __fixitMarkmapCreatePatched?: boolean;
};

type ToolbarItem = {
  id: string;
  title: string;
  content: unknown;
  onClick: () => void;
};

type ToolbarInstance = {
  items: string[];
  setBrand: (value: boolean) => void;
  setItems: (items: string[]) => void;
  register: (item: ToolbarItem) => void;
};

type ToolbarFactory = {
  create: (mm: MarkmapInstance) => ToolbarInstance;
  icon: (path: string) => unknown;
  __fixitMarkmapToolbarPatched?: boolean;
};

type FixIt = {
  isDark?: boolean;
  switchThemeEventSet?: {
    add: (listener: (isDark: boolean) => void) => void;
  };
};

type MarkmapAutoLoader = {
  toolbar?: boolean;
  onReady?: () => void;
  provider?: string | ((path: string) => string);
};

type MarkmapNamespace = {
  autoLoader?: MarkmapAutoLoader;
  Markmap?: MarkmapFactory;
  Toolbar?: ToolbarFactory;
};

interface Window {
  markmap?: MarkmapNamespace;
  fixit?: FixIt;
}

interface DocumentEventMap {
  webkitfullscreenchange: Event;
}

interface Element {
  __markmap?: MarkmapInstance;
}

interface HTMLElement {
  __fixitSplitInited?: boolean;
}

(() => {
  const markmap = (window.markmap = window.markmap || {});
  const autoLoader = (markmap.autoLoader = markmap.autoLoader || {});
  markmap.autoLoader = Object.assign({}, autoLoader, {
    provider: autoLoader.provider ?? 'unpkg',
    toolbar: true,
    onReady: () => {
      const fixit = window.fixit;
      if (fixit) {
        document.documentElement.classList.toggle('markmap-dark', !!fixit.isDark);
        fixit.switchThemeEventSet && fixit.switchThemeEventSet.add((isDark: boolean) => {
          document.documentElement.classList.toggle('markmap-dark', isDark);
        });
      }

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

      const Markmap = markmap.Markmap;
      if (Markmap && !Markmap.__fixitMarkmapCreatePatched) {
        Markmap.__fixitMarkmapCreatePatched = true;
        const originalCreate = Markmap.create;
        Markmap.create = (...args: any[]) => {
          const mm = originalCreate(...args);
          try {
            const svg = getSvgElement(mm);
            const container =
              svg?.closest?.('.markmap') ||
              svg?.parentElement?.closest?.('.markmap');
            if (container) container.__markmap = mm;
            if (svg) svg.__markmap = mm;
          } catch (_) {}
          return mm;
        };
      }

      const Toolbar = markmap.Toolbar;
      if (Toolbar && !Toolbar.__fixitMarkmapToolbarPatched) {
        Toolbar.__fixitMarkmapToolbarPatched = true;

        const ICON_FULLSCREEN = 'M4 4h5v2H6v3H4zM16 4v5h-2V6h-3V4zM4 16v-5h2v3h3v2zM16 16h-5v-2h3v-3h2z';
        const ICON_FULLSCREEN_EXIT = 'M6.4 5L10 8.6 13.6 5 15 6.4 11.4 10 15 13.6 13.6 15 10 11.4 6.4 15 5 13.6 8.6 10 5 6.4z';

        const create = Toolbar.create;
        Toolbar.create = (mm: MarkmapInstance) => {
          const tb = create(mm);
          const svg = getSvgElement(mm);
          const container =
            svg?.closest?.('.markmap') ||
            svg?.parentElement?.closest?.('.markmap') ||
            svg?.parentElement ||
            svg ||
            null;
          tb.setBrand(false);
          tb.setItems(tb.items.filter((i: string) => i !== 'dark' && i !== 'fullscreen' && i !== 'fullscreen-exit'));

          const getFullscreenState = () =>
            !!container && (container.classList.contains('is-fullscreen') || document.fullscreenElement === container);

          const setFullscreenButton = () => {
            if (!container) return;
            const shouldShowExit = getFullscreenState();
            const desired = shouldShowExit ? 'fullscreen-exit' : 'fullscreen';
            const other = shouldShowExit ? 'fullscreen' : 'fullscreen-exit';
            const nextItems = tb.items.map((i: string) => (i === other ? desired : i));
            if (!nextItems.includes(desired)) nextItems.push(desired);
            tb.setItems(nextItems.filter((i: string, idx: number) => nextItems.indexOf(i) === idx));
          };

          const toggleFullscreen = () => {
            if (!container) return;

            const exit = () => {
              if (container.classList.contains('is-fullscreen')) {
                container.classList.remove('is-fullscreen');
                document.body.style.overflow = '';
                document.body.style.touchAction = '';
              } else if (document.fullscreenElement === container) {
                if (typeof document.exitFullscreen === 'function') {
                  const p = document.exitFullscreen();
                  if (p && typeof (p as Promise<void>).catch === 'function') {
                    (p as Promise<void>).catch(() => {
                      container.classList.remove('is-fullscreen');
                      document.body.style.overflow = '';
                      document.body.style.touchAction = '';
                    });
                  }
                } else {
                  container.classList.remove('is-fullscreen');
                  document.body.style.overflow = '';
                  document.body.style.touchAction = '';
                }
              }
            };

            if (getFullscreenState()) {
              exit();
              setFullscreenButton();
              return;
            }

            if (document.fullscreenEnabled && container.requestFullscreen) {
              const p = container.requestFullscreen();
              if (p && typeof (p as Promise<void>).catch === 'function') {
                (p as Promise<void>).catch(() => {
                  container.classList.add('is-fullscreen');
                  document.body.style.overflow = 'hidden';
                  document.body.style.touchAction = 'none';
                  setFullscreenButton();
                });
              }
              return;
            }

            container.classList.add('is-fullscreen');
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none';
            setFullscreenButton();
          };

          tb.register({
            id: 'fullscreen',
            title: 'Fullscreen',
            content: Toolbar.icon(ICON_FULLSCREEN),
            onClick: toggleFullscreen,
          });
          tb.register({
            id: 'fullscreen-exit',
            title: 'Exit Fullscreen',
            content: Toolbar.icon(ICON_FULLSCREEN_EXIT),
            onClick: toggleFullscreen,
          });
          if (container) {
            document.addEventListener('fullscreenchange', setFullscreenButton, false);
            document.addEventListener('webkitfullscreenchange', setFullscreenButton, false);
          }
          setFullscreenButton();
          return tb;
        };
      }

      const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

      const fitMarkmap = (root: ParentNode) => {
        const el = root.querySelector<HTMLElement>('.markmap');
        const mm = el?.__markmap || el?.querySelector<SVGElement>('svg')?.__markmap;
        if (mm?.fit) mm.fit();
      };

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

      document.querySelectorAll<HTMLElement>('[data-markmap-split]').forEach(initSplit);
    },
  });
})();
