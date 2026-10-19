export async function loadNamespaceAssignments(route, client, fallbackEnvs = []) {
  const envs = client.environments ? await client.environments() : fallbackEnvs;
  const [global, environments] = await Promise.all([
    client.roleUsers(route),
    Promise.all(envs.map(async env => [env, await client.envRoleUsers({ ...route, env })])),
  ]);
  return { roleEnvs: envs, roles: global, roleAssignments: Object.fromEntries([['', global], ...environments]) };
}
