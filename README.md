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

### Potential Pricing Strategy v1

| Plan        | Price / month | Hidden model     | Reply cap   | Cost per reply | Max cost / user | Gross margin | Hook lever                                  |
|-------------|----------------|------------------|-------------|----------------|------------------|---------------|----------------------------------------------|
| Free        | $0             | GPT-4.1 Nano      | 200         | $0.000235       | $0.047           | N/A           | Classic freemium                              |
| Starter     | $3             | GPT-4.1 Mini      | 600         | $0.00094        | $0.564           | 81%           | “Trip-wire” price; gets the credit-card       |
| Pro         | $8             | GPT-4.1 Mini      | 1,000       | $0.00094        | $0.94            | 88%           | Decoy-plus charm pricing ($7.99)              |
| 4o Add-on   | $0.04 / reply  | GPT-4o            | pay-as-you-go | $0.0115         | metered          | ~71% markup   | Only when users need image/voice replies      |

### Potential Pricing Strategy v2

| Plan        | Price / month | Hidden model | Reply cap | Cost per reply* | Max cost / user | Gross margin† | Hook lever                                 |
|-------------|---------------|--------------|-----------|-----------------|-----------------|---------------|---------------------------------------------|
| Free        | $0            | GPT-4.1 Nano | 200       | $0.000235       | $0.047          | N/A           | Classic freemium – build habit              |
| Starter     | $5            | GPT-4.1 Mini | 600       | $0.00094        | $0.564          | 89 %          | Low “trip-wire” price to capture card       |
| Pro         | $12           | GPT-4.1 Mini | 1 200     | $0.00094        | $1.128          | 90 %          | Serious, trust-building monthly fee         |
| Team        | $25 / seat    | GPT-4.1 Mini | 3 000     | $0.00094        | $2.82           | 89 %          | Slack-style per-seat; SSO & admin controls  |
| 4o Add-on   | $0.04 / reply | GPT-4o       | metered   | $0.0115         | usage-based     | ~71 % markup  | Only when users need voice / image replies  |


### Potential Pricing Strategy v3

| Plan        | Price / month | Hidden model | Chat limit | Reply cap | Cost / reply* | Max cost / user | Gross margin† | Hook lever                                   |
|-------------|---------------|--------------|------------|-----------|---------------|-----------------|---------------|----------------------------------------------|
| Free        | $0            | GPT-4.1 Nano | 3 chats    | 200       | $0.000235     | $0.047          | N/A           | Classic freemium – try the magic             |
| Starter     | $5            | GPT-4.1 Mini | 25 chats   | 600       | $0.00094      | $0.564          | 89 %          | Low “trip-wire”; plenty of chats now         |
| Pro         | $12           | GPT-4.1 Mini | Unlimited  | 1 200     | $0.00094      | $1.128          | 90 %          | Trust-building monthly fee + memory          |
| Team        | $25 / seat    | GPT-4.1 Mini | Unlimited + shared inbox | 3 000 | $0.00094 | $2.82           | 89 %          | Slack-style per-seat, SSO & admin controls   |
| 4-o Add-on  | $0.04 / reply | GPT-4o       | Uses tier’s chat allowance | metered | $0.0115      | usage-based     | ~71 % markup; only for voice / image replies |
