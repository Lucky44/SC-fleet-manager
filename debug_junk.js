async function run() {
    try {
        const itemsUrl = 'https://scunpacked.com/api/items.json';
        console.log('Fetching items...');
        const res = await fetch(itemsUrl);
        const data = await res.json();

        // 1. Normalize (EXACT LOGIC FROM dataService.ts)
        const normalized = data.map((item) => {
            const std = item.stdItem;
            return {
                ...item,
                type: std?.Type || item.type || item.Type || '',
                subType: item.subType || item.SubType || item.sub_type || '',
                size: std?.Size || item.size || item.Size || 0,
                name: std?.Name || item.name || item.Name || 'Unknown',
                className: std?.ClassName || item.className || item.ClassName || '',
                manufacturer: std?.Manufacturer?.Name || item.manufacturer || item.Manufacturer || '',
                // Keep raw for complex logic if needed
                raw: item
            };
        });

        console.log(`Total Normalized Items: ${normalized.length}`);

        // 2. Apply Filter (EXACT LOGIC FROM dataService.ts)
        const filtered = normalized.filter(item => {
            // Filter out placeholders and invalid items
            if (item.name.startsWith('@') || item.name.includes('PLACEHOLDER')) return false;
            if (item.name === 'Unknown' || item.name === 'MISSING') return false;
            if (!item.className) return false;
            return true;
        });

        console.log(`Total Filtered Items: ${filtered.length}`);
        console.log(`Removals: ${normalized.length - filtered.length}`);

        // 3. Inspect "Generic" Shields
        // User says: "first approximately 30 items... generic 'shields' items"
        // Let's look at shields specifically.
        const shields = filtered.filter(i => i.type.toLowerCase().includes('shield'));
        console.log(`\nRemaining Shields: ${shields.length}`);

        console.log('--- FIRST 50 SHIELDS (Name | Mfg) ---');
        shields.slice(0, 50).forEach(s => {
            console.log(`[${s.name}] Mfg: ${s.manufacturer} (Class: ${s.className})`);
        });

    } catch (e) {
        console.error(e);
    }
}
run();
