# Standardized TikTok Download Endpoint

This document describes the new standardized download endpoint that returns TikTok scraping results in a consistent format.

## Overview

The new `/download` endpoint extends the existing TikTok scraping service to return responses in a standardized object structure as requested:

```typescript
{
  auto: { url: string, mime: 'video/mp4' },
  audio: { url: string, mime: 'audio/mpeg' },
  hd: { url: string, mime: 'video/mp4' }
}
```

## Endpoint Details

### URL
`POST /download`

### Request Body
Same as the main endpoint:
```json
{
  "url": "https://www.tiktok.com/@user/video/1234567890",
  "tiktokFullAudio": false,
  "allowH265": true,
  "alwaysProxy": false
}
```

### Response Format
```json
{
  "status": "stream",
  "url": "https://primary-video-url.mp4",
  "formats": {
    "auto": {
      "url": "https://auto-quality-video.mp4",
      "mime": "video/mp4"
    },
    "audio": {
      "url": "https://audio-only.mp3",
      "mime": "audio/mpeg"
    },
    "hd": {
      "url": "https://hd-quality-video.mp4",
      "mime": "video/mp4"
    }
  }
}
```

## Implementation Details

### Service Modifications

1. **Enhanced TikTok Service** (`tiktok.js`):
   - Modified to return the standardized format alongside legacy properties
   - Maintains backward compatibility with existing code
   - Attempts to provide HD quality via H265 codec when available

2. **New API Endpoint** (`api-tiktok.js`):
   - Added `/download` endpoint that directly calls the TikTok service
   - Returns the standardized format in the response
   - Supports all existing TikTok scraping parameters

### Development Features

1. **Stub Mode**:
   - Set `TIKTOK_STUB_MODE=true` environment variable to use mock data
   - Useful for local development and testing
   - Returns realistic mock URLs in the standardized format

2. **Testing**:
   - Test script provided: `test-standardized-endpoint.js`
   - Validates response structure and MIME types
   - Compares with legacy endpoint behavior

## Quality Levels

- **auto**: Standard quality video (default TikTok video URL)
- **audio**: Audio-only extraction (MP3 format)
- **hd**: High-definition video (H265 codec when available, falls back to auto quality)

## Configuration

### Environment Variables
- `TIKTOK_STUB_MODE`: Set to `'true'` to enable stub mode for local development

### Backward Compatibility
The changes maintain full backward compatibility:
- Existing endpoints continue to work unchanged
- Legacy response format is preserved in the original endpoints
- New standardized format is only returned by the `/download` endpoint

## Usage Examples

### Basic Request
```bash
curl -X POST http://localhost:9001/download \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "url": "https://www.tiktok.com/@user/video/1234567890"
  }'
```

### With H265 Support
```bash
curl -X POST http://localhost:9001/download \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "url": "https://www.tiktok.com/@user/video/1234567890",
    "allowH265": true
  }'
```

### Testing with Stub Mode
```bash
# Set environment variable
export TIKTOK_STUB_MODE=true

# Run test script
node api/test-standardized-endpoint.js
```

## Error Handling

The endpoint uses the same error handling as the main API:
- Invalid URLs return appropriate error codes
- Network failures are handled gracefully
- Rate limiting applies as configured

## Migration Guide

To migrate from the legacy endpoint to the standardized endpoint:

1. Change endpoint URL from `/` to `/download`
2. Update response parsing to use the `formats` object
3. Access specific quality levels via `formats.auto`, `formats.audio`, or `formats.hd`
4. The main `url` field continues to provide the primary video URL for backward compatibility
