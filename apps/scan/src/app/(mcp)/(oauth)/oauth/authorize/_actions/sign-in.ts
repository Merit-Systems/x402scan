'use server';

import { signIn as signInAuth } from '@/auth';

export const signIn = async () => {
  return await signInAuth('permi');
};
