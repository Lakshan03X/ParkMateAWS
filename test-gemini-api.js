// Test script to verify Gemini API key works
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function testGeminiAPI() {
  console.log("\n🔍 Testing Gemini API Key...\n");

  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    console.log("❌ No API key found in .env file!");
    console.log("Add: EXPO_PUBLIC_GEMINI_API_KEY=your_key\n");
    return;
  }

  console.log("🔑 API Key found:", apiKey.substring(0, 20) + "...\n");

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    // Test with gemini-pro (text-only model that should work)
    console.log("📡 Testing connection with gemini-pro model...");
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const result = await model.generateContent("Say 'Hello, API is working!'");
    const response = await result.response;
    const text = response.text();

    console.log("✅ SUCCESS! API key is valid!");
    console.log("📝 Response:", text);
    console.log("\n✨ Your API key works perfectly!\n");
  } catch (error) {
    console.log("❌ ERROR! API key test failed:\n");
    console.log(error.message);
    console.log("\n📋 Common reasons:");
    console.log("  1. Invalid or expired API key");
    console.log("  2. API key doesn't have permission for Generative AI");
    console.log("  3. API quota exceeded");
    console.log("  4. Network/connectivity issue");
    console.log("\n🔧 How to fix:");
    console.log("  1. Go to: https://aistudio.google.com/app/apikey");
    console.log("  2. Create a NEW API key");
    console.log("  3. Update .env file with new key");
    console.log("  4. Run this test again\n");
  }
}

testGeminiAPI();
