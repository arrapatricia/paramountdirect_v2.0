import { S3Client } from '@aws-sdk/client-s3';

export const s3Bucket = process.env.AWS_S3_BUCKET ?? '';

export const s3Client = new S3Client({
  region: process.env.AWS_REGION ?? 'ap-southeast-1',
  credentials: process.env.AWS_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
      }
    : undefined,
});
