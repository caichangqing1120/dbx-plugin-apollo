import { test } from "node:test";
import assert from "node:assert/strict";
import { startFixture } from "./fixture.mjs";
test("original reference-page prerequisites use real controller aliases without masking unknown routes", async () => {
  const fixture = await startFixture();
  try {
    const base = `http://127.0.0.1:${fixture.port}`;
    const login = await fetch(base + "/signin", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "username=apollo&password=apollo",
      redirect: "manual",
    });
    const headers = { Cookie: login.headers.get("set-cookie").split(";")[0] };
    const envs = await fetch(base + "/openapi/v1/envs", { headers });
    assert.equal(envs.status, 200);
    assert.deepEqual(await envs.json(), ["DEV", "UAT"]);
    assert.deepEqual(await (await fetch(base + '/apps/SampleApp/miss_envs', { headers })).json(), {entities:[]});
    for (const path of [
      "/apps/SampleApp/initPermission",
      "/apps/SampleApp/envs/DEV/clusters/default/initNsPermission",
    ]) {
      const response = await fetch(base + path, { method: "POST", headers });
      assert.equal(response.status, 200);
      assert.equal(await response.json(), null);
    }
    assert.deepEqual(await(await fetch(base+'/apps/SampleApp/envs/DEV/clusters/default/missing-namespaces',{headers})).json(),{entities:[]});
    const lock = await fetch(
      base +
        "/apps/SampleApp/envs/DEV/clusters/default/namespaces/application/lock-info",
      { headers },
    );
    assert.equal(lock.status, 200);
    const usage = await fetch(
      base + "/apps/SampleApp/namespaces/application/usage",
      { headers },
    );
    assert.equal(usage.status, 200);
    assert.deepEqual(await usage.json(), []);
    assert.equal(
      (await fetch(base + "/unknown/reference-endpoint", { headers })).status,
      404,
    );
  } finally {
    await fixture.close();
  }
});

test("fixture exposes literal role/lock/history DTOs and keeps ItemDTO type after revoke", async () => {
  const fixture = await startFixture();
  try {
    const base = `http://127.0.0.1:${fixture.port}`, headers = { Cookie: 'SESSION=fixture-session' },
      ns = '/apps/SampleApp/envs/DEV/clusters/default/namespaces/application';
    const get = async path => (await fetch(base + path, { headers })).json();
    assert.deepEqual(await get(ns + '/lock-info'), { lockOwner: '', isEmergencyPublishAllowed: false });
    const roles = await get('/apps/SampleApp/namespaces/application/role_users');
    assert.deepEqual(Object.keys(roles).sort(), ['modifyRoleUsers', 'releaseRoleUsers']);
    const [history] = await get(ns + '/releases/histories');
    assert.deepEqual(history.configuration, [{ firstEntity: 'sample.key', secondEntity: 'Initial Apollo value' }]);
    assert.equal(history.previousReleaseId, 0);
    await fetch(base + ns + '/revoke-items', { method: 'PUT', headers });
    const namespace = await get(ns);
    assert.equal(namespace.items[0].item.type, 0);
  } finally { await fixture.close(); }
});

test("explicit fixture scenarios expose real warning contracts and reject unknown scenario names", async () => {
  const fixture = await startFixture();
  try {
    const base = `http://127.0.0.1:${fixture.port}`, headers = { Cookie: 'SESSION=fixture-session', 'Content-Type': 'application/json' }, ns = '/apps/SampleApp/envs/DEV/clusters/default/namespaces/application';
    const set = mode => fetch(base + '/fixture/scenario', { method: 'POST', headers, body: JSON.stringify({ mode }) });
    assert.equal((await set('locked')).status, 200);
    assert.equal((await (await fetch(base + ns + '/lock-info', { headers })).json()).lockOwner, 'alice');
    assert.ok(!Object.hasOwn(await(await fetch(base+ns,{headers})).json(),'lockOwner'));
    await set('self-lock');
    assert.deepEqual(await (await fetch(base + ns + '/lock-info', { headers })).json(), { lockOwner: 'apollo', isEmergencyPublishAllowed: true });
    await set('master-pending');
    assert.equal((await (await fetch(base + ns, { headers })).json()).itemModifiedCnt, 1);
    await set('no-permissions');
    assert.equal((await (await fetch(base + '/permissions/root', {headers})).json()).hasPermission,false);
    await set('no-master');
    assert.equal((await (await fetch(base + '/apps/SampleApp/permissions/CreateCluster', {headers})).json()).hasPermission,false);
    assert.equal((await (await fetch(base + '/apps/SampleApp/namespaces/application/permissions/ModifyNamespace', {headers})).json()).hasPermission,true);
    await set('normal');
    assert.equal((await (await fetch(base + ns + '/lock-info', { headers })).json()).lockOwner, '');
    assert.equal((await set('invented')).status, 400);
  } finally { await fixture.close(); }
});

