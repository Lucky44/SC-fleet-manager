import type { Ship, Port, Item, Manufacturer } from '../types';

// We now use local files provided by the user (converted to UTF-8 for compatibility)
const SHIPS_URL = './ships_utf8.json';
const ITEMS_URL = './ship-items_utf8.json';

let cachedShips: Ship[] = [];
let cachedItems: Item[] = [];

const SUPPLEMENTAL_ITEMS: Item[] = [
    // Perseus S8 Turrets
    {
        className: 'RSI_Perseus_Manned_Turret_S8',
        name: 'STS-S8 Musa Manned Turret',
        itemName: 'RSI_Perseus_Manned_Turret_S8',
        type: 'Turret',
        subType: 'Manned',
        size: 8,
        grade: 1,
        description: 'Large manned turret designed specifically for the RSI Perseus.'
    },
    // Perseus S7 Cannons
    {
        className: 'RSI_Perseus_Musa_Cannon_S7',
        name: 'Mark 7 "Musa" Ballistic Cannon',
        itemName: 'RSI_Perseus_Musa_Cannon_S7',
        type: 'WeaponGun',
        subType: 'Ballistic',
        size: 7,
        grade: 1,
        description: 'Bespoke size 7 ballistic cannon for the Perseus main batteries.',
        damage_per_shot: 2450,
        fire_rate: 60
    },
    // S5 Torpedoes
    {
        className: 'Missile_Torpedo_S5_Stalker_V',
        name: 'Stalker V',
        itemName: 'Missile_Torpedo_S5_Stalker_V',
        type: 'Missile',
        subType: 'Torpedo',
        size: 5,
        grade: 1,
        description: 'Size 5 torpedo for capital-scale engagements.'
    },
    {
        className: 'Missile_Torpedo_S5_Scimitar_V',
        name: 'Scimitar V',
        itemName: 'Missile_Torpedo_S5_Scimitar_V',
        type: 'Missile',
        subType: 'Torpedo',
        size: 5,
        grade: 1,
        description: 'High-yield size 5 torpedo.'
    },
    // S3 Remote Turrets
    {
        className: 'AEGS_Hammerhead_Remote_Turret_S3',
        name: 'Aegis S3 Remote Turret',
        itemName: 'AEGS_Hammerhead_Remote_Turret_S3',
        type: 'Turret',
        subType: 'Remote',
        size: 3,
        grade: 1,
        description: 'Standard S3 remote turret.'
    }
];

export const fetchShips = async (): Promise<Ship[]> => {
    if (cachedShips.length > 0) return cachedShips;

    try {
        const response = await fetch(SHIPS_URL);
        if (!response.ok) throw new Error('Failed to fetch ships.json');
        const data = await response.json();

        // Data normalization for local format
        const normalized: Ship[] = data.map((s: any) => {
            const rawName = s.Name || s.ClassName;
            return {
                ClassName: s.ClassName,
                Name: cleanShipName(rawName),
                Description: s.Description || s.DescriptionText || '',
                Career: s.Career || '',
                Role: s.Role || '',
                Size: s.Size || 0,
                Mass: s.MassTotal || s.Mass || 0,
                Cargo: s.Cargo || 0,
                Manufacturer: {
                    Code: s.Manufacturer?.Code || 'UNKN',
                    Name: s.Manufacturer?.Name || 'Unknown Manufacturer'
                } as Manufacturer,
                // Store raw loadout for port extraction
                _rawLoadout: s.Loadout || []
            };
        });

        // Filter out internal/test stuff and placeholders
        const filtered = normalized.filter(s => {
            const c = s.ClassName.toLowerCase();
            const n = s.Name.toLowerCase();
            return !c.includes('test') && !c.includes('cinematic') && !c.includes('tutorial') && !n.includes('placeholder');
        });

        const patched = applyShipPatches(filtered);

        // Global deduplication - use a Map to ensure unique entities
        const uniqueShips = new Map<string, Ship>();

        patched.forEach(ship => {
            // Priority: ClassName must be unique
            const id = ship.ClassName;

            // Check if we've seen this specific ID or a ship with the same name from same manufacturer
            if (!uniqueShips.has(id)) {
                // To check for name collision across different ClassNames
                const isDuplicateName = Array.from(uniqueShips.values()).some(existing =>
                    existing.Manufacturer.Code === ship.Manufacturer.Code &&
                    existing.Name.toLowerCase() === ship.Name.toLowerCase()
                );

                if (!isDuplicateName) {
                    uniqueShips.set(id, ship);
                }
            }
        });

        cachedShips = Array.from(uniqueShips.values());
        return cachedShips;
    } catch (e) {
        console.error('Error fetching ships:', e);
        return applyShipPatches([]);
    }
};

