import { spawn } from 'child_process';
import ffmpeg from 'ffmpeg-static';
import fs from 'fs';

console.log('Testing simple FFmpeg audio extraction...');
console.log('FFmpeg path:', ffmpeg);

// Create a test video file URL (you can replace with actual TikTok CDN URL if available)
const testVideoUrl = 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_1MB.mp4';

const args = [
    '-loglevel', 'info',
    '-i', testVideoUrl,
    '-vn',
    '-c:a', 'libmp3lame',
    '-b:a', '128k',
    '-ar', '44100',
    '-f', 'mp3',
    'test_ffmpeg_output.mp3'
];

console.log('\nCommand:', [ffmpeg, ...args].join(' '));

const process = spawn(ffmpeg, args, {
    windowsHide: true,
    stdio: ['inherit', 'pipe', 'pipe']
});

let stderrData = '';

process.stdout.on('data', (data) => {
    console.log('STDOUT:', data.toString());
});

process.stderr.on('data', (data) => {
    stderrData += data.toString();
    console.log('STDERR:', data.toString());
});

process.on('error', (error) => {
    console.error('Process error:', error);
});

process.on('close', (code, signal) => {
    console.log(`\nProcess closed with code: ${code}, signal: ${signal}`);
    
    if (fs.existsSync('test_ffmpeg_output.mp3')) {
        const stats = fs.statSync('test_ffmpeg_output.mp3');
        console.log('Output file size:', stats.size, 'bytes');
        
        if (stats.size > 0) {
            console.log('✅ FFmpeg is working correctly!');
        } else {
            console.log('❌ FFmpeg produced empty file');
        }
        
        // Clean up
        fs.unlinkSync('test_ffmpeg_output.mp3');
    } else {
        console.log('❌ No output file created');
    }
});
