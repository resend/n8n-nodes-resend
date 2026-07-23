import type {
  INodeType,
  INodeTypeDescription,
  IWebhookFunctions,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import * as account from './actions/account';
import * as broadcasts from './actions/broadcast';
import * as contacts from './actions/contact';
import * as contactProperties from './actions/contactProperty';
import * as domains from './actions/domain';
import * as email from './actions/email';
import * as events from './actions/event';
import * as logs from './actions/log';
import * as receivingEmails from './actions/receivingEmail';
import { router } from './actions/router';
import * as segments from './actions/segment';
import * as suppressions from './actions/suppression';
import * as templates from './actions/template';
import * as topics from './actions/topic';
import * as webhooks from './actions/webhook';
import * as workflows from './actions/workflow';
import {
  getBroadcasts,
  getBroadcastsListSearch,
  getContactProperties,
  getContactPropertiesListSearch,
  getContacts,
  getContactsListSearch,
  getDomains,
  getDomainsListSearch,
  getEmails,
  getEmailsListSearch,
  getReceivedEmails,
  getReceivedEmailsListSearch,
  getSegments,
  getSegmentsListSearch,
  getSuppressions,
  getSuppressionsListSearch,
  getTemplates,
  getTemplatesListSearch,
  getTemplateVariables,
  getTemplateVariablesListSearch,
  getTopics,
  getTopicsListSearch,
  getWebhooks,
  getWebhooksListSearch,
} from './methods';
import {
  SEND_AND_WAIT_WAITING_TOOLTIP,
  sendAndWaitWebhook,
  sendAndWaitWebhooksDescription,
} from './utils/sendAndWait';

export class Resend implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Resend',
    name: 'resend',
    icon: {
      light: 'file:resend-icon-black.svg',
      dark: 'file:resend-icon-white.svg',
    },
    group: ['output'],
    version: 1,
    usableAsTool: true,
    description:
      'Send emails, manage contacts, create broadcasts, handle templates, domains, segments, topics, and webhooks using the Resend email platform',
    subtitle:
      '={{(() => { const resourceLabels = { broadcasts: "broadcast", contacts: "contact", contactProperties: "contact property", domains: "domain", email: "email", logs: "log", receivingEmails: "received email", workflows: "workflow", events: "event", segments: "segment", suppressions: "suppression", templates: "template", topics: "topic", webhooks: "webhook" }; const operationLabels = { retrieve: "get", sendBatch: "send batch", listAttachments: "list attachments", getAttachment: "get attachment", addToSegment: "add to segment", listSegments: "list segments", removeFromSegment: "remove from segment", getTopics: "get topics", updateTopics: "update topics", listRuns: "list runs", getRun: "get run", listRunSteps: "list run steps", getRunStep: "get run step", batchAdd: "batch add", batchRemove: "batch remove" }; const resource = $parameter["resource"]; const operation = $parameter["operation"]; const resourceLabel = resourceLabels[resource] ?? resource; const operationLabel = operationLabels[operation] ?? operation; return operationLabel + ": " + resourceLabel; })() }}',
    defaults: {
      name: 'Resend',
    },
    credentials: [
      {
        name: 'resendOAuth2Api',
        required: true,
        displayOptions: {
          show: {
            authentication: ['oAuth2'],
          },
        },
      },
      {
        name: 'resendApi',
        required: true,
        displayOptions: {
          show: {
            authentication: ['apiKey'],
          },
        },
      },
    ],
    waitingNodeTooltip: SEND_AND_WAIT_WAITING_TOOLTIP,
    webhooks: sendAndWaitWebhooksDescription,
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    properties: [
      {
        displayName: 'Authentication',
        name: 'authentication',
        type: 'options',
        options: [
          {
            name: 'API Key',
            value: 'apiKey',
            description: 'Manually paste a Resend API key',
          },
          {
            name: 'OAuth2 (Recommended)',
            value: 'oAuth2',
            description:
              'Sign in with your Resend account — n8n registers itself as an OAuth client automatically, no API key needed',
          },
        ],
        default: 'oAuth2',
      },
      // Resource selection
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Account',
            value: 'account',
            description:
              'Manage the connected Resend OAuth2 account, such as disconnecting it',
          },
          {
            name: 'Broadcast',
            value: 'broadcasts',
            description:
              'Create, send, update, or delete email broadcasts to reach multiple contacts at once',
          },
          {
            name: 'Contact',
            value: 'contacts',
            description:
              'Add, update, delete, or list contacts (email subscribers) and manage their segment and topic memberships',
          },
          {
            name: 'Contact Property',
            value: 'contactProperties',
            description:
              'Create, update, delete, or list custom contact properties (metadata fields) for storing additional contact information',
          },
          {
            name: 'Domain',
            value: 'domains',
            description:
              'Add, verify, update, or delete sending domains for email authentication and deliverability',
          },
          {
            name: 'Email',
            value: 'email',
            description:
              'Send single or batch emails, retrieve sent emails, cancel scheduled emails, or manage email attachments',
          },
          {
            name: 'Event',
            value: 'events',
            description:
              'Create, send, retrieve, update, or delete events for triggering workflows (private alpha)',
          },
          {
            name: 'Log',
            value: 'logs',
            description:
              'List and retrieve API request logs including request bodies, response bodies, and status codes',
          },
          {
            name: 'Receiving Email',
            value: 'receivingEmails',
            description:
              'List and retrieve received emails and their attachments from inbound email processing',
          },
          {
            name: 'Segment',
            value: 'segments',
            description:
              'Create, update, delete, or list contact segments for grouping contacts based on criteria',
          },
          {
            name: 'Suppression',
            value: 'suppressions',
            description:
              'Add, remove, or list suppressed email addresses that Resend skips at send time to avoid hard bounces and spam complaints',
          },
          {
            name: 'Template',
            value: 'templates',
            description:
              'Create, update, publish, duplicate, or delete reusable email templates with dynamic variables',
          },
          {
            name: 'Topic',
            value: 'topics',
            description:
              'Create, update, delete, or list subscription topics for managing email preferences',
          },
          {
            name: 'Webhook',
            value: 'webhooks',
            description:
              'Create, update, delete, or list webhooks for receiving real-time notifications about email events',
          },
          {
            name: 'Workflow',
            value: 'workflows',
            description:
              'Create, update, delete, or list automated email workflows and monitor runs (private alpha)',
          },
        ],
        default: 'email',
      },

      ...account.descriptions,
      ...email.descriptions,
      ...templates.descriptions,
      ...domains.descriptions,
      ...broadcasts.descriptions,
      ...segments.descriptions,
      ...suppressions.descriptions,
      ...topics.descriptions,
      ...contacts.descriptions,
      ...contactProperties.descriptions,
      ...webhooks.descriptions,
      ...receivingEmails.descriptions,
      ...workflows.descriptions,
      ...events.descriptions,
      ...logs.descriptions,
    ],
  };

  methods = {
    loadOptions: {
      getBroadcasts,
      getContactProperties,
      getContacts,
      getDomains,
      getEmails,
      getReceivedEmails,
      getSegments,
      getSuppressions,
      getTemplateVariables,
      getTemplates,
      getTopics,
      getWebhooks,
    },
    listSearch: {
      getBroadcasts: getBroadcastsListSearch,
      getContactProperties: getContactPropertiesListSearch,
      getContacts: getContactsListSearch,
      getDomains: getDomainsListSearch,
      getEmails: getEmailsListSearch,
      getReceivedEmails: getReceivedEmailsListSearch,
      getSegments: getSegmentsListSearch,
      getSuppressions: getSuppressionsListSearch,
      getTemplates: getTemplatesListSearch,
      getTemplateVariables: getTemplateVariablesListSearch,
      getTopics: getTopicsListSearch,
      getWebhooks: getWebhooksListSearch,
    },
  };

  webhook = async function (this: IWebhookFunctions) {
    return sendAndWaitWebhook.call(this);
  };

  execute = router;
}
