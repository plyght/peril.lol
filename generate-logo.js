const fs = require('fs');

const width = 400;
const height = 400;
const cx = width / 2;
const cy = height / 2;

const size = 200;
const thickness = 50;

const wing1 = `
  M ${cx - size/2} ${cy}
  L ${cx - size/2 + thickness} ${cy - size * 0.7}
  L ${cx - size/2 + thickness * 2} ${cy - size * 0.7}
  L ${cx - size/2 + thickness} ${cy}
  Z
`;

const wing2 = `
  M ${cx + size/2} ${cy}
  L ${cx + size/2 - thickness} ${cy - size * 0.7}
  L ${cx + size/2 - thickness * 2} ${cy - size * 0.7}
  L ${cx + size/2 - thickness} ${cy}
  Z
`;

const centerBar = `
  M ${cx - thickness/2} ${cy - size * 0.4}
  L ${cx + thickness/2} ${cy - size * 0.4}
  L ${cx + thickness/2} ${cy + size * 0.5}
  L ${cx - thickness/2} ${cy + size * 0.5}
  Z
`;

const base = `
  M ${cx - size * 0.6} ${cy}
  L ${cx + size * 0.6} ${cy}
  L ${cx + size * 0.4} ${cy + thickness}
  L ${cx - size * 0.4} ${cy + thickness}
  Z
`;

const combinedPath = `${wing1} ${wing2} ${centerBar} ${base}`;

const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <path d="${combinedPath}" fill="#0a0a0a" fill-rule="evenodd"/>
</svg>`;

fs.writeFileSync('plyght-logo.svg', svg);
console.log('Logo generated: plyght-logo.svg');
