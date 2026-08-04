import { describe, expect, it } from 'vitest';
import { isRemoteImagePath } from './image-path';

describe('remote image paths', () => {
  it('accepts http and https image URLs', () => {
    expect(isRemoteImagePath('https://example.com/logo.png')).toBe(true);
    expect(isRemoteImagePath('HTTP://example.com/logo.bmp')).toBe(true);
  });

  it('rejects local paths and non-http URL schemes', () => {
    expect(isRemoteImagePath('/tmp/logo.png')).toBe(false);
    expect(isRemoteImagePath('file:///tmp/logo.png')).toBe(false);
    expect(isRemoteImagePath('data:image/png;base64,AA==')).toBe(false);
  });
});
