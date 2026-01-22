async function run() {
    try {
        const shipsUrl = 'https://scunpacked.com/api/v2/ships.json';
        const itemsUrl = 'https://scunpacked.com/api/items.json';

        console.log('Fetching ships list...');
        const shipsRes = await fetch(shipsUrl);
        if (!shipsRes.ok) throw new Error(`Ships fetch failed: ${shipsRes.statusText}`);
        const ships = await shipsRes.json();

        // Find a common ship
        const ship = ships.find(s => s.ClassName.toLowerCase().includes('arrow'));
        if (!ship) throw new Error('Could not find target ship test');

        console.log(`Testing with ship: ${ship.ClassName}`);

        const portsUrl = `https://scunpacked.com/api/v2/ships/${ship.ClassName.toLowerCase()}-ports.json`;
        console.log(`Fetching ports from ${portsUrl}...`);

        const portsRes = await fetch(portsUrl);
        if (!portsRes.ok) {
            const text = await portsRes.text();
            console.error(`Ports fetch failed: ${portsRes.status} \nResponse: ${text.slice(0, 100)}...`);
            return;
        }
        const portsData = await portsRes.json();
        const ports = Object.values(portsData).flat();

        console.log('Fetching items...');
        const itemsRes = await fetch(itemsUrl);
        if (!itemsRes.ok) throw new Error('Items fetch failed');
        const items = await itemsRes.json();

        // Debug Weapon Logic
        const weaponPort = ports.find(p => p.PortName?.includes('weapon') || p.Name?.includes('weapon'));
        console.log('\n--- WEAPON PORT ---');
        console.log(JSON.stringify(weaponPort, null, 2));

        if (weaponPort) {
            const compatible = items.filter(item => {
                // REPLICATING LOGIC FROM dataService.ts
                const port = { ...weaponPort, Types: weaponPort.Types || [] };

                // Basic type matching
                const typeMatch = port.Types.some(type => {
                    const [mainType] = type.split('.');
                    const itemType = (item.type || item.Type || '').toLowerCase();
                    const itemSubType = (item.subType || item.SubType || item.sub_type || '').toLowerCase();
                    const targetType = mainType.toLowerCase();

                    // Logic copy-paste from current implementation
                    const isWeaponPort = targetType.includes('weapon') || targetType === 'wepn' || targetType.includes('gun') || targetType === 'turret';
                    const isWeaponItem = itemType.includes('weapon') || itemType.includes('gun') || itemType.includes('missile') || itemSubType.includes('gun') || itemSubType.includes('weapon');

                    if (isWeaponPort && isWeaponItem) return true;
                    return itemType === targetType || itemType.includes(targetType) || targetType.includes(itemType);
                });

                // Size matching logic from dataService.ts is: item.size >= port.MinSize && item.size <= port.MaxSize;
                // However, raw items often have size capitalized? Let's check item structure.
                const itemSize = item.size || item.Size || 0;
                const sizeMatch = itemSize >= (port.MinSize || 0) && itemSize <= (port.MaxSize || 5);

                if (item.Name && item.Name.includes('Badger')) {
                    console.log(`DEBUG BADGER: TypeMatch=${typeMatch} SizeMatch=${sizeMatch} (ItemSize:${itemSize} PortMin:${port.MinSize} PortMax:${port.MaxSize}) ItemType:${item.Type}/${item.valTypes}`);
                }

                return typeMatch && sizeMatch;
            });
            console.log(`Found ${compatible.length} compatible items for weapon port.`);
        }

    } catch (e) {
        console.error(e);
    }
}
run();
