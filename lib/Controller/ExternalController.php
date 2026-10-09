<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Controller;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\JSONResponse;
use OCP\AppFramework\Http\Attribute\PublicPage;
use OCP\AppFramework\Http\Attribute\NoCSRFRequired;
use OCP\IRequest;
use OCA\MediaStorage\Service\ApiTokenService;
use OCA\MediaStorage\Service\ScopedApiService;
use OCA\MediaStorage\Exception\MediaException;
/** Only these endpoints bypass session/CSRF middleware; every method verifies a scoped bearer. */
final class ExternalController extends Controller {
    public function __construct(IRequest $request, private ScopedApiService $api, private ApiTokenService $tokens) { parent::__construct('mediastorage', $request); }
    private function response(string $scope, callable $action, int $status = 200): JSONResponse {
        try {
            $result = $this->api->access($this->request->getHeader('Authorization'), $scope, $action);
            return new JSONResponse($result, $status, ['Cache-Control' => 'no-store', 'Pragma' => 'no-cache']);
        } catch (MediaException $error) {
            $headers = ['Cache-Control' => 'no-store'];
            if ($error->status === 401) { $headers['WWW-Authenticate'] = 'Bearer realm="mediastorage"'; }
            return new JSONResponse(['error' => $error->getMessage()], $error->status, $headers);
        }
    }
    #[PublicPage]
    #[NoCSRFRequired]
    public function index(?string $parent_id = null, string $search = '', int $limit = 100, int $offset = 0): JSONResponse {
        return $this->response('media:read', fn($token) => $this->api->listing($token, $parent_id, $search, $limit, $offset));
    }
    #[PublicPage]
    #[NoCSRFRequired]
    public function show(string $id): JSONResponse { return $this->response('media:read', fn($token) => $this->api->show($token, $id)); }
    #[PublicPage]
    #[NoCSRFRequired]
    public function create(string $name, ?string $parent_id = null): JSONResponse {
        return $this->response('media:manage', fn($token) => $this->api->create($token, $name, $parent_id), 201);
    }
    #[PublicPage]
    #[NoCSRFRequired]
    public function update(string $id, ?string $name = null, ?string $parent_id = null): JSONResponse {
        return $this->response('media:manage', fn($token) => $this->api->update($token, $id, $name, $parent_id));
    }
    #[PublicPage]
    #[NoCSRFRequired]
    public function destroy(string $id): JSONResponse {
        return $this->response('media:delete', function ($token) use ($id) { $this->api->destroy($token, $id); return null; }, 204);
    }
    #[PublicPage]
    #[NoCSRFRequired]
    public function bind(string $name, int $file_id, ?string $parent_id = null): JSONResponse {
        return $this->response('media:manage', fn($token) => $this->api->create($token, $name, $parent_id, $file_id), 201);
    }
    #[PublicPage]
    #[NoCSRFRequired]
    public function rebind(string $id, int $file_id): JSONResponse {
        return $this->response('media:manage', fn($token) => $this->api->rebind($token, $id, $file_id));
    }
    #[PublicPage]
    #[NoCSRFRequired]
    public function tokens(int $limit = 100, int $offset = 0): JSONResponse {
        return $this->response('token:manage', fn($token) => ['tokens' => $this->tokens->listing($token['owner_id'], $limit, $offset)]);
    }
    #[PublicPage]
    #[NoCSRFRequired]
    public function revoke(string $id): JSONResponse {
        return $this->response('token:manage', function ($token) use ($id) { $this->tokens->revoke($token['owner_id'], $id); return null; }, 204);
    }
}
