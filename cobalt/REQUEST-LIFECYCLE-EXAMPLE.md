# Request Life-Cycle Example

This document walks through a typical request life-cycle in the cobalt API system, detailing how requests are processed, authenticated, and routed to different response types.

## Table of Contents
1. [Authentication Flows](#authentication-flows)
2. [POST / Request Flow](#post--request-flow)
3. [Response Types and Decision Logic](#response-types-and-decision-logic)
4. [GET / Health Endpoint](#get--health-endpoint)
5. [GET /tunnel Streaming Endpoint](#get-tunnel-streaming-endpoint)

## Authentication Flows

The cobalt API supports two authentication methods that can be used independently or together:

### 1. API-Key Authentication

API keys are UUIDv4 strings stored in a configuration file with optional restrictions:

```json
{
  "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee": {
    "name": "example-key",
    "limit": 100,
    "ips": ["192.168.1.0/24", "10.0.0.1"],
    "userAgents": ["MyApp/*"]
  }
}
```

**Request Example:**
```http
POST / HTTP/1.1
Authorization: Api-Key aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee
Accept: application/json
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

**Rate Limiting:** API keys can have custom rate limits. The `limit` field sets the maximum requests per window. Keys are hashed to create rate limit identifiers.

### 2. Bearer Authentication (Turnstile JWT)

For public instances, Turnstile challenge-based authentication issues short-lived JWT tokens:

**Step 1: Solve Turnstile Challenge**
```http
POST /session HTTP/1.1
cf-turnstile-response: <turnstile-response-token>
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "exp": 3600
}
```

**Step 2: Use Bearer Token**
```http
POST / HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Accept: application/json
Content-Type: application/json

{
  "url": "https://www.tiktok.com/@user/video/123"
}
```

**Rate Limiting:** Bearer tokens are rate-limited by hashed token value, not IP address.

## POST / Request Flow

### 1. Request Validation

**Required Headers:**
```http
Accept: application/json
Content-Type: application/json
```

The server validates:
- Headers match regex: `/^application\/json(; charset=utf-8)?$/`
- Body is valid JSON (max 1024 bytes)
- `url` field is present

### 2. Authentication Check

The authentication middleware checks in order:
1. **API-Key presence** (if apiKeyURL configured)
2. **Bearer token** (if sessionEnabled)
3. **No auth** (if authRequired = false)

### 3. Request Schema

**Basic Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "videoQuality": "1080",
  "audioFormat": "mp3",
  "downloadMode": "auto"
}
```

**Full Schema Options:**
```json
{
  "url": "required",
  "audioBitrate": "320 / 256 / 128 / 96 / 64 / 8",
  "audioFormat": "best / mp3 / ogg / wav / opus",
  "downloadMode": "auto / audio / mute",
  "filenameStyle": "classic / pretty / basic / nerdy",
  "videoQuality": "max / 4320 / 2160 / 1440 / 1080 / 720 / 480 / 360 / 240 / 144",
  "disableMetadata": false,
  "alwaysProxy": false,
  "localProcessing": false,
  
  // Service-specific options
  "youtubeVideoCodec": "h264 / av1 / vp9",
  "youtubeDubLang": "en / zh-CN / etc",
  "convertGif": true,
  "allowH265": false,
  "tiktokFullAudio": false,
  "youtubeBetterAudio": false,
  "youtubeHLS": false
}
```

### 4. URL Processing

The system extracts and validates the URL:
1. Parse service from URL pattern
2. Validate against supported services
3. Extract media ID/parameters
4. Check service-specific requirements

## Response Types and Decision Logic

The system chooses between four response types based on the content and configuration:

### 1. Redirect Response

Direct link to source - chosen when:
- Service provides direct downloadable URLs
- `alwaysProxy` is false
- No additional processing needed

```json
{
  "status": "redirect",
  "url": "https://video-source.example.com/video.mp4",
  "filename": "video_1080p.mp4"
}
```

**Services using redirect:** Facebook, Instagram, Tumblr, Pinterest, Streamable, Snapchat, Loom, Twitch

### 2. Tunnel Response

Proxied through cobalt - chosen when:
- `alwaysProxy` is true
- Service requires headers/cookies
- File needs protection from hotlink blocking

```json
{
  "status": "tunnel",
  "url": "https://api.cobalt.tools/tunnel?id=abc&exp=123&sig=xyz&sec=def&iv=ghi",
  "filename": "video_1080p.mp4"
}
```

**Services using tunnel:** TikTok, VK, OK, Xiaohongshu (always proxied)

### 3. Local Processing Response

Client-side processing - chosen when:
- `localProcessing` is true
- Operation is merge/remux/mute/audio/gif
- Not HLS content

```json
{
  "status": "local-processing",
  "type": "merge",
  "service": "youtube",
  "tunnel": [
    "https://api.cobalt.tools/tunnel?id=vid123...",
    "https://api.cobalt.tools/tunnel?id=aud456..."
  ],
  "output": {
    "type": "video/mp4",
    "filename": "youtube_video.mp4",
    "metadata": {
      "title": "Example Video",
      "artist": "Creator Name"
    }
  },
  "audio": {
    "copy": false,
    "format": "aac",
    "bitrate": "128"
  }
}
```

**Processing Types:**
- `merge`: Combine video + audio streams
- `remux`: Change container format
- `mute`: Remove audio track
- `audio`: Extract audio only
- `gif`: Convert video to GIF

### 4. Picker Response

Multiple items - returned for:
- Multi-photo posts
- Playlists
- Stories/collections

```json
{
  "status": "picker",
  "audio": "https://api.cobalt.tools/tunnel?id=audio...",
  "audioFilename": "background_audio.mp3",
  "picker": [
    {
      "type": "video",
      "url": "https://api.cobalt.tools/tunnel?id=1...",
      "thumb": "https://thumbnail1.jpg"
    },
    {
      "type": "photo",
      "url": "https://api.cobalt.tools/tunnel?id=2..."
    }
  ]
}
```

## GET / Health Endpoint

Returns instance information and configuration:

```http
GET / HTTP/1.1
```

**Response:**
```json
{
  "cobalt": {
    "version": "11.0",
    "url": "https://api.cobalt.tools/",
    "startTime": "1699564800000",
    "turnstileSitekey": "0x4AAAAAAAAAAAAAAAAAAAA",
    "services": [
      "youtube", "twitter", "instagram", "tiktok", "facebook",
      "vimeo", "twitch", "reddit", "tumblr", "soundcloud"
    ]
  },
  "git": {
    "commit": "abc123def456",
    "branch": "main",
    "remote": "github.com/imput-net/cobalt"
  }
}
```

## GET /tunnel Streaming Endpoint

Handles file streaming with authentication via query parameters:

```http
GET /tunnel?id=Wx2Ka9z5&exp=1699568400000&sig=abc...&sec=def...&iv=ghi... HTTP/1.1
```

### Query Parameters
- `id`: 21-character stream identifier
- `exp`: 13-digit expiration timestamp
- `sig`: 43-character signature
- `sec`: 43-character security token
- `iv`: 22-character initialization vector

### Response Headers

**Known file size:**
```http
Content-Length: 104857600
Content-Type: video/mp4
Content-Disposition: attachment; filename="video.mp4"
```

**Unknown/streaming size:**
```http
Estimated-Content-Length: 104857600
Content-Type: video/mp4
Transfer-Encoding: chunked
```

### Status Codes
- `200`: Success
- `401`: Unauthorized (invalid signature)
- `403`: Bad Request (missing/invalid parameters)
- `404`: Not Found (expired/unknown stream)
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error

### Rate Limiting

All endpoints return rate limit headers:
```http
RateLimit-Limit: 10
RateLimit-Remaining: 9
RateLimit-Reset: 1699568400
RateLimit-Policy: 10;w=60
```

Different rate limits apply to:
- **API requests**: Default 10/minute, customizable per API key
- **Session creation**: 10/minute for Turnstile token generation
- **Tunnel requests**: Higher limits for streaming

## Processing Decision Flow

```mermaid
graph TD
    A[POST / Request] --> B{Valid Headers?}
    B -->|No| C[400 Bad Request]
    B -->|Yes| D{Authenticated?}
    D -->|No| E[401 Unauthorized]
    D -->|Yes| F[Parse URL]
    F --> G{Valid Service?}
    G -->|No| H[400 Invalid URL]
    G -->|Yes| I[Process Request]
    I --> J{Content Type?}
    J -->|Single File| K{Needs Processing?}
    J -->|Multiple Files| L[Picker Response]
    K -->|No| M{Always Proxy?}
    K -->|Yes| N{Local Processing?}
    M -->|No| O[Redirect Response]
    M -->|Yes| P[Tunnel Response]
    N -->|No| P
    N -->|Yes| Q[Local Processing Response]
```

This flow ensures optimal handling based on:
1. Service capabilities
2. User preferences (alwaysProxy, localProcessing)
3. Content requirements (headers, cookies, processing)
4. Performance considerations

The system prioritizes direct links when possible, falls back to tunneling when needed, and supports client-side processing for advanced features while maintaining security through proper authentication and rate limiting.
