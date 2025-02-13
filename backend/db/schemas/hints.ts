import { type InferSelectModel } from "drizzle-orm"
import { integer, jsonb, pgTable, text } from "drizzle-orm/pg-core"
import { z } from "zod"
import { userTable } from "./auth"

export const hintsTable = pgTable("hints", {
	id: text("id").notNull().primaryKey(),
	name: text("name").notNull(),
	description: text("description").notNull(),
	value: integer("cost").notNull(),
})

export const userHintsTable = pgTable("userHints", {
	userId: text("user_id")
		.notNull()
		.primaryKey()
		.references(() => userTable.id, { onDelete: "cascade" }),
	hints: jsonb("hints")
		.$type<{ hintId: string; quantity: number }[]>()
		.notNull(),
})

export type UserHints = Omit<
	InferSelectModel<typeof userHintsTable>,
	"userId"
> & { hints: { hintId: string; quantity: number }[] }

export const useHintSchema = z.object({
	hintId: z.enum(
		[
			"hint_50_50",
			"hint_answer_reveal",
			"hint_double_coins",
			"hint_skip_question",
			"hint_time_extension",
		],
		{ message: "Invalid hintId" }
	),
})
