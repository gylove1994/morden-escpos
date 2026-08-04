const HTTP_IMAGE_URL = /^https?:\/\//i;

export function isRemoteImagePath(path: string): boolean {
  return HTTP_IMAGE_URL.test(path);
}
