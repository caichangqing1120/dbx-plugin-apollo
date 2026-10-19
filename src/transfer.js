import { decodeBytes } from "./portal.js";

export function multipartFile(
  bytes,
  name,
  type = "application/octet-stream",
  boundary = "dbx-" + crypto.randomUUID(),
) {
  if (!/^[a-zA-Z0-9-]+$/.test(boundary))
    throw Error("Invalid multipart boundary");
  const safeName = String(name || "config.zip").replace(/["\r\n\\/]/g, "_");
  const safeType = /^[\w.+-]+\/[\w.+-]+$/.test(type)
    ? type
    : "application/octet-stream";
  const head = new TextEncoder().encode(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${safeName}"\r\nContent-Type: ${safeType}\r\n\r\n`,
  );
  const tail = new TextEncoder().encode(`\r\n--${boundary}--\r\n`);
  if (head.length + bytes.length + tail.length > 4 * 1024 * 1024)
    throw Error(
      "File exceeds the 4 MiB transport limit (including multipart headers)",
    );
  const result = new Uint8Array(head.length + bytes.length + tail.length);
  result.set(head);
  result.set(bytes, head.length);
  result.set(tail, head.length + bytes.length);
  return {
    bytes: result,
    contentType: "multipart/form-data; boundary=" + boundary,
  };
}
export function downloadName(disposition, fallback = "apollo-configs.zip") {
  let value = disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (value) {
    try {
      value = decodeURIComponent(value);
    } catch {
      value = "";
    }
  } else {
    const quoted = disposition?.match(/filename="([^"]*)"/i);
    value = quoted ? quoted[1] : disposition?.match(/filename=([^;]+)/i)?.[1];
  }
  value = (value || "")
    .split(/[\\/]/)
    .pop()
    .replace(/[\x00-\x1f]/g, "_")
    .trim();
  return value && value !== "." && value !== ".."
    ? value.slice(0, 240)
    : fallback;
}

export async function saveHostFile(host, fileName, response) {
  const bytes = decodeBytes(response.bodyBase64),
    contentType =
      response.headers["content-type"] || "application/octet-stream";
  if (host.fileTransfer?.beginSave) {
    const target = await host.fileTransfer.beginSave({
      name: fileName,
      contentType,
      size: bytes.length,
    });
    if (!target) return { canceled: true };
    try {
      if (!host.fileTransfer.write || !host.fileTransfer.finish)
        throw Error("Host file transfer API is incomplete");
      const chunkBytes = Math.min(target.chunkBytes || 128 * 1024, 128 * 1024);
      if (!Number.isInteger(chunkBytes) || chunkBytes <= 0)
        throw Error("Invalid Host file chunk size");
      for (let offset = 0; offset < bytes.length; offset += chunkBytes) {
        const part = bytes.subarray(
          offset,
          Math.min(bytes.length, offset + chunkBytes),
        );
        const ack = await host.fileTransfer.write(
          target.handleId,
          offset,
          part,
        );
        if (
          ack?.written !== part.length ||
          ack.nextOffset !== offset + part.length
        )
          throw Error("Host did not write the complete file chunk");
      }
      return await host.fileTransfer.finish(target.handleId);
    } catch (error) {
      await host.fileTransfer.cancel?.(target.handleId).catch(() => {});
      throw error;
    }
  }
  if (bytes.length > 1024 * 1024)
    throw Error(
      "This Host requires an update for chunked file saving above 1 MiB",
    );
  return host.request("host.saveFile", {
    fileName,
    contentType,
    dataBase64: response.bodyBase64,
  });
}
