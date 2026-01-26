const cleanPortName = (name) => {
    if (!name) return '';
    const targetName = name.split('>').pop()?.trim() || name;
    let clean = targetName.toUpperCase().replace(/HARDPOINT_/gi, '').replace(/SCITEM_/gi, '').replace(/_/g, ' ').trim();
    const maps = { 'SHIELD GENERATOR': 'Shield Generator', 'POWER PLANT': 'Power Plant', 'QUANTUM DRIVE': 'Quantum Drive', 'COOLER': 'Cooler', 'TURRET': 'Turret', 'WEAPON': 'Weapon', 'MISSILE': 'Missile', 'TORPEDO': 'Torpedo', 'GIMBAL': 'Gimbal', 'RADAR': 'Radar' };
    Object.entries(maps).forEach(([tech, friendly]) => {
        if (clean.includes(tech)) {
            const regex = new RegExp(tech, 'gi');
            clean = clean.replace(regex, friendly);
        }
    });
    clean = clean.replace(/\s[A-Z]$/g, '').replace(/\s\d+$/g, '').trim();
    return clean.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

const COMPONENT_NAME_MAP = {
    'SHLD_BEHR_S03_5CA': 'Akura',
    'POWR_SASU_S02_DAYBREAK': 'DayBreak'
};

const WEAPON_NAME_MAP = {
    'BEHR_LASERCANNON_S4': 'M6A Cannon'
};

const cleanName = (name, className) => {
    const rawClass = (className || '').toUpperCase().replace(/_SCITEM$|_SCITEM$/gi, '');
    const mapped = COMPONENT_NAME_MAP[rawClass] || WEAPON_NAME_MAP[rawClass];
    return mapped || name;
};

// Simulation of fetchShipPorts logic
const extractPorts = (portList, parentName = '') => {
    let extracted = [];
    portList.forEach(p => {
        const rawName = p.PortName || p.Name;
        const uniqueName = parentName ? `${parentName} > ${rawName}` : rawName;
        const normalized = {
            Name: uniqueName,
            DisplayName: p.DisplayName || (parentName ? cleanPortName(parentName) : cleanPortName(rawName))
        };
        extracted.push(normalized);
        if (p.InstalledItem?.Ports) {
            extracted.push(...extractPorts(p.InstalledItem.Ports, rawName));
        }
    });
    return extracted;
};

const mockData = [
    {
        PortName: 'hardpoint_cheek_weapon_left',
        InstalledItem: {
            Ports: [
                { PortName: 'hardpoint_class_2' }
            ]
        }
    },
    {
        PortName: 'hardpoint_shield_generator_a',
        InstalledItem: { ClassName: 'SHLD_BEHR_S03_5CA_SCItem', Name: "5CA 'Akura'" }
    }
];

console.log("RECURSIVE PORT TEST:");
const results = extractPorts(mockData);
results.forEach(r => {
    console.log(`Port: ${r.Name.padEnd(45)} | Display: ${r.DisplayName}`);
});

console.log("\nNAME CLEANING TEST:");
console.log(`'5CA Akura' (SHLD_BEHR_S03_5CA_SCItem) -> ${cleanName("5CA Akura", "SHLD_BEHR_S03_5CA_SCItem")}`);
console.log(`'M6A Cannon' (BEHR_LaserCannon_S4_SCItem) -> ${cleanName("M6A Cannon", "BEHR_LaserCannon_S4_SCItem")}`);
