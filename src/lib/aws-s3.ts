import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let s3Client: S3Client | null = null;

function isConfigured() {
  return Boolean(
    process.env.AWS_REGION &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.S3_BUCKET,
  );
}

export function getS3Client(): S3Client | null {
  if (!isConfigured()) return null;
  if (s3Client) return s3Client;
  s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });
  return s3Client;
}

export async function getPresignedPutUrl(params: {
  key: string;
  contentType: string;
  expiresIn?: number;
}): Promise<{ url: string; key: string } | null> {
  const client = getS3Client();
  const bucket = process.env.S3_BUCKET;
  if (!client || !bucket) return null;
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: params.key,
    ContentType: params.contentType,
  });
  const url = await getSignedUrl(client, command, { expiresIn: params.expiresIn ?? 900 });
  return { url, key: params.key };
}
