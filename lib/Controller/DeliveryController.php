<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Controller;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\Response;
use OCP\AppFramework\Http\JSONResponse;
use OCA\MediaStorage\Http\BoundedStreamResponse;
use OCA\MediaStorage\Service\DeliveryProtectionService;
use OCA\MediaStorage\Service\DeliveryRules;
use OCP\AppFramework\Http\Attribute\PublicPage;
use OCP\AppFramework\Http\Attribute\NoCSRFRequired;
use OCP\IRequest;
use OCA\MediaStorage\Service\TemporaryAccessService;
use OCA\MediaStorage\Http\HeadResponse;
use OCA\MediaStorage\Exception\MediaException;
final class DeliveryController extends Controller {
    private const HEADERS = ['Cache-Control' => 'private, no-store', 'Pragma' => 'no-cache',
        'Referrer-Policy' => 'no-referrer', 'X-Content-Type-Options' => 'nosniff'];
    public function __construct(IRequest $request, private TemporaryAccessService $access, private DeliveryProtectionService $protection) { parent::__construct('mediastorage', $request); }
    #[PublicPage]
    #[NoCSRFRequired]
    public function read(string $id, string $key = ''): Response {
        try {
            $this->protection->request('delivery');
            $head = $this->request->getMethod() === 'HEAD';
            $conditions = [];
            foreach (['Range', 'If-Range', 'If-Match', 'If-Unmodified-Since', 'If-None-Match', 'If-Modified-Since'] as $header) { $conditions[$header] = $this->request->getHeader($header); }
            $media = $this->access->read($id, $key, $head, function (array $metadata, array $row) use ($conditions, $head): array {
                $this->protection->resource($row);
                $plan = DeliveryRules::plan($metadata, $conditions, $head);
                return $plan + ($plan['body'] ? $this->protection->lease($row) : []);
            });
            $headers = self::HEADERS + $media['headers'] + ['Content-Type' => $media['mime'],
                'Content-Disposition' => 'inline; filename="media"; filename*=UTF-8\'\'' . rawurlencode($media['name'])];
            return $media['body'] ? new BoundedStreamResponse($media['stream'], $media['length'], $media['status'], $headers, $media['release'], $media['deadline'])
                : new HeadResponse($media['status'], $headers);
        } catch (MediaException $error) {
            return new JSONResponse(['error' => $error->getMessage()], $error->status, self::HEADERS + $error->headers);
        } catch (\Throwable) {
            // Do not log an exception/request containing a capability or storage path.
            return new JSONResponse(['error' => 'Media stream unavailable.'], 503, self::HEADERS);
        }
    }
}
