const fs = require('fs');

const COMPONENT_NAME_MAP = {
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
    'QDRV_AEGS_S04_IDRIS': 'Siren'
};

const cleanName = (name, className) => {
    if (!name && !className) return 'Unknown Item';
    const raw = (name || '').trim();
    if (raw.includes("'")) {
        const quoted = raw.match(/'([^']+)'/);
        if (quoted && quoted[1]) return quoted[1];
    }
    let clean = raw.replace(/@[\w\s]*Name[ _]?|@LOC_PLACE_HOLDER_|@LOC_PLACEHOLDER_|@item_Name_|@LOC /gi, '').replace(/itemName/gi, '').replace(/Name([A-Z])/g, '$1').replace(/_/g, ' ').replace(/\(.*\)/g, '').replace(/Laswer/gi, 'Laser').trim();

    if (className) {
        const normalized = className.toUpperCase().replace(/^NAME/i, '');
        if (COMPONENT_NAME_MAP[normalized]) return COMPONENT_NAME_MAP[normalized];
        const stripped = normalized.replace(/(_SCITEM|_TURRET|_LOWPOLY|_DUMMY|_VNG|_VANDUUL|_B_|_A_).*/gi, '');
        if (COMPONENT_NAME_MAP[stripped]) return COMPONENT_NAME_MAP[stripped];
        const sizeStripped = normalized.replace(/(_S\d+).*/gi, '$1');
        if (COMPONENT_NAME_MAP[sizeStripped]) return COMPONENT_NAME_MAP[sizeStripped];
    }
    return clean || className || 'Unknown Item';
};

const components = JSON.parse(fs.readFileSync('all_components.json', 'utf8'));
const quantumDrives = components.QuantumDrive || [];

const failures = quantumDrives.map(s => ({
    ...s,
    cleaned: cleanName(s.name, s.className)
})).filter(s => {
    if (s.name && s.name.includes('PLACEHOLDER')) return false;
    return s.cleaned.toUpperCase().startsWith('QDRV') || s.cleaned.includes('_') || s.cleaned.match(/S\d/) || s.cleaned === s.className || s.cleaned.includes('SCItem');
});

console.log(JSON.stringify(failures, null, 2));
console.log(`Phase 3 Failure Count: ${failures.length}`);
