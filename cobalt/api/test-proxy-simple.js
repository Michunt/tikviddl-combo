import { downloadTikTokVideo, cleanupTempFile } from './src/stream/tiktok-proxy.js';

const testUrl = 'https://v16-webapp-prime.us.tiktok.com/video/tos/maliva/tos-maliva-ve-0068c799-us/oEP9AEIAA4b7FCgnQTBfQQeEJz0ZBCP2BjnIgQ/?a=1988&ch=0&cr=13&dr=0&lr=all&cd=0%7C0%7C0%7C&cv=1&br=1080&bt=540&cs=0&ds=6&ft=4kCyMMMBz7Th1P.QqJ&mime_type=video_mp4&qs=0&rc=aTU2ODg5ZDhkN2VnOzk1M0BpanI6OTc5cmlmdjMzZzczNEAtMTMtNC01NmIxNDYuNS1eYSNrYzFscjRvaGxgLS1kMS9zcw%3D%3D&btag=e00088000&expire=1735603268&l=2024123011204438F82F3EC36302E7F5FA&ply_type=2&policy=2&signature=c5c1dd73fb33f10c4cf74da7f18e4a53&tk=tt_chain_token';

async function testProxy() {
    console.log('Testing TikTok proxy download...\n');
    
    try {
        const headers = {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'referer': 'https://www.tiktok.com/'
        };
        
        console.log('Downloading video to temp file...');
        const tempPath = await downloadTikTokVideo(testUrl, headers);
        
        console.log('\nSuccess! Video downloaded to:', tempPath);
        
        // Check file size
        const fs = await import('fs');
        const stats = fs.statSync(tempPath);
        console.log('File size:', stats.size, 'bytes');
        
        // Clean up
        await cleanupTempFile(tempPath);
        
    } catch (error) {
        console.error('Test failed:', error.message);
        console.error(error.stack);
    }
}

testProxy();
