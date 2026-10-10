<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Controller;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\JSONResponse;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\IRequest;
use OCP\IUserSession;
use OCP\IURLGenerator;
use OCA\MediaStorage\Service\TemporaryAccessService;
use OCA\MediaStorage\Exception\MediaException;
final class AccessController extends Controller {
    public function __construct(IRequest $request, private IUserSession $session, private TemporaryAccessService $access, private IURLGenerator $urls) { parent::__construct('mediastorage', $request); }
    private function respond(callable $action, int $status = 200): JSONResponse {
        try {
            $owner = $this->session->getUser()?->getUID() ?? throw new MediaException('Authentication required.', 401);
            return new JSONResponse($action($owner), $status, ['Cache-Control' => 'no-store', 'Referrer-Policy' => 'no-referrer']);
        } catch (MediaException $error) { return new JSONResponse(['error' => $error->getMessage()], $error->status, ['Cache-Control' => 'no-store']); }
    }
    #[NoAdminRequired]
    public function create(string $id, ?int $ttl_seconds = null): JSONResponse {
        return $this->respond(function ($owner) use ($id, $ttl_seconds) {
            $result = $this->access->issue($owner, $id, $ttl_seconds);
            $result['url'] = $this->urls->linkToRouteAbsolute('mediastorage.delivery.read', ['id' => $result['access']['id'], 'key' => $result['key']]);
            unset($result['key']); return $result;
        }, 201);
    }
    #[NoAdminRequired]
    public function index(string $id, int $limit = 100, int $offset = 0): JSONResponse { return $this->respond(fn($owner) => $this->access->listing($owner, $id, $limit, $offset)); }
    #[NoAdminRequired]
    public function destroy(string $id): JSONResponse { return $this->respond(function ($owner) use ($id) { $this->access->revoke($owner, $id); return null; }, 204); }
}
