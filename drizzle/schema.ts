import { pgTable, index, foreignKey, check, serial, text, varchar, integer, boolean, timestamp, date, unique, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const tasks = pgTable("tasks", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	label: varchar({ length: 20 }),
	columnName: varchar("column_name", { length: 50 }).notNull(),
	position: integer().default(0).notNull(),
	parentId: integer("parent_id"),
	completed: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	weekStartDate: date("week_start_date"),
	linkedTaskId: integer("linked_task_id"),
	originColumn: text("origin_column"),
	isMovedToHitlist: boolean("is_moved_to_hitlist").default(false),
	userId: integer("user_id"),
	clerkUserId: text("clerk_user_id"),
}, (table) => [
	index("idx_tasks_clerk_user_id").using("btree", table.clerkUserId.asc().nullsLast().op("text_ops")),
	index("idx_tasks_column").using("btree", table.columnName.asc().nullsLast().op("text_ops")),
	index("idx_tasks_linked").using("btree", table.linkedTaskId.asc().nullsLast().op("int4_ops")),
	index("idx_tasks_linked_task_id").using("btree", table.linkedTaskId.asc().nullsLast().op("int4_ops")),
	index("idx_tasks_origin_column").using("btree", table.originColumn.asc().nullsLast().op("text_ops")),
	index("idx_tasks_parent").using("btree", table.parentId.asc().nullsLast().op("int4_ops")),
	index("idx_tasks_position").using("btree", table.position.asc().nullsLast().op("int4_ops")),
	index("idx_tasks_user_id").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	index("idx_tasks_week_start_date").using("btree", table.weekStartDate.asc().nullsLast().op("date_ops")),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "tasks_parent_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.linkedTaskId],
			foreignColumns: [table.id],
			name: "tasks_linked_task_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "tasks_user_id_fkey"
		}).onDelete("cascade"),
	check("tasks_label_check", sql`(label)::text = ANY ((ARRAY['Door'::character varying, 'Hit'::character varying, 'To-Do'::character varying, 'Mission'::character varying])::text[])`),
]);

export const settings = pgTable("settings", {
	id: serial().primaryKey().notNull(),
	key: varchar({ length: 50 }).notNull(),
	value: text(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	userId: integer("user_id"),
	clerkUserId: text("clerk_user_id"),
}, (table) => [
	index("idx_settings_clerk_user_id").using("btree", table.clerkUserId.asc().nullsLast().op("text_ops")),
	index("idx_settings_user_id").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "settings_user_id_fkey"
		}).onDelete("cascade"),
	unique("settings_key_key").on(table.key),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }),
	image: text(),
	emailVerified: timestamp("email_verified", { mode: 'string' }),
	passwordHash: text("password_hash"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	clerkUserId: text("clerk_user_id"),
}, (table) => [
	index("idx_users_clerk_user_id").using("btree", table.clerkUserId.asc().nullsLast().op("text_ops")),
	index("idx_users_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	unique("users_email_key").on(table.email),
	unique("users_clerk_user_id_key").on(table.clerkUserId),
]);

export const accounts = pgTable("accounts", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	type: varchar({ length: 255 }).notNull(),
	provider: varchar({ length: 255 }).notNull(),
	providerAccountId: varchar("provider_account_id", { length: 255 }),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	expiresAt: integer("expires_at"),
	tokenType: varchar("token_type", { length: 255 }),
	scope: text(),
	idToken: text("id_token"),
	sessionState: varchar("session_state", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_accounts_user_id").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "accounts_user_id_fkey"
		}).onDelete("cascade"),
	unique("accounts_provider_provider_account_id_key").on(table.provider, table.providerAccountId),
]);

export const sessions = pgTable("sessions", {
	id: serial().primaryKey().notNull(),
	sessionToken: varchar("session_token", { length: 255 }).notNull(),
	userId: integer("user_id").notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_sessions_session_token").using("btree", table.sessionToken.asc().nullsLast().op("text_ops")),
	index("idx_sessions_user_id").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_user_id_fkey"
		}).onDelete("cascade"),
	unique("sessions_session_token_key").on(table.sessionToken),
]);

export const verificationTokens = pgTable("verification_tokens", {
	identifier: varchar({ length: 255 }).notNull(),
	token: varchar({ length: 255 }).notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	index("idx_verification_tokens_token").using("btree", table.token.asc().nullsLast().op("text_ops")),
	primaryKey({ columns: [table.identifier, table.token], name: "verification_tokens_pkey"}),
	unique("verification_tokens_token_key").on(table.token),
]);
