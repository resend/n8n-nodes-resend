import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { describe, expect, it } from 'vitest';
import * as account from '../nodes/Resend/actions/account';
import * as broadcasts from '../nodes/Resend/actions/broadcast';
import * as contacts from '../nodes/Resend/actions/contact';
import * as contactProperties from '../nodes/Resend/actions/contactProperty';
import * as domains from '../nodes/Resend/actions/domain';
import * as email from '../nodes/Resend/actions/email';
import * as events from '../nodes/Resend/actions/event';
import * as logs from '../nodes/Resend/actions/log';
import * as receivingEmails from '../nodes/Resend/actions/receivingEmail';
import * as segments from '../nodes/Resend/actions/segment';
import * as suppressions from '../nodes/Resend/actions/suppression';
import * as templates from '../nodes/Resend/actions/template';
import * as topics from '../nodes/Resend/actions/topic';
import * as webhooks from '../nodes/Resend/actions/webhook';
import * as workflows from '../nodes/Resend/actions/workflow';
import { createExecuteMock, type ParameterMap } from './helpers/context';

type ResourceExecute = (
  this: IExecuteFunctions,
  index: number,
  operation: string,
) => Promise<INodeExecutionData[]>;

interface RequestCase {
  resource: string;
  execute: ResourceExecute;
  operation: string;
  parameters?: ParameterMap;
  response?: unknown;
  method: string;
  endpoint: string;
  body?: unknown;
  qs?: unknown;
}

const locator = (value: string) => ({ mode: 'id', value });
const listParameters = { returnAll: false, limit: 50 };
const listQuery = { limit: 50 };

