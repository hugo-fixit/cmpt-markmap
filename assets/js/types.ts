/** Shared types for the cmpt-markmap FixIt integration. */

// ─── markmap (loaded from CDN via markmap-autoloader) ───

export type MarkmapInstance = {
  svg?: unknown;
  fit?: () => void;
};

export type MarkmapFactory = {
  create: (...args: any[]) => MarkmapInstance;
  __fixitMarkmapCreatePatched?: boolean;
};

export type ToolbarItem = {
  id: string;
  title: string;
  content: unknown;
  onClick: () => void;
};

export type ToolbarInstance = {
  items: string[];
  setBrand: (value: boolean) => void;
  setItems: (items: string[]) => void;
  register: (item: ToolbarItem) => void;
};

export type ToolbarFactory = {
  create: (mm: MarkmapInstance) => ToolbarInstance;
  icon: (path: string) => unknown;
  __fixitMarkmapToolbarPatched?: boolean;
};

export type MarkmapAutoLoader = {
  toolbar?: boolean;
  onReady?: () => void;
  provider?: string | ((path: string) => string);
};

export type MarkmapNamespace = {
  autoLoader?: MarkmapAutoLoader;
  Markmap?: MarkmapFactory;
  Toolbar?: ToolbarFactory;
};

// ─── FixIt theme public API (subset used here) ───

export type FixIt = {
  isDark?: boolean;
  eventBus?: {
    on: (
      event: 'fixit:switch-theme',
      handler: (e: { detail: { isDark: boolean; mode: string; isChanged: boolean } }) => void,
    ) => void;
  };
};

// ─── DOM augmentation ───

declare global {
  interface Window {
    markmap?: MarkmapNamespace;
    fixit?: FixIt;
  }

  interface Element {
    /** Markmap instance bound to this wrapper/SVG, used to call `fit()`. */
    __markmap?: MarkmapInstance;
    /** Exit web-fullscreen for this markmap container. */
    __fixitMarkmapExitFullscreen?: () => void;
  }

  interface HTMLElement {
    __fixitSplitInited?: boolean;
  }
}

export {};
