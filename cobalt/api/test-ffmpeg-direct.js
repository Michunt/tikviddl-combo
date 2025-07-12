import ffmpeg from 'ffmpeg-static';
import { spawn } from 'child_process';
import { createWriteStream } from 'fs';
import { join } from 'path';

console.log('FFmpeg path:', ffmpeg);

// Test FFmpeg directly
const testFFmpeg = () => {
    console.log('\n=== Testing FFmpeg Directly ===');
    
    const ffmpegProcess = spawn(ffmpeg, ['-version'], {
        windowsHide: true
    });
    
    ffmpegProcess.stdout.on('data', (data) => {
        console.log('FFmpeg output:', data.toString());
    });
    
    ffmpegProcess.stderr.on('data', (data) => {
        console.error('FFmpeg error:', data.toString());
    });
    
    ffmpegProcess.on('close', (code) => {
        console.log('FFmpeg process exited with code:', code);
        
        if (code === 0) {
            console.log('\n✅ FFmpeg is working correctly!');
            testAudioExtraction();
        } else {
            console.log('\n❌ FFmpeg failed!');
        }
    });
};

// Test audio extraction from a URL
const testAudioExtraction = async () => {
    console.log('\n=== Testing Audio Extraction ===');
    
    const videoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4'; // Test video
    const outputPath = join(process.cwd(), 'test-audio.mp3');
    
    const args = [
        '-i', videoUrl,
        '-vn', // No video
        '-c:a', 'libmp3lame',
        '-b:a', '128k',
        '-f', 'mp3',
        outputPath
    ];
    
    console.log('FFmpeg command:', ffmpeg, args.join(' '));
    
    const ffmpegProcess = spawn(ffmpeg, args, {
        windowsHide: true
    });
    
    ffmpegProcess.stderr.on('data', (data) => {
        console.log('FFmpeg progress:', data.toString());
    });
    
    ffmpegProcess.on('close', (code) => {
        if (code === 0) {
            console.log('\n✅ Audio extraction successful!');
            console.log('Output file:', outputPath);
        } else {
            console.log('\n❌ Audio extraction failed with code:', code);
        }
    });
};

testFFmpeg();
