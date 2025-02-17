import type { InferSelectModel } from "drizzle-orm"
import { integer, jsonb, pgTable, text } from "drizzle-orm/pg-core"
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

// Objetivo de cada achievement
export const achievementsGoals: Record<string, number> = {
	first_game_win: 1,
	perfect_game_1: 1,
	perfect_game_5: 5,
	perfect_game_10: 10,
	fast_completion_1: 1,
	fast_completion_5: 5,
	fast_completion_10: 10,
	solo_victory_1: 1,
	solo_victory_5: 5,
	solo_victory_10: 10,
	undefeated_1: 1,
	undefeated_5: 5,
	undefeated_10: 10,
	legendary_1: 1,
	legendary_5: 5,
	legendary_10: 10,
	grandmaster_1: 1,
	grandmaster_5: 5,
	grandmaster_10: 10,
	immortal_1: 1,
	immortal_5: 5,
	immortal_10: 10,
}
