// Test script to demonstrate Cobalt video downloader functionality

async function testCobaltAPI() {
    const apiUrl = 'http://localhost:9000/';
    
    // Test 1: Check server info
    console.log('=== Testing Cobalt API Server Info ===');
    try {
        const infoResponse = await fetch(apiUrl);
        const info = await infoResponse.json();
        console.log('✅ Server Info:', JSON.stringify(info, null, 2));
    } catch (error) {
        console.log('❌ Server Info Error:', error.message);
        return;
    }

    // Test 2: Test YouTube video download
    console.log('\n=== Testing YouTube Video Download ===');
    const testURL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Rick Roll - safe test URL
    
    try {
        const downloadResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                url: testURL,
                videoQuality: '720',
                audioFormat: 'mp3',
                filenameStyle: 'basic'
            })
        });

        const result = await downloadResponse.json();
        console.log('✅ YouTube Download Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.log('❌ YouTube Download Error:', error.message);
    }

    // Test 3: Test with invalid URL
    console.log('\n=== Testing Invalid URL Handling ===');
    try {
        const invalidResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                url: 'https://example.com/invalid'
            })
        });

        const invalidResult = await invalidResponse.json();
        console.log('✅ Invalid URL Result:', JSON.stringify(invalidResult, null, 2));
    } catch (error) {
        console.log('❌ Invalid URL Error:', error.message);
    }
}

// Wait a moment for server to start, then run tests
setTimeout(testCobaltAPI, 2000);
