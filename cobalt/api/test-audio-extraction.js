// Test script to debug TikTok audio extraction
const testUrl = 'https://www.tiktok.com/@muas.kiag/video/7518717528361700626?is_from_webapp=1&sender_device=pc';

console.log('Testing TikTok audio extraction...');
console.log('URL:', testUrl);

// First, let's make a regular download request to get the video info
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
.then(data => {
    console.log('\n=== Initial Response ===');
    console.log(JSON.stringify(data, null, 2));
    
    // Now try audio extraction
    console.log('\n=== Requesting Audio Extraction ===');
    return fetch('http://localhost:9000/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            url: testUrl,
            downloadMode: 'audio',
            audioFormat: 'mp3',
            audioBitrate: '128'
        })
    });
})
.then(response => response.json())
.then(data => {
    console.log('\n=== Audio Extraction Response ===');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.status === 'tunnel' && data.url) {
        console.log('\n=== Tunnel URL for Audio ===');
        console.log(data.url);
        
        // Try to fetch the tunnel URL headers to see if it's working
        return fetch(data.url, {
            method: 'HEAD'
        });
    }
})
.then(response => {
    if (response) {
        console.log('\n=== Tunnel Response Headers ===');
        console.log('Status:', response.status);
        console.log('Content-Type:', response.headers.get('content-type'));
        console.log('Content-Length:', response.headers.get('content-length'));
    }
})
.catch(error => {
    console.error('\n=== Error ===');
    console.error(error);
});
