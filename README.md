<h1 align="center">
  <br>
  <a href="/"><img src=".github/media/resend-header.png" alt="n8n-nodes-resend" width="900"></a>
  <br>
</h1>

<p align="center">
	<img alt="NPM Version" src="https://img.shields.io/npm/v/n8n-nodes-resend">
	<img alt="GitHub License" src="https://img.shields.io/github/license/resend/n8n-nodes-resend">
	<img alt="NPM Downloads" src="https://img.shields.io/npm/dm/n8n-nodes-resend">
	<img alt="NPM Last Update" src="https://img.shields.io/npm/last-update/n8n-nodes-resend">
	<img alt="Static Badge" src="https://img.shields.io/badge/n8n-2.6.4-EA4B71?logo=n8n">
</p>

<p align="center">
  <a href="#installation">Installation</a> |
  <a href="#credentials">Credentials</a> |
  <a href="#human-in-the-loop">Human in the Loop</a> |
  <a href="#trigger-events">Trigger Events</a> |
  <a href="#limitations">Limitations</a> |
  <a href="#development">Development</a>
</p>

---

The official node for [n8n](https://n8n.io) that integrates with the [Resend](https://resend.com) API. Send emails, manage contacts, handle domains, and receive webhooks.

## API Coverage

> [!WARNING]
> Audiences are deprecated in favor of Segments and won't be supported in this node. Please use Segments for contact grouping and targeting.

The table below shows which endpoints are currently implemented:

<details>
<summary><strong>View all endpoints</strong></summary>

| API Resource           | Endpoint              | Status  | Operations                                                                                                                                                    |
| ---------------------- | --------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Email**              | `/emails`             | ✅ Full | Send, Send Batch, Send and Wait, List, Get, Update, Cancel, List Attachments, Get Attachment                                                                  |
| **Receiving Emails**   | `/emails/receiving`   | ✅ Full | List, Get, List Attachments, Get Attachment                                                                                                                   |
| **Domains**            | `/domains`            | ✅ Full | Create, List, Get, Update, Delete, Verify, Create Tracking Domain, Get Tracking Domain, List Tracking Domains, Delete Tracking Domain, Verify Tracking Domain |
| **Templates**          | `/templates`          | ✅ Full | Create, List, Get, Update, Delete, Publish, Duplicate                                                                                                         |
| **Contacts**           | `/contacts`           | ✅ Full | Create, List, Get, Update, Delete, Add to Segment, List Segments, Remove from Segment, Get Topics, Update Topics                                              |
| **Broadcasts**         | `/broadcasts`         | ✅ Full | Create, List, Get, Update, Delete, Send                                                                                                                       |
| **Segments**           | `/segments`           | ✅ Full | Create, List, Get, Delete                                                                                                                                     |
| **Topics**             | `/topics`             | ✅ Full | Create, List, Get, Update, Delete                                                                                                                             |
| **Contact Properties** | `/contact-properties` | ✅ Full | Create, List, Get, Update, Delete                                                                                                                             |
| **Webhooks**           | `/webhooks`           | ✅ Full | Create, List, Get, Update, Delete                                                                                                                             |
| **Events**             | `/events`             | ✅ Full | Create, List, Get, Update, Delete, Send                                                                                                                       |
| **Workflows**          | `/workflows`          | ✅ Full | Create, List, Get, Update, Delete, List Runs, Get Run, List Run Steps, Get Run Step                                                                           |
| **Logs**               | `/logs`               | ✅ Full | List, Retrieve                                                                                                                                                |

</details>

## Installation

1. Make a new workflow or open an existing one
2. Open the nodes panel by selecting **+** or pressing **Tab**
3. Search for **Resend**
4. Select **Install** to install the node for your instance

## Credentials

This package uses two separate credentials:

### Resend API

1. Get your API key from [Resend Dashboard](https://resend.com/api-keys)
2. In n8n, go to **Credentials** > **Add credential**
3. Search for **Resend API** and paste your key

This credential is used by the main **Resend** node for all API operations.

### Resend Webhook Signing Secret

1. Create a webhook endpoint in your [Resend Dashboard](https://resend.com/webhooks)
2. Copy the signing secret (starts with `whsec_`)
3. In n8n, go to **Credentials** > **Add credential**
4. Search for **Resend Webhook Signing Secret** and paste your secret

This credential is used exclusively by the **Resend Trigger** node for webhook signature verification. Each webhook endpoint in Resend has its own unique signing secret.

## Human in the Loop

The **Send and Wait for Response** operation enables human-in-the-loop workflows. Send an email and pause the workflow until the recipient responds via approval buttons or a form.

### Features

- **Approval Workflows**: Send emails with Approve/Decline buttons for quick decisions
- **Free Text Responses**: Collect text input via a response form
- **Configurable Wait Time**: Set a timeout or wait indefinitely
- **Secure Callbacks**: Responses use signed URLs for security

### How to Use

The workflow pauses at the email step and resumes automatically once the recipient clicks a button or submits the response form.

1. In the node panel, go to **Human in the Loop** > **Resend**
2. Or select **Email** resource > **Send and Wait for Response** operation

### Configuration Options

| Option                   | Description                                              |
| ------------------------ | -------------------------------------------------------- |
| **Response Type**        | Choose between Approval (buttons) or Free Text (form)    |
| **Approval Type**        | Single button (Approve only) or Double (Approve/Decline) |
| **Button Labels**        | Customize the button text                                |
| **Button Styles**        | Primary or Secondary styling                             |
| **Message Button Label** | Label for the form link button (Free Text mode)          |
| **Response Form Title**  | Title shown on the response form                         |
| **Limit Wait Time**      | Set a timeout for the wait period                        |

## Trigger Events

The **Resend Trigger** node receives webhooks for real-time email events. Signatures are automatically verified using Svix.

> [!NOTE]
> The trigger node requires the **Resend Webhook Signing Secret** credential (separate from the Resend API credential). See the [Credentials](#credentials) section for setup instructions.

For a full list of supported event types, see the [Resend Webhooks documentation](https://resend.com/docs/dashboard/webhooks/event-types).

## Limitations

- Maximum email size: 40MB (including attachments)
- Attachments not supported with scheduled emails

## Development

Requires [Node.js 22.13+](https://nodejs.org/) and [pnpm 11](https://pnpm.io/) (`corepack enable` recommended).

```bash
git clone https://github.com/resend/n8n-nodes-resend.git
cd n8n-nodes-resend
pnpm install
pnpm run build
pnpm run lint
```

## License

[MIT](LICENSE.md)

<p align="center">
  <a href="https://github.com/resend/n8n-nodes-resend">GitHub</a> |
  <a href="https://github.com/resend/n8n-nodes-resend/issues">Issues</a> |
  <a href="https://resend.com/docs">Resend Docs</a>
</p>
