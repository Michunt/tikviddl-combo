// Test the full audio extraction flow
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import matchTiktok from './src/processing/match-tiktok.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const testUrl = 'https://www.tiktok.com/@muas.kiag/video/7518717528361700626?is_from_webapp=1&sender_device=pc';

console.log('=== Testing Full Audio Extraction Flow ===');

async function testFullFlow() {
    try {
        // Simulate the request parameters
        const params = {
            url: new URL(testUrl),
            downloadMode: 'audio',
            audioFormat: 'mp3',
            audioBitrate: '128',
            tiktokFullAudio: false,
            allowH265: false,
            alwaysProxy: false,
            disableMetadata: false,
            filenameStyle: 'classic',
            convertGif: false,
            localProcessing: false
        };
        
        // Pattern match for TikTok
        const patternMatch = {
            postId: '7518717528361700626'
        };
        
        console.log('\n=== Calling match-tiktok ===');
        console.log('Params:', {
            ...params,
            url: params.url.toString()
        });
        
        const result = await matchTiktok({
            host: 'tiktok',
            patternMatch,
            params,
            isSession: false
        });
        
        console.log('\n=== Result ===');
        console.log(JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.error('\n=== Error in test ===');
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
    }
}

testFullFlow();
