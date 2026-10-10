<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Controller;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\JSONResponse;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\IRequest;
use OCP\IUserSession;
use Psr\Log\LoggerInterface;
use OCA\MediaStorage\Service\UploadService;
use OCA\MediaStorage\Exception\MediaException;
final class UploadController extends Controller {
    public function __construct(IRequest $request, private IUserSession $session, private UploadService $uploads, private LoggerInterface $logger) { parent::__construct('mediastorage', $request); }
    private function response(callable $action): JSONResponse {
        try {
            $owner = $this->session->getUser()?->getUID() ?? throw new MediaException('Authentication required.', 401);
            return new JSONResponse($action($owner), 200, ['Cache-Control' => 'no-store']);
        } catch (MediaException $e) { return new JSONResponse(['error' => $e->getMessage()], $e->status, ['Cache-Control' => 'no-store']); }
        catch (\OCP\Files\NotEnoughSpaceException) { return new JSONResponse(['error' => 'Not enough Nextcloud storage space.'], 507); }
        catch (\OCP\Files\NotPermittedException) { return new JSONResponse(['error' => 'Upload storage is not writable.'], 403); }
        catch (\OCP\Lock\LockedException) { return new JSONResponse(['error' => 'Storage is busy. Retry with the same file.'], 423); }
        catch (\Throwable $error) {
            $this->logger->error('Media Storage upload failed.', ['app' => 'mediastorage', 'exception' => $error]);
            return new JSONResponse(['error' => 'Upload could not finish. Check its status or retry the same file. An original may already exist in Nextcloud.'], 500);
        }
    }
    #[NoAdminRequired]
    public function policy(): JSONResponse { return $this->response(fn($owner) => $this->uploads->policy()); }
    #[NoAdminRequired]
    public function status(string $id): JSONResponse { return $this->response(fn($owner) => $this->uploads->status($owner, $id)); }
    #[NoAdminRequired]
    public function create(string $request_id = '', string $name = '', string $parent_id = ''): JSONResponse {
        return $this->response(fn($owner) => $this->uploads->upload($owner, $request_id, $name, $parent_id, $this->request->getUploadedFile('file') ?? []));
    }
}
