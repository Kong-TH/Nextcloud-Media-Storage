<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
script('mediastorage', 'mediastorage-main');
style('mediastorage', 'mediastorage');
?>
<div id="app-content" class="mediastorage-content">
    <div id="mediastorage-root" data-version="<?php p($_['version']); ?>"><p role="status"><?php p($l->t('Loading Media Storage…')); ?></p></div>
    <noscript><?php p($l->t('Enable JavaScript to manage Media Storage.')); ?></noscript>
</div>
