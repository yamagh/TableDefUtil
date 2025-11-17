DROP TABLE IF EXISTS user;

CREATE TABLE user (
    id BIGSERIAL NOT NULL,
    user_name VARCHAR NOT NULL UNIQUE,
    email VARCHAR NOT NULL UNIQUE,
    note VARCHAR,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    demartment_code CHAR NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT user_ak UNIQUE (user_name)
);

COMMENT ON TABLE user IS 'ユーザー';
COMMENT ON COLUMN user.id IS 'ID';
COMMENT ON COLUMN user.user_name IS 'ユーザー名';
COMMENT ON COLUMN user.email IS 'メールアドレス';
COMMENT ON COLUMN user.note IS '説明';
COMMENT ON COLUMN user.is_admin IS '管理者フラグ';
COMMENT ON COLUMN user.demartment_code IS '部署コード';
COMMENT ON COLUMN user.is_deleted IS '削除フラグ';
COMMENT ON COLUMN user.created_at IS '作成日時';

CREATE INDEX user_idx1 ON user (id);
CREATE INDEX user_idx2 ON user (user_name, email, demartment_code);
CREATE INDEX user_idx3 ON user (demartment_code, user_name, email);

-- --------------------------------------------------

DROP TABLE IF EXISTS department;

CREATE TABLE department (
    id BIGSERIAL NOT NULL,
    code CHAR NOT NULL,
    description VARCHAR,
    name VARCHAR NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT department_ak UNIQUE (code)
);

COMMENT ON TABLE department IS '部署';
COMMENT ON COLUMN department.id IS 'ID';
COMMENT ON COLUMN department.code IS '部署コード';
COMMENT ON COLUMN department.description IS '説明';
COMMENT ON COLUMN department.name IS '部署名';
COMMENT ON COLUMN department.created_at IS '作成日時';

CREATE INDEX department_idx1 ON department (id);
CREATE INDEX department_idx2 ON department (code);

-- --------------------------------------------------

