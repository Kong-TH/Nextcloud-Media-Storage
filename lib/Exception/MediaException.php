<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Exception;
final class MediaException extends \RuntimeException {
    public function __construct(string $message, public readonly int $status = 400) { parent::__construct($message); }
}
