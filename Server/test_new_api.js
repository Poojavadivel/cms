// Test script for new OpenAI-compatible API
require('dotenv').config();

const API_KEY = process.env.OPENAI_API_KEY || "sk-do-e9Ea0Pjt1cSZ2HWIBarUzy4AD5i6OeMiA7pwooPIJOSD3oqdxby60s5ogW";
const API_URL = process.env.OPENAI_API_URL || "https://inference.do-ai.run/v1/chat/completions";
const MODEL_NAME = process.env.AI_MODEL || "openai-gpt-oss-120b";

async function testAPI() {
  console.log('🧪 Testing OpenAI-compatible API...\n');
  console.log('Configuration:');
  console.log(`  URL: ${API_URL}`);
  console.log(`  Model: ${MODEL_NAME}`);
  console.log(`  API Key: ${API_KEY.substring(0, 20)}...`);
  console.log('');

  try {
    const requestBody = {
      model: MODEL_NAME,
      messages: [
        {
          role: "system",
          content: "You are a helpful medical assistant."
        },
        {
          role: "user",
          content: "What is hemoglobin and what is the normal range?"
        }
      ],
      max_tokens: 150,
      temperature: 0.7
    };

    console.log('📤 Sending request...\n');
    
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`📥 Response Status: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error Response:', errorText);
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ API Response:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');

    const content = data?.choices?.[0]?.message?.content;
    
    if (content) {
      console.log('✅ SUCCESS! Content extracted:');
      console.log('─'.repeat(60));
      console.log(content);
      console.log('─'.repeat(60));
      console.log('\n✅ API integration is working correctly!');
      process.exit(0);
    } else {
      console.error('❌ FAILED: No content in response');
      console.log('Response structure:', JSON.stringify(data, null, 2));
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run test
testAPI();
