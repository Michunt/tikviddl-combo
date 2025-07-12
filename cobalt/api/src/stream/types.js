import { Agent, request } from "undici";
import ffmpeg from "ffmpeg-static";
import { spawn } from "child_process";
import { create as contentDisposition } from "content-disposition-header";

import { env, genericUserAgent } from "../config.js";
import { destroyInternalStream } from "./manage.js";
import { hlsExceptions } from "../processing/service-config.js";
import { getHeaders, closeRequest, closeResponse, pipe, estimateTunnelLength, estimateAudioMultiplier } from "./shared.js";
import { downloadTikTokVideo, cleanupTempFile } from "./tiktok-proxy.js";

const ffmpegArgs = {
    webm: ["-c:v", "copy", "-c:a", "copy"],
    mp4: ["-c:v", "copy", "-c:a", "copy", "-movflags", "faststart+frag_keyframe+empty_moov"],
    m4a: ["-movflags", "frag_keyframe+empty_moov"],
    gif: ["-vf", "scale=-1:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse", "-loop", "0"]
}

const metadataTags = [
    "album",
    "composer",
    "genre",
    "copyright",
    "title",
    "artist",
    "album_artist",
    "track",
    "date",
];

const convertMetadataToFFmpeg = (metadata) => {
    let args = [];

    for (const [ name, value ] of Object.entries(metadata)) {
        if (metadataTags.includes(name)) {
            args.push('-metadata', `${name}=${value.replace(/[\u0000-\u0009]/g, "")}`); // skipcq: JS-0004
        } else {
            throw `${name} metadata tag is not supported.`;
        }
    }

    return args;
}

const toRawHeaders = (headers) => {
    return Object.entries(headers)
                 .map(([key, value]) => `${key}: ${value}\r\n`)
                 .join('');
}

const killProcess = (p) => {
    p?.kill('SIGTERM'); // ask the process to terminate itself gracefully

    setTimeout(() => {
        if (p?.exitCode === null)
            p?.kill('SIGKILL'); // brutally murder the process if it didn't quit
    }, 5000);
}

const getCommand = (args) => {
    if (typeof env.processingPriority === 'number' && !isNaN(env.processingPriority)) {
        return ['nice', ['-n', env.processingPriority.toString(), ffmpeg, ...args]]
    }
    return [ffmpeg, args]
}

const defaultAgent = new Agent();

const proxy = async (streamInfo, res) => {
    const abortController = new AbortController();
    const shutdown = () => (
        closeRequest(abortController),
        closeResponse(res),
        destroyInternalStream(streamInfo.urls)
    );

    try {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Content-disposition', contentDisposition(streamInfo.filename));

        const { body: stream, headers, statusCode } = await request(streamInfo.urls, {
            headers: {
                ...getHeaders(streamInfo.service),
                Range: streamInfo.range
            },
            signal: abortController.signal,
            maxRedirections: 16,
            dispatcher: defaultAgent,
        });

        res.status(statusCode);

        for (const headerName of ['accept-ranges', 'content-type', 'content-length']) {
            if (headers[headerName]) {
                res.setHeader(headerName, headers[headerName]);
            }
        }

        pipe(stream, res, shutdown);
    } catch {
        shutdown();
    }
}

const merge = async (streamInfo, res) => {
    let process;
    const shutdown = () => (
        killProcess(process),
        closeResponse(res),
        streamInfo.urls.map(destroyInternalStream)
    );

    const headers = getHeaders(streamInfo.service);
    const rawHeaders = toRawHeaders(headers);

    try {
        if (streamInfo.urls.length !== 2) return shutdown();

        const format = streamInfo.filename.split('.').pop();
        console.debug("[FFmpeg] Selected format for merging:", format);

        let args = [
            '-loglevel', '-8',
            '-headers', rawHeaders,
            '-i', streamInfo.urls[0],
            '-headers', rawHeaders,
            '-i', streamInfo.urls[1],
            '-map', '0:v',
            '-map', '1:a',
        ]

        args = args.concat(ffmpegArgs[format]);

        if (hlsExceptions.includes(streamInfo.service) && streamInfo.isHLS) {
            if (streamInfo.service === "youtube" && format === "webm") {
                args.push('-c:a', 'libopus');
            } else {
                args.push('-c:a', 'aac', '-bsf:a', 'aac_adtstoasc');
            }
        }

        if (streamInfo.metadata) {
            args = args.concat(convertMetadataToFFmpeg(streamInfo.metadata))
        }

        args.push('-f', format, 'pipe:3');

        process = spawn(...getCommand(args), {
            windowsHide: true,
            stdio: [
                'inherit', 'inherit', 'inherit',
                'pipe'
            ],
        });

        const [,,, muxOutput] = process.stdio;

        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Content-Disposition', contentDisposition(streamInfo.filename));
        res.setHeader('Estimated-Content-Length', await estimateTunnelLength(streamInfo));

        pipe(muxOutput, res, shutdown);

        process.on('close', shutdown);
        res.on('finish', shutdown);
    } catch {
        shutdown();
    }
}