const cases: RequestCase[] = [
  {
    resource: 'broadcasts',
    execute: broadcasts.execute,
    operation: 'create',
    parameters: {
      segmentId: locator('seg_1'),
      broadcastFrom: 'news@example.com',
      broadcastSubject: 'Monthly update',
      broadcastHtml: '<p>Hi</p>',
      broadcastCreateOptions: {
        name: 'March',
        replyTo: 'reply@example.com',
        text: 'Hi',
        topicId: 'topic_1',
      },
    },
    method: 'POST',
    endpoint: '/broadcasts',
    body: {
      segment_id: 'seg_1',
      from: 'news@example.com',
      subject: 'Monthly update',
      html: '<p>Hi</p>',
      name: 'March',
      reply_to: 'reply@example.com',
      text: 'Hi',
      topic_id: 'topic_1',
    },
  },
  {
    resource: 'broadcasts',
    execute: broadcasts.execute,
    operation: 'get',
    parameters: { broadcastId: locator('bc 1') },
    method: 'GET',
    endpoint: '/broadcasts/bc%201',
  },
  {
    resource: 'broadcasts',
    execute: broadcasts.execute,
    operation: 'delete',
    parameters: { broadcastId: locator('bc_1') },
    method: 'DELETE',
    endpoint: '/broadcasts/bc_1',
  },
  {
    resource: 'broadcasts',
    execute: broadcasts.execute,
    operation: 'list',
    parameters: listParameters,
    response: { data: [] },
    method: 'GET',
    endpoint: '/broadcasts',
    qs: listQuery,
  },
  {
    resource: 'broadcasts',
    execute: broadcasts.execute,
    operation: 'send',
    parameters: {
      broadcastId: locator('bc_1'),
      broadcastSendOptions: { scheduledAt: 'in 1 hour' },
    },
    method: 'POST',
    endpoint: '/broadcasts/bc_1/send',
    body: { scheduled_at: 'in 1 hour' },
  },
  {
    resource: 'broadcasts',
    execute: broadcasts.execute,
    operation: 'update',
    parameters: {
      broadcastId: locator('bc_1'),
      broadcastUpdateFields: {
        from: 'news@example.com',
        html: '<p>Hi</p>',
        name: 'April',
        replyTo: 'reply@example.com',
        subject: 'Update',
        segmentId: 'seg_2',
        text: 'Hi',
        topicId: 'topic_2',
      },
    },
    method: 'PATCH',
    endpoint: '/broadcasts/bc_1',
    body: {
      from: 'news@example.com',
      html: '<p>Hi</p>',
      name: 'April',
      reply_to: 'reply@example.com',
      subject: 'Update',
      segment_id: 'seg_2',
      text: 'Hi',
      topic_id: 'topic_2',
    },
  },
  {
    resource: 'contacts',
    execute: contacts.execute,
    operation: 'create',
    parameters: {
      email: 'ada@example.com',
      contactCreateFields: {
        firstName: 'Ada',
        lastName: 'Lovelace',
        unsubscribed: false,
        properties: { properties: [{ key: 'plan', value: 'pro' }] },
        segments: { segments: [{ id: 'seg_1' }] },
        topics: { topics: [{ id: 'topic_1', subscription: 'opted_in' }] },
      },
    },
    method: 'POST',
    endpoint: '/contacts',
    body: {
      email: 'ada@example.com',
      first_name: 'Ada',
      last_name: 'Lovelace',
      unsubscribed: false,
      properties: { plan: 'pro' },
      segments: [{ id: 'seg_1' }],
      topics: [{ id: 'topic_1', subscription: 'opted_in' }],
    },
  },
  {
    resource: 'contacts',
    execute: contacts.execute,
    operation: 'get',
    parameters: { contactIdentifier: locator('ada@example.com') },
    method: 'GET',
    endpoint: '/contacts/ada%40example.com',
  },
  {
    resource: 'contacts',
    execute: contacts.execute,
    operation: 'delete',
    parameters: { contactIdentifier: locator('c_1') },
    method: 'DELETE',
    endpoint: '/contacts/c_1',
  },
  {
    resource: 'contacts',
    execute: contacts.execute,
    operation: 'update',
    parameters: {
      updateBy: 'id',
      contactId: locator('c_1'),
      contactUpdateFields: { firstName: 'Ada', unsubscribed: true },
    },
    method: 'PATCH',
    endpoint: '/contacts/c_1',
    body: { first_name: 'Ada', unsubscribed: true },
  },
  {
    resource: 'contacts',
    execute: contacts.execute,
    operation: 'update',
    parameters: {
      updateBy: 'email',
      contactEmail: 'ada@example.com',
      contactUpdateFields: {},
    },
    method: 'PATCH',
    endpoint: '/contacts/ada%40example.com',
    body: {},
  },
  {
    resource: 'contacts',
    execute: contacts.execute,
    operation: 'list',
    parameters: { ...listParameters, segmentIdFilter: locator('seg_1') },
    response: { data: [] },
    method: 'GET',
    endpoint: '/contacts',
    qs: { limit: 50, segment_id: 'seg_1' },
  },
  {
    resource: 'contacts',
    execute: contacts.execute,
    operation: 'addToSegment',
    parameters: {
      contactIdAddSegment: locator('c_1'),
      segmentIdAdd: locator('seg_1'),
    },
    method: 'POST',
    endpoint: '/contacts/c_1/segments/seg_1',
  },
  {
    resource: 'contacts',
    execute: contacts.execute,
    operation: 'removeFromSegment',
    parameters: {
      contactIdRemoveSegment: locator('c_1'),
      segmentIdRemove: locator('seg_1'),
    },
    method: 'DELETE',
    endpoint: '/contacts/c_1/segments/seg_1',
  },
  {
    resource: 'contacts',
    execute: contacts.execute,
    operation: 'listSegments',
    parameters: { contactIdListSegments: locator('c_1') },
    response: { data: [] },
    method: 'GET',
    endpoint: '/contacts/c_1/segments',
    qs: listQuery,
  },
  {
    resource: 'contacts',
    execute: contacts.execute,
    operation: 'getTopics',
    parameters: { contactIdGetTopics: locator('c_1') },
    response: { data: [] },
    method: 'GET',
    endpoint: '/contacts/c_1/topics',
    qs: listQuery,
  },
  {
    resource: 'contacts',
    execute: contacts.execute,
    operation: 'updateTopics',
    parameters: {
      contactIdUpdateTopics: locator('c_1'),
      topicsToUpdate: {
        topics: [{ id: 'topic_1', subscription: 'opted_out' }],
      },
    },
    method: 'PATCH',
    endpoint: '/contacts/c_1/topics',
    body: { topics: [{ id: 'topic_1', subscription: 'opted_out' }] },
  },
  {
    resource: 'contactProperties',
    execute: contactProperties.execute,
    operation: 'create',
    parameters: {
      contactPropertyKey: 'plan',
      contactPropertyType: 'string',
      contactPropertyFallbackValue: 'free',
    },
    method: 'POST',
    endpoint: '/contact-properties',
    body: { key: 'plan', type: 'string', fallback_value: 'free' },
  },
  {
    resource: 'contactProperties',
    execute: contactProperties.execute,
    operation: 'get',
    parameters: { contactPropertyId: locator('cp_1') },
    method: 'GET',
    endpoint: '/contact-properties/cp_1',
  },
  {
    resource: 'contactProperties',
    execute: contactProperties.execute,
    operation: 'delete',
    parameters: { contactPropertyId: locator('cp_1') },
    method: 'DELETE',
    endpoint: '/contact-properties/cp_1',
  },
  {
    resource: 'contactProperties',
    execute: contactProperties.execute,
    operation: 'update',
    parameters: {
      contactPropertyId: locator('cp_1'),
      contactPropertyUpdateFields: { fallbackValue: 'pro' },
    },
    method: 'PATCH',
    endpoint: '/contact-properties/cp_1',
    body: { fallback_value: 'pro' },
  },
  {
    resource: 'contactProperties',
    execute: contactProperties.execute,
    operation: 'list',
    parameters: listParameters,
    response: { data: [] },
    method: 'GET',
    endpoint: '/contact-properties',
    qs: listQuery,
  },
  {
    resource: 'domains',
    execute: domains.execute,
    operation: 'create',
    parameters: {
      domainName: 'example.com',
      additionalOptions: {
        region: 'eu-west-1',
        customReturnPath: 'bounces',
        openTracking: true,
        clickTracking: false,
        tls: 'enforced',
        capabilities: { capabilitiesValues: { receiving: 'enabled' } },
      },
    },
    method: 'POST',
    endpoint: '/domains',
    body: {
      name: 'example.com',
      region: 'eu-west-1',
      custom_return_path: 'bounces',
      open_tracking: true,
      click_tracking: false,
      tls: 'enforced',
      capabilities: { sending: 'enabled', receiving: 'enabled' },
    },
  },
  {
    resource: 'domains',
    execute: domains.execute,
    operation: 'claim',
    parameters: {
      domainName: 'example.com',
      additionalOptions: {
        region: 'us-east-1',
        custom_return_path: 'bounces',
        open_tracking: false,
        click_tracking: true,
        tracking_subdomain: 'links',
      },
    },
    method: 'POST',
    endpoint: '/domains/claim',
    body: {
      name: 'example.com',
      region: 'us-east-1',
      custom_return_path: 'bounces',
      open_tracking: false,
      click_tracking: true,
      tracking_subdomain: 'links',
    },
  },
  {
    resource: 'domains',
    execute: domains.execute,
    operation: 'get',
    parameters: { domainId: locator('dom_1') },
    method: 'GET',
    endpoint: '/domains/dom_1',
  },
  {
    resource: 'domains',
    execute: domains.execute,
    operation: 'delete',
    parameters: { domainId: locator('dom_1') },
    method: 'DELETE',
    endpoint: '/domains/dom_1',
  },
  {
    resource: 'domains',
    execute: domains.execute,
    operation: 'verify',
    parameters: { domainId: locator('dom_1') },
    method: 'POST',
    endpoint: '/domains/dom_1/verify',
  },
  {
    resource: 'domains',
    execute: domains.execute,
    operation: 'getClaim',
    parameters: { domainId: locator('dom_1') },
    method: 'GET',
    endpoint: '/domains/dom_1/claim',
  },
  {
    resource: 'domains',
    execute: domains.execute,
    operation: 'verifyClaim',
    parameters: { domainId: locator('dom_1') },
    method: 'POST',
    endpoint: '/domains/dom_1/claim/verify',
  },
  {
    resource: 'domains',
    execute: domains.execute,
    operation: 'update',
    parameters: {
      domainId: locator('dom_1'),
      domainUpdateOptions: {
        clickTracking: true,
        openTracking: false,
        tls: 'opportunistic',
      },
    },
    method: 'PATCH',
    endpoint: '/domains/dom_1',
    body: { click_tracking: true, open_tracking: false, tls: 'opportunistic' },
  },
  {
    resource: 'domains',
    execute: domains.execute,
    operation: 'list',
    parameters: listParameters,
    response: { data: [] },
    method: 'GET',
    endpoint: '/domains',
    qs: listQuery,
  },
  {
    resource: 'domains',
    execute: domains.execute,
    operation: 'createTrackingDomain',
    parameters: { domainId: locator('dom_1'), trackingSubdomain: 'links' },
    method: 'POST',
    endpoint: '/domains/dom_1/tracking-domains',
    body: { subdomain: 'links' },
  },
  {
    resource: 'domains',
    execute: domains.execute,
    operation: 'getTrackingDomain',
    parameters: { domainId: locator('dom_1'), trackingDomainId: 'td_1' },
    method: 'GET',
    endpoint: '/domains/dom_1/tracking-domains/td_1',
  },
  {
    resource: 'domains',
    execute: domains.execute,
    operation: 'listTrackingDomains',
    parameters: { domainId: locator('dom_1') },
    response: { data: [] },
    method: 'GET',
    endpoint: '/domains/dom_1/tracking-domains',
  },
  {
    resource: 'domains',
    execute: domains.execute,
    operation: 'verifyTrackingDomain',
    parameters: { domainId: locator('dom_1'), trackingDomainId: 'td_1' },
    method: 'POST',
    endpoint: '/domains/dom_1/tracking-domains/td_1/verify',
  },
  {
    resource: 'domains',
    execute: domains.execute,
    operation: 'deleteTrackingDomain',
    parameters: { domainId: locator('dom_1'), trackingDomainId: 'td_1' },
    method: 'DELETE',
    endpoint: '/domains/dom_1/tracking-domains/td_1',
  },
  {
    resource: 'email',
    execute: email.execute,
    operation: 'list',
    parameters: listParameters,
    response: { data: [] },
    method: 'GET',
    endpoint: '/emails',
    qs: listQuery,
  },
  {
    resource: 'email',
    execute: email.execute,
    operation: 'getAttachment',
    parameters: { emailId: locator('e_1'), attachmentId: 'att_1' },
    method: 'GET',
    endpoint: '/emails/e_1/attachments/att_1',
  },
  {
    resource: 'events',
    execute: events.execute,
    operation: 'create',
    parameters: {
      eventName: 'signup',
      eventSchema: '{"type":"object"}',
    },
    method: 'POST',
    endpoint: '/events',
    body: { name: 'signup', schema: { type: 'object' } },
  },
  {
    resource: 'events',
    execute: events.execute,
    operation: 'get',
    parameters: { eventIdentifier: 'signup' },
    method: 'GET',
    endpoint: '/events/signup',
  },
  {
    resource: 'events',
    execute: events.execute,
    operation: 'delete',
    parameters: { eventIdentifier: 'signup' },
    method: 'DELETE',
    endpoint: '/events/signup',
  },
  {
    resource: 'events',
    execute: events.execute,
    operation: 'update',
    parameters: { eventIdentifier: 'signup', eventSchema: 'null' },
    method: 'PATCH',
    endpoint: '/events/signup',
    body: { schema: null },
  },
  {
    resource: 'events',
    execute: events.execute,
    operation: 'send',
    parameters: {
      eventName: 'signup',
      identifyBy: 'contactId',
      contactId: 'c_1',
      eventPayload: '{"plan":"pro"}',
    },
    method: 'POST',
    endpoint: '/events/send',
    body: { event: 'signup', contactId: 'c_1', payload: { plan: 'pro' } },
  },
  {
    resource: 'events',
    execute: events.execute,
    operation: 'send',
    parameters: {
      eventName: 'signup',
      identifyBy: 'email',
      contactEmail: 'ada@example.com',
    },
    method: 'POST',
    endpoint: '/events/send',
    body: { event: 'signup', email: 'ada@example.com' },
  },
  {
    resource: 'events',
    execute: events.execute,
    operation: 'list',
    parameters: listParameters,
    response: { data: [] },
    method: 'GET',
    endpoint: '/events',
    qs: listQuery,
  },
  {
    resource: 'logs',
    execute: logs.execute,
    operation: 'list',
    parameters: listParameters,
    response: { data: [] },
    method: 'GET',
    endpoint: '/logs',
    qs: listQuery,
  },
  {
    resource: 'logs',
    execute: logs.execute,
    operation: 'retrieve',
    parameters: { logId: 'log_1' },
    method: 'GET',
    endpoint: '/logs/log_1',
  },
  {
    resource: 'receivingEmails',
    execute: receivingEmails.execute,
    operation: 'get',
    parameters: { receivedEmailId: locator('re_1') },
    method: 'GET',
    endpoint: '/emails/receiving/re_1',
  },
  {
    resource: 'receivingEmails',
    execute: receivingEmails.execute,
    operation: 'list',
    parameters: listParameters,
    response: { data: [] },
    method: 'GET',
    endpoint: '/emails/receiving',
    qs: listQuery,
  },
  {
    resource: 'receivingEmails',
    execute: receivingEmails.execute,
    operation: 'listAttachments',
    parameters: { receivedEmailId: locator('re_1') },
    response: { data: [] },
    method: 'GET',
    endpoint: '/emails/receiving/re_1/attachments',
    qs: listQuery,
  },
  {
    resource: 'receivingEmails',
    execute: receivingEmails.execute,
    operation: 'getAttachment',
    parameters: {
      receivedEmailId: locator('re_1'),
      receivedAttachmentId: 'att_1',
    },
    method: 'GET',
    endpoint: '/emails/receiving/re_1/attachments/att_1',
  },
  {
    resource: 'segments',
    execute: segments.execute,
    operation: 'create',
    parameters: {
      segmentName: 'Active',
      segmentFilter: '{"unsubscribed":false}',
    },
    method: 'POST',
    endpoint: '/segments',
    body: { name: 'Active', filter: { unsubscribed: false } },
  },
  {
    resource: 'segments',
    execute: segments.execute,
    operation: 'get',
    parameters: { segmentId: locator('seg_1') },
    method: 'GET',
    endpoint: '/segments/seg_1',
  },
  {
    resource: 'segments',
    execute: segments.execute,
    operation: 'delete',
    parameters: { segmentId: locator('seg_1') },
    method: 'DELETE',
    endpoint: '/segments/seg_1',
  },
  {
    resource: 'segments',
    execute: segments.execute,
    operation: 'list',
    parameters: listParameters,
    response: { data: [] },
    method: 'GET',
    endpoint: '/segments',
    qs: listQuery,
  },
  {
    resource: 'segments',
    execute: segments.execute,
    operation: 'listContacts',
    parameters: { ...listParameters, segmentId: locator('seg_1') },
    response: { data: [] },
    method: 'GET',
    endpoint: '/segments/seg_1/contacts',
    qs: listQuery,
  },
  {
    resource: 'suppressions',
    execute: suppressions.execute,
    operation: 'create',
    parameters: { suppressionEmail: 'blocked@example.com' },
    method: 'POST',
    endpoint: '/suppressions',
    body: { email: 'blocked@example.com' },
  },
  {
    resource: 'suppressions',
    execute: suppressions.execute,
    operation: 'get',
    parameters: { suppressionIdentifier: locator('blocked@example.com') },
    method: 'GET',
    endpoint: '/suppressions/blocked%40example.com',
  },
  {
    resource: 'suppressions',
    execute: suppressions.execute,
    operation: 'delete',
    parameters: { suppressionIdentifier: locator('sup_1') },
    method: 'DELETE',
    endpoint: '/suppressions/sup_1',
  },
  {
    resource: 'suppressions',
    execute: suppressions.execute,
    operation: 'batchAdd',
    parameters: { suppressionEmails: 'one@example.com, two@example.com' },
    method: 'POST',
    endpoint: '/suppressions/batch/add',
    body: { emails: ['one@example.com', 'two@example.com'] },
  },
  {
    resource: 'suppressions',
    execute: suppressions.execute,
    operation: 'batchRemove',
    parameters: {
      suppressionRemoveBy: 'emails',
      suppressionEmails: 'one@example.com',
    },
    method: 'POST',
    endpoint: '/suppressions/batch/remove',
    body: { emails: ['one@example.com'] },
  },
  {
    resource: 'suppressions',
    execute: suppressions.execute,
    operation: 'batchRemove',
    parameters: { suppressionRemoveBy: 'ids', suppressionIds: 'sup_1, sup_2' },
    method: 'POST',
    endpoint: '/suppressions/batch/remove',
    body: { ids: ['sup_1', 'sup_2'] },
  },
  {
    resource: 'suppressions',
    execute: suppressions.execute,
    operation: 'list',
    parameters: { ...listParameters, suppressionOrigin: 'bounce' },
    response: { data: [] },
    method: 'GET',
    endpoint: '/suppressions',
    qs: { limit: 50, origin: 'bounce' },
  },
  {
    resource: 'templates',
    execute: templates.execute,
    operation: 'create',
    parameters: {
      templateName: 'Welcome',
      templateFrom: 'noreply@example.com',
      templateSubject: 'Welcome',
      templateHtml: '<p>Hi {{name}}</p>',
      templateVariables: {
        variables: [
          { key: 'name', type: 'string', fallbackValue: 'friend' },
          { key: 'plan', type: 'string' },
        ],
      },
    },
    method: 'POST',
    endpoint: '/templates',
    body: {
      name: 'Welcome',
      from: 'noreply@example.com',
      subject: 'Welcome',
      html: '<p>Hi {{name}}</p>',
      variables: [
        { key: 'name', type: 'string', fallbackValue: 'friend' },
        { key: 'plan', type: 'string' },
      ],
    },
  },
  {
    resource: 'templates',
    execute: templates.execute,
    operation: 'get',
    parameters: { templateId: locator('tmpl_1') },
    method: 'GET',
    endpoint: '/templates/tmpl_1',
  },
  {
    resource: 'templates',
    execute: templates.execute,
    operation: 'delete',
    parameters: { templateId: locator('tmpl_1') },
    method: 'DELETE',
    endpoint: '/templates/tmpl_1',
  },
  {
    resource: 'templates',
    execute: templates.execute,
    operation: 'duplicate',
    parameters: { templateIdDuplicate: locator('tmpl_1') },
    method: 'POST',
    endpoint: '/templates/tmpl_1/duplicate',
  },
  {
    resource: 'templates',
    execute: templates.execute,
    operation: 'publish',
    parameters: { templateIdPublish: locator('tmpl_1') },
    method: 'POST',
    endpoint: '/templates/tmpl_1/publish',
  },
  {
    resource: 'templates',
    execute: templates.execute,
    operation: 'update',
    parameters: {
      templateId: locator('tmpl_1'),
      templateUpdateFields: { name: 'Welcome v2', subject: 'Hello' },
    },
    method: 'PATCH',
    endpoint: '/templates/tmpl_1',
    body: { name: 'Welcome v2', subject: 'Hello' },
  },
  {
    resource: 'templates',
    execute: templates.execute,
    operation: 'list',
    parameters: listParameters,
    response: { data: [] },
    method: 'GET',
    endpoint: '/templates',
    qs: listQuery,
  },
  {
    resource: 'topics',
    execute: topics.execute,
    operation: 'create',
    parameters: {
      topicName: 'Product updates',
      topicDefaultSubscription: 'opted_in',
      topicCreateOptions: { description: 'News', visibility: 'public' },
    },
    method: 'POST',
    endpoint: '/topics',
    body: {
      name: 'Product updates',
      defaultSubscription: 'opted_in',
      description: 'News',
      visibility: 'public',
    },
  },
  {
    resource: 'topics',
    execute: topics.execute,
    operation: 'get',
    parameters: { topicId: locator('topic_1') },
    method: 'GET',
    endpoint: '/topics/topic_1',
  },
  {
    resource: 'topics',
    execute: topics.execute,
    operation: 'delete',
    parameters: { topicId: locator('topic_1') },
    method: 'DELETE',
    endpoint: '/topics/topic_1',
  },
  {
    resource: 'topics',
    execute: topics.execute,
    operation: 'update',
    parameters: {
      topicId: locator('topic_1'),
      topicUpdateFields: {
        name: 'News',
        description: 'All news',
        visibility: 'private',
      },
    },
    method: 'PATCH',
    endpoint: '/topics/topic_1',
    body: { name: 'News', description: 'All news', visibility: 'private' },
  },
  {
    resource: 'topics',
    execute: topics.execute,
    operation: 'list',
    parameters: listParameters,
    response: { data: [] },
    method: 'GET',
    endpoint: '/topics',
    qs: listQuery,
  },
  {
    resource: 'webhooks',
    execute: webhooks.execute,
    operation: 'create',
    parameters: {
      webhookEndpoint: 'https://example.com/hook',
      webhookEvents: ['email.sent'],
    },
    method: 'POST',
    endpoint: '/webhooks',
    body: { endpoint: 'https://example.com/hook', events: ['email.sent'] },
  },
  {
    resource: 'webhooks',
    execute: webhooks.execute,
    operation: 'get',
    parameters: { webhookId: locator('wh_1') },
    method: 'GET',
    endpoint: '/webhooks/wh_1',
  },
  {
    resource: 'webhooks',
    execute: webhooks.execute,
    operation: 'delete',
    parameters: { webhookId: locator('wh_1') },
    method: 'DELETE',
    endpoint: '/webhooks/wh_1',
  },
  {
    resource: 'webhooks',
    execute: webhooks.execute,
    operation: 'update',
    parameters: {
      webhookId: locator('wh_1'),
      webhookUpdateFields: {
        endpoint: 'https://example.com/hook',
        events: ['email.bounced'],
        status: 'disabled',
      },
    },
    method: 'PATCH',
    endpoint: '/webhooks/wh_1',
    body: {
      endpoint: 'https://example.com/hook',
      events: ['email.bounced'],
      status: 'disabled',
    },
  },
  {
    resource: 'webhooks',
    execute: webhooks.execute,
    operation: 'list',
    parameters: listParameters,
    response: { data: [] },
    method: 'GET',
    endpoint: '/webhooks',
    qs: listQuery,
  },
  {
    resource: 'workflows',
    execute: workflows.execute,
    operation: 'create',
    parameters: {
      workflowName: 'Onboarding',
      workflowSteps: '[{"id":"s1"}]',
      workflowEdges: '[]',
      additionalOptions: { status: 'draft' },
    },
    method: 'POST',
    endpoint: '/workflows',
    body: {
      name: 'Onboarding',
      steps: [{ id: 's1' }],
      edges: [],
      status: 'draft',
    },
  },
  {
    resource: 'workflows',
    execute: workflows.execute,
    operation: 'get',
    parameters: { workflowId: 'wf_1' },
    method: 'GET',
    endpoint: '/workflows/wf_1',
  },
  {
    resource: 'workflows',
    execute: workflows.execute,
    operation: 'delete',
    parameters: { workflowId: 'wf_1' },
    method: 'DELETE',
    endpoint: '/workflows/wf_1',
  },
  {
    resource: 'workflows',
    execute: workflows.execute,
    operation: 'update',
    parameters: { workflowId: 'wf_1', workflowStatus: 'live' },
    method: 'PATCH',
    endpoint: '/workflows/wf_1',
    body: { status: 'live' },
  },
  {
    resource: 'workflows',
    execute: workflows.execute,
    operation: 'list',
    parameters: listParameters,
    response: { data: [] },
    method: 'GET',
    endpoint: '/workflows',
    qs: listQuery,
  },
  {
    resource: 'workflows',
    execute: workflows.execute,
    operation: 'listRuns',
    parameters: { workflowId: 'wf_1' },
    response: { data: [] },
    method: 'GET',
    endpoint: '/workflows/wf_1/runs',
  },
  {
    resource: 'workflows',
    execute: workflows.execute,
    operation: 'getRun',
    parameters: { workflowId: 'wf_1', runId: 'run_1' },
    method: 'GET',
    endpoint: '/workflows/wf_1/runs/run_1',
  },
  {
    resource: 'workflows',
    execute: workflows.execute,
    operation: 'listRunSteps',
    parameters: { workflowId: 'wf_1', runId: 'run_1' },
    response: { data: [] },
    method: 'GET',
    endpoint: '/workflows/wf_1/runs/run_1/steps',
  },
  {
    resource: 'workflows',
    execute: workflows.execute,
    operation: 'getRunStep',
    parameters: { workflowId: 'wf_1', runId: 'run_1', stepId: 'step_1' },
    method: 'GET',
    endpoint: '/workflows/wf_1/runs/run_1/steps/step_1',
  },
];

