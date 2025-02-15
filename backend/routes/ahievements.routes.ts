import { db } from "@/adapter"
import type { Context } from "@/context"
import {
	achievementsTable,
	userAchievementsTable,
} from "@/db/schemas/achievements"
import { loggedIn } from "@/middleware/loggedIn"
import type { SuccessResponse } from "@/shared/types"
import { zValidator } from "@hono/zod-validator"
import { eq } from "drizzle-orm"
import { Hono } from "hono"
import { HTTPException } from "hono/http-exception"

export const achievementsRouter = new Hono<Context>()
	.get("/", loggedIn, async (c) => {
		const user = c.get("user")!

		const userAchievements = await db
			.select({
				achievements: userAchievementsTable.achievements,
				userId: userAchievementsTable.userId,
			})
			.from(userAchievementsTable)
			.where(eq(userAchievementsTable.userId, user.id))

		if (!userAchievements)
			throw new HTTPException(404, { message: "User achievements not found" })

		const results = await Promise.all(
			userAchievements.map(async (userAch) => {
				const achievementsWithProgress = await Promise.all(
					userAch.achievements.map(async (ach) => {
						const achievementDetails = await db
							.select({
								goal: achievementsTable.goal,
								name: achievementsTable.name,
								description: achievementsTable.description,
							})
							.from(achievementsTable)
							.where(eq(achievementsTable.id, ach.achievementId))

						return {
							achievementId: ach.achievementId,
							progress: ach.progress,
							completed: ach.completed,
							goal: achievementDetails[0]?.goal,
							name: achievementDetails[0]?.name,
							description: achievementDetails[0]?.description,
						}
					})
				)

				return achievementsWithProgress
			})
		)

		return c.json<SuccessResponse<typeof results>>({
			success: true,
			message: "User achievements",
			data: results,
		})
	})
	.put(
		"/update-achievements",
		loggedIn,
		zValidator("json", updateAchievementsSchema),
		async (c) => {}
	)
