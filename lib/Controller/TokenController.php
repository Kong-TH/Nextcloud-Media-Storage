<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Controller;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\JSONResponse;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\IRequest;
use OCP\IUserSession;
use OCA\MediaStorage\Service\ApiTokenService;
use OCA\MediaStorage\Exception\MediaException;
final class TokenController extends Controller {
    public function __construct(IRequest $request, private IUserSession $session, private ApiTokenService $tokens) { parent::__construct('mediastorage', $request); }
    private function response(callable $action, int $status = 200): JSONResponse {
        try {
            $owner = $this->session->getUser()?->getUID() ?? throw new MediaException('Authentication required.', 401);
            return new JSONResponse($action($owner), $status, ['Cache-Control' => 'no-store', 'Pragma' => 'no-cache']);
        } catch (MediaException $error) { return new JSONResponse(['error' => $error->getMessage()], $error->status, ['Cache-Control' => 'no-store']); }
    }
    #[NoAdminRequired]
    public function index(int $limit = 100, int $offset = 0): JSONResponse {
        return $this->response(fn($owner) => ['tokens' => $this->tokens->listing($owner, $limit, $offset)]);
    }
    #[NoAdminRequired]
    public function create(string $name, array $scopes, int $expires_at, ?string $folder_id = null): JSONResponse {
        return $this->response(fn($owner) => $this->tokens->issue($owner, $name, $scopes, $expires_at, $folder_id), 201);
    }
    #[NoAdminRequired]
    public function destroy(string $id): JSONResponse {
        return $this->response(function ($owner) use ($id) { $this->tokens->revoke($owner, $id); return null; }, 204);
    }
    #[NoAdminRequired]
    public function rotate(string $id): JSONResponse {
        return $this->response(fn($owner) => $this->tokens->rotate($owner, $id), 201);
    }
}
