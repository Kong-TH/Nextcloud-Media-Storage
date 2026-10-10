<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Controller;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\Response;
use OCP\AppFramework\Http\JSONResponse;
use OCP\AppFramework\Http\StreamResponse;
use OCP\AppFramework\Http\Attribute\PublicPage;
use OCP\AppFramework\Http\Attribute\NoCSRFRequired;
use OCP\IRequest;
use OCA\MediaStorage\Service\TemporaryAccessService;
use OCA\MediaStorage\Http\HeadResponse;
use OCA\MediaStorage\Exception\MediaException;
final class DeliveryController extends Controller {
    private const HEADERS = ['Cache-Control' => 'private, no-store', 'Pragma' => 'no-cache',
        'Referrer-Policy' => 'no-referrer', 'X-Content-Type-Options' => 'nosniff', 'Accept-Ranges' => 'none'];
    public function __construct(IRequest $request, private TemporaryAccessService $access) { parent::__construct('mediastorage', $request); }
    #[PublicPage]
    #[NoCSRFRequired]
    public function read(string $id, string $key = ''): Response {
        try {
            $head = $this->request->getMethod() === 'HEAD';
            $media = $this->access->read($id, $key, $head);
            $headers = self::HEADERS + ['Content-Type' => $media['mime'], 'Content-Length' => (string)$media['size'],
                'Content-Disposition' => 'inline; filename="media"; filename*=UTF-8\'\'' . rawurlencode($media['name'])];
            return $head ? new HeadResponse(200, $headers) : new StreamResponse($media['stream'], 200, $headers);
        } catch (MediaException $error) {
            return new JSONResponse(['error' => $error->getMessage()], $error->status, self::HEADERS);
        } catch (\Throwable) {
            // Do not log an exception/request containing a capability or storage path.
            return new JSONResponse(['error' => 'Media stream unavailable.'], 503, self::HEADERS);
        }
    }
}
