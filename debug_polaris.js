async function run() {
    try {
        const url = 'https://scunpacked.com/api/v2/ships.json';
        console.log('Fetching ships...');
        const res = await fetch(url);
        const ships = await res.json();

        console.log(`Total Ships Fetched: ${ships.length}`);

        // Check for Polaris
        const polaris = ships.filter(s => s.Name.toLowerCase().includes('polaris') || s.ClassName.toLowerCase().includes('polaris'));

        if (polaris.length > 0) {
            console.log(`\nFound ${polaris.length} Polaris entries:`);
            polaris.forEach(s => {
                console.log(JSON.stringify({
                    Name: s.Name,
                    ClassName: s.ClassName,
                    Career: s.Career,
                    Role: s.Role
                }, null, 2));
            });
        } else {
            console.log('\nNo Polaris found in the API data.');
        }

    } catch (e) {
        console.error(e);
    }
}
run();
