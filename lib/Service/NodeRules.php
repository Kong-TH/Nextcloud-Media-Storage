<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Service;
use OCA\MediaStorage\Exception\MediaException;
final class NodeRules {
    public static function name(string $name): string {
        if ($name === '' || strlen($name) > 255 || trim($name) !== $name
            || $name === '.' || $name === '..' || preg_match('//u', $name) !== 1
            || preg_match('/[\\\\\/\x00-\x1f\x7f]/u', $name)) {
            throw new MediaException('Invalid node name.');
        }
        return $name;
    }
    public static function segments(string $path): array {
        if ($path === '' || $path === '/') { return []; }
        return array_map(self::name(...), explode('/', trim($path, '/')));
    }
    public static function mediaType(string $mime): void {
        // Exclude executable/active formats such as SVG and HTML.
        if (!in_array($mime, ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'video/mp4', 'video/webm', 'video/ogg'], true)) {
            throw new MediaException('Unsupported media type.', 415);
        }
    }
}
