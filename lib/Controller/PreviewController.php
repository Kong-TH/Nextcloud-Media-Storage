<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Controller;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\Response;
use OCP\AppFramework\Http\JSONResponse;
use OCP\AppFramework\Http\FileDisplayResponse;
use OCP\AppFramework\Http\RedirectResponse;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\AppFramework\Http\Attribute\NoCSRFRequired;
use OCP\IRequest;
use OCP\IUserSession;
use OCP\IPreview;
use OCP\IURLGenerator;
use OCA\MediaStorage\Db\NodeStore;
use OCA\MediaStorage\Service\MediaStorageService;
use OCA\MediaStorage\Exception\MediaException;
final class PreviewController extends Controller {
    private const HEADERS = ['Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff', 'Cross-Origin-Resource-Policy' => 'same-origin'];
    public function __construct(IRequest $request, private IUserSession $session, private NodeStore $nodes,
        private MediaStorageService $storage, private IPreview $preview, private IURLGenerator $urls) { parent::__construct('mediastorage', $request); }
    private function respond(string $id, bool $content, bool $large = false): Response {
        try {
            $owner = $this->session->getUser()?->getUID() ?? throw new MediaException('Authentication required.', 401);
            $node = $this->nodes->get($owner, $id);
            $binding = $this->nodes->binding($owner, $id);
            if ($node['node_type'] !== 'media' || !$binding) { throw new MediaException('Preview not available.', 404); }
            $file = $this->storage->file($owner, (int)$binding['nextcloud_file_id'], $binding);
            if ($content) {
                // Resolve current path again; DAV supplies its own permission and Range handling.
                $info = $this->storage->inspect($owner, (int)$file->getId(), $binding);
                $segments = array_map('rawurlencode', array_filter(explode('/', $info['last_known_path']), fn($p) => $p !== ''));
                return new RedirectResponse($this->urls->getBaseUrl() . '/remote.php/dav/files/' . rawurlencode($owner) . '/' . implode('/', $segments), 303, self::HEADERS);
            }
            if (!$this->preview->isAvailable($file)) { throw new MediaException('Preview not available for this file.', 404); }
            $image = $this->preview->getPreview($file, $large ? 1280 : 96, $large ? 960 : 96, !$large, IPreview::MODE_FILL);
            return new FileDisplayResponse($image, 200, self::HEADERS + ['Content-Type' => $image->getMimeType()]);
        } catch (MediaException $e) { return new JSONResponse(['error' => $e->getMessage()], $e->status, self::HEADERS); }
        catch (\Throwable) { return new JSONResponse(['error' => 'Preview unavailable. Retry or inspect the original in Nextcloud.'], 404, self::HEADERS); }
    }
    #[NoAdminRequired]
    #[NoCSRFRequired]
    public function image(string $id, string $size = 'small'): Response { return $this->respond($id, false, $size === 'large'); }
    #[NoAdminRequired]
    #[NoCSRFRequired]
    public function content(string $id): Response { return $this->respond($id, true); }
}
