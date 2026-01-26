const fs = require('fs');

const WEAPON_NAME_MAP = {}; // Not needed for this phase
const COMPONENT_NAME_MAP = {
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
    'SHLD_SECO_S00_PIN': 'Pin',
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
    'SHLD_ORIG_S04_890J': 'Glacis'
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

const shields = JSON.parse(fs.readFileSync('all_shields.json', 'utf8'));
const failures = shields.map(s => ({
    ...s,
    cleaned: cleanName(s.name, s.className)
})).filter(s => s.cleaned.toUpperCase().startsWith('SHLD') || s.cleaned.includes('_') || s.cleaned.match(/S\d/) || s.cleaned === s.className);

console.log(JSON.stringify(failures, null, 2));
console.log(`Phase 1 Failure Count: ${failures.length}`);
