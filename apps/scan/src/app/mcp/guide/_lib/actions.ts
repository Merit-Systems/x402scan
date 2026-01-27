'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { GUIDE_COOKIE_KEYS } from './cookies/keys';
import { taskSchema } from './schemas';

export async function selectTask(formData: FormData) {
  const taskRaw = formData.get('task');
  const parsed = taskSchema.safeParse(taskRaw);

  if (!parsed.success) {
    return;
  }

  const task = parsed.data;
  const cookieStore = await cookies();
  cookieStore.set(GUIDE_COOKIE_KEYS.SELECTED_TASK, task);

  redirect(`/mcp/guide/${task}`);
}
