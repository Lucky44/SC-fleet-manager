import fs from 'fs';

try {
    console.log('Starting Pisces search (BOM-safe)...');
    const filename = 'ships_utf8.json';
    if (!fs.existsSync(filename)) {
        console.error(`File ${filename} not found!`);
        process.exit(1);
    }

    let content = fs.readFileSync(filename, 'utf8');
    // Strip BOM
    if (content.charCodeAt(0) === 0xFEFF) {
        console.log('Detected BOM, stripping it.');
        content = content.slice(1);
    }

    console.log(`Read ${content.length} characters.`);

    const ships = JSON.parse(content);
    console.log(`Parsed ${ships.length} entities.`);

    const searchTerms = ['pisces', 'c8', 'rescue', 'c8r'];
    const matches = ships.filter(s => {
        const cn = (s.ClassName || '').toLowerCase();
        const n = (s.Name || '').toLowerCase();
        return searchTerms.some(term => cn.includes(term) || n.includes(term));
    });

    console.log(`Found ${matches.length} matches:`);
    matches.forEach(p => {
        console.log(`- ${p.Name} (${p.ClassName})`);
    });
} catch (e) {
    console.error('CRASHED:');
    console.error(e.message);
    console.error(e.stack);
}