export const fetchShipPorts = async (className: string): Promise<Port[]> => {
    const ships = await fetchShips();
    const ship = ships.find(s => s.ClassName.toLowerCase() === className.toLowerCase());

    let ports: Port[] = [];

    if (ship && (ship as any)._rawLoadout) {
        const rawLoadout = (ship as any)._rawLoadout;
        // Flatten and convert raw loadout to our Port type
        ports = extractPortsFromLoadout(rawLoadout);
    }

    return applyPortPatches(className, ports);
};

const extractPortsFromLoadout = (loadout: any[]): Port[] => {
    const ports: Port[] = [];

    const recurse = (items: any[]) => {
        items.forEach(item => {
            if (item.HardpointName && item.ItemTypes) {
                ports.push({
                    Name: item.HardpointName,
                    DisplayName: item.HardpointName.replace(/hardpoint_|itemport_|hardpoint/gi, ' ').trim(),
                    MaxSize: item.MaxSize || 0,
                    MinSize: item.MinSize || 0,
                    Types: item.ItemTypes.map((t: any) => t.Type + (t.SubType ? `.${t.SubType}` : ''))
                });
            }
            if (item.Loadout) {
                recurse(item.Loadout);
            }
        });
    };

    recurse(loadout);
    return ports;
};

export const fetchItems = async (): Promise<Item[]> => {
    if (cachedItems.length > 0) return cachedItems;

    try {
        const response = await fetch(ITEMS_URL);
        if (!response.ok) throw new Error('Failed to fetch ship-items.json');
        const data = await response.json();

        // Data normalization
        const normalized: Item[] = data.map((item: any) => ({
            className: item.className,
            name: item.name && item.name !== '<= PLACEHOLDER =>' ? item.name : (item.stdItem?.Name || item.className),
            type: item.type,
            subType: item.subType || '',
            size: item.size || 0,
            grade: item.grade || 1,
            description: item.stdItem?.Description || '',
            // Additional stats for specific item types
            damage_per_shot: item.stdItem?.WeaponGun?.DamagePerShot || 0,
            fire_rate: item.stdItem?.WeaponGun?.FireRate || 0,
            max_shield_health: item.stdItem?.Shield?.MaxHealth || 0,
            regeneration_rate: item.stdItem?.Shield?.RegenRate || 0,
            drive_speed: item.stdItem?.QuantumDrive?.DriveSpeed || 0
        }));

        // Intelligent filtering: Keep weapons, components, turrets, missiles.
        const filtered = normalized.filter(item => {
            const type = (item.type || '').toLowerCase();
            const subType = (item.subType || '').toLowerCase();
            const name = (item.name || '').toLowerCase();

            // Broad list of allowed categories
            const allowedTypes = [
                'weapongun', 'weaponmining', 'turret', 'turretgun', 'missilelauncher',
                'missile', 'torpedo', 'shield', 'powerplant', 'cooler', 'quantumdrive',
                'fuelintake', 'fueltank', 'radar', 'sonar', 'paints'
            ];

            const isAllowed = allowedTypes.some(t => type.includes(t) || subType.includes(t));

            // Filter out junk
            if (!isAllowed) return false;
            if (name === 'turret' || name === 'remote turret' || name === 'manned turret') return false; // Generic placeholders
            if (name.includes('placeholder')) return false;

            return !!item.className;
        });

        // Deduplicate
        const unique = new Map<string, Item>();
        filtered.sort((a, b) => a.className.length - b.className.length);
        filtered.forEach(i => {
            if (!unique.has(i.name)) unique.set(i.name, i);
        });

        cachedItems = [...Array.from(unique.values()), ...SUPPLEMENTAL_ITEMS];
        return cachedItems;
    } catch (e) {
        console.error('Error fetching items:', e);
        return [];
    }
};

