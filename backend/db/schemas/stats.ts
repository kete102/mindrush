import type { InferSelectModel } from "drizzle-orm"
import { integer, pgTable, real, text } from "drizzle-orm/pg-core"
import { z } from "zod"
import { userTable } from "./auth"

export const statsTable = pgTable("stats", {
	userId: text("user_id")
		.notNull()
		.primaryKey()
		.references(() => userTable.id, { onDelete: "cascade" }),
	winRatio: real("win_ratio").notNull().default(0),
	wins: integer("wins").notNull().default(0),
	streak: integer("streak").notNull().default(0),
	bestStreak: integer("best_streak").notNull().default(0),
	totalPoints: integer("total_points").notNull().default(0),
	coins: integer("coins").default(0).notNull(),
	gamesPlayed: integer("games_played").notNull().default(0),
})

export type UserStats = Omit<InferSelectModel<typeof statsTable>, "userId">

export const updateStatsSchema = z.object({
	correctAnswers: z.number(),
	gameDuration: z.number(),
})
