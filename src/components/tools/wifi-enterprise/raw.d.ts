/* Vite's `?raw` suffix imports a file's text as a string at build time.
   The guide imports its lab-verified config files this way so the page
   shows exactly the bytes that were tested. */
declare module "*?raw" {
  const content: string;
  export default content;
}
