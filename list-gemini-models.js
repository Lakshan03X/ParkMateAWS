// List all available Gemini models for your API key
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function listAvailableModels() {
  console.log("\n🔍 Listing Available Gemini Models...\n");

  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    console.log("❌ No API key found!");
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    // Try to list models (this might not work with all SDK versions)
    console.log("📡 Fetching available models from Google...\n");

    // Test common model names that should work
    const modelsToTest = [
      "gemini-pro",
      "gemini-pro-vision",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
      "gemini-1.5-flash-latest",
      "models/gemini-pro",
      "models/gemini-pro-vision",
      "models/gemini-1.5-pro",
      "models/gemini-1.5-flash",
    ];

    console.log("Testing which models work with your API key...\n");

    for (const modelName of modelsToTest) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Test");
        console.log(`✅ ${modelName} - WORKS!`);
      } catch (error) {
        if (error.message.includes("404")) {
          console.log(`❌ ${modelName} - Not available`);
        } else if (error.message.includes("400")) {
          console.log(`⚠️  ${modelName} - Exists but needs image input`);
        } else {
          console.log(
            `⚠️  ${modelName} - ${error.message.substring(0, 50)}...`
          );
        }
      }
    }

    console.log("\n");
  } catch (error) {
    console.log("❌ Error:", error.message, "\n");
  }
}

listAvailableModels();
