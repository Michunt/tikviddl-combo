// TikTok-only service patterns
export const testers = {
    "tiktok": pattern =>
        pattern.postId?.length <= 21 || pattern.shortLink?.length <= 13,
}
