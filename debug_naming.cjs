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
    'AMRS_LASERCANNON_S1': 'Omnisky III',
    'AMRS_LASERCANNON_S2': 'Omnisky VI',
    'AMRS_LASERCANNON_S3': 'Omnisky IX',
    'AMRS_LASERCANNON_S4': 'Omnisky XII',
    'AMRS_LASERCANNON_S5': 'Omnisky XV',
    'AMRS_LASERCANNON_S6': 'Omnisky XVIII',
    'KRON_LASERCANNON_S1': 'FL-11 Cannon',
    'KRON_LASERCANNON_S2': 'FL-22 Cannon',
    'KRON_LASERCANNON_S3': 'FL-33 Cannon',
    'HRST_LASERREPEATER_S1': 'Attrition-1 Repeater',
    'HRST_LASERREPEATER_S2': 'Attrition-2 Repeater',
    'HRST_LASERREPEATER_S3': 'Attrition-3 Repeater',
    'HRST_LASERREPEATER_S4': 'Attrition-4 Repeater',
    'HRST_LASERREPEATER_S5': 'Attrition-5 Repeater',
    'HRST_LASERREPEATER_S6': 'Attrition-6 Repeater',
    'HRST_LASERSCATTERGUN_S1': 'Dominance-1',
    'HRST_LASERSCATTERGUN_S2': 'Dominance-2',
    'HRST_LASERSCATTERGUN_S3': 'Dominance-3',
    'ESPR_BALLISTICCANNON_S2': 'Deadbolt II',
    'ESPR_BALLISTICCANNON_S3': 'Deadbolt III',
    'ESPR_BALLISTICCANNON_S4': 'Deadbolt IV',
    'ESPR_BALLISTICCANNON_S5': 'Deadbolt V',
    'APAR_BALLISTICGATLING_S4': 'Revenant Gatling',
    'APAR_BALLISTICGATLING_S6': 'Draugar Gatling',
    'BEHR_BALLISTICCANNON_S4': 'C-788 Combine',
    'GATS_BALLISTICCANNON_S1': 'Tarantula GT-870 Mark 1',
    'GATS_BALLISTICCANNON_S2': 'Tarantula GT-870 Mark 2',
    'GATS_BALLISTICCANNON_S3': 'Tarantula GT-870 Mark 3',
    'GATS_BALLISTICGATLING_S1': 'YellowJacket GT-210',
    'GATS_BALLISTICGATLING_S2': 'Scorpion GT-215',
    'GATS_BALLISTICGATLING_S3': 'Mantis GT-220',
    'PRAR_DISTORTIONSCATTERGUN_S4': 'Salvation Scattergun',
    'PRAR_DISTORTIONSCATTERGUN_S5': 'Absolution Scattergun',
    'ESPR_LASERCANNON_S1': 'Lightstrike I Cannon',
    'ESPR_LASERCANNON_S2': 'Lightstrike II Cannon',
    'ESPR_LASERCANNON_S3': 'Lightstrike III Cannon',
    'ESPR_LASERCANNON_S4': 'Lightstrike IV Cannon',
    'ESPR_LASERCANNON_S5': 'Lightstrike V Cannon',
    'ESPR_LASERCANNON_S6': 'Lightstrike VI Cannon',
    'BANU_TACHYONCANNON_S1': 'Singe Cannon (S1)',
    'BANU_TACHYONCANNON_S2': 'Singe Cannon (S2)',
    'BANU_TACHYONCANNON_S3': 'Singe Cannon (S3)',
    'MXOX_NEUTRONCANNON_S1': 'NN-13 Cannon',
    'MXOX_NEUTRONCANNON_S2': 'NN-14 Cannon',
    'MXOX_NEUTRONCANNON_S3': 'NN-15 Cannon',
    'VNCL_LASERCANNON_S1': 'WASP Cannon',
    'VNCL_LASERCANNON_S2': 'WASP Cannon',
    'VNCL_PLASMACANNON_S2': 'WHIP Plasma Cannon',
    'VNCL_PLASMACANNON_S3': 'WARLORD Plasma Cannon',
    'VNCL_PLASMACANNON_S5': 'WRATH Plasma Cannon',
    'VNCL_NEUTRONCANNON_S5': 'WAR Plasma Cannon'
};

