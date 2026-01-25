// Carrack Turret and Bespoke Item Patch
import type { Ship, Port, Item } from '../types';

const BASE_URL = 'https://scunpacked.com/api';

export const fetchShips = async (): Promise<Ship[]> => {
    const response = await fetch(`${BASE_URL}/v2/ships.json`);
    if (!response.ok) throw new Error('Failed to fetch ships');
    const data = await response.json();

    // Filter out internal/test ships
    const filteredData = data.filter((ship: { ClassName: string }) => {
        const c = ship.ClassName.toLowerCase();
        if (c.includes('test') || c.includes('cinematic') || c.includes('tutorial')) return false;
        return true;
    });

    // Apply patches BEFORE deduplication so we can fix names
    const patchedData = applyShipPatches(filteredData);

    // Deduplicate: If multiple ships have the same Name, keep the one with the shortest ClassName
    const uniqueShips = new Map<string, Ship>();

    // Sort by ClassName length ascending to ensure we process the 'base' version first
    patchedData.sort((a: { ClassName: string }, b: { ClassName: string }) => a.ClassName.length - b.ClassName.length);

    patchedData.forEach((ship: Ship) => {
        if (!uniqueShips.has(ship.Name)) {
            uniqueShips.set(ship.Name, ship);
        }
    });

    return Array.from(uniqueShips.values());
};

export const fetchShipPorts = async (className: string): Promise<Port[]> => {
    try {
        const response = await fetch(`${BASE_URL}/v2/ships/${className.toLowerCase()}-ports.json`);
        if (!response.ok) {
            return applyPortPatches(className, []);
        }
        const data = await response.json();
        const rawPorts = Object.values(data).flat() as any[];

        const normalizedPorts = rawPorts.map(p => ({
            ...p,
            Name: p.PortName || p.Name,
            Types: p.Types || [],
            MinSize: p.MinSize ?? p.Size ?? p.InstalledItem?.Size ?? 0,
            MaxSize: p.MaxSize ?? p.Size ?? p.InstalledItem?.Size ?? 10,
        }));

        return applyPortPatches(className, normalizedPorts);
    } catch (error) {
        console.error(`Error fetching ports for ${className}:`, error);
        return applyPortPatches(className, []);
    }
};

