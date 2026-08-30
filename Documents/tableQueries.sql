-- CREATE OR REPLACE FUNCTION update_timestamp()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   NEW.updated_at = CURRENT_TIMESTAMP;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TABLE users (
--     user_id SERIAL PRIMARY KEY,
--     username VARCHAR(50) NOT NULL ,
--     email VARCHAR(100) NOT NULL UNIQUE,
--     age INT NOT NULL,
--     password VARCHAR(255) NOT NULL
-- );

-- CREATE TABLE tasks (
--     task_id SERIAL PRIMARY KEY,
--     task_title VARCHAR(255) NOT NULL,
--     task_description VARCHAR(255),
--     task_status VARCHAR(50) NOT NULL DEFAULT 'Not Started',
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     created_by INT NOT NULL,
--     owner_id INT NOT NULL,
--     acceptance BOOLEAN DEFAULT false,
--     category VARCHAR(50),

--     FOREIGN KEY (owner_id) REFERENCES users(user_id)
--         ON UPDATE CASCADE
--         ON DELETE CASCADE,
    
--     FOREIGN KEY (created_by) REFERENCES users(user_id)
--         ON UPDATE CASCADE
--         ON DELETE CASCADE
-- );

-- CREATE TRIGGER set_timestamp_tasks
-- BEFORE UPDATE ON tasks
-- FOR EACH ROW
-- EXECUTE FUNCTION update_timestamp();

-- CREATE TABLE friend_list (
--     user_id INT NOT NULL,
--     friend_id INT NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     display_name VARCHAR(50),
--     user_accept BOOLEAN,
--     friend_accept BOOLEAN,

--     PRIMARY KEY(user_id,friend_id),

--     FOREIGN KEY (user_id) REFERENCES users(user_id)
--         ON UPDATE CASCADE
--         ON DELETE CASCADE,

--     FOREIGN KEY (friend_id) REFERENCES users(user_id)
--         ON UPDATE CASCADE
--         ON DELETE CASCADE

-- );

-- CREATE TABLE task_comments (
--     comment_id SERIAL PRIMARY KEY,
--     task_id INT NOT NULL,
--     commenter_id INT NOT NULL,
--     task_comment TEXT NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     emotion VARCHAR(50),

--     FOREIGN KEY (task_id) REFERENCES tasks(task_id)
--         ON UPDATE CASCADE
--         ON DELETE CASCADE,
    
--     FOREIGN KEY (commenter_id) REFERENCES users(user_id)
--         ON UPDATE CASCADE
--         ON DELETE CASCADE
-- );

-- CREATE TABLE chat_rooms (
--     room_id SERIAL PRIMARY KEY,
--     room_name TEXT NOT NULL,
--     room_owner INT REFERENCES users(user_id)
-- );

-- CREATE TABLE room_members (
--     room_id INT NOT NULL,
--     member_id INT NOT NULL,
--     member_display_name TEXT,
--     joined_at TIMESTAMP DEFAULT NOW(),
--     member_accept bool DEFAULT false,
--     PRIMARY KEY (room_id, member_id),

--     FOREIGN KEY (room_id) REFERENCES chat_rooms(room_id)
--         ON UPDATE CASCADE
--         ON DELETE CASCADE,
    
--     FOREIGN KEY (member_id) REFERENCES users(user_id)
--         ON UPDATE CASCADE
--         ON DELETE CASCADE
-- );

-- CREATE TABLE messages (
--     message_id SERIAL PRIMARY KEY,
--     room_id INT NOT NULL,
--     messenger_id INT NOT NULL,
--     message_content TEXT NOT NULL,
--     sent_at TIMESTAMP DEFAULT NOW(),
    
--     FOREIGN KEY (room_id) REFERENCES chat_rooms(room_id)
--         ON UPDATE CASCADE
--         ON DELETE CASCADE,

--     FOREIGN KEY (messenger_id) REFERENCES users(user_id)
--         ON UPDATE CASCADE
--         ON DELETE CASCADE
-- );

CREATE TABLE room_tasks(
    task_id SERIAL PRIMARY KEY,
    room_id INT NOT NULL,
    task_title VARCHAR(255) NOT NULL,
    task_description VARCHAR(255),
    task_status VARCHAR(50) NOT NULL DEFAULT 'Not Started',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_by INT,
    category VARCHAR(50),

    FOREIGN KEY (room_id) REFERENCES chat_rooms(room_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    FOREIGN KEY (created_by) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

CREATE TRIGGER set_timestamp_room_tasks
BEFORE UPDATE ON room_tasks
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TABLE room_task_comments (
    comment_id SERIAL PRIMARY KEY,
    task_id INT NOT NULL,
    commenter_id INT NOT NULL,
    task_comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    emotion VARCHAR(50),

    FOREIGN KEY (task_id) REFERENCES room_tasks(task_id)
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
-- drop table chat_rooms;
-- drop table room_members;
-- drop table messages;
-- drop table room_tasks
-- drop table room_task_comments
