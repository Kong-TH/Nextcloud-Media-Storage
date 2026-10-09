# Troubleshooting

| Symptom | Investigation |
| --- | --- |
| PHP/Composer command not found | Use an authorized development runtime matching the installed Nextcloud release |
| Docker socket denied | Obtain authorized access or use another test environment; do not infer container state |
| Unknown compatibility | Record target `occ status` and inspect pinned public API documentation |
| Future missing binding | Check owner context, permission and file existence; explicitly rebind, never silently substitute by path |
| Future old URL fails after rename | Resolve the new hierarchy path; aliases are not promised in the MVP |

App-specific verified troubleshooting is recorded below. Do not include tokens, session cookies, signed URLs or private file paths in public bug reports.

## Snap test-instance checks

Run these in the host terminal; sudo may request your password:

```bash
sudo snap services nextcloud
sudo snap get nextcloud ports
sudo nextcloud.occ status
```

Do not share passwords or full configuration dumps. If the instance is not initialized, use the Snap-supported setup workflow. Use the repository deployment script for the built app. Directly executing the bundled PHP binary without Snap runtime paths can report missing shared libraries; this does not prove the Snap service is broken.

## Old UI after deployment

Same-version replacement of JS/CSS can leave existing browsers using earlier assets. Nextcloud 34 app stylesheet URLs use the app version; script URLs also use installed-version state. Changing source files while keeping 0.3.0 did not change those URLs. HTTP audit confirmed the deployed bytes matched the current build despite the user seeing old UI.

Release 0.3.1 increments the app version so both asset URLs change. Deploy with the documented script and reload the app page. A Nextcloud restart or global cache deletion is not required for this case. Ctrl+Shift+R is an immediate diagnostic workaround, not a substitute for publishing a new asset version. For future frontend releases, bump appinfo/info.xml, appinfo/info.xml.in and npm root version metadata together, build and deploy; verify with cache enabled as well as fresh loading.
