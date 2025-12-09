export let TESTING = Bun.env.NODE_ENV === "test";
// TESTING = true;

export const logIfTesting: typeof console.log = (...args) => {
  if (!TESTING) return;
  return console.log(...args);
};