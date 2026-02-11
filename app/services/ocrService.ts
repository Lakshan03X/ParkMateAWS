import Constants from "expo-constants";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";

interface OCRResponse {
  success: boolean;
  text: string;
  confidence?: number;
  error?: string;
  provider?: string;
}

class OCRService {
  private readonly OCR_SPACE_API_KEY = "K87899142388957";
  private readonly OCR_SPACE_URL = "https://api.ocr.space/parse/image";
  private readonly GEMINI_API_KEY =
    Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY || "";
  private readonly GEMINI_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

  constructor() {
    if (this.GEMINI_API_KEY) {
      console.log("🤖 Google Gemini OCR initialized (PRIMARY - FREE)");
      console.log("📦 OCR.space initialized (FALLBACK - FREE)");
    } else {
      console.log("⚠️ Gemini API key not found, using OCR.space only");
      console.log("📦 OCR.space initialized (FREE - 25k/month)");
    }
  }

  async extractTextFromImage(imageUri: string): Promise<OCRResponse> {
    try {
      console.log("🔍 Starting OCR Processing...");

      // Try Gemini first if available
      if (this.GEMINI_API_KEY) {
        console.log("🤖 Attempting Gemini OCR (Primary)...");
        const geminiResult = await this.performGeminiOCR(imageUri);

        if (geminiResult.success && geminiResult.text) {
          console.log("✅ Gemini OCR Success:", geminiResult.text);
          return { ...geminiResult, provider: "Gemini AI" };
        }

        console.log("⚠️ Gemini failed, falling back to OCR.space...");
      }

      // Fallback to OCR.space
      console.log("📦 Using OCR.space (Fallback)...");
      const ocrSpaceResult = await this.performOCRSpace(imageUri);
      return { ...ocrSpaceResult, provider: "OCR.space" };
    } catch (error: any) {
      console.error("❌ OCR Error:", error);
      return {
        success: false,
        text: "",
        error: error.message,
        provider: "None",
      };
    }
  }

  private async performGeminiOCR(imageUri: string): Promise<OCRResponse> {
    try {
      console.log("📸 Preparing image for Gemini...");

      // Optimize image for Gemini (supports up to 4MB)
      const enhancedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { resize: { width: 1600 } }, // Higher resolution for better accuracy
        ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        },
      );

      const base64Image = await FileSystem.readAsStringAsync(
        enhancedImage.uri,
        { encoding: "base64" },
      );

