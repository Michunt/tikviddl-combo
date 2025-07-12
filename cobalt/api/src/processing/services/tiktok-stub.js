// Stub TikTok service for local development
// Returns mock data in the standardized format

export default async function(obj) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Mock response data based on postId
    const mockPostId = obj.postId || "mock123456";
    const baseUrl = `https://mock-tiktok-cdn.com/videos/${mockPostId}`;
    
    // Return standardized format for all cases
    const response = {
        auto: {
            url: `${baseUrl}/auto_quality.mp4`,
            mime: 'video/mp4'
        },
        audio: {
            url: `${baseUrl}/audio.mp3`,
            mime: 'audio/mpeg'
        },
        hd: {
            url: `${baseUrl}/hd_quality.mp4`,
            mime: 'video/mp4'
        },
        // Legacy properties for backward compatibility
        urls: `${baseUrl}/auto_quality.mp4`,
        filename: `tiktok_mock_${mockPostId}.mp4`,
        headers: { cookie: "mock_cookie=value" }
    };

    // Handle different request types for legacy compatibility
    if (obj.isAudioOnly) {
        response.urls = response.audio.url;
        response.audioFilename = `tiktok_mock_${mockPostId}_audio`;
        response.isAudioOnly = true;
        response.bestAudio = 'mp3';
    }

    return response;
}