describe.each(cases)('$resource $operation', ({
  execute,
  operation,
  parameters,
  response,
  method,
  endpoint,
  body,
  qs,
}) => {
  it(`calls ${method} ${endpoint}`, async () => {
    const mock = createExecuteMock({
      parameters,
      response: response ?? { id: 'created' },
    });

    await execute.call(mock.context, 0, operation);

    const options = mock.httpRequest.mock.calls[0][1];
    expect(options.method).toBe(method);
    expect(options.url).toBe(`https://api.resend.com${endpoint}`);
    if (body !== undefined) {
      expect(options.body).toEqual(body);
    }
    if (qs !== undefined) {
      expect(options.qs).toEqual(qs);
    }
  });
});

describe('operation results', () => {
  it('pairs single item responses with the current item', async () => {
    const { context } = createExecuteMock({
      parameters: { topicId: locator('topic_1') },
      response: { id: 'topic_1' },
    });

    await expect(topics.execute.call(context, 3, 'get')).resolves.toEqual([
      { json: { id: 'topic_1' }, pairedItem: { item: 3 } },
    ]);
  });

  it('unwraps nested list responses', async () => {
    const { context } = createExecuteMock({
      parameters: { workflowId: 'wf_1' },
      response: { data: [{ id: 'run_1' }, { id: 'run_2' }] },
    });

    await expect(
      workflows.execute.call(context, 1, 'listRuns'),
    ).resolves.toEqual([
      { json: { id: 'run_1' }, pairedItem: { item: 1 } },
      { json: { id: 'run_2' }, pairedItem: { item: 1 } },
    ]);
  });

  it('returns the raw response when a nested list is empty', async () => {
    const { context } = createExecuteMock({
      parameters: { domainId: locator('dom_1') },
      response: { message: 'no tracking domains' },
    });

    await expect(
      domains.execute.call(context, 0, 'listTrackingDomains'),
    ).resolves.toEqual([
      { json: { message: 'no tracking domains' }, pairedItem: { item: 0 } },
    ]);
  });

  it('omits the limit when returning all sub-resources', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: { contactIdGetTopics: locator('c_1'), returnAll: true },
      response: { data: [] },
    });

    await contacts.execute.call(context, 0, 'getTopics');

    expect(httpRequest.mock.calls[0][1]).not.toHaveProperty('qs');
  });
});

