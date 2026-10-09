'use client';

/**
 * MD3 navigation drawer for React / Next.js, built on @material/web.
 *
 * Pairs with navigation-drawer.css in this directory — the CSS carries every
 * spec measurement, this file carries the behaviour the spec assumes but the
 * web platform does not give you: which variant the window gets, focus
 * management for the modal, and the ARIA that makes the active destination
 * announceable.
 *
 * Two things to know before editing:
 *
 * 1. `labs/` is the unstable shelf. These two imports are not re-exported from
 *    `all.js` and are undocumented upstream, which is why material.io lists the
 *    drawer's web status as "Unavailable". They work; they may change between
 *    releases. If that is unacceptable, delete the two imports and render
 *    `<aside className="md3-drawer">` / `.md3-drawer-modal` instead — the CSS
 *    supports both and nothing else here changes.
 *
 * 2. Custom elements do not server-render. This module is `'use client'` so the
 *    `customElements.define()` calls happen in the browser, and the CSS reserves
 *    the sheet's width via `:not(:defined)` so the upgrade is not a visible jump.
 */

import { useCallback, useEffect, useId, useRef } from 'react';
import '@material/web/labs/navigationdrawer/navigation-drawer.js';
import '@material/web/labs/navigationdrawer/navigation-drawer-modal.js';
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';
import '@material/web/divider/divider.js';
import '@material/web/icon/icon.js';

export type Destination = {
  href: string;
  label: string;
  /** Material Symbols name. Give every destination one, or give none of them one. */
  icon?: string;
  /**
   * Use when the visible label only makes sense next to surrounding UI — M3's
   * own example is "Recents" beside a photo grid, which should read
   * "Recent images" to a screen reader.
   */
  ariaLabel?: string;
};

/** A run of destinations under an optional subhead. Groups get dividers; items never do. */
export type Group = {
  sectionLabel?: string;
  items: Destination[];
};

type Props = {
  groups: Group[];
  /** Current path. Compared with `href` to pick the active destination. */
  currentPath: string;
  /** Shown at the top of the sheet. */
  headline?: string;
  /** Distinguishes this nav landmark from others on the page. */
  navLabel?: string;
  /** Modal only: whether it is open. */
  open?: boolean;
  onClose?: () => void;
  /**
   * 'standard' participates in layout and is not a dialog.
   * 'modal' floats over content behind a scrim and IS a dialog.
   */
  variant?: 'standard' | 'modal';
};

export function NavigationDrawer({
  groups,
  currentPath,
  headline,
  navLabel = 'Main',
  open = true,
  onClose,
  variant = 'standard',
}: Props) {
  const sheetRef = useRef<HTMLElement>(null);
  const restoreFocusTo = useRef<Element | null>(null);
  const headlineId = useId();
  const isModal = variant === 'modal';

  /**
   * Focus management, modal only.
   *
   * The labs modal handles Esc and the scrim click but does not trap focus.
   * Without a trap, Tab walks straight out of the "modal" into the content
   * behind the scrim — which the user cannot see. A standard drawer gets none of
   * this on purpose: it is a sidebar, not a dialog, and telling assistive tech
   * otherwise would claim the rest of the page is unavailable when it is not.
   */
  useEffect(() => {
    if (!isModal || !open) return;
    const sheet = sheetRef.current;
    if (!sheet) return;

    restoreFocusTo.current = document.activeElement;

    // M3: initial focus lands on the first destination, since that is the first
    // interactive element of the component.
    const focusables = () =>
      Array.from(
        sheet.querySelectorAll<HTMLElement>('md-list-item:not([disabled])')
      );
    focusables()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose?.();
        return;
      }
      if (event.key !== 'Tab') return;

      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      // Wrap at both ends so focus cannot leave the dialog.
      if (event.shiftKey && (active === first || !sheet.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      // Returning focus matters: without it a keyboard user is stranded at the
      // top of the document with no idea where they were.
      (restoreFocusTo.current as HTMLElement | null)?.focus?.();
    };
  }, [isModal, open, onClose]);

  // The labs component reports its own state; keep React in step when the user
  // dismisses via the scrim rather than our own handler.
  const handleChanged = useCallback(
    (event: Event) => {
      const detail = (event as CustomEvent<{ opened: boolean }>).detail;
      if (detail && !detail.opened) onClose?.();
    },
    [onClose]
  );

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet || !isModal) return;
    sheet.addEventListener('navigation-drawer-changed', handleChanged);
    return () => sheet.removeEventListener('navigation-drawer-changed', handleChanged);
  }, [isModal, handleChanged]);

  const content = (
    <div className="md3-drawer-content">
      {headline && (
        <h2 className="md3-drawer-headline" id={headlineId}>
          {headline}
        </h2>
      )}

      <nav aria-label={navLabel}>
        {groups.map((group, groupIndex) => (
          <div key={group.sectionLabel ?? groupIndex}>
            {/* Dividers separate GROUPS, never individual destinations. */}
            {groupIndex > 0 && <md-divider role="separator" />}

            {group.sectionLabel && (
              <h3 className="md3-drawer-section-label">{group.sectionLabel}</h3>
            )}

            <md-list>
              {group.items.map((item) => {
                const active = item.href === currentPath;
                return (
                  <md-list-item
                    key={item.href}
                    type="link"
                    href={item.href}
                    /* data-active drives the indicator; aria-current is what a
                       screen reader announces. Neither implies the other. */
                    {...(active ? { 'data-active': '', 'aria-current': 'page' } : {})}
                    {...(item.ariaLabel ? { 'aria-label': item.ariaLabel } : {})}
                  >
                    {item.icon && <md-icon slot="start">{item.icon}</md-icon>}
                    {/* slot="headline", not a bare text child — a bare child
                        lands in the wrong slot and loses its typography. */}
                    <div slot="headline">{item.label}</div>
                  </md-list-item>
                );
              })}
            </md-list>
          </div>
        ))}
      </nav>
    </div>
  );

  if (isModal) {
    return (
      <md-navigation-drawer-modal
        ref={sheetRef}
        {...(open ? { opened: '' } : {})}
        role="dialog"
        aria-modal="true"
        {...(headline ? { 'aria-labelledby': headlineId } : { 'aria-label': navLabel })}
      >
        {content}
      </md-navigation-drawer-modal>
    );
  }

  return (
    <md-navigation-drawer
      ref={sheetRef}
      className="md3-drawer-standard"
      {...(open ? { opened: '' } : {})}
    >
      {content}
    </md-navigation-drawer>
  );
}
