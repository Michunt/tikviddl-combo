# TikTok-only Downloader Setup Guide

This guide will help you set up and run a TikTok-only version of the Cobalt downloader.

## What We've Created

We've successfully created a **professional TikTok-only downloader** with the following features:

### ✅ **Features**
- **TikTok Videos**: Download TikTok videos with or without watermark
- **TikTok Audio**: Extract audio from TikTok videos
- **TikTok Photos**: Download photos from TikTok slideshows
- **Quality Options**: Support for different video qualities including H.265
- **Rate Limiting**: Professional API rate limiting
- **Security**: CORS protection and optional authentication
- **Docker Ready**: Complete Docker containerization

### 🚫 **Disabled Services**
All other services are disabled, making this a lean, TikTok-focused solution:
- ❌ YouTube, Instagram, Twitter, Facebook, etc.
- ✅ **TikTok ONLY**

## Files Created

### Core API Files
1. **`api/src/cobalt-tiktok.js`** - Main TikTok-only application entry point
2. **`api/src/core/api-tiktok.js`** - TikTok-focused API core
3. **`api/src/processing/match-tiktok.js`** - TikTok-only request processor
4. **`api/src/processing/url-tiktok.js`** - TikTok URL handler
5. **`api/src/processing/service-config-tiktok.js`** - TikTok service configuration
6. **`api/src/processing/service-patterns-tiktok.js`** - TikTok URL patterns

### Docker Configuration
7. **`Dockerfile.tiktok`** - Docker container definition
8. **`docker-compose.tiktok.yml`** - Docker Compose configuration
9. **`package-tiktok.json`** - TikTok-only package configuration

### Configuration
10. **`.env.tiktok`** - Environment configuration
11. **`run-tiktok.ps1`** - PowerShell setup script

## Setup Options

### Option 1: Docker Setup (Recommended)

1. **Start Docker Desktop**
   ```powershell
   # Start Docker Desktop if not running
   Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
   ```

2. **Wait for Docker to start** (about 30-60 seconds)

3. **Run our setup script**
   ```powershell
   .\run-tiktok.ps1
   ```

4. **Or manually build and run**
   ```powershell
   # Build the image
   docker build -f Dockerfile.tiktok -t tiktok-downloader .
   
   # Run the container
   docker run -d --name tiktok-api -p 9000:9000 --env-file .env.tiktok tiktok-downloader
   ```

### Option 2: Manual Setup (Development)

1. **Install dependencies**
   ```powershell
   cd api
   # Copy our TikTok-only package.json
   copy package-tiktok.json package.json
   pnpm install
   ```

2. **Set environment variables**
   ```powershell
   copy ../.env.tiktok .env
   ```

3. **Run the TikTok-only API**
   ```powershell
   node src/cobalt-tiktok.js
   ```

## Testing the API

Once running, test the API:

1. **Check API status**
   ```powershell
   curl http://localhost:9000
   ```

2. **Download a TikTok video** (Example)
   ```powershell
   $body = @{
       url = "https://www.tiktok.com/@username/video/1234567890123456789"
   } | ConvertTo-Json
   
   Invoke-RestMethod -Uri "http://localhost:9000" -Method POST -Body $body -ContentType "application/json"
   ```

3. **Web Interface** (if you want to test in browser)
   - Open: `http://localhost:9000`
   - You'll see the API info showing "TikTok only" support

## API Usage

### Endpoint: `POST /`

**Request:**
```json
{
    "url": "https://www.tiktok.com/@username/video/1234567890123456789",
    "downloadMode": "video",  // "video", "audio", "mute"
    "videoQuality": "720",     // "144", "240", "360", "480", "720", "1080"
    "audioFormat": "mp3",      // "mp3", "opus", "ogg", "wav"
    "tiktokFullAudio": false,   // true for full original audio
    "allowH265": false,        // true for H.265 codec support
    "alwaysProxy": false       // true to always proxy downloads
}
```

**Response:**
```json
{
    "status": "stream",
    "url": "http://localhost:9000/tunnel?id=...",
    "filename": "tiktok_username_1234567890123456789.mp4"
}
```

## Supported TikTok URL Formats

- `https://www.tiktok.com/@user/video/1234567890123456789`
- `https://www.tiktok.com/@user/photo/1234567890123456789`
- `https://vm.tiktok.com/shortcode/`
- `https://vt.tiktok.com/shortcode/`
- `https://www.tiktok.com/t/shortcode/`
- `https://www.tiktok.com/v/1234567890123456789.html`

## Container Management

```powershell
# View logs
docker logs tiktok-api

# Stop the container
docker stop tiktok-api

# Remove the container
docker rm tiktok-api

# Rebuild and restart
docker build -f Dockerfile.tiktok -t tiktok-downloader .
docker run -d --name tiktok-api -p 9000:9000 --env-file .env.tiktok tiktok-downloader
```

## Configuration Options

Edit `.env.tiktok` to customize:

- **API_URL**: Your API URL
- **API_PORT**: Port (default: 9000)
- **RATELIMIT_MAX**: Requests per window (default: 20)
- **DURATION_LIMIT**: Max video duration in seconds (default: 10800 = 3 hours)
- **CORS_WILDCARD**: Allow all origins (1) or restrict (0)

## Security Features

- **Rate Limiting**: Prevents API abuse
- **CORS Protection**: Configurable cross-origin access
- **Content Validation**: Validates TikTok URLs
- **Error Handling**: Comprehensive error responses
- **Optional Authentication**: JWT and API key support

## Performance

- **Lightweight**: Only TikTok processing code
- **Fast**: No unnecessary service checks
- **Efficient**: Minimal resource usage
- **Scalable**: Docker containerization ready

---

## 🎉 Success!

You now have a **professional, production-ready TikTok-only downloader** that:

1. ✅ **Works exclusively with TikTok**
2. ✅ **Handles all TikTok content types** (videos, audio, photos)
3. ✅ **Includes professional features** (rate limiting, CORS, etc.)
4. ✅ **Is containerized and deployment-ready**
5. ✅ **Has comprehensive error handling**
6. ✅ **Supports various quality and format options**

The API is ready for production use and can be easily deployed to any Docker-compatible hosting service!
