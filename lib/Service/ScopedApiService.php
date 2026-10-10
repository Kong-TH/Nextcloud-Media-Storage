<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Service;
use OCA\MediaStorage\Db\NodeStore;
use OCA\MediaStorage\Exception\MediaException;
final class ScopedApiService {
    public function __construct(private ApiTokenService $tokens, private NodeStore $nodes, private VirtualFileSystemService $vfs, private DeliveryProtectionService $protection) {}
    public function access(string $header, string $scope, callable $operation): mixed {
        $this->protection->request('external');
        $initial = $this->tokens->authenticate($header);
        return $this->tokens->locked($initial['owner_id'], function () use ($header, $scope, $operation) {
            // Recheck revocation/expiry after taking the same lock as token management.
            $token = $this->tokens->authenticate($header);
            $this->protection->token($token);
            if (!in_array($scope, json_decode($token['scopes'], true, 8, JSON_THROW_ON_ERROR), true)) { throw new MediaException('Insufficient token scope.', 403); }
            $result = $operation($token); $this->tokens->used($token); return $result;
        });
    }
    public function contains(array $token, string $id): void {
        if ($token['folder_id'] === null) { $this->nodes->get($token['owner_id'], $id); return; }
        $seen = []; $cursor = $id;
        while ($cursor !== '') {
            if (isset($seen[$cursor]) || count($seen) >= 128) { break; }
            $seen[$cursor] = true; $node = $this->nodes->get($token['owner_id'], $cursor);
            if ($cursor === $token['folder_id']) { return; }
            $cursor = $node['parent_id'];
        }
        throw new MediaException('Outside token folder restriction.', 403);
    }
    private function view(array $token, array $node): array {
        unset($node['name_key'], $node['lock_version'], $node['owner_id']);
        // A folder credential must not expose physical paths or names above its boundary.
        if (isset($node['binding'])) {
            $node['media'] = ['mime_type' => $node['binding']['mime_type'], 'file_size' => $node['binding']['file_size']];
        }
        unset($node['binding']);
        if ($token['folder_id'] !== null) {
            $parts = []; $cursor = $node;
            while ($cursor['id'] !== $token['folder_id']) {
                $parts[] = $cursor['name']; $cursor = $this->nodes->get($token['owner_id'], $cursor['parent_id']);
            }
            $node['virtual_path'] = '/' . implode('/', array_reverse($parts));
            if ($node['id'] === $token['folder_id']) { $node['parent_id'] = null; }
        }
        return $node;
    }
    public function listing(array $token, ?string $parent, string $search, int $limit, int $offset): array {
        if ($token['folder_id'] !== null) {
            $parent ??= $token['folder_id']; $this->contains($token, $parent);
            // Restrict search to one accessible parent; do not scan the owner's full tree then filter.
        } elseif ($parent !== null) { $this->contains($token, $parent); }
        $result = $this->vfs->listing($token['owner_id'], $parent, $search, $limit, $offset);
        $result['nodes'] = array_map(fn($node) => $this->view($token, $node), $result['nodes']);
        if ($token['folder_id'] !== null) { $result['root_id'] = $token['folder_id']; }
        return $result;
    }
    public function show(array $token, string $id): array {
        $this->contains($token, $id); return $this->view($token, $this->vfs->show($token['owner_id'], $id));
    }
    public function create(array $token, string $name, ?string $parent, ?int $fileId = null): array {
        if ($fileId !== null && $token['folder_id'] !== null) { throw new MediaException('Restricted tokens cannot bind physical file IDs.', 403); }
        $parent ??= $token['folder_id'] ?? $this->vfs->root($token['owner_id'])['id'];
        $this->contains($token, $parent);
        return $this->view($token, $this->vfs->create($token['owner_id'], $name, $parent, $fileId));
    }
    private function mutable(array $token, string $id): void {
        $this->contains($token, $id);
        if ($id === $token['folder_id']) { throw new MediaException('Token boundary cannot be changed.', 403); }
        // Moving/deleting a folder affects every descendant. Scope follows the hierarchy.
    }
    public function update(array $token, string $id, ?string $name, ?string $parent): array {
        $this->mutable($token, $id);
        if ($parent !== null) { $this->contains($token, $parent); }
        return $this->view($token, $this->vfs->update($token['owner_id'], $id, $name, $parent));
    }
    public function destroy(array $token, string $id): void {
        $this->mutable($token, $id); $this->vfs->destroy($token['owner_id'], $id);
    }
    public function rebind(array $token, string $id, int $fileId): array {
        if ($token['folder_id'] !== null) { throw new MediaException('Restricted tokens cannot rebind physical file IDs.', 403); }
        $this->contains($token, $id); return $this->view($token, $this->vfs->rebind($token['owner_id'], $id, $fileId));
    }
}
