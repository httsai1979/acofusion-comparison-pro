export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

export function setText(selector, value) {
  const el = typeof selector === "string" ? $(selector) : selector;
  if (el) el.textContent = value;
}
