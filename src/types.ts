import { z } from "zod";

export interface SyncResponse {
    syncUpdatedToken: string;
    syncDeletedToken: string;
    ready: boolean;
}
export interface SyncUpdatedResponse {
    nextPageToken?: string;
    nextDeltaToken: string;
    records: EmailMessage[];
}
export interface SyncDeletedResponse {
    nextPageToken?: string;
    nextDeltaToken: string;
    records: EmailMessage[];
}

export const emailAddressSchema = z.object({
    name: z.string(),
    address: z.string(),
})

export const emailHeaderSchema = z.object({
    name: z.string(),
    value: z.string(),
})

export const emailAttachmentSchema = z.object({
    id: z.string(),
    name: z.string(),
    mimeType: z.string(),
    size: z.number(),
    inline: z.boolean(),
    contentId: z.string().optional(),
    content: z.string().optional(),
    contentLocation: z.string().optional(),
})

export const emailMessageSchema = z.object({
    id: z.string(),
    threadId: z.string(),
    createdTime: z.string(),
    lastModifiedTime: z.string(),
    sentAt: z.string(),
    receivedAt: z.string(),
    internetMessageId: z.string(),
    subject: z.string(),
    sysLabels: z.array(
        z.enum(['junk', 'trash', 'sent', 'inbox', 'unread', 'flagged', 'important', 'draft'])
    ),
    keywords: z.array(z.string()),
    sysClassifications: z.array(
        z.enum(['personal', 'social', 'promotions', 'updates', 'forums'])
    ),
    sensitivity: z.enum(['normal', 'private', 'personal', 'confidential']),
    meetingMessageMethod: z
        .enum(['request', 'reply', 'cancel', 'counter', 'other'])
        .optional(),
    from: emailAddressSchema,
    to: z.array(emailAddressSchema),
    cc: z.array(emailAddressSchema),
    bcc: z.array(emailAddressSchema),
    replyTo: z.array(emailAddressSchema),
    hasAttachments: z.boolean(),
    body: z.string().optional(),
    bodySnippet: z.string().optional(),
    attachments: z.array(emailAttachmentSchema),
    inReplyTo: z.string().optional(),
    references: z.string().optional(),
    threadIndex: z.string().optional(),
    internetHeaders: z.array(emailHeaderSchema),
    nativeProperties: z.record(z.string()),
    folderId: z.string().optional(),
    omitted: z.array(
        z.enum(['threadId', 'body', 'attachments', 'recipients', 'internetHeaders'])
    ),
})

export interface EmailMessage {
    id: string;
    threadId: string;
    createdTime: string;
    lastModifiedTime: string;
    sentAt: string;
    receivedAt: string;
    internetMessageId: string;
    subject: string;
    sysLabels: Array<"junk" | "trash" | "sent" | "inbox" | "unread" | "flagged" | "important" | "draft">;
    keywords: string[];
    sysClassifications: Array<"personal" | "social" | "promotions" | "updates" | "forums">;
    sensitivity: "normal" | "private" | "personal" | "confidential";
    meetingMessageMethod?: "request" | "reply" | "cancel" | "counter" | "other";
    from: EmailAddress;
    to: EmailAddress[];
    cc: EmailAddress[];
    bcc: EmailAddress[];
    replyTo: EmailAddress[];
    hasAttachments: boolean;
    body?: string;
    bodySnippet?: string;
    attachments: EmailAttachment[];
    inReplyTo?: string;
    references?: string;
    threadIndex?: string;
    internetHeaders: EmailHeader[];
    nativeProperties: Record<string, string>;
    folderId?: string;
    omitted: Array<"threadId" | "body" | "attachments" | "recipients" | "internetHeaders">;
}

export interface EmailAddress {
    name?: string;
    address: string;
    raw?: string;
}

export interface EmailAttachment {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    inline: boolean;
    contentId?: string;
    content?: string;
    contentLocation?: string;
}

export interface EmailHeader {
    name: string;
    value: string;
}