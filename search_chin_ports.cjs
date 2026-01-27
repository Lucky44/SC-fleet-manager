const fs = require('fs');
const data = JSON.parse(fs.readFileSync('c:/Users/tripp/.gemini/antigravity/scratch/star-citizen-fleet-manager/corsair-ports.json', 'utf8'));

const matches = [];
Object.entries(data).forEach(([key, list]) => {
    list.forEach(p => {
        const name = p.PortName || p.Name || '';
        if (name.toLowerCase().includes('chin')) {
            matches.push(`${key}: ${name}`);
        }
    });
});

console.log(matches.join('\n'));
