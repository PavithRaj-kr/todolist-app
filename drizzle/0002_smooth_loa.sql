ALTER TABLE "chat_messages" DROP CONSTRAINT "chat_messages_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "chat_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_chat_id_users_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" DROP COLUMN "user_id";