<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Http;
use OCP\AppFramework\Http\Response;
use OCP\AppFramework\Http\ICallbackResponse;
use OCP\AppFramework\Http\IOutput;
/** Preserve authorized representation headers without App::main replacing length with zero. */
final class HeadResponse extends Response implements ICallbackResponse {
    public function callback(IOutput $output): void {
        // Headers are emitted by the framework; HEAD has no payload or stream.
    }
}
