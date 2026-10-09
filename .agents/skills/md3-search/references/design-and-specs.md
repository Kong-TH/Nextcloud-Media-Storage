# Design and specifications

## Entry points and anatomy

A persistent bar near the top of a view suits searching that view's files/messages. A search app bar emphasizes search as a primary/global task; an icon button suits secondary search. Focused search may be a destination when central to a product. Choose the entry based on the actual scope rather than making a local folder filter look like global search.

Search contains a bar and an initially empty suggestions/results container. Compose a list to populate that container. The bar includes a leading icon, hinted/supporting text or input, and optional trailing icons/avatar. Leading content can be a navigational button or a nonfunctional search icon. Decorative icons are not tab stops. Label interactive icons by their action.

Use up to two trailing icons/buttons, or an avatar plus at most one other trailing button. Clear input is an optional focused-search action. Voice search, location/profile or overflow are examples, not mandatory features or permission to imply unsupported services.

Use short scope-specific hints such as Search file names. Typing replaces the hint with query text. Keep the query visible after executing. Focused search needs an understandable results/status cue, such as a Results heading or search indicator.

## Styles and layouts

Contained is the recommended Expressive treatment: a persistent filled rounded search bar separates from the result/suggestion list. Its bar keeps its shape across unfocused/focused states and grows wider through changed outer margins. Divided is baseline, separating the bar and list with a divider. Do not equate a baseline divider with the recommended contained style.

Docked/full-screen layout is a separate choice from style. Docked places a list beneath the bar and describes a scrim over main content. Full-screen fills the search surface. Compact windows below 600dp default to full-screen; medium 600–839dp and expanded 840–1199dp favor docked. Adapt to available pane space and the host shell; these are Material window classes, not proof that a 360px minimum fits every plugin pane.

Keep search near its searchable content and inside its pane. Result lists scroll below the bar. Depending on product needs the bar can remain fixed or scroll away and reappear. The captured scroll prose and animation caption disagree about the reappearance direction; choose and verify one intentional behavior rather than claiming the capture proves either.

## Measurements and interpretation

| Context | Attribute | Supplied value |
| --- | --- | --- |
| Search bar | Width | 360dp minimum, 720dp maximum |
| Search bar | Height | 56dp |
| Search bar | Text alignment | Start |
| Search bar table | Leading/trailing padding | Unfocused 24dp, focused 12dp |
| Search bar | Icon target-to-label spacing | 4dp |
| Avatar | Size | 30dp |
| Contained full-screen container | Size | Full width/height |
| Contained docked container | Width | 360–720dp |
| Contained docked container | Height | Minimum 240dp, maximum two thirds of screen height |
| Contained focused bar table | Height | 56dp |
| Contained focused bar table | Leading/trailing padding | 16dp |

Guidelines explicitly call 24dp/12dp outer container margins, while the first table calls them leading/trailing padding. The focused contained table separately lists 16dp. Do not add all values together or silently treat them as the same box. Confirm the selected layout's geometry before exact implementation. Two inspected diagrams show 24dp icons inside 48dp targets, 4dp target-edge/text spacing and a 56dp bar; the docked contained diagram also shows 4dp container inset. Use this evidence to distinguish icon, target and container measurements.

The focused table repeats the leading-icon spacing row; it does not independently prove trailing geometry. Divided measurement images exist, but no divided numeric table was captured and those images were not visually measured. Do not reuse contained values as verified divided specifications.

Map design dp to CSS deliberately. Avoid overflow in smaller available widths and keep zoom/localized text usable. Icon targets and the bar are different boxes. No complete radius, typography, elevation or animation inventory is captured.

## Color and states

Search bars use surface container high with on surface/on surface variant content. Full-screen and docked views have separate mappings; captured full-screen roles include surface container low and high, while docked roles include surface container high. Consult exact element mapping when implementing rather than assigning one background to every layer.

Avoid placing a surface container high bar on a surface container background where the distinction is too weak. Guidance recommends surface roles more than one step apart; evaluate actual contrast rather than assuming a role name guarantees accessibility. Retain light/dark mappings. Do not hardcode the single captured Android surface-tint hex as a universal web background.

Cover enabled, hovered, focused and pressed states for the bar and individual suggestion/result elements. Each element keeps its own state while search is focused. Do not equate the whole focused-search view with DOM focus on every child.

## Suggestions, results and behavior

Suggestions can appear before typing (such as history), update while typing, or wait for an explicit query. Results can also update live or on Enter. State which model is used. Suggestions can refine a query; results can open a resource directly. Do not treat these as the same action accidentally.

Lists can include category labels, contextual icons, avatars or filters when useful. Gaps can group search lists in the supplied guidance; menu-specific prohibitions on web menu gaps do not automatically apply to a composed result list. Verify the chosen list implementation and semantics.

Back exits focused search, dismisses suggestions/results and returns to the prior bar state. Clear removes input. Specify whether exiting retains the query and how Back/Escape differs from browser history. Android predictive-back animation is platform guidance, not a required web gesture or API.

Guidelines say submitted query remains visible but not focused. Apply that to an intentional submission transition; do not blur the field on every live response. Preserve a meaningful result location and support returning to edit. Respect reduced motion; exact easing/durations are not supplied.
