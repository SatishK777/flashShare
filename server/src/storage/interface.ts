// Storage Provider Interface
import { Readable } from 'stream';

export interface IStorageProvider {
  upload(key: string, data: Buffer | ReadableStream | NodeJS.ReadableStream, contentType?: string): Promise<void>;
  download(key: string): Promise<Buffer>;
  getStream(key: string): Promise<NodeJS.ReadableStream>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getSignedUrl(key: string, expiresInSeconds: number): Promise<string>;
  deleteMany(keys: string[]): Promise<void>;
}
