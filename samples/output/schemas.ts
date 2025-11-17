import { z } from 'zod';

/**
 * ユーザー
 */
export const UserSchema = z.object({
  id: z.number().describe('ID'),
  userName: z.string().min(1).max(255).describe('ユーザー名'),
  email: z.string().min(1).max(255).describe('メールアドレス'),
  note: z.string().describe('説明'),
  isAdmin: z.boolean().describe('管理者フラグ'),
  demartmentCode: z.string().min(1).max(3).describe('部署コード'),
  isDeleted: z.boolean().describe('削除フラグ'),
  createdAt: z.iso.datetime().describe('作成日時'),
});

/**
 * 部署
 */
export const DepartmentSchema = z.object({
  id: z.number().describe('ID'),
  code: z.string().min(1).max(3).describe('部署コード'),
  description: z.string().describe('説明'),
  name: z.string().min(1).max(256).describe('部署名'),
  createdAt: z.iso.datetime().describe('作成日時'),
});

