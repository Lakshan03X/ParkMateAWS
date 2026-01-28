# 🚀 Complete OCR Setup Guide - Google Gemini (FREE)

## ✅ Your App Already Uses Google Gemini!

Your ParkMate application is **already configured** to use **Google Gemini AI** for license plate OCR - the best free OCR service available! This guide will help you verify the setup and troubleshoot any issues.

---

## 📋 Why Google Gemini is the Best Choice

### ✨ Advantages:

- ✅ **100% FREE** - No credit card required
- ✅ **High Accuracy** - Powered by Google's latest AI models (Gemini 1.5 Flash)
- ✅ **Generous Limits** - 15 requests/minute, 1,500/day (45,000/month)
- ✅ **Easy Setup** - Get API key in under 2 minutes
- ✅ **Specialized for License Plates** - Custom prompts for maximum accuracy
- ✅ **Widely Used** - Most developers' choice for free OCR

### 📊 Comparison with Alternatives:

| Service             | Cost       | Monthly Limit | Setup Difficulty | Accuracy   |
| ------------------- | ---------- | ------------- | ---------------- | ---------- |
| **Google Gemini**   | **FREE**   | **45,000**    | ⭐ Easy          | ⭐⭐⭐⭐⭐ |
| Google Cloud Vision | $1.50/1000 | Pay per use   | ⭐⭐ Medium      | ⭐⭐⭐⭐⭐ |
| Tesseract.js        | FREE       | Unlimited     | ⭐⭐⭐ Hard      | ⭐⭐⭐     |
| OCR.space           | FREE       | 25,000        | ⭐ Easy          | ⭐⭐⭐⭐   |

---

## 🔧 Step-by-Step Setup (Complete Guide)

### Step 1: Get Your Free Gemini API Key

1. **Open Google AI Studio**:
   - Visit: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. **Sign In**:

   - Use your Google account (Gmail)
   - No payment information required!

3. **Create API Key**:

   - Click **"Get API Key"** button
   - Click **"Create API key"**
   - Select a Google Cloud project (or create a new one)
   - **Copy the API key** (starts with `AIzaSy...`)

4. **Save Your Key**:
   - Keep it secure - you'll need it in the next step

### Step 2: Configure Your Environment

1. **Open your project folder**:

   ```
   d:\My Documets\SLT\ParkMateApp\my-app
   ```

