// Enable debug logging for TikTok
process.env.DEBUG = 'tiktok:*';

// Test script to debug TikTok audio extraction
const fetch = require('node-fetch');

async function testTikTokAudioExtraction() {
    console.log("=== TikTok Audio Extraction Debug Test ===");
    console.log("Debug mode enabled: DEBUG=tiktok:*");
    console.log("");

    const API_URL = 'http://localhost:9000/';
    const TIKTOK_URL = 'https://www.tiktok.com/@willsmith/video/7399537487623883051';

    try {
        console.log("Testing TikTok URL:", TIKTOK_URL);
        console.log("Request format: mp3 audio only");
        console.log("");

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

        console.log("Response status:", response.status);
        console.log("Response headers:", response.headers.raw());

        const data = await response.json();
        console.log("\nResponse data:", JSON.stringify(data, null, 2));

        if (data.status === 'tunnel' || data.status === 'stream') {
            console.log("\nStream URL created:", data.url);
            
            // Try to fetch the stream to see if it works
            console.log("\nAttempting to fetch stream...");
            const streamResponse = await fetch(data.url, {
                method: 'GET',
                headers: {
                    'Accept': '*/*',
                }
            });

            console.log("Stream response status:", streamResponse.status);
            console.log("Stream response headers:", streamResponse.headers.raw());
            
            // Read first few bytes to check if data is coming through
            const buffer = await streamResponse.buffer();
            console.log("Stream data received, first 100 bytes:", buffer.slice(0, 100));
            console.log("Total stream size:", buffer.length, "bytes");
        }

    } catch (error) {
        console.error("Error during test:", error);
        console.error("Stack trace:", error.stack);
    }
}

// Run the test
console.log("Starting TikTok debug test...\n");
testTikTokAudioExtraction();
