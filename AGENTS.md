# Agent entry point

Read [docs/agent-handoff.md](docs/agent-handoff.md), [docs/index.md](docs/index.md), and the current sprint before changing code. The handoff records the latest user decisions, verified baseline, open bucket question, and next tasks. Inspect current source and Git status; do not treat historical status paragraphs as current deployment evidence.

Keep code, comments, and technical documentation in English. Use relevant project skills under `.agents/skills` when implementing Material UI. Scope UI styling to the plugin and preserve the Nextcloud shell. Update affected architecture, schema, API, sprint, and validation docs alongside implementation. Never commit credentials or claim deferred tests passed.

## Feature completion and test cases

For every completed feature, add or update meaningful test cases with inputs/setup, expected behavior, and the test script or manual procedure. Cover successful use, relevant invalid inputs and authorization boundaries, and affected regressions. Run the applicable cases before calling the feature verified; record the command, target/version, actual result, and any pending checks in the feature validation report and sprint/handoff. Do not replace behavioral cases with assertions that merely mirror implementation.

For UI changes, use a connected Playground/browser testing plugin when available to exercise the actual interactions and inspect the rendered result, including relevant compact layout, keyboard and error/loading states. Record whether the target is a fixture, candidate assets, or an installed app. If no suitable session/environment is available, record UI verification as pending; unit/build results alone do not establish visual acceptance. See [the feature test-case checklist](docs/software/09-feature-test-cases.md).
