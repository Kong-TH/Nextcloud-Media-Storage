<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Controller;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\Response;
use OCP\AppFramework\Http\JSONResponse;
use OCP\AppFramework\Http\Attribute\PublicPage;
use OCP\AppFramework\Http\Attribute\NoCSRFRequired;
use OCP\IRequest;
use OCP\IURLGenerator;
use OCA\MediaStorage\Service\PathMediaService;
use OCA\MediaStorage\Http\BoundedStreamResponse;
use OCA\MediaStorage\Http\HeadResponse;
use OCA\MediaStorage\Exception\MediaException;
final class PathMediaController extends Controller {
    private const HEADERS = ['Cache-Control' => 'private, no-store', 'Pragma' => 'no-cache',
        'Referrer-Policy' => 'no-referrer', 'X-Content-Type-Options' => 'nosniff'];
    public function __construct(IRequest $request, private PathMediaService $media, private IURLGenerator $urls) { parent::__construct('mediastorage', $request); }
    private function error(MediaException $error): JSONResponse {
        $headers = self::HEADERS + $error->headers;
        if ($error->status === 401) { $headers['WWW-Authenticate'] = 'Bearer realm="mediastorage"'; }
        return new JSONResponse(['error' => $error->getMessage()], $error->status, $headers);
    }
    #[PublicPage]
    #[NoCSRFRequired]
    public function read(string $path, ?string $bucket = null): Response {
        try {
            $head = $this->request->getMethod() === 'HEAD'; $conditions = [];
            foreach (['Range', 'If-Range', 'If-Match', 'If-Unmodified-Since', 'If-None-Match', 'If-Modified-Since'] as $header) { $conditions[$header] = $this->request->getHeader($header); }
            $result = $this->media->read($this->request->getHeader('Authorization'), $path, $bucket, $head, $conditions);
            $headers = self::HEADERS + $result['headers'] + ['Content-Type' => $result['mime'],
                'Content-Disposition' => 'inline; filename="media"; filename*=UTF-8\'\'' . rawurlencode($result['name'])];
            return $result['body'] ? new BoundedStreamResponse($result['stream'], $result['length'], $result['status'], $headers, $result['release'], $result['deadline'])
                : new HeadResponse($result['status'], $headers);
        } catch (MediaException $error) { return $this->error($error); }
        catch (\Throwable) { return new JSONResponse(['error' => 'Media stream unavailable.'], 503, self::HEADERS); }
    }
    #[PublicPage]
    #[NoCSRFRequired]
    public function create(string $path, ?string $bucket = null, ?int $ttl_seconds = null): Response {
        try {
            $result = $this->media->issue($this->request->getHeader('Authorization'), $path, $bucket, $ttl_seconds);
            $url = $this->urls->linkToRouteAbsolute('mediastorage.delivery.read', ['id' => $result['access']['id'], 'key' => $result['key']]);
            return new JSONResponse(['url' => $url, 'expires_at' => $result['access']['expires_at']], 201, self::HEADERS);
        } catch (MediaException $error) { return $this->error($error); }
        catch (\Throwable) { return new JSONResponse(['error' => 'Temporary access unavailable.'], 503, self::HEADERS); }
    }
}
