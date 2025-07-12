// Test video download first
const testUrl = 'https://www.tiktok.com/@muas.kiag/video/7518717528361700626?is_from_webapp=1&sender_device=pc';

async function testVideoDownload() {
    try {
        console.log('=== Testing Video Download ===');
        
        // Request video download
        const response = await fetch('http://localhost:9000/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                url: testUrl,
                downloadMode: 'auto'
            })
        });

        const data = await response.json();
        console.log('\nVideo Response:', JSON.stringify(data, null, 2));
        
        if (data.status === 'tunnel' && data.url) {
            // Test the video stream
            const streamResponse = await fetch(data.url);
            console.log('\nVideo Stream Status:', streamResponse.status);
            console.log('Content-Type:', streamResponse.headers.get('content-type'));
            
            if (streamResponse.status === 200) {
                console.log('✅ Video download works!');
            }
        }
        
    } catch (error) {
        console.error('\n=== Error ===');
        console.error(error);
    }
}

testVideoDownload();
