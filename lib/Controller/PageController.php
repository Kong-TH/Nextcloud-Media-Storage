<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
namespace OCA\MediaStorage\Controller;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\AppFramework\Http\Attribute\NoCSRFRequired;
use OCP\IRequest;
final class PageController extends Controller {
    public function __construct(IRequest $request) { parent::__construct('mediastorage', $request); }
    #[NoAdminRequired]
    #[NoCSRFRequired]
    public function index(): TemplateResponse { return new TemplateResponse('mediastorage', 'index'); }
}
