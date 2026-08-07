// Storage Provider Configuration Factory
import { IStorageProvider } from '../storage/interface.js';
import { MinioAdapter } from '../storage/minio.adapter.js';
import { env } from './env.js';

export function createStorageProvider(): IStorageProvider {
  // Can add conditional logic here for different providers based on env.STORAGE_PROVIDER
  return new MinioAdapter();
}

export const storage: IStorageProvider = createStorageProvider();
