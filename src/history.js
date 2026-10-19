export function historyRecords(s) {
  return s.history || [];
}

export function selectedHistory(s) {
  const records = historyRecords(s);
  return records.find(record => String(record.id) === String(s.historySelected)) || records[0];
}

export function historyBaseReleaseId(record) {
  return record.operation === 2 && !record.previousReleaseId
    ? record.operationContext?.baseReleaseId ?? 0
    : record.previousReleaseId ?? 0;
}
