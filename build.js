#!/usr/bin/env node
/* Assembles src/ into index.html (a standalone page, no server or dependencies needed).
   Usage: node build.js [--fragment out.html]  (fragment = same page without the document shell) */
const fs = require('fs');
const path = require('path');
const src = (f) => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');

const head = `<title>Neunelfer Atlas</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,100..900;1,62..125,100..900&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
${src('styles.css')}</style>`;
const body = `${src('body.html')}<script>
${['data.js', 'car.js', 'app.js'].map(src).join('\n')}</script>`;

fs.writeFileSync(path.join(__dirname, 'index.html'), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${head}
</head>
<body>
${body}
</body>
</html>
`);
const i = process.argv.indexOf('--fragment');
if (i > -1) fs.writeFileSync(process.argv[i + 1], `${head}\n${body}\n`);
console.log('built index.html');
