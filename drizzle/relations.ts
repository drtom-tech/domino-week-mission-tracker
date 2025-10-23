import { relations } from "drizzle-orm/relations";
import { tasks, users, settings, accounts, sessions } from "./schema";

export const tasksRelations = relations(tasks, ({one, many}) => ({
	task_parentId: one(tasks, {
		fields: [tasks.parentId],
		references: [tasks.id],
		relationName: "tasks_parentId_tasks_id"
	}),
	tasks_parentId: many(tasks, {
		relationName: "tasks_parentId_tasks_id"
	}),
	task_linkedTaskId: one(tasks, {
		fields: [tasks.linkedTaskId],
		references: [tasks.id],
		relationName: "tasks_linkedTaskId_tasks_id"
	}),
	tasks_linkedTaskId: many(tasks, {
		relationName: "tasks_linkedTaskId_tasks_id"
	}),
	user: one(users, {
		fields: [tasks.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	tasks: many(tasks),
	settings: many(settings),
	accounts: many(accounts),
	sessions: many(sessions),
}));

export const settingsRelations = relations(settings, ({one}) => ({
	user: one(users, {
		fields: [settings.userId],
		references: [users.id]
	}),
}));

export const accountsRelations = relations(accounts, ({one}) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id]
	}),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));