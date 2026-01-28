# Google Gemini OCR Setup Guide

This guide will help you set up Google Gemini OCR for license plate scanning in the ParkMate application.

## Why Gemini?

- **100% Free**: No credit card required
- **Generous Quota**: 15 requests per minute, 1500 requests per day
- **High Accuracy**: Powered by Google's latest AI models
- **Easy Setup**: Get your API key in minutes

## Setup Steps

### 1. Get Your Free Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Get API Key"**
4. Click **"Create API key"**
5. Copy your API key

### 2. Configure Your Environment

1. Create a `.env` file in the root of your project (if it doesn't exist):

   ```bash
   cp .env.example .env
   ```

2. Add your Gemini API key to the `.env` file:
   ```env
   EXPO_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here
   ```

### 3. Restart Your Development Server

After adding the API key, restart your Expo development server:

```bash
npm start
```

## How It Works

The OCR service now uses a multi-tier approach:

1. **Primary**: Google Gemini (gemini-1.5-flash model)

   - Fast and accurate
   - Specialized prompt for license plate detection
   - Free tier with generous limits

2. **Fallback**: OCR.space API
   - Automatically used if Gemini fails or is unavailable
   - Provides redundancy

## Features

### Gemini OCR Benefits

- **Smart Detection**: Uses AI to specifically identify license plates
- **Pattern Recognition**: Understands Sri Lankan license plate formats
- **Clean Output**: Returns only the plate number without extra formatting
- **Error Handling**: Falls back gracefully to alternative OCR providers

### Supported Plate Formats

- WP ABC-1234
- ABC-1234
- WP-ABC-1234
- And other Sri Lankan license plate patterns

## Testing

To test the OCR functionality:

1. Navigate to the parking owner dashboard
2. Click "Scan Plate"
3. Take a photo of a license plate
4. The app will automatically detect and extract the plate number

## Troubleshooting

### "Gemini not initialized" Error

**Solution**: Make sure your `.env` file contains the API key and restart the dev server.

### "No license plate detected"

**Possible causes**:

- Poor lighting in the photo
- License plate is not clearly visible
- Image is blurry or out of focus

**Solutions**:

- Use better lighting
- Move closer to the license plate
- Ensure the camera focuses properly
- Try the manual entry option

### API Rate Limits

Gemini free tier limits:

- 15 requests per minute
- 1,500 requests per day

If you exceed these limits, the app will automatically fall back to OCR.space.

## API Key Security

⚠️ **Important**: Never commit your `.env` file to version control!

The `.env` file is already in `.gitignore` to prevent accidental commits.

## Cost Comparison

| Service             | Cost       | Monthly Limit   |
| ------------------- | ---------- | --------------- |
| Google Gemini       | **FREE**   | 45,000 requests |
| Google Cloud Vision | $1.50/1000 | Pay per use     |
| OCR.space (Free)    | FREE       | 25,000 requests |

## Additional Resources

- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Rate Limits](https://ai.google.dev/gemini-api/docs/models/gemini#rate-limits)

## Support

For issues or questions, please refer to the main project documentation or contact the development team.
