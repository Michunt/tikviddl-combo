import https from 'https';
import { URL } from 'url';

// First, let's get the actual video URL from the API
const testUrl = 'https://www.tiktok.com/@muas.kiag/video/7518717528361700626?is_from_webapp=1&sender_device=pc';

console.log('Testing TikTok URL accessibility...\n');

fetch('http://localhost:9000/', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    body: JSON.stringify({
        url: testUrl,
        downloadMode: 'auto'
    })
})
.then(response => response.json())
.then(async data => {
    console.log('=== API Response ===');
    console.log('Status:', data.status);
    console.log('Filename:', data.filename);
    
    // Now let's fetch the TikTok service directly to get the video URL
    const response = await fetch('http://localhost:9000/api/json', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            url: testUrl
        })
    }).catch(() => null);
    
    if (!response) {
        // Try the standard endpoint
        console.log('\nFetching video info from standard endpoint...');
        
        // Let's parse the tunnel URL to understand the stream
        if (data.url && data.url.includes('/tunnel?')) {
            const tunnelUrl = new URL(data.url);
            const streamId = tunnelUrl.searchParams.get('id');
            console.log('\nTunnel Stream ID:', streamId);
            
            // Try to probe the tunnel
            const probeResponse = await fetch(data.url + '&p=1');
            console.log('Tunnel probe status:', probeResponse.status);
        }
    }
    
    // Let's also test downloading a small chunk of video
    console.log('\n=== Testing Video URL Access ===');
    
    // Since we can't get the direct URL easily, let's test with the tunnel
    if (data.url) {
        const videoUrl = new URL(data.url);
        
        const options = {
            hostname: videoUrl.hostname,
            port: videoUrl.port || 80,
            path: videoUrl.pathname + videoUrl.search,
            method: 'GET',
            headers: {
                'Range': 'bytes=0-1024' // Just get first 1KB
            }
        };
        
        const req = https.request(options, (res) => {
            console.log('Status Code:', res.statusCode);
            console.log('Headers:', res.headers);
            
            let dataSize = 0;
            res.on('data', (chunk) => {
                dataSize += chunk.length;
            });
            
            res.on('end', () => {
                console.log('Downloaded bytes:', dataSize);
                
                if (dataSize > 0) {
                    console.log('\n✅ Video stream is accessible');
                } else {
                    console.log('\n❌ Video stream returned no data');
                }
            });
        });
        
        req.on('error', (e) => {
            console.error('Request error:', e.message);
        });
        
        req.end();
    }
})
.catch(error => {
    console.error('Error:', error);
});
