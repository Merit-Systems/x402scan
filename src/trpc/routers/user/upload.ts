import { octetInputParser } from '@trpc/server/http';

import { createTRPCRouter, protectedProcedure } from '../../trpc';
import { put } from '@vercel/blob';
import { env } from '@/env';
import { TRPCError } from '@trpc/server';

export const uploadRouter = createTRPCRouter({
  image: protectedProcedure
    .input(octetInputParser)
    .mutation(async ({ ctx, input }) => {
      if (!env.BLOB_READ_WRITE_TOKEN) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'BLOB_READ_WRITE_TOKEN is not defined.',
        });
      }

      const fileName = `${ctx.session.user.id}-${Date.now()}`;

      // Convert ReadableStream to Uint8Array
      const chunks: Uint8Array[] = [];
      const reader = input.getReader();

      try {
        while (true) {
          const value = await reader.read();
          if (value.done) break;
          chunks.push(value.value as Uint8Array);
        }
      } finally {
        reader.releaseLock();
      }

      // Combine chunks into a single Uint8Array
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }

      // Detect file type based on magic bytes
      const detectFileType = (
        bytes: Uint8Array
      ): { mimeType: string; extension: string } => {
        // Check for JPEG (FF D8 FF)
        if (
          bytes.length >= 3 &&
          bytes[0] === 0xff &&
          bytes[1] === 0xd8 &&
          bytes[2] === 0xff
        ) {
          return { mimeType: 'image/jpeg', extension: '.jpg' };
        }

        // Check for PNG (89 50 4E 47)
        if (
          bytes.length >= 4 &&
          bytes[0] === 0x89 &&
          bytes[1] === 0x50 &&
          bytes[2] === 0x4e &&
          bytes[3] === 0x47
        ) {
          return { mimeType: 'image/png', extension: '.png' };
        }

        // Check for SVG (look for '<svg' or '<?xml' at the beginning)
        const textDecoder = new TextDecoder('utf-8');
        const firstBytes = textDecoder
          .decode(bytes.slice(0, Math.min(100, bytes.length)))
          .toLowerCase();
        if (
          firstBytes.includes('<svg') ||
          (firstBytes.includes('<?xml') && firstBytes.includes('<svg'))
        ) {
          return { mimeType: 'image/svg+xml', extension: '.svg' };
        }

        // Check for WebP (52 49 46 46 ... 57 45 42 50)
        if (
          bytes.length >= 12 &&
          bytes[0] === 0x52 &&
          bytes[1] === 0x49 &&
          bytes[2] === 0x46 &&
          bytes[3] === 0x46 &&
          bytes[8] === 0x57 &&
          bytes[9] === 0x45 &&
          bytes[10] === 0x42 &&
          bytes[11] === 0x50
        ) {
          return { mimeType: 'image/webp', extension: '.webp' };
        }

        // Default to JPEG if unable to detect
        return { mimeType: 'image/jpeg', extension: '.jpg' };
      };

      const { mimeType, extension } = detectFileType(combined);
      const file = new File([combined], fileName + extension, {
        type: mimeType,
      });

      const blob = await put(fileName, file, {
        access: 'public',
      });

      return {
        url: blob.url,
      };
    }),
});
