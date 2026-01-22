async function run() {
    const itemsUrl = 'https://scunpacked.com/api/items.json';
    console.log('Fetching items...');
    const res = await fetch(itemsUrl);
    const data = await res.json();

    console.log('--- FIRST RAW ITEM KEYS ---');
    console.log(Object.keys(data[0]));
    console.log('--- FIRST RAW ITEM SAMPLE ---');
    console.log(JSON.stringify(data[0], null, 2));

    const normalized = data.map((item) => ({
        name: item.name || (item.stdItem && item.stdItem.Name) || item.Name || 'Unknown',
        type: item.type || (item.stdItem && item.stdItem.Type) || item.Type || '',
        subType: item.subType || item.SubType || item.sub_type || '',
        size: item.size || (item.stdItem && item.stdItem.Size) || item.Size || 0,
        className: item.className || (item.stdItem && item.stdItem.ClassName) || item.ClassName || '',
        raw: item
    }));

    const badgers = normalized.filter(i => JSON.stringify(i).toLowerCase().includes('badger'));
    console.log(`\nFound ${badgers.length} items containing 'badger' in raw data`);
    if (badgers.length > 0) {
        console.log('--- BADGER EXAMPLE (NORMALIZED vs RAW) ---');
        const b = badgers[0];
        console.log(`Name: ${b.name}`);
        console.log(`Root Name: ${b.raw.name}`);
        console.log(`StdItem Name: ${b.raw.stdItem?.Name}`);
        console.log(`Type: ${b.type}`);
        console.log(`Size: ${b.size}`);
    }
}
run();