const applyPortPatches = (className: string, ports: Port[]): Port[] => {
    if (className === 'ANVL_Lightning_F8') {
        const nonShields = ports.filter(p => !p.Name.toLowerCase().includes('shield'));
        const newShields: Port[] = [
            { Name: 'shield_generator_1', MaxSize: 2, MinSize: 2, Types: ['Shield.ShieldGenerator'] },
            { Name: 'shield_generator_2', MaxSize: 2, MinSize: 2, Types: ['Shield.ShieldGenerator'] },
        ];
        return [...nonShields, ...newShields];
    }
    if (className === 'RSI_Meteor') {
        const weaponPorts: Port[] = [
            { Name: 'weapon_hardpoint_1', DisplayName: 'Main Forward S5', MaxSize: 5, MinSize: 1, Types: ['WeaponGun'] },
            { Name: 'weapon_hardpoint_2', DisplayName: 'Main Forward S5', MaxSize: 5, MinSize: 1, Types: ['WeaponGun'] },
            { Name: 'weapon_hardpoint_3', DisplayName: 'Wing S3', MaxSize: 3, MinSize: 1, Types: ['WeaponGun'] },
            { Name: 'weapon_hardpoint_4', DisplayName: 'Wing S3', MaxSize: 3, MinSize: 1, Types: ['WeaponGun'] },
            { Name: 'weapon_hardpoint_5', DisplayName: 'Wing S3', MaxSize: 3, MinSize: 1, Types: ['WeaponGun'] },
            { Name: 'weapon_hardpoint_6', DisplayName: 'Wing S3', MaxSize: 3, MinSize: 1, Types: ['WeaponGun'] },
        ];
        const missilePorts: Port[] = [
            { Name: 'missile_rack_1', DisplayName: 'Missile Rack S4', MaxSize: 4, MinSize: 1, Types: ['MissileLauncher'] },
            { Name: 'missile_rack_2', DisplayName: 'Missile Rack S4', MaxSize: 4, MinSize: 1, Types: ['MissileLauncher'] },
            { Name: 'missile_rack_3', DisplayName: 'Missile Rack S4', MaxSize: 4, MinSize: 1, Types: ['MissileLauncher'] },
            { Name: 'missile_rack_4', DisplayName: 'Missile Rack S4', MaxSize: 4, MinSize: 1, Types: ['MissileLauncher'] },
            { Name: 'missile_hardpoint_1', DisplayName: 'Launcher S3', MaxSize: 3, MinSize: 1, Types: ['MissileLauncher'] },
            { Name: 'missile_hardpoint_2', DisplayName: 'Launcher S3', MaxSize: 3, MinSize: 1, Types: ['MissileLauncher'] },
        ];
        const componentPorts: Port[] = [
            { Name: 'shield_generator_1', MaxSize: 2, MinSize: 2, Types: ['Shield.ShieldGenerator'] },
            { Name: 'power_plant_1', MaxSize: 2, MinSize: 2, Types: ['PowerPlant.PowerPlant'] },
            { Name: 'cooler_1', MaxSize: 2, MinSize: 2, Types: ['Cooler.Cooler'] },
            { Name: 'cooler_2', MaxSize: 2, MinSize: 2, Types: ['Cooler.Cooler'] },
            { Name: 'quantum_drive_1', MaxSize: 2, MinSize: 2, Types: ['QuantumDrive.QuantumDrive'] },
        ];
        return [...weaponPorts, ...missilePorts, ...componentPorts];
    }
    if (className === 'RSI_Perseus') {
        const weaponPorts: Port[] = [
            { Name: 'manned_turret_1', DisplayName: 'Dorsal S8 Turret', MaxSize: 8, MinSize: 8, Types: ['Turret'] },
            { Name: 'manned_turret_2', DisplayName: 'Ventral S8 Turret', MaxSize: 8, MinSize: 8, Types: ['Turret'] },
            { Name: 'remote_turret_1', DisplayName: 'Remote S3 Turret', MaxSize: 3, MinSize: 3, Types: ['Turret'] },
            { Name: 'remote_turret_2', DisplayName: 'Remote S3 Turret', MaxSize: 3, MinSize: 3, Types: ['Turret'] },
            { Name: 'remote_turret_3', DisplayName: 'Remote S3 Turret', MaxSize: 3, MinSize: 3, Types: ['Turret'] },
            { Name: 'remote_turret_4', DisplayName: 'Remote S3 Turret', MaxSize: 3, MinSize: 3, Types: ['Turret'] },
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
            { Name: 'shield_generator_2', MaxSize: 3, MinSize: 3, Types: ['Shield.ShieldGenerator'] },
            { Name: 'power_plant_1', MaxSize: 3, MinSize: 3, Types: ['PowerPlant.PowerPlant'] },
            { Name: 'power_plant_2', MaxSize: 3, MinSize: 3, Types: ['PowerPlant.PowerPlant'] },
            { Name: 'cooler_1', MaxSize: 3, MinSize: 3, Types: ['Cooler.Cooler'] },
            { Name: 'cooler_2', MaxSize: 3, MinSize: 3, Types: ['Cooler.Cooler'] },
            { Name: 'quantum_drive_1', MaxSize: 3, MinSize: 3, Types: ['QuantumDrive.QuantumDrive'] },
        ];
        return [...weaponPorts, ...torpedoPorts, ...componentPorts];
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

    if (className.startsWith('ANVL_Carrack')) {
        let turretIndex = 0;
        return ports
            .filter(p => {
                const name = (p.Name || '').toLowerCase();
                return !name.includes('radar') && !name.includes('surveyor');
            })
            .map(p => {
                const isTurret = (p.Name || '').toLowerCase().includes('turret') || p.Turret === true;
                if (isTurret) {
                    turretIndex++;
                    let displayName = '';
                    // Force 2 Manned, 2 Remote as requested
                    if (turretIndex <= 2) {
                        displayName = `Manned Turret S4 (${turretIndex})`;
                    } else {
                        displayName = `Remote Turret S4 (${turretIndex - 2})`;
                    }

                    return {
                        ...p,
                        DisplayName: displayName,
                        MaxSize: 4,
                        MinSize: 4,
                        Types: ['WeaponGun'], // Force as weapon port for gun selection
                        InstalledItem: p.InstalledItem ? { ...p.InstalledItem, Size: 4 } : undefined
                    };
                }
                return p;
            });
    }
    return ports;
};

const WEAPON_NAME_MAP: Record<string, string> = {
    // Behring Laser Cannons (M-Series)
    'BEHR_LASERCANNON_S1': 'M3A Laser Cannon',
    'BEHR_LASERCANNON_S2': 'M4A Laser Cannon',
    'BEHR_LASERCANNON_S3': 'M5A Laser Cannon',
    'BEHR_LASERCANNON_S4': 'M6A Laser Cannon',
    'BEHR_LASERCANNON_S5': 'M7A Laser Cannon',
    'BEHR_LASERCANNON_S6': 'M8A Laser Cannon',
    'BEHR_LASERCANNON_S7': 'M9A Laser Cannon',

    // Klaus & Werner Laser Repeaters
    'KLWE_LASERREPEATER_S1': 'Bulldog Repeater',
    'KLWE_LASERREPEATER_S2': 'Badger Repeater',
    'KLWE_LASERREPEATER_S3': 'Panther Repeater',
    'KLWE_LASERREPEATER_S4': 'Rhino Repeater',
    'KLWE_LASERREPEATER_S5': 'Galdereen Repeater',
    'KLWE_LASERREPEATER_S6': 'Mammoth Repeater',

    // Behring Ballistic Gatlings (AD-Series)
    'BEHR_BALLISTICGATLING_S4': 'AD4B Gatling',
    'BEHR_BALLISTICGATLING_S5': 'AD5B Gatling',
    'BEHR_BALLISTICGATLING_S6': 'AD6B Gatling',

    // Amon & Reese Omnisky Laser Cannons
    'AMRS_LASERCANNON_S1': 'Omnisky III',
    'AMRS_LASERCANNON_S2': 'Omnisky VI',
    'AMRS_LASERCANNON_S3': 'Omnisky IX',
    'AMRS_LASERCANNON_S4': 'Omnisky XII',
    'AMRS_LASERCANNON_S5': 'Omnisky XV',
    'AMRS_LASERCANNON_S6': 'Omnisky XVIII',

    // Kronig FL series
    'KRON_LASERCANNON_S1': 'FL-11 Cannon',
    'KRON_LASERCANNON_S2': 'FL-22 Cannon',
    'KRON_LASERCANNON_S3': 'FL-33 Cannon',

    // Hurston Dynamics Attrition
    'HRST_LASERREPEATER_S1': 'Attrition-1 Repeater',
    'HRST_LASERREPEATER_S2': 'Attrition-2 Repeater',
    'HRST_LASERREPEATER_S3': 'Attrition-3 Repeater',
    'HRST_LASERREPEATER_S4': 'Attrition-4 Repeater',
    'HRST_LASERREPEATER_S5': 'Attrition-5 Repeater',
    'HRST_LASERREPEATER_S6': 'Attrition-6 Repeater',

    // Hurston Dynamics Dominance
    'HRST_LASERSCATTERGUN_S1': 'Dominance-1',
    'HRST_LASERSCATTERGUN_S2': 'Dominance-2',
    'HRST_LASERSCATTERGUN_S3': 'Dominance-3',

    // Esperia Deadbolt Ballistic Cannons
    'ESPR_BALLISTICCANNON_S2': 'Deadbolt II',
    'ESPR_BALLISTICCANNON_S3': 'Deadbolt III',
    'ESPR_BALLISTICCANNON_S4': 'Deadbolt IV',
    'ESPR_BALLISTICCANNON_S5': 'Deadbolt V',

    // Aegis Dynamics Revenant/Draugar
    'APAR_BALLISTICGATLING_S4': 'Revenant Gatling',
    'APAR_BALLISTICGATLING_S6': 'Draugar Gatling',

    // Behring Combine
    'BEHR_BALLISTICCANNON_S4': 'C-788 Combine',

    // Gallenson Tactical Tarantula
    'GATS_BALLISTICCANNON_S1': 'Tarantula GT-870 Mark 1',
    'GATS_BALLISTICCANNON_S2': 'Tarantula GT-870 Mark 2',
    'GATS_BALLISTICCANNON_S3': 'Tarantula GT-870 Mark 3',

    // Gallenson Tactical Gatlings
    'GATS_BALLISTICGATLING_S1': 'YellowJacket GT-210',
    'GATS_BALLISTICGATLING_S2': 'Scorpion GT-215',
    'GATS_BALLISTICGATLING_S3': 'Mantis GT-220',

    // Preacher Distortion
    'PRAR_DISTORTIONSCATTERGUN_S4': 'Salvation Scattergun',
    'PRAR_DISTORTIONSCATTERGUN_S5': 'Absolution Scattergun',

    // Esperia Lightstrike Laser Cannons
    'ESPR_LASERCANNON_S1': 'Lightstrike I Cannon',
    'ESPR_LASERCANNON_S2': 'Lightstrike II Cannon',
    'ESPR_LASERCANNON_S3': 'Lightstrike III Cannon',
    'ESPR_LASERCANNON_S4': 'Lightstrike IV Cannon',
    'ESPR_LASERCANNON_S5': 'Lightstrike V Cannon',
    'ESPR_LASERCANNON_S6': 'Lightstrike VI Cannon',

    // Banu Singe Tachyon Cannons
    'BANU_TACHYONCANNON_S1': 'Singe Cannon (S1)',
    'BANU_TACHYONCANNON_S2': 'Singe Cannon (S2)',
    'BANU_TACHYONCANNON_S3': 'Singe Cannon (S3)',

    // MaxOx NN-Series Neutron Cannons
    'MXOX_NEUTRONCANNON_S1': 'NN-13 Cannon',
    'MXOX_NEUTRONCANNON_S2': 'NN-14 Cannon',
    'MXOX_NEUTRONCANNON_S3': 'NN-15 Cannon',

    // Vanduul Weapons
    'VNCL_LASERCANNON_S1': 'WASP Cannon',
    'VNCL_LASERCANNON_S2': 'WASP Cannon',
    'VNCL_PLASMACANNON_S2': 'WHIP Plasma Cannon',
    'VNCL_PLASMACANNON_S3': 'WARLORD Plasma Cannon',
    'VNCL_PLASMACANNON_S5': 'WRATH Plasma Cannon',
    'VNCL_NEUTRONCANNON_S5': 'WAR Plasma Cannon'
};

export const fetchItems = async (): Promise<Item[]> => {
    const response = await fetch(`${BASE_URL}/items.json`);
    if (!response.ok) throw new Error('Failed to fetch items');
    const data = await response.json();

    const normalized = data.filter((item: any) => {
        const typeLower = (item.type || '').toLowerCase();
        if (typeLower.includes('attachment')) return false;
        if (typeLower.includes('clothing')) return false;
        if (typeLower.includes('armor')) return false;
        if (typeLower.includes('grenade')) return false;
        if (typeLower.includes('gadget')) return false;
        if (typeLower.includes('weaponmining')) return false;
        if (typeLower.includes('weapontractor')) return false;
        if (typeLower.includes('missilelauncher')) return false;

        const nameLower = (item.name || '').toLowerCase();
        if (nameLower === 'turret' || nameLower === 'remote turret' || nameLower === 'manned turret' || nameLower === 'mannequin') return false;
        if (nameLower.includes('regenpool') || nameLower.includes('weaponmount') || nameLower.includes('ammobox')) return false;

        // Filter out "bespoke" or ship-specific massive items
        if (nameLower.includes('bespoke') || nameLower.includes('limited') || nameLower.includes('interior')) return false;
        if (nameLower.includes('idris') || nameLower.includes('javelin') || nameLower.includes('kraken')) return false;

        const classLower = (item.className || '').toLowerCase();
        if (classLower.includes('_container') || classLower.includes('controller')) return false;
        if (classLower.includes('bespoke') || classLower.includes('massive')) return false;

        return !!item.className;
    });

    const uniqueItems = new Map<string, Item>();
    // Sort by className length - shorter usually means the "base" item/template
    normalized.sort((a: Item, b: Item) => a.className.length - b.className.length);

    normalized.forEach((item: Item) => {
        // Use className for deduping to ensure all valid variations are kept
        if (!uniqueItems.has(item.className)) {
            uniqueItems.set(item.className, item);
        }
    });

    return Array.from(uniqueItems.values());
};

const applyShipPatches = (ships: Ship[]): Ship[] => {
    const patched = ships.map(ship => {
        // Handle F8C naming
        if (ship.ClassName === 'ANVL_Lightning_F8') {
            return {
                ...ship,
                Name: 'F8C Lightning',
                Manufacturer: { Code: 'AEGS', Name: 'Aegis Dynamics' },
                Description: 'The F8C Lightning is the civilian variant of the heavy space superiority fighter used by the UEE Navy.',
            };
        }

        // Handle Hornet Mk I / Mk II naming
        if (ship.ClassName.startsWith('ANVL_Hornet_F7')) {
            let name = ship.Name;
            const isMk2 = ship.ClassName.includes('_Mk2') ||
                ship.ClassName.includes('_MkII') ||
                ship.ClassName === 'ANVL_Hornet_F7A'; // Special case for Mk II F7A

            if (isMk2) {
                if (!name.includes('Mk II')) name += ' Mk II';
            } else {
                // Assume anything else is Mk I (including F7A_Mk1 and base F7C variants)
                if (!name.includes('Mk I') && !name.includes('Mk II')) name += ' Mk I';
            }
            return { ...ship, Name: name };
        }

        // Remove "MISC " and "C.O. " prefixes if present
        if (ship.Name.toUpperCase().startsWith('MISC ')) {
            ship = { ...ship, Name: ship.Name.substring(5).trim() };
        }
        if (ship.Name.toUpperCase().startsWith('C.O. ')) {
            ship = { ...ship, Name: ship.Name.substring(5).trim() };
        }

        return ship;
    });

    const c8rExists = ships.some(s => s.ClassName === 'ANVL_Pisces_C8R' || s.Name.toLowerCase().includes('c8r pisces rescue'));

    const polaris: Ship = {
        ClassName: 'RSI_Polaris',
        Name: 'RSI Polaris',
        Size: 6,
        Mass: 15000000,
        Cargo: 216,
        Role: 'Corvette',
        Career: 'Military',
        Description: 'The RSI Polaris is a corvette-class capital ship developed for the UEE Navy. Ideally suited for naval patrol and border security, it features a massive torpedo payload and a small hangar bay.',
        Manufacturer: { Code: 'RSI', Name: 'Roberts Space Industries' }
    };

    const perseus: Ship = {
        ClassName: 'RSI_Perseus',
        Name: 'RSI Perseus',
        Size: 5,
        Mass: 4181274,
        Cargo: 96,
        Role: 'Heavy Gunship',
        Career: 'Military',
        Description: 'The RSI Perseus is a formidable heavy gunship designed for engaging larger threats, blockading, and fleet defense. It features two massive manned turrets with Size 8 cannons.',
        Manufacturer: { Code: 'RSI', Name: 'Roberts Space Industries' }
    };

    const zeusES: Ship = {
        ClassName: 'RSI_Zeus_ES',
        Name: 'RSI Zeus Mk II ES',
        Size: 3,
        Mass: 500000,
        Cargo: 16,
        Role: 'Exploration',
        Career: 'Exploration',
        Description: 'The Zeus Mk II ES is a dedicated exploration vessel, featuring an advanced radar suite and robust defensive capabilities for long-range missions.',
        Manufacturer: { Code: 'RSI', Name: 'Roberts Space Industries' }
    };

    const zeusMR: Ship = {
        ClassName: 'RSI_Zeus_MR',
        Name: 'RSI Zeus Mk II MR',
        Size: 3,
        Mass: 500000,
        Cargo: 16,
        Role: 'Security',
        Career: 'Military',
        Description: 'The Zeus Mk II MR is a security-focused variant, equipped with an EMP and QED to track and disable target vessels.',
        Manufacturer: { Code: 'RSI', Name: 'Roberts Space Industries' }
    };

    const zeusCL: Ship = {
        ClassName: 'RSI_Zeus_CL',
        Name: 'RSI Zeus Mk II CL',
        Size: 3,
        Mass: 500000,
        Cargo: 128,
        Role: 'Transport',
        Career: 'Industrial',
        Description: 'The Zeus Mk II CL is a high-capacity cargo transport, capable of moving large loads safely across the verse.',
        Manufacturer: { Code: 'RSI', Name: 'Roberts Space Industries' }
    };

    const meteor: Ship = {
        ClassName: 'RSI_Meteor',
        Name: 'RSI Meteor',
        Size: 3,
        Mass: 65000,
        Cargo: 0,
        Role: 'Medium Fighter',
        Career: 'Combat',
        Description: 'A high-performance medium fighter from RSI, the Meteor is designed for aggressive engagements with a specialized loadout featuring Size 5 hardpoints.',
        Manufacturer: { Code: 'RSI', Name: 'Roberts Space Industries' }
    };

    const manualShips: Ship[] = [polaris, perseus, zeusES, zeusMR, zeusCL, meteor];

    if (!c8rExists) {
        manualShips.push({
            ClassName: 'ANVL_Pisces_C8R',
            Name: 'Anvil C8R Pisces Rescue',
            Size: 1,
            Mass: 55000,
            Cargo: 0,
            Role: 'Rescue',
            Career: 'Medical',
            Description: 'The Anvil C8R Pisces Rescue is a specialized medical variant of the Pisces, designed to provide emergency medical support and rapid extraction.',
            Manufacturer: { Code: 'ANVL', Name: 'Anvil Aerospace' }
        });
    }

    return [...patched, ...manualShips];
};

export const filterItemsForPort = (items: Item[], port: Port): Item[] => {
    return items.filter(item => {
        const typeMatch = port.Types.some(type => {
            const [mainType] = type.split('.');
            const itemType = (item.type || '').toLowerCase();
            const targetType = mainType.toLowerCase();
            const fullTargetType = type.toLowerCase();

            if (fullTargetType.includes('rocket')) return false;

            if ((targetType.includes('shield') || targetType === 'shld') &&
                (itemType.includes('shield') || (item.subType || '').toLowerCase().includes('shield'))) return true;

            if ((targetType.includes('power') || targetType === 'pwrp') &&
                (itemType.includes('power') || (item.subType || '').toLowerCase().includes('power'))) return true;

            if ((targetType.includes('cool') || targetType === 'clre') &&
                (itemType.includes('cool') || (item.subType || '').toLowerCase().includes('cool'))) return true;

            if ((targetType.includes('quantum') || targetType === 'qntm') &&
                (itemType.includes('quantum') || (item.subType || '').toLowerCase().includes('quantum'))) return true;

            const isGunPort = (targetType.includes('weapongun') && !fullTargetType.includes('rocket')) || targetType === 'turret' || targetType.includes('turretgun') || targetType === 'wepn';
            if (isGunPort) {
                const isGunItem = itemType.includes('weapongun') || itemType.includes('weaponmining') || itemType.includes('weapontractor');
                return isGunItem && !itemType.includes('missile');
            }

            const isMissilePort = targetType.includes('missile') || targetType === 'mslr';
            if (isMissilePort) {
                return itemType.includes('missile');
            }

            return itemType === targetType || itemType.includes(targetType) || targetType.includes(itemType);
        });

        const itemSize = Number(item.size);
        const minSize = Number(port.MinSize);
        const maxSize = Number(port.MaxSize);

        return typeMatch && itemSize >= minSize && itemSize <= maxSize;
    });
};

export const cleanName = (name: string, className?: string): string => {
    if (!name && !className) return 'Unknown Item';

    // 1. Initial Cleaning (Remove technical prefixes to allow matching)
    const raw = (name || '').trim();
    let clean = raw
        .replace(/@[\w\s]*Name[ _]?|@LOC_PLACE_HOLDER_|@LOC_PLACEHOLDER_|@item_Name_|@LOC /gi, '')
        .replace(/itemName/gi, '')
        .replace(/Name([A-Z])/g, '$1')
        .replace(/_/g, ' ')
        .replace(/\(.*\)/g, '')
        .replace(/Laswer/gi, 'Laser')
        .trim();

    // 2. Explicit Overrides for reported strings
    if (clean === 'HRST LaserRepeater S4' || clean.includes('HRST_LaserRepeater_S4')) return 'Attrition-4 Repeater';
    if (clean === 'KLWE LaserRepeater S4' || clean.includes('KLWE_LaserRepeater_S4')) return 'Rhino Repeater';
    if (clean === 'ESPR Laser Cannon' || clean === 'ESPR LaserCannon S4' || clean.includes('ESPR_LaserCannon')) return 'Lightstrike IV Cannon';
    if (clean === 'APAR BallisticGatling S4' || clean.includes('APAR_BallisticGatling_S4')) return 'Revenant Gatling';

    // 3. Map Lookup via ClassName (High Precision)
    if (className) {
        const normalized = className.toUpperCase().replace(/^NAME/i, '');
        if (WEAPON_NAME_MAP[normalized]) return WEAPON_NAME_MAP[normalized];

        // Match after stripping technical suffixes BUT preserving Size
        const stripped = normalized.replace(/(_TURRET|_LOWPOLY|_DUMMY|_VNG|_VANDUUL|_B_|_A_).*/gi, '');
        if (WEAPON_NAME_MAP[stripped]) return WEAPON_NAME_MAP[stripped];

        // Match after stripping everything after Size
        const sizeStripped = normalized.replace(/(_S\d).*/gi, '$1');
        if (WEAPON_NAME_MAP[sizeStripped]) return WEAPON_NAME_MAP[sizeStripped];
    }

    // 4. Fallback: Try to map the cleaned name to a key
    const mappingKey = clean.toUpperCase().replace(/\s/g, '_');
    if (WEAPON_NAME_MAP[mappingKey]) return WEAPON_NAME_MAP[mappingKey];

    // 5. Placeholder handling
    if (raw.includes('PLACEHOLDER') || raw.includes('<=') || raw.includes('@LOC')) {
        if (className) {
            return className.replace(/^NAME/i, '').replace(/(_TURRET|_LOWPOLY|_DUMMY|_VNG|_VANDUUL|_B_|_A_).*/gi, '').replace(/_/g, ' ').trim();
        }
    }

    return clean || className || 'Unknown Item';
};

export const getItemStats = (item: Item & { [key: string]: any }) => {
    const stats: { label: string; value: string }[] = [];
    if (item.type?.toLowerCase().includes('weapon')) {
        const damage = item.damage_per_shot || (item.ammunition?.damage) || 0;
        if (damage > 0) stats.push({ label: 'DMG', value: damage.toFixed(0) });
        const rof = item.fire_rate || (item.rotary?.rate_of_fire) || 0;
        if (rof > 0) stats.push({ label: 'RPM', value: rof.toFixed(0) });
    }
    if (item.type?.toLowerCase().includes('shield')) {
        const hp = item.max_shield_health || item.shield_health || 0;
        if (hp > 0) stats.push({ label: 'HP', value: hp.toLocaleString() });
        const regen = item.regeneration_rate || 0;
        if (regen > 0) stats.push({ label: 'REGEN', value: regen.toFixed(0) + '/s' });
    }
    if (item.type?.toLowerCase().includes('quantum')) {
        const speed = item.drive_speed || item.standard_speed || 0;
        if (speed > 0) stats.push({ label: 'SPD', value: (speed / 1000).toFixed(0) + 'k' });
    }
    return stats;
};
