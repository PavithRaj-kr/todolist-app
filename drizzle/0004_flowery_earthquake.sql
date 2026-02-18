ALTER TABLE "chat_messages" ALTER COLUMN "id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "chat_messages" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "chat_messages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "chat_messages" ALTER COLUMN "chat_id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "chats" ALTER COLUMN "id" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "chats" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (sequence name "chats_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1);