const COMPONENT_NAME_MAP = {
    'SHLD_BEHR_S1_6SA': 'Arbiter',
    'SHLD_BEHR_S2_5MA': 'Chimalli',
    'SHLD_BEHR_S3_7CA': 'Nargun',
    'SHLD_BEHR_S1_7SA': 'Concord',
    'SHLD_BEHR_S2_6MA': 'Kozane',
    'SHLD_BEHR_S3_6CA': 'Bila',
    'SHLD_BEHR_S1_5SA': 'Rhada',
    'SHLD_BEHR_S2_7MA': 'Lorica',
    'SHLD_BEHR_S3_5CA': 'Akura',
    'SHLD_ASAS_S2_SHROUD': 'Shroud',
    'SHLD_BASL_S0_CASTRA': 'Castra',
    'SHLD_BASL_S1_STEWARD': 'Steward',
    'SHLD_BASL_S2_ASPIS': 'Aspis',
    'SHLD_BASL_S3_WARD': 'Ward',
    'SHLD_GODI_S1_FR66': 'FR-66',
    'SHLD_GODI_S2_FR76': 'FR-76',
    'SHLD_GODI_S3_FR86': 'FR-86',
    'SHLD_BANU_S02_PLACEHOLDER': 'Sukoran',
    'SHLD_BANU_S01_PLACEHOLDER': 'Suldrath',
    'POWR_AMRS_S1_JS300': 'JS-300',
    'POWR_AMRS_S2_JS400': 'JS-400',
    'POWR_ACOM_S1_SUNFLARE': 'SunFlare',
    'POWR_ACOM_S2_SOLARFLARE': 'SolarFlare',
    'POWR_JUST_S01_FORTITUDE': 'Fortitude',
    'POWR_JUST_S03_DURANGO': 'Durango',
    'POWR_SASU_S01_MAGNABLOOM': 'MagnaBloom',
    'POWR_LPLT_S00_DURAJET': 'DuraJet',
    'QDRV_RSI_S1_ATLAS': 'Atlas',
    'QDRV_WETK_S2_CROSSFIELD': 'Crossfield',
    'QDRV_ARCC_S3_IMPULSE': 'Impulse',
    'QDRV_TARS_S3_WANDERER': 'Wanderer',
    'QDRV_TARS_S3_RANGER': 'Ranger',
    'QDRV_ARCC_S3_ECHO': 'Echo',
    'QDRV_TARS_S1_EXPEDITION': 'Expedition',
    'QDRV_RACO_S02_NOVA': 'Nova',
    'COOL_AEGS_S1_GLACIER': 'Glacier',
    'COOL_AEGS_S2_BOREAL': 'Boreal',
    'COOL_AEGS_S2_ARCTIC': 'Arctic',
    'COOL_AEGS_S1_TUNDRA': 'Tundra',
    'COOL_AEGS_S2_PERMAFROST': 'Permafrost',
    'COOL_JSPN_S1_WINTERSTAR': 'Winter-Star',
    'COOL_JSPN_S0_FROSTSTARSL': 'Frost-Star SL',
    'COOL_JSPN_S0_WINTERSTARSL': 'Winter-Star SL',
    'COOL_JSPN_S2_FROSTSTAREX': 'Frost-Star EX',
    'COOL_WCPR_S00_FRIDAN': 'Fridan',
    'COOL_WCPR_S01_BERIAN': 'Berian',
    'COOL_WCPR_S00_KELVID': 'Kelvid',
    'COOL_JUST_S01_THERMAX': 'Thermax',
    'COOL_JUST_S03_HYDROPULSE': 'Hydropulse',
    'COOL_TYDT_S02_NIGHTFALL': 'NightFall'
};

