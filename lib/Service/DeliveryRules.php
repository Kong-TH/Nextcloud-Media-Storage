<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Service;
use OCA\MediaStorage\Exception\MediaException;
final class DeliveryRules {
    private static function date(string $value): ?int {
        if (!preg_match('/^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} GMT$/D', $value)) { return null; }
        $date = \DateTimeImmutable::createFromFormat('D, d M Y H:i:s \G\M\T', $value, new \DateTimeZone('UTC'));
        return $date && $date->format('D, d M Y H:i:s \G\M\T') === $value ? $date->getTimestamp() : null;
    }
    private static function matches(string $value, string $etag, bool $weak): bool {
        if (trim($value) === '*') { return true; }
        foreach (explode(',', $value) as $tag) {
            $tag = trim($tag);
            if ($weak && str_starts_with($tag, 'W/')) { $tag = substr($tag, 2); }
            if ($tag === $etag) { return true; }
        }
        return false;
    }
    /** Clamp decimal syntax without ever casting an overflowing integer. */
    private static function decimal(string $value, int $ceiling): int {
        $value = ltrim($value, '0'); $max = (string)$ceiling;
        if ($value === '') { return 0; }
        if (strlen($value) > strlen($max) || (strlen($value) === strlen($max) && strcmp($value, $max) > 0)) { return $ceiling; }
        return (int)$value;
    }
    public static function plan(array $media, array $request, bool $head): array {
        if (strlen(implode('', $request)) > 8192) { throw new MediaException('Delivery headers too large.'); }
        $size = $media['size']; $mtime = $media['mtime'];
        $etag = '"' . $media['etag'] . '"';
        $headers = ['ETag' => $etag, 'Last-Modified' => gmdate('D, d M Y H:i:s', $mtime) . ' GMT', 'Accept-Ranges' => 'bytes'];
        $status = 200; $start = 0; $length = $size;
        $match = trim($request['If-Match'] ?? ''); $unmodified = self::date(trim($request['If-Unmodified-Since'] ?? ''));
        $none = trim($request['If-None-Match'] ?? ''); $modified = self::date(trim($request['If-Modified-Since'] ?? ''));
        if (($match !== '' && !self::matches($match, $etag, false)) || ($match === '' && $unmodified !== null && $mtime > $unmodified)) {
            $status = 412;
        } elseif (($none !== '' && self::matches($none, $etag, true)) || ($none === '' && $modified !== null && $mtime <= $modified)) {
            $status = 304;
        } elseif (!$head) {
            $range = trim($request['Range'] ?? ''); $ifRange = trim($request['If-Range'] ?? '');
            $rangeAllowed = $ifRange === '' || $ifRange === $etag || self::date($ifRange) === $mtime;
            if ($rangeAllowed && str_starts_with($range, 'bytes=')) {
                if (str_contains($range, ',')) { $status = 416; }
                elseif (preg_match('/^bytes=(\d*)-(\d*)$/D', $range, $parts) && ($parts[1] !== '' || $parts[2] !== '')) {
                    if ($size === 0) { $status = 416; }
                    elseif ($parts[1] === '') {
                        $length = self::decimal($parts[2], $size); $start = $size - $length;
                        $status = $length === 0 ? 416 : 206;
                    } else {
                        $start = self::decimal($parts[1], $size);
                        $end = $parts[2] === '' ? $size - 1 : self::decimal($parts[2], $size - 1);
                        // Compare the unclamped end for reversed ranges at the boundary too.
                        $status = $start >= $size || $end < $start ? 416 : 206;
                        $length = $end - $start + 1;
                    }
                }
            }
        }
        if ($status === 206) { $headers['Content-Range'] = 'bytes ' . $start . '-' . ($start + $length - 1) . '/' . $size; }
        if ($status === 416) { $headers['Content-Range'] = 'bytes */' . $size; }
        if (!in_array($status, [200, 206], true)) { $length = 0; }
        // A 304 has no Content-Length; HEAD describes the full representation.
        if ($status !== 304) { $headers['Content-Length'] = (string)$length; }
        return ['status' => $status, 'headers' => $headers, 'offset' => $start, 'length' => $length, 'body' => !$head && $length > 0];
    }
}
