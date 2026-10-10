<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Service;
use OCP\Files\IRootFolder;
use OCP\Files\Folder;
use OCP\Files\File;
use OCP\Files\IMimeTypeDetector;
use OCP\IConfig;
use OCA\MediaStorage\Db\NodeStore;
use OCA\MediaStorage\Db\UploadStore;
use OCA\MediaStorage\Exception\MediaException;
final class UploadService {
    public function __construct(private IRootFolder $rootFolder, private IMimeTypeDetector $mime, private IConfig $config,
        private NodeStore $nodes, private UploadStore $uploads, private VirtualFileSystemService $vfs) {}
    public function policy(): array {
        $max = max(1, min(1073741824, (int)$this->config->getAppValue('mediastorage', 'max_upload_bytes', '104857600')));
        $fileLimit = UploadRules::bytes((string)ini_get('upload_max_filesize'));
        $postLimit = UploadRules::bytes((string)ini_get('post_max_size'));
        if ($fileLimit > 0) { $max = min($max, $fileLimit); }
        // Reserve multipart/header overhead rather than promising the entire POST limit.
        if ($postLimit > 0) { $max = min($max, max(0, $postLimit - 65536)); }
        return ['max_bytes' => $max, 'mime_types' => array_keys(UploadRules::EXTENSIONS), 'storage_pattern' => 'Media Storage/YYYY-MM-DD/',
            'date_basis' => 'Account timezone, falling back to UTC'];
    }
    private function locked(string $owner, callable $action): mixed {
        $root = $this->vfs->root($owner); return $this->nodes->transaction($owner, $root['id'], $action);
    }
    public function status(string $owner, string $id): array {
        UploadRules::id($id);
        return $this->locked($owner, function () use ($owner, $id) {
            $row = $this->uploads->find($owner, $id);
            if (!$row) { return ['state' => 'not_received']; }
            if ($row['state'] !== 'complete') { return ['state' => 'pending']; }
            try { $node = $this->nodes->get($owner, $row['node_id']); }
            catch (MediaException $e) { if ($e->status !== 404) { throw $e; } return ['state' => 'removed']; }
            return ['state' => 'complete', 'node' => $node];
        });
    }
    public function upload(string $owner, string $id, string $name, string $parent, array $file): array {
        UploadRules::id($id); NodeRules::name($name);
        $uploadError = (int)($file['error'] ?? UPLOAD_ERR_NO_FILE);
        if (in_array($uploadError, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)) { throw new MediaException('File exceeds the upload size limit.', 413); }
        if ($uploadError !== UPLOAD_ERR_OK) { throw new MediaException('Upload incomplete. Choose the file and retry.', 400); }
        $temp = (string)($file['tmp_name'] ?? '');
        if (!is_uploaded_file($temp)) { throw new MediaException('Invalid uploaded file.'); }
        return $this->accept($owner, $id, $name, $parent, $temp);
    }
    /** Internal validated-file entry point; never expose a client-selected local path. */
    public function accept(string $owner, string $id, string $name, string $parent, string $temp): array {
        UploadRules::id($id); NodeRules::name($name);
        $size = filesize($temp);
        if ($size === false || $size < 1) { throw new MediaException('Choose a non-empty file.'); }
        if ($size > $this->policy()['max_bytes']) { throw new MediaException('File exceeds the upload size limit.', 413); }
        $mime = $this->mime->detectContent($temp); NodeRules::mediaType($mime);
        $hash = hash_file('sha256', $temp);
        if ($hash === false) { throw new MediaException('Could not read the uploaded file.', 400); }
        $fingerprint = UploadRules::fingerprint($parent, $name, $hash, $size);
        // Commit a reservation first, so a failed response or interrupted write can be reconciled.
        $plan = $this->locked($owner, function () use ($owner, $id, $parent, $name, $fingerprint, $mime) {
            $old = $this->uploads->find($owner, $id);
            if ($old) {
                if (!hash_equals($old['fingerprint'], $fingerprint)) { throw new MediaException('Upload ID already belongs to a different file or destination.', 409); }
                return $old;
            }
            $this->vfs->validateCreation($owner, $name, $parent);
            $now = time(); $day = UploadRules::date($now, $this->config->getUserValue($owner, 'core', 'timezone', 'UTC'));
            $row = ['owner_id' => $owner, 'id' => $id, 'fingerprint' => $fingerprint, 'physical_path' => 'Media Storage/' . $day . '/' . bin2hex(random_bytes(16)) . '.' . UploadRules::EXTENSIONS[$mime],
                'state' => 'pending', 'node_id' => '', 'created_at' => $now];
            $this->uploads->insert($row); return $row;
        });
        return $this->locked($owner, function () use ($owner, $id, $name, $parent, $temp, $size, $hash, $plan) {
            $current = $this->uploads->find($owner, $id);
            if ($current['state'] === 'complete') {
                try { return ['state' => 'complete', 'node' => $this->nodes->get($owner, $current['node_id'])]; }
                catch (MediaException $e) { if ($e->status !== 404) { throw $e; } throw new MediaException('This upload completed, but its reference was removed. Add an existing-file link instead.', 410); }
            }
            $this->vfs->validateCreation($owner, $name, $parent);
            $home = $this->rootFolder->getUserFolder($owner); $folder = $home;
            $segments = explode('/', $plan['physical_path']); $filename = array_pop($segments);
            foreach ($segments as $segment) {
                if ($folder->nodeExists($segment)) { $next = $folder->get($segment); }
                else {
                    if (!$folder->isCreatable()) { throw new MediaException('Upload storage is not writable.', 403); }
                    try { $next = $folder->newFolder($segment); }
                    catch (\OCP\Files\AlreadyExistsException) { $next = $folder->get($segment); }
                }
                if (!$next instanceof Folder) { throw new MediaException('Upload storage path is occupied by a file. Manage it in Nextcloud.', 409); }
                if ($next->getOwner()?->getUID() !== $owner) { throw new MediaException('Upload storage must belong to your account, not an incoming shared folder.', 403); }
                $folder = $next;
            }
            if ($folder->nodeExists($filename)) {
                $original = $folder->get($filename);
                if (!$original instanceof File || !$original->isReadable() || (int)$original->getSize() !== $size) {
                    throw new MediaException('An incomplete or changed original exists. Manage it in Nextcloud before starting a new upload.', 409);
                }
                $stream = $original->fopen('rb');
                if (!is_resource($stream)) { throw new MediaException('Cannot verify the existing original.', 409); }
                try { $context = hash_init('sha256'); hash_update_stream($context, $stream); $existingHash = hash_final($context); }
                finally { fclose($stream); }
                if (!hash_equals($hash, $existingHash)) { throw new MediaException('Original contents changed. Manage the original in Nextcloud; it will not be overwritten.', 409); }
            } else {
                if (!$folder->isCreatable()) { throw new MediaException('Upload storage is not writable.', 403); }
                $free = $folder->getFreeSpace();
                if ($free >= 0 && $size > $free) { throw new MediaException('Not enough Nextcloud storage space.', 507); }
                $stream = fopen($temp, 'rb');
                if (!is_resource($stream)) { throw new MediaException('Could not read the uploaded file.'); }
                try { $original = $folder->newFile($filename, $stream); }
                finally {
                    // Nextcloud may consume and close the supplied input stream.
                    if (is_resource($stream)) { fclose($stream); }
                }
                if ((int)$original->getSize() !== $size) { throw new MediaException('Original write was incomplete. The file is retained in Nextcloud for recovery; it will not be overwritten.', 409); }
            }
            $node = $this->vfs->create($owner, $name, $parent, (int)$original->getId());
            $this->uploads->complete($owner, $id, $node['id']);
            return ['state' => 'complete', 'node' => $node];
        });
    }
}
