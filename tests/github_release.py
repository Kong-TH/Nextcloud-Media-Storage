#!/usr/bin/env python3
# SPDX-License-Identifier: AGPL-3.0-or-later
"""Check release identity and event guards without network or repository writes."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('github_release_metadata', Path(__file__).resolve().parents[1] / 'scripts/github-release-metadata.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ReleaseMetadataTests(unittest.TestCase):
    def test_manual_and_tag_agree(self):
        manual = module.release_metadata('0.8.0', 'workflow_dispatch', 'refs/heads/main', 'main')
        tag = module.release_metadata('0.8.0', 'push', 'refs/tags/v0.8.0', 'main')
        self.assertEqual(manual, tag)
        self.assertEqual(tag['tag'], 'v0.8.0')

    def test_mismatched_tags_rejected(self):
        for ref in ['refs/tags/v0.9.0', 'refs/tags/0.8.0', 'refs/tags/v0.8.0-rc.1']:
            with self.subTest(ref=ref), self.assertRaises(ValueError):
                module.release_metadata('0.8.0', 'push', ref, 'main')

    def test_manual_branch_restricted(self):
        with self.assertRaises(ValueError):
            module.release_metadata('0.8.0', 'workflow_dispatch', 'refs/heads/feature', 'main')
        module.release_metadata('0.8.0', 'workflow_dispatch', 'refs/heads/stable', 'stable')

    def test_invalid_or_unsupported_version_rejected(self):
        for version in ['01.2.3', '0.8.0-rc.1', '0.8.0+build', '0.8', '0.8.0\nmalicious=1']:
            with self.subTest(version=version), self.assertRaises(ValueError):
                module.release_metadata(version, 'push', 'refs/heads/main', 'main')


if __name__ == '__main__':
    unittest.main()
