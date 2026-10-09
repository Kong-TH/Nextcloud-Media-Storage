/**
 * Ambient JSX typings for the Material Web custom elements this drawer uses.
 *
 * Put this anywhere TypeScript picks up ambient declarations — `src/types/` is a
 * common choice. It is app-wide, not component-local, which is why it is a
 * separate file rather than living inside the component.
 *
 * You may not need it at all: if the project already wraps Material Web elements
 * in typed React components (a `components/md/index.tsx` that exports
 * `MdListItem` and friends), those wrappers carry the types and this file would
 * duplicate them.
 *
 * Two things worth knowing:
 *
 * - React 19 passes unknown props on a custom element straight through as
 *   attributes, so these declarations only satisfy the compiler; they do not
 *   change runtime behaviour.
 * - Attribute names are **kebab-case**. React writes `supportingText` as a
 *   literal `supportingText` attribute, which the element silently ignores —
 *   the prop appears to do nothing and there is no warning.
 *
 * Keep these declarations in a `.d.ts`, not inside a component. Augmenting JSX
 * requires a `namespace`, and `@typescript-eslint/no-namespace` — on by default
 * in Next.js's stock config — fails the build over it in a `.ts`/`.tsx` file
 * while leaving `.d.ts` alone. If your config does flag it here, add
 * `/* eslint-disable @typescript-eslint/no-namespace *\/` at the top.
 */

import type { DetailedHTMLProps, HTMLAttributes } from 'react';

type El<Extra = object> = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & Extra;

/** `opened` and `pivot` are the labs drawer's only two properties. */
type DrawerEl = El<{ opened?: string; pivot?: 'start' | 'end' }>;

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'md-navigation-drawer': DrawerEl;
      'md-navigation-drawer-modal': DrawerEl;
      'md-list': El;
      'md-list-item': El<{
        /** 'link' renders a real <a>, which brings keyboard and middle-click for free. */
        type?: 'text' | 'button' | 'link';
        href?: string;
        target?: '_blank' | '_parent' | '_self' | '_top' | '';
        disabled?: boolean;
      }>;
      'md-divider': El;
      'md-icon': El;
    }
  }
}
