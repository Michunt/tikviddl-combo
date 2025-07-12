// TikTok Audio Extraction Debug Test
// This script will test TikTok audio extraction with verbose logging enabled

console.log("\n" + "=".repeat(80));
console.log("TIKTOK AUDIO EXTRACTION DEBUG TEST");
console.log("=".repeat(80));
console.log("\nThis test will help trace the audio extraction process with verbose logging.");
console.log("Make sure the API server is running on http://localhost:9000/");
console.log("\n" + "=".repeat(80) + "\n");

const fetch = require('node-fetch');

async function testTikTokAudioExtraction() {
    const API_URL = 'http://localhost:9000/';
    const TIKTOK_URL = 'https://www.tiktok.com/@willsmith/video/7399537487623883051';

    console.log("📍 Test Configuration:");
    console.log("   API URL:", API_URL);
    console.log("   TikTok URL:", TIKTOK_URL);
    console.log("   Request Format: MP3 (audio only)");
    console.log("   Audio Bitrate: 320kbps");
    console.log("\n" + "-".repeat(80) + "\n");

    try {
        console.log("🚀 Sending request to API...\n");

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: TIKTOK_URL,
                audioBitrate: "320",
                audioFormat: "mp3",
                isAudioOnly: true
            })
        });

        console.log("📨 API Response:");
        console.log("   Status:", response.status, response.statusText);
        console.log("   Headers:", JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

        const data = await response.json();
        console.log("\n📦 Response Data:");
        console.log(JSON.stringify(data, null, 2));

        if (data.status === 'error') {
            console.log("\n❌ Error Response Received:");
            console.log("   Code:", data.code);
            console.log("   Text:", data.text);
            return;
        }

        if (data.status === 'tunnel' || data.status === 'stream') {
            console.log("\n✅ Stream URL Created Successfully!");
            console.log("   Stream URL:", data.url);
            console.log("   Filename:", data.filename);
            
            console.log("\n🔄 Attempting to fetch the stream...\n");
            
            const streamResponse = await fetch(data.url, {
                method: 'GET',
                headers: {
                    'Accept': '*/*',
                }
            });

            console.log("📥 Stream Response:");
            console.log("   Status:", streamResponse.status, streamResponse.statusText);
            console.log("   Headers:", JSON.stringify(Object.fromEntries(streamResponse.headers.entries()), null, 2));
            
            if (streamResponse.status === 200) {
                const buffer = await streamResponse.buffer();
                console.log("\n✅ Stream Data Received!");
                console.log("   First 100 bytes (hex):", buffer.slice(0, 100).toString('hex'));
                console.log("   Total size:", buffer.length, "bytes");
                
                // Check if it's valid MP3 data
                if (buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0) {
                    console.log("   ✅ Valid MP3 file signature detected!");
                } else {
                    console.log("   ⚠️  Warning: File doesn't start with MP3 signature");
                }
            } else {
                console.log("\n❌ Failed to fetch stream!");
                const errorText = await streamResponse.text();
                console.log("   Error response:", errorText);
            }
        }

    } catch (error) {
        console.error("\n❌ Test Failed with Error:");
        console.error("   Message:", error.message);
        console.error("   Stack:", error.stack);
    }
    
    console.log("\n" + "=".repeat(80));
    console.log("TEST COMPLETE");
    console.log("=".repeat(80) + "\n");
}

// Instructions
console.log("📋 Instructions:");
console.log("1. Make sure the API server is running: npm run dev");
console.log("2. Watch the server console for debug output marked with [TikTok]");
console.log("3. Look for FFmpeg command execution and any errors");
console.log("\nStarting test in 3 seconds...\n");

setTimeout(() => {
    testTikTokAudioExtraction();
}, 3000);
