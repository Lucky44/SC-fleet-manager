const cleanPortName = (name) => {
    if (!name) return '';

    let clean = name.toUpperCase()
        .replace(/HARDPOINT_/gi, '')
        .replace(/SCITEM_/gi, '')
        .replace(/_/g, ' ')
        .trim();

    const maps = {
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

    Object.entries(maps).forEach(([tech, friendly]) => {
        if (clean.includes(tech)) {
            const regex = new RegExp(tech, 'gi');
            clean = clean.replace(regex, friendly);
        }
    });

    clean = clean
        .replace(/\s[A-Z]$/g, '')
        .replace(/\s\d+$/g, '')
        .trim();

    return clean.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

const tests = [
    'HARDPOINT_SHIELD_GENERATOR_A',
    'HARDPOINT_COOLER_B',
    'HARDPOINT_TAIL_TURRET',
    'SCITEM_POWER_PLANT_1',
    'weapon_hardpoint_wing_left',
    'MISSILE_RACK_UNDERWING'
];

tests.forEach(t => {
    console.log(`${t} -> ${cleanPortName(t)}`);
});
