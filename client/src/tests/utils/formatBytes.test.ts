import { describe, it, expect } from 'vitest';
import { formatBytes } from '../../components/upload/FileList';

describe('formatBytes', () => {
  it('returns "0 Bytes" for 0', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
  });

  it('formats bytes correctly', () => {
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(1073741824)).toBe('1 GB');
  });

  it('handles decimal precision', () => {
    expect(formatBytes(1536, 1)).toBe('1.5 KB');
  });
});
