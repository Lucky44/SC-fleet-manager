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

        const extractPorts = (portList: any[], parentName: string = '', parentIsTurret: boolean = false, turretBaseName: string = ''): Port[] => {
            let extracted: Port[] = [];
            portList.forEach(p => {
                const rawName = p.PortName || p.Name || '';
                const item = p.InstalledItem;
                const itemType = (item?.Type || item?.type || '').toLowerCase();
                const itemTags = (item?.Tags || item?.tags || []).map((t: any) => String(t).toLowerCase());
                const nestedPorts = item?.Ports || item?.ports || [];

                // Add aggressive filtering for internal/invisible ports
                const flags = (p.Flags || p.flags || []).map((f: any) => String(f).toLowerCase());
                const isTurret = itemType.includes('turret');
                if ((flags.includes('invisible') || flags.includes('uneditable') || p.Uneditable === true) && !isTurret) {
                    return;
                }

                if (rawName.toLowerCase().includes('fuel_tank') || rawName.toLowerCase().includes('thruster')) {
                    return;
                }


                // Aggressive mount identification
                const isRack = itemType.includes('missilelauncher') || itemType.includes('missilerack') || itemType.includes('missile.rack');
                const isGimbal = isTurret || itemTags.includes('gimbalmount') || itemTags.includes('gimbal') || itemType.includes('gimbal');
                const isMount = isGimbal || isRack;

                let childPorts: any[] = [];
                if (isMount && Array.isArray(nestedPorts)) {
                    childPorts = nestedPorts.filter((cp: any) => {
                        const types = (cp.Types || cp.types || []).join(',').toLowerCase();
                        const category = (cp.Category || cp.category || '').toLowerCase();
                        return types.includes('gun') || types.includes('missile') || types.includes('torpedo') ||
                            category.includes('weapon') || category.includes('missile');
                    });
                }

                if (childPorts.length > 0) {
                    // Recurse into children to handle gimbals-on-turrets (e.g. Carrack, Corsair pilot guns)
                    const currentTurretBase = isTurret ? cleanPortName(rawName) : (parentIsTurret ? turretBaseName : '');
                    const promotedChildren = extractPorts(childPorts, rawName, isTurret || parentIsTurret, currentTurretBase);

                    promotedChildren.forEach((cp, index) => {
                        let displayName = cleanPortName(rawName);

                        // Add context if multiple items promoted from the same mount
                        if (promotedChildren.length > 1) {
                            const cn = (cp.Name || '').toLowerCase();
                            if (cn.includes('left')) displayName += ' (L)';
                            else if (cn.includes('right')) displayName += ' (R)';
                            else if (cn.includes('top')) displayName += ' (T)';
                            else if (cn.includes('bottom')) displayName += ' (B)';
                            else displayName += ` (${index + 1})`;
                        }

                        extracted.push({
                            ...cp,
                            DisplayName: displayName,
                            TurretBaseName: cp.TurretBaseName || (isTurret ? cleanPortName(rawName) : (parentIsTurret ? turretBaseName : ''))
                        });
                    });
                } else {
                    // Standard port or mount with no removable children
                    const uniqueName = parentName ? `${parentName} > ${rawName}` : rawName;
                    extracted.push({
                        ...p,
                        Name: uniqueName,
                        DisplayName: p.DisplayName || (parentName ? cleanPortName(parentName) : cleanPortName(rawName)),
                        TurretBaseName: p.TurretBaseName || (isTurret ? cleanPortName(rawName) : (parentIsTurret ? turretBaseName : '')),
                        Types: p.Types || p.types || [],
                        Turret: isTurret || parentIsTurret,
                        MinSize: p.MinSize ?? p.Size ?? p.InstalledItem?.Size ?? 0,
                        MaxSize: p.MaxSize ?? p.Size ?? p.InstalledItem?.Size ?? 10,
                    });
                }
            });
            return extracted;
        };

        const normalizedPorts = extractPorts(rawPorts);
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
            { Name: 'shield_generator_1', MaxSize: 2, MinSize: 2, Types: ['Shield.ShieldGenerator'], InstalledItem: { Name: 'Sukoran', ClassName: 'SHLD_BANU_S02_Sukoran', Size: 2 } },
            { Name: 'shield_generator_2', MaxSize: 2, MinSize: 2, Types: ['Shield.ShieldGenerator'], InstalledItem: { Name: 'Sukoran', ClassName: 'SHLD_BANU_S02_Sukoran', Size: 2 } },
        ];
        return [...nonShields, ...newShields];
    }
    if (className === 'RSI_Meteor') {
        const weaponPorts: Port[] = [
            { Name: 'weapon_hardpoint_1', DisplayName: 'Main Forward S5', MaxSize: 5, MinSize: 1, Types: ['WeaponGun'], InstalledItem: { Name: 'M7A Laser Cannon', ClassName: 'BEHR_LaserCannon_S5', Size: 5 } },
            { Name: 'weapon_hardpoint_2', DisplayName: 'Main Forward S5', MaxSize: 5, MinSize: 1, Types: ['WeaponGun'], InstalledItem: { Name: 'M7A Laser Cannon', ClassName: 'BEHR_LaserCannon_S5', Size: 5 } },
            { Name: 'weapon_hardpoint_3', DisplayName: 'Wing S3', MaxSize: 3, MinSize: 1, Types: ['WeaponGun'], InstalledItem: { Name: 'Panther Repeater', ClassName: 'KLWE_LaserRepeater_S3', Size: 3 } },
            { Name: 'weapon_hardpoint_4', DisplayName: 'Wing S3', MaxSize: 3, MinSize: 1, Types: ['WeaponGun'], InstalledItem: { Name: 'Panther Repeater', ClassName: 'KLWE_LaserRepeater_S3', Size: 3 } },
            { Name: 'weapon_hardpoint_5', DisplayName: 'Wing S3', MaxSize: 3, MinSize: 1, Types: ['WeaponGun'], InstalledItem: { Name: 'Panther Repeater', ClassName: 'KLWE_LaserRepeater_S3', Size: 3 } },
            { Name: 'weapon_hardpoint_6', DisplayName: 'Wing S3', MaxSize: 3, MinSize: 1, Types: ['WeaponGun'], InstalledItem: { Name: 'Panther Repeater', ClassName: 'KLWE_LaserRepeater_S3', Size: 3 } },
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
            { Name: 'shield_generator_1', MaxSize: 2, MinSize: 2, Types: ['Shield.ShieldGenerator'], InstalledItem: { Name: 'FR-76', ClassName: 'SHLD_GODI_S02_FR76', Size: 2 } },
            { Name: 'power_plant_1', MaxSize: 2, MinSize: 2, Types: ['PowerPlant.PowerPlant'], InstalledItem: { Name: 'JS-400', ClassName: 'POWR_AMRS_S02_JS400', Size: 2 } },
            { Name: 'cooler_1', MaxSize: 2, MinSize: 2, Types: ['Cooler.Cooler'], InstalledItem: { Name: 'CoolCore', ClassName: 'COOL_JUST_S02_CoolCore', Size: 2 } },
            { Name: 'cooler_2', MaxSize: 2, MinSize: 2, Types: ['Cooler.Cooler'], InstalledItem: { Name: 'CoolCore', ClassName: 'COOL_JUST_S02_CoolCore', Size: 2 } },
            { Name: 'quantum_drive_1', MaxSize: 2, MinSize: 2, Types: ['QuantumDrive.QuantumDrive'], InstalledItem: { Name: 'Crossfield', ClassName: 'QDRV_WETK_S02_Crossfield', Size: 2 } },
        ];
        return [...weaponPorts, ...missilePorts, ...componentPorts];
    }
    if (className === 'RSI_Perseus') {
        const weaponPorts: Port[] = [
            { Name: 'manned_turret_1_1', DisplayName: 'Gun 1', TurretBaseName: 'Dorsal S8 Turret', MaxSize: 8, MinSize: 8, Types: ['Turret'], Turret: true, InstalledItem: { Name: 'S8 Ballistic Cannon', ClassName: 'BEHR_BallisticCannon_S8', Size: 8 } },
            { Name: 'manned_turret_1_2', DisplayName: 'Gun 2', TurretBaseName: 'Dorsal S8 Turret', MaxSize: 8, MinSize: 8, Types: ['Turret'], Turret: true, InstalledItem: { Name: 'S8 Ballistic Cannon', ClassName: 'BEHR_BallisticCannon_S8', Size: 8 } },
            { Name: 'manned_turret_2_1', DisplayName: 'Gun 1', TurretBaseName: 'Ventral S8 Turret', MaxSize: 8, MinSize: 8, Types: ['Turret'], Turret: true, InstalledItem: { Name: 'S8 Ballistic Cannon', ClassName: 'BEHR_BallisticCannon_S8', Size: 8 } },
            { Name: 'manned_turret_2_2', DisplayName: 'Gun 2', TurretBaseName: 'Ventral S8 Turret', MaxSize: 8, MinSize: 8, Types: ['Turret'], Turret: true, InstalledItem: { Name: 'S8 Ballistic Cannon', ClassName: 'BEHR_BallisticCannon_S8', Size: 8 } },
            { Name: 'remote_turret_1_1', DisplayName: 'Gun 1', TurretBaseName: 'Remote S3 Turret - Top L', MaxSize: 3, MinSize: 3, Types: ['Turret'], Turret: true, InstalledItem: { Name: 'Panther Repeater', ClassName: 'KLWE_LaserRepeater_S3', Size: 3 } },
            { Name: 'remote_turret_1_2', DisplayName: 'Gun 2', TurretBaseName: 'Remote S3 Turret - Top L', MaxSize: 3, MinSize: 3, Types: ['Turret'], Turret: true, InstalledItem: { Name: 'Panther Repeater', ClassName: 'KLWE_LaserRepeater_S3', Size: 3 } },
            { Name: 'remote_turret_2_1', DisplayName: 'Gun 1', TurretBaseName: 'Remote S3 Turret - Top R', MaxSize: 3, MinSize: 3, Types: ['Turret'], Turret: true, InstalledItem: { Name: 'Panther Repeater', ClassName: 'KLWE_LaserRepeater_S3', Size: 3 } },
            { Name: 'remote_turret_2_2', DisplayName: 'Gun 2', TurretBaseName: 'Remote S3 Turret - Top R', MaxSize: 3, MinSize: 3, Types: ['Turret'], Turret: true, InstalledItem: { Name: 'Panther Repeater', ClassName: 'KLWE_LaserRepeater_S3', Size: 3 } },
            { Name: 'remote_turret_3_1', DisplayName: 'Gun 1', TurretBaseName: 'Remote S3 Turret - Btm L', MaxSize: 3, MinSize: 3, Types: ['Turret'], Turret: true, InstalledItem: { Name: 'Panther Repeater', ClassName: 'KLWE_LaserRepeater_S3', Size: 3 } },
            { Name: 'remote_turret_3_2', DisplayName: 'Gun 2', TurretBaseName: 'Remote S3 Turret - Btm L', MaxSize: 3, MinSize: 3, Types: ['Turret'], Turret: true, InstalledItem: { Name: 'Panther Repeater', ClassName: 'KLWE_LaserRepeater_S3', Size: 3 } },
            { Name: 'remote_turret_4_1', DisplayName: 'Gun 1', TurretBaseName: 'Remote S3 Turret - Btm R', MaxSize: 3, MinSize: 3, Types: ['Turret'], Turret: true, InstalledItem: { Name: 'Panther Repeater', ClassName: 'KLWE_LaserRepeater_S3', Size: 3 } },
            { Name: 'remote_turret_4_2', DisplayName: 'Gun 2', TurretBaseName: 'Remote S3 Turret - Btm R', MaxSize: 3, MinSize: 3, Types: ['Turret'], Turret: true, InstalledItem: { Name: 'Panther Repeater', ClassName: 'KLWE_LaserRepeater_S3', Size: 3 } },
        ];
        const torpedoPorts: Port[] = Array.from({ length: 20 }, (_, i) => ({
            Name: `torpedo_${i + 1}`,
            DisplayName: `S5 Torpedo ${i + 1}`,
            MaxSize: 5,
            MinSize: 5,
            Types: ['MissileLauncher'],
            InstalledItem: { Name: 'Stalker V', ClassName: 'MISS_BEHR_S05_Stalker_V', Size: 5 }
        }));
        const componentPorts: Port[] = [
            { Name: 'shield_generator_1', MaxSize: 3, MinSize: 3, Types: ['Shield.ShieldGenerator'], InstalledItem: { Name: 'FR-86', ClassName: 'SHLD_GODI_S03_FR86', Size: 3 } },
            { Name: 'shield_generator_2', MaxSize: 3, MinSize: 3, Types: ['Shield.ShieldGenerator'], InstalledItem: { Name: 'FR-86', ClassName: 'SHLD_GODI_S03_FR86', Size: 3 } },
            { Name: 'power_plant_1', MaxSize: 3, MinSize: 3, Types: ['PowerPlant.PowerPlant'], InstalledItem: { Name: 'JS-500', ClassName: 'POWR_AMRS_S03_JS500', Size: 3 } },
            { Name: 'power_plant_2', MaxSize: 3, MinSize: 3, Types: ['PowerPlant.PowerPlant'], InstalledItem: { Name: 'JS-500', ClassName: 'POWR_AMRS_S03_JS500', Size: 3 } },
            { Name: 'cooler_1', MaxSize: 3, MinSize: 3, Types: ['Cooler.Cooler'], InstalledItem: { Name: 'ThermalCore', ClassName: 'COOL_JUST_S03_ThermalCore', Size: 3 } },
            { Name: 'cooler_2', MaxSize: 3, MinSize: 3, Types: ['Cooler.Cooler'], InstalledItem: { Name: 'ThermalCore', ClassName: 'COOL_JUST_S03_ThermalCore', Size: 3 } },
            { Name: 'quantum_drive_1', MaxSize: 3, MinSize: 3, Types: ['QuantumDrive.QuantumDrive'], InstalledItem: { Name: 'Pontiac', ClassName: 'QDRV_WETK_S03_Pontiac', Size: 3 } },
        ];
        return [...weaponPorts, ...torpedoPorts, ...componentPorts];
    }

    if (className === 'ANVL_Pisces_C8R') {
        return [
            { Name: 'weapon_hardpoint_1', DisplayName: 'Weapon S1', MaxSize: 1, MinSize: 1, Types: ['WeaponGun'], InstalledItem: { Name: 'M3A Laser Cannon', ClassName: 'BEHR_LaserCannon_S1', Size: 1 } },
            { Name: 'weapon_hardpoint_2', DisplayName: 'Weapon S1', MaxSize: 1, MinSize: 1, Types: ['WeaponGun'], InstalledItem: { Name: 'M3A Laser Cannon', ClassName: 'BEHR_LaserCannon_S1', Size: 1 } },
            { Name: 'missile_rack_1', DisplayName: 'Missile Rack S1', MaxSize: 1, MinSize: 1, Types: ['MissileLauncher'], InstalledItem: { Name: 'Taskforce I', ClassName: 'MISS_BEHR_S01_Taskforce_I', Size: 1 } },
            { Name: 'missile_rack_2', DisplayName: 'Missile Rack S1', MaxSize: 1, MinSize: 1, Types: ['MissileLauncher'], InstalledItem: { Name: 'Taskforce I', ClassName: 'MISS_BEHR_S01_Taskforce_I', Size: 1 } },
            { Name: 'shield_generator_1', MaxSize: 1, MinSize: 1, Types: ['Shield.ShieldGenerator'], InstalledItem: { Name: 'FR-66', ClassName: 'SHLD_GODI_S01_FR66', Size: 1 } },
            { Name: 'power_plant_1', MaxSize: 1, MinSize: 1, Types: ['PowerPlant.PowerPlant'], InstalledItem: { Name: 'JS-300', ClassName: 'POWR_AMRS_S01_JS300', Size: 1 } },
            { Name: 'cooler_1', MaxSize: 1, MinSize: 1, Types: ['Cooler.Cooler'], InstalledItem: { Name: 'Bracer', ClassName: 'COOL_AEGS_S01_Bracer', Size: 1 } },
            { Name: 'cooler_2', MaxSize: 1, MinSize: 1, Types: ['Cooler.Cooler'], InstalledItem: { Name: 'Bracer', ClassName: 'COOL_AEGS_S01_Bracer', Size: 1 } },
            { Name: 'quantum_drive_1', MaxSize: 1, MinSize: 1, Types: ['QuantumDrive.QuantumDrive'], InstalledItem: { Name: 'Atlas', ClassName: 'QDRV_RSI_S01_Atlas', Size: 1 } },
        ];
    }

    if (className === 'DRAK_Corsair') {
        const weaponPorts: Port[] = [
            { Name: 'hardpoint_cheek_weapon_left', DisplayName: 'Front Cheek (L) S4', MaxSize: 4, MinSize: 1, Types: ['WeaponGun'], InstalledItem: { Name: 'M6A Laser Cannon', ClassName: 'BEHR_LaserCannon_S4', Size: 4 } },
            { Name: 'hardpoint_cheek_weapon_right', DisplayName: 'Front Cheek (R) S4', MaxSize: 4, MinSize: 1, Types: ['WeaponGun'], InstalledItem: { Name: 'M6A Laser Cannon', ClassName: 'BEHR_LaserCannon_S4', Size: 4 } },
            { Name: 'hardpoint_chin_weapon_left', DisplayName: 'Front Chin (L) S4', MaxSize: 4, MinSize: 1, Types: ['WeaponGun'], InstalledItem: { Name: 'M6A Laser Cannon', ClassName: 'BEHR_LaserCannon_S4', Size: 4 } },
            { Name: 'hardpoint_chin_weapon_right', DisplayName: 'Front Chin (R) S4', MaxSize: 4, MinSize: 1, Types: ['WeaponGun'], InstalledItem: { Name: 'M6A Laser Cannon', ClassName: 'BEHR_LaserCannon_S4', Size: 4 } },
            { Name: 'hardpoint_weapon_wing_top', DisplayName: 'Wing S5 (Top)', MaxSize: 5, MinSize: 1, Types: ['WeaponGun'], InstalledItem: { Name: 'M7A Laser Cannon', ClassName: 'BEHR_LaserCannon_S5', Size: 5 } },
            { Name: 'hardpoint_weapon_wing_bottom', DisplayName: 'Wing S5 (Bottom)', MaxSize: 5, MinSize: 1, Types: ['WeaponGun'], InstalledItem: { Name: 'M7A Laser Cannon', ClassName: 'BEHR_LaserCannon_S5', Size: 5 } },
            { Name: 'hardpoint_manned_turret_left > hardpoint_weapon_left', DisplayName: 'Gun 1', TurretBaseName: 'Left Turret', MaxSize: 2, MinSize: 1, Types: ['WeaponGun'], Turret: true, InstalledItem: { Name: 'CF-227 Badger Repeater', ClassName: 'KLWE_LaserRepeater_S2', Size: 2 } },
            { Name: 'hardpoint_manned_turret_left > hardpoint_weapon_right', DisplayName: 'Gun 2', TurretBaseName: 'Left Turret', MaxSize: 2, MinSize: 1, Types: ['WeaponGun'], Turret: true, InstalledItem: { Name: 'CF-227 Badger Repeater', ClassName: 'KLWE_LaserRepeater_S2', Size: 2 } },
            { Name: 'hardpoint_manned_turret_right > hardpoint_weapon_left', DisplayName: 'Gun 1', TurretBaseName: 'Right Turret', MaxSize: 2, MinSize: 1, Types: ['WeaponGun'], Turret: true, InstalledItem: { Name: 'CF-227 Badger Repeater', ClassName: 'KLWE_LaserRepeater_S2', Size: 2 } },
            { Name: 'hardpoint_manned_turret_right > hardpoint_weapon_right', DisplayName: 'Gun 2', TurretBaseName: 'Right Turret', MaxSize: 2, MinSize: 1, Types: ['WeaponGun'], Turret: true, InstalledItem: { Name: 'CF-227 Badger Repeater', ClassName: 'KLWE_LaserRepeater_S2', Size: 2 } },
            { Name: 'hardpoint_tail_turret > hardpoint_weapon_left', DisplayName: 'Gun 1', TurretBaseName: 'Rear Turret', MaxSize: 2, MinSize: 1, Types: ['WeaponGun'], Turret: true, InstalledItem: { Name: 'CF-227 Badger Repeater', ClassName: 'KLWE_LaserRepeater_S2', Size: 2 } },
            { Name: 'hardpoint_tail_turret > hardpoint_weapon_right', DisplayName: 'Gun 2', TurretBaseName: 'Rear Turret', MaxSize: 2, MinSize: 1, Types: ['WeaponGun'], Turret: true, InstalledItem: { Name: 'CF-227 Badger Repeater', ClassName: 'KLWE_LaserRepeater_S2', Size: 2 } },
        ];
        return [...weaponPorts, ...ports.filter(p => !weaponPorts.some(wp => p.Name.startsWith(wp.Name)))];
    }

    if (className === 'RSI_Polaris') {
        const turrets: Port[] = [
            { Name: 'remote_turret_nose_1', DisplayName: 'Gun 1', TurretBaseName: 'Remote Nose Turret', MaxSize: 5, MinSize: 5, Types: ['Turret'], Turret: true, InstalledItem: { Name: 'M7A Laser Cannon', ClassName: 'BEHR_LaserCannon_S5', Size: 5 } },
            { Name: 'remote_turret_nose_2', DisplayName: 'Gun 2', TurretBaseName: 'Remote Nose Turret', MaxSize: 5, MinSize: 5, Types: ['Turret'], Turret: true, InstalledItem: { Name: 'M7A Laser Cannon', ClassName: 'BEHR_LaserCannon_S5', Size: 5 } },
            { Name: 'manned_turret_port_1', DisplayName: 'Gun 1', TurretBaseName: 'Manned Port Turret', MaxSize: 5, MinSize: 5, Types: ['Turret'], Turret: true, InstalledItem: { Name: 'M7A Laser Cannon', ClassName: 'BEHR_LaserCannon_S5', Size: 5 } },
            { Name: 'manned_turret_port_2', DisplayName: 'Gun 2', TurretBaseName: 'Manned Port Turret', MaxSize: 5, MinSize: 5, Types: ['Turret'], Turret: true, InstalledItem: { Name: 'M7A Laser Cannon', ClassName: 'BEHR_LaserCannon_S5', Size: 5 } },
            { Name: 'manned_turret_starboard_1', DisplayName: 'Gun 1', TurretBaseName: 'Manned Starboard Turret', MaxSize: 5, MinSize: 5, Types: ['Turret'], Turret: true, InstalledItem: { Name: 'M7A Laser Cannon', ClassName: 'BEHR_LaserCannon_S5', Size: 5 } },
            { Name: 'manned_turret_starboard_2', DisplayName: 'Gun 2', TurretBaseName: 'Manned Starboard Turret', MaxSize: 5, MinSize: 5, Types: ['Turret'], Turret: true, InstalledItem: { Name: 'M7A Laser Cannon', ClassName: 'BEHR_LaserCannon_S5', Size: 5 } },
            { Name: 'remote_turret_top_fwd_1', DisplayName: 'Gun 1', TurretBaseName: 'Remote Top Fwd Turret', MaxSize: 4, MinSize: 4, Types: ['Turret'], Turret: true, InstalledItem: { Name: 'M6A Laser Cannon', ClassName: 'BEHR_LaserCannon_S4', Size: 4 } },
            { Name: 'remote_turret_top_fwd_2', DisplayName: 'Gun 2', TurretBaseName: 'Remote Top Fwd Turret', MaxSize: 4, MinSize: 4, Types: ['Turret'], Turret: true, InstalledItem: { Name: 'M6A Laser Cannon', ClassName: 'BEHR_LaserCannon_S4', Size: 4 } },
            { Name: 'remote_turret_top_aft_1', DisplayName: 'Gun 1', TurretBaseName: 'Remote Top Aft Turret', MaxSize: 4, MinSize: 4, Types: ['Turret'], Turret: true, InstalledItem: { Name: 'M6A Laser Cannon', ClassName: 'BEHR_LaserCannon_S4', Size: 4 } },
            { Name: 'remote_turret_top_aft_2', DisplayName: 'Gun 2', TurretBaseName: 'Remote Top Aft Turret', MaxSize: 4, MinSize: 4, Types: ['Turret'], Turret: true, InstalledItem: { Name: 'M6A Laser Cannon', ClassName: 'BEHR_LaserCannon_S4', Size: 4 } },
            { Name: 'remote_turret_ventral_1', DisplayName: 'Gun 1', TurretBaseName: 'Remote Ventral Turret', MaxSize: 4, MinSize: 4, Types: ['Turret'], Turret: true, InstalledItem: { Name: 'M6A Laser Cannon', ClassName: 'BEHR_LaserCannon_S4', Size: 4 } },
            { Name: 'remote_turret_ventral_2', DisplayName: 'Gun 2', TurretBaseName: 'Remote Ventral Turret', MaxSize: 4, MinSize: 4, Types: ['Turret'], Turret: true, InstalledItem: { Name: 'M6A Laser Cannon', ClassName: 'BEHR_LaserCannon_S4', Size: 4 } },
            { Name: 'remote_turret_rear_1', DisplayName: 'Gun 1', TurretBaseName: 'Remote Rear Turret', MaxSize: 4, MinSize: 4, Types: ['Turret'], Turret: true, InstalledItem: { Name: 'M6A Laser Cannon', ClassName: 'BEHR_LaserCannon_S4', Size: 4 } },
            { Name: 'remote_turret_rear_2', DisplayName: 'Gun 2', TurretBaseName: 'Remote Rear Turret', MaxSize: 4, MinSize: 4, Types: ['Turret'], Turret: true, InstalledItem: { Name: 'M6A Laser Cannon', ClassName: 'BEHR_LaserCannon_S4', Size: 4 } },
        ];
        const torpedoPorts: Port[] = Array.from({ length: 24 }, (_, i) => ({
            Name: `torpedo_${i + 1}`,
            DisplayName: `S10 Torpedo ${i + 1}`,
            MaxSize: 10,
            MinSize: 10,
            Types: ['MissileLauncher'],
            InstalledItem: { Name: 'Size 10 Torpedo', ClassName: 'MISS_TORP_S10', Size: 10 }
        }));
        const components: Port[] = [
            { Name: 'shield_generator_1', MaxSize: 4, MinSize: 4, Types: ['Shield.ShieldGenerator'], InstalledItem: { Name: 'Glacis', ClassName: 'SHLD_RSI_S04_POLARIS', Size: 4 } },
            { Name: 'shield_generator_2', MaxSize: 4, MinSize: 4, Types: ['Shield.ShieldGenerator'], InstalledItem: { Name: 'Glacis', ClassName: 'SHLD_RSI_S04_POLARIS', Size: 4 } },
            { Name: 'power_plant_1', MaxSize: 4, MinSize: 4, Types: ['PowerPlant.PowerPlant'], InstalledItem: { Name: 'Stellate', ClassName: 'POWR_RSI_S04_POLARIS', Size: 4 } },
            { Name: 'power_plant_2', MaxSize: 4, MinSize: 4, Types: ['PowerPlant.PowerPlant'], InstalledItem: { Name: 'Stellate', ClassName: 'POWR_RSI_S04_POLARIS', Size: 4 } },
            { Name: 'cooler_1', MaxSize: 4, MinSize: 4, Types: ['Cooler.Cooler'], InstalledItem: { Name: 'Serac', ClassName: 'COOL_RSI_S04_POLARIS', Size: 4 } },
            { Name: 'cooler_2', MaxSize: 4, MinSize: 4, Types: ['Cooler.Cooler'], InstalledItem: { Name: 'Serac', ClassName: 'COOL_RSI_S04_POLARIS', Size: 4 } },
            { Name: 'quantum_drive_1', MaxSize: 4, MinSize: 4, Types: ['QuantumDrive.QuantumDrive'], InstalledItem: { Name: 'Siren', ClassName: 'QDRV_RSI_S04_POLARIS', Size: 4 } },
        ];
        return [...turrets, ...torpedoPorts, ...components];
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
                        InstalledItem: p.InstalledItem ? { ...p.InstalledItem, Size: 4 } : { Name: 'Rhino Repeater', ClassName: 'KLWE_LaserRepeater_S4', Size: 4 }
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

const COMPONENT_NAME_MAP: Record<string, string> = {
    // Shield Overrides
    'SHLD_BEHR_S01_6SA': 'Arbiter',
    'SHLD_BEHR_S02_5MA': 'Chimalli',
    'SHLD_BEHR_S03_7CA': 'Nargun',
    'SHLD_BEHR_S01_7SA': 'Concord',
    'SHLD_BEHR_S02_6MA': 'Kozane',
    'SHLD_BEHR_S03_6CA': 'Bila',
    'SHLD_BEHR_S01_5SA': 'Rhada',
    'SHLD_BEHR_S02_7MA': 'Lorica',
    'SHLD_BEHR_S03_5CA': 'Akura',
    'SHLD_ASAS_S01_MIRAGE': 'Mirage',
    'SHLD_ASAS_S01_VEIL': 'Veil',
    'SHLD_ASAS_S01_CLOAK': 'Cloak',
    'SHLD_ASAS_S01_SHIMMER': 'Shimmer',
    'SHLD_ASAS_S02_SHROUD': 'Shroud',
    'SHLD_ASAS_S02_UMBRA': 'Umbra',
    'SHLD_ASAS_S02_SHEUT': 'Sheut',
    'SHLD_ASAS_S02_OBSCURA': 'Obscura',
    'SHLD_BASL_S00_CASTRA': 'Castra',
    'SHLD_BASL_S01_STEWARD': 'Steward',
    'SHLD_BASL_S02_ASPIS': 'Aspis',
    'SHLD_BASL_S03_WARD': 'Ward',
    'SHLD_BASL_S01_PALISADE': 'Palisade',
    'SHLD_BASL_S01_GUARDIAN': 'Guardian',
    'SHLD_BASL_S01_BULWARK': 'Bulwark',
    'SHLD_BASL_S02_ARMADA': 'Armada',
    'SHLD_BASL_S02_RAMPART': 'Rampart',
    'SHLD_BASL_S02_CITADEL': 'Citadel',
    'SHLD_BASL_S03_PARAPET': 'Parapet',
    'SHLD_BASL_S03_STRONGHOLD': 'Stronghold',
    'SHLD_BASL_S03_BARBICAN': 'Barbican',
    'SHLD_GODI_S01_FR66': 'FR-66',
    'SHLD_GODI_S02_FR76': 'FR-76',
    'SHLD_GODI_S03_FR86': 'FR-86',
    'SHLD_GODI_S01_ALLSTOP': 'AllStop',
    'SHLD_GODI_S01_FORCEWALL': 'ForceWall',
    'SHLD_GODI_S01_SECUREHYDE': 'SecureHyde',
    'SHLD_GODI_S02_SECURESHIELD': 'SecureShield',
    'SHLD_GODI_S02_COVERALL': 'CoverAll',
    'SHLD_GODI_S02_FULLSTOP': 'FullStop',
    'SHLD_GODI_S03_SURESTOP': 'SureStop',
    'SHLD_GODI_S03_FULLBLOCK': 'FullBlock',
    'SHLD_GODI_S03_SECURESCREEN': 'SecureScreen',
    'SHLD_BANU_S01_PLACEHOLDER': 'Suldrath',
    'SHLD_BANU_S02_PLACEHOLDER': 'Sukoran',
    'SHLD_YORM_S01_FALCO': 'Falco',
    'SHLD_YORM_S01_JAGHTE': 'Jaghte',
    'SHLD_YORM_S01_TARGA': 'Targa',
    'SHLD_YORM_S02_BAMOTY': 'Bamoty',
    'SHLD_YORM_S02_TRENTA': 'Trenta',
    'SHLD_YORM_S02_HALTUR': 'Haltur',
    'SHLD_SECO_S00_PIN': 'PIN',
    'SHLD_SECO_S01_HEX': 'Hex',
    'SHLD_SECO_S01_INK': 'Ink',
    'SHLD_SECO_S01_WEB': 'Web',
    'SHLD_SECO_S02_RPEL': 'Rpel',
    'SHLD_SECO_S02_STOP': 'Stop',
    'SHLD_SECO_S02_BLOC': 'Bloc',
    'SHLD_SECO_S03_GUARD': 'Guard',
    'SHLD_SECO_S03_ARMOR': 'Armor',
    'SHLD_SECO_S03_HAVEN': 'Haven',
    'SHLD_AEGS_S04_RECLAIMER': 'RS-Barrier',
    'SHLD_GODI_S04_IDRIS': 'Holdstrong',
    'SHLD_RSI_S04_POLARIS': 'Glacis',
    'SHLD_ORIG_S04_890J': 'Glacis',

    // Power Plant Overrides
    'POWR_ACOM_S01_SUNFLARE': 'SunFlare',
    'POWR_ACOM_S01_STARHEART': 'StarHeart',
    'POWR_ACOM_S02_SOLARFLARE': 'SolarFlare',
    'POWR_ACOM_S02_STARBURN': 'StarBurn',
    'POWR_ACOM_S02_LUXCORE': 'LuxCore',
    'POWR_ACOM_S01_LUMACORE': 'LumaCore',
    'POWR_AEGS_S03_FULGUR': 'Fulgur',
    'POWR_AEGS_S03_DRASSIK': 'Drassik',
    'POWR_AEGS_S01_QUADRACELL': 'QuadraCell',
    'POWR_AEGS_S02_QUADRACELLMT': 'QuadraCell MT',
    'POWR_AEGS_S03_QUADRACELLMX': 'QuadraCell MX',
    'POWR_AEGS_S02_BOLIDE': 'Bolide',
    'POWR_AEGS_S03_CENTURION': 'Centurion',
    'POWR_AEGS_S01_REGULUS': 'Regulus',
    'POWR_AEGS_S01_CHARGER': 'Charger',
    'POWR_AEGS_S02_MAELSTROM': 'Maelstrom',
    'POWR_AEGS_S02_VORTEX': 'Vortex',
    'POWR_AEGS_S01_FIERELLCASCADE': 'Fierell Cascade',
    'POWR_AMRS_S01_OVERDRIVE': 'OverDrive',
    'POWR_AMRS_S02_JS400': 'JS-400',
    'POWR_AMRS_S02_ULTRAFLUX': 'UltraFlux',
    'POWR_AMRS_S03_SUPERDRIVE': 'SuperDrive',
    'POWR_AMRS_S02_EXOGEN': 'ExoGen',
    'POWR_AMRS_S01_HYPERGEN': 'HyperGen',
    'POWR_AMRS_S03_JS500': 'JS-500',
    'POWR_AMRS_S02_TURBODRIVE': 'TurboDrive',
    'POWR_AMRS_S01_DYNAFLUX': 'DynaFlux',
    'POWR_AMRS_S03_SMARTGEN': 'SmartGen',
    'POWR_AMRS_S01_JS300': 'JS-300',
    'POWR_AMRS_S03_MEGAFLUX': 'MegaFlux',
    'POWR_JUST_S01_FORTITUDE': 'Fortitude',
    'POWR_JUST_S03_DURANGO': 'Durango',
    'POWR_JUST_S01_ENDURANCE': 'Endurance',
    'POWR_JUST_S00_DEFIANT': 'Defiant',
    'POWR_JUST_S02_DILIGENCE': 'Diligence',
    'POWR_JUST_S02_GENOA': 'Genoa',
    'POWR_JUST_S02_TROMMEL': 'Trommel',
    'POWR_JUST_S03_GINZEL': 'Ginzel',
    'POWR_JUST_S02_SEDULITY': 'Sedulity',
    'POWR_JUST_S00_STEADFAST': 'Steadfast',
    'POWR_JUST_S01_ROUGHNECK': 'Roughneck',
    'POWR_JUST_S03_RELIANCE': 'Reliance',
    'POWR_JUST_S01_BRETON': 'Breton',
    'POWR_JUST_S00_JENNET': 'Jennet',
    'POWR_LPLT_S00_DURAJET': 'DuraJet',
    'POWR_LPLT_S03_IONSURGEPRO': 'IonSurge Pro',
    'POWR_LPLT_S00_RADIX': 'Radix',
    'POWR_LPLT_S03_SPARKJETPRO': 'SparkJet Pro',
    'POWR_LPLT_S01_POWERBOLT': 'PowerBolt',
    'POWR_LPLT_S02_FULLFORCE': 'FullForce',
    'POWR_LPLT_S00_IONWAVE': 'IonWave',
    'POWR_LPLT_S03_FULLFORCEPRO': 'FullForce Pro',
    'POWR_LPLT_S02_SPARKJET': 'SparkJet',
    'POWR_LPLT_S02_IONSURGE': 'IonSurge',
    'POWR_LPLT_S01_IONBURST': 'IonBurst',
    'POWR_LPLT_S01_ZAPJET': 'ZapJet',
    'POWR_SASU_S01_MAGNABLOOM': 'MagnaBloom',
    'POWR_SASU_S01_LIGHTBLOSSOM': 'LightBlossom',
    'POWR_SASU_S03_NEWDAWN': 'NewDawn',
    'POWR_SASU_S03_TIGERLILLY': 'TigerLilly',
    'POWR_SASU_S01_WHITEROSE': 'WhiteRose',
    'POWR_SASU_S02_DAYBREAK': 'DayBreak',
    'POWR_SASU_S02_RADIANCE': 'Radiance',
    'POWR_SASU_S03_CELESTIAL': 'Celestial',
    'POWR_SASU_S02_LOTUS': 'Lotus',
    'POWR_TYDT_S02_CIRRUS': 'Cirrus',
    'POWR_TYDT_S02_ECLIPSE': 'Eclipse',
    'POWR_TYDT_S02_GAMMAMAX': 'GammaMax',
    'POWR_TYDT_S01_SLIPSTREAM': 'Slipstream',
    'POWR_TYDT_S01_SONICLITE': 'SonicLite',
    'POWR_TYDT_S01_DELTAMAX': 'DeltaMax',
    'POWR_RSI_S04_POLARIS': 'Stellate',
    'POWR_ORIG_S04_890J': 'Stellate',

    // Quantum Drive Overrides
    'QDRV_ACAS_S02_SUNFIRE': 'SunFire',
    'QDRV_ARCC_S01_FLOOD': 'Flood',
    'QDRV_ARCC_S01_RUSH': 'Rush',
    'QDRV_ARCC_S03_IMPULSE': 'Impulse',
    'QDRV_ARCC_S03_ECHO': 'Echo',
    'QDRV_JUST_S01_VULCAN': 'Vulcan',
    'QDRV_JUST_S02_HURACAN': 'Huracan',
    'QDRV_JUST_S01_COLOSSUS': 'Colossus',
    'QDRV_JUST_S01_GOLIATH': 'Goliath',
    'QDRV_JUST_S01_PONTIUS': 'Pontius',
    'QDRV_JUST_S03_REVENANT': 'Revenant',
    'QDRV_RACO_S02_NOVA': 'Nova',
    'QDRV_RACO_S01_SPECTRE': 'Spectre',
    'QDRV_RACO_S02_BOLT': 'Bolt',
    'QDRV_RACO_S01_SIREN': 'Siren',
    'QDRV_RSI_S01_ATLAS': 'Atlas',
    'QDRV_RSI_S01_EOS': 'Eos',
    'QDRV_RSI_S01_HYPERION': 'Hyperion',
    'QDRV_RSI_S03_EREBOS': 'Erebos',
    'QDRV_RSI_S02_KHAOS': 'Khaos',
    'QDRV_RSI_S03_METIS': 'Metis',
    'QDRV_RSI_S03_HEURA': 'Heura',
    'QDRV_TARS_S01_EXPEDITION': 'Expedition',
    'QDRV_TARS_S03_WANDERER': 'Wanderer',
    'QDRV_TARS_S03_RANGER': 'Ranger',
    'QDRV_TARS_S03_DRIFTER': 'Drifter',
    'QDRV_TARS_S01_VOYAGE': 'Voyage',
    'QDRV_TARS_S02_ODYSSEY': 'Odyssey',
    'QDRV_TARS_S01_BEACON': 'Beacon',
    'QDRV_WETK_S02_CROSSFIELD': 'Crossfield',
    'QDRV_WETK_S02_YEAGER': 'Yeager',
    'QDRV_WETK_S01_VK00': 'VK-00',
    'QDRV_WETK_S02_XL1': 'XL-1',
    'QDRV_WETK_S03_BALANDIN': 'Balandin',
    'QDRV_WETK_S03_PONTIAC': 'Pontiac',
    'QDRV_WETK_S02_HEURA': 'Heura',
    'QDRV_WETK_S02_AGNI': 'Agni',
    'QDRV_RSI_S04_POLARIS': 'Siren',
    'QDRV_ORIG_S04_890J': 'Siren',
    'QDRV_AEGS_S04_RECLAIMER': 'Siren',
    'QDRV_AEGS_S04_IDRIS': 'Siren',

    // Cooler Overrides
    'COOL_AEGS_S01_GLACIER': 'Glacier',
    'COOL_AEGS_S02_BOREAL': 'Boreal',
    'COOL_AEGS_S02_ARCTIC': 'Arctic',
    'COOL_AEGS_S01_TUNDRA': 'Tundra',
    'COOL_AEGS_S02_PERMAFROST': 'Permafrost',
    'COOL_AEGS_S03_TEMPEST': 'Tempest',
    'COOL_AEGS_S03_MERCURY': 'Mercury',
    'COOL_AEGS_S03_GALINSTAN': 'Galinstan',
    'COOL_AEGS_S03_BLIZZARD': 'Blizzard',
    'COOL_AEGS_S01_POLAR': 'Polar',
    'COOL_AEGS_S01_BRACER': 'Bracer',
    'COOL_AEGS_S02_AVALANCHE': 'Avalanche',
    'COOL_AEGS_S04_RECLAIMER': 'Algid',
    'COOL_JSPN_S01_WINTERSTAR': 'Winter-Star',
    'COOL_JSPN_S00_FROSTSTARSL': 'Frost-Star SL',
    'COOL_JSPN_S00_WINTERSTARSL': 'Winter-Star SL',
    'COOL_JSPN_S02_FROSTSTAREX': 'Frost-Star EX',
    'COOL_JSPN_S01_CRYOSTAR': 'Cryo-Star',
    'COOL_JSPN_S00_CRYOSTARSL': 'Cryo-Star SL',
    'COOL_JSPN_S01_FROSTSTAR': 'Frost-Star',
    'COOL_JSPN_S02_WINTERSTAREX': 'Winter-Star EX',
    'COOL_JSPN_S03_WINTERSTARXL': 'Winter-Star XL',
    'COOL_JSPN_S02_CRYOSTAREX': 'Cryo-Star EX',
    'COOL_JSPN_S03_FROSTSTARXL': 'Frost-Star XL',
    'COOL_JSPN_S03_CRYOSTARXL': 'Cryo-Star XL',
    'COOL_WCPR_S00_FRIDAN': 'Fridan',
    'COOL_WCPR_S01_BERIAN': 'Berian',
    'COOL_WCPR_S00_KELVID': 'Kelvid',
    'COOL_WCPR_S03_KRAGEN': 'Kragen',
    'COOL_WCPR_S03_DRAUG': 'Draug',
    'COOL_WCPR_S03_ELSEN': 'Elsen',
    'COOL_WCPR_S00_TEPILO': 'Tepilo',
    'COOL_WCPR_S01_GELID': 'Gelid',
    'COOL_WCPR_S02_AUFEIS': 'Aufeis',
    'COOL_WCPR_S02_TAIGA': 'Taiga',
    'COOL_WCPR_S02_GRAUPEL': 'Graupel',
    'COOL_WCPR_S01_ENDO': 'Endo',
    'COOL_JUST_S01_THERMAX': 'Thermax',
    'COOL_JUST_S03_HYDROPULSE': 'Hydropulse',
    'COOL_JUST_S01_HYDROCEL': 'Hydrocel',
    'COOL_JUST_S02_HYDROJET': 'Hydrojet',
    'COOL_JUST_S01_ULTRAFLOW': 'Ultra-Flow',
    'COOL_JUST_S02_SNOWFALL': 'Snowfall',
    'COOL_JUST_S02_SNOWPACK': 'Snowpack',
    'COOL_JUST_S03_CHILLMAX': 'Chill-Max',
    'COOL_JUST_S03_THERMALCORE': 'ThermalCore',
    'COOL_JUST_S02_COOLCORE': 'CoolCore',
    'COOL_JUST_S03_ICEFLUSH': 'Ice-Flush',
    'COOL_JUST_S01_ECOFLOW': 'Eco-Flow',
    'COOL_TYDT_S02_NIGHTFALL': 'NightFall',
    'COOL_TYDT_S02_HEATSINK': 'HeatSink',
    'COOL_TYDT_S01_HEATSAFE': 'HeatSafe',
    'COOL_TYDT_S01_SNOWBLIND': 'SnowBlind',
    'COOL_TYDT_S01_VAPORBLOCK': 'VaporBlock',
    'COOL_TYDT_S02_ICEBOX': 'IceBox',
    'COOL_ACOM_S01_ICEPLUNGE': 'IcePlunge',
    'COOL_ACOM_S01_QUICKCOOL': 'QuikCool',
    'COOL_ACOM_S02_ABSOLUTEZERO': 'AbsoluteZero',
    'COOL_ACOM_S02_RAPIDCOOL': 'RapidCool',
    'COOL_ACOM_S02_ICEDIVE': 'IceDive',
    'COOL_ACOM_S01_ZERORUSH': 'ZeroRush',
    'COOL_LPLT_S02_FULLFROST': 'FullFrost',
    'COOL_LPLT_S01_BLASTCHILL': 'BlastChill',
    'COOL_LPLT_S02_WHITEOUT': 'WhiteOut',
    'COOL_LPLT_S03_FROSTBITE': 'FrostBite',
    'COOL_LPLT_S03_COLDSURGE': 'ColdSurge',
    'COOL_LPLT_S01_FLASHFREEZE': 'FlashFreeze',
    'COOL_LPLT_S01_ARCTICSTORM': 'ArcticStorm',
    'COOL_LPLT_S03_FROSTBURN': 'FrostBurn',
    'COOL_LPLT_S02_COLDSNAP': 'ColdSnap',
    'COOL_RSI_S04_POLARIS': 'Serac',
    'COOL_ORIG_S04_890J': 'Serac'
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
        if (typeLower.includes('mining') || typeLower.includes('tractor') || typeLower.includes('utility') || typeLower.includes('beam')) return false;
        if (typeLower.includes('missilelauncher')) return false;

        const nameLower = (item.name || '').toLowerCase();
        const classLower = (item.className || '').toLowerCase();
        const manufacturer = (item.manufacturer?.code || '').toLowerCase();

        // Block Greycat Industrial (GRIN) and utility keywords
        if (manufacturer === 'grin' || classLower.startsWith('grin_')) return false;
        if (nameLower.includes('tractor') || nameLower.includes('mining') || nameLower.includes('beam') || nameLower.includes('utility')) return false;
        if (classLower.includes('tractor') || classLower.includes('mining') || classLower.includes('beam') || classLower.includes('utility')) return false;

        if (nameLower === 'turret' || nameLower === 'remote turret' || nameLower === 'manned turret' || nameLower === 'mannequin' || nameLower.includes('gimbal mount')) return false;
        if (nameLower.includes('regenpool') || nameLower.includes('weaponmount') || nameLower.includes('ammobox')) return false;

        // Filter out "bespoke" or ship-specific massive items
        if (nameLower.includes('bespoke') || nameLower.includes('limited') || nameLower.includes('interior')) return false;
        if (nameLower.includes('idris') || nameLower.includes('javelin') || nameLower.includes('kraken')) return false;

        if (classLower.includes('_container') || classLower.includes('controller')) return false;
        if (classLower.includes('bespoke') || classLower.includes('massive')) return false;

        return !!item.className;
    });

    const uniqueItems = new Map<string, Item>();
    // Sort by className length - shorter usually means the "base" item/template
    normalized.sort((a: Item, b: Item) => a.className.length - b.className.length);

    normalized.forEach((item: any) => {
        // Use className for deduping to ensure all valid variations are kept
        if (!uniqueItems.has(item.className)) {
            // Resolve the best name during fetch
            // Priority: stdItem.Name > clean version of itemName > raw name > className
            let resolvedName = item.stdItem?.Name || '';

            if (!resolvedName || resolvedName.startsWith('@') || resolvedName.includes('_')) {
                resolvedName = cleanName(item.itemName || item.name || '', item.className);
            }

            uniqueItems.set(item.className, {
                ...item,
                name: resolvedName
            });
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
                const isGunItem = itemType.includes('weapongun');
                const nLower = (item.name || '').toLowerCase();
                const cLower = (item.className || '').toLowerCase();
                const isNonWeapon = nLower.includes('tractor') || nLower.includes('mining') || nLower.includes('beam') || nLower.includes('utility') ||
                    cLower.includes('tractor') || cLower.includes('mining') || cLower.includes('beam') || cLower.includes('utility') ||
                    cLower.startsWith('grin_');
                return isGunItem && !isNonWeapon && !itemType.includes('missile');
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

    const raw = (name || '').trim();
    let clean = raw;

    // 0. Quote Extraction (Preserve context if it's a weapon/component)
    if (raw.includes("'")) {
        const quoted = raw.match(/'([^']+)'/);
        if (quoted && quoted[1]) {
            // If the raw name contains Cannon/Repeater etc after the quote, append it
            const suffix = raw.split("'").pop()?.trim();
            if (suffix && (suffix.toLowerCase().includes('cannon') || suffix.toLowerCase().includes('repeater') || suffix.toLowerCase().includes('gatling') || suffix.toLowerCase().includes('scattergun'))) {
                clean = `${quoted[1]} ${suffix}`;
            } else {
                clean = quoted[1];
            }
        }
    }

    // 1. Initial Cleaning (Remove technical prefixes and sizes)
    clean = clean
        .replace(/@[\w\s]*Name[ _]?|@LOC_PLACE_HOLDER_|@LOC_PLACEHOLDER_|@item_Name_|@LOC /gi, '')
        .replace(/itemName/gi, '')
        .replace(/Name([A-Z])/g, '$1')
        .replace(/_/g, ' ')
        .replace(/\(S\d+\)/gi, '') // Remove (S1)
        .replace(/\sS\d+\s/gi, ' ') // Remove S4 in "Breakneck S4 Gatling"
        .replace(/\sS\d+$/gi, '')   // Remove S4 at end
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
        if (COMPONENT_NAME_MAP[normalized]) return COMPONENT_NAME_MAP[normalized];

        // Match after stripping technical suffixes BUT preserving Size
        const stripped = normalized.replace(/(_SCITEM|_TURRET|_LOWPOLY|_DUMMY|_VNG|_VANDUUL|_B_|_A_).*/gi, '');
        if (WEAPON_NAME_MAP[stripped]) return WEAPON_NAME_MAP[stripped];
        if (COMPONENT_NAME_MAP[stripped]) return COMPONENT_NAME_MAP[stripped];

        // Match after stripping everything after Size
        const sizeStripped = normalized.replace(/(_S\d+).*/gi, '$1');
        if (WEAPON_NAME_MAP[sizeStripped]) return WEAPON_NAME_MAP[sizeStripped];
        if (COMPONENT_NAME_MAP[sizeStripped]) return COMPONENT_NAME_MAP[sizeStripped];
    }

    // 4. Fallback: Try to map the cleaned name to a key
    const mappingKey = clean.toUpperCase().replace(/\s/g, '_');
    if (WEAPON_NAME_MAP[mappingKey]) return WEAPON_NAME_MAP[mappingKey];
    if (COMPONENT_NAME_MAP[mappingKey]) return COMPONENT_NAME_MAP[mappingKey];

    // 4. Map to Dictionary (Final check with suffix stripping)
    const rawClass = (className || '').toUpperCase().replace(/_SCITEM$|_SCITEM$/gi, '');
    const mapped = COMPONENT_NAME_MAP[rawClass] || WEAPON_NAME_MAP[rawClass];
    if (mapped) return mapped;

    // 5. Advanced Cleaning for components and weapons
    const prefixes = ['SHLD', 'COOL', 'POWR', 'QDRV', 'ITEM', 'TRNS', 'WEAP', 'MISS', 'TORP', 'GUN', 'PORT', 'HARDPOINT'];
    const manufacturers = ['AEGS', 'JUST', 'WCPR', 'JSPN', 'TYDT', 'LPLT', 'AMRS', 'ACOM', 'SASU', 'TARS', 'RACO', 'RSI', 'WETK', 'ARCC', 'ASAS', 'BASL', 'GODI', 'BEHR', 'KLWE', 'ESPR', 'APAR', 'GATS', 'PRAR', 'MXOX', 'VNCL', 'SECO', 'YORM', 'BRRA', 'ORIG', 'MRAI', 'CNOU', 'MISC', 'DRAK', 'ANVL', 'HRST', 'KRMN', 'KRON'];

    let finalClean = clean;

    // If name is technical, split and clean parts
    if (clean.includes('_') || clean === className || raw.includes('@LOC') || raw.includes('PLACEHOLDER') || /^[A-Z0-9_]+$/.test(clean)) {
        finalClean = (className || clean)
            .replace(/(_SCITEM|_TURRET|_LOWPOLY|_DUMMY|_VNG|_VANDUUL|_B_|_A_).*/gi, '')
            .replace(new RegExp(`^(${prefixes.join('|')})_`, 'i'), '')
            .replace(new RegExp(`^(${manufacturers.join('|')})_`, 'i'), '')
            .replace(/_LASERREPEATER/gi, ' Repeater')
            .replace(/_LASERCANNON/gi, ' Cannon')
            .replace(/_BALLISTICGATLING/gi, ' Gatling')
            .replace(/_BALLISTICCANNON/gi, ' Cannon')
            .replace(/_DISTORTIONSCATTERGUN/gi, ' Scattergun')
            .replace(/_?S\d+_?/gi, ' ') // Replace S1, S2 etc with space
            .replace(/_/g, ' ')
            .trim();

        // Title case it
        finalClean = finalClean.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');

        manufacturers.forEach(m => {
            const mRegex = new RegExp(`^${m}\\s`, 'i');
            finalClean = finalClean.replace(mRegex, '');
        });
    }

    return finalClean || clean || className || 'Unknown Item';
};

