/**
 * Gmail API fetch utilities.
 * All functions accept a raw (decrypted) access_token — never stored.
 * Throws 'gmail_auth_expired' on 401 so callers can refresh and retry.
 */

export interface GmailMessage {
  id: string;
  threadId: string;
}

export interface GmailHeader {
  name: string;
  value: string;
}

export interface ParsedEmail {
  messageId: string;
  threadId: string;
  subject: string;
  fromEmail: string;
  fromName: string;
  toEmail: string[];
  ccEmail: string[];
  receivedAt: Date;
  snippet: string;
  bodyText: string;
  bodyHtml: string;
  labels: string[];
  attachments: Array<{
    name: string;
    mimeType: string;
    size: number;
    attachmentId: string;
  }>;
  rawHeaders: Record<string, string>;
}

// ── Internal types for raw Gmail API responses ──────────────────────────────

interface GmailMessagePart {
  mimeType: string;
  filename?: string;
  headers?: GmailHeader[];
  body?: {
    data?: string;
    attachmentId?: string;
    size?: number;
  };
  parts?: GmailMessagePart[];
}

interface GmailRawMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  internalDate: string;
  payload: GmailMessagePart;
}

interface GmailListResponse {
  messages?: GmailMessage[];
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

interface GmailHistoryResponse {
  history?: Array<{
    id: string;
    messagesAdded?: Array<{ message: GmailMessage }>;
  }>;
  nextPageToken?: string;
  historyId?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function gmailFetch<T>(
  accessToken: string,
  url: string
): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 401) {
    throw new Error("gmail_auth_expired");
  }

  if (!res.ok) {
    throw new Error(`gmail_api_error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

function getHeader(headers: GmailHeader[], name: string): string {
  return (
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ??
    ""
  );
}

function parseEmailAddresses(raw: string): string[] {
  if (!raw) return [];
  return raw.split(",").map((addr) => {
    const match = addr.match(/<([^>]+)>/);
    return (match ? match[1] : addr).trim();
  });
}

function parseFromField(raw: string): { fromEmail: string; fromName: string } {
  if (!raw) return { fromEmail: "", fromName: "" };
  const match = raw.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) {
    return {
      fromName: match[1].replace(/^"|"$/g, "").trim(),
      fromEmail: match[2].trim(),
    };
  }
  return { fromEmail: raw.trim(), fromName: raw.trim() };
}

function decodeBase64Url(data: string): string {
  return Buffer.from(data, "base64url").toString("utf-8");
}

// ── Exported: parseEmailBody ─────────────────────────────────────────────────

export function parseEmailBody(payload: GmailMessagePart): {
  bodyText: string;
  bodyHtml: string;
  attachments: ParsedEmail["attachments"];
} {
  let bodyText = "";
  let bodyHtml = "";
  const attachments: ParsedEmail["attachments"] = [];

  function walk(part: GmailMessagePart): void {
    const mime = part.mimeType ?? "";

    if (mime === "text/plain" && part.body?.data) {
      bodyText += decodeBase64Url(part.body.data);
    } else if (mime === "text/html" && part.body?.data) {
      bodyHtml += decodeBase64Url(part.body.data);
    } else if (
      !mime.startsWith("text/") &&
      !mime.startsWith("multipart/") &&
      part.filename &&
      part.body?.attachmentId
    ) {
      attachments.push({
        name: part.filename,
        mimeType: mime,
        size: part.body.size ?? 0,
        attachmentId: part.body.attachmentId,
      });
    }

    if (part.parts) {
      for (const child of part.parts) {
        walk(child);
      }
    }
  }

  walk(payload);
  return { bodyText, bodyHtml, attachments };
}

// ── Exported: getEmailList ───────────────────────────────────────────────────

export async function getEmailList(
  accessToken: string,
  options: {
    maxResults?: number;
    pageToken?: string;
    query?: string;
    labelIds?: string[];
  } = {}
): Promise<{
  messages: GmailMessage[];
  nextPageToken?: string;
  resultSizeEstimate: number;
}> {
  const params = new URLSearchParams();
  if (options.maxResults) params.set("maxResults", String(options.maxResults));
  if (options.pageToken) params.set("pageToken", options.pageToken);
  if (options.query) params.set("q", options.query);
  if (options.labelIds?.length) {
    options.labelIds.forEach((id) => params.append("labelIds", id));
  }

  const url = `https://www.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`;
  const data = await gmailFetch<GmailListResponse>(accessToken, url);

  return {
    messages: data.messages ?? [],
    nextPageToken: data.nextPageToken,
    resultSizeEstimate: data.resultSizeEstimate ?? 0,
  };
}

// ── Exported: getEmailDetail ─────────────────────────────────────────────────

export async function getEmailDetail(
  accessToken: string,
  messageId: string
): Promise<ParsedEmail> {
  const url = `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`;
  const msg = await gmailFetch<GmailRawMessage>(accessToken, url);

  const headers: GmailHeader[] = msg.payload.headers ?? [];
  const rawHeaders: Record<string, string> = {};
  for (const h of headers) {
    rawHeaders[h.name] = h.value;
  }

  const fromRaw = getHeader(headers, "From");
  const { fromEmail, fromName } = parseFromField(fromRaw);

  const toRaw = getHeader(headers, "To");
  const ccRaw = getHeader(headers, "Cc");

  const { bodyText, bodyHtml, attachments } = parseEmailBody(msg.payload);

  return {
    messageId: msg.id,
    threadId: msg.threadId,
    subject: getHeader(headers, "Subject"),
    fromEmail,
    fromName,
    toEmail: parseEmailAddresses(toRaw),
    ccEmail: parseEmailAddresses(ccRaw),
    receivedAt: new Date(parseInt(msg.internalDate, 10)),
    snippet: msg.snippet,
    bodyText,
    bodyHtml,
    labels: msg.labelIds ?? [],
    attachments,
    rawHeaders,
  };
}

// ── Exported: getHistory ─────────────────────────────────────────────────────

export async function getHistory(
  accessToken: string,
  startHistoryId: string,
  options: {
    maxResults?: number;
    historyTypes?: string[];
  } = {}
): Promise<{
  history: Array<{
    id: string;
    messagesAdded?: Array<{ message: GmailMessage }>;
  }>;
  nextPageToken?: string;
  historyId: string;
}> {
  const params = new URLSearchParams({
    startHistoryId,
  });

  const historyTypes = options.historyTypes ?? ["messageAdded"];
  historyTypes.forEach((t) => params.append("historyTypes", t));

  if (options.maxResults) {
    params.set("maxResults", String(options.maxResults));
  }

  const url = `https://www.googleapis.com/gmail/v1/users/me/history?${params.toString()}`;
  const data = await gmailFetch<GmailHistoryResponse>(accessToken, url);

  return {
    history: data.history ?? [],
    nextPageToken: data.nextPageToken,
    historyId: data.historyId ?? startHistoryId,
  };
}
