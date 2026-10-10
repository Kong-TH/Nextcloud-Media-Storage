<?php
// SPDX-License-Identifier: AGPL-3.0-or-later
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
use OCA\MediaStorage\Db\NodeStore;
use OCA\MediaStorage\Service\VirtualFileSystemService;
use OCA\MediaStorage\Service\MediaStorageService;
use OCA\MediaStorage\Exception\MediaException;
// Execute installed Nextcloud QueryBuilder SQL through DBAL on an isolated SQLite database.
// Only connection bootstrapping/observability is replaced; queries and rows are real.
final class PagingConnection extends OC\DB\Connection {
    public mixed $onQuery = null;
    public function __construct() { Doctrine\DBAL\Connection::__construct(['driver'=>'pdo_sqlite','memory'=>true], new Doctrine\DBAL\Driver\PDO\SQLite\Driver()); }
    public function connect($connectionName = null) { return Doctrine\DBAL\Connection::connect(); }
    public function getDatabaseProvider(bool $strict = false): string { return 'sqlite'; }
    public function getQueryBuilder(): OCP\DB\QueryBuilder\IQueryBuilder {
        return new OC\DB\QueryBuilder\QueryBuilder(new OC\DB\ConnectionAdapter($this), new OC\SystemConfig(new OC\Config('/tmp/mediastorage-no-config/')), new Psr\Log\NullLogger());
    }
    public function executeQuery(string $sql, array $params = [], $types = [], ?Doctrine\DBAL\Cache\QueryCacheProfile $qcp = null): Doctrine\DBAL\Result {
        if ($this->onQuery !== null) { ($this->onQuery)($sql); }
        return Doctrine\DBAL\Connection::executeQuery(str_replace('*PREFIX*','',$sql),$params,$types,$qcp);
    }
    public function executeStatement($sql, array $params = [], array $types = []): int {
        return Doctrine\DBAL\Connection::executeStatement(str_replace('*PREFIX*','',$sql),$params,$types);
    }
}
$passed=0;
function check(bool $value,string $label):void {global $passed;if(!$value)throw new RuntimeException('FAIL: '.$label);++$passed;}
function denied(callable $operation,int $status,string $label):void {try{$operation();}catch(MediaException $e){check($e->status===$status,$label);return;}throw new RuntimeException('Expected denial: '.$label);}
$db=new PagingConnection();
$db->executeStatement('CREATE TABLE ms_nodes (id TEXT PRIMARY KEY, owner_id TEXT, parent_id TEXT, name TEXT, name_key TEXT, node_type TEXT, lock_version INTEGER DEFAULT 0, created_at INTEGER, updated_at INTEGER)');
$db->executeStatement('CREATE TABLE ms_bindings (virtual_node_id TEXT, owner_id TEXT, mime_type TEXT)');
$store=new NodeStore(new OC\DB\ConnectionAdapter($db));
$root=hash('sha256','mediastorage-root:alice');
$store->insert(['id'=>$root,'owner_id'=>'alice','parent_id'=>'','name'=>'','name_key'=>'root','node_type'=>'root','lock_version'=>1]);
$vfs=new VirtualFileSystemService($store,new MediaStorageService(double(OCP\Files\IRootFolder::class,[])));
foreach([0,1,24,25,26,50,51,100] as $size){
    $db->executeStatement('DELETE FROM ms_nodes WHERE node_type != ?', ['root']);
    for($i=0;$i<$size;$i++)$store->insert(['id'=>'n'.$i,'owner_id'=>'alice','parent_id'=>$root,'name'=>'Item '.sprintf('%03d',$i),'name_key'=>hash('sha256',(string)$i),'node_type'=>'folder']);
    $page=$vfs->objectPage('alice',$root,'','name',25,0,null);$ids=array_column($page['nodes'],'id');
    check(count($ids)===min($size,25)&&$page['total']===$size,'Bounded first page and count '.$size);
    while($page['has_more']){$page=$vfs->objectPage('alice',$root,'','name',25,$page['next_offset'],$page['revision']);$ids=array_merge($ids,array_column($page['nodes'],'id'));}
    check(count($ids)===$size&&count(array_unique($ids))===$size,'Exhaustion without gaps or duplicates '.$size);
}
$store->insert(['id'=>'foreign','owner_id'=>'bob','parent_id'=>$root,'name'=>'Foreign','name_key'=>'foreign','node_type'=>'folder']);
check($vfs->objectPage('alice',$root,'','name',25,0,null)['total']===100,'Owner constraint remains on count and page');
denied(fn()=>$vfs->objectPage('bob',$root,'','name',25,0,null),404,'Foreign parent rejected');
$store->insert(['id'=>'image','owner_id'=>'alice','parent_id'=>$root,'name'=>'AAA image','name_key'=>'image','node_type'=>'media']);
$store->insert(['id'=>'video','owner_id'=>'alice','parent_id'=>$root,'name'=>'AAA video','name_key'=>'video','node_type'=>'media']);
$db->executeStatement('INSERT INTO ms_bindings VALUES (?, ?, ?)',['image','alice','image/png']);
$db->executeStatement('INSERT INTO ms_bindings VALUES (?, ?, ?)',['video','alice','video/mp4']);
$typed=$vfs->objectPage('alice',$root,'','type',25,100,1);
check(array_column($typed['nodes'],'id')===['image','video']&&$typed['nodes'][0]['binding']['mime_type']==='image/png','Type sorting is global and uses joined MIME metadata');
$named=$vfs->objectPage('alice',$root,'','name',25,0,null);check($named['nodes'][0]['id']==='image','Name ordering is applied before pagination');
$filtered=$vfs->objectPage('alice',$root,'Item 00','name',25,0,null);check($filtered['total']===10&&count($filtered['nodes'])===10,'Search total matches direct-child results');
$store->insert(['id'=>'literal','owner_id'=>'alice','parent_id'=>$root,'name'=>'100%_literal','name_key'=>'literal','node_type'=>'folder']);
check($vfs->objectPage('alice',$root,'%_','name',25,0,null)['total']===1,'Search escapes SQL wildcard characters');
$db->executeStatement('UPDATE ms_nodes SET lock_version = 2 WHERE id = ?',[$root]);
denied(fn()=>$vfs->objectPage('alice',$root,'','name',25,25,1),409,'Changed collection rejects shifted offset');
foreach([[26,0,null,'name'],[25,-1,null,'name'],[25,25,null,'name'],[25,0,-1,'name'],[25,0,null,'invalid']] as [$limit,$offset,$revision,$sort])denied(fn()=>$vfs->objectPage('alice',$root,'',$sort,$limit,$offset,$revision),400,'Invalid paging input rejected');
$db->onQuery=function($sql)use($db,$root){if(str_contains($sql,'listing_mime')){$db->onQuery=null;$db->executeStatement('UPDATE ms_nodes SET lock_version = 3 WHERE id = ?',[$root]);}};
denied(fn()=>$vfs->objectPage('alice',$root,'','name',25,0,null),409,'Concurrent mutation during count/page reads rejects mixed result');
$legacy=$vfs->listing('alice',$root,'',100,0);check(count($legacy['nodes'])===100&&!isset($legacy['revision']),'Legacy API contract preserved');
echo "PASS: $passed paging checks with installed Nextcloud QueryBuilder and actual SQLite queries.\n";
