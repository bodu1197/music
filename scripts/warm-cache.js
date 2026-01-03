// Cache warming script - run after deployment
// Usage: node scripts/warm-cache.js
// This warms both Cloud Run backend cache AND Vercel Edge cache

const CLOUD_RUN_URL = 'https://sori-music-backend-322455104824.us-central1.run.app';
const VERCEL_URL = process.env.SITE_URL || 'https://music-tawny-eta.vercel.app';

const COUNTRIES = [
    { code: 'KR', lang: 'ko', name: 'Korea' },
    { code: 'US', lang: 'en', name: 'USA' },
];

async function warmCloudRunCache() {
    console.log('='.repeat(50));
    console.log('Phase 1: Warming Cloud Run Backend Cache');
    console.log('='.repeat(50));

    for (const country of COUNTRIES) {
        console.log(`\nWarming cache for ${country.name} (${country.code})...`);

        try {
            const start = Date.now();
            const res = await fetch(`${CLOUD_RUN_URL}/cache/warm?country=${country.code}&language=${country.lang}`, {
                method: 'POST',
            });

            const elapsed = ((Date.now() - start) / 1000).toFixed(1);

            if (res.ok) {
                const data = await res.json();
                const playlistCount = data.mood_playlists?.length || 0;
                const successCount = data.mood_playlists?.filter(p => p.status === 'success').length || 0;
                console.log(`  Home: ${data.home}`);
                console.log(`  Charts: ${data.charts}`);
                console.log(`  Moods: ${data.moods}`);
                console.log(`  Mood Playlists: ${successCount}/${playlistCount} success`);
                console.log(`  Total time: ${elapsed}s`);
            } else {
                console.log(`  Failed: ${res.status} (${elapsed}s)`);
            }
        } catch (error) {
            console.log(`  Error: ${error.message}`);
        }
    }
}

async function warmVercelEdgeCache() {
    console.log('\n' + '='.repeat(50));
    console.log('Phase 2: Warming Vercel Edge Cache');
    console.log('='.repeat(50));

    const endpoints = [];

    for (const country of COUNTRIES) {
        endpoints.push({
            url: `/api/home?country=${country.code}&language=${country.lang}&limit=100`,
            name: `Home (${country.code})`
        });
        endpoints.push({
            url: `/api/charts?country=${country.code}`,
            name: `Charts (${country.code})`
        });
        endpoints.push({
            url: `/api/moods/all?country=${country.code}&language=${country.lang}`,
            name: `Moods All (${country.code})`
        });
    }

    for (const endpoint of endpoints) {
        const url = `${VERCEL_URL}${endpoint.url}`;
        console.log(`\nWarming: ${endpoint.name}`);

        try {
            const start = Date.now();
            const res = await fetch(url);
            const elapsed = ((Date.now() - start) / 1000).toFixed(1);

            if (res.ok) {
                const cacheHeader = res.headers.get('x-vercel-cache') || 'unknown';
                console.log(`  Status: OK (${elapsed}s)`);
                console.log(`  Cache: ${cacheHeader}`);
            } else {
                console.log(`  Failed: ${res.status} (${elapsed}s)`);
            }
        } catch (error) {
            console.log(`  Error: ${error.message}`);
        }
    }
}

async function checkCacheStatus() {
    console.log('\n' + '='.repeat(50));
    console.log('Phase 3: Checking Cloud Run Cache Status');
    console.log('='.repeat(50));

    try {
        const res = await fetch(`${CLOUD_RUN_URL}/cache/status`);
        if (res.ok) {
            const data = await res.json();
            console.log('\nCache Statistics:');
            console.log(`  Home Cache: ${data.home_cache.size}/${data.home_cache.maxsize} entries`);
            console.log(`  Charts Cache: ${data.charts_cache.size}/${data.charts_cache.maxsize} entries`);
            console.log(`  Moods Cache: ${data.moods_cache.size}/${data.moods_cache.maxsize} entries`);
            console.log(`  Mood Playlists Cache: ${data.mood_playlists_cache.size}/${data.mood_playlists_cache.maxsize} entries`);
        }
    } catch (error) {
        console.log(`  Error: ${error.message}`);
    }
}

async function main() {
    console.log('Starting Cache Warming Process...');
    console.log(`Cloud Run: ${CLOUD_RUN_URL}`);
    console.log(`Vercel: ${VERCEL_URL}`);
    console.log(`Countries: ${COUNTRIES.map(c => c.code).join(', ')}`);

    const start = Date.now();

    // Phase 1: Warm Cloud Run backend cache (source of truth)
    await warmCloudRunCache();

    // Phase 2: Warm Vercel Edge cache (CDN layer)
    await warmVercelEdgeCache();

    // Phase 3: Check final cache status
    await checkCacheStatus();

    const totalTime = ((Date.now() - start) / 1000).toFixed(1);
    console.log('\n' + '='.repeat(50));
    console.log(`Cache warming complete! Total time: ${totalTime}s`);
    console.log('='.repeat(50));
}

await main();
