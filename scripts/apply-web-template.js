// scripts/apply-web-template.js
//
// Post-build script: overwrites dist/index.html with our custom
// template so Google and other crawlers see the SEO fallback content.
//
// Why: Expo SDK 50+ with the Metro web bundler ignores web/index.html
// and always generates its own minimal HTML shell. This script runs
// after `expo export` and injects the correct template.

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const templatePath = path.join(projectRoot, 'web', 'index.html');
const distPath = path.join(projectRoot, 'dist', 'index.html');

if (!fs.existsSync(templatePath)) {
  console.error('❌ web/index.html not found. Aborting post-build.');
  process.exit(1);
}

if (!fs.existsSync(distPath)) {
  console.error('❌ dist/index.html not found. Did the export run?');
  process.exit(1);
}

// Read what Metro generated so we can preserve its script tag
const distHtml = fs.readFileSync(distPath, 'utf8');
const scriptMatch = distHtml.match(
  /<script[^>]*src="[^"]*_expo\/static\/js\/web\/[^"]*"[^>]*><\/script>/
);

if (!scriptMatch) {
  console.warn('⚠️ No Expo web bundle script found in dist/index.html');
}

const bundleScript = scriptMatch ? scriptMatch[0] : '';

// Read our template and inject the bundle script before </body>
let template = fs.readFileSync(templatePath, 'utf8');

if (template.includes(bundleScript)) {
  console.log('ℹ️ Template already contains the bundle script.');
} else {
  template = template.replace(
    '</body>',
    `  ${bundleScript}\n  </body>`
  );
}

fs.writeFileSync(distPath, template, 'utf8');
console.log('✅ dist/index.html replaced with web/index.html template');