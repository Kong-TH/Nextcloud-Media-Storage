---
name: md3-search
description: Design, implement, or review Material Design 3 search experiences on the web, including search bars, focused docked/full-screen views, suggestions and result lists. Cover scope, contained versus divided styling, keyboard/focus, accessible announcements and async queries. Search requires custom web composition; ordinary form fields, selection menus and global navigation use separate guidance.
---

# Material Design 3 search

Use search to find information in a substantial collection. Make the searchable scope visible and keep the entry point close to that content. A search field, autocomplete suggestion popup and submitted result list are related but have different interaction semantics.

## Workflow

Identify scope, query semantics, entry point, suggestion source, execution timing and result actions. Choose contained or divided style and docked or full-screen layout independently. Read [design-and-specs.md](references/design-and-specs.md) for composition, adaptive rules and measurements; read [web-and-accessibility.md](references/web-and-accessibility.md) for web semantics, async state and project integration. [sources.md](references/sources.md) records source coverage, contradictions and verification limits.

## Essential constraints

- The supplied availability table marks Web and Web Expressive unavailable. Do not invent md-search, search-view APIs, imports or tokens. Compose supported primitives or semantic HTML and explicitly identify custom work.
- Contained is the recommended Expressive style; divided is baseline. Contained keeps its rounded bar shape when focused. Do not change this into an unrelated field treatment.
- Use a prominent bar for searching the current view, a search app bar for primary/global search, or an icon entry for secondary search. Do not modify Nextcloud's global app bar merely to add plugin search.
- Keep at most two trailing icons; an avatar may accompany at most one additional trailing icon button. Do not add decorative controls suggesting unavailable voice/location features.
- Distinguish query entry, suggestions, loading, results, no matches and request failure. A failed request is not zero results.
- Keep entered text visible after execution. Clearing input and exiting focused search are different actions; define each deliberately.
- Provide a persistent accessible name matching the search hint's meaning. Placeholder text alone must not carry naming responsibility.
- Announce meaningful result changes without reading every keystroke or stealing focus as async results arrive.

## Nextcloud and evidence boundary

Scope theme/CSS to plugin-owned surfaces and preserve the host header/navigation. Use the plugin's available width and height. Docked scrims and full-screen search need explicit focus/dismissal semantics: scoped CSS does not confine browser-modal behavior. If the shell must stay interactive, choose an inline/nonmodal design.

Use session/CSRF-aware calls and backend owner authorization. Do not embed external bearer credentials in browser code. Search labels must describe the actual supported scope; pending buckets, previews and delivery are not implied capabilities. See the web reference for the current name-search limitations.

Bundle assets locally, inspect Vue/custom-element integration, and test actual host behavior before claiming compatibility. Report browser/package versions, observed checks and remaining gaps. Skill validation is documentation validation, not a frontend build or accessibility test.
