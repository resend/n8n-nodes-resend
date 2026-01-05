<h1 align="center">
  <br>
  <a href="/"><img src=".github/media/readme_header_new.png" alt="n8n-nodes-resend-revived" width="900"></a>
  <br>
</h1>

<p align="center">
  <a href="https://badge.fury.io/js/n8n-nodes-resend-revived"><img src="https://badge.fury.io/js/n8n-nodes-resend-revived.svg" alt="npm version"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> |
  <a href="#credentials">Credentials</a> |
  <a href="#resources">Resources</a> |
  <a href="#trigger-events">Trigger Events</a> |
  <a href="#development">Development</a>
</p>

---

A community node for [n8n](https://n8n.io) that integrates with the [Resend](https://resend.com) email API. Send emails, manage contacts, handle domains, and receive webhooks.

> Forked from [SilkePilon/n8n-nodes-resend](https://github.com/SilkePilon/n8n-nodes-resend) as the original project appears abandoned.

## Installation

### Community Nodes (Recommended)

1. Go to **Settings** > **Community Nodes**
2. Click **Install a community node**
3. Enter `n8n-nodes-resend-revived`
4. Restart n8n

### Manual Installation

```bash
cd ~/.n8n
npm install n8n-nodes-resend-revived
```

### Docker

```bash
docker run -it --rm \
  -p 5678:5678 \
  -e N8N_NODES_INCLUDE=n8n-nodes-resend-revived \
  n8nio/n8n
```

## Credentials

1. Get your API key from [Resend Dashboard](https://resend.com/api-keys)
2. In n8n, go to **Credentials** > **Add credential**
3. Search for **Resend API** and paste your key

## Resources

### Email

| Operation | Description |
|-----------|-------------|
| Send | Send a single email with optional attachments |
| Send Batch | Send up to 100 emails in one request |
| List | List sent emails |
| Get | Retrieve email details and status |
| Cancel | Cancel a scheduled email |
| Update | Modify a scheduled email |

### Contact

| Operation | Description |
|-----------|-------------|
| Create | Add a new contact |
| Get | Retrieve contact details |
| Update | Modify contact information |
| Delete | Remove a contact |
| List | List all contacts in an audience |

### Audience

| Operation | Description |
|-----------|-------------|
| Create | Create a new audience |
| Get | Retrieve audience details |
| Delete | Remove an audience |
| List | List all audiences |

### Segment

| Operation | Description |
|-----------|-------------|
| Create | Create a new segment |
| Get | Retrieve segment details |
| Delete | Remove a segment |
| List | List all segments |

### Topic

| Operation | Description |
|-----------|-------------|
| Create | Create a subscription topic |
| Get | Retrieve topic details |
| Update | Modify topic settings |
| Delete | Remove a topic |
| List | List all topics |

### Broadcast

| Operation | Description |
|-----------|-------------|
| Create | Create an email campaign |
| Get | Retrieve broadcast details |
| Send | Send a broadcast to a segment |
| Update | Modify broadcast settings |
| Delete | Remove a broadcast |
| List | List all broadcasts |

### Template

| Operation | Description |
|-----------|-------------|
| Create | Create an email template |
| Get | Retrieve template details |
| Update | Modify a template |
| Delete | Remove a template |
| List | List all templates |

### Domain

| Operation | Description |
|-----------|-------------|
| Create | Add a sending domain |
| Get | Retrieve domain details |
| Verify | Trigger domain verification |
| Update | Modify domain settings |
| Delete | Remove a domain |
| List | List all domains |

### API Key

| Operation | Description |
|-----------|-------------|
| Create | Generate a new API key |
| Delete | Revoke an API key |
| List | List all API keys |

### Webhook

| Operation | Description |
|-----------|-------------|
| Create | Create a webhook endpoint |
| Get | Retrieve webhook details |
| Update | Modify webhook settings |
| Delete | Remove a webhook |
| List | List all webhooks |

## Trigger Events

The **Resend Trigger** node receives webhooks for real-time email events. Signatures are automatically verified using Svix.

| Event | Description |
|-------|-------------|
| `email.sent` | Email sent to recipient |
| `email.delivered` | Email delivered successfully |
| `email.opened` | Recipient opened the email |
| `email.clicked` | Link clicked in email |
| `email.bounced` | Email bounced |
| `email.complained` | Spam complaint received |
| `contact.created` | New contact added |
| `contact.updated` | Contact modified |
| `contact.deleted` | Contact removed |

## Limitations

- Maximum email size: 40MB (including attachments)
- Attachments not supported with scheduled emails
- Batch emails require base64 attachments (no URL attachments)

## Development

```bash
git clone https://github.com/jannispkz/n8n-nodes-resend.git
cd n8n-nodes-resend
npm install
npm run build
npm run lint
```

## License

[MIT](LICENSE.md)

---

<p align="center">
  <a href="https://github.com/jannispkz/n8n-nodes-resend">GitHub</a> |
  <a href="https://github.com/jannispkz/n8n-nodes-resend/issues">Issues</a> |
  <a href="https://resend.com/docs">Resend Docs</a>
</p>
