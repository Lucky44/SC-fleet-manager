const fs = require('fs');

async function debugItems() {
    console.log("Fetching items...");
    const response = await fetch('https://scunpacked.com/api/items.json');
    const data = await response.json();

    // Find representative items
    const badger = data.find(i => i.className === 'KLWE_LaserRepeater_S2');
    const m6a = data.find(i => i.className === 'BEHR_LaserCannon_S4');
    const shield = data.find(i => i.type === 'Shield' && i.size === 1);

    const sample = { badger, m6a, shield };

    console.log("ITEM DATA SAMPLE:");
    console.log(JSON.stringify(sample, null, 2));

    fs.writeFileSync('debug_items_raw.json', JSON.stringify(sample, null, 2));
}

debugItems().catch(console.error);
