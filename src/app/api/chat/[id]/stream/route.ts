import { auth } from '@/auth';
import { getChatStreamId } from '@/services/db/composer/chat';
import { UI_MESSAGE_STREAM_HEADERS } from 'ai';
import { after } from 'next/server';
import { createResumableStreamContext } from 'resumable-stream';

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth();

  const chat = await getChatStreamId(id, session?.user.id);

  if (chat?.activeStreamId == null) {
    // no content response when there is no active stream
    return new Response(null, { status: 204 });
  }

  const streamContext = createResumableStreamContext({
    waitUntil: after,
  });

  return new Response(
    await streamContext.resumeExistingStream(chat.activeStreamId),
    { headers: UI_MESSAGE_STREAM_HEADERS }
  );
}
