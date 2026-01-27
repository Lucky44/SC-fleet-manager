const fs = require('fs');
const data = JSON.parse(fs.readFileSync('c:/Users/tripp/.gemini/antigravity/scratch/star-citizen-fleet-manager/corsair-ports.json', 'utf8'));

const names = [];
Object.entries(data).forEach(([key, list]) => {
    list.forEach(p => {
        names.push(`${key}: ${p.PortName || p.Name}`);
    });
});

console.log(names.join('\n'));
