// Test script for the new standardized TikTok download endpoint
import fetch from 'node-fetch';

const API_BASE = process.env.API_URL || 'http://localhost:9001';

// Test URLs
const TEST_URLS = [
    'https://www.tiktok.com/@example/video/7123456789012345678',
    'https://vm.tiktok.com/ZMexample123/'
];

async function testStandardizedEndpoint() {
    console.log('Testing standardized TikTok download endpoint...\n');

    for (const url of TEST_URLS) {
        console.log(`Testing URL: ${url}`);
        
        try {
            const response = await fetch(`${API_BASE}/download`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    url: url,
                    tiktokFullAudio: false,
                    allowH265: true,
                    alwaysProxy: false
                })
            });

            if (!response.ok) {
                console.error(`❌ HTTP ${response.status}: ${response.statusText}`);
                const errorBody = await response.text();
                console.error('Error body:', errorBody);
                continue;
            }

            const result = await response.json();
            console.log('✅ Success! Response structure:');
            console.log('Status:', result.status);
            console.log('Main URL:', result.url);
            
            if (result.formats) {
                console.log('Formats:');
                console.log('  Auto:', result.formats.auto);
                console.log('  Audio:', result.formats.audio);
                console.log('  HD:', result.formats.hd);
                
                // Validate the required structure
                const hasRequiredFormat = result.formats.auto && result.formats.audio && result.formats.hd;
                const hasCorrectMimes = 
                    result.formats.auto?.mime === 'video/mp4' &&
                    result.formats.audio?.mime === 'audio/mpeg' &&
                    result.formats.hd?.mime === 'video/mp4';
                
                if (hasRequiredFormat && hasCorrectMimes) {
                    console.log('✅ Response matches required structure!');
                } else {
                    console.log('❌ Response does not match required structure');
                }
            } else {
                console.log('❌ No formats field in response');
            }
            
        } catch (error) {
            console.error(`❌ Error testing ${url}:`, error.message);
        }
        
        console.log('---\n');
    }
}

async function testLegacyEndpoint() {
    console.log('Testing legacy endpoint for comparison...\n');
    
    const url = TEST_URLS[0];
    
    try {
        const response = await fetch(`${API_BASE}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                url: url,
                tiktokFullAudio: false
            })
        });

        if (!response.ok) {
            console.error(`❌ HTTP ${response.status}: ${response.statusText}`);
            return;
        }

        const result = await response.json();
        console.log('Legacy endpoint response:');
        console.log(JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.error(`❌ Error testing legacy endpoint:`, error.message);
    }
}

// Enable stub mode for testing
process.env.TIKTOK_STUB_MODE = 'true';

// Run tests
(async () => {
    await testStandardizedEndpoint();
    await testLegacyEndpoint();
})();
