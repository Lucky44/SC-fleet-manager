import type { Ship, Port, Item } from '../types';

const BASE_URL = 'https://scunpacked.com/api';

export const fetchShips = async (): Promise<Ship[]> => {
    const response = await fetch(`${BASE_URL}/v2/ships.json`);
    if (!response.ok) throw new Error('Failed to fetch ships');
    const data = await response.json();

    // Filter out internal/test ships
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filteredData = data.filter((ship: any) => {
        const c = ship.ClassName.toLowerCase();
        if (c.includes('test') || c.includes('cinematic') || c.includes('tutorial')) return false;
        return true;
    });

    // Deduplicate: If multiple ships have the same Name, keep the one with the shortest ClassName
    // This removes duplicates like "..._BIS2952" or "..._FW22NFZ"
    const uniqueShips = new Map<string, Ship>();

    // Sort by ClassName length ascending to ensure we process the 'base' version first
    filteredData.sort((a: any, b: any) => a.ClassName.length - b.ClassName.length);

    filteredData.forEach((ship: Ship) => {
        if (!uniqueShips.has(ship.Name)) {
            uniqueShips.set(ship.Name, ship);
        }
    });

    return applyShipPatches(Array.from(uniqueShips.values()));
};

export const fetchShipPorts = async (className: string): Promise<Port[]> => {
    const response = await fetch(`${BASE_URL}/v2/ships/${className.toLowerCase()}-ports.json`);
    const data = await response.json();
    // The API returns an object where keys are categories. We want a flat array.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawPorts = Object.values(data).flat() as any[];

    const normalizedPorts = rawPorts.map(p => ({
        ...p,
        Name: p.PortName || p.Name, // Map PortName to Name
        Types: p.Types || [],
        // Some ships (like Gladius) missing explicit Min/Max size on some ports
        MinSize: p.MinSize ?? p.Size ?? p.InstalledItem?.Size ?? 0,
        MaxSize: p.MaxSize ?? p.Size ?? p.InstalledItem?.Size ?? 10,
    }));

    return applyPortPatches(className, normalizedPorts);
};

const applyPortPatches = (className: string, ports: Port[]): Port[] => {
    if (className === 'ANVL_Lightning_F8') {
        // Remove the 4x Size 1 Shields
        const nonShields = ports.filter(p => !p.Name.toLowerCase().includes('shield'));

        // Add 2x Size 2 Shields (Sheut)
        // Sheut is Grade 2 Military Shield
        const newShields: Port[] = [
            {
                Name: 'shield_generator_1',
                MaxSize: 2,
                MinSize: 2,
                Types: ['Shield.ShieldGenerator'],
                InstalledItem: {
                    Name: 'Sheut',
                    ClassName: 'shld_fr66_s02', // Placeholder classname, likely wildly wrong but name matters for display
                    Size: 2
                }
            },
            {
                Name: 'shield_generator_2',
                MaxSize: 2,
                MinSize: 2,
                Types: ['Shield.ShieldGenerator'],
                InstalledItem: {
                    Name: 'Sheut',
                    ClassName: 'shld_fr66_s02',
                    Size: 2
                }
            }
        ];
        return [...nonShields, ...newShields];
    }
    return ports;
};

