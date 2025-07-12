import Cookie from "../cookie/cookie.js";

import { extract, normalizeURL } from "../url.js";
import { genericUserAgent } from "../../config.js";
import { updateCookie } from "../cookie/manager.js";
import { createStream } from "../../stream/manage.js";

const shortDomain = "https://vt.tiktok.com/";

// Helper to detect audio source
function detectAudioSource(videoInfo) {
    const musicAvailable = videoInfo?.music?.playUrl && videoInfo.music.playUrl.startsWith('http');
    const source = musicAvailable ? 'music' : 'video';
    const url = musicAvailable ? videoInfo.music.playUrl : videoInfo?.video?.playAddr;
    
    // Enhanced URL-based format detection
    const urlObj = new URL(url || 'http://example.com');
    const params = urlObj.searchParams;
    const mimeType = params.get('mime_type');
    const ratio = params.get('ratio');
    
    // Detect container and codec from URL patterns
    let container = 'mp4';
    let codec = 'aac';
    
    if (url?.includes('.mp3') || mimeType?.includes('audio/mpeg')) {
        container = 'mp3';
        codec = 'mp3';
    } else if (url?.includes('.m4a') || mimeType?.includes('audio/mp4')) {
        container = 'm4a';
        codec = 'aac';
    }
    
    return { source, url, container, codec, mimeType, ratio };
}

// Enhanced URL-based format detection
function enhanceURLDetection(url) {
    if (!url) return {};
    
    try {
        const urlObj = new URL(url);
        const params = urlObj.searchParams;
        
        return {
            mimeType: params.get('mime_type'),
            ratio: params.get('ratio'),
            vcodec: params.get('vcodec'),
            acodec: params.get('acodec'),
            br: params.get('br'), // bitrate
            rc: params.get('rc'), // rate control
            vr: params.get('vr'), // video resolution
        };
    } catch {
        return {};
    }
}

// Determine best audio source
function getBestAudio(info) {
    if (!info) return null;
    
    const musicSource = info.music?.playUrl ? detectAudioSource({ music: info.music }) : null;
    const videoSource = info.video?.playAddr ? detectAudioSource({ video: info.video }) : null;
    
    // If no music track available, use video
    if (!musicSource || !musicSource.url) {
        return videoSource;
    }
    
    // If music track is geo-blocked or unavailable
    if (musicSource.url && !musicSource.url.startsWith('http')) {
        return videoSource;
    }
    
    // Prefer music track if it has higher bitrate or is original
    // In most cases, the original music track is cleaner
    const musicBitrate = info.music?.bitrate || 128000;
    const videoBitrate = info.video?.bitrate || 96000;
    
    if (musicBitrate >= videoBitrate) {
        return musicSource;
    }
    
    return videoSource;
}

// Check if direct audio copy is possible
function isAudioCopyPossible(desiredOutput, actualOutput) {
    if (!desiredOutput || !actualOutput) return false;
    return desiredOutput.container === actualOutput.container && 
           desiredOutput.codec === actualOutput.codec;
}

