<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
$nextcloud = getenv('NEXTCLOUD_SOURCE') ?: '/snap/nextcloud/current/htdocs';
if (!is_file($nextcloud . '/3rdparty/autoload.php')) {
    fwrite(STDERR, "Set NEXTCLOUD_SOURCE to the Nextcloud 34 source directory.\n"); exit(2);
}
$loader = require $nextcloud . '/3rdparty/autoload.php';
$loader->setClassMapAuthoritative(false);
$loader->addPsr4('OCP\\', $nextcloud . '/lib/public/');
$loader->addPsr4('OC\\', $nextcloud . '/lib/private/');
$loader->addPsr4('OCA\\MediaStorage\\', dirname(__DIR__) . '/lib/');

/** Strict doubles generated from installed public interfaces; unconfigured calls fail. */
function double(string $interface, array $handlers): object {
    static $counter = 0;
    $class = 'MediaStorageTestDouble' . ++$counter;
    $renderType = function (?ReflectionType $type) use (&$renderType): string {
        if ($type === null) return '';
        if ($type instanceof ReflectionUnionType) return implode('|', array_map($renderType, $type->getTypes()));
        if ($type instanceof ReflectionIntersectionType) return implode('&', array_map($renderType, $type->getTypes()));
        $name = $type->getName();
        return ($type->allowsNull() && !in_array($name, ['mixed', 'null'], true) ? '?' : '') . ($type->isBuiltin() ? '' : '\\') . $name;
    };
    $code = 'class ' . $class . ' implements \\' . $interface . ' { public function __construct(public array $handlers) {}';
    foreach ((new ReflectionClass($interface))->getMethods() as $method) {
        $params = [];
        foreach ($method->getParameters() as $p) {
            $signature = ($p->hasType() ? $renderType($p->getType()) . ' ' : '') . ($p->isPassedByReference() ? '&' : '') . ($p->isVariadic() ? '...' : '') . '$' . $p->getName();
            if ($p->isDefaultValueAvailable()) $signature .= ' = ' . var_export($p->getDefaultValue(), true);
            $params[] = $signature;
        }
        $return = $method->getReturnType();
        $code .= 'public function ' . ($method->returnsReference() ? '&' : '') . $method->getName() . '(' . implode(',', $params) . ')' . ($return ? ': ' . $renderType($return) : '') . ' {';
        $code .= 'if (!isset($this->handlers[__FUNCTION__])) throw new \\LogicException("Unexpected call: " . __FUNCTION__); ';
        $code .= ($return && (string)$return === 'void' ? '' : 'return ') . '($this->handlers[__FUNCTION__])(...func_get_args()); }';
    }
    eval($code . '}');
    return new $class($handlers);
}
