import { createHash, createHmac } from 'node:crypto';
import type { ObjectPutResult, SimpleOwnerObjectStore } from './types';

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  jurisdiction?: string;
};

export function readR2Config(
  env: Record<string, string | undefined> = process.env,
): R2Config | null {
  const accountId = env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = env.R2_BUCKET?.trim();
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null;
  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    jurisdiction: env.R2_JURISDICTION?.trim() || undefined,
  };
}

export function createMemoryObjectStore(): SimpleOwnerObjectStore & {
  objects: Map<string, { bytes: Uint8Array; contentType: string; operatorId: string }>;
} {
  const objects = new Map<string, { bytes: Uint8Array; contentType: string; operatorId: string }>();
  return {
    objects,
    async put({ operatorId, objectKey, bytes, contentType }) {
      objects.set(objectKey, { bytes, contentType, operatorId });
      return { objectKey, storageBackend: 'memory' };
    },
  };
}

export function createR2ObjectStore(
  config: R2Config,
  fetchImpl: typeof fetch = fetch,
): SimpleOwnerObjectStore {
  return {
    async put({ objectKey, bytes, contentType }) {
      const host = config.jurisdiction
        ? `${config.accountId}.${config.jurisdiction}.r2.cloudflarestorage.com`
        : `${config.accountId}.r2.cloudflarestorage.com`;
      const url = `https://${host}/${config.bucket}/${objectKey}`;
      const headers = signR2Put({
        config,
        host,
        objectKey,
        bytes,
        contentType,
        now: new Date(),
      });
      const res = await fetchImpl(url, { method: 'PUT', headers, body: Buffer.from(bytes) });
      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(`R2 put failed (${res.status})${detail ? `: ${detail.slice(0, 180)}` : ''}`);
      }
      return { objectKey, storageBackend: 'r2' };
    },
  };
}

export function signR2Put(input: {
  config: R2Config;
  host: string;
  objectKey: string;
  bytes: Uint8Array;
  contentType: string;
  now: Date;
}): Record<string, string> {
  const { config, host, objectKey, bytes, contentType, now } = input;
  const amzDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(bytes);
  const canonicalUri = `/${config.bucket}/${objectKey.split('/').map(encodeURIComponent).join('/')}`;
  const canonicalHeaders =
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = [
    'PUT',
    canonicalUri,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');
  const region = 'auto';
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');
  const signingKey = getSignatureKey(config.secretAccessKey, dateStamp, region, 's3');
  const signature = hmacHex(signingKey, stringToSign);
  return {
    Authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    'Content-Type': contentType,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
    Host: host,
  };
}

function sha256Hex(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex');
}

function hmac(key: Buffer | string, value: string): Buffer {
  return createHmac('sha256', key).update(value).digest();
}

function hmacHex(key: Buffer, value: string): string {
  return createHmac('sha256', key).update(value).digest('hex');
}

function getSignatureKey(secret: string, dateStamp: string, region: string, service: string): Buffer {
  const kDate = hmac(`AWS4${secret}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, 'aws4_request');
}

export function createNeonFallbackObjectStore(putBlob: (input: {
  operatorId: string;
  objectKey: string;
  contentType: string;
  payloadB64: string;
}) => Promise<void>): SimpleOwnerObjectStore {
  return {
    async put({ operatorId, objectKey, bytes, contentType }) {
      await putBlob({
        operatorId,
        objectKey,
        contentType,
        payloadB64: Buffer.from(bytes).toString('base64'),
      });
      return { objectKey, storageBackend: 'neon-object-fallback' };
    },
  };
}