export const filterItemsForPort = (items: Item[], port: Port): Item[] => {
    return items.filter(item => {
        const itemSize = Number(item.size);
        const minSize = Number(port.MinSize);
        const maxSize = Number(port.MaxSize);

        // Type match logic
        const itemType = (item.type || '').toLowerCase();
        const itemSubType = (item.subType || '').toLowerCase();

        const typeMatch = port.Types.some(pType => {
            const [pMain, pSub] = pType.toLowerCase().split('.');

            // Exact full matches
            if (pMain === itemType && (!pSub || pSub === itemSubType)) return true;

            // Broad category matches
            if (pMain === 'weapongun' && (itemType === 'weapongun' || itemType === 'weaponmining' || itemType === 'turretgun')) return true;
            if (pMain === 'turret' && (itemType.includes('turret') || itemType === 'weapongun')) return true;
            if (pMain === 'missilelauncher' && (itemType.includes('missile') || itemType.includes('torpedo') || itemType.includes('missilelauncher'))) return true;

            // Alias matches
            if (pMain === 'shld' && itemType === 'shield') return true;
            if (pMain === 'pwrp' && itemType === 'powerplant') return true;
            if (pMain === 'clre' && itemType === 'cooler') return true;
            if (pMain === 'qntm' && itemType === 'quantumdrive') return true;

            // Fuzzy/Alias
            if (itemType.includes(pMain) || pMain.includes(itemType)) return true;
            return false;
        });

        if (!typeMatch) return false;

        // Size match logic:
        // 1. Exact range match
        if (itemSize >= minSize && itemSize <= maxSize) return true;

        // 2. Turret Logic: A turret port (Size X) often accepts weapons that are Size X-1
        const isTurretPort = port.Types.some(t => t.toLowerCase().includes('turret'));

        // Special case for Perseus S8 Turrets accepting S7 Musa Cannons
        if (isTurretPort && maxSize === 8 && itemSize === 7) return true;

        if (isTurretPort && itemSize === maxSize - 1) return true;

        return false;
    });
};

