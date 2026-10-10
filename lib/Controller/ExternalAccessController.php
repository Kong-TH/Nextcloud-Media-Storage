<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Controller;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\JSONResponse;
use OCP\AppFramework\Http\Attribute\PublicPage;
use OCP\AppFramework\Http\Attribute\NoCSRFRequired;
use OCP\IRequest;
use OCP\IURLGenerator;
use OCA\MediaStorage\Service\TemporaryAccessService;
use OCA\MediaStorage\Service\ScopedApiService;
use OCA\MediaStorage\Exception\MediaException;
final class ExternalAccessController extends Controller {
    public function __construct(IRequest $request, private ScopedApiService $api, private TemporaryAccessService $access, private IURLGenerator $urls) { parent::__construct('mediastorage', $request); }
    private function respond(callable $action, int $status): JSONResponse {
        try {
            return new JSONResponse($this->api->access($this->request->getHeader('Authorization'), 'media:read', $action), $status,
                ['Cache-Control' => 'no-store', 'Referrer-Policy' => 'no-referrer']);
        } catch (MediaException $error) {
            $headers = ['Cache-Control' => 'no-store'] + $error->headers;
            if ($error->status === 401) { $headers['WWW-Authenticate'] = 'Bearer realm="mediastorage"'; }
            return new JSONResponse(['error' => $error->getMessage()], $error->status, $headers);
        }
    }
    #[PublicPage]
    #[NoCSRFRequired]
    public function create(string $id, ?int $ttl_seconds = null): JSONResponse {
        return $this->respond(function ($token) use ($id, $ttl_seconds) {
            $result = $this->access->issue($token['owner_id'], $id, $ttl_seconds, $token);
            $result['url'] = $this->urls->linkToRouteAbsolute('mediastorage.delivery.read', ['id' => $result['access']['id'], 'key' => $result['key']]);
            unset($result['key']); return $result;
        }, 201);
    }
    #[PublicPage]
    #[NoCSRFRequired]
    public function destroy(string $id): JSONResponse {
        return $this->respond(function ($token) use ($id) { $this->access->revoke($token['owner_id'], $id, $token); return null; }, 204);
    }
}
