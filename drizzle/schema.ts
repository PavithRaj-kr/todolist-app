import { pgTable, foreignKey, serial, text, boolean, integer, timestamp, unique } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const todos = pgTable("todos", {
	id: serial().primaryKey().notNull(),
	text: text().notNull(),
	completed: boolean().default(false).notNull(),
	userId: integer("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "todos_user_id_users_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	email: text().notNull(),
	password: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);
