async function run() {
    try {
        const url = 'https://scunpacked.com/api/v2/ships.json';
        console.log('Fetching ships...');
        const res = await fetch(url);
        const ships = await res.json();

        console.log(`Total Ships Fetched: ${ships.length}`);

        // Check for Gladius duplicates
        const gladius = ships.filter(s => s.Name.toLowerCase().includes('gladius'));
        console.log(`\nFound ${gladius.length} ships with 'Gladius' in name:`);

        gladius.forEach(s => {
            console.log(JSON.stringify({
                Name: s.Name,
                ClassName: s.ClassName,
                Career: s.Career,
                Role: s.Role
            }, null, 2));
        });

        // Check for exact duplicates by ClassName
        const seen = new Set();
        const duplicates = [];
        ships.forEach(s => {
            if (seen.has(s.ClassName)) {
                duplicates.push(s.ClassName);
            }
            seen.add(s.ClassName);
        });

        console.log(`\nExact ClassName Duplicates: ${duplicates.length}`);
        if (duplicates.length > 0) {
            console.log(duplicates.slice(0, 10));
        }

        // Check for Name duplicates
        const seenNames = new Map();
        ships.forEach(s => {
            const count = seenNames.get(s.Name) || 0;
            seenNames.set(s.Name, count + 1);
        });

        console.log('\nPotential Name Duplicates (Count > 1):');
        for (const [name, count] of seenNames.entries()) {
            if (count > 1 && name.includes('Gladius')) {
                console.log(`${name}: ${count}`);
            }
        }

    } catch (e) {
        console.error(e);
    }
}
run();
