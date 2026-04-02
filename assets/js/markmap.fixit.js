(() => {
  window.markmap = window.markmap || {};
  window.markmap.autoLoader = Object.assign({}, window.markmap.autoLoader, {
    toolbar: true,
    onReady: () => {
      const fixit = window.fixit;
      if (fixit) {
        document.documentElement.classList.toggle('markmap-dark', !!fixit.isDark);
        fixit.switchThemeEventSet && fixit.switchThemeEventSet.add((isDark) => {
          document.documentElement.classList.toggle('markmap-dark', isDark);
        });
      }

      const Markmap = window.markmap?.Markmap;
      if (Markmap && !Markmap.__fixitMarkmapCreatePatched) {
        Markmap.__fixitMarkmapCreatePatched = true;
        const originalCreate = Markmap.create;
        Markmap.create = (...args) => {
          const mm = originalCreate(...args);
          try {
            const svg = mm?.svg;
            const container =
              svg?.closest?.('.markmap') ||
              svg?.parentElement?.closest?.('.markmap');
            if (container) container.__markmap = mm;
            if (svg) svg.__markmap = mm;
          } catch (_) {}
          return mm;
        };
      }

      const Toolbar = window.markmap?.Toolbar;
      if (Toolbar && !Toolbar.__fixitMarkmapToolbarPatched) {
        Toolbar.__fixitMarkmapToolbarPatched = true;

        const ICON_FULLSCREEN = 'M4 4h5v2H6v3H4zM16 4v5h-2V6h-3V4zM4 16v-5h2v3h3v2zM16 16h-5v-2h3v-3h2z';
        const ICON_FULLSCREEN_EXIT = 'M6.4 5L10 8.6 13.6 5 15 6.4 11.4 10 15 13.6 13.6 15 10 11.4 6.4 15 5 13.6 8.6 10 5 6.4z';

        const create = Toolbar.create;
        Toolbar.create = (mm) => {
          const tb = create(mm);
          const svg =
            mm?.svg?.node?.() ||
            mm?.svg ||
            null;
          const container =
            svg?.closest?.('.markmap') ||
            svg?.parentElement?.closest?.('.markmap') ||
            svg?.parentElement ||
            svg ||
            null;
          tb.setBrand(false);
          tb.setItems(tb.items.filter((i) => i !== 'dark' && i !== 'fullscreen' && i !== 'fullscreen-exit'));

          const getFullscreenState = () =>
            !!container && (container.classList.contains('is-fullscreen') || document.fullscreenElement === container);

          const setFullscreenButton = () => {
            if (!container) return;
            const shouldShowExit = getFullscreenState();
            const desired = shouldShowExit ? 'fullscreen-exit' : 'fullscreen';
            const other = shouldShowExit ? 'fullscreen' : 'fullscreen-exit';
            const nextItems = tb.items.map((i) => (i === other ? desired : i));
            if (!nextItems.includes(desired)) nextItems.push(desired);
            tb.setItems(nextItems.filter((i, idx) => nextItems.indexOf(i) === idx));
          };

          const toggleFullscreen = () => {
            if (!container) return;

            const exit = () => {
              if (container.classList.contains('is-fullscreen')) {
                container.classList.remove('is-fullscreen');
                document.body.style.overflow = '';
                document.body.style.touchAction = '';
              } else if (document.fullscreenElement === container) {
                document.exitFullscreen();
              }
            };

            if (getFullscreenState()) {
              exit();
              setFullscreenButton();
              return;
            }

            if (document.fullscreenEnabled && container.requestFullscreen) {
              container.requestFullscreen();
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

      const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

      const fitMarkmap = (root) => {
        const el = root?.querySelector?.('.markmap');
        const mm = el?.__markmap || el?.querySelector?.('svg')?.__markmap;
        if (mm?.fit) mm.fit();
      };

      const initSplit = (split) => {
        if (!split || split.__fixitSplitInited) return;
        split.__fixitSplitInited = true;

        const divider = split.querySelector('.markmap-divider');
        const mapPane = split.querySelector('.markmap-pane--map');
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

        const setWidthFromClientX = (clientX) => {
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

        divider.addEventListener('pointerdown', (e) => {
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

        divider.addEventListener('pointermove', (e) => {
          if (!dragging) return;
          setWidthFromClientX(e.clientX);
        });

        divider.addEventListener('pointerup', () => stopDragging());
        divider.addEventListener('pointercancel', () => stopDragging());
        divider.addEventListener('lostpointercapture', () => stopDragging());

        divider.addEventListener('keydown', (e) => {
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

      document.querySelectorAll('[data-markmap-split]').forEach(initSplit);
    },
  });
})();