describe('operation validation', () => {
  it('rejects an http webhook endpoint on create', async () => {
    const { context } = createExecuteMock({
      parameters: {
        webhookEndpoint: 'http://example.com/hook',
        webhookEvents: ['email.sent'],
      },
    });

    await expect(webhooks.execute.call(context, 0, 'create')).rejects.toThrow(
      'Invalid webhook endpoint scheme',
    );
  });

  it('rejects an http webhook endpoint on update', async () => {
    const { context } = createExecuteMock({
      parameters: {
        webhookId: locator('wh_1'),
        webhookUpdateFields: { endpoint: 'http://example.com/hook' },
      },
    });

    await expect(webhooks.execute.call(context, 0, 'update')).rejects.toThrow(
      'Invalid webhook endpoint scheme',
    );
  });

  it('requires at least one email for a batch add', async () => {
    const { context } = createExecuteMock({
      parameters: { suppressionEmails: ' , ' },
    });

    await expect(
      suppressions.execute.call(context, 0, 'batchAdd'),
    ).rejects.toThrow('Provide at least one email address to suppress');
  });

  it('caps a batch add at 100 emails', async () => {
    const emails = Array.from(
      { length: 101 },
      (_, i) => `user${i}@example.com`,
    ).join(',');
    const { context } = createExecuteMock({
      parameters: { suppressionEmails: emails },
    });

    await expect(
      suppressions.execute.call(context, 0, 'batchAdd'),
    ).rejects.toThrow('at most 100 email addresses per request');
  });

  it('requires at least one id for a batch remove by id', async () => {
    const { context } = createExecuteMock({
      parameters: { suppressionRemoveBy: 'ids', suppressionIds: '' },
    });

    await expect(
      suppressions.execute.call(context, 0, 'batchRemove'),
    ).rejects.toThrow('Provide at least one suppression ID to remove');
  });

  it('caps a batch remove at 100 entries', async () => {
    const ids = Array.from({ length: 101 }, (_, i) => `sup_${i}`).join(',');
    const { context } = createExecuteMock({
      parameters: { suppressionRemoveBy: 'ids', suppressionIds: ids },
    });

    await expect(
      suppressions.execute.call(context, 0, 'batchRemove'),
    ).rejects.toThrow('at most 100 entries per request');
  });
});

