# Web, accessibility and query integration

## Compose the experience

The supplied overview marks both web implementations unavailable. The inspected Material Web repository lists primitives such as fields, lists, icons and dialogs but does not establish a ready-made search component. Do not assume a public md-search export or token family. Verify installed APIs; semantic HTML can provide the input/form and custom app-scoped styling. [Material Web repository](https://github.com/material-components/material-web)

Define the interaction architecture before assigning roles:

- Submitted search can use a named search landmark/form with a labeled search input, followed by a heading and semantic result list containing real links/buttons.
- Live filtering of the existing object listing can keep normal input/list semantics. Do not add a combobox role merely because results update.
- Suggestions selectable while typing may use an editable combobox with an appropriate popup; implement its complete keyboard and state model.
- A modal full-screen task must implement dialog behavior; a nonmodal pane must not trap focus. Choose behavior to match the host requirement, not the visual width alone.

For a combobox, expose a label, expanded state, popup association and active option; keep DOM focus in the input for a listbox-popup model and communicate active focus with aria-activedescendant. Arrows move through suggestions, Enter accepts, and Escape dismisses the popup. Preserve normal text editing keys. Tab moves among ordinary controls; do not put every option into the page Tab order. Popup roles and focus rules differ for listbox, grid, tree and dialog. [WAI-ARIA combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)

Do not force complex result rows with multiple independent actions into a listbox option. Use a normal list of links/actions or an appropriate distinct pattern. Do not transplant menu arrow/Tab behavior onto a normal document list. If rows intentionally form a composite keyboard widget, implement its full semantics rather than attaching arrows alone.

## Names, focus and announcements

Give the input a persistent accessible name matching the visible hint or label's meaning; placeholder text disappears. Provide specific names for Back, Clear search and any trailing action; mark a nonfunctional magnifying-glass icon decorative. Do not make decorative icons focusable.

The Material capture describes initial focus on the first interactive leading button or input. Distinguish tab entry from explicitly opening search: when opening specifically to type, placing the caret in the input can support that intent. Keep navigation order logical and restore focus on exit. Native text inputs accept typing when focused; do not require a Space/Enter activation step copied from mobile guidance.

Use a concise polite status announcement for meaningful suggestion/result availability, loading completion, no matches and failure. A semantic list alone does not ensure screen readers announce dynamically inserted results. Avoid announcing every row or each transient keystroke; do not replace the focused element while rendering. Maintain visible loading/results context, and distinguish no query, no matches and unavailable server.

Clear input should keep the user able to type, reset the applicable result/suggestion state and announce useful changes. Back closes focused search with meaningful focus restoration. Escape should dismiss the active popup/view deliberately; do not accidentally erase the query and navigate history in one keypress. Scrim interaction must have a documented dismissal outcome. True modal behavior may block the entire host document; scoped CSS alone does not limit it to the app.

## Async lifecycle

Choose live or explicit-submit search; debounce live requests appropriately for the interaction, without hardcoding an unsupported design timing. Honor IME composition so Enter or partial composition does not submit prematurely. Cancel obsolete requests or ignore responses whose query/scope generation is stale. Reset pagination on query/filter/scope change. Closing, clearing or changing owner context must not allow an old response to repopulate the view.

Keep current query, pending query and displayed result scope coherent. A request error is not an empty result. Preserve input and provide retry; do not duplicate submissions. Do not force focus into results on a background live update. For explicit submission use a deliberate accessible focus/status transition.

Search history is optional; do not add persistence or send private names to third-party services merely to implement suggestions. Do not store credentials with queries or render query/result text as raw HTML. Bundle locally under CSP; use existing request/CSRF and server owner-authorization boundaries.

## Current project contract

Source inspection of VirtualFileSystemService, NodeStore and ScopedApiService establishes current behavior, not a new live test:

- GET /api/v1/nodes supports search, optional parent_id, limit 1–100 and nonnegative offset; search is bounded to 255 bytes.
- With nonempty search and no parent, the session service searches the owner's hierarchy. With an explicit parent it searches direct children, not the recursive subtree. Empty search without parent lists root children.
- Name matching uses escaped SQL LIKE substring matching; case/accent behavior is database-dependent. Do not promise full-text, fuzzy, relevance-ranked, MIME or file-content search.
- Ordering is name_key then id; do not label it alphabetical or ranked relevance.
- Folder-restricted bearer searches remain within a selected accessible parent. The browser uses session APIs, not a stored bearer credential.
- No bucket model exists yet. Do not offer real cross-bucket scope until its contract exists.

A scope label such as Search this folder must explain direct-child behavior if that is what the UI calls. Do not present client-side filtering of one paginated page as a complete server search. Response fields do not provide a global total; avoid claiming an exact total from one page length. Follow the actual pagination contract and label counts honestly.

## Verification scenarios

Record browser/runtime and observed checks:

- Reach/open search, edit/submit by keyboard, choose a suggestion, clear and exit with predictable focus.
- Test IME, Enter, arrows, Escape, Tab/Shift+Tab; preserve normal text editing.
- Check screen-reader names, active suggestions, status announcements and actual result list semantics.
- Test empty/loading/no-matches/error/retry; slow responses, query A then B, clear/close during request and scope changes.
- Verify pagination resets and exact supported scope; unauthorized results never appear.
- Test docked/full-screen adaptation, scrim/modal behavior, scroll, virtual keyboard, zoom, long labels, RTL and both themes.
- Check reduced motion, visible focus, touch targets and unchanged Nextcloud shell styling.

No frontend build, search UI or browser verification is completed by authoring this skill.
