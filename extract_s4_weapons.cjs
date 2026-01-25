const fs = require('fs');

const data = JSON.parse(fs.readFileSync('ship-items.json', 'utf8'));
const allGuns = data.filter(item => {
    return (item.type || '').toLowerCase().includes('weapongun');
});

const simplified = allGuns.map(item => ({
    className: item.className,
    name: item.name,
    type: item.type,
    size: item.size,
    manufacturer: item.manufacturer,
    reference: item.reference,
    stdItemName: item.stdItem?.Name,
    stdName: item.stdItem?.Name
}));

console.log(JSON.stringify(simplified, null, 2));