describe('account disconnect', () => {
  const credentials = {
    resendOAuth2Api: {
      clientId: 'client_1',
      oauthTokenData: { refresh_token: 'refresh_1' },
    },
  };

  it('revokes the refresh token', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: { authentication: 'oAuth2' },
      credentials,
    });

    const result = await account.execute.call(context, 0, 'disconnect');

    expect(httpRequest).toHaveBeenCalledWith('resendOAuth2Api', {
      method: 'POST',
      url: 'https://api.resend.com/oauth/revoke',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'n8n-nodes-resend',
      },
      body: {
        client_id: 'client_1',
        token: 'refresh_1',
        token_type_hint: 'refresh_token',
      },
      json: true,
    });
    expect(result).toEqual([
      { json: { disconnected: true }, pairedItem: { item: 0 } },
    ]);
  });

  it('is only available for OAuth2 credentials', async () => {
    const { context } = createExecuteMock({
      parameters: { authentication: 'apiKey' },
      credentials,
    });

    await expect(
      account.execute.call(context, 0, 'disconnect'),
    ).rejects.toThrow(
      "Disconnect is only available when the credential's Authentication is set to OAuth2.",
    );
  });

  it('reports a missing connection', async () => {
    const { context } = createExecuteMock({
      parameters: { authentication: 'oAuth2' },
      credentials: { resendOAuth2Api: { clientId: 'client_1' } },
    });

    await expect(
      account.execute.call(context, 0, 'disconnect'),
    ).rejects.toThrow(
      'No active Resend OAuth connection was found to disconnect.',
    );
  });
});
