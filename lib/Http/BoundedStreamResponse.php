<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Http;
use OCP\AppFramework\Http\Response;
use OCP\AppFramework\Http\ICallbackResponse;
use OCP\AppFramework\Http\IOutput;
final class BoundedStreamResponse extends Response implements ICallbackResponse {
    private bool $closed = false;
    public function __construct(private mixed $stream, private int $length, int $status, array $headers,
        private \Closure $release, private float $deadline) { parent::__construct($status, $headers); }
    private function close(): void {
        if ($this->closed) { return; }
        $this->closed = true;
        try { if (is_resource($this->stream)) { fclose($this->stream); } }
        finally { ($this->release)(); }
    }
    public function callback(IOutput $output): void {
        if ($this->closed) { return; }
        try {
            if (!in_array($output->getHttpResponseCode(), [200, 206], true)) { return; }
            $remaining = $this->length;
            while ($remaining > 0 && !connection_aborted() && hrtime(true) / 1e9 < $this->deadline) {
                $chunk = fread($this->stream, min(65536, $remaining));
                if ($chunk === false || $chunk === '') { break; }
                $remaining -= strlen($chunk); $output->setOutput($chunk);
            }
        } finally { $this->close(); }
    }
    public function __destruct() {
        // Callback can be skipped by framework/HTTP conditional handling or cancellation.
        try { $this->close(); } catch (\Throwable) { /* Provider shutdown also releases request locks. */ }
    }
}
