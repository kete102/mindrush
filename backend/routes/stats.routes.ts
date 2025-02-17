import { db } from "@/adapter"
import type { Context } from "@/context"
import { updateUserAchievements } from "@/controllers/achievements"
import { GetStats } from "@/controllers/stats"
import {
	statsTable,
	updateStatsSchema,
	type UserStats,
} from "@/db/schemas/stats"
import { loggedIn } from "@/middleware/loggedIn"
import type { SuccessResponse } from "@/shared/types"
import { calculateCoins } from "@/utils/calculateCoins"
import { zValidator } from "@hono/zod-validator"
import { eq } from "drizzle-orm"
import { Hono } from "hono"
import { HTTPException } from "hono/http-exception"

export const statsRouter = new Hono<Context>()
	.get("/", loggedIn, GetStats)
	.put(
		"/update",
		loggedIn,
		zValidator("json", updateStatsSchema),
		async (c) => {
			const user = c.get("user")!
			const { correctAnswers, gameDuration } = c.req.valid("json")

			// Comenzamos una transacción para hacer ambas cosas en una sola consulta
			const result = await db.transaction(async (trx) => {
				// Obtenemos las estadísticas actuales del usuario
				const [currentStats] = await trx
					.select()
					.from(statsTable)
					.where(eq(statsTable.userId, user.id))
					.limit(1)

				if (!currentStats) {
					throw new HTTPException(404, { message: "User stats not found" })
				}

				// New user stats
				const isGameWon = correctAnswers >= 5 // Game won if correctAnswers >=5
				const pointsEarned = correctAnswers * 10 // Each correctAnswer values 10 points
				const newStreak = isGameWon ? currentStats.streak + 1 : 0 // If isGameWon increment the streak if not reset to 0
				const newBestStreak = Math.max(currentStats.bestStreak, newStreak)
				const newGamesPlayed = currentStats.gamesPlayed + 1
				const newWins = isGameWon ? currentStats.wins + 1 : currentStats.wins
				const newWinRatio =
					newGamesPlayed > 0
						? parseFloat((newWins / newGamesPlayed).toFixed(1))
						: 0
				const earnedCoins = currentStats.coins + calculateCoins(correctAnswers)

				// Datos a actualizar
				const updatedStats: UserStats = {
					wins: newWins, // Incrementa las victorias si ganó
					totalPoints: currentStats.totalPoints + pointsEarned, // Sumar puntos
					streak: newStreak, // Actualizar la racha
					bestStreak: newBestStreak, // Actualizar la mejor racha
					gamesPlayed: newGamesPlayed, // Incrementar los juegos jugados
					winRatio: newWinRatio,
					coins: earnedCoins,
				}

				// Actualización de las estadísticas en la misma transacción
				await trx
					.update(statsTable)
					.set(updatedStats)
					.where(eq(statsTable.userId, user.id))

				const updatedUserAchievements = await updateUserAchievements(
					trx,
					user.id,
					correctAnswers,
					gameDuration,
					isGameWon
				)

				console.log({ updatedUserAchievements })

				return { updatedStats } // Devolvemos las estadísticas actualizadas para la respuesta
			})

			return c.json<SuccessResponse<UserStats>>(
				{
					success: true,
					message: "Stats updated successfully",
					data: result.updatedStats,
				},
				200
			)
		}
	)
