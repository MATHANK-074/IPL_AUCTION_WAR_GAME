const fs = require('fs');
const path = require('path');
const players = JSON.parse(fs.readFileSync(path.join(__dirname, '../server/data/players.json'), 'utf-8'));
console.log('Total players:', players.length);