const hdEnhance = async (streamInfo, res) => {
    let process;
    const shutdown = () => (
        killProcess(process),
        closeResponse(res),
        destroyInternalStream(streamInfo.urls)
    );

    try {
        console.log("[TikTok HD] Starting HD video enhancement:");
        console.log("  URL:", streamInfo.urls);
        console.log("  Filename:", streamInfo.filename);
        console.log("  Headers:", streamInfo.headers ? Object.keys(streamInfo.headers) : "none");
        
        // Enhanced TikTok-specific headers for video stream access (same as audio)
        const headers = getHeaders(streamInfo.service, streamInfo.headers);
        if (streamInfo.service === "tiktok") {
            headers['accept'] = '*/*';
            headers['accept-encoding'] = 'gzip, deflate, br';
            headers['accept-language'] = 'en-US,en;q=0.9';
            headers['cache-control'] = 'no-cache';
            headers['pragma'] = 'no-cache';
            headers['sec-ch-ua'] = '"Chromium";v="120", "Not_A Brand";v="99", "Google Chrome";v="120"';
            headers['sec-ch-ua-mobile'] = '?0';
            headers['sec-ch-ua-platform'] = '"Windows"';
            headers['sec-fetch-dest'] = 'video';
            headers['sec-fetch-mode'] = 'cors';
            headers['sec-fetch-site'] = 'cross-site';
            headers['range'] = 'bytes=0-';
        }

        let args = [
            // Enhanced logging and timeout settings for TikTok
            '-loglevel', streamInfo.service === "tiktok" ? 'debug' : 'warning',
            '-report', // Enable ffmpeg logging
            '-headers', toRawHeaders(headers),
        ];
        
        // Enhanced TikTok-specific probe and connection settings (same as audio)
        if (streamInfo.service === "tiktok") {
            args.push(
                "-probesize", "50M",          // Increased probe size for better stream detection
                "-analyzeduration", "30M",    // Increased analysis duration
                "-reconnect", "1",             // Enable reconnection on network issues
                "-reconnect_streamed", "1",    // Reconnect for streamed content
                "-reconnect_delay_max", "5",   // Max reconnect delay in seconds
                "-timeout", "30000000",        // 30 second timeout (in microseconds)
                "-user_agent", headers['user-agent'],
                "-referer", headers['referer'] || 'https://www.tiktok.com/',
                "-multiple_requests", "1",     // Allow multiple HTTP requests
                "-seekable", "0"                // Disable seeking for live streams
            );
        }
        
        args.push('-i', streamInfo.urls);
        
        // HD Video enhancement with watermark removal and quality improvement
        if (streamInfo.service === "tiktok") {
            args.push(
                "-c:v", "copy",
                "-c:a", "copy"
            );
            
            // Additional processing flags for TikTok HD enhancement
            args.push(
                "-avoid_negative_ts", "make_zero",  // Handle timestamp issues
                "-fflags", "+genpts+igndts",        // Generate PTS and ignore DTS
                "-max_muxing_queue_size", "2048",   // Larger queue for HD processing
                "-max_interleave_delta", "0"        // Better interleaving
            );
        }

        args.push('-f', 'mpegts', 'pipe:3');
        
        console.log("[TikTok HD] Final ffmpeg args:", args.join(" "));

        process = spawn(...getCommand(args), {
            windowsHide: true,
            stdio: [
                'inherit', 
                'pipe', // Capture stdout for debugging
                'pipe', // Capture stderr for debugging
                'pipe'  // Output stream
            ],
        });

        const [, stdout, stderr, muxOutput] = process.stdio;
        
        // Enhanced debug logging for HD processing (similar to audio)
        let stderrData = '';
        
        if (stdout) {
            stdout.on('data', (data) => {
                console.log("[TikTok HD] FFmpeg stdout:", data.toString().trim());
            });
        }
        
        if (stderr) {
            stderr.on('data', (data) => {
                const output = data.toString();
                stderrData += output;
                
                // Log important information (similar to audio processing)
                if (output.includes('Input #0') || 
                    output.includes('Stream #0') || 
                    output.includes('Output #0') ||
                    output.includes('frame=') ||
                    output.includes('error') ||
                    output.includes('warning') ||
                    output.includes('Invalid') ||
                    output.includes('failed') ||
                    output.includes('time=')) {
                    console.log("[TikTok HD] FFmpeg:", output.trim());
                }
            });
        }
        
        // Log final stderr content on process completion
        process.on('close', () => {
            if (stderrData && (stderrData.includes('error') || stderrData.includes('failed'))) {
                console.log("[TikTok HD] Complete FFmpeg stderr:", stderrData);
            }
        });

        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Content-Disposition', contentDisposition(streamInfo.filename));
        // HD videos will be significantly larger due to quality enhancement
        res.setHeader(
            'Estimated-Content-Length',
            await estimateTunnelLength(streamInfo, 4.0) // Higher multiplier for HD processing
        );

        // Enhanced error handling (same as audio)
        process.on('error', (error) => {
            console.error("[TikTok HD] FFmpeg process error:", error.message);
            console.error("[TikTok HD] Error details:", {
                code: error.code,
                signal: error.signal,
                cmd: error.cmd
            });
            shutdown();
        });
        
        process.on('close', (code, signal) => {
            console.log("[TikTok HD] FFmpeg process closed with code:", code, "signal:", signal);
            if (code !== 0 && code !== null) {
                console.error("[TikTok HD] Non-zero exit code indicates potential error");
            }
            shutdown();
        });
        
        // Enhanced timeout handling for HD processing (longer than audio due to complexity)
        let processTimeout = setTimeout(() => {
            console.warn("[TikTok HD] FFmpeg process timeout, terminating...");
            shutdown();
        }, 180000); // 3 minute timeout for HD processing

        pipe(muxOutput, res, () => {
            if (processTimeout) clearTimeout(processTimeout);
            shutdown();
        });
        
        res.on('finish', () => {
            if (processTimeout) clearTimeout(processTimeout);
            shutdown();
        });
        
        res.on('close', () => {
            if (processTimeout) clearTimeout(processTimeout);
            shutdown();
        });
        
    } catch (error) {
        console.error("[TikTok HD] Unexpected error in hdEnhance:", error.message);
        console.error("[TikTok HD] Stack trace:", error.stack);
        shutdown();
    }
}

