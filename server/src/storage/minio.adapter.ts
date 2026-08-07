// MinIO / S3 Storage Adapter
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, DeleteObjectsCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { IStorageProvider } from './interface.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { Readable } from 'stream';

export class MinioAdapter implements IStorageProvider {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = env.STORAGE_BUCKET;
    this.client = new S3Client({
      endpoint: env.STORAGE_ENDPOINT,
      region: env.STORAGE_REGION,
      credentials: {
        accessKeyId: env.STORAGE_ACCESS_KEY,
        secretAccessKey: env.STORAGE_SECRET_KEY,
      },
      forcePathStyle: true, // Required for MinIO
    });
  }

  async upload(key: string, data: Buffer | ReadableStream | NodeJS.ReadableStream, contentType?: string): Promise<void> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: data as any,
        ContentType: contentType,
      });
      await this.client.send(command);
    } catch (error) {
      logger.error({ error, key }, 'Error uploading object to storage');
      throw error;
    }
  }

  async download(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      const response = await this.client.send(command);
      const stream = response.Body as Readable;
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    } catch (error) {
      logger.error({ error, key }, 'Error downloading object from storage');
      throw error;
    }
  }

  async getStream(key: string): Promise<NodeJS.ReadableStream> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      const response = await this.client.send(command);
      return response.Body as NodeJS.ReadableStream;
    } catch (error) {
      logger.error({ error, key }, 'Error getting object stream from storage');
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.client.send(command);
    } catch (error) {
      logger.error({ error, key }, 'Error deleting object from storage');
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      logger.error({ error, key }, 'Error checking if object exists in storage');
      throw error;
    }
  }

  async getSignedUrl(key: string, expiresInSeconds: number): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      return await getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
    } catch (error) {
      logger.error({ error, key }, 'Error generating signed URL');
      throw error;
    }
  }

  async deleteMany(keys: string[]): Promise<void> {
    if (!keys.length) return;
    try {
      const command = new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: {
          Objects: keys.map(Key => ({ Key })),
        },
      });
      await this.client.send(command);
    } catch (error) {
      logger.error({ error, keysCount: keys.length }, 'Error deleting multiple objects');
      throw error;
    }
  }
}
