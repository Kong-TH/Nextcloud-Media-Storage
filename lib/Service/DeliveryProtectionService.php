<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Service;
use OCP\IConfig;
use OCP\IRequest;
use OCP\IURLGenerator;
use OCP\Lock\ILockingProvider;
use OCP\Lock\LockedException;
use OCP\Security\RateLimiting\ILimiter;
use OCP\Security\RateLimiting\IRateLimitExceededException;
use OCA\MediaStorage\Exception\MediaException;
final class DeliveryProtectionService {
    public function __construct(private IConfig $config, private IRequest $request, private IURLGenerator $urls,
        private ILimiter $limiter, private ILockingProvider $locks) {}
    private function setting(string $key, int $default, int $max): int {
        return max(1, min($max, (int)$this->config->getAppValue('mediastorage', $key, (string)$default)));
    }
    private function limit(string $kind, int $default, ?string $identity = null): void {
        try {
            $this->limiter->registerAnonRequest('mediastorage:' . $kind . ($identity === null ? '' : ':' . hash('sha256', $identity)),
                $this->setting($kind . '_limit', $default, 10000), 60, $identity === null ? $this->request->getRemoteAddress() : '127.0.0.1');
        } catch (IRateLimitExceededException) { throw new MediaException('Request limit reached. Retry later.', 429, ['Retry-After' => '60']); }
    }
    public function request(string $kind): void {
        if (!$this->config->getSystemValueBool('ratelimit.protection.enabled', true)) { throw new MediaException('Request protection unavailable.', 503); }
        $this->limit($kind . '_ip', 600);
    }
    public function token(array $token): void { $this->limit('external_token', 120, $token['owner_id'] . ':' . $token['id']); }
    public function resource(array $row): void {
        $this->limit('delivery_grant', 120, $row['id']);
        if ($row['issuer_id'] !== null) { $this->limit('delivery_issuer', 240, $row['owner_id'] . ':' . $row['issuer_id']); }
        $this->hotlink();
    }
    private function host(string $value): ?string {
        $parts = parse_url($value);
        if (!is_array($parts) || !isset($parts['scheme'], $parts['host']) || !in_array(strtolower($parts['scheme']), ['http', 'https'], true) || (isset($parts['user']) || isset($parts['pass']))) { return null; }
        return strtolower(rtrim($parts['host'], '.'));
    }
    private function hotlink(): void {
        if ($this->config->getAppValue('mediastorage', 'delivery_hotlink_protection', '0') !== '1') { return; }
        try { $domains = json_decode($this->config->getAppValue('mediastorage', 'delivery_allowed_domains', '[]'), true, 8, JSON_THROW_ON_ERROR); }
        catch (\Throwable) { throw new MediaException('Delivery policy unavailable.', 503); }
        if (!is_array($domains) || !array_is_list($domains) || count($domains) > 100) { throw new MediaException('Delivery policy unavailable.', 503); }
        foreach ($domains as &$host) {
            if (!is_string($host) || !preg_match('/^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.?$/iD', $host)) { throw new MediaException('Delivery policy unavailable.', 503); }
            $host = strtolower(rtrim($host, '.'));
        }
        unset($host);
        $ownHost = $this->host($this->urls->getBaseUrl());
        if ($ownHost !== null) { $domains[] = $ownHost; }
        $present = false;
        foreach (['Origin', 'Referer'] as $header) {
            $value = trim($this->request->getHeader($header));
            if ($value === '') { continue; }
            $present = true; $host = $this->host($value);
            if ($host === null || !in_array($host, $domains, true)) { throw new MediaException('Browser origin not allowed.', 403); }
        }
        if (!$present && strtolower($this->request->getHeader('Sec-Fetch-Site')) === 'cross-site') { throw new MediaException('Browser origin not allowed.', 403); }
    }
    /** Return one idempotent cleanup function and an absolute monotonic deadline. */
    public function lease(array $row): array {
        if (!$this->config->getSystemValueBool('filelocking.enabled', true)) { throw new MediaException('Stream protection unavailable.', 503); }
        $slots = ['delivery_ip' => [$this->request->getRemoteAddress(), 16], 'delivery_grant' => [$row['id'], 4]];
        if ($row['issuer_id'] !== null) { $slots['delivery_issuer'] = [$row['owner_id'] . ':' . $row['issuer_id'], 8]; }
        $held = [];
        $release = function () use (&$held): void {
            $keys = array_reverse($held); $held = [];
            $failure = null;
            foreach ($keys as $key) { try { $this->locks->releaseLock($key, ILockingProvider::LOCK_EXCLUSIVE); } catch (\Throwable $error) { $failure ??= $error; } }
            if ($failure !== null) { throw $failure; }
        };
        try {
            foreach ($slots as $kind => [$identity, $default]) {
                $acquired = false;
                for ($slot = 0; $slot < $this->setting($kind . '_concurrency', $default, 32); ++$slot) {
                    $key = hash('sha256', 'mediastorage:stream:' . $kind . ':' . $identity . ':' . $slot);
                    try { $this->locks->acquireLock($key, ILockingProvider::LOCK_EXCLUSIVE); $held[] = $key; $acquired = true; break; }
                    catch (LockedException) { continue; }
                }
                if (!$acquired) { throw new MediaException('Concurrent stream limit reached. Retry later.', 429, ['Retry-After' => '1']); }
            }
        } catch (\Throwable $error) { $release(); throw $error; }
        $ttl = max(1, $this->config->getSystemValueInt('filelocking.ttl', 3600));
        $seconds = min(max(5, $this->setting('delivery_max_seconds', 300, 1800)), max(1, (int)($ttl * 0.8)));
        return ['release' => $release, 'deadline' => hrtime(true) / 1e9 + $seconds];
    }
}
