import { db } from "@/adapter"
import { statsTable } from "@/db/schemas/stats"
import { eq } from "drizzle-orm"
import type { User } from "lucia"

export const getUserStats = async (user: User) => {
	const [userStats] = await db
		.select()
		.from(statsTable)
		.where(eq(statsTable.userId, user.id))
		.limit(1)

	return userStats
}


export const updateUserStatsAndAchievements = async () => {

}