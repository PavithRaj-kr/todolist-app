ALTER TABLE "chat_messages" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "chat_messages" ALTER COLUMN "id" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "chat_messages" ALTER COLUMN "chat_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "chats" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "chats" ALTER COLUMN "id" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "suggestions" json;