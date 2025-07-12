# Audio Pipeline Audit Report

## Executive Summary
This audit examines the current audio pipeline implementation in Cobalt, focusing on TikTok service integration, audio extraction mechanisms, and FFmpeg argument construction. The analysis reveals several critical areas requiring improvement.

## Current Implementation Analysis

### 1. Audio vs. Music-Track Detection

#### Current State (tiktok.js)
```javascript
// Lines 92-110: Audio extraction logic
if (obj.isAudioOnly) {
    // Always uses video URL as source
    audio = playAddr;
    audioFilename = `${filenameBase}_audio`;
    
    // Only uses music URL if specifically requested
    if (obj.fullAudio && detail.music && detail.music.playUrl) {
        const musicUrl = detail.music.playUrl;
        if (musicUrl && musicUrl.startsWith('http')) {
            audio = musicUrl;
            audioFilename = `${filenameBase}_audio_original`;
            bestAudio = 'mp3'; // Hardcoded assumption
        }
    }
}
```

#### Issues Identified:
1. **No proper music track detection** - The system doesn't differentiate between video audio track and background music
2. **Hardcoded format assumption** - Assumes TikTok music is always MP3
3. **Limited validation** - Only checks if URL starts with 'http'
4. **No quality assessment** - Doesn't check bitrate or quality of music vs video audio

### 2. BestAudio Stream Selection

#### Current State (match-action.js)
```javascript
// Lines 219-234: Best audio format selection
if (audioFormat === "best") {
    const serviceBestAudio = r.bestAudio;
    
    if (serviceBestAudio) {
        audioFormat = serviceBestAudio;
        processType = "proxy";
        
        if (host === "soundcloud") {
            processType = "audio";
            copy = true;
        }
    } else {
        audioFormat = "m4a";
        copy = true;
    }
}
```

#### Issues Identified:
1. **Inconsistent bestAudio detection** - TikTok service doesn't properly set bestAudio
2. **No bitrate comparison** - Doesn't compare available audio streams by quality
3. **Default fallback issues** - Always falls back to m4a without considering source
4. **Missing codec detection** - No analysis of source audio codec

### 3. FFmpeg Argument Construction

#### Current State (types.js)
```javascript
// Lines 486-577: TikTok audio extraction FFmpeg args
if (streamInfo.service === "tiktok") {
    args.push(
        "-headers", toRawHeaders(headers),
        "-probesize", "50M",
        "-analyzeduration", "30M",
        "-reconnect", "1",
        "-reconnect_streamed", "1",
        "-reconnect_delay_max", "5",
        "-timeout", "30000000",
        // ... more args
    );
}
```

#### Issues Identified:
1. **Overly complex probe settings** - May cause delays
2. **No adaptive bitrate handling** - Fixed bitrate regardless of source
3. **Missing audio normalization** - No loudness normalization
4. **Inefficient codec selection** - Always re-encodes even when copy would work

## Decision Matrix for Desired Behaviors

| Scenario | Current Behavior | Desired Behavior | Priority |
|----------|-----------------|------------------|----------|
| **Audio Format Selection** |
| Source is AAC, user wants MP3 | Always re-encodes | Smart re-encode only if needed | High |
| Source is MP3, user wants "best" | Returns MP3 (proxy) | Copy if quality is good, re-encode if low bitrate | High |
| Multiple audio streams available | Uses first/video stream | Select highest quality stream | Medium |
| **Music Track Extraction** |
| User wants original music | Uses music URL if available | Analyze both streams, pick best quality | High |
| Music URL is lower quality | Still uses music URL | Fall back to video audio | Medium |
| Music URL is unavailable | Falls back to video | Properly extract from video | High |
| **Codec Handling** |
| Same codec input/output | Re-encodes | Copy when possible | High |
| Incompatible container | Fails or re-encodes | Smart remux | Medium |
| Lossy to lossy conversion | Always converts | Warn user about quality loss | Low |
| **Stream Processing** |
| Network issues | Single attempt with timeout | Retry with backoff | Medium |
| Large files | Downloads entire file | Stream processing | Low |
| Metadata preservation | Limited support | Full metadata copy | Low |

## Concrete Issues for Tracking

### Issue #1: Implement Smart Audio Stream Selection
**Priority:** High
**Description:** The system should analyze all available audio streams and select the highest quality one based on bitrate, codec, and sample rate.
**Acceptance Criteria:**
- Detect all available audio streams in the source
- Compare streams by quality metrics
- Select optimal stream for extraction
- Log selection reasoning

### Issue #2: Add Proper Music Track Detection
**Priority:** High
**Description:** Differentiate between video audio track and background music track, selecting based on user preference and quality.
**Acceptance Criteria:**
- Identify music track vs video audio
- Compare quality of both tracks
- Implement fallback logic
- Add user preference handling

### Issue #3: Implement Smart Codec Copy
**Priority:** High
**Description:** Avoid unnecessary re-encoding when the source codec matches the target format and quality is acceptable.
**Acceptance Criteria:**
- Detect source codec accurately
- Implement codec compatibility matrix
- Add quality threshold checks
- Use copy when beneficial

### Issue #4: Fix BestAudio Format Detection
**Priority:** High
**Description:** Properly detect and set the best audio format for each service, especially TikTok.
**Acceptance Criteria:**
- Analyze source audio properties
- Set bestAudio based on actual codec
- Remove hardcoded assumptions
- Add format validation

### Issue #5: Optimize FFmpeg Arguments
**Priority:** Medium
**Description:** Streamline FFmpeg arguments for better performance and reliability.
**Acceptance Criteria:**
- Reduce probe size for faster starts
- Add adaptive settings based on source
- Implement proper error handling
- Add progress tracking

### Issue #6: Add Audio Quality Validation
**Priority:** Medium
**Description:** Validate audio quality before and after processing to ensure standards are met.
**Acceptance Criteria:**
- Check source audio properties
- Validate output quality
- Add quality warnings
- Implement minimum quality thresholds

### Issue #7: Implement Retry Logic for Network Issues
**Priority:** Medium
**Description:** Add intelligent retry logic for failed downloads or processing.
**Acceptance Criteria:**
- Implement exponential backoff
- Add max retry limits
- Log retry attempts
- Handle partial downloads

### Issue #8: Add Metadata Preservation
**Priority:** Low
**Description:** Properly preserve and transfer metadata from source to output.
**Acceptance Criteria:**
- Extract all metadata from source
- Map metadata to output format
- Handle format-specific metadata
- Add metadata editing options

## Recommendations

1. **Immediate Actions:**
   - Fix bestAudio detection for TikTok
   - Implement smart codec copy
   - Add proper stream selection logic

2. **Short-term Improvements:**
   - Optimize FFmpeg arguments
   - Add quality validation
   - Implement retry logic

3. **Long-term Enhancements:**
   - Add streaming processing
   - Implement advanced metadata handling
   - Add user quality preferences

## Code Quality Observations

1. **Logging:** Excessive debug logging in production code
2. **Error Handling:** Inconsistent error handling patterns
3. **Code Duplication:** Similar FFmpeg logic repeated in multiple places
4. **Type Safety:** Missing TypeScript types for stream properties
5. **Testing:** Lack of unit tests for audio processing logic

## Conclusion

The current audio pipeline has significant room for improvement, particularly in:
- Smart stream selection
- Codec handling efficiency
- Quality preservation
- Error resilience

Addressing these issues will result in better audio quality, faster processing, and improved user experience.
