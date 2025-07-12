import UrlPattern from "url-pattern";

export const audioIgnore = [];
export const hlsExceptions = [];

// TikTok-only service configuration
export const services = {
    tiktok: {
        patterns: [
            ":user/video/:postId",
            "i18n/share/video/:postId",
            ":shortLink",
            "t/:shortLink",
            ":user/photo/:postId",
            "v/:postId.html"
        ],
        subdomains: ["vt", "vm", "m", "t"],
    }
}

Object.values(services).forEach(service => {
    service.patterns = service.patterns.map(
        pattern => new UrlPattern(pattern, {
            segmentValueCharset: UrlPattern.defaultOptions.segmentValueCharset + '@\\.:'
        })
    )
})
