# Teletasker

Your AI assistant that reads your Telegram chats, replies to messages, and turns conversations into tasks.

## Features

- AI-powered message replies based on your chat history
- Automatic task extraction from conversations
- Sync tasks with Notion, Linear, or your preferred tool
- Seamless Telegram integration
- Secure and privacy-focused

## Getting Started

### Prerequisites

1. Get Telegram API credentials:
   - Visit https://my.telegram.org/auth
   - Log in and go to 'API development tools'
   - Create a new application
   - Save your `api_id` and `api_hash`

2. Set up environment variables:
```bash
cp .env.example .env
```
Add your credentials to `.env`:
