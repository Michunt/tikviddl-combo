# TikTok Audio Extraction Debug Documentation

## Overview
This document describes the debug logging added to trace TikTok audio extraction issues in the Cobalt API.

## Debug Locations Added

### 1. **TikTok Service (`api/src/processing/services/tiktok.js`)**
- **Line 11-17**: Logs incoming request parameters (isAudioOnly, fullAudio, h265, postId, shortLink)
- **Line 86**: Logs video play address when selecting video format
- **Line 99**: Logs when using video URL as audio source
- **Line 107-109**: Logs full audio request and music URL verification
- **Line 121**: Logs audio/video URLs when building response structure
- **Line 209**: Logs when returning audio-only response
- **Line 230-236**: Logs final audio response details including URL, filename, and headers

### 2. **Match-Action Processing (`api/src/processing/match-action.js`)**
- **Line 238-244**: Logs TikTok audio processing details including format, URL, and headers
- **Line 252**: Logs when creating audio stream with selected format
- **Line 267**: Logs the created stream URL

### 3. **Stream Types - Audio Conversion (`api/src/stream/types.js`)**
- **Line 364-374**: Logs audio extraction start with URL, format, bitrate, and headers
- **Line 397**: Sets FFmpeg loglevel to 'warning' for TikTok (was 'debug' but changed for clarity)
- **Line 428-430**: Logs video download process for audio extraction
- **Line 436-440**: Logs download success/failure with error details
- **Line 524**: Logs final FFmpeg command arguments
- **Line 544-550**: Captures and logs FFmpeg stdout
- **Line 554-562**: Captures and logs FFmpeg stderr
- **Line 573-574**: Logs when first data chunk is received
- **Line 580-586**: Logs FFmpeg process errors
- **Line 592-597**: Logs process close status and exit codes

### 4. **Stream Types - HD Enhancement (`api/src/stream/types.js`)**
- **Line 179-183**: Logs HD video enhancement start
- **Line 204**: Sets FFmpeg loglevel to 'debug' for TikTok HD processing
- **Line 243**: Logs final FFmpeg args for HD processing
- **Line 262-283**: Captures FFmpeg output for HD processing

### 5. **TikTok Proxy (`api/src/stream/tiktok-proxy.js`)**
- Already had comprehensive logging for download process

## Running Debug Tests

### Test Script 1: `test-tiktok-debug.js`
Basic test script that enables `DEBUG=tiktok:*` environment variable and tests audio extraction.

### Test Script 2: `test-tiktok-debug-run.js`
Enhanced test script with better formatting and step-by-step output:
- Shows test configuration
- Displays API response details
- Attempts to fetch the stream
- Verifies MP3 file signature
- Provides clear error messages

## How to Use

1. **Start the API server with debug logging:**
   ```bash
   cd api
   npm run dev
   ```

2. **Run the debug test in another terminal:**
   ```bash
   node test-tiktok-debug-run.js
   ```

3. **Watch for debug output in the API server console:**
   - Look for lines marked with `[TikTok]`
   - Check FFmpeg command execution
   - Monitor download progress
   - Identify any errors or warnings

## Key Debug Points to Monitor

1. **Format Selection**: Check if the correct format (bestaudio/mp3) is being selected
2. **URL Processing**: Verify the TikTok video URL is being correctly extracted
3. **Download Process**: Monitor if the video downloads successfully
4. **FFmpeg Execution**: Check the FFmpeg command and its output
5. **Stream Creation**: Verify the stream URL is created properly
6. **Data Flow**: Ensure data is flowing through the pipe correctly

## Common Issues to Look For

- **HTTP Errors**: Check status codes in download responses
- **FFmpeg Errors**: Look for codec issues or format problems
- **Timeout Issues**: Monitor for process timeouts
- **Header Issues**: Verify all required headers are present
- **File Access**: Check temp file creation and cleanup

## Environment Variables

To enable maximum debugging:
```bash
export DEBUG=tiktok:*
```

Or run with inline env var:
```bash
DEBUG=tiktok:* node test-tiktok-debug-run.js
```
