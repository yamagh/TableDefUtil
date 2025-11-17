import { z } from 'zod';
import { UserSchema, DepartmentSchema } from './schemas'; // Assuming schemas are in a file named schemas.ts

/**
 * @type User ユーザー
 */
export type User = z.infer<typeof UserSchema>;

/**
 * @type Department 部署
 */
export type Department = z.infer<typeof DepartmentSchema>;

