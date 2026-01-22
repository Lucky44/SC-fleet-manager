const https = require('https');

const fetchShips = () => {
    return new Promise((resolve, reject) => {
        https.get('https://scunpacked.com/api/v2/ships.json', (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
            res.on('error', reject);
        });
    });
};

const cleanShipName = (ship) => {
    let name = ship.Name;
    // Basic mock of the UI logic
    if (!ship.Manufacturer) return name;

    // Some entries might lack Manufacturer properties if data is weird, handle gracefully
    const code = ship.Manufacturer.Code || '';
    const manufName = ship.Manufacturer.Name || '';

    const parts = name.split(' ');
    if (parts.length <= 1) return name;

    const firstWord = parts[0];
    if (firstWord.toUpperCase() === code.toUpperCase() ||
        manufName.includes(firstWord)) {
        return parts.slice(1).join(' ');
    }
    return name;
};

fetchShips().then(ships => {
    const nameMap = new Map();
    const collisions = [];

    ships.forEach(ship => {
        // Apply same filters as dataService
        const c = ship.ClassName.toLowerCase();
        if (c.includes('test') || c.includes('cinematic') || c.includes('tutorial')) return;

        const cleanNameVal = cleanShipName(ship);
        if (nameMap.has(cleanNameVal)) {
            collisions.push({
                name: cleanNameVal,
                originalName1: nameMap.get(cleanNameVal).Name,
                originalName2: ship.Name,
                className1: nameMap.get(cleanNameVal).ClassName,
                className2: ship.ClassName
            });
        } else {
            nameMap.set(cleanNameVal, ship);
        }
    });

    if (collisions.length > 0) {
        console.log('Found collisions after cleaning names:');
        console.log(JSON.stringify(collisions, null, 2));
    } else {
        console.log('No collisions found.');
        // Check for exact duplicates in raw name if any
        const rawMap = new Map();
        const rawCollisions = [];
        ships.forEach(ship => {
            const c = ship.ClassName.toLowerCase();
            if (c.includes('test') || c.includes('cinematic') || c.includes('tutorial')) return;

            if (rawMap.has(ship.Name)) {
                rawCollisions.push(ship.Name);
            } else {
                rawMap.set(ship.Name, true);
            }
        });
        console.log('Raw duplicates:', rawCollisions);
    }
});
