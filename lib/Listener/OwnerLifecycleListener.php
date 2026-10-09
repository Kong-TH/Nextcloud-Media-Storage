<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Listener;
use OCP\EventDispatcher\Event;
use OCP\EventDispatcher\IEventListener;
use OCP\User\Events\UserCreatedEvent;
use OCP\User\Events\UserDeletedEvent;
use OCA\MediaStorage\Service\OwnerCleanupService;
/** @implements IEventListener<UserCreatedEvent|UserDeletedEvent> */
final class OwnerLifecycleListener implements IEventListener {
    public function __construct(private OwnerCleanupService $cleanup) {}
    public function handle(Event $event): void {
        if ($event instanceof UserCreatedEvent || $event instanceof UserDeletedEvent) { $this->cleanup->purge($event->getUid()); }
    }
}
