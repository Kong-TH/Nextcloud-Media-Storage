/**
 * Ambient JSX typings for the Material Web custom elements the rail uses.
 *
 * Put this where TypeScript picks up ambient declarations — `src/types/` is a
 * common choice. It is app-wide, not component-local, which is why it is its own
 * file. Skip it entirely if the project already wraps Material Web in typed React
 * components; those wrappers carry the types and this would duplicate them.
 *
 * Keep it as a `.d.ts`. Augmenting JSX needs a `namespace`, and
 * `@typescript-eslint/no-namespace` — on by default in Next.js's stock config —
 * fails the build over that in a `.ts`/`.tsx` file while leaving `.d.ts` alone.
 * If your config does flag it here, add
 * `/* eslint-disable @typescript-eslint/no-namespace *\/` at the top.
 *
 * Attribute names are **kebab-case**: React passes unknown props through
 * verbatim, so `activeIndex` becomes a literal `activeIndex` attribute that the
 * element silently ignores. Write `active-index`.
 */

import type { DetailedHTMLProps, HTMLAttributes } from 'react';

type El<Extra = object> = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & Extra;

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'md-icon': El;
      'md-ripple': El;
      'md-fab': El<{ size?: 'small' | 'medium' | 'large'; variant?: string; label?: string }>;
      'md-icon-button': El<{ href?: string; toggle?: boolean; selected?: boolean }>;
      'md-divider': El<{ inset?: boolean }>;
      /** labs — the compact-window navigation bar. */
      'md-navigation-bar': El<{
        'active-index'?: string;
        'hide-inactive-labels'?: boolean;
      }>;
      /** labs — one bar item. Swaps active-icon / inactive-icon itself. */
      'md-navigation-tab': El<{
        label?: string;
        active?: string;
        'hide-inactive-label'?: boolean;
        'badge-value'?: string;
        'show-badge'?: string;
      }>;
    }
  }
}
