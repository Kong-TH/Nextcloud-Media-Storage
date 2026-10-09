<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
// Required project identity must be supplied by the owner, never invented.
if ($argc !== 3 || trim($argv[1]) === '' || trim($argv[2]) === '') {
    fwrite(STDERR, "Usage: php scripts/configure-metadata.php 'Author name' 'SPDX licence'\n"); exit(2);
}
$root = dirname(__DIR__);
$document = new DOMDocument();
$document->load($root . '/appinfo/info.xml.in');
foreach (['author' => $argv[1], 'licence' => $argv[2]] as $tag => $value) {
    $node = $document->getElementsByTagName($tag)->item(0);
    $node->textContent = $value;
}
$source = getenv('NEXTCLOUD_SOURCE') ?: '/snap/nextcloud/current/htdocs';
libxml_use_internal_errors(true);
if (!$document->schemaValidate($source . '/resources/app-info.xsd')) {
    fwrite(STDERR, "Metadata rejected by installed Nextcloud schema:\n");
    foreach (libxml_get_errors() as $error) fwrite(STDERR, $error->message);
    exit(1);
}
$document->save($root . '/appinfo/info.xml');
echo "Configured appinfo/info.xml; installed Nextcloud schema validation passed.\n";
