import { strict as assert } from "node:assert";

import { env } from "../config.js";
import { createResponse } from "../processing/request.js";

import { testers } from "./service-patterns-tiktok.js";
import matchAction from "./match-action.js";

import { friendlyServiceName } from "./service-alias.js";

import tiktok from "./services/tiktok.js";

let freebind;

export default async function({ host, patternMatch, params, isSession }) {
    const { url } = params;
    assert(url instanceof URL);
    let dispatcher, requestIP;

    if (env.freebindCIDR) {
        if (!freebind) {
            freebind = await import('freebind');
        }

        requestIP = freebind.ip.random(env.freebindCIDR);
        dispatcher = freebind.dispatcherFromIP(requestIP, { strict: false });
    }

    try {
        let r,
            isAudioOnly = params.downloadMode === "audio",
            isAudioMuted = false, // Mute mode removed for TikTok
            isHdVideo = params.downloadMode === "hd";

        // Only support TikTok
        if (host !== "tiktok") {
            return createResponse("error", {
                code: "error.api.service.unsupported"
            });
        }

        if (!testers[host]) {
            return createResponse("error", {
                code: "error.api.service.unsupported"
            });
        }
        
        if (!(testers[host](patternMatch))) {
            return createResponse("error", {
                code: "error.api.link.unsupported",
                context: {
                    service: friendlyServiceName(host),
                }
            });
        }

        // Process TikTok request
        r = await tiktok({
            postId: patternMatch.postId,
            shortLink: patternMatch.shortLink,
            fullAudio: params.tiktokFullAudio,
            isAudioOnly,
            h265: params.allowH265,
            alwaysProxy: params.alwaysProxy,
        });

        if (r.isAudioOnly) {
            isAudioOnly = true;
            isAudioMuted = false;
        }

        if (r.error && r.critical) {
            return createResponse("critical", {
                code: `error.api.${r.error}`,
            })
        }

        if (r.error) {
            let context;
            switch(r.error) {
                case "content.too_long":
                    context = {
                        limit: parseFloat((env.durationLimit / 60).toFixed(2)),
                    }
                    break;

                case "fetch.fail":
                case "fetch.rate":
                case "fetch.critical":
                case "link.unsupported":
                case "content.video.unavailable":
                    context = {
                        service: friendlyServiceName(host),
                    }
                    break;
            }

            return createResponse("error", {
                code: `error.api.${r.error}`,
                context,
            })
        }

        let localProcessing = params.localProcessing;

        const lpEnv = env.forceLocalProcessing;

        if (lpEnv === "always" || (lpEnv === "session" && isSession)) {
            localProcessing = true;
        }

        return matchAction({
            r,
            host,
            audioFormat: params.audioFormat,
            isAudioOnly,
            isAudioMuted,
            isHdVideo,
            disableMetadata: params.disableMetadata,
            filenameStyle: params.filenameStyle,
            convertGif: params.convertGif,
            requestIP,
            audioBitrate: params.audioBitrate,
            alwaysProxy: params.alwaysProxy,
            localProcessing,
        })
    } catch (error) {
        console.error("[TikTok] Error in match-tiktok:", error.message);
        console.error("[TikTok] Error stack:", error.stack);
        return createResponse("error", {
            code: "error.api.fetch.critical",
            context: {
                service: friendlyServiceName(host),
            }
        })
    }
}
