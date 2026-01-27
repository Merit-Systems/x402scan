import { z } from 'zod';

import { tasks } from '../_data/tasks';

export const taskSchema = z.enum(Object.keys(tasks));
