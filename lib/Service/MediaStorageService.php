<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Service;
use OCP\Files\IRootFolder;
use OCP\Files\File;
use OCP\Files\Folder;
use OCP\Files\NotFoundException;
use OCP\Files\NotPermittedException;
use OCA\MediaStorage\Exception\MediaException;
final class MediaStorageService {
    public function __construct(private IRootFolder $rootFolder) {}
    public function importSource(string $owner, int $fileId, bool $folder): ?array {
        if (!$folder) { return $this->inspect($owner, $fileId); }
        if ($fileId < 1) { throw new MediaException('Invalid source ID.'); }
        try {
            $home = $this->rootFolder->getUserFolder($owner);
            $nodes = $home->getById($fileId);
            $node = count($nodes) === 1 ? reset($nodes) : null;
            if (!$node instanceof Folder || !$node->isReadable() || $node->getId() === $home->getId()) {
                throw new MediaException('Source folder is not accessible.', 404);
            }
            return null;
        } catch (NotFoundException|NotPermittedException) {
            throw new MediaException('Source folder is not accessible.', 404);
        }
    }
    public function file(string $owner, int $fileId, ?array $expected = null): File {
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
            return $file;
        } catch (NotFoundException|NotPermittedException $e) {
            throw new MediaException('File is not accessible. Rebind explicitly.', 404);
        }
    }
    public function inspect(string $owner, int $fileId, ?array $expected = null): array {
        $file = $this->file($owner, $fileId, $expected);
        $home = $this->rootFolder->getUserFolder($owner);
        return ['nextcloud_file_id' => $fileId, 'storage_reference' => hash('sha256', $file->getStorage()->getId()),
            'last_known_path' => $home->getRelativePath($file->getPath()), 'mime_type' => $file->getMimeType(),
            'file_size' => (int)$file->getSize(), 'updated_at' => time()];
    }

}
