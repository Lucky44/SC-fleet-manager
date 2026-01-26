const fs = require('fs');

const COMPONENT_NAME_MAP = {
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
const powerPlants = components.PowerPlant || [];
const coolers = components.Cooler || [];

const all = [...powerPlants, ...coolers];

const failures = all.map(s => ({
    ...s,
    cleaned: cleanName(s.name, s.className)
})).filter(s => {
    if (s.name && (s.name.includes('PLACEHOLDER') || s.name === 'Main Powerplant')) return false;
    return s.cleaned.toUpperCase().startsWith('POWR') || s.cleaned.toUpperCase().startsWith('COOL') || s.cleaned.includes('_') || s.cleaned.match(/S\d/) || s.cleaned === s.className || s.cleaned.includes('SCItem');
});

console.log(JSON.stringify(failures, null, 2));
console.log(`Phase 2 Failure Count: ${failures.length}`);
