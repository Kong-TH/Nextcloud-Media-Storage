<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Controller;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\JSONResponse;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\IRequest;
use OCP\IUserSession;
use OCA\MediaStorage\Service\BucketService;
use OCA\MediaStorage\Exception\MediaException;
final class BucketController extends Controller {
    public function __construct(IRequest $request, private IUserSession $userSession, private BucketService $buckets) { parent::__construct('mediastorage', $request); }
    private function response(callable $action, int $status = 200): JSONResponse {
        try { $owner = $this->userSession->getUser()?->getUID() ?? throw new MediaException('Authentication required.', 401); return new JSONResponse($action($owner), $status); }
        catch (MediaException $e) { return new JSONResponse(['error' => $e->getMessage()], $e->status); }
    }
    #[NoAdminRequired]
    public function index(int $offset = 0): JSONResponse { return $this->response(fn($owner) => $this->buckets->listing($owner, $offset)); }
    #[NoAdminRequired]
    public function create(string $name): JSONResponse { return $this->response(fn($owner) => $this->buckets->create($owner, $name), 201); }
    #[NoAdminRequired]
    public function rename(string $id, string $name): JSONResponse {
        return $this->response(fn($owner) => $this->buckets->rename($owner, $id, $name));
    }
    #[NoAdminRequired]
    public function clear(string $id): JSONResponse {
        return $this->response(function ($owner) use ($id) { $this->buckets->clear($owner, $id); return null; }, 204);
    }
    #[NoAdminRequired]
    public function destroy(string $id): JSONResponse {
        return $this->response(function ($owner) use ($id) { $this->buckets->destroy($owner, $id); return null; }, 204);
    }

}
