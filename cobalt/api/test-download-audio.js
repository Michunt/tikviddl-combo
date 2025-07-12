import fs from 'fs';
import https from 'https';
import http from 'http';

const testUrl = 'https://www.tiktok.com/@muas.kiag/video/7518717528361700626?is_from_webapp=1&sender_device=pc';

console.log('Testing TikTok audio download...');

// Request audio extraction
fetch('http://localhost:9000/', {
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
})
.then(response => response.json())
.then(data => {
    console.log('\n=== Audio Extraction Response ===');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.status === 'tunnel' && data.url) {
        console.log('\n=== Downloading Audio File ===');
        console.log('URL:', data.url);
        console.log('Filename:', data.filename);
        
        // Download the file
        const file = fs.createWriteStream('test_audio_output.mp3');
        let downloadedSize = 0;
        
        const request = http.get(data.url, (response) => {
            console.log('\nResponse Status:', response.statusCode);
            console.log('Response Headers:', response.headers);
            
            response.on('data', (chunk) => {
                downloadedSize += chunk.length;
                file.write(chunk);
            });
            
            response.on('end', () => {
                file.end();
                console.log('\nDownload complete!');
                console.log('Downloaded size:', downloadedSize, 'bytes');
                
                // Check file size
                setTimeout(() => {
                    const stats = fs.statSync('test_audio_output.mp3');
                    console.log('File size on disk:', stats.size, 'bytes');
                    
                    if (stats.size === 0) {
                        console.error('\n❌ ERROR: Audio file is empty!');
                    } else {
                        console.log('\n✅ SUCCESS: Audio file has content!');
                    }
                }, 1000);
            });
        });
        
        request.on('error', (err) => {
            console.error('Download error:', err);
        });
    }
})
.catch(error => {
    console.error('\n=== Error ===');
    console.error(error);
});