const applyShipPatches = (ships: Ship[]): Ship[] => {
    // Check for existence by ClassName or Name (case insensitive)
    const polarisExists = ships.some(s => s.ClassName === 'RSI_Polaris' || s.Name.toLowerCase() === 'polaris');
    const perseusExists = ships.some(s => s.ClassName === 'RSI_Perseus' || s.Name.toLowerCase() === 'perseus');
    const c8rExists = ships.some(s => s.ClassName === 'ANVL_Pisces_C8R' || s.Name.toLowerCase() === 'c8r pisces rescue');

    const patched = ships.map(ship => {
        // Fix F8C
        if (ship.ClassName === 'ANVL_Lightning_F8') {
            return {
                ...ship,
                Name: 'F8C Lightning',
                Manufacturer: { Code: 'AEGS', Name: 'Aegis Dynamics' },
            };
        }
        return ship;
    });

    const manualShips: Ship[] = [];

    if (!polarisExists) {
        manualShips.push({
            ClassName: 'RSI_Polaris',
            Name: 'Polaris',
            Size: 6,
            Mass: 15000000,
            Cargo: 216,
            Role: 'Corvette',
            Career: 'Military',
            Description: 'The RSI Polaris is a corvette-class capital ship developed for the UEE Navy. Ideally suited for naval patrol and border security, it features a massive torpedo payload and a small hangar bay.',
            Manufacturer: { Code: 'RSI', Name: 'Roberts Space Industries' }
        });
    }

    if (!perseusExists) {
        manualShips.push({
            ClassName: 'RSI_Perseus',
            Name: 'Perseus',
            Size: 5,
            Mass: 4181274,
            Cargo: 96,
            Role: 'Heavy Gunship',
            Career: 'Military',
            Description: 'The RSI Perseus is a formidable heavy gunship designed for engaging larger threats, blockading, and fleet defense. It features two massive manned turrets with Size 8 cannons.',
            Manufacturer: { Code: 'RSI', Name: 'Roberts Space Industries' }
        });
    }

    if (!c8rExists) {
        manualShips.push({
            ClassName: 'ANVL_Pisces_C8R',
            Name: 'C8R Pisces Rescue',
            Size: 1,
            Mass: 55000,
            Cargo: 0,
            Role: 'Rescue',
            Career: 'Medical',
            Description: 'The Anvil C8R Pisces Rescue is a specialized medical variant of the Pisces, designed to provide emergency medical support and rapid extraction.',
            Manufacturer: { Code: 'ANVL', Name: 'Anvil Aerospace' }
        });
    }

    // Always add these since they are very new/custom
    manualShips.push({
        ClassName: 'RSI_Meteor',
        Name: 'Meteor',
        Size: 3,
        Mass: 65000,
        Cargo: 0,
        Role: 'Medium Fighter',
        Career: 'Combat',
        Description: 'A high-performance medium fighter from RSI, the Meteor is designed for aggressive engagements.',
        Manufacturer: { Code: 'RSI', Name: 'Roberts Space Industries' }
    });

    return [...patched, ...manualShips];
};

