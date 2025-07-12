import stream from "./types.js";
import { convertAudioOriginal } from "./ffmpeg-original.js";

import { closeResponse } from "./shared.js";
import { internalStream } from "./internal.js";

export default async function(res, streamInfo) {
    try {
        console.log('[Stream] Processing stream type:', streamInfo.type);
        console.log('[Stream] Stream info keys:', Object.keys(streamInfo));
        
        switch (streamInfo.type) {
            case "proxy":
                return await stream.proxy(streamInfo, res);

            case "internal":
                return await internalStream(streamInfo.data, res);

            case "merge":
                return await stream.merge(streamInfo, res);

            case "hdEnhance":
                return await stream.hdEnhance(streamInfo, res);
                
            case "mute":
                // Mute functionality removed for TikTok
                return closeResponse(res);

            case "audio":
                console.log('[Stream] Starting audio conversion...');
                console.log('[Stream] Audio format:', streamInfo.audioFormat);
                console.log('[Stream] Audio URL:', streamInfo.urls);
                // Use original cobalt FFmpeg approach
                return await convertAudioOriginal(streamInfo, res);

            case "gif":
                return await stream.convertGif(streamInfo, res);
        }

        console.log('[Stream] Unknown stream type:', streamInfo.type);
        closeResponse(res);
    } catch (error) {
        console.error('[Stream] Error in stream processing:', error.message);
        console.error('[Stream] Stack:', error.stack);
        closeResponse(res);
    }
}
