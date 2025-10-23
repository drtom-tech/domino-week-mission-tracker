-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"label" varchar(20),
	"column_name" varchar(50) NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"parent_id" integer,
	"completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"completed_at" timestamp,
	"week_start_date" date,
	"linked_task_id" integer,
	"origin_column" text,
	"is_moved_to_hitlist" boolean DEFAULT false,
	"user_id" integer,
	"clerk_user_id" text,
	CONSTRAINT "tasks_label_check" CHECK ((label)::text = ANY ((ARRAY['Door'::character varying, 'Hit'::character varying, 'To-Do'::character varying, 'Mission'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(50) NOT NULL,
	"value" text,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"user_id" integer,
	"clerk_user_id" text,
	CONSTRAINT "settings_key_key" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"image" text,
	"email_verified" timestamp,
	"password_hash" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"clerk_user_id" text,
	CONSTRAINT "users_email_key" UNIQUE("email"),
	CONSTRAINT "users_clerk_user_id_key" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"provider_account_id" varchar(255),
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" text,
	"id_token" text,
	"session_state" varchar(255),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "accounts_provider_provider_account_id_key" UNIQUE("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_token" varchar(255) NOT NULL,
	"user_id" integer NOT NULL,
	"expires" timestamp NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "sessions_session_token_key" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_pkey" PRIMARY KEY("identifier","token"),
	CONSTRAINT "verification_tokens_token_key" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_linked_task_id_fkey" FOREIGN KEY ("linked_task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_tasks_clerk_user_id" ON "tasks" USING btree ("clerk_user_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_tasks_column" ON "tasks" USING btree ("column_name" text_ops);--> statement-breakpoint
CREATE INDEX "idx_tasks_linked" ON "tasks" USING btree ("linked_task_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_tasks_linked_task_id" ON "tasks" USING btree ("linked_task_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_tasks_origin_column" ON "tasks" USING btree ("origin_column" text_ops);--> statement-breakpoint
CREATE INDEX "idx_tasks_parent" ON "tasks" USING btree ("parent_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_tasks_position" ON "tasks" USING btree ("position" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_tasks_user_id" ON "tasks" USING btree ("user_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_tasks_week_start_date" ON "tasks" USING btree ("week_start_date" date_ops);--> statement-breakpoint
CREATE INDEX "idx_settings_clerk_user_id" ON "settings" USING btree ("clerk_user_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_settings_user_id" ON "settings" USING btree ("user_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_users_clerk_user_id" ON "users" USING btree ("clerk_user_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "idx_accounts_user_id" ON "accounts" USING btree ("user_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_sessions_session_token" ON "sessions" USING btree ("session_token" text_ops);--> statement-breakpoint
CREATE INDEX "idx_sessions_user_id" ON "sessions" USING btree ("user_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_verification_tokens_token" ON "verification_tokens" USING btree ("token" text_ops);
*/