      console.log("📤 Sending to Google Gemini AI...");

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: `You are an expert OCR system specialized in reading vehicle license plates. 
                
Analyze this image and extract ONLY the license plate number. 

Rules:
1. Extract only alphanumeric characters from the license plate
2. Common Sri Lankan formats: WP ABC-1234, ABC-1234, WP-1234
3. Return ONLY the plate number, nothing else
4. Use spaces or hyphens as they appear on the plate
5. If multiple plates visible, return the clearest one
6. Return "NONE" if no license plate is clearly visible

Respond with just the plate number or "NONE".`,
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 0.8,
          maxOutputTokens: 100,
        },
      };

      const response = await fetch(
        `${this.GEMINI_URL}?key=${this.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Gemini API Error:", errorText);
        return {
          success: false,
          text: "",
          error: `Gemini API error: ${response.status}`,
        };
      }

      const result = await response.json();

      const extractedText =
        result.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (!extractedText || extractedText.trim() === "NONE") {
        return {
          success: false,
          text: "",
          error: "No license plate detected by Gemini",
        };
      }

      // Clean the text
      const cleanedText = extractedText
        .trim()
        .replace(/[`'"*_]/g, "") // Remove markdown formatting
        .replace(/\r\n/g, " ")
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ")
        .toUpperCase();

      console.log("✅ Gemini extracted:", cleanedText);

      return {
        success: true,
        text: cleanedText,
        confidence: 0.95, // Gemini typically has high confidence
      };
    } catch (error: any) {
      console.error("❌ Gemini OCR Error:", error);
      return {
        success: false,
        text: "",
        error: error.message || "Gemini OCR failed",
      };
    }
  }

  private async performOCRSpace(imageUri: string): Promise<OCRResponse> {
    try {
      console.log("🔍 OCR.space: Processing image...");

      // Enhanced image preprocessing for better OCR accuracy
      console.log("📸 Optimizing image (high quality for license plates)...");
      const enhancedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { resize: { width: 1200 } }, // Balanced resolution for accuracy and size
        ],
        {
          compress: 0.7, // Better compression to stay under 1MB limit
          format: ImageManipulator.SaveFormat.JPEG,
        },
      );

      const base64Image = await FileSystem.readAsStringAsync(
        enhancedImage.uri,
        { encoding: "base64" },
      );

      // Check file size (base64 size in KB)
      const fileSizeKB = (base64Image.length * 3) / 4 / 1024;
      console.log(`📦 Image size: ${fileSizeKB.toFixed(2)} KB`);

      if (fileSizeKB > 1024) {
        console.log("⚠️ Image too large, compressing further...");
        // Further compress if still too large
        const smallerImage = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 800 } }],
          {
            compress: 0.5,
            format: ImageManipulator.SaveFormat.JPEG,
          },
        );
        const smallerBase64 = await FileSystem.readAsStringAsync(
          smallerImage.uri,
          { encoding: "base64" },
        );
        const newSizeKB = (smallerBase64.length * 3) / 4 / 1024;
        console.log(`📦 Compressed size: ${newSizeKB.toFixed(2)} KB`);

        if (newSizeKB > 1024) {
          throw new Error(
            "Image too large even after compression. Please use a smaller image.",
          );
        }

        return await this.performOCRSpaceRequest(smallerBase64);
      }

      return await this.performOCRSpaceRequest(base64Image);
    } catch (error: any) {
      console.error("❌ OCR.space Error:", error);
      return { success: false, text: "", error: error.message };
    }
  }

  private async performOCRSpaceRequest(
    base64Image: string,
  ): Promise<OCRResponse> {
    try {
      console.log("📤 Sending to OCR.space (Engine 2 - License Plate Mode)...");

      const formData = new FormData();
      formData.append("base64Image", `data:image/jpeg;base64,${base64Image}`);
      formData.append("apikey", this.OCR_SPACE_API_KEY);
      formData.append("language", "eng");
      formData.append("isOverlayRequired", "false");
      formData.append("detectOrientation", "true");
      formData.append("scale", "true"); // Auto-scale for better recognition
      formData.append("OCREngine", "2"); // Engine 2 is optimized for license plates
      formData.append("isTable", "false");

      const response = await fetch(this.OCR_SPACE_URL, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.IsErroredOnProcessing) {
        return {
          success: false,
          text: "",
          error: result.ErrorMessage?.[0] || "OCR failed",
        };
      }

      const parsedText = result.ParsedResults?.[0]?.ParsedText || "";
      if (!parsedText) {
        return { success: false, text: "", error: "No text detected" };
      }

      // Advanced text cleaning for license plates
      const cleanedText = parsedText
        .trim()
        .replace(/\r\n/g, " ")
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ")
        .replace(/[|\\\/]/g, "") // Remove common OCR artifacts
        .toUpperCase();

      console.log("✅ OCR.space Success:", cleanedText);

      return { success: true, text: cleanedText, confidence: 0.85 };
    } catch (error: any) {
      console.error("❌ OCR.space Error:", error);
      return { success: false, text: "", error: error.message };
    }
  }

  private isValidSriLankanProvince(code: string): boolean {
    const validProvinces = [
      "WP",
      "UP",
      "SP",
      "NP",
      "EP",
      "NW",
      "NC",
      "SG",
      "CP",
    ];
    return validProvinces.includes(code.toUpperCase());
  }

  extractNumberPlate(text: string): string {
    // Clean the text - remove extra spaces and normalize
    const cleaned = text.trim().toUpperCase().replace(/\s+/g, " ");

    console.log("🔍 Searching for Sri Lankan plate pattern in:", cleaned);

    // Sri Lankan number plate patterns with strict validation
    // Format: Province Code (2 letters) + 3 letters + hyphen + 4 digits
    // Example: WP BBH-2028, UP CAR-1234
    const strictPattern = /\b([A-Z]{2})[-\s]*([A-Z]{3})[-\s]*(\d{4})\b/i;
    const match = cleaned.match(strictPattern);

    if (match) {
      const provinceCode = match[1];
      const letters = match[2];
      const numbers = match[3];

      // Validate province code
      if (this.isValidSriLankanProvince(provinceCode)) {
        const plate = `${provinceCode} ${letters}-${numbers}`;
        console.log("✅ Found valid Sri Lankan plate pattern:", plate);
        return plate;
      } else {
        console.log("⚠️ Invalid province code:", provinceCode);
      }
    }

    // Try alternative formats without province code (older format)
    const alternativePattern = /\b([A-Z]{3})[-\s]*(\d{4})\b/i;
    const altMatch = cleaned.match(alternativePattern);

    if (altMatch) {
      const letters = altMatch[1];
      const numbers = altMatch[2];
      const plate = `${letters}-${numbers}`;
      console.log("✅ Found alternative plate format:", plate);
      return plate;
    }

    console.log("⚠️ No valid Sri Lankan number plate pattern found");
    return "";
  }

  async scanNumberPlate(imageUri: string): Promise<OCRResponse> {
    const result = await this.extractTextFromImage(imageUri);
    if (!result.success || !result.text) return result;

    const numberPlate = this.extractNumberPlate(result.text);
    console.log("🚗 Final Plate:", numberPlate);
    console.log("📊 Provider:", result.provider);

    return {
      success: true,
      text: numberPlate,
      confidence: result.confidence,
      provider: result.provider,
    };
  }
}

export default new OCRService();
