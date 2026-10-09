<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
return ['routes' => [
    ['name' => 'page#index', 'url' => '/', 'verb' => 'GET'],
    ['name' => 'node#index', 'url' => '/api/v1/nodes', 'verb' => 'GET'],
    ['name' => 'node#show', 'url' => '/api/v1/nodes/{id}', 'verb' => 'GET'],
    ['name' => 'node#resolve', 'url' => '/api/v1/resolve', 'verb' => 'GET'],
    ['name' => 'node#create', 'url' => '/api/v1/folders', 'verb' => 'POST'],
    ['name' => 'node#update', 'url' => '/api/v1/nodes/{id}', 'verb' => 'PATCH'],
    ['name' => 'node#destroy', 'url' => '/api/v1/nodes/{id}', 'verb' => 'DELETE'],
    ['name' => 'node#bind', 'url' => '/api/v1/bindings', 'verb' => 'POST'],
    ['name' => 'node#rebind', 'url' => '/api/v1/bindings/{id}', 'verb' => 'PATCH'],
]];
