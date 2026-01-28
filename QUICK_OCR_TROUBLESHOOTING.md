# 🔧 Quick OCR Troubleshooting Guide

## ⚡ Quick Start (30 seconds)

1. **Get API Key**: Visit [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. **Copy Key**: Click "Create API key" and copy it
3. **Add to .env**: Open `.env` file and paste:
   ```env
   EXPO_PUBLIC_GEMINI_API_KEY=your_key_here
   ```
4. **Restart**: Stop Expo (Ctrl+C) and run:
   ```powershell
   npx expo start --clear
   ```

✅ **Done!** Test by taking a photo of a license plate.

---

## 🐛 Common Errors & Instant Fixes

### ❌ Error: "Gemini not initialized"

**Fix:**

```powershell
# Check if API key exists
cat .env | Select-String "GEMINI"

# Restart with cleared cache
npx expo start --clear
```

**If still failing:**

- Verify API key starts with `AIzaSy`
- Check no extra spaces in `.env`
- Ensure key is on one line

---

### ❌ Error: "No license plate detected"

**Quick Fixes:**

1. **Better Lighting** - Use bright, even lighting
2. **Steady Phone** - Avoid blurry images
3. **Center Plate** - Position plate in the frame guide
4. **Straight Angle** - Take photo head-on, not at angle
5. **Use Manual Entry** - Tap "Manual Entry" when prompted

**Advanced:**

- Clean the camera lens
- Try different distances (1-3 feet optimal)
- Avoid shadows on the plate

---

### ❌ Error: "Image too large after compression"

**Fix:**

- Move **closer** to the plate (reduces background)
- Use **better lighting** (reduces noise/file size)
- Take photo in **portrait mode** (narrower frame)

---

### ❌ Error: "Rate limit exceeded"

**Limits:**

- 15 requests/minute
- 1,500 requests/day

**Fix:**

- Wait 1-2 minutes
- For testing, use one API key per developer
- Avoid rapid-fire testing

---

### ❌ Error: Package/Module not found

**Fix:**

```powershell
# Reinstall dependencies
npm install

# Clear cache and restart
npx expo start --clear
```

---

### ❌ Scanner opens but crashes on capture

**Fix:**

```powershell
# Check camera permissions
# On Android: Settings > Apps > YourApp > Permissions > Camera

# Clear app cache
npx expo start --clear

# Rebuild app
npx expo run:android
# or
npx expo run:ios
```

---

## 🔍 Diagnostic Commands

### Check Environment Variables:

```powershell
cat .env
```

### Verify Package Installation:

```powershell
npm list @google/generative-ai expo-file-system expo-image-manipulator
```

### Check Expo Status:

```powershell
npx expo-doctor
```

### View Logs:

```powershell
# Android
npx react-native log-android

# iOS
npx react-native log-ios
```

---

## 📊 Expected Log Output (Success)

When OCR works correctly, you should see:

```
✓ Gemini OCR initialized (ONLY provider)
=== Starting OCR Processing ===
Using Google Gemini OCR (Free)...
Compressing image to meet Gemini size limit...
Compressed image size: 234 KB
Gemini raw response: WP ABC-1234
✓ Gemini OCR Success: WP ABC-1234
OCR Success! Extracted text: WP ABC-1234
Confidence: 0.95
```

---

## 🚨 Log Error Messages Decoded

| Log Message                     | Problem              | Solution             |
| ------------------------------- | -------------------- | -------------------- |
| `⚠ Gemini API key not found`    | No API key in `.env` | Add key to `.env`    |
| `Gemini not initialized`        | Key not loaded       | Restart Expo         |
| `NO_PLATE_DETECTED`             | No plate in image    | Retake photo         |
| `Image still too large: XXX KB` | File > 1MB           | Move closer          |
| `403 Forbidden`                 | Invalid API key      | Check key is correct |
| `429 Too Many Requests`         | Rate limit hit       | Wait a minute        |
| `Network request failed`        | No internet          | Check connection     |

---

## 🧪 Testing Checklist

Before reporting issues, verify:

- [ ] API key is in `.env` file
- [ ] Expo server restarted after adding key
- [ ] Camera permission granted
- [ ] Internet connection active
- [ ] Taking photo in good lighting
- [ ] License plate clearly visible
- [ ] No other errors in Expo console

---

## 💊 Nuclear Option (Last Resort)

If nothing works:

```powershell
# 1. Clean everything
rm -rf node_modules package-lock.json

# 2. Reinstall
npm install

# 3. Clear all caches
npx expo start --clear --reset-cache

# 4. Rebuild app
npx expo run:android
```

---

## 📞 Get Help

1. **Check logs** - Look at Expo console for specific errors
2. **Read full guide** - Open `COMPLETE_OCR_SETUP_GUIDE.md`
3. **Verify API key** - Ensure it's valid and has quota remaining
4. **Test manually** - Try manual entry to isolate OCR issues

---

## ✅ Verification Test

Run this test to confirm OCR is working:

1. Open app
2. Go to Parking Owner or Inspector Dashboard
3. Click "Scan Plate"
4. Take photo of ANY text (license plate, sign, etc.)
5. Check Expo console logs

**If you see "Gemini OCR Success"** = ✅ Working!
**If you see "Gemini not initialized"** = ❌ Check `.env`

---

## 🎯 Quick Reference

### Required Packages (Already Installed):

- `@google/generative-ai` - Gemini AI SDK
- `expo-file-system` - File operations
- `expo-image-manipulator` - Image compression
- `expo-camera` - Camera access

### Environment Variable:

```env
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSy...
```

### Restart Command:

```powershell
npx expo start --clear
```

### Files to Check:

- `.env` - API key
- `app/services/ocrService.ts` - OCR logic
- `app/screens/*/scanPlate.tsx` - Scanner screens

---

**Most issues are fixed by:** Adding the API key to `.env` and restarting Expo with `--clear` flag!
