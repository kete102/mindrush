import type { InferSelectModel } from "drizzle-orm"
import { integer, jsonb, pgTable, text } from "drizzle-orm/pg-core"
import { z } from "zod"
import { userTable } from "./auth"

export const achievementsTable = pgTable("achievements", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description").notNull(),
	goal: integer("goal").notNull(),
})

export const userAchievementsTable = pgTable("userAchievements", {
	userId: text("id")
		.notNull()
		.references(() => userTable.id, { onDelete: "cascade" }),
	achievements: jsonb("achievements")
		.$type<
			{
				achievementId: string
				progress: number
				completed: boolean
			}[]
		>()
		.notNull(),
})

export type UserAchievements = Omit<
	InferSelectModel<typeof userAchievementsTable>,
	"userId"
> & {
	achievements: {
		achievementId: string
		progress: number
		completed: boolean
	}[]
}

export const updateAchievementSchema = z.object({
	achievementId: z.enum(
		[
			"first_game_win",
			"perfect_game_1",
			"perfect_game_5",
			"perfect_game_10",
			"fast_completion_1",
			"fast_completion_5",
			"fast_completion_10",
			"solo_victory_1",
			"solo_victory_5",
			"solo_victory_10",
			"undefeated_1",
			"undefeated_5",
			"undefeated_10",
			"legendary_1",
			"legendary_5",
			"legendary_10",
			"grandmaster_1",
			"grandmaster_5",
			"grandmaster_10",
			"immortal_1",
			"immortal_5",
			"immortal_10",
		],
		{ message: "Invalid achievementId" }
	),
})

export type GetUserAchievements = {}
