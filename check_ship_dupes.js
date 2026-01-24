const fs = require('fs');

const SHIPS_FILE = './ships_utf8.json';

try {
    const data = fs.readFileSync(SHIPS_FILE, 'utf8');
    const ships = JSON.parse(data);

    console.log(`Total ships in ${SHIPS_FILE}: ${ships.length}`);

    const nameMap = new Map();
    const classMap = new Map();
    const duplicates = [];

    ships.forEach(s => {
        const name = s.Name || s.ClassName;
        const className = s.ClassName;

        if (nameMap.has(name)) {
            duplicates.push({ type: 'Name', value: name, className });
        }
        nameMap.set(name, (nameMap.get(name) || 0) + 1);

        if (classMap.has(className)) {
            duplicates.push({ type: 'ClassName', value: className });
        }
        classMap.set(className, (classMap.get(className) || 0) + 1);
    });

    console.log('\nDuplicates found:');
    console.log(JSON.stringify(duplicates, null, 2));

    // Also check for common "cleaning" conflicts
    const cleanedNames = new Map();
    ships.forEach(s => {
        const rawName = s.Name || s.ClassName;
        const cleaned = rawName.replace(/_/g, ' ').replace(/^RSI\s+/i, '').trim();
        if (cleanedNames.has(cleaned)) {
            console.log(`Potential cleaning collision: "${cleaned}" (from "${rawName}" and "${cleanedNames.get(cleaned)}")`);
        }
        cleanedNames.set(cleaned, rawName);
    });

} catch (e) {
    console.error(e);
}
