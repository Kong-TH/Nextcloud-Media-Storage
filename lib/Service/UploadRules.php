<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Service;
use OCA\MediaStorage\Exception\MediaException;
final class UploadRules {
    public const EXTENSIONS = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/gif' => 'gif', 'image/webp' => 'webp',
        'image/avif' => 'avif', 'video/mp4' => 'mp4', 'video/webm' => 'webm', 'video/ogg' => 'ogv'];
    public static function id(string $id): void {
        if (!preg_match('/^[a-f0-9]{32}$/D', $id)) { throw new MediaException('Invalid upload request ID.'); }
    }
    public static function bytes(string $value): int {
        $value = trim($value);
        if (!preg_match('/^(\d+)([KMG]?)$/iD', $value, $m)) { return 0; }
        return (int)$m[1] * (1024 ** (['' => 0, 'K' => 1, 'M' => 2, 'G' => 3][strtoupper($m[2])]));
    }
    public static function date(int $time, string $timezone): string {
        try { $zone = new \DateTimeZone($timezone); } catch (\Exception) { $zone = new \DateTimeZone('UTC'); }
        return (new \DateTimeImmutable('@' . $time))->setTimezone($zone)->format('Y-m-d');
    }
    public static function fingerprint(string $parent, string $name, string $hash, int $size): string {
        return hash('sha256', json_encode([$parent, $name, $hash, $size], JSON_THROW_ON_ERROR));
    }
}
