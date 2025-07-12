# TikTok Audio Download Tests

This directory contains automated regression tests for TikTok audio downloads.

## Test Structure

### 1. **tiktok.test.js** - Jest-style test suite
Contains comprehensive tests for TikTok audio downloads including:
- Mock tests (always run)
- E2E tests (run with `E2E_TIKTOK=1`)
- Audio file validation (size > 100kB, correct MIME type)

### 2. **Integration with existing test framework**
The audio download tests are also integrated into `src/util/tests/tiktok.json`

## Running Tests

### Run all TikTok tests (existing framework):
```bash
npm run test:tiktok
```

### Run audio-specific tests (mock only):
```bash
npm run test:tiktok:audio
```

### Run E2E tests (requires live TikTok access):
```bash
npm run test:tiktok:e2e
# or
E2E_TIKTOK=1 node tests/tiktok.test.js
```

### Keep downloaded files for inspection:
```bash
KEEP_TEMP=1 E2E_TIKTOK=1 node tests/tiktok.test.js
```

## Test Cases

1. **Mock Audio Download Validation**
   - Validates response structure
   - Checks for correct MIME types (audio/m4a, audio/mp3, audio/mpeg)
   - Always runs

2. **E2E Audio Download Test**
   - Downloads actual audio from TikTok
   - Validates file size (> 100kB)
   - Saves audio files temporarily for inspection
   - Only runs when `E2E_TIKTOK=1`

3. **Invalid URL Handling**
   - Tests error handling for non-existent videos
   - Validates proper error responses

4. **Quality Settings Test**
   - Tests audio download with specific quality parameters
   - Validates that settings are applied correctly

## Expected Output

### Mock Tests (default):
```
TikTok Audio Download Tests
==================================================

Running: Mock audio download validation
✓ Mock validation passed
✓ Mock audio download validation: PASS

ℹ E2E tests skipped
  Set E2E_TIKTOK=1 to run live TikTok tests

==================================================
Total: 1 | Passed: 1 | Failed: 0
```

### E2E Tests:
```
TikTok Audio Download Tests
==================================================

Running: Mock audio download validation
✓ Mock validation passed
✓ Mock audio download validation: PASS

Running: Download audio for valid TikTok URL (E2E)
Testing URL: https://www.tiktok.com/@zachking/video/7195741644585454894
API response received, validating audio...
✓ Audio downloaded successfully: 2456789 bytes
  Saved to: tests/temp/tiktok_audio_1234567890.m4a
✓ Download audio for valid TikTok URL (E2E): PASS

Running: Handle invalid TikTok URL (E2E)
✓ Invalid URL handled correctly
✓ Handle invalid TikTok URL (E2E): PASS

Running: Download with quality settings (E2E)
✓ Audio downloaded successfully: 3456789 bytes
  Quality settings applied, size: 3456789 bytes
✓ Download with quality settings (E2E): PASS

==================================================
Total: 4 | Passed: 4 | Failed: 0
```

## Troubleshooting

1. **Tests timing out**: Increase timeout or check network connectivity
2. **Audio files not downloading**: Check if TikTok URLs are still valid
3. **MIME type validation failing**: TikTok may have changed audio formats

## Notes

- E2E tests are marked as `canFail: true` due to external dependencies
- Downloaded audio files are automatically cleaned up unless `KEEP_TEMP=1` is set
- Tests validate both file size and MIME type for audio downloads
