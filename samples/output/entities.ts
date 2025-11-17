/**
 * @type User ユーザー
 */
export type User = {
  /** ID */
  id?: number;
  /** ユーザー名 */
  userName?: string;
  /** メールアドレス */
  email?: string;
  /** 説明 */
  note?: string;
  /** 管理者フラグ */
  isAdmin?: boolean;
  /** 部署コード */
  demartmentCode?: string;
  /** 削除フラグ */
  isDeleted?: boolean;
  /** 作成日時 */
  createdAt?: string;
};

/**
 * @type Department 部署
 */
export type Department = {
  /** ID */
  id?: number;
  /** 部署コード */
  code?: string;
  /** 説明 */
  description?: string;
  /** 部署名 */
  name?: string;
  /** 作成日時 */
  createdAt?: string;
};