const applyPortPatches = (className: string, ports: Port[]): Port[] => {
    // If the port list is empty, we MUST provide a fallback for our custom/missing ships
    if (className === 'RSI_Meteor' || (className === 'RSI_Perseus' && ports.length === 0)) {
        if (className === 'RSI_Meteor') {
            return [
                { Name: 'weapon_hardpoint_1', DisplayName: 'Main Forward S5', MaxSize: 5, MinSize: 1, Types: ['WeaponGun'] },
                { Name: 'weapon_hardpoint_2', DisplayName: 'Main Forward S5', MaxSize: 5, MinSize: 1, Types: ['WeaponGun'] },
                { Name: 'weapon_hardpoint_3', DisplayName: 'Wing S3', MaxSize: 3, MinSize: 1, Types: ['WeaponGun'] },
                { Name: 'weapon_hardpoint_4', DisplayName: 'Wing S3', MaxSize: 3, MinSize: 1, Types: ['WeaponGun'] },
                { Name: 'missile_rack_1', DisplayName: 'Missile Rack S4', MaxSize: 4, MinSize: 1, Types: ['MissileLauncher'] },
                { Name: 'shield_generator_1', MaxSize: 2, MinSize: 2, Types: ['Shield.ShieldGenerator'] },
                { Name: 'power_plant_1', MaxSize: 2, MinSize: 2, Types: ['PowerPlant.PowerPlant'] },
                { Name: 'cooler_1', MaxSize: 2, MinSize: 2, Types: ['Cooler.Cooler'] },
                { Name: 'quantum_drive_1', MaxSize: 2, MinSize: 2, Types: ['QuantumDrive.QuantumDrive'] },
            ];
        }
        if (className === 'RSI_Perseus') {
            const weaponPorts: Port[] = [
                { Name: 'manned_turret_1', DisplayName: 'Dorsal S8 Turret', MaxSize: 8, MinSize: 8, Types: ['Turret'] },
                { Name: 'manned_turret_2', DisplayName: 'Ventral S8 Turret', MaxSize: 8, MinSize: 8, Types: ['Turret'] },
                { Name: 'remote_turret_1', DisplayName: 'Remote S3 Turret', MaxSize: 3, MinSize: 3, Types: ['Turret'] },
                { Name: 'remote_turret_2', DisplayName: 'Remote S3 Turret', MaxSize: 3, MinSize: 3, Types: ['Turret'] },
            ];
            const torpedoPorts: Port[] = Array.from({ length: 20 }, (_, i) => ({
                Name: `torpedo_${i + 1}`,
                DisplayName: `S5 Torpedo ${i + 1}`,
                MaxSize: 5,
                MinSize: 5,
                Types: ['MissileLauncher']
            }));
            const componentPorts: Port[] = [
                { Name: 'shield_generator_1', MaxSize: 3, MinSize: 3, Types: ['Shield.ShieldGenerator'] },
                { Name: 'power_plant_1', MaxSize: 3, MinSize: 3, Types: ['PowerPlant.PowerPlant'] },
                { Name: 'cooler_1', MaxSize: 3, MinSize: 3, Types: ['Cooler.Cooler'] },
                { Name: 'quantum_drive_1', MaxSize: 3, MinSize: 3, Types: ['QuantumDrive.QuantumDrive'] },
            ];
            return [...weaponPorts, ...torpedoPorts, ...componentPorts];
        }
    }

    if (className === 'ANVL_Pisces_C8R') {
        return [
            { Name: 'weapon_hardpoint_1', DisplayName: 'Weapon S1', MaxSize: 1, MinSize: 1, Types: ['WeaponGun'] },
            { Name: 'weapon_hardpoint_2', DisplayName: 'Weapon S1', MaxSize: 1, MinSize: 1, Types: ['WeaponGun'] },
            { Name: 'missile_rack_1', DisplayName: 'Missile Rack S1', MaxSize: 1, MinSize: 1, Types: ['MissileLauncher'] },
            { Name: 'missile_rack_2', DisplayName: 'Missile Rack S1', MaxSize: 1, MinSize: 1, Types: ['MissileLauncher'] },
            { Name: 'shield_generator_1', MaxSize: 1, MinSize: 1, Types: ['Shield.ShieldGenerator'] },
            { Name: 'power_plant_1', MaxSize: 1, MinSize: 1, Types: ['PowerPlant.PowerPlant'] },
            { Name: 'cooler_1', MaxSize: 1, MinSize: 1, Types: ['Cooler.Cooler'] },
            { Name: 'cooler_2', MaxSize: 1, MinSize: 1, Types: ['Cooler.Cooler'] },
            { Name: 'quantum_drive_1', MaxSize: 1, MinSize: 1, Types: ['QuantumDrive.QuantumDrive'] },
        ];
    }
    return ports;
};

export const cleanName = (name: string): string => {
    return name
        .replace(/@item_Name_|@LOC_PLACEHOLDER_|\(.*\)/g, '')
        .replace(/_/g, ' ')
        .trim() || 'Unknown Item';
};

export const cleanShipName = (name: string): string => {
    return name
        .replace(/_/g, ' ')
        .replace(/^RSI\s+/i, '')
        .trim();
};

export const getItemStats = (item: Item & { [key: string]: any }) => {
    const stats: { label: string; value: string }[] = [];
    if ((item.damage_per_shot ?? 0) > 0) stats.push({ label: 'DMG', value: (item.damage_per_shot ?? 0).toFixed(0) });
    if ((item.fire_rate ?? 0) > 0) stats.push({ label: 'RPM', value: (item.fire_rate ?? 0).toFixed(0) });
    if ((item.max_shield_health ?? 0) > 0) stats.push({ label: 'HP', value: (item.max_shield_health ?? 0).toLocaleString() });
    if ((item.regeneration_rate ?? 0) > 0) stats.push({ label: 'REGEN', value: (item.regeneration_rate ?? 0).toFixed(0) + '/s' });
    if ((item.drive_speed ?? 0) > 0) stats.push({ label: 'SPD', value: ((item.drive_speed ?? 0) / 1000).toFixed(0) + 'k' });
    return stats;
};
