import { request } from "undici";
import { createWriteStream, createReadStream } from "node:fs";
import { unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { nanoid } from "nanoid";
import { pipeline } from "node:stream/promises";

const activeDownloads = new Map();

export async function downloadTikTokVideo(url, headers = {}, options = {}) {
    const downloadId = nanoid();
    // Support custom extension for audio-only downloads
    const extension = options.extension || 'mp4';
    const tempPath = join(tmpdir(), `tiktok_${downloadId}.${extension}`);
    
    console.log(`[TikTok Proxy] Starting download: ${downloadId}`);
    console.log(`[TikTok Proxy] URL: ${url}`);
    console.log(`[TikTok Proxy] Temp path: ${tempPath}`);
    console.log(`[TikTok Proxy] Options:`, options);
    
    try {
        // Track active download
        activeDownloads.set(downloadId, { tempPath, startTime: Date.now() });
        
        // Prepare headers with required TikTok headers
        const downloadHeaders = {
            'user-agent': headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'referer': headers['referer'] || 'https://www.tiktok.com/',
            'accept': '*/*',
            'accept-encoding': 'gzip, deflate, br',
            'accept-language': 'en-US,en;q=0.9',
            'cache-control': 'no-cache',
            'pragma': 'no-cache',
            'sec-ch-ua': '"Chromium";v="120", "Not_A Brand";v="99", "Google Chrome";v="120"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'video',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'cross-site',
            'range': 'bytes=0-',
            ...headers // Allow override of default headers
        };
        
        // If cookie is provided, ensure it's included
        if (headers.cookie) {
            downloadHeaders.cookie = headers.cookie;
        }
        
        console.log(`[TikTok Proxy] Request headers:`, Object.keys(downloadHeaders));
        
        // Make the request
        const { statusCode, headers: responseHeaders, body } = await request(url, {
            method: 'GET',
            headers: downloadHeaders,
            maxRedirections: 10,
            throwOnError: false
        });
        
        console.log(`[TikTok Proxy] Response status: ${statusCode}`);
        console.log(`[TikTok Proxy] Content-Type: ${responseHeaders['content-type']}`);
        console.log(`[TikTok Proxy] Content-Length: ${responseHeaders['content-length']}`);
        
        if (statusCode !== 200 && statusCode !== 206) {
            throw new Error(`HTTP ${statusCode}: Failed to download video`);
        }
        
        // Check if we got video content
        const contentType = responseHeaders['content-type'];
        if (!contentType || (!contentType.includes('video') && !contentType.includes('octet-stream'))) {
            console.warn(`[TikTok Proxy] Unexpected content type: ${contentType}`);
        }
        
        // Create write stream
        const writeStream = createWriteStream(tempPath);
        
        // Track download progress
        let downloadedBytes = 0;
        const totalBytes = parseInt(responseHeaders['content-length'] || '0');
        
        body.on('data', (chunk) => {
            downloadedBytes += chunk.length;
            if (totalBytes > 0) {
                const progress = Math.round((downloadedBytes / totalBytes) * 100);
                if (progress % 10 === 0) {
                    console.log(`[TikTok Proxy] Download progress: ${progress}%`);
                }
            }
        });
        
        // Download the file
        await pipeline(body, writeStream);
        
        console.log(`[TikTok Proxy] Download complete: ${downloadedBytes} bytes`);
        console.log(`[TikTok Proxy] File saved to: ${tempPath}`);
        
        // Return the local file path
        return tempPath;
        
    } catch (error) {
        console.error(`[TikTok Proxy] Download error:`, error.message);
        
        // Clean up on error
        if (activeDownloads.has(downloadId)) {
            activeDownloads.delete(downloadId);
        }
        
        // Try to delete temp file if it exists
        try {
            await unlink(tempPath);
        } catch (e) {
            // Ignore cleanup errors
        }
        
        throw error;
    }
}

export async function cleanupTempFile(filePath) {
    try {
        await unlink(filePath);
        console.log(`[TikTok Proxy] Cleaned up temp file: ${filePath}`);
    } catch (error) {
        console.error(`[TikTok Proxy] Failed to cleanup temp file:`, error.message);
    }
}

export function createFileStream(filePath) {
    return createReadStream(filePath);
}

// Cleanup old downloads periodically
setInterval(() => {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    
    for (const [id, download] of activeDownloads.entries()) {
        if (now - download.startTime > maxAge) {
            console.log(`[TikTok Proxy] Cleaning up stale download: ${id}`);
            activeDownloads.delete(id);
            cleanupTempFile(download.tempPath).catch(() => {});
        }
    }
}, 60 * 1000); // Check every minute
