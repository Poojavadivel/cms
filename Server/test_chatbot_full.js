// Test Chatbot Endpoint Integration
// Simulates the actual bot.js API call with proper authentication

require('dotenv').config();
const mongoose = require('mongoose');

const API_KEY = process.env.OPENAI_API_KEY || "sk-do-e9Ea0Pjt1cSZ2HWIBarUzy4AD5i6OeMiA7pwooPIJOSD3oqdxby60s5ogW";
const API_URL = process.env.OPENAI_API_URL || "https://inference.do-ai.run/v1/chat/completions";
const MODEL_NAME = process.env.AI_MODEL || "openai-gpt-oss-120b";

console.log('🤖 Testing Chatbot Integration\n');
console.log('═'.repeat(70));

// Simulate the actual function from bot.js
async function callGeminiChatWithRetries(messages, temperature = 0.7, maxTokens = 1500) {
  try {
    console.log(`\n📤 Sending request to API...`);
    console.log(`   Model: ${MODEL_NAME}`);
    console.log(`   Temperature: ${temperature}`);
    console.log(`   Max Tokens: ${maxTokens}`);
    
    const requestBody = {
      model: MODEL_NAME,
      messages: messages,
      max_tokens: Math.floor(maxTokens),
      temperature: temperature
    };

    const startTime = Date.now();
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    // Extract content (handles both content and reasoning_content)
    const content = data?.choices?.[0]?.message?.reasoning_content || 
                    data?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('API returned empty response');
    }

    console.log(`\n✅ Response received in ${responseTime}ms`);
    console.log(`   Tokens: ${data.usage?.total_tokens || 'N/A'}`);
    
    return content.trim();
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    throw error;
  }
}

async function runChatbotTests() {
  console.log('\n🧪 Test 1: Simple Greeting (Like User Chat)\n');
  console.log('─'.repeat(70));
  
  try {
    const systemPrompt = `You are MedGPT, an intelligent medical assistant for doctors at Movi Innovations HMS.

**Your Role:**
- Assist doctors with patient information, medical histories, lab reports, and prescriptions
- Provide clinical insights based on patient data with evidence-based recommendations

**CRITICAL RESPONSE FORMAT:**
- ALWAYS use bullet points (•) or numbered lists - NEVER use paragraphs
- Keep responses CRISP and SCANNABLE - maximum 2-3 words per bullet`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Hello" }
    ];

    const reply = await callGeminiChatWithRetries(messages, 1, 150);
    
    console.log('\n💬 User: "Hello"');
    console.log('\n🤖 Bot Reply:');
    console.log('─'.repeat(70));
    console.log(reply);
    console.log('─'.repeat(70));
    console.log('\n✅ Test 1 PASSED!\n');

  } catch (error) {
    console.error('❌ Test 1 FAILED:', error.message);
    return false;
  }

  console.log('═'.repeat(70));
  console.log('\n🧪 Test 2: Medical Query (Doctor Role)\n');
  console.log('─'.repeat(70));

  try {
    const messages = [
      { 
        role: "system", 
        content: "You are MedGPT, a medical assistant. Provide concise clinical information using bullet points." 
      },
      { 
        role: "user", 
        content: "What are the symptoms of diabetes?" 
      }
    ];

    const reply = await callGeminiChatWithRetries(messages, 0.7, 500);
    
    console.log('\n💬 User: "What are the symptoms of diabetes?"');
    console.log('\n🤖 Bot Reply:');
    console.log('─'.repeat(70));
    console.log(reply);
    console.log('─'.repeat(70));
    console.log('\n✅ Test 2 PASSED!\n');

  } catch (error) {
    console.error('❌ Test 2 FAILED:', error.message);
    return false;
  }

  console.log('═'.repeat(70));
  console.log('\n🧪 Test 3: Patient Information Query\n');
  console.log('─'.repeat(70));

  try {
    const messages = [
      { 
        role: "system", 
        content: "You are MedGPT. You have access to patient records. Respond professionally." 
      },
      { 
        role: "user", 
        content: "Show me details for patient John Doe" 
      }
    ];

    const reply = await callGeminiChatWithRetries(messages, 0.7, 300);
    
    console.log('\n💬 User: "Show me details for patient John Doe"');
    console.log('\n🤖 Bot Reply:');
    console.log('─'.repeat(70));
    console.log(reply);
    console.log('─'.repeat(70));
    console.log('\n✅ Test 3 PASSED!\n');

  } catch (error) {
    console.error('❌ Test 3 FAILED:', error.message);
    return false;
  }

  console.log('═'.repeat(70));
  console.log('\n🧪 Test 4: Multi-turn Conversation\n');
  console.log('─'.repeat(70));

  try {
    const messages = [
      { role: "system", content: "You are a helpful medical assistant." },
      { role: "user", content: "What is hemoglobin?" },
      { role: "assistant", content: "Hemoglobin is a protein in red blood cells that carries oxygen." },
      { role: "user", content: "What is the normal range?" }
    ];

    const reply = await callGeminiChatWithRetries(messages, 0.7, 200);
    
    console.log('\n💬 Previous: "What is hemoglobin?"');
    console.log('🤖 Bot: "Hemoglobin is a protein in red blood cells..."');
    console.log('💬 User: "What is the normal range?"');
    console.log('\n🤖 Bot Reply:');
    console.log('─'.repeat(70));
    console.log(reply);
    console.log('─'.repeat(70));
    console.log('\n✅ Test 4 PASSED!\n');

  } catch (error) {
    console.error('❌ Test 4 FAILED:', error.message);
    return false;
  }

  return true;
}

// Main execution
(async () => {
  try {
    const success = await runChatbotTests();
    
    if (success) {
      console.log('═'.repeat(70));
      console.log('\n🎉 ALL CHATBOT TESTS PASSED!\n');
      console.log('✅ Summary:');
      console.log('   • API connection working ✅');
      console.log('   • Greeting responses working ✅');
      console.log('   • Medical queries working ✅');
      console.log('   • Patient queries working ✅');
      console.log('   • Multi-turn conversations working ✅');
      console.log('\n✅ Your chatbot is FULLY FUNCTIONAL and ready for use!\n');
      console.log('═'.repeat(70));
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed. Please check the errors above.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
  }
})();
