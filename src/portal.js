export function encodeBytes(bytes) {
  let result = "";
  for (let i = 0; i < bytes.length; i += 32768)
    result += String.fromCharCode(...bytes.subarray(i, i + 32768));
  return btoa(result);
}
export function decodeBytes(text) {
  return Uint8Array.from(atob(text), (ch) => ch.charCodeAt(0));
}