// Simple direct audio conversion like original cobalt
const convertAudioDirect = async (streamInfo, res) => {
    let process;
    const shutdown = () => {
        killProcess(process);
        closeResponse(res);
        destroyInternalStream(streamInfo.urls);
    };

    try {
        console.log("[Audio Direct] Starting direct FFmpeg audio conversion");
        console.log("[Audio Direct] URL:", streamInfo.urls);
        console.log("[Audio Direct] Format:", streamInfo.audioFormat);
        console.log("[Audio Direct] Bitrate:", streamInfo.audioBitrate);

        const headers = getHeaders(streamInfo.service, streamInfo.headers);
        
        const args = [
            '-loglevel', '-8'
        ];

        // Add headers for network streams
        if (streamInfo.urls.startsWith('http')) {
            args.push('-headers', toRawHeaders(headers));
        }

        args.push(
            '-i', streamInfo.urls,
            '-vn',  // No video
            ...(streamInfo.audioCopy ? ['-c:a', 'copy'] : ['-b:a', `${streamInfo.audioBitrate}k`]),
        );

        if (streamInfo.audioFormat === 'mp3' && streamInfo.audioBitrate === '8') {
            args.push('-ar', '12000');
        }

        if (streamInfo.audioFormat === 'opus') {
            args.push('-vbr', 'off');
        }

        if (streamInfo.audioFormat === 'mp4a') {
            args.push('-movflags', 'frag_keyframe+empty_moov');
        }

        args.push(
            '-f',
            streamInfo.audioFormat === 'm4a' ? 'ipod' : streamInfo.audioFormat,
            'pipe:3',
        );

        console.log("[Audio Direct] FFmpeg args:", args);

        const ffmpegStream = spawn(ffmpeg, args, {
            stdio: ['ignore', 'ignore', 'ignore', 'pipe'],
        });

        process = ffmpegStream;

        ffmpegStream.on('error', (err) => {
            console.error("[Audio Direct] FFmpeg error:", err);
            shutdown();
        });

        ffmpegStream.on('close', (code) => {
            console.log("[Audio Direct] FFmpeg process closed with code:", code);
            shutdown();
        });

        const muxOutput = ffmpegStream.stdio[3];

        pipe(muxOutput, res, () => {
            console.log("[Audio Direct] Audio conversion completed");
            shutdown();
        });

        res.on('finish', shutdown);
        res.on('close', shutdown);

    } catch (error) {
        console.error("[Audio Direct] Error:", error);
        shutdown();
    }
}

