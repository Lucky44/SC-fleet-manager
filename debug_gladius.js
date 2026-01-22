async function run() {
    try {
        const gladiusPortsUrl = 'https://scunpacked.com/api/v2/ships/aegs_gladius-ports.json';
        const itemsUrl = 'https://scunpacked.com/api/items.json';

        console.log('Fetching Gladius ports...');
        const portsRes = await fetch(gladiusPortsUrl);
        if (!portsRes.ok) throw new Error('Ports fetch failed');
        const portsData = await portsRes.json();
        const ports = Object.values(portsData).flat();

        const shieldPort = ports.find(p => (p.Name || p.PortName || '').toLowerCase().includes('shield') || (p.Types || []).some(t => t.toLowerCase().includes('shield')));
        console.log('--- GLADIUS SHIELD PORT ---');
        console.log(JSON.stringify(shieldPort, null, 2));

        console.log('Fetching items...');
        const itemsRes = await fetch(itemsUrl);
        const items = await itemsRes.json();

        // Simulate the dataService normalization
        const normalizedItems = items.map((item) => {
            const std = item.stdItem;
            return {
                ...item,
                // THE LOGIC WE JUST ADDED
                type: std?.Type || item.type || item.Type || '',
                subType: item.subType || item.SubType || item.sub_type || '',
                size: std?.Size || item.size || item.Size || 0,
                name: std?.Name || item.name || item.Name || 'Unknown',
                className: std?.ClassName || item.className || item.ClassName || '',
                raw: item
            };
        });

        const allstop = normalizedItems.find(i => i.name.toLowerCase().includes('allstop'));
        console.log('--- ALLSTOP SHIELD ---');
        console.log(JSON.stringify({
            name: allstop.name,
            type: allstop.type,
            subType: allstop.subType,
            size: allstop.size,
            className: allstop.className
        }, null, 2));


        // CHECK MATCHING LOGIC
        const port = shieldPort;
        const item = allstop;

        console.log('\n--- MATCHING CHECK ---');
        const typeMatch = port.Types.some(type => {
            const [mainType] = type.split('.');
            const itemType = (item.type || '').toLowerCase();
            const itemSubType = (item.subType || '').toLowerCase();
            const targetType = mainType.toLowerCase();

            console.log(`Checking ${type} against ItemType:${itemType} SubType:${itemSubType}`);

            if ((targetType.includes('shield') || targetType === 'shld') &&
                (itemType.includes('shield') || itemSubType.includes('shield'))) return true;

            return itemType === targetType || itemType.includes(targetType) || targetType.includes(itemType);
        });

        console.log('Type Match:', typeMatch);

        const sizeMatch = item.size >= port.MinSize && item.size <= port.MaxSize;
        console.log(`Size Match: ${sizeMatch} (Item:${item.size} Port:${port.MinSize}-${port.MaxSize})`);

    } catch (e) {
        console.error(e);
    }
}
run();
