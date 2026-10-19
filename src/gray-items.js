export function grayItems(branch, parent) {
  const parents = new Map((parent?.items || []).filter(row => row.item.key).map(row => [row.item.key, row]));
  const branchRows = [], overridden = new Set();
  for (const row of branch?.items || []) {
    const key = row.item.key;
    if (!key) continue;
    const master = parents.get(key), masterReleaseValue = master?.isModified ? master.oldValue : master?.item.value;
    const display = {...row, masterItemExists:!!master, masterReleaseValue};
    // Removing an override restores inheritance; a previously released difference still needs publication.
    if (row.isDeleted && master) {
      if (masterReleaseValue !== row.oldValue) branchRows.push(display);
    } else {
      overridden.add(key);
      branchRows.push(display);
    }
  }
  return {branchRows, masterRows:[...parents.values()].filter(row => !overridden.has(row.item.key))};
}
