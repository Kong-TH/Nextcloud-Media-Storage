# Media Storage Settings

**Status:** Design for review, 2026-11-25.

## Reference findings

The supplied GitLab **Preferences** capture presents groups such as **Language and region** directly on the page. The **General Settings** capture shows a title and an **Expand** or **Collapse** control per group. In the saved state, **Naming, description, topics** is open and groups such as **Visibility, project features, permissions** are closed. Open groups contain their own controls and save action. Both saved asset directories accompany the HTML captures. Use the captures as references for information hierarchy and disclosure behavior. Use Media Storage's Material 3 surfaces, typography, controls and icons for the visual design.

## Page structure

Add **Settings** to the workspace navigation below **API tokens**. Reuse the plugin content pane and responsive drawer. Use one column on desktop and compact screens so section titles and controls have a consistent reading order.

1. **Preferences** is always visible at the top. Use a labeled Material outlined select for **Interface language**. The closed field shows the selected language. Opening it reveals **English** and **ไทย**, with each option written in its own language.
2. **Object display** starts collapsed and groups the load size, default sort and list thumbnails.
3. **API token policy** starts collapsed and groups issuance settings for Nextcloud administrators.
4. Add **Uploads** and **Delivery protection** under administrator settings when their controls are ready. Keep a single control inline if it stands alone.

Each collapsible header has a title, a short description or current value, and a trailing chevron. Make the entire header a disclosure button. Use independently expandable sections so users can compare settings. Keep save controls inside their respective sections. Apply a saved language selection after persistence succeeds. Keep the current view and preserve edits with clear feedback if saving fails.

## Settings inventory and proposed scope

| Group | Control | Current support |
| --- | --- | --- |
| Preferences | Interface language | New account preference and translation catalog. Use an English/Thai dropdown, with English as the proposed initial value. |
| Preferences | Starting bucket | Proposed account preference. Open the selected owned bucket when launching Objects without a bookmark. Use Library if the saved bucket is unavailable. |
| Object display | Objects per load | The explorer and its paged backend currently cap each batch at 25. Proposed 25/50/100 values require updating the paged request, backend validation, and response checks. Preserve the separate external listing contract. |
| Object display | Default sort | The explorer already supports Name and Type and preserves the active sort in navigation. A saved default can apply when opening a view without an explicit sort. |
| Object display | Show list thumbnails | The explorer already renders thumbnails. A new preference can avoid thumbnail requests in the list and keep previews available in Object details. |
| API token policy | Token secret length | New admin policy. Propose 32 characters for the secret suffix of `ms_<selector>.<secret>`. Evaluate 16 as the minimum. Apply to newly issued and rotated credentials. |
| API token policy | Maximum API token lifetime | Existing server policy `max_token_lifetime`. The default is 365 days. |
| API token policy | Suggested expiry | Proposed admin setting for the initial expiry shown in Create token. The current form suggests seven days, bounded by server policy. Users can still choose their own expiry within that limit. |
| Uploads | Maximum upload size | Existing admin policy `max_upload_bytes`. Default 100 MiB. Show the effective limit after applying app and PHP request limits. |
| Delivery protection | Hotlink protection and allowed domains | Existing admin policies `delivery_hotlink_protection` and `delivery_allowed_domains`. |
| Delivery protection | Request rate, concurrent streams, maximum stream duration | Existing admin limits. Reserve these controls for advanced administration. |

For the first implementation, propose Preferences, Object display, and API token policy. Keep the remaining administrator controls available through existing Nextcloud app configuration until designed in the UI. Per-account settings belong to the signed-in account. Server policy changes require administrator authorization.

The current token generator uses 32 random bytes encoded as 43 Base64URL characters. The selector is 32 hexadecimal characters and is separate from the secret. A uniformly random secret made from a 64-character alphabet provides 96 bits at 16 characters and 192 bits at 32. Use a cryptographically secure generator. When supporting configurable lengths, validate the supported format independently of the current issuance setting so an existing credential keeps working until expiry or revocation. Existing database records store a verifier. Keep secrets out of settings responses.

## Boundaries and additional candidates

The plugin follows Nextcloud's theme. The appearance screenshots remain control references.

Temporary links are currently issued via the session or external API. Object details offers Copy virtual path and rebind actions. Keep `max_access_lifetime` in server configuration for API users. Revisit a temporary-link settings group when the app has an on-screen creation flow.

An import preference could preselect Keep folder or Import contents here, using the existing review steps for each import. A token dashboard preference could remember its existing sort by expiry or name. Both are optional follow-ups after the initial settings review. Folder depth and subtree mutation limits are internal guardrails.

## Interaction and acceptance

- Preferences stays visible when other sections are collapsed. Verify the language select displays the saved value when closed and offers both options on open. Test keyboard selection and dismissal, persistence across reload and sign-in, and switching back from Thai.
- Enter and Space toggle a focused disclosure button. Verify its accessible expanded state and that collapsed contents leave the tab order. Keep focus on the header when toggling. Check narrow layouts, dark mode, and wrapped Thai labels.
- Select a starting bucket, open an explicit bookmark, and verify that deleting the saved bucket falls back to Library. Change the default sort and verify that explicitly sorted bookmarks retain their sort. Disable list thumbnails and verify that list thumbnail requests stop while Object details still loads its preview.
- Select 50 objects per load in a folder with more than 50 objects. Verify the first batch and subsequent batches are complete and contain no duplicates. Try invalid sizes and verify they are rejected.
- As an administrator, change the secret length and verify both issuance and rotation produce the selected number of characters. Verify previously issued credentials continue to work and non-admin requests cannot change the policy. Test rejected lengths and save failures.
- Review the reference-derived design before implementing. Run the acceptance cases against a signed-in local Nextcloud instance when the Settings page is available.
