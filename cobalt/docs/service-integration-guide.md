# Cobalt Service Integration & Feature Matrix Guide

## Overview

Cobalt is a media downloader that operates as a **"fancy proxy"** - it never caches any content. Instead, it works by fetching content directly from supported platforms and either passing it through or processing it on-the-fly before delivering it to you. This approach ensures you always get the latest content while respecting the original sources.

## Supported Platforms

Cobalt currently supports the following platforms with varying feature sets:

### Full Feature Support (Video + Audio + Metadata + Rich Names)
- **YouTube** - Videos, music, shorts, 8K/4K/HDR/VR, high FPS videos
- **Dailymotion**
- **OK.ru**
- **Rutube** - Including yappy & private links
- **Twitch Clips**
- **Vimeo** - Audio downloads only available for dash

### Video + Audio Support (Limited/No Metadata)
- **Bilibili**
- **Bluesky**
- **Instagram** - Reels, photos, videos, multi-media posts
- **Facebook** - Public videos only
- **Loom** - Video with metadata, no audio-only
- **Pinterest** - Photos, gifs, videos, stories
- **Reddit** - Gifs and videos
- **Snapchat** - Spotlights and stories
- **Streamable**
- **TikTok** - Videos with/without watermark, slideshow images
- **Tumblr**
- **Twitter/X** - Multi-media posts (reliability may vary)
- **VK Videos & Clips** - No audio-only support
- **Xiaohongshu**

### Audio-Only Platform
- **SoundCloud** - Including private links

## Feature Matrix Explained

### 🎬 Video + Audio
- Platform supports downloading videos with their original audio track
- ✅ = Fully supported
- ❌ = Not supported

### 🎵 Only Audio
- Ability to extract and download just the audio track from videos
- ✅ = Can extract audio separately
- ❌ = Cannot extract audio only

### 🎥 Only Video
- Ability to download video without audio (muted)
- ✅ = Can download video only
- ❌ = Cannot separate video from audio

### 📊 Metadata
- Whether the platform provides rich metadata (title, artist, album, etc.)
- ✅ = Full metadata available
- ➖ = Unreasonable/impossible to extract
- ❌ = Not supported

### 📝 Rich File Names
- Whether downloaded files get descriptive names based on content
- ✅ = Descriptive filenames with title/artist info
- ➖ = Not applicable for this service
- ❌ = Generic or basic filenames only

## Service-Specific Options

Cobalt provides additional configuration options for certain services:

### YouTube Options
- **`youtubeVideoCodec`**: Choose video codec (`h264`, `av1`, or `vp9`)
  - Default: `h264`
  - Use `av1` for better compression
  - Use `vp9` for better quality/compression balance
- **`youtubeDubLang`**: Select dubbed audio language (e.g., `en`, `zh-CN`)
- **`youtubeBetterAudio`**: Prefer higher quality audio when available
- **`youtubeHLS`**: Use HLS formats for downloading

### TikTok Options
- **`tiktokFullAudio`**: Download the original sound/music used in the video
  - Default: `false`
  - When `true`, downloads the complete original audio track

### Platform-Agnostic Options
- **`allowH265`**: Enable H265/HEVC video downloads
  - Default: `false`
  - Applies to: TikTok, Xiaohongshu
  - Note: H265 offers better compression but may have compatibility issues

### Twitter/X Options
- **`convertGif`**: Convert Twitter GIFs to actual GIF format
  - Default: `true`
  - Twitter "GIFs" are actually video files

## How Cobalt Works as a Proxy

Unlike traditional downloaders, Cobalt:

1. **Never stores content** - All media is streamed directly from the source
2. **Processes on-the-fly** - Remuxing, transcoding, or format conversion happens in real-time
3. **Maintains freshness** - You always get the current version of the content
4. **Respects rate limits** - Operates within platform constraints
5. **Preserves quality** - No re-encoding unless specifically requested

This "fancy proxy" approach means:
- ✅ No storage costs or cached outdated content
- ✅ Always get the latest version
- ✅ Reduced legal concerns about content storage
- ✅ Efficient resource usage
- ❌ Slightly slower than cached systems
- ❌ Dependent on source platform availability

## Example API Usage

Here's how to use service-specific options:

```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "downloadMode": "auto",
  "videoQuality": "1080",
  "youtubeVideoCodec": "av1",
  "youtubeBetterAudio": true
}
```

```json
{
  "url": "https://www.tiktok.com/@user/video/1234567890",
  "tiktokFullAudio": true,
  "allowH265": true
}
```

## Important Notes

- Service support is continuously expanding
- Some features depend on what the source platform provides
- Metadata availability varies significantly between platforms
- "Unreasonable/impossible" (➖) typically means the platform doesn't provide this data
- Always check the current API documentation for the latest supported services and options
