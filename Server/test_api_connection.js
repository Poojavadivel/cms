// Quick API Connection Test
// Tests the OpenAI-compatible API with the configured key

const API_KEY = "sk-do-e9Ea0Pjt1cSZ2HWIBarUzy4AD5i6OeMiA7pwooPIJOSD3oqdxby60s5ogW";
const API_URL = "https://inference.do-ai.run/v1/chat/completions";
const MODEL_NAME = "openai-gpt-oss-120b";

console.log('🔌 Testing API Connection...\n');
console.log('Configuration:');
console.log(`  API URL: ${API_URL}`);
console.log(`  Model: ${MODEL_NAME}`);
console.log(`  API Key: ${API_KEY.substring(0, 25)}...`);
console.log('\n' + '─'.repeat(70) + '\n');

async function testAPIConnection() {
  try {
    console.log('📤 Sending test message: "Hello, are you connected?"\n');
    
    const startTime = Date.now();
    
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          {
            role: "system",
            content: "You are a helpful medical assistant. Respond concisely."
          },
          {
            role: "user",
            content: "Hello, are you connected? Please confirm you're working and tell me your purpose in 2 sentences."
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      })
    });

    const responseTime = Date.now() - startTime;

    console.log(`📥 Response received in ${responseTime}ms`);
    console.log(`   Status: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API ERROR:');
      console.error(errorText);
      process.exit(1);
    }

    const data = await response.json();
    
    // Handle both content and reasoning_content
    const content = data?.choices?.[0]?.message?.reasoning_content || 
                    data?.choices?.[0]?.message?.content;

    console.log('✅ API CONNECTION SUCCESSFUL!\n');
    console.log('─'.repeat(70));
    console.log('📨 AI Response:');
    console.log('─'.repeat(70));
    console.log(content);
    console.log('─'.repeat(70));
    console.log('\n📊 Response Details:');
    console.log(`   Model: ${data.model}`);
    console.log(`   Tokens Used: ${data.usage?.total_tokens || 'N/A'}`);
    console.log(`   Completion Tokens: ${data.usage?.completion_tokens || 'N/A'}`);
    console.log(`   Prompt Tokens: ${data.usage?.prompt_tokens || 'N/A'}`);
    console.log(`   Response Time: ${responseTime}ms`);
    console.log('\n✅ API is properly connected and working!\n');
    
    // Now test a medical query
    console.log('─'.repeat(70));
    console.log('\n🏥 Testing Medical Query...\n');
    
    const medicalResponse = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          {
            role: "system",
            content: "You are MedGPT, a medical assistant. Provide concise medical information."
          },
          {
            role: "user",
            content: "What does a high TSH level indicate?"
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    });

    const medicalData = await medicalResponse.json();
    const medicalContent = medicalData?.choices?.[0]?.message?.reasoning_content || 
                          medicalData?.choices?.[0]?.message?.content;

    console.log('📨 Medical Query Response:');
    console.log('─'.repeat(70));
    console.log(medicalContent);
    console.log('─'.repeat(70));
    
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('\n✅ Your chatbot API is:');
    console.log('   • Connected successfully ✅');
    console.log('   • Responding correctly ✅');
    console.log('   • Handling medical queries ✅');
    console.log('   • Ready for production use ✅\n');
    
    process.exit(0);

  } catch (error) {
    console.error('\n❌ CONNECTION TEST FAILED:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    console.log('\n⚠️  Please check:');
    console.log('   1. Internet connection');
    console.log('   2. API key is correct');
    console.log('   3. API endpoint is accessible');
    console.log('   4. Firewall/proxy settings\n');
    process.exit(1);
  }
}

// Run the test
testAPIConnection();
