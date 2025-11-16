import { z } from 'zod';
import { UsersSchema, DepartmentSchema } from './schemas'; // Assuming schemas are in a file named schemas.ts

/**
 * @type Users ユーザー
 */
export type Users = z.infer<typeof UsersSchema>;

/**
 * @type Department 部署
 */
export type Department = z.infer<typeof DepartmentSchema>;

