// Original cobalt FFmpeg approach for audio conversion
import { spawn } from "child_process";
import ffmpeg from "ffmpeg-static";
import { closeResponse } from "./shared.js";
import { genericUserAgent } from "../config.js";

const toRawHeaders = (headers) => {
    let formatted = "";
    for (let [key, value] of Object.entries(headers)) {
        formatted += `${key}: ${value}\r\n`;
    }
    return formatted;
}

const killProcess = (p) => {
    p?.kill('SIGTERM'); // ask the process to terminate itself gracefully

    setTimeout(() => {
        if (p?.exitCode === null)
            p?.kill('SIGKILL'); // brutally murder the process if it didn't quit
    }, 5000);
}

const estimateAudioMultiplier = (streamInfo) => {
    const { audioFormat, audioBitrate } = streamInfo;
    if (audioFormat === "mp3") {
        return audioBitrate === "8" ? 0.3 : 0.5;
    }
    return audioFormat === "opus" ? 0.4 : 0.6;
}

const render = async (res, streamInfo, args, estimatedSize) => {
    let process;
    const shutdown = () => {
        killProcess(process);
        closeResponse(res);
    };

    try {
        console.log("[FFmpeg Original] Starting process with args:", args);
        
        const ffmpegStream = spawn(ffmpeg, args, {
            stdio: ['ignore', 'ignore', 'ignore', 'pipe'],
        });

        process = ffmpegStream;

        ffmpegStream.on('error', (err) => {
            console.error("[FFmpeg Original] Process error:", err);
            shutdown();
        });

        ffmpegStream.on('close', (code, signal) => {
            console.log("[FFmpeg Original] Process closed:", { code, signal });
            shutdown();
        });

        const outputStream = ffmpegStream.stdio[3];
        
        outputStream.on('data', (chunk) => {
            console.log("[FFmpeg Original] Received data chunk:", chunk.length, "bytes");
        });

        outputStream.on('end', () => {
            console.log("[FFmpeg Original] Output stream ended");
            shutdown();
        });

        outputStream.pipe(res);

        res.on('finish', () => {
            console.log("[FFmpeg Original] Response finished");
            shutdown();
        });

        res.on('close', () => {
            console.log("[FFmpeg Original] Response closed");
            shutdown();
        });

    } catch (error) {
        console.error("[FFmpeg Original] Error:", error);
        shutdown();
    }
}

export const convertAudioOriginal = async (streamInfo, res) => {
    console.log("[FFmpeg Original] Converting audio:", {
        url: streamInfo.urls,
        format: streamInfo.audioFormat,
        bitrate: streamInfo.audioBitrate,
        service: streamInfo.service
    });

    const headers = {
        'user-agent': genericUserAgent,
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'no-cache',
        'pragma': 'no-cache',
        'sec-fetch-dest': 'video',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'cross-site',
        'referer': 'https://www.tiktok.com/',
        ...(streamInfo.headers || {})
    };

    const args = [
        '-loglevel', 'info',  // More verbose logging
        '-headers', toRawHeaders(headers),
        '-i', streamInfo.urls,
        '-vn',
        ...(streamInfo.audioCopy ? ['-c:a', 'copy'] : ['-b:a', `${streamInfo.audioBitrate}k`]),
    ];

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

    await render(
        res,
        streamInfo,
        args,
        estimateAudioMultiplier(streamInfo) * 1.1,
    );
}