const cleanName = (name, className) => {
    if (!name && !className) return 'Unknown Item';

    const raw = (name || '').trim();
    if (raw.includes("'")) {
        const quoted = raw.match(/'([^']+)'/);
        if (quoted && quoted[1]) return quoted[1];
    }

    let clean = raw
        .replace(/@[\w\s]*Name[ _]?|@LOC_PLACE_HOLDER_|@LOC_PLACEHOLDER_|@item_Name_|@LOC /gi, '')
        .replace(/itemName/gi, '')
        .replace(/Name([A-Z])/g, '$1')
        .replace(/_/g, ' ')
        .replace(/\(.*\)/g, '')
        .replace(/Laswer/gi, 'Laser')
        .trim();

    if (className) {
        const normalized = className.toUpperCase().replace(/^NAME/i, '');
        if (WEAPON_NAME_MAP[normalized]) return WEAPON_NAME_MAP[normalized];
        if (COMPONENT_NAME_MAP[normalized]) return COMPONENT_NAME_MAP[normalized];

        const stripped = normalized.replace(/(_SCITEM|_TURRET|_LOWPOLY|_DUMMY|_VNG|_VANDUUL|_B_|_A_).*/gi, '');
        if (WEAPON_NAME_MAP[stripped]) return WEAPON_NAME_MAP[stripped];
        if (COMPONENT_NAME_MAP[stripped]) return COMPONENT_NAME_MAP[stripped];

        const sizeStripped = normalized.replace(/(_S\d+).*/gi, '$1');
        if (WEAPON_NAME_MAP[sizeStripped]) return WEAPON_NAME_MAP[sizeStripped];
        if (COMPONENT_NAME_MAP[sizeStripped]) return COMPONENT_NAME_MAP[sizeStripped];
    }

    const mappingKey = clean.toUpperCase().replace(/\s/g, '_');
    if (WEAPON_NAME_MAP[mappingKey]) return WEAPON_NAME_MAP[mappingKey];
    if (COMPONENT_NAME_MAP[mappingKey]) return COMPONENT_NAME_MAP[mappingKey];

    const componentsPrefixes = ['SHLD', 'COOL', 'POWR', 'QDRV', 'ITEM', 'TRNS'];
    const manufacturers = ['AEGS', 'JUST', 'WCPR', 'JSPN', 'TYDT', 'LPLT', 'AMRS', 'ACOM', 'SASU', 'TARS', 'RACO', 'RSI', 'WETK', 'ARCC', 'ASAS', 'BASL', 'GODI', 'BEHR', 'KLWE', 'ESPR', 'APAR', 'GATS', 'PRAR', 'MXOX', 'VNCL', 'SECO', 'YORM', 'BRRA', 'ORIG', 'MRAI', 'CNOU'];

    let finalClean = clean;

    if (clean.includes('_') || clean === className || raw.includes('@LOC') || raw.includes('PLACEHOLDER')) {
        finalClean = (className || clean)
            .replace(/(_SCITEM|_TURRET|_LOWPOLY|_DUMMY|_VNG|_VANDUUL|_B_|_A_).*/gi, '')
            .replace(new RegExp(`^(${componentsPrefixes.join('|')})_`, 'i'), '')
            .replace(new RegExp(`^(${manufacturers.join('|')})_`, 'i'), '')
            .replace(/_?S\d+_?/gi, '')
            .replace(/_/g, ' ')
            .trim();

        manufacturers.forEach(m => {
            const mRegex = new RegExp(`^${m}\\s`, 'i');
            finalClean = finalClean.replace(mRegex, '');
        });
    }

    return finalClean || clean || className || 'Unknown Item';
};

const data = JSON.parse(fs.readFileSync('ship-items.json', 'utf8'));
const types = ['ShieldGenerator', 'Cooler', 'PowerPlant', 'QuantumDrive', 'WeaponGun', 'WeaponMissile'];

const results = data
    .filter(i => types.some(t => i.type && i.type.includes(t)))
    .map(i => {
        const cleaned = cleanName(i.name, i.className);
        return {
            className: i.className,
            originalName: i.name,
            cleanedName: cleaned,
            type: i.type,
            isMessy: cleaned.includes('_') || cleaned === i.className || (i.name && i.name.includes('@LOC')) || cleaned.match(/^[A-Z]{3,4}\s[A-Z0-9_\s]{5,}$/)
        };
    });

console.log(JSON.stringify(results, null, 2));
