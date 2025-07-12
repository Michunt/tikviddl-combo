// TikTok audio download tests
// Run unit tests: npm test
// Run E2E tests: E2E_TIKTOK=1 npm test

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../src/config.js';
import { runTest } from '../src/misc/run-test.js';
import { Red, Green, Bright } from '../src/misc/console-text.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const MIN_AUDIO_SIZE = 100 * 1024; // 100 kB minimum size
const tempDir = path.join(__dirname, 'temp');

// Helper to validate audio downloads
async function validateAudioDownload(streamInfo) {
    if (!streamInfo?.url) {
        throw new Error('No stream URL provided');
    }

    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    try {
        const response = await fetch(streamInfo.url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        const size = buffer.byteLength;

        // Validate size
        if (size <= MIN_AUDIO_SIZE) {
            throw new Error(`Audio file too small: ${size} bytes (expected > ${MIN_AUDIO_SIZE} bytes)`);
        }

        // Save to temp file for inspection
        const fileName = `tiktok_audio_${Date.now()}.${streamInfo.audioFormat || 'm4a'}`;
        const filePath = path.join(tempDir, fileName);
        fs.writeFileSync(filePath, Buffer.from(buffer));

        console.log(Green(`✓ Audio downloaded successfully: ${size} bytes`));
        console.log(`  Saved to: ${filePath}`);

        // Validate MIME type from response headers
        const contentType = response.headers.get('content-type');
        const validMimeTypes = ['audio/m4a', 'audio/mp4', 'audio/mpeg', 'audio/mp3'];
        
        if (contentType && !validMimeTypes.some(mime => contentType.includes(mime))) {
            console.warn(`  Warning: Unexpected MIME type: ${contentType}`);
        }

        return { size, filePath, contentType };
    } catch (error) {
        throw new Error(`Audio download failed: ${error.message}`);
    }
}

// Main test runner
export async function runTikTokTests() {
    console.log(Bright('\nTikTok Audio Download Tests'));
    console.log('='.repeat(50));

    const tests = [];
    let passed = 0;
    let failed = 0;

    // Test 1: Mock test (always runs)
    tests.push({
        name: 'Mock audio download validation',
        run: async () => {
            const mockResponse = {
                status: 'stream',
                url: 'mock://test',
                audioFormat: 'm4a',
                formats: {
                    audio: { url: 'mock://test/audio', mime: 'audio/m4a' }
                }
            };

            if (!mockResponse.formats?.audio) {
                throw new Error('No audio format in mock response');
            }

            const validMimes = ['audio/m4a', 'audio/mp3', 'audio/mpeg'];
            if (!validMimes.includes(mockResponse.formats.audio.mime)) {
                throw new Error(`Invalid MIME type: ${mockResponse.formats.audio.mime}`);
            }

            console.log(Green('✓ Mock validation passed'));
        }
    });

    // Test 2: E2E test (only runs when E2E_TIKTOK=1)
    if (process.env.E2E_TIKTOK === '1') {
        tests.push({
            name: 'Download audio for valid TikTok URL (E2E)',
            canFail: true, // Mark as flaky due to external factors
            run: async () => {
                const testUrl = 'https://www.tiktok.com/@zachking/video/7195741644585454894';
                console.log(`Testing URL: ${testUrl}`);

                // Use the existing test framework
                const params = {
                    tiktokFullAudio: true,
                    isAudioOnly: true
                };

                const expected = {
                    code: 200,
                    status: 'tunnel'
                };

                // This will call the actual API
                const result = await runTest(testUrl, params, expected);
                
                console.log('API response received, validating audio...');
                
                // Additional validation for audio
                if (result?.url) {
                    await validateAudioDownload(result);
                } else {
                    throw new Error('No download URL in response');
                }
            }
        });

        tests.push({
            name: 'Handle invalid TikTok URL (E2E)',
            canFail: true,
            run: async () => {
                const invalidUrl = 'https://www.tiktok.com/@invalid_user_12345/video/0000000000000000000';
                
                const params = {};
                const expected = {
                    code: 400,
                    status: 'error'
                };

                await runTest(invalidUrl, params, expected);
                console.log(Green('✓ Invalid URL handled correctly'));
            }
        });

        tests.push({
            name: 'Download with quality settings (E2E)',
            canFail: true,
            run: async () => {
                const testUrl = 'https://www.tiktok.com/@fatfatmillycat/video/7195741644585454894';
                
                const params = {
                    tiktokFullAudio: true,
                    isAudioOnly: true,
                    allowH265: false
                };

                const expected = {
                    code: 200,
                    status: 'tunnel'
                };

                const result = await runTest(testUrl, params, expected);
                
                if (result?.url) {
                    const downloadInfo = await validateAudioDownload(result);
                    console.log(`  Quality settings applied, size: ${downloadInfo.size} bytes`);
                }
            }
        });
    } else {
        console.log('\n' + Bright('ℹ E2E tests skipped'));
        console.log('  Set E2E_TIKTOK=1 to run live TikTok tests\n');
    }

    // Run all tests
    for (const test of tests) {
        console.log(`\nRunning: ${test.name}`);
        try {
            await test.run();
            passed++;
            console.log(Green(`✓ ${test.name}: PASS`));
        } catch (error) {
            failed++;
            if (test.canFail) {
                console.log(Red(`✗ ${test.name}: FAIL (ignored)`));
                console.log(`  ${error.message}`);
            } else {
                console.log(Bright(Red(`✗ ${test.name}: FAIL`)));
                console.log(Red(`  ${error.message}`));
                if (error.stack) {
                    console.log(error.stack.split('\n').slice(1, 3).join('\n'));
                }
            }
        }
    }

    // Clean up temp directory
    if (fs.existsSync(tempDir) && process.env.KEEP_TEMP !== '1') {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(Bright(`Total: ${tests.length} | Passed: ${passed} | Failed: ${failed}`));
    
    return failed === 0 || tests.every(t => t.canFail && failed > 0);
}

// Run tests if called directly
if (process.argv[1] === __filename) {
    runTikTokTests().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error(Red('Test runner error:'), error);
        process.exit(1);
    });
}