export const cleanPortName = (name: string): string => {
    if (!name) return '';

    // Strip parent prefix if present from recursive extraction
    const targetName = name.split('>').pop()?.trim() || name;

    let clean = targetName.toUpperCase()
        .replace(/HARDPOINT_/gi, '')
        .replace(/SCITEM_/gi, '')
        .replace(/_/g, ' ')
        .trim();

    // Map common items
    const maps: Record<string, string> = {
        'SHIELD GENERATOR': 'Shield Generator',
        'POWER PLANT': 'Power Plant',
        'QUANTUM DRIVE': 'Quantum Drive',
        'COOLER': 'Cooler',
        'TURRET': 'Turret',
        'WEAPON': 'Weapon',
        'MISSILE': 'Missile',
        'TORPEDO': 'Torpedo',
        'GIMBAL': 'Gimbal',
        'RADAR': 'Radar'
    };

    // Replace specific phrases
    Object.entries(maps).forEach(([tech, friendly]) => {
        if (clean.includes(tech)) {
            const regex = new RegExp(tech, 'gi');
            clean = clean.replace(regex, friendly);
        }
    });

    // Special cleanups
    clean = clean
        .replace(/\s[A-Z]$/g, '')
        .replace(/\s\d+$/g, '')
        .trim();

    // Title Case conversion
    return clean.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
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