export const fetchItems = async (): Promise<Item[]> => {
    const response = await fetch(`${BASE_URL}/items.json`);
    if (!response.ok) throw new Error('Failed to fetch items');
    const data = await response.json();
    // Normalize data to ensure we have consistent property keys (API often uses PascalCase)
    // Normalize data to ensure we have consistent property keys (API often uses PascalCase)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalized = data.map((item: any) => {
        // SCUnpacked often has the "real" data in a stdItem object
        const std = item.stdItem;

        return {
            ...item,
            type: std?.Type || item.type || item.Type || '',
            subType: item.subType || item.SubType || item.sub_type || '',
            size: std?.Size || item.size || item.Size || 0,
            name: std?.Name || item.name || item.Name || 'Unknown',
            className: std?.ClassName || item.className || item.ClassName || '',
            manufacturer: std?.Manufacturer?.Name || item.manufacturer || item.Manufacturer || '',
            // Keep raw for complex logic if needed
            raw: item
        };
    }).filter(item => {
        // Filter out placeholders and invalid items
        if (item.name.startsWith('@') || item.name.includes('PLACEHOLDER')) return false;
        if (item.name === 'Unknown' || item.name === 'MISSING') return false;

        // Filter out FPS gear and Props
        // Use includes() because types can be "WeaponPersonal.Gadget", "Misc.UNDEFINED", etc.
        const typeLower = (item.type || '').toLowerCase();
        if (typeLower.includes('weaponpersonal')) return false;
        if (typeLower.includes('armor')) return false;
        if (typeLower.includes('gadget')) return false;
        if (typeLower.includes('misc')) return false;
        if (typeLower.includes('decal')) return false;
        if (typeLower.includes('door')) return false;
        if (typeLower.includes('aimodule')) return false;
        if (typeLower.includes('mobiglas')) return false;
        if (typeLower.includes('food')) return false;
        if (typeLower.includes('drink')) return false;

        // Filter out Weapon Attachments (Scopes, etc) and Missile Racks (for now, to simplify)
        if (typeLower.includes('weaponattachment')) return false;
        if (typeLower.includes('missilelauncher')) return false; // This hides racks. User implies they are junk.

        // Filter out generic placeholders
        const nameLower = item.name.toLowerCase();
        // Exact name matches for generic technical assets
        if (nameLower === 'turret') return false;
        if (nameLower === 'remote turret') return false;
        if (nameLower === 'manned turret') return false;
        if (nameLower === 'mannequin') return false;

        // Broad keyword bans for item names
        if (nameLower.includes('regenpool')) return false;
        if (nameLower.includes('weaponmount')) return false;
        if (nameLower.includes('ammobox')) return false;

        const classLower = item.className.toLowerCase();
        if (classLower.includes('_container')) return false;
        if (classLower.includes('controller')) return false;

        if (!item.className) return false;
        return true;
    });

    // Deduplicate items by Name
    const uniqueItems = new Map<string, Item>();

    // Sort by ClassName length to keep 'base' versions
    normalized.sort((a, b) => a.className.length - b.className.length);

    normalized.forEach(item => {
        if (!uniqueItems.has(item.name)) {
            uniqueItems.set(item.name, item);
        }
    });

    return Array.from(uniqueItems.values());
};

// Patch specific ships with known issues (e.g. SCUnpacked has "Anvil F8" which is old data)
const applyShipPatches = (ships: Ship[]): Ship[] => {
    const patched = ships.map(ship => {
        if (ship.ClassName === 'ANVL_Lightning_F8') {
            return {
                ...ship,
                Name: 'F8C Lightning',
                Manufacturer: { Code: 'AEGS', Name: 'Aegis Dynamics' },
                Description: 'The F8C Lightning is the civilian variant of the heavy space superiority fighter used by the UEE Navy.',
                // Adjust stats if needed, but visuals are priority
            };
        }
        return ship;
    });

    // Manual Injections
    const polaris: Ship = {
        ClassName: 'RSI_Polaris',
        Name: 'RSI Polaris',
        Size: 6,
        Mass: 15000000, // Estimated
        Cargo: 216,
        Role: 'Corvette',
        Career: 'Military',
        Description: 'The RSI Polaris is a corvette-class capital ship developed for the UEE Navy. Ideally suited for naval patrol and border security, it features a massive torpedo payload and a small hangar bay.',
        Manufacturer: { Code: 'RSI', Name: 'Roberts Space Industries' },
        // Minimal valid data for types
        FlightController: { SCM: 100, Cruise: 900 },
        Propulsion: { FuelCapacity: 0, FuelIntakes: [], FuelTanks: [], Thrusters: [] },
        QuantumDrives: [],
        Shields: [],
        Weapons: []
    };

    return [...patched, polaris];
};

