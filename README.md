<h1 align="center">
  <br>
  <a href="/"><img src=".github/media/resend.png" alt="..." width="900"></a>
  <br>
</h1>

# Resend Nodes for n8n

## Overview

This package provides comprehensive n8n nodes to interact with the Resend email platform. It allows you to:

*   **Email Operations:** Send, get, update, and cancel emails
*   **Contact Management:** Create, get, update, and delete contacts in audiences
*   **Audience Management:** Create, get, update, and delete audiences
*   **Domain Management:** Create, get, update, verify, and delete domains
*   **API Key Management:** Create and delete API keys
*   **Broadcast Management:** Create, get, and update email broadcasts
*   **Webhook Processing:** Receive and process webhook events from Resend

This integration uses the official [Resend API](https://resend.com/docs/api-reference/introduction) and provides full coverage of all available endpoints.

## Prerequisites/Setup

*   You need a Resend account. If you don't have one, you can sign up at [resend.com](https://resend.com/).
*   For detailed information about the Resend API, refer to the official [API Documentation](https://resend.com/docs/api-reference/introduction).

## Credentials Setup (`ResendApi`)

To use these nodes, you need to configure the "Resend API" credentials in n8n:

1.  In your n8n workspace, go to **Credentials** and click **Add credential**.
2.  Search for "Resend API" and select it.
3.  Fill in the required field:
    *   **API Key**: Your Resend API key.
4.  You can find your API Key in your Resend dashboard under **API Keys** ([https://resend.com/api-keys](https://resend.com/api-keys)). Create a new API key if you haven't already, ensuring it has the necessary permissions (e.g., "Full access" for sending emails).
5.  Save the credential.

## Nodes

### Resend Action Node

*   **Name:** `Resend`
*   **Description:** Comprehensive Resend API integration supporting all major operations including emails, contacts, audiences, domains, API keys, and broadcasts.

#### Resources and Operations

##### Email Operations

###### Send Email
*   **Description:** Sends an email using the Resend API.
*   **Parameters:**
    *   **Email Format**: Choose between HTML, Text, or Both formats for your email content.
    *   **From**: (String, Required) The sender's email address (e.g., `you@yourdomain.com`). Must be a verified domain in Resend.
    *   **To**: (String, Required) Comma-separated list of recipient email addresses (e.g., `user1@example.com, user2@example.com`).
    *   **Subject**: (String, Required) The subject line of the email.
    *   **HTML Content**: (String, Required for HTML/Both formats) The HTML content of the email.
    *   **Text Content**: (String, Required for Text/Both formats) The plain text content of the email.
    *   **Additional Options**: (Collection, Optional) Contains optional email parameters:
        *   **CC**: Comma-separated list of CC recipient email addresses.
        *   **BCC**: Comma-separated list of BCC recipient email addresses.
        *   **Reply To**: An email address to set as the reply-to address.
        *   **Text Content (Fallback)**: Plain text version for HTML-only emails (recommended for better deliverability).
    *   **Tags**: (Collection, Optional) A list of tags (name/value pairs) to categorize the email (e.g., `[{ "name": "category", "value": "transactional" }]`).

###### Get Email
*   **Description:** Retrieves information about a specific email by ID.
*   **Parameters:**
    *   **Email ID**: (String, Required) The unique identifier of the email to retrieve.

###### Update Email
*   **Description:** Updates an email (e.g., to schedule it for later delivery).
*   **Parameters:**
    *   **Email ID**: (String, Required) The unique identifier of the email to update.
    *   **Scheduled At**: (String, Optional) Schedule email to be sent later in ISO 8601 format.

###### Cancel Email
*   **Description:** Cancels a scheduled email before it's sent.
*   **Parameters:**
    *   **Email ID**: (String, Required) The unique identifier of the email to cancel.

##### Contact Operations

###### Create Contact
*   **Description:** Creates a new contact in an audience.
*   **Parameters:**
    *   **Audience ID**: (String, Required) The audience to add the contact to.
    *   **Email**: (String, Required) The contact's email address.
    *   **Additional Fields**: (Collection, Optional) Additional contact information:
        *   **First Name**: Contact's first name.
        *   **Last Name**: Contact's last name.
        *   **Unsubscribed**: Whether the contact is unsubscribed.

###### Get Contact
*   **Description:** Retrieves information about a specific contact.
*   **Parameters:**
    *   **Audience ID**: (String, Required) The audience containing the contact.
    *   **Contact ID**: (String, Required) The unique identifier of the contact.

###### Update Contact
*   **Description:** Updates an existing contact's information.
*   **Parameters:**
    *   **Audience ID**: (String, Required) The audience containing the contact.
    *   **Update By**: (Options, Required) Whether to update by Contact ID or Email address.
    *   **Contact Identifier**: (String, Required) Either the contact ID or email address.
    *   **Additional Fields**: (Collection, Optional) Fields to update:
        *   **First Name**: Updated first name.
        *   **Last Name**: Updated last name.
        *   **Unsubscribed**: Updated subscription status.

###### Delete Contact
*   **Description:** Removes a contact from an audience.
*   **Parameters:**
    *   **Audience ID**: (String, Required) The audience containing the contact.
    *   **Contact ID**: (String, Required) The unique identifier of the contact to delete.

###### List Contacts
*   **Description:** Retrieves all contacts in an audience.
*   **Parameters:**
    *   **Audience ID**: (String, Required) The audience to list contacts from.

##### Audience Operations

###### Create Audience
*   **Description:** Creates a new audience for organizing contacts.
*   **Parameters:**
    *   **Audience Name**: (String, Required) The name of the audience.

###### Get Audience
*   **Description:** Retrieves information about a specific audience.
*   **Parameters:**
    *   **Audience ID**: (String, Required) The unique identifier of the audience.

###### List Audiences
*   **Description:** Retrieves all audiences in your account.

###### Delete Audience
*   **Description:** Deletes an audience and all its contacts.
*   **Parameters:**
    *   **Audience ID**: (String, Required) The unique identifier of the audience to delete.

##### Domain Operations

###### Create Domain
*   **Description:** Adds a new domain to your Resend account.
*   **Parameters:**
    *   **Domain Name**: (String, Required) The domain name to add (e.g., `example.com`).
    *   **Region**: (Options, Optional) The region for the domain (us-east-1, eu-west-1, etc.).

###### Get Domain
*   **Description:** Retrieves information about a specific domain.
*   **Parameters:**
    *   **Domain ID**: (String, Required) The unique identifier of the domain.

###### Update Domain
*   **Description:** Updates domain configuration settings.
*   **Parameters:**
    *   **Domain ID**: (String, Required) The unique identifier of the domain.
    *   **Domain Update Options**: (Collection, Optional) Settings to update:
        *   **Click Tracking**: Whether to track clicks in emails.
        *   **Open Tracking**: Whether to track email opens.
        *   **TLS**: TLS enforcement setting (Opportunistic or Enforced).

###### Verify Domain
*   **Description:** Initiates domain verification process.
*   **Parameters:**
    *   **Domain ID**: (String, Required) The unique identifier of the domain to verify.

###### List Domains
*   **Description:** Retrieves all domains in your account.

###### Delete Domain
*   **Description:** Removes a domain from your account.
*   **Parameters:**
    *   **Domain ID**: (String, Required) The unique identifier of the domain to delete.

##### API Key Operations

###### Create API Key
*   **Description:** Creates a new API key with specified permissions.
*   **Parameters:**
    *   **API Key Name**: (String, Required) The name for the new API key.
    *   **Permission**: (Options, Required) The permission level (full_access or sending_access).
    *   **Domain ID**: (String, Optional) Required when permission is sending_access - restricts the key to a specific domain.

###### Delete API Key
*   **Description:** Revokes an existing API key.
*   **Parameters:**
    *   **API Key ID**: (String, Required) The unique identifier of the API key to delete.

##### Broadcast Operations

###### Create Broadcast
*   **Description:** Creates a new email broadcast campaign.
*   **Parameters:**
    *   **Broadcast Content**: (Collection, Required) The broadcast content and settings:
        *   **Audience ID**: The audience to send the broadcast to.
        *   **From**: Sender email address.
        *   **HTML Content**: HTML version of the email.
        *   **Name**: Internal name for the broadcast.
        *   **Reply To**: Reply-to email address.
        *   **Subject**: Email subject line.
        *   **Text Content**: Plain text version of the email.

###### Get Broadcast
*   **Description:** Retrieves information about a specific broadcast.
*   **Parameters:**
    *   **Broadcast ID**: (String, Required) The unique identifier of the broadcast.

###### Update Broadcast
*   **Description:** Updates an existing broadcast.
*   **Parameters:**
    *   **Broadcast ID**: (String, Required) The unique identifier of the broadcast.
    *   **Broadcast Content**: (Collection, Optional) Fields to update (same as create operation).

### Resend Trigger Node

*   **Name:** `Resend Trigger`
*   **Description:** Receives and processes webhook events from Resend for various email activities.

#### Setup

1.  **Add the `Resend Trigger` node** to your n8n workflow.
2.  **Configure the node parameters:**
    *   **Webhook Signing Secret**: Enter your Resend webhook signing secret (starts with `whsec_`). You'll get this from step 4 below.
    *   **Events**: Select the specific email events you want Resend to send to your n8n trigger.
3.  **Copy the webhook URL**: In the trigger node, you'll see a webhook URL displayed. Copy this URL (use the test URL while building your workflow, and the production URL when the workflow is activated).
4.  **Configure webhook in Resend dashboard:**
    *   Navigate to **API** -> **Webhooks** in your Resend dashboard ([https://resend.com/webhooks](https://resend.com/webhooks)).
    *   Click **Add webhook**.
    *   Paste the copied n8n webhook URL into the "Webhook URL" field.
    *   Select the same events that you configured in your n8n trigger node.
    *   Save the webhook configuration.
    *   Copy the **Webhook Signing Secret** that Resend displays (starts with `whsec_`).
5.  **Add the signing secret**: Go back to your n8n `Resend Trigger` node and paste the signing secret into the **Webhook Signing Secret** parameter.

#### Supported Events

The trigger node supports all Resend webhook event types:

*   **Email Events:**
    *   `email.sent` - Email was sent successfully
    *   `email.delivered` - Email was delivered to the recipient
    *   `email.delivery_delayed` - Email delivery was delayed
    *   `email.complained` - Recipient marked email as spam
    *   `email.bounced` - Email bounced (recipient address invalid)
    *   `email.opened` - Recipient opened the email
    *   `email.clicked` - Recipient clicked a link in the email
*   **Contact Events:**
    *   `contact.created` - New contact was created
    *   `contact.updated` - Contact information was updated
    *   `contact.deleted` - Contact was deleted
*   **Domain Events:**
    *   `domain.created` - New domain was added
    *   `domain.updated` - Domain configuration was updated
    *   `domain.deleted` - Domain was removed

#### Security

The trigger node automatically verifies webhook signatures using the Svix library to ensure webhooks are coming from Resend. This prevents unauthorized webhook calls to your n8n workflow.

#### Output

The trigger node outputs the complete JSON payload sent by Resend for the configured event. This payload contains detailed information about the event, such as:
*   Email ID and message details
*   Recipient information
*   Timestamp of the event
*   Event-specific data (e.g., bounce reason, click data)

## Example Usage

### Resend Action Node Examples

#### Email Operations
*   **Send Welcome Email:** When a new user signs up, send a personalized welcome email with HTML formatting and tracking.
*   **Schedule Marketing Email:** Create and schedule promotional emails to be sent at optimal times.
*   **Cancel Scheduled Email:** Cancel emails that are no longer relevant before they're sent.

#### Contact Management
*   **Newsletter Signup:** When users subscribe to your newsletter, create contacts in your audience with their preferences.
*   **Update Contact Preferences:** Update contact information when users modify their profile or preferences.
*   **Clean Contact Lists:** Remove bounced or unsubscribed contacts to maintain list hygiene.

#### Audience Segmentation
*   **Create Targeted Audiences:** Organize contacts into specific audiences based on behavior, location, or preferences.
*   **Manage Multiple Lists:** Maintain separate audiences for different product lines or customer segments.

#### Domain Management
*   **Add New Domains:** Set up new sending domains when expanding to new brands or regions.
*   **Configure Tracking:** Enable click and open tracking to measure email engagement.
*   **Domain Verification:** Automate domain verification workflows for new domains.

#### API Key Management
*   **Provision Access:** Create limited API keys for third-party integrations or team members.
*   **Rotate Keys:** Regularly delete and recreate API keys for security compliance.

#### Broadcast Campaigns
*   **Newsletter Campaigns:** Create and send newsletters to your entire audience.
*   **Product Announcements:** Send targeted broadcasts about new features or products.
*   **Event Invitations:** Create and manage event invitation campaigns.

### Resend Trigger Node Examples
### Resend Trigger Node Examples

#### Email Event Automation
*   **Bounce Handling:** When an `email.bounced` event is received:
    1. Parse the bounced email address from the trigger output
    2. Update the contact record in your CRM to mark the email as invalid
    3. Move the contact to a "bounced" audience
    4. Notify your support team about the bounce

*   **Engagement Tracking:** When `email.opened` or `email.clicked` events occur:
    1. Update customer engagement scores in your database
    2. Trigger follow-up email sequences based on engagement
    3. Add engaged contacts to VIP audiences

*   **Delivery Monitoring:** When `email.delivery_delayed` events happen:
    1. Log delivery issues for monitoring
    2. Retry sending through alternative channels if needed
    3. Alert administrators about potential delivery problems

#### Contact Event Automation
*   **Contact Lifecycle Management:** When `contact.created`, `contact.updated`, or `contact.deleted` events occur:
    1. Sync contact changes with your CRM or database
    2. Update customer profiles in your application
    3. Trigger welcome sequences for new contacts

#### Domain Event Automation
*   **Domain Management:** When `domain.created`, `domain.updated`, or `domain.deleted` events happen:
    1. Update your internal domain registry
    2. Configure DNS settings automatically
    3. Notify team members about domain changes

## Advanced Features

### Variable Support in Broadcasts
Broadcasts support dynamic content using variables like:
*   `{{{FIRST_NAME|there}}}` - Personalize with first name, fallback to "there"
*   `{{{RESEND_UNSUBSCRIBE_URL}}}` - Automatic unsubscribe link
*   `{{{COMPANY_NAME}}}` - Company name from contact data

### Error Handling
All operations include comprehensive error handling with descriptive messages for common issues like:
*   Invalid email addresses
*   Missing required fields
*   API rate limits
*   Authentication failures
*   Domain verification issues

### Security Features
*   **Webhook Signature Verification:** All webhooks are verified using Svix for security
*   **API Key Scoping:** Create limited-scope API keys for specific domains or operations
*   **TLS Enforcement:** Configure domains with enforced TLS for secure email delivery

## License

MIT

## Contribution & Issues

Contributions are welcome! If you find any issues or have suggestions for improvements, please feel free to:

*   Raise an issue on the GitHub repository.
*   Fork the repository and submit a pull request.
