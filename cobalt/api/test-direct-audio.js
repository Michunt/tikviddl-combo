// Test direct audio extraction using the stream endpoint
const testUrl = 'https://www.tiktok.com/@muas.kiag/video/7518717528361700626?is_from_webapp=1&sender_device=pc';

async function testDirectAudio() {
    try {
        console.log('=== Testing Direct Audio Extraction ===');
        
        // Step 1: Request audio extraction
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
        console.log('\nAPI Response:', JSON.stringify(data, null, 2));
        
        if (data.status === 'tunnel' && data.url) {
            console.log('\n=== Testing Stream URL ===');
            console.log('Stream URL:', data.url);
            
            // Test accessing the stream
            const streamResponse = await fetch(data.url);
            console.log('Stream Status:', streamResponse.status);
            console.log('Content-Type:', streamResponse.headers.get('content-type'));
            console.log('Content-Disposition:', streamResponse.headers.get('content-disposition'));
            
            if (streamResponse.status === 200) {
                // Read first few bytes to check if it's audio data
                const reader = streamResponse.body.getReader();
                const { value } = await reader.read();
                reader.cancel();
                
                if (value && value.length > 0) {
                    console.log('\n✅ SUCCESS: Audio stream is accessible!');
                    console.log('First bytes:', Array.from(value.slice(0, 10)));
                    
                    // Check for MP3 signature
                    if (value[0] === 0xFF && (value[1] & 0xE0) === 0xE0) {
                        console.log('✅ Valid MP3 data detected!');
                    } else if (value[0] === 0x49 && value[1] === 0x44 && value[2] === 0x33) {
                        console.log('✅ Valid MP3 with ID3 tag detected!');
                    } else {
                        console.log('⚠️  Audio format needs verification');
                        console.log('First 4 bytes (hex):', Array.from(value.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join(' '));
                    }
                }
            } else {
                console.log('\n❌ ERROR: Stream returned status', streamResponse.status);
            }
        } else {
            console.log('\n❌ ERROR: No tunnel URL in response');
        }
        
    } catch (error) {
        console.error('\n=== Error ===');
        console.error(error.message);
        console.error(error.stack);
    }
}

// Run the test
testDirectAudio();
