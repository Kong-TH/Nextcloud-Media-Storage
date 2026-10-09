<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Service;
use OCP\Files\IRootFolder;
use OCP\Files\File;
use OCP\Files\NotFoundException;
use OCP\Files\NotPermittedException;
use OCA\MediaStorage\Exception\MediaException;
final class MediaStorageService {
    public function __construct(private IRootFolder $rootFolder) {}
    public function inspect(string $owner, int $fileId, ?array $expected = null): array {
        if ($fileId < 1) { throw new MediaException('Invalid file ID.'); }
        try {
            $home = $this->rootFolder->getUserFolder($owner);
            $nodes = $home->getById($fileId);
            if (count($nodes) !== 1) { throw new MediaException('File binding is missing or ambiguous. Rebind explicitly.', 409); }
            $file = reset($nodes);
            if (!$file instanceof File || !$file->isReadable()) { throw new MediaException('File is not accessible.', 404); }
            $storage = hash('sha256', $file->getStorage()->getId());
            if ($expected !== null && !hash_equals($expected['storage_reference'], $storage)) {
                throw new MediaException('File storage context changed. Rebind explicitly.', 409);
            }
            $mime = $file->getMimeType(); NodeRules::mediaType($mime);
            return ['nextcloud_file_id' => $fileId, 'storage_reference' => $storage,
                'last_known_path' => $home->getRelativePath($file->getPath()), 'mime_type' => $mime,
                'file_size' => (int)$file->getSize(), 'updated_at' => time()];
        } catch (NotFoundException|NotPermittedException $e) {
            throw new MediaException('File is not accessible. Rebind explicitly.', 404);
        }
    }
}