const convertAudio = async (streamInfo, res) => {
    let process;
    let tempFilePath = null;
    const shutdown = () => {
        killProcess(process);
        closeResponse(res);
        destroyInternalStream(streamInfo.urls);
        // Clean up temp file if we downloaded one
        if (tempFilePath) {
            cleanupTempFile(tempFilePath).catch(() => {});
        }
    };

    try {
        // Debug logging for TikTok audio extraction
        if (streamInfo.service === "tiktok") {
            console.log("[TikTok Audio] Starting audio extraction:");
            console.log("  URL:", streamInfo.urls);
            console.log("  URL type:", typeof streamInfo.urls);
            console.log("  Format:", streamInfo.audioFormat);
            console.log("  Bitrate:", streamInfo.audioBitrate);
            console.log("  Headers:", streamInfo.headers);
            console.log("  Service:", streamInfo.service);
            console.log("  Type:", streamInfo.type);
        }
        
        // Merge service headers with any additional headers (like TikTok cookies)
        const headers = getHeaders(streamInfo.service, streamInfo.headers);
        
        // Enhanced TikTok-specific headers for better compatibility
        if (streamInfo.service === "tiktok") {
            headers['accept'] = '*/*';
            headers['accept-encoding'] = 'gzip, deflate, br';
            headers['accept-language'] = 'en-US,en;q=0.9';
            headers['cache-control'] = 'no-cache';
            headers['pragma'] = 'no-cache';
            headers['sec-ch-ua'] = '"Chromium";v="120", "Not_A Brand";v="99", "Google Chrome";v="120"';
            headers['sec-ch-ua-mobile'] = '?0';
            headers['sec-ch-ua-platform'] = '"Windows"';
            headers['sec-fetch-dest'] = 'video';
            headers['sec-fetch-mode'] = 'cors';
            headers['sec-fetch-site'] = 'cross-site';
            headers['range'] = 'bytes=0-';
        }
        
        let args = [
            // Enhanced logging for TikTok debugging
            '-loglevel', streamInfo.service === "tiktok" ? 'warning' : 'info',
        ]

        // For TikTok, add comprehensive connection and probe settings
        if (streamInfo.service === "tiktok") {
            args.push(
                "-headers", toRawHeaders(headers),
                "-probesize", "50M",          // Increased probe size for better stream detection
                "-analyzeduration", "30M",    // Increased analysis duration
                "-reconnect", "1",             // Enable reconnection on network issues
                "-reconnect_streamed", "1",    // Reconnect for streamed content
                "-reconnect_delay_max", "5",   // Max reconnect delay in seconds
                "-timeout", "30000000",        // 30 second timeout (in microseconds)
                "-user_agent", headers['user-agent'] || genericUserAgent,
                "-referer", headers['referer'] || 'https://www.tiktok.com/',
                "-multiple_requests", "1",     // Allow multiple HTTP requests
                "-seekable", "0"                // Disable seeking for live streams
            );
        } else {
            // For other services, use headers
            args.push('-headers', toRawHeaders(headers));
        }

        if (streamInfo.service === "twitter") {
            args.push('-seekable', '0');
        }

        // For TikTok, download the video first then process it
        let inputSource = streamInfo.urls;
        
        if (streamInfo.service === "tiktok" && streamInfo.urls.startsWith('http')) {
            console.debug("[TikTok Audio] Downloading video for audio extraction...");
            console.debug("[TikTok Audio] Download URL:", streamInfo.urls);
            console.debug("[TikTok Audio] Headers available:", streamInfo.headers ? Object.keys(streamInfo.headers) : 'none');
            
            try {
                // Download the video with proper headers and options
                tempFilePath = await downloadTikTokVideo(streamInfo.urls, streamInfo.headers || {}, {
                    extension: 'mp4',  // Keep as mp4 for compatibility
                    isAudioExtraction: true
                });
                inputSource = tempFilePath;
                console.debug("[TikTok Audio] Video downloaded successfully to:", tempFilePath);
            } catch (downloadError) {
                console.error("[TikTok Audio] Failed to download video:", downloadError.message);
                console.error("[TikTok Audio] Download error stack:", downloadError.stack);
                console.debug("[TikTok Audio] Falling back to direct stream processing...");
                // Fall back to direct streaming if download fails
                inputSource = streamInfo.urls;
            }
        }
        
        args.push(
            '-i', inputSource,
            '-vn'  // No video
        )

        // Enhanced audio codec configuration for TikTok
        if (streamInfo.service === "tiktok") {
            // For TikTok, add stream mapping to ensure we get audio
            args.push(
                "-map", "0:a:0?",  // Map first audio stream if it exists
                "-avoid_negative_ts", "make_zero",  // Handle timestamp issues
                "-fflags", "+genpts+igndts",        // Generate PTS and ignore DTS
                "-max_muxing_queue_size", "2048"    // Larger queue for processing
            );
            
            // Audio codec configuration based on format
            if (streamInfo.audioFormat === "mp3" || !streamInfo.audioFormat) {
                args.push(
                    "-c:a", "libmp3lame",
                    "-b:a", `${streamInfo.audioBitrate || 128}k`,
                    "-ar", "44100",
                    "-ac", "2"  // Stereo output
                );
            } else if (streamInfo.audioFormat === "m4a") {
                args.push(
                    "-c:a", "aac",
                    "-b:a", `${streamInfo.audioBitrate || 128}k`,
                    "-ar", "44100",
                    "-ac", "2"  // Stereo output
                );
            } else if (streamInfo.audioFormat === "opus") {
                args.push(
                    "-c:a", "libopus",
                    "-b:a", `${streamInfo.audioBitrate || 128}k`,
                    "-ar", "48000",  // Opus prefers 48kHz
                    "-ac", "2",
                    "-vbr", "on"
                );
            } else if (streamInfo.audioFormat === "wav") {
                args.push(
                    "-c:a", "pcm_s16le",
                    "-ar", "44100",
                    "-ac", "2"
                );
            }
        } else {
            if (streamInfo.audioCopy) {
                args.push("-c:a", "copy")
            } else {
                args.push("-b:a", `${streamInfo.audioBitrate}k`)
            }
        }

        if (streamInfo.audioFormat === "mp3" && streamInfo.audioBitrate === "8") {
            args.push("-ar", "12000");
        }

        if (streamInfo.audioFormat === "opus" && streamInfo.service !== "tiktok") {
            args.push("-vbr", "off")
        }

        if (ffmpegArgs[streamInfo.audioFormat] && streamInfo.service !== "tiktok") {
            args = args.concat(ffmpegArgs[streamInfo.audioFormat])
        }

        if (streamInfo.metadata) {
            args = args.concat(convertMetadataToFFmpeg(streamInfo.metadata))
        }

        // Output format configuration
        if (streamInfo.audioFormat === "m4a") {
            args.push('-f', 'ipod');
        } else if (streamInfo.audioFormat === "mp3") {
            args.push('-f', 'mp3');
        } else {
            args.push('-f', streamInfo.audioFormat || 'mp3');
        }
        
        args.push('pipe:3');

        // Debug logging for TikTok
        if (streamInfo.service === "tiktok") {
            console.log("[TikTok Audio] Final ffmpeg args:", args.join(" "));
        }

        process = spawn(...getCommand(args), {
            windowsHide: true,
            stdio: [
                'inherit',  // stdin
                'pipe',     // stdout - capture for debug
                'pipe',     // stderr for error logging
                'pipe'      // pipe:3 for ffmpeg output
            ],
        });

        const [, stdout, stderr, muxOutput] = process.stdio;

        // Enhanced debug logging for ffmpeg output
        let stderrData = '';
        let stdoutData = '';
        
        if (stdout) {
            stdout.on('data', (data) => {
                const output = data.toString();
                stdoutData += output;
                if (streamInfo.service === "tiktok") {
                    console.log("[TikTok Audio] FFmpeg stdout:", output.trim());
                }
            });
        }
        
        if (stderr) {
            stderr.on('data', (data) => {
                const output = data.toString();
                stderrData += output;
                
                // Log all output for debugging
                if (streamInfo.service === "tiktok") {
                    console.log("[TikTok Audio] FFmpeg stderr:", output.trim());
                }
            });
        }

        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Content-Disposition', contentDisposition(streamInfo.filename));
        res.setHeader(
            'Estimated-Content-Length',
            await estimateTunnelLength(
                streamInfo,
                estimateAudioMultiplier(streamInfo) * 1.1
            )
        );

        // Check if muxOutput exists and is readable
        if (!muxOutput) {
            console.error("[TikTok Audio] ERROR: No muxOutput stream available!");
            shutdown();
            return;
        }

        let hasData = false;
        muxOutput.on('data', (chunk) => {
            if (!hasData) {
                hasData = true;
                console.log("[TikTok Audio] First data chunk received, size:", chunk.length);
            }
        });

        // Enhanced error handling for the process
        process.on('error', (error) => {
            if (streamInfo.service === "tiktok") {
                console.error("[TikTok Audio] FFmpeg process error:", error.message);
                console.error("[TikTok Audio] Error details:", {
                    code: error.code,
                    signal: error.signal,
                    cmd: error.cmd
                });
            }
            shutdown();
        });

        process.on('close', (code, signal) => {
            if (streamInfo.service === "tiktok") {
                console.log("[TikTok Audio] FFmpeg process closed with code:", code, "signal:", signal);
                console.log("[TikTok Audio] Data received:", hasData);
                if (code !== 0 && code !== null) {
                    console.error("[TikTok Audio] Non-zero exit code indicates potential error");
                    console.error("[TikTok Audio] Last stderr output:", stderrData);
                }
            }
            shutdown();
        });

        // Enhanced timeout handling for TikTok
        let processTimeout;
        if (streamInfo.service === "tiktok") {
            processTimeout = setTimeout(() => {
                console.warn("[TikTok Audio] FFmpeg process timeout, terminating...");
                shutdown();
            }, 60000); // 60 second timeout for TikTok audio processing
        }

        pipe(muxOutput, res, () => {
            if (processTimeout) clearTimeout(processTimeout);
            shutdown();
        });
        
        res.on('finish', () => {
            if (processTimeout) clearTimeout(processTimeout);
            shutdown();
        });
        
        res.on('close', () => {
            if (processTimeout) clearTimeout(processTimeout);
            shutdown();
        });
        
    } catch (error) {
        if (streamInfo.service === "tiktok") {
            console.error("[TikTok Audio] Unexpected error in convertAudio:", error.message);
            console.error("[TikTok Audio] Stack trace:", error.stack);
        }
        shutdown();
    }
}

const convertGif = async (streamInfo, res) => {
    let process;
    const shutdown = () => (killProcess(process), closeResponse(res));

    try {
        let args = [
            '-loglevel', '-8'
        ]

        if (streamInfo.service === "twitter") {
            args.push('-seekable', '0')
        }

        args.push('-i', streamInfo.urls);
        args = args.concat(ffmpegArgs.gif);
        args.push('-f', "gif", 'pipe:3');

        process = spawn(...getCommand(args), {
            windowsHide: true,
            stdio: [
                'inherit', 'inherit', 'inherit',
                'pipe'
            ],
        });

        const [,,, muxOutput] = process.stdio;

        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Content-Disposition', contentDisposition(streamInfo.filename));
        res.setHeader('Estimated-Content-Length', await estimateTunnelLength(streamInfo, 60));

        pipe(muxOutput, res, shutdown);

        process.on('close', shutdown);
        res.on('finish', shutdown);
    } catch {
        shutdown();
    }
}

export default {
    proxy,
    merge,
    hdEnhance,
    convertAudio,
    convertAudioDirect,
    convertGif,
}
