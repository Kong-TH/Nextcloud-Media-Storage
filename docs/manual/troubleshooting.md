# Troubleshooting

| Symptom | Investigation |
| --- | --- |
| PHP/Composer command not found | Use an authorized development runtime matching the installed Nextcloud release |
| Docker socket denied | Obtain authorized access or use another test environment; do not infer container state |
| Unknown compatibility | Record target `occ status` and inspect pinned public API documentation |
| Future missing binding | Check owner context, permission and file existence; explicitly rebind, never silently substitute by path |
| Future old URL fails after rename | Resolve the new hierarchy path; aliases are not promised in the MVP |

No app-specific production troubleshooting has been verified. Do not include tokens, session cookies, signed URLs or private file paths in public bug reports.
