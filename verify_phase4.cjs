const fs = require('fs');

const WEAPON_NAME_MAP = {
    'BEHR_LASERCANNON_S1': 'M3A Laser Cannon',
    'BEHR_LASERCANNON_S2': 'M4A Laser Cannon',
    'BEHR_LASERCANNON_S3': 'M5A Laser Cannon',
    'BEHR_LASERCANNON_S4': 'M6A Laser Cannon',
    'BEHR_LASERCANNON_S5': 'M7A Laser Cannon',
    'BEHR_LASERCANNON_S6': 'M8A Laser Cannon',
    'BEHR_LASERCANNON_S7': 'M9A Laser Cannon',
    'KLWE_LASERREPEATER_S1': 'Bulldog Repeater',
    'KLWE_LASERREPEATER_S2': 'Badger Repeater',
    'KLWE_LASERREPEATER_S3': 'Panther Repeater',
    'KLWE_LASERREPEATER_S4': 'Rhino Repeater',
    'KLWE_LASERREPEATER_S5': 'Galdereen Repeater',
    'KLWE_LASERREPEATER_S6': 'Mammoth Repeater',
    'BEHR_BALLISTICGATLING_S4': 'AD4B Gatling',
    'BEHR_BALLISTICGATLING_S5': 'AD5B Gatling',
    'BEHR_BALLISTICGATLING_S6': 'AD6B Gatling',
};

const COMPONENT_NAME_MAP = {}; // Not needed for weapons

const cleanName = (name, className) => {
    if (!name && !className) return 'Unknown Item';
    const raw = (name || '').trim();
    let clean = raw;
    if (raw.includes("'")) {
        const quoted = raw.match(/'([^']+)'/);
        if (quoted && quoted[1]) {
            const suffix = raw.split("'").pop()?.trim();
            if (suffix && (suffix.toLowerCase().includes('cannon') || suffix.toLowerCase().includes('repeater') || suffix.toLowerCase().includes('gatling') || suffix.toLowerCase().includes('scattergun'))) {
                clean = `${quoted[1]} ${suffix}`;
            } else {
                clean = quoted[1];
            }
        }
    }
    clean = clean.replace(/@[\w\s]*Name[ _]?|@LOC_PLACE_HOLDER_|@LOC_PLACEHOLDER_|@item_Name_|@LOC /gi, '').replace(/itemName/gi, '').replace(/Name([A-Z])/g, '$1').replace(/_/g, ' ').replace(/\(S\d+\)/gi, '').replace(/\sS\d+\s/gi, ' ').replace(/\sS\d+$/gi, '').replace(/\(.*\)/g, '').replace(/Laswer/gi, 'Laser').trim();

    if (className) {
        const normalized = className.toUpperCase().replace(/^NAME/i, '');
        if (WEAPON_NAME_MAP[normalized]) return WEAPON_NAME_MAP[normalized];
        const stripped = normalized.replace(/(_SCITEM|_TURRET|_LOWPOLY|_D_|_B_|_A_).*/gi, '');
        if (WEAPON_NAME_MAP[stripped]) return WEAPON_NAME_MAP[stripped];
        const sizeStripped = normalized.replace(/(_S\d+).*/gi, '$1');
        if (WEAPON_NAME_MAP[sizeStripped]) return WEAPON_NAME_MAP[sizeStripped];
    }
    return clean || className || 'Unknown Item';
};

const data = JSON.parse(fs.readFileSync('ship-items.json', 'utf8'));
const weapons = data.filter(i => i.type && i.type.includes('WeaponGun'));

const samples = [
    { className: 'GLSN_BallisticGatling_S4', name: 'Breakneck S4 Gatling', expected: 'Breakneck Gatling' },
    { className: 'BANU_TachyonCannon_S1', name: 'Singe Cannon (S1)', expected: 'Singe Cannon' },
    { className: 'VNCL_NeutronCannon_S5', name: "'WAR' Cannon", expected: 'WAR Cannon' },
    { className: 'VNCL_LaserCannon_S1', name: "'WEAK' Repeater", expected: 'WEAK Repeater' }
];

const results = samples.map(s => {
    const cleaned = cleanName(s.name, s.className);
    return {
        ...s,
        cleaned,
        success: cleaned === s.expected
    };
});

console.log(JSON.stringify(results, null, 2));
const failures = results.filter(r => !r.success);
console.log(`Phase 4 Failure Count: ${failures.length}`);
