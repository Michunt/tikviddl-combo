import tiktokService from './api/src/processing/services/tiktok.js';

async function testTikTokService() {
    console.log('Starting TikTok service test...\n');
    
    // Test URL - you can replace this with your specific TikTok URL
    const testUrl = 'https://www.tiktok.com/@zachking/video/7380936103106801951';
    
    try {
        console.log('Testing with URL:', testUrl);
        console.log('Parameters: { onlyAudio: true }\n');
        
        // Extract post ID from URL (simplified extraction)
        const postId = testUrl.match(/video\/(\d+)/)?.[1];
        
        console.log('Extracted postId:', postId);
        console.log('\nCalling tiktokService.download()...\n');
        
        // Call the service with parameters matching the API's usage
        const result = await tiktokService({
            postId: postId,
            isAudioOnly: true,
            fullAudio: false,
            h265: false,
            alwaysProxy: false
        });
        
        console.log('=== RESULT ===');
        console.log(JSON.stringify(result, null, 2));
        
        // Analyze the result
        console.log('\n=== ANALYSIS ===');
        if (result.error) {
            console.log('❌ Error returned:', result.error);
        } else {
            console.log('✅ Success!');
            console.log('- URLs:', result.urls || 'None');
            console.log('- Audio URL:', result.audio?.url || 'None');
            console.log('- Audio filename:', result.audioFilename || 'None');
            console.log('- Is audio only:', result.isAudioOnly || false);
            console.log('- Best audio format:', result.bestAudio || 'None');
            console.log('- Has picker (images):', !!result.picker);
            console.log('- Headers present:', !!result.headers);
        }
        
    } catch (error) {
        console.error('❌ Exception thrown:');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testTikTokService()
    .then(() => {
        console.log('\nTest completed.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\nTest failed with uncaught error:', error);
        process.exit(1);
    });