export default async function(obj) {
    console.debug("[TikTok] Processing request:", {
        isAudioOnly: obj.isAudioOnly,
        fullAudio: obj.fullAudio,
        h265: obj.h265,
        postId: obj.postId,
        shortLink: obj.shortLink
    });
    const cookie = new Cookie({});
    let postId = obj.postId;

    if (!postId) {
        let html = await fetch(`${shortDomain}${obj.shortLink}`, {
            redirect: "manual",
            headers: {
                "user-agent": genericUserAgent.split(' Chrome/1')[0]
            }
        }).then(r => r.text()).catch(() => {});

        if (!html) return { error: "fetch.fail" };

        if (html.startsWith('<a href="https://')) {
            const extractedURL = html.split('<a href="')[1].split('?')[0];
            const { patternMatch } = extract(normalizeURL(extractedURL));
            postId = patternMatch?.postId;
        }
    }
    if (!postId) return { error: "fetch.short_link" };

    // should always be /video/, even for photos
    const res = await fetch(`https://www.tiktok.com/@i/video/${postId}`, {
        headers: {
            "user-agent": genericUserAgent,
            cookie,
        }
    })
    updateCookie(cookie, res.headers);

    const html = await res.text();

    let detail;
    try {
        const json = html
            .split('<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">')[1]
            .split('</script>')[0];

        const data = JSON.parse(json);
        const videoDetail = data["__DEFAULT_SCOPE__"]["webapp.video-detail"];

        if (!videoDetail) throw "no video detail found";

        // status_deleted or etc
        if (videoDetail.statusMsg) {
            return { error: "content.post.unavailable"};
        }

        detail = videoDetail?.itemInfo?.itemStruct;
    } catch {
        return { error: "fetch.fail" };
    }

    if (detail.isContentClassified) {
        return { error: "content.post.age" };
    }

    if (!detail.author) {
        return { error: "fetch.empty" };
    }

    let video, videoFilename, audioFilename, audio, images,
        filenameBase = `tiktok_${detail.author?.uniqueId}_${postId.split('?')[0]}`, // Remove URL parameters
        bestAudio; // will get defaulted to m4a later on in match-action

    images = detail.imagePost?.images;

    let playAddr = detail.video?.playAddr;

    if (obj.h265) {
        const h265PlayAddr = detail?.video?.bitrateInfo?.find(b => b.CodecType.includes("h265"))?.PlayAddr.UrlList[0]
        playAddr = h265PlayAddr || playAddr
    }

    if (obj.isAudioOnly) {
        // For audio extraction, always use the video URL as source
        // This ensures we have a complete media file for FFmpeg to process
        console.debug("[TikTok] Audio extraction - Using video URL as source:", playAddr);
        audio = playAddr;
        audioFilename = `${filenameBase}_audio`;

        // Only use original music URL if specifically requested and available
        if (obj.fullAudio && detail.music && detail.music.playUrl) {
            // Verify the music URL is valid before using it
            const musicUrl = detail.music.playUrl;
            console.debug("[TikTok] Full audio requested - Music URL:", musicUrl);
            if (musicUrl && musicUrl.startsWith('http')) {
                console.debug("[TikTok] Using original music URL for audio extraction");
                audio = musicUrl;
                audioFilename = `${filenameBase}_audio_original`;
                bestAudio = 'mp3'; // Original TikTok music is usually MP3
            }
        }
    } else if (!images) {
        console.debug("[TikTok] Format selection - Video play address:", playAddr);
        video = playAddr;
        videoFilename = `${filenameBase}.mp4`;
    }

    // Build standardized response structure
    console.debug("[TikTok] Building response structure - Audio URL:", audio, "Video URL:", video);
    const standardizedResponse = {
        auto: null,
        audio: null,
        hd: null
    };

    // Set audio URL (always available from video source or music)
    if (audio) {
        // Determine if audio copy is possible
        const desiredOutput = { container: 'mp4', codec: 'aac' };
        standardizedResponse.audioCopyPossible = isAudioCopyPossible(desiredOutput, detectAudioSource(detail));
        standardizedResponse.audio = {
            url: audio,
            mime: 'audio/mpeg'
        };
    }

    // Set auto quality video URL
    if (video) {
        standardizedResponse.auto = {
            url: video,
            mime: 'video/mp4'
        };
    }

    // Set HD quality video URL (check for H265 or use regular video)
    if (video) {
        let hdUrl = video;
        
        // Try to get H265 version for HD
        const h265PlayAddr = detail?.video?.bitrateInfo?.find(b => b.CodecType.includes("h265"))?.PlayAddr.UrlList[0];
        if (h265PlayAddr) {
            hdUrl = h265PlayAddr;
        }
        
        standardizedResponse.hd = {
            url: hdUrl,
            mime: 'video/mp4'
        };
    }

    // Include legacy properties for backward compatibility
    const legacyResponse = {
        ...standardizedResponse,
        headers: { cookie }
    };

    // Handle specific response types for legacy compatibility
    if (video && !obj.isAudioOnly) {
        legacyResponse.urls = video;
        legacyResponse.filename = videoFilename;
        return legacyResponse;
    }

    if (images && obj.isAudioOnly) {
        legacyResponse.urls = audio;
        legacyResponse.audioFilename = audioFilename;
        legacyResponse.isAudioOnly = true;
        legacyResponse.bestAudio = bestAudio;
        legacyResponse.headers = { cookie: cookie.toString() };
        return legacyResponse;
    }

    if (images) {
        let imageLinks = images
            .map(i => i.imageURL.urlList.find(p => p.includes(".jpeg?")))
            .map((url, i) => {
                if (obj.alwaysProxy) url = createStream({
                    service: "tiktok",
                    type: "proxy",
                    url,
                    filename: `${filenameBase}_photo_${i + 1}.jpg`
                })

                return {
                    type: "photo",
                    url
                }
            });

        legacyResponse.picker = imageLinks;
        legacyResponse.urls = audio;
        legacyResponse.audioFilename = audioFilename;
        legacyResponse.isAudioOnly = true;
        legacyResponse.bestAudio = bestAudio;
        legacyResponse.headers = { cookie: cookie.toString() };
        return legacyResponse;
    }

    if (audio) {
        console.debug("[TikTok] Returning audio-only response");
        legacyResponse.urls = audio;
        legacyResponse.audioFilename = audioFilename;
        legacyResponse.isAudioOnly = true;
        legacyResponse.bestAudio = bestAudio;
        
        // Enhanced headers for audio extraction to ensure proper download
        const audioHeaders = {
            cookie: cookie.toString(),
            'user-agent': genericUserAgent,
            'referer': 'https://www.tiktok.com/',
            'accept': '*/*',
            'accept-language': 'en-US,en;q=0.9',
            'cache-control': 'no-cache',
            'pragma': 'no-cache',
            'sec-fetch-dest': 'video',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'cross-site'
        };
        
        legacyResponse.headers = audioHeaders;
        console.debug("[TikTok] Final audio response:", {
            url: legacyResponse.urls,
            filename: legacyResponse.audioFilename,
            isAudioOnly: legacyResponse.isAudioOnly,
            bestAudio: legacyResponse.bestAudio,
            hasHeaders: !!legacyResponse.headers
        });
        return legacyResponse;
    }
}
