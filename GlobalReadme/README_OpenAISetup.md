# OpenAI API Setup for AI Query Feature

## Overview

The app now includes an AI query feature that allows users to ask natural language questions about their items. This feature uses OpenAI's GPT-3.5-turbo model to provide intelligent responses based on the user's inventory data.

## Setup Instructions

### 1. Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to "API Keys" in your dashboard
4. Create a new API key
5. Copy the API key (it starts with `sk-`)

### 2. Configure Environment Variables

Add your OpenAI API key to your environment configuration:

#### For Development (`app/config/config.dev.ts`):
```typescript
const DevConfig: ConfigBaseProps = {
  // ... other config
  OPENAI_API_KEY: "your-openai-api-key-here",
}
```

#### For Production (`app/config/config.prod.ts`):
```typescript
const ProdConfig: ConfigBaseProps = {
  // ... other config
  OPENAI_API_KEY: "your-openai-api-key-here",
}
```

### 3. Security Considerations

- **Never commit API keys to version control**
- Use environment variables or secure configuration management
- Consider implementing API key rotation
- Monitor API usage to control costs

## How It Works

### User Interface
- Users can toggle between "Search" and "Ask AI" modes using a switch
- In AI mode, the search bar placeholder changes to "Ask about your items..."
- Users can ask natural language questions like:
  - "Which products does Dimi like?"
  - "What food items do we have?"
  - "Where can I find household items?"

### Technical Implementation
1. **Data Collection**: The app fetches all items from groups the user is a member of
2. **Context Preparation**: Item data is formatted for the AI model
3. **AI Query**: The question and item context are sent to OpenAI's API
4. **Response Display**: The AI response is displayed in a styled container
5. **Related Items**: Items used for context are shown below the response

### API Usage
- Model: `gpt-3.5-turbo`
- Max tokens: 500
- Temperature: 0.7 (balanced creativity and accuracy)
- System prompt: Instructions for the AI about the household inventory context

## Cost Considerations

- GPT-3.5-turbo costs approximately $0.002 per 1K tokens
- Typical queries use 200-400 tokens
- Monitor usage in your OpenAI dashboard
- Consider implementing rate limiting for production use

## Troubleshooting

### Common Issues
1. **"OpenAI API key not configured"**: Check that the API key is properly set in your config
2. **"Failed to get AI response"**: Verify your API key is valid and has sufficient credits
3. **Rate limiting**: Implement delays between requests if needed

### Error Handling
The app includes comprehensive error handling for:
- Authentication failures
- API rate limits
- Network issues
- Invalid responses

## Future Enhancements

Potential improvements to consider:
- Caching AI responses for similar queries
- Implementing conversation history
- Adding support for image analysis
- Custom fine-tuning for household inventory context
- Integration with item recommendations 