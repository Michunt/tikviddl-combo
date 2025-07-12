// Debug script to trace TikTok audio extraction issue
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the TikTok service directly
import tiktok from './src/processing/services/tiktok.js';

const testUrl = 'https://www.tiktok.com/@muas.kiag/video/7518717528361700626?is_from_webapp=1&sender_device=pc';

console.log('=== Debug: Testing TikTok Service Directly ===');
console.log('URL:', testUrl);

// Extract post ID from URL
const postIdMatch = testUrl.match(/video\/(\d+)/);
const postId = postIdMatch ? postIdMatch[1] : null;

console.log('Post ID:', postId);

async function testTikTokService() {
    try {
        console.log('\n=== Test 1: Video Download (auto mode) ===');
        const videoResult = await tiktok({
            postId: postId,
            isAudioOnly: false,
            fullAudio: false,
            h265: false,
            alwaysProxy: false
        });
        
        console.log('Video Result:', JSON.stringify(videoResult, null, 2));
        
        console.log('\n=== Test 2: Audio Extraction ===');
        const audioResult = await tiktok({
            postId: postId,
            isAudioOnly: true,
            fullAudio: false,
            h265: false,
            alwaysProxy: false
        });
        
        console.log('Audio Result:', JSON.stringify(audioResult, null, 2));
        
        // Check what properties are returned
        console.log('\n=== Audio Result Analysis ===');
        console.log('Has urls:', !!audioResult.urls);
        console.log('Has audioFilename:', !!audioResult.audioFilename);
        console.log('Has isAudioOnly:', !!audioResult.isAudioOnly);
        console.log('Has headers:', !!audioResult.headers);
        console.log('Has error:', !!audioResult.error);
        
        if (audioResult.urls) {
            console.log('Audio URL type:', typeof audioResult.urls);
            console.log('Audio URL:', audioResult.urls);
        }
        
    } catch (error) {
        console.error('\n=== Error ===');
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
    }
}

testTikTokService();
