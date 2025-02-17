import type { Context as CustomContext } from "@/context"
import { type UserStats } from "@/db/schemas/stats"
import { getUserStats } from "@/services/stats"
import type { Context } from "hono"

export async function GetStats(c: Context<CustomContext>) {
	const user = c.get("user")!

	const existingStats = await getUserStats(user)

	if (!existingStats) {
		return c.json<UserStats>({
			bestStreak: 0,
			gamesPlayed: 0,
			streak: 0,
			totalPoints: 0,
			winRatio: 0,
			coins: 0,
			wins: 0,
		})
	}

	return c.json<UserStats>({
		bestStreak: existingStats.bestStreak,
		gamesPlayed: existingStats.gamesPlayed,
		streak: existingStats.streak,
		totalPoints: existingStats.totalPoints,
		winRatio: existingStats.winRatio,
		wins: existingStats.wins,
		coins: existingStats.coins,
	})
}
