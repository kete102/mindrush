import {
	achievementsGoals,
	userAchievementsTable,
} from "@/db/schemas/achievements"
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/postgres-js"
import { HTTPException } from "hono/http-exception"

export type DrizzleClient = ReturnType<typeof drizzle>
export type DrizzleTransaction = Parameters<
	Parameters<DrizzleClient["transaction"]>[0]
>[0]

export const updateUserAchievements = async (
	trx: DrizzleTransaction,
	userId: string,
	correctAnswers: number,
	gameDuration: number,
	isWin: boolean
) => {
	// Obtener los logros actuales del usuario
	const [userAchievements] = await trx
		.select()
		.from(userAchievementsTable)
		.where(eq(userAchievementsTable.userId, userId))
		.limit(1)

	if (!userAchievements) {
		throw new HTTPException(404, { message: "User achievements not found" })
	}

	// Verificamos cuáles logros deben actualizarse
	const updatedAchievements = userAchievements.achievements.map((ach) => {
		let newProgress = ach.progress

		switch (ach.achievementId) {
			case "first_game_win":
				if (isWin) newProgress = 1
				break
			case "perfect_game_1":
			case "perfect_game_5":
			case "perfect_game_10":
				if (correctAnswers === 5) newProgress += 1
				break
			case "fast_completion_1":
			case "fast_completion_5":
			case "fast_completion_10":
				if (isWin && gameDuration <= 30) newProgress += 1
				break
			case "solo_victory_1":
			case "solo_victory_5":
			case "solo_victory_10":
				if (isWin) newProgress += 1
				break
			case "undefeated_1":
			case "undefeated_5":
			case "undefeated_10":
				if (isWin) newProgress += 1
				break
			case "legendary_1":
			case "legendary_5":
			case "legendary_10":
				if (correctAnswers === 5) newProgress += 1
				break
			case "grandmaster_1":
			case "grandmaster_5":
			case "grandmaster_10":
				if (correctAnswers === 5 && gameDuration <= 30) newProgress += 1
				break
			case "immortal_1":
			case "immortal_5":
			case "immortal_10":
				if (isWin) newProgress += 1
				break
		}

		const goal = achievementsGoals[ach.achievementId]
		const isCompleted = goal !== undefined && newProgress >= goal

		return {
			...ach,
			progress: newProgress,
			completed: isCompleted,
		}
	})

	// Actualizar los logros en la base de datos
	await trx
		.update(userAchievementsTable)
		.set({ achievements: updatedAchievements })
		.where(eq(userAchievementsTable.userId, userId))

	return updateUserAchievements
}
