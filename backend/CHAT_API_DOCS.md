# ScholarStream AI Chat API

## Overview
Real-time conversational AI assistant powered by Google Gemini that helps students find scholarships, hackathons, bounties, and competitions.

## Endpoints

### POST `/api/chat`
Send a message to the AI assistant and receive personalized opportunity recommendations.

**Request Body:**
```json
{
  "user_id": "string (required)",
  "message": "string (required)",
  "context": {
    "current_page": "/dashboard",
    "custom_data": {}
  }
}
```

**Response:**
```json
{
  "message": "AI response text",
  "opportunities": [
    {
      "id": "opp_123",
      "name": "Tech Scholarship 2025",
      "organization": "Tech Foundation",
      "amount": 5000,
      "amount_display": "$5,000",
      "deadline": "2025-03-15T00:00:00Z",
      "type": "scholarship",
      "urgency": "this_month",
      "match_score": 85,
      "url": "https://example.com/apply",
      "tags": ["technology", "undergraduate"],
      "description": "For CS students..."
    }
  ],
  "actions": [
    {
      "type": "save",
      "opportunity_id": "opp_123",
      "label": "Save Tech Scholarship 2025"
    }
  ]
}
```

### GET `/api/chat/history/{user_id}`
Retrieve conversation history for a user.

**Query Parameters:**
- `limit`: Number of messages to retrieve (default: 50)

**Response:**
```json
{
  "history": [
    {
      "role": "user",
      "content": "Find urgent hackathons",
      "timestamp": "2025-12-01T20:30:00Z"
    },
    {
      "role": "assistant", 
      "content": "I found 3 urgent hackathons...",
      "timestamp": "2025-12-01T20:30:05Z"
    }
  ]
}
```

### DELETE `/api/chat/history/{user_id}`
Clear conversation history for a user.

**Response:**
```json
{
  "success": true,
  "message": "Chat history cleared"
}
```

## Search Intent Detection

The AI automatically detects when users want to search for opportunities based on keywords:
- `find`, `search`, `show me`, `need money`
- `urgent`, `today`, `tomorrow`, `this week`
- `hackathon`, `scholarship`, `bounty`, `competition`
- `looking for`, `help me find`

## Urgency Classification

- **immediate**: Opportunities closing within 2 days or rolling deadlines
- **this_week**: Closing within 7 days
- **this_month**: Closing within 30 days
- **future**: All other deadlines

## Type Inference

The AI infers opportunity types from tags and descriptions:
- **hackathon**: Contains "hackathon", "hack"
- **bounty**: Contains "bounty", "bug"
- **competition**: Contains "competition", "contest"
- **scholarship**: Default for traditional funding

## Example Queries

1. **Urgent Need:**
   - "My school fee deadline is tomorrow, I need money NOW"
   - "Find opportunities I can complete today"

2. **Specific Type:**
   - "Show me hackathons for web developers"
   - "Scholarships for computer science majors"

3. **Time-based:**
   - "What's closing this week?"
   - "Competitions I can enter this month"

4. **General Help:**
   - "Help me find opportunities"
   - "What can you do?"

## Error Handling

The chat service includes graceful fallbacks:
- If search fails, returns empty opportunities array
- If AI generation fails, returns helpful error message
- Chat history failures don't block conversation
- All errors are logged for debugging

## Rate Limits

Gemini API limits:
- **Free tier**: ~15 requests per minute, ~1500 requests per day
- Service includes conservative rate limiting to stay within quotas
- Fallback to pattern matching when rate limited

## Database Operations

### Chat History Storage
Messages stored in Firestore:
```
/chat_history/{user_id}/messages/{message_id}
  - role: "user" | "assistant"
  - content: string
  - timestamp: Firestore timestamp
```

### Opportunities Cache
Opportunities cached in:
```
/scholarships/{scholarship_id}
  - All Scholarship model fields
  - Updated during discovery jobs
```

### User Matches
User-specific matches in:
```
/user_matches/{user_id}
  - scholarship_ids: array of strings
  - updated_at: timestamp
```

## Integration with Frontend

Frontend should use `VITE_API_BASE_URL` environment variable:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
                     'https://scholarstream-backend.onrender.com';

const response = await fetch(`${API_BASE_URL}/api/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: user.uid,
    message: messageText,
    context: { current_page: window.location.pathname }
  })
});
```

## Security

- User authentication validated via user_id
- Chat history isolated per user
- No sensitive data in AI prompts
- All database operations use proper error handling
- Firebase security rules enforce user isolation

## Performance

- Average response time: 1-3 seconds
- Opportunity search: <500ms (cached)
- Conversation history: <200ms
- Supports concurrent users via async/await
- Automatic retry with exponential backoff

## Monitoring

Key metrics tracked:
- Request success/failure rates
- Response generation times
- Opportunities found per query
- Search intent detection accuracy
- Rate limit incidents

All metrics logged via structlog for analysis.
