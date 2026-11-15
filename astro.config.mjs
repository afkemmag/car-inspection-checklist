// @ts-check
import { defineConfig } from 'astro/config';

// Fully static site — all inspection data lives in the browser's localStorage.
// Deployed to GitHub Pages as a project page: https://afkemmag.github.io/car-inspection-checklist/
export default defineConfig({
  site: 'https://afkemmag.github.io',
  base: '/car-inspection-checklist',
});
