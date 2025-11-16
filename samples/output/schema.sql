DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id BIGSERIAL NOT NULL,
    user_name VARCHAR NOT NULL UNIQUE,
    email VARCHAR NOT NULL UNIQUE,
    note VARCHAR,
    demartment_code CHAR NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT users_ak UNIQUE (user_name)
);

COMMENT ON TABLE users IS 'ユーザー';
COMMENT ON COLUMN users.id IS 'ID';
COMMENT ON COLUMN users.user_name IS 'ユーザー名';
COMMENT ON COLUMN users.email IS 'メールアドレス';
COMMENT ON COLUMN users.note IS '説明';
COMMENT ON COLUMN users.demartment_code IS '部署コード';
COMMENT ON COLUMN users.is_deleted IS '削除フラグ';
COMMENT ON COLUMN users.created_at IS '作成日時';

CREATE INDEX users_idx1 ON users (id);
CREATE INDEX users_idx2 ON users (user_name, email, demartment_code);
CREATE INDEX users_idx3 ON users (demartment_code, user_name, email);

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

