import { z } from 'zod';
import { UsersSchema } from './schemas'; // Assuming schemas are in a file named schemas.ts

/**
 * @type Users ユーザー
 */
export type Users = z.infer<typeof UsersSchema>;