2. **Edit the `.env` file**:

   - Open `.env` in VS Code (it's already in your project root)
   - Find the line: `EXPO_PUBLIC_GEMINI_API_KEY=...`
   - Replace with YOUR API key:
     ```env
     EXPO_PUBLIC_GEMINI_API_KEY=AIzaSyYourActualAPIKeyHere123456789
     ```

3. **Save the file** (Ctrl + S)

### Step 3: Install Dependencies (If Needed)

Your project already has the required packages, but verify:

```powershell
npm install @google/generative-ai expo-file-system expo-image-manipulator
```

### Step 4: Restart Your Development Server

**IMPORTANT**: You must restart Expo after changing `.env`:

1. **Stop the current server**:

   - Press `Ctrl + C` in the terminal running `npx expo start`

2. **Clear the cache and restart**:
   ```powershell
   npx expo start --clear
   ```

### Step 5: Test the OCR

1. **Open the app** on your device/emulator
2. Navigate to **Parking Owner Dashboard** or **Inspector Dashboard**
3. Click **"Scan Plate"** button
4. Take a photo of a license plate
5. The app should automatically extract the plate number

---

## 🎯 How It Works

### The OCR Service Architecture:

```
📸 Camera Capture
    ↓
🖼️ Image Optimization (1024px, JPEG, <1MB)
    ↓
🤖 Google Gemini AI Analysis
    ↓
🔍 License Plate Pattern Matching
    ↓
✅ Extracted Plate Number
```

### Key Features:

1. **Smart Image Compression**:

   - Automatically resizes images to 1024px width
   - Compresses to JPEG format with 70% quality
   - Ensures images stay under 1MB (Gemini requirement)

2. **Specialized AI Prompt**:

   - Instructs Gemini to focus ONLY on license plates
   - Ignores background text, stickers, signs
   - Supports Sri Lankan plate formats (WP ABC-1234, etc.)

3. **Pattern Recognition**:
   - Validates extracted text against known formats
   - Cleans up OCR artifacts (removes markdown, normalizes spaces)
   - Returns uppercase, properly formatted plate numbers

---

## 🐛 Troubleshooting Common Issues

### Issue 1: "Gemini not initialized" Error

**Cause**: API key not loaded

**Solution**:

```powershell
# 1. Verify .env file exists and has the key
cat .env | Select-String "GEMINI"

# 2. Restart Expo with cache clear
npx expo start --clear
```

### Issue 2: "No license plate detected"

**Possible Causes**:

- Poor lighting
- Blurry image
- Plate not visible in frame
- Wrong angle

**Solutions**:

- ✅ Use good lighting (daylight or bright indoor light)
- ✅ Hold phone steady to avoid blur
- ✅ Position plate inside the frame guide
- ✅ Take photo straight-on (not at an angle)
- ✅ Use **Manual Entry** option as backup

### Issue 3: API Rate Limit Exceeded

**Limits**:

- 15 requests per minute
- 1,500 requests per day

**Solution**:

- Wait a few minutes and try again
- For high-volume testing, create multiple API keys
- Consider upgrading to paid tier if needed

### Issue 4: "Image too large" Error

**Cause**: Image exceeds 1MB after compression

**Solution**:

- The app should handle this automatically
- If it persists, take photo from a closer distance
- Ensure good lighting (reduces image noise/size)

### Issue 5: Wrong Text Extracted

**Causes**:

- Multiple text elements in frame
- Poor image quality
- Unusual plate format

**Solutions**:

- ✅ Center the plate in the frame
- ✅ Remove background text/signs from view
- ✅ Use **Manual Entry** to correct
- ✅ Retake photo with better positioning

---

## 📱 Using the Scanner

### For Parking Owners:

1. Go to **Parking Owner Dashboard**
2. Tap **"Scan Plate"**
3. Position the license plate in the frame guide
4. Tap the **capture button** (camera icon)
5. Wait for automatic extraction
6. Confirm or edit the result
7. Continue with parking/fine check

### For Inspectors:

1. Go to **Inspector Dashboard**
2. Tap **"Scan Plate"**
3. Follow same capture process
4. Extracted plate will be used for parking validation

### Manual Entry Option:

If OCR fails:

1. Tap **"Manual Entry"** in the alert
2. Type the plate number manually
3. Confirm and proceed

---

## 🔒 Security Best Practices

### ⚠️ NEVER Commit Your API Key!

Your `.env` file is already in `.gitignore`, but double-check:

```powershell
# Verify .env is ignored
git check-ignore .env
# Should output: .env
```

### If You Accidentally Exposed Your Key:

1. **Revoke it immediately**:
   - Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Delete the compromised key
2. **Create a new key**:
   - Generate a new API key
   - Update your `.env` file
   - Restart Expo

---

## 📊 Monitoring Usage

### Check Your API Usage:

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Click on your project
3. View usage statistics and quotas

### Rate Limit Best Practices:

- ✅ Don't spam the API during testing
- ✅ Implement proper error handling
- ✅ Show user feedback during processing
- ✅ Cache results when appropriate

---

## 🚀 Advanced Configuration

### Adjust Image Quality:

Edit `app/services/ocrService.ts` (lines 41-49):

```typescript
const compressedImage = await ImageManipulator.manipulateAsync(
  imageUri,
  [
    { resize: { width: 1024 } }, // Change to 800 or 1280
  ],
  {
    compress: 0.7, // Change to 0.5-0.9
    format: ImageManipulator.SaveFormat.JPEG,
  }
);
```

**Recommendations**:

- **Lower quality (0.5-0.6)**: Faster processing, smaller files
- **Higher quality (0.8-0.9)**: Better accuracy for difficult plates
- **Default (0.7)**: Best balance

### Customize AI Prompt:

Edit the prompt in `ocrService.ts` (lines 96-120) to:

- Support different country formats
- Add specific instructions
- Improve accuracy for your use case

---

## ✅ Verification Checklist

Before testing, verify:

- [ ] `.env` file exists with `EXPO_PUBLIC_GEMINI_API_KEY`
- [ ] API key is valid (starts with `AIzaSy`)
- [ ] Expo server restarted after `.env` changes
- [ ] Camera permissions granted on device
- [ ] Internet connection available
- [ ] Device/emulator has camera access

---

## 🆘 Still Having Issues?

### Check the Logs:

The OCR service provides detailed logging:

```
✓ Gemini OCR initialized (ONLY provider)
Using Google Gemini OCR (Free)...
Compressing image to meet Gemini size limit...
Compressed image size: 234 KB
Gemini raw response: WP ABC-1234
✓ Gemini OCR Success: WP ABC-1234
```

### Common Log Messages:

| Message                  | Meaning            | Action            |
| ------------------------ | ------------------ | ----------------- |
| "Gemini not initialized" | API key missing    | Check `.env` file |
| "NO_PLATE_DETECTED"      | No plate in image  | Retake photo      |
| "Image still too large"  | Compression failed | Move closer       |
| "Gemini OCR Success"     | ✅ Working!        | None needed       |

---

## 📚 Additional Resources

- **Google AI Studio**: [https://aistudio.google.com/](https://aistudio.google.com/)
- **Gemini API Docs**: [https://ai.google.dev/docs](https://ai.google.dev/docs)
- **Rate Limits**: [https://ai.google.dev/gemini-api/docs/models/gemini](https://ai.google.dev/gemini-api/docs/models/gemini)
- **Expo Camera Docs**: [https://docs.expo.dev/versions/latest/sdk/camera/](https://docs.expo.dev/versions/latest/sdk/camera/)

---

## 🎓 Quick Reference

### Environment Variable:

```env
EXPO_PUBLIC_GEMINI_API_KEY=your_key_here
```

### Test Command:

```powershell
npx expo start --clear
```

### Files Involved:

- `app/services/ocrService.ts` - Main OCR logic
- `app/screens/parkingOwner/dashboard/scanPlate.tsx` - Owner scanner
- `app/screens/parkingInspector/inspectorScanPlate.tsx` - Inspector scanner
- `.env` - API key configuration

---

## 💡 Pro Tips

1. **Testing with Demo Images**:

   - Use high-quality photos of license plates
   - Test in different lighting conditions
   - Try various plate formats

2. **Performance Optimization**:

   - First request may take 2-3 seconds (model initialization)
   - Subsequent requests are faster (~1 second)
   - Consider showing loading indicators

3. **User Experience**:

   - Provide clear instructions to users
   - Show frame guide for plate positioning
   - Offer manual entry fallback
   - Display confidence scores (optional)

4. **Production Deployment**:
   - Monitor API usage regularly
   - Set up error tracking (Sentry, etc.)
   - Consider implementing retry logic
   - Add analytics for success rates

---

## ✨ Summary

Your ParkMate app is already using the **best free OCR solution available**:

✅ Google Gemini AI - Free, accurate, and widely used by developers
✅ Optimized for license plate recognition
✅ Automatic image compression and enhancement
✅ Pattern matching for Sri Lankan plates
✅ Manual entry fallback for edge cases

**Just add your API key and you're ready to go!**

---

**Need Help?** Check the troubleshooting section or review the logs in your Expo terminal.