export const filterItemsForPort = (items: Item[], port: Port): Item[] => {
    const filtered = items.filter(item => {
        // Basic type matching
        const typeMatch = port.Types.some(type => {
            const [mainType] = type.split('.');
            const itemType = (item.type || '').toLowerCase();
            const itemSubType = (item.subType || '').toLowerCase();
            const targetType = mainType.toLowerCase();

            // Broad matching for common component types with aliases
            if ((targetType.includes('shield') || targetType === 'shld') &&
                (itemType.includes('shield') || itemSubType.includes('shield'))) return true;

            if ((targetType.includes('power') || targetType === 'pwrp') &&
                (itemType.includes('power') || itemSubType.includes('power'))) return true;

            if ((targetType.includes('cool') || targetType === 'clre') &&
                (itemType.includes('cool') || itemSubType.includes('cool'))) return true;

            if ((targetType.includes('quantum') || targetType === 'qntm') &&
                (itemType.includes('quantum') || itemSubType.includes('quantum'))) return true;

            // GUNS: Strict separation from missiles
            // Port Types: WeaponGun, Turret, TurretGun, Wepn
            // Item Types: WeaponGun, WeaponMining, WeaponTractor (but NOT Missile)
            const isGunPort = targetType.includes('weapongun') || targetType === 'turret' || targetType.includes('turretgun') || targetType === 'wepn';
            if (isGunPort) {
                const isGunItem = itemType.includes('weapongun') || itemType.includes('weaponmining') || itemType.includes('weapontractor');
                // Explicitly exclude missiles even if they matched above logic somehow
                const isMissile = itemType.includes('missile');
                return isGunItem && !isMissile;
            }

            // MISSILES
            // Port Types: MissileLauncher, TurretMissile, WeaponMissile, Mslr
            // Item Types: Missile, WeaponMissile, MissileLauncher
            const isMissilePort = targetType.includes('missile') || targetType === 'mslr';
            if (isMissilePort) {
                const isMissileItem = itemType.includes('missile');
                return isMissileItem;
            }

            return itemType === targetType || itemType.includes(targetType) || targetType.includes(itemType);
        });

        // Size matching
        const itemSize = Number(item.size);
        const minSize = Number(port.MinSize);
        const maxSize = Number(port.MaxSize);

        const sizeMatch = itemSize >= minSize && itemSize <= maxSize;

        return typeMatch && sizeMatch;
    });

    if (filtered.length === 0) {
        // Debug logging for empty results (helpful for user regression)
        console.warn(`[Filter Debug] Port: ${port.Name} (${port.Types.join(', ')}) S:${port.MinSize}-${port.MaxSize} -> No items found.`);
    }

    return filtered;
};

export const cleanName = (name: string): string => {
    return name
        .replace(/@item_Name_|@LOC_PLACEHOLDER_|\(.*\)/g, '')
        .replace(/_/g, ' ')
        .trim() || 'Unknown Item';
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getItemStats = (item: Item & { [key: string]: any }) => {
    const stats: { label: string; value: string }[] = [];

    // Weapon Damage (rough estimate from various possible fields)
    if (item.type?.toLowerCase().includes('weapon')) {
        // SCUnpacked data varies, we try to find common fields
        // This is a simplification as actual DPS calc is complex
        const damage = item.damage_per_shot || (item.ammunition?.damage) || 0;
        if (damage > 0) stats.push({ label: 'DMG', value: damage.toFixed(0) });

        const rof = item.fire_rate || (item.rotary?.rate_of_fire) || 0;
        if (rof > 0) stats.push({ label: 'RPM', value: rof.toFixed(0) });
    }

    // Shield HP
    if (item.type?.toLowerCase().includes('shield')) {
        const hp = item.max_shield_health || item.shield_health || 0;
        if (hp > 0) stats.push({ label: 'HP', value: hp.toLocaleString() });
        const regen = item.regeneration_rate || 0;
        if (regen > 0) stats.push({ label: 'REGEN', value: regen.toFixed(0) + '/s' });
    }

    // Quantum Drive Speed
    if (item.type?.toLowerCase().includes('quantum')) {
        const speed = item.drive_speed || item.standard_speed || 0;
        if (speed > 0) stats.push({ label: 'SPD', value: (speed / 1000).toFixed(0) + 'k' });
    }

    return stats;
};
