import tiktokService from './api/src/processing/services/tiktok.js';
import { extract, normalizeURL } from './api/src/processing/url.js';

async function testTikTokAudioExtraction() {
    console.log('=== TikTok Audio Extraction Test (Fixed) ===\n');
    
    // Test with a fresh TikTok URL - you should replace this with a current video
    const testUrls = [
        // Try a popular/viral video that's likely to be available
        'https://www.tiktok.com/@khaby.lame/video/7181550687933476101',
        // Add your specific URL here
    ];
    
    for (const url of testUrls) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Testing URL: ${url}`);
        console.log(`${'='.repeat(60)}\n`);
        
        try {
            // Parse the URL to extract pattern info
            const normalizedUrl = normalizeURL(url);
            const extractedInfo = extract(normalizedUrl);
            
            console.log('URL Analysis:');
            console.log('- Service detected:', extractedInfo?.host || 'Unknown');
            console.log('- Pattern match:', JSON.stringify(extractedInfo?.patternMatch, null, 2));
            
            // Test both audio extraction modes
            const testConfigs = [
                { isAudioOnly: true, fullAudio: false, description: 'Audio from video track' },
                { isAudioOnly: true, fullAudio: true, description: 'Original audio (if available)' }
            ];
            
            for (const config of testConfigs) {
                console.log(`\n--- Testing: ${config.description} ---`);
                
                const params = {
                    postId: extractedInfo?.patternMatch?.postId,
                    shortLink: extractedInfo?.patternMatch?.shortLink,
                    isAudioOnly: config.isAudioOnly,
                    fullAudio: config.fullAudio,
                    h265: false,
                    alwaysProxy: false
                };
                
                console.log('Parameters:', JSON.stringify(params, null, 2));
                
                const result = await tiktokService(params);
                
                if (result.error) {
                    console.log('❌ Error:', result.error);
                } else {
                    console.log('✅ Success!');
                    console.log('Response structure:', {
                        hasUrls: !!result.urls,
                        hasAudio: !!result.audio,
                        hasHd: !!result.hd,
                        hasAuto: !!result.auto,
                        isAudioOnly: result.isAudioOnly,
                        hasHeaders: !!result.headers,
                        audioFilename: result.audioFilename,
                        bestAudio: result.bestAudio
                    });
                    
                    if (result.urls) {
                        console.log('\n📥 Audio URL for FFmpeg:', result.urls);
                        console.log('This URL will be processed by FFmpeg to extract audio as:', result.bestAudio || 'm4a');
                    }
                    
                    if (result.headers) {
                        console.log('\nHeaders for download:');
                        // Check if headers.cookie is an object or string
                        if (result.headers.cookie && typeof result.headers.cookie === 'object') {
                            console.log('- Cookie (object detected, needs serialization)');
                        } else {
                            console.log('- Cookie:', result.headers.cookie ? 'Present' : 'None');
                        }
                        console.log('- Other headers:', Object.keys(result.headers).filter(k => k !== 'cookie'));
                    }
                }
            }
            
        } catch (error) {
            console.error('\n❌ Exception caught:');
            console.error('Type:', error.constructor.name);
            console.error('Message:', error.message);
            
            // Check if it's the cookie serialization issue
            if (error.message.includes('cookie.serialize')) {
                console.error('\n🔧 Cookie serialization issue detected!');
                console.error('The service is calling cookie.serialize() but should use cookie.toString()');
                console.error('This happens at line 204 in the audio headers section');
            }
            
            console.error('\nStack:', error.stack);
        }
    }
    
    // Let's also test what happens when we mock a successful response
    console.log(`\n${'='.repeat(60)}`);
    console.log('Simulating successful audio extraction response');
    console.log(`${'='.repeat(60)}\n`);
    
    const mockSuccessResponse = {
        urls: 'https://v16.tiktokcdn.com/example-video.mp4',
        audioFilename: 'tiktok_username_123456789_audio',
        isAudioOnly: true,
        bestAudio: undefined, // Will default to m4a in processing
        audio: {
            url: 'https://v16.tiktokcdn.com/example-video.mp4',
            mime: 'audio/mpeg'
        },
        headers: {
            cookie: 'tt_webid=123456; tt_csrf_token=abcdef',
            'user-agent': 'Mozilla/5.0 ...',
            'referer': 'https://www.tiktok.com/'
        }
    };
    
    console.log('Mock response structure:', JSON.stringify(mockSuccessResponse, null, 2));
    console.log('\nThis response would be processed by:');
    console.log('1. The match-action handler to prepare the stream');
    console.log('2. FFmpeg to extract audio from the video URL');
    console.log('3. The resulting audio would be in', mockSuccessResponse.bestAudio || 'm4a', 'format');
}

// Run the test
testTikTokAudioExtraction()
    .then(() => {
        console.log('\n✅ Test completed');
        // Remove the process.exit to avoid the assertion error
    })
    .catch((error) => {
        console.error('\n❌ Test failed:', error);
    });
