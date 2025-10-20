#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const photosDir = path.join(__dirname, 'photos');
const indexPath = path.join(__dirname, 'index.html');

const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.JPG', '.JPEG', '.PNG', '.GIF', '.WEBP'];

const photos = fs.readdirSync(photosDir)
    .filter(file => imageExtensions.includes(path.extname(file)))
    .sort();

const photoTags = photos.map(photo => 
    `                    <img data-src="photos/${photo}" alt="Photo">`
).join('\n');

let html = fs.readFileSync(indexPath, 'utf8');

const startMarker = '                <div class="photo-grid">\n';
const endMarker = '\n                </div>';

const startIndex = html.indexOf(startMarker);
const endIndex = html.indexOf(endMarker, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
    const before = html.substring(0, startIndex + startMarker.length);
    const after = html.substring(endIndex);
    
    html = before + photoTags + after;
    
    fs.writeFileSync(indexPath, html);
    console.log(`✓ Updated ${photos.length} photos in index.html`);
} else {
    console.error('✗ Could not find photo-grid section in index.html');
    process.exit(1);
}