test('release comparison fixture uses selected real version contents rather than placeholder old/new values',async()=>{
 const fixture=await startFixture();try{
  const base=`http://127.0.0.1:${fixture.port}`,headers={Cookie:'SESSION=fixture-session','Content-Type':'application/json'},ns='/apps/SampleApp/envs/DEV/clusters/default/namespaces/application';
  const before=(await(await fetch(base+ns+'/releases/active',{headers})).json())[0];
  await fetch(base+ns+'/item',{method:'PUT',headers,body:JSON.stringify({key:'sample.key',value:'actually changed',type:0})});
  await fetch(base+ns+'/item',{method:'POST',headers,body:JSON.stringify({key:'new.only',value:'new value',type:0})});
  const after=await(await fetch(base+ns+'/releases',{method:'POST',headers,body:JSON.stringify({releaseTitle:'second'})})).json();
  const result=await(await fetch(base+`/envs/DEV/releases/compare?baseReleaseId=${before.id}&toCompareReleaseId=${after.id}`,{headers})).json();
  const modified=result.changes.find(row=>row.type==='MODIFIED');
  assert.equal(modified.entity.firstEntity.value,'Initial Apollo value');assert.equal(modified.entity.secondEntity.value,'actually changed');
  const added=result.changes.find(row=>row.type==='ADDED');assert.deepEqual(added.entity.firstEntity,{key:'new.only',value:''});assert.deepEqual(added.entity.secondEntity,{key:'new.only',value:'new value'});
 }finally{await fixture.close();}
});

test('rollback fixture changes the active published version without discarding in-progress item edits',async()=>{
 const fixture=await startFixture();try{
  const base=`http://127.0.0.1:${fixture.port}`,headers={Cookie:'SESSION=fixture-session','Content-Type':'application/json'},ns='/apps/SampleApp/envs/DEV/clusters/default/namespaces/application';
  const write=value=>fetch(base+ns+'/item',{method:'PUT',headers,body:JSON.stringify({key:'sample.key',value,type:0})});
  await write('second');const release=await(await fetch(base+ns+'/releases',{method:'POST',headers,body:JSON.stringify({releaseTitle:'second'})})).json();await write('draft to retain');
  await fetch(base+`/envs/DEV/releases/${release.id}/rollback`,{method:'PUT',headers});
  assert.equal((await(await fetch(base+ns+'/items',{headers})).json())[0].value,'draft to retain');
  assert.equal((await(await fetch(base+ns+'/releases/active',{headers})).json())[0].configurations['sample.key'],'Initial Apollo value');
 }finally{await fixture.close();}
});

test('fixture marks newly added and deleted items modified like NamespaceService ItemBO',async()=>{
 const fixture=await startFixture();try{
  const base=`http://127.0.0.1:${fixture.port}`,headers={Cookie:'SESSION=fixture-session','Content-Type':'application/json'},ns='/apps/SampleApp/envs/DEV/clusters/default/namespaces/application';
  await fetch(base+ns+'/branches',{method:'POST',headers,body:'{}'});
  const branch=await(await fetch(base+ns+'/branches',{headers})).json();
  assert.equal(branch.items[0].isNewlyAdded,true);
  assert.equal(branch.items[0].isModified,true);
  assert.equal(branch.itemModifiedCnt,1);
  assert.equal(branch.items[0].oldValue,'');
  assert.equal(branch.items[0].newValue,'Initial Apollo value');
 }finally{await fixture.close();}
});
