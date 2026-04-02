import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const response = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 20,
  messages: [{ role: 'user', content: '안녕' }]
});

console.log('✅ API 정상:', response.content[0].text);
