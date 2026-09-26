// Type shims for packages without bundled TypeScript definitions.
declare module "exif-parser" {
  interface ExifResult {
    tags: Record<string, string | number | Date>;
    imageSize?: { width?: number; height?: number };
    errors?: string[];
  }
  interface ExifParser {
    enableBinaryFields(enable: boolean): ExifParser;
    enablePointSize(enable: boolean): ExifParser;
    enableTagNameValues(enable: boolean): ExifParser;
    parse(): ExifResult;
  }
  export function create(buffer: Buffer): ExifParser;
}
