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

const extractPorts = (portList) => {
    let extracted = [];
    portList.forEach(p => {
        const rawName = p.PortName || p.Name;
        const item = p.InstalledItem;
        const itemType = (item?.Type || '').toLowerCase();

        const isGimbal = itemType.includes('turret.gunturret') || (item?.Tags || []).includes('gimbalMount');
        const isRack = itemType.includes('missilelauncher') || itemType.includes('missilerack');
        const isMount = isGimbal || isRack;

        let childPorts = [];
        if (isMount && item?.Ports) {
            childPorts = item.Ports.filter(cp => {
                const types = (cp.Types || []).join(',').toLowerCase();
                return types.includes('gun') || types.includes('missile');
            });
        }

        if (childPorts.length > 0) {
            childPorts.forEach((cp, index) => {
                let displayName = cleanPortName(rawName);
                if (childPorts.length > 1) displayName += ` (${index + 1})`;
                extracted.push({ Name: `${rawName} > ${cp.PortName}`, DisplayName: displayName });
            });
        } else {
            extracted.push({ Name: rawName, DisplayName: cleanPortName(rawName) });
        }
    });
    return extracted;
};

const mockData = [
    {
        PortName: 'hardpoint_cheek_weapon_left',
        InstalledItem: {
            Type: 'Turret.GunTurret',
            Ports: [{ PortName: 'hardpoint_class_2', Types: ['WeaponGun'] }]
        }
    },
    {
        PortName: 'hardpoint_shield_generator_a',
        InstalledItem: { Type: 'Shield.ShieldGenerator' }
    }
];

console.log("CONSOLIDATION TEST:");
const results = extractPorts(mockData);
results.forEach(r => {
    console.log(`Port: ${r.Name.padEnd(45)} | Display: ${r.DisplayName}`);
});
