import { spawn } from 'child_process';
import ffmpeg from 'ffmpeg-static';

// Test TikTok URL (you'll need to replace with a real one)
const testUrl = 'https://v16-webapp-prime.us.tiktok.com/video/tos/example.mp4';

console.log('FFmpeg path:', ffmpeg);
console.log('Testing TikTok audio extraction...\n');

// Simple test command
const args = [
    '-loglevel', 'info',
    '-i', testUrl,
    '-vn',  // No video
    '-c:a', 'libmp3lame',
    '-b:a', '128k',
    '-ar', '44100',
    '-f', 'mp3',
    'test_output.mp3'
];

console.log('Command:', [ffmpeg, ...args].join(' '));
console.log('\nStarting FFmpeg...\n');

const process = spawn(ffmpeg, args, {
    windowsHide: true,
    stdio: ['inherit', 'pipe', 'pipe']
});

process.stdout.on('data', (data) => {
    console.log('STDOUT:', data.toString());
});

process.stderr.on('data', (data) => {
    console.log('STDERR:', data.toString());
});

process.on('error', (error) => {
    console.error('Process error:', error);
});

process.on('close', (code, signal) => {
    console.log(`\nProcess closed with code: ${code}, signal: ${signal}`);
});
