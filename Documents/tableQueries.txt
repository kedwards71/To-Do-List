CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL ,
    email VARCHAR(100) NOT NULL UNIQUE,
    age INT NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE tasks (
    task_id SERIAL PRIMARY KEY,
    task_title VARCHAR(255) NOT NULL,
    task_description VARCHAR(255),
    task_status VARCHAR(50) NOT NULL DEFAULT 'Not Started',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    owner_id INT NOT NULL,
    acceptance BOOLEAN DEFAULT false,
    category VARCHAR(50),

    FOREIGN KEY (owner_id) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    
    FOREIGN KEY (created_by) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TRIGGER set_timestamp_tasks
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TABLE friend_list (
    user_id INT NOT NULL,
    friend_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    display_name VARCHAR(50),
    user_accept BOOLEAN,
    friend_accept BOOLEAN,

    PRIMARY KEY(user_id,friend_id),

    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    FOREIGN KEY (friend_id) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE

);

CREATE TABLE task_comments (
    comment_id SERIAL PRIMARY KEY,
    task_id INT NOT NULL,
    commenter_id INT NOT NULL,
    task_comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    emotion VARCHAR(50),

    FOREIGN KEY (task_id) REFERENCES tasks(task_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    
    FOREIGN KEY (commenter_id) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- drop table task_comments;
-- drop table friend_list;
-- drop table tasks;
-- drop table users;