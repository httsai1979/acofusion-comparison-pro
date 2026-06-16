export function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[ch]);
}

export function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export function formatNumber(value, digits = 1) {
  return Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : "N/A";
}
