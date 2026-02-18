-- add suggestions column to chat_messages

ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS suggestions jsonb;
