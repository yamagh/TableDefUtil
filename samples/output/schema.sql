DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id BIGSERIAL DEFAULT -,
    user_name VARCHAR NOT NULL,
    email VARCHAR NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT users_ak UNIQUE (user_name)
);

COMMENT ON TABLE users IS 'ユーザー';
COMMENT ON COLUMN users.id IS 'ID';
COMMENT ON COLUMN users.user_name IS 'ユーザー名';
COMMENT ON COLUMN users.email IS 'メールアドレス';
COMMENT ON COLUMN users.created_at IS '作成日時';

CREATE INDEX users_idx1 ON users (user_name);

-- --------------------------------------------------

