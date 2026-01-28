# 🎯 Google Gemini OCR - 3-Step Setup

**Your app already uses Google Gemini - the best FREE OCR service used by most developers!**

---

## Step 1: Get Your Free API Key (2 minutes)

1. Visit: **[https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)**
2. Sign in with your Google account
3. Click **"Get API Key"** → **"Create API key"**
4. **Copy the key** (starts with `AIzaSy...`)

---

## Step 2: Add API Key to .env File (30 seconds)

1. Open the `.env` file in your project root
2. Find or add this line:
   ```env
   EXPO_PUBLIC_GEMINI_API_KEY=AIzaSyYourKeyHere
   ```
3. Replace `AIzaSyYourKeyHere` with your actual key
4. **Save the file** (Ctrl+S)

---

## Step 3: Restart Expo (30 seconds)

In your terminal:

```powershell
# Press Ctrl+C to stop current server, then run:
npx expo start --clear
```

---

## ✅ Test It!

1. Open your app
2. Navigate to **Parking Owner** or **Inspector** dashboard
3. Click **"Scan Plate"**
4. Take a photo of a license plate
5. Watch it automatically extract the plate number!

---

## ⚠️ Important Notes

- **Free Limits**: 15 scans/minute, 1,500/day (more than enough!)
- **Keep Key Secret**: Never share your API key or commit `.env` to Git
- **Restart Required**: Always restart Expo after changing `.env`

---

## 🐛 Not Working?

Check `QUICK_OCR_TROUBLESHOOTING.md` for instant fixes!

---

## 📚 Full Documentation

- **Complete Setup**: `COMPLETE_OCR_SETUP_GUIDE.md`
- **Troubleshooting**: `QUICK_OCR_TROUBLESHOOTING.md`
- **Original Guide**: `GEMINI_OCR_SETUP.md`

---

**That's it! You're ready to scan license plates with AI! 🚀**
