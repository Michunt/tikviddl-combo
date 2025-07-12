// Test TikTok video URL
const testUrl = 'https://www.tiktok.com/@muas.kiag/video/7518717528361700626?is_from_webapp=1&sender_device=pc';

console.log('Testing TikTok proxy audio extraction...');
console.log('URL:', testUrl);
console.log('');

async function testProxyAudioExtraction() {
    try {
        // Step 1: Request audio extraction
        console.log('=== Step 1: Requesting Audio Extraction ===');
        const response = await fetch('http://localhost:9000/', {
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

        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));
        
        if (data.status === 'tunnel' && data.url) {
            console.log('\n=== Step 2: Audio Stream Available ===');
            console.log('Stream URL:', data.url);
            console.log('Filename:', data.filename);
            
            // Step 2: Test the stream URL
            console.log('\n=== Step 3: Testing Stream URL ===');
            const streamResponse = await fetch(data.url, {
                method: 'HEAD'
            });
            
            console.log('Stream Status:', streamResponse.status);
            console.log('Content-Type:', streamResponse.headers.get('content-type'));
            console.log('Content-Length:', streamResponse.headers.get('content-length'));
            
            if (streamResponse.status === 200) {
                console.log('\n✅ SUCCESS: Audio extraction stream is working!');
                console.log('The proxy mechanism successfully downloaded the video and set up audio extraction.');
            } else {
                console.log('\n❌ ERROR: Stream returned status', streamResponse.status);
            }
            
            // Optional: Actually download a small portion to verify
            console.log('\n=== Step 4: Downloading Sample ===');
            const downloadResponse = await fetch(data.url, {
                headers: {
                    'Range': 'bytes=0-1000000' // Download first 1MB
                }
            });
            
            if (downloadResponse.ok) {
                const arrayBuffer = await downloadResponse.arrayBuffer();
                const buffer = new Uint8Array(arrayBuffer);
                console.log('Downloaded sample size:', buffer.length, 'bytes');
                
                // Check if it's valid MP3 data
                if (buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0) {
                    console.log('✅ Valid MP3 data detected!');
                } else if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
                    console.log('✅ Valid MP3 with ID3 tag detected!');
                } else {
                    console.log('⚠️  Audio format verification needed');
                }
            }
        } else {
            console.log('\n❌ ERROR: No stream URL returned');
        }
        
    } catch (error) {
        console.error('\n=== Error ===');
        console.error(error.message);
        console.error(error.stack);
    }
}

// Run the test
testProxyAudioExtraction();
