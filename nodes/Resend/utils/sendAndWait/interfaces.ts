import type { IDataObject } from 'n8n-workflow';

export interface IEmail {
  from?: string;
  to?: string;
  cc?: string;
  bcc?: string;
  replyTo?: string;
  inReplyTo?: string;
  reference?: string;
  references?: string;
  subject: string;
  body: string;
  htmlBody?: string;
  attachments?: IDataObject[];
}

export type SendAndWaitConfig = {
  title: string;
  message: string;
  options: Array<{ label: string; url: string; style: string }>;
  appendAttribution?: boolean;
};

export type FormResponseTypeOptions = {
  messageButtonLabel?: string;
  responseFormTitle?: string;
  responseFormDescription?: string;
  responseFormButtonLabel?: string;
};
