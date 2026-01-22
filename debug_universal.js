async function run() {
    try {
        const shipsUrl = 'https://scunpacked.com/api/v2/ships.json';
        const itemsUrl = 'https://scunpacked.com/api/items.json';

        console.log('Fetching ships...');
        const shipsRes = await fetch(shipsUrl);
        const shipsData = await shipsRes.json();
        const ship = shipsData.find(s => s.ClassName.toLowerCase().includes('avenger_titan'));
        if (!ship) throw new Error('Ship not found');

        console.log(`Using ship: ${ship.ClassName}`);
        const portsUrl = `https://scunpacked.com/api/v2/ships/${ship.ClassName.toLowerCase()}-ports.json`;

        console.log('Fetching ports...');
        const portsRes = await fetch(portsUrl);
        const portsData = await portsRes.json();
        const rawPorts = Object.values(portsData).flat();
        const ports = rawPorts.map(p => ({
            ...p,
            Name: p.PortName || p.Name,
            Types: p.Types || [],
            MinSize: p.MinSize ?? p.Size ?? p.InstalledItem?.Size ?? 0,
            MaxSize: p.MaxSize ?? p.Size ?? p.InstalledItem?.Size ?? 10,
            RawSize: p.Size
        }));

        console.log('Fetching items...');
        const itemsRes = await fetch(itemsUrl);
        const itemsData = await itemsRes.json();

        const items = itemsData.map((item) => {
            const std = item.stdItem;
            return {
                ...item,
                type: std?.Type || item.type || item.Type || '',
                subType: item.subType || item.SubType || item.sub_type || '',
                size: std?.Size || item.size || item.Size || 0,
                name: std?.Name || item.name || item.Name || 'Unknown',
                className: std?.ClassName || item.className || item.ClassName || '',
                manufacturer: std?.Manufacturer?.Name || item.manufacturer || item.Manufacturer || '',
            };
        });

        // Test Case 2: Shield Port
        const shieldPort = ports.find(p => (p.Name || '').toLowerCase().includes('shield') || p.Types.some(t => t.toLowerCase().includes('shield')));

        if (!shieldPort) {
            console.log('Available Ports:', ports.map(p => p.Name));
            throw new Error('No shield port found on ship');
        }

        console.log('\n--- SHIELD PORT ---');
        console.log(JSON.stringify({
            Name: shieldPort.Name,
            Types: shieldPort.Types,
            MinSize: shieldPort.MinSize,
            MaxSize: shieldPort.MaxSize,
            RawSize: shieldPort.RawSize,
            InstalledItem: shieldPort.InstalledItem
        }, null, 2));

        const shieldItem = items.find(i => i.name.toLowerCase().includes('fr-66') || i.name.toLowerCase().includes('allstop'));
        console.log('--- SHIELD ITEM ---');
        if (shieldItem) {
            console.log(JSON.stringify({
                name: shieldItem.name,
                type: shieldItem.type,
                size: shieldItem.size,
                className: shieldItem.className
            }, null, 2));
        } else {
            console.log('Shield item not found in list');
        }

        // EXECUTE FILTER LOGIC
        const port = shieldPort;
        const item = shieldItem;

        if (item) {
            console.log('\n--- FILTER LOGIC TRACE ---');
            // Size Check
            const minSize = port.MinSize;
            const maxSize = port.MaxSize;
            const itemSize = item.size;
            console.log(`Size Check: ${itemSize} >= ${minSize} && ${itemSize} <= ${maxSize}`);
            const sizeMatch = itemSize >= minSize && itemSize <= maxSize;
            console.log(`Result: ${sizeMatch}`);

            // Type Check
            const typeMatch = port.Types.some(type => {
                const [mainType] = type.split('.');
                const itemType = (item.type || '').toLowerCase();
                const itemSubType = (item.subType || '').toLowerCase();
                const targetType = mainType.toLowerCase();

                console.log(`Checking PortType '${type}' vs ItemType '${itemType}'`);

                if ((targetType.includes('shield') || targetType === 'shld') &&
                    (itemType.includes('shield') || itemSubType.includes('shield'))) return true;

                /* Omitted other types for brevity */
                return false;
            });
            console.log(`Type Match: ${typeMatch}`);
            console.log(`FINAL RESULT: ${sizeMatch && typeMatch}`);
        }

    } catch (e) {
        console.error(e);
    }
}
run();
