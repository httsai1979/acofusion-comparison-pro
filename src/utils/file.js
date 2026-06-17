export function baseName(value) {
  return String(value ?? "").replace(/\.[^/.]+$/, "");
}
