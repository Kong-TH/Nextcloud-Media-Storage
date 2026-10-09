# Design and captured measurements

## Rationale and anatomy

Animation communicates activity and can reduce perceived latency during a short unknown wait. The active indicator is a looping morph sequence composed of seven distinct Material 3 shapes. Its circular container is optional. The supplied Specs mark this as Expressive, with no baseline M3 loading-indicator variant.

Do not substitute seven arbitrarily chosen shapes and call it exact Material fidelity. The saved text does not specify shape path geometry, order, easing, or durations. Inspect source figures and authoritative implementation guidance if exact motion is required; otherwise label a custom approximation honestly.

## Color and containment

Default active color: primary. Contained treatment: on-primary-container active shape over primary-container. Use theme roles and verify the actual pairing in light/dark themes.

Use the circular container over other content for separation. It is unnecessary when placed directly on a suitable surface. The source requires contained treatment for its pull-to-refresh example, but that example is Jetpack Compose-specific, not a web feature requirement.

## Size

The captured Specs give an overall 48dp size with a 38dp shape container to preserve margins. Guidelines allow 24–240dp depending on context; retain the ratio when scaling. Do not confuse the inner shape container measurement with the optional outer circular background.

Reserve large presentation for large empty regions on large windows; do not enlarge every spinner simply because a desktop is wide. Adapt to the loading pane, including narrow panes inside a wide host. Use named logical CSS sizing without claiming physical equivalence between CSS px and Android dp. Interactive token tables do not expose complete numerical values.

## Placement and behavior

Center feedback inside the page/container being loaded. For pagination or loading more, use the insertion region without obscuring existing content. Buttons may contain a compact loading visual when an action needs a few seconds; preserve the control's understandable name and avoid layout shifts.

Do not show a loader for an expected instant result. A deferred reveal around the short-wait threshold can prevent flashes; clear the reveal timer if work finishes first. This is an application implementation choice, not a mandatory animation duration. Never delay actual content just to complete a decorative cycle.

Plan progress-family feedback for long or measurable processes. If an unexpectedly short operation becomes slow, provide honest status/recovery and consider allowing navigation away; do not leave an unbounded unexplained animation or fabricate percentages. The five-second guideline is not an automatic cancellation deadline.

## Pull-to-refresh boundary

The source explicitly limits its pull-to-refresh behavior to Jetpack Compose. Its examples describe a deliberate threshold, reversing the gesture to cancel before triggering, and keeping feedback visible until refresh completes or the user leaves. Do not claim this exists in @material/web or add a web gesture without a separate requirement. A web Refresh action remains an explicit accessible alternative when refresh is implemented.
