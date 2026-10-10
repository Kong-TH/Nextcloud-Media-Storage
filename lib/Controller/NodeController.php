<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Controller;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\JSONResponse;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\IRequest;
use OCP\IUserSession;
use OCA\MediaStorage\Service\VirtualFileSystemService;
use OCA\MediaStorage\Exception\MediaException;
final class NodeController extends Controller {
    public function __construct(IRequest $request, private IUserSession $userSession, private VirtualFileSystemService $vfs) {
        parent::__construct('mediastorage', $request);
    }
    private function owner(): string { return $this->userSession->getUser()?->getUID() ?? throw new MediaException('Authentication required.', 401); }
    private function response(callable $operation, int $status = 200): JSONResponse {
        try { return new JSONResponse($operation($this->owner()), $status); }
        catch (MediaException $e) { return new JSONResponse(['error' => $e->getMessage()], $e->status); }
    }
    #[NoAdminRequired]
    public function index(?string $parent_id = null, string $search = '', int $limit = 100, int $offset = 0, bool $paged = false, string $sort = 'name', ?int $revision = null): JSONResponse {
        return $this->response(fn($owner) => $paged ? $this->vfs->objectPage($owner, $parent_id, $search, $sort, $limit, $offset, $revision)
            : $this->vfs->listing($owner, $parent_id, $search, $limit, $offset));
    }
    #[NoAdminRequired]
    public function show(string $id): JSONResponse { return $this->response(fn($owner) => $this->vfs->show($owner, $id)); }
    #[NoAdminRequired]
    public function resolve(string $path = '/'): JSONResponse { return $this->response(fn($owner) => $this->vfs->resolve($owner, $path)); }
    #[NoAdminRequired]
    public function create(string $name, ?string $parent_id = null): JSONResponse {
        return $this->response(fn($owner) => $this->vfs->create($owner, $name, $parent_id), 201);
    }
    #[NoAdminRequired]
    public function update(string $id, ?string $name = null, ?string $parent_id = null): JSONResponse {
        return $this->response(fn($owner) => $this->vfs->update($owner, $id, $name, $parent_id));
    }
    #[NoAdminRequired]
    public function destroy(string $id): JSONResponse {
        return $this->response(function ($owner) use ($id) { $this->vfs->destroy($owner, $id); return null; }, 204);
    }
    #[NoAdminRequired]
    public function bind(string $name, int $file_id, ?string $parent_id = null): JSONResponse {
        return $this->response(fn($owner) => $this->vfs->create($owner, $name, $parent_id, $file_id), 201);
    }
    #[NoAdminRequired]
    public function copy(string $id, string $parent_id, ?string $name = null): JSONResponse {
        return $this->response(fn($owner) => $this->vfs->copy($owner, $id, $parent_id, $name), 201);
    }
    #[NoAdminRequired]
    public function rebind(string $id, int $file_id): JSONResponse {
        return $this->response(fn($owner) => $this->vfs->rebind($owner, $id, $file_id));
    }
}
