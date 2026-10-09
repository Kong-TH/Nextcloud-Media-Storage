'use client';

/**
 * MD3 navigation rail for React / Next.js.
 *
 * Pairs with navigation-rail.css in this directory — the CSS carries every token
 * value, this file carries the structure and the breakpoint swap.
 *
 * `@material/web` ships no rail component (not stable, not labs), so the rail
 * itself is hand-built from `md-icon` and `md-ripple`. That is the normal path
 * here, not a workaround — material.io lists the rail's web status as
 * Unavailable.
 *
 * The compact-window navigation bar IS available, in labs, and that is what the
 * rail turns into below 600px. Both are rendered and CSS picks one, so there is
 * no layout flash on resize and no JS media query to keep in sync. M3 is explicit
 * that the two must never be visible at once — the CSS enforces it.
 *
 * Custom elements do not server-render: the server emits the tag and the browser
 * upgrades it when this module loads, which is why this is a `'use client'` file.
 */

import '@material/web/icon/icon.js';
import '@material/web/ripple/ripple.js';
import '@material/web/fab/fab.js';
import '@material/web/iconbutton/icon-button.js';
// labs — the navigation bar for compact windows. Not re-exported from all.js.
import '@material/web/labs/navigationbar/navigation-bar.js';
import '@material/web/labs/navigationtab/navigation-tab.js';

export type RailDestination = {
  href: string;
  label: string;
  /** Material Symbols name. Every destination needs one — the rail is icon-led. */
  icon: string;
  /**
   * Use when the visible label only makes sense beside surrounding UI. A label
   * that reads "Recents" next to a photo grid should announce "Recent images".
   */
  ariaLabel?: string;
  /** Badge value, e.g. an unread count. */
  badge?: string;
};

type Props = {
  /** M3: 3–7 destinations. More than five at medium width wants a modal expanded rail. */
  destinations: RailDestination[];
  /** Current path, compared with `href` to pick the active destination. */
  currentPath: string;
  /** Distinguishes this nav landmark from others on the page. */
  navLabel?: string;
  /** Hide labels entirely. The indicator becomes a 56×56 circle. */
  hideLabels?: boolean;
  /** Centre the group — M3 recommends this on tablets, for reach. */
  align?: 'top' | 'center';
  /** Separate the rail from content: a divider, or elevation level 1. */
  separator?: 'none' | 'divider' | 'elevation';
  /** Primary action, anchored at the TOP of the rail. */
  fab?: { icon: string; label: string; onClick?: () => void };
  /** Menu button, above the FAB. Drives collapse/expand in an Expressive rail. */
  menu?: { label: string; onClick?: () => void };
};

export function NavigationRail({
  destinations,
  currentPath,
  navLabel = 'Main',
  hideLabels = false,
  align = 'top',
  separator = 'none',
  fab,
  menu,
}: Props) {
  const railClass = [
    'md3-rail',
    align === 'center' && 'md3-rail--center',
    separator === 'divider' && 'md3-rail--divided',
    separator === 'elevation' && 'md3-rail--elevated',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      {/* Medium and up. */}
      <nav className={railClass} aria-label={navLabel}>
        {/* Order is menu → FAB → destinations. M3: never put the FAB below the
            destinations; the rail's top is the anchor for the key action. */}
        {menu && (
          <md-icon-button
            className="md3-rail-menu"
            aria-label={menu.label}
            onClick={menu.onClick}
          >
            <md-icon>menu</md-icon>
          </md-icon-button>
        )}

        {fab && (
          <md-fab
            className="md3-rail-fab"
            size="medium"
            aria-label={fab.label}
            onClick={fab.onClick}
          >
            <md-icon slot="icon">{fab.icon}</md-icon>
          </md-fab>
        )}

        <ul className="md3-rail-items">
          {destinations.map((item) => {
            const active = item.href === currentPath;
            return (
              <li key={item.href}>
                {/* A real <a>: Tab reaches it, Enter activates it, middle-click
                    and "open in new tab" work. Do NOT give the rail radio-group
                    semantics — these navigate, they do not select a value. */}
                <a
                  href={item.href}
                  className={`md3-rail-item${hideLabels ? ' md3-rail-item--no-label' : ''}`}
                  /* data-active drives the pill; aria-current is what a screen
                     reader announces. Neither implies the other. */
                  {...(active ? { 'data-active': '', 'aria-current': 'page' } : {})}
                  {...(item.ariaLabel ? { 'aria-label': item.ariaLabel } : {})}
                >
                  <span className="md3-rail-indicator">
                    <md-icon>{item.icon}</md-icon>
                    <md-ripple />
                  </span>
                  {!hideLabels && <span className="md3-rail-label">{item.label}</span>}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Below 600px the rail becomes a navigation bar. Same destinations, same
          active item — one navigation model, two presentations. */}
      <md-navigation-bar
        className="md3-rail-bar"
        aria-label={navLabel}
        active-index={String(Math.max(0, destinations.findIndex((d) => d.href === currentPath)))}
      >
        {destinations.map((item) => (
          <md-navigation-tab
            key={item.href}
            label={item.label}
            {...(item.href === currentPath ? { active: '' } : {})}
            {...(item.badge ? { 'badge-value': item.badge, 'show-badge': '' } : {})}
            onClick={() => {
              window.location.href = item.href;
            }}
          >
            {/* The tab swaps these two itself, so the outlined → filled change
                is handled without extra CSS. */}
            <md-icon slot="active-icon" style={{ fontVariationSettings: "'FILL' 1" }}>
              {item.icon}
            </md-icon>
            <md-icon slot="inactive-icon">{item.icon}</md-icon>
          </md-navigation-tab>
        ))}
      </md-navigation-bar>
    </>
  );
}
