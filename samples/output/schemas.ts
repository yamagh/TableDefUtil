import { z } from 'zod';

/**
 * ユーザー
 */
export const UsersSchema = z.object({
  id: z.number().describe('ID'),
  userName: z.string().min(1).max(255).describe('ユーザー名'),
  email: z.string().min(1).max(255).describe('メールアドレス'),
  createdAt: z.iso.datetime().describe('作成日時'),
});

