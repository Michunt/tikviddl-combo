import tiktokService from './api/src/processing/services/tiktok.js';
import { extract, normalizeURL } from './api/src/processing/url.js';

async function testTikTokAudioExtraction() {
    console.log('=== TikTok Audio Extraction Test ===\n');
    
    // Multiple test URLs to try
    const testUrls = [
        'https://www.tiktok.com/@zachking/video/7380936103106801951',
        'https://vt.tiktok.com/ZSLTpxJcV/', // Short link example
        // Add your specific TikTok URL here
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
            console.log('- Normalized URL:', normalizedUrl);
            console.log('- Service detected:', extractedInfo?.host || 'Unknown');
            console.log('- Pattern match:', JSON.stringify(extractedInfo?.patternMatch, null, 2));
            
            // Prepare parameters for audio extraction
            const params = {
                postId: extractedInfo?.patternMatch?.postId,
                shortLink: extractedInfo?.patternMatch?.shortLink,
                isAudioOnly: true,      // Critical: This triggers audio extraction
                fullAudio: false,       // Try both false and true
                h265: false,
                alwaysProxy: false
            };
            
            console.log('\nService Parameters:', JSON.stringify(params, null, 2));
            console.log('\nCalling TikTok service...\n');
            
            const result = await tiktokService(params);
            
            console.log('=== SERVICE RESPONSE ===');
            console.log(JSON.stringify(result, null, 2));
            
            if (result.error) {
                console.log('\n❌ Error:', result.error);
                
                // Try with fullAudio enabled
                if (!params.fullAudio) {
                    console.log('\nRetrying with fullAudio=true...');
                    params.fullAudio = true;
                    const retryResult = await tiktokService(params);
                    console.log('Retry result:', JSON.stringify(retryResult, null, 2));
                }
            } else {
                console.log('\n✅ Success! Audio extraction data:');
                console.log('- Audio URL:', result.urls || 'Not provided');
                console.log('- Audio object:', JSON.stringify(result.audio, null, 2));
                console.log('- Audio filename:', result.audioFilename);
                console.log('- Is audio only:', result.isAudioOnly);
                console.log('- Best audio format:', result.bestAudio || 'Default (m4a)');
                console.log('- Headers:', JSON.stringify(result.headers, null, 2));
                
                // Display the actual download URL that would be used
                if (result.urls || result.audio?.url) {
                    console.log('\n📥 Download URL for FFmpeg:');
                    console.log(result.urls || result.audio?.url);
                    
                    // Show what FFmpeg command would be used
                    console.log('\n🎵 FFmpeg would process this URL to extract audio');
                    console.log('Expected output format:', result.bestAudio || 'm4a');
                }
            }
            
        } catch (error) {
            console.error('\n❌ Exception caught:');
            console.error('Type:', error.constructor.name);
            console.error('Message:', error.message);
            console.error('Stack:', error.stack);
        }
    }
    
    // Test with a direct postId if you have one
    console.log(`\n${'='.repeat(60)}`);
    console.log('Testing with direct postId (no URL parsing)');
    console.log(`${'='.repeat(60)}\n`);
    
    try {
        const directResult = await tiktokService({
            postId: '7380936103106801951',
            isAudioOnly: true,
            fullAudio: false,
            h265: false,
            alwaysProxy: false
        });
        
        console.log('Direct postId result:', JSON.stringify(directResult, null, 2));
    } catch (error) {
        console.error('Direct postId error:', error.message);
    }
}

// Run the test
console.log('Node version:', process.version);
console.log('Working directory:', process.cwd());
console.log('Script location:', import.meta.url);
console.log();

testTikTokAudioExtraction()
    .then(() => {
        console.log('\n✅ All tests completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Test suite failed:', error);
        process.exit(1);
    });
