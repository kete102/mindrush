import { db } from "@/adapter"
import type { Context } from "@/context"
import {
	hintsTable,
	useHintSchema,
	userHintsTable,
	type UserHints,
} from "@/db/schemas/hints"
import { statsTable } from "@/db/schemas/stats"
import { loggedIn } from "@/middleware/loggedIn"
import type { SuccessResponse } from "@/shared/types"
import { zValidator } from "@hono/zod-validator"
import { eq } from "drizzle-orm"
import { Hono } from "hono"
import { HTTPException } from "hono/http-exception"

export const hintsRouter = new Hono<Context>()
	.get("/", loggedIn, async (c) => {
		const user = c.get("user")!

		const [userHints] = await db
			.select({ hints: userHintsTable.hints })
			.from(userHintsTable) // Seleccionamos solo la columna helpItems
			.where(eq(userHintsTable.userId, user.id)) // Compara el userId
			.limit(1) // Limita la respuesta a 1
			.execute()

		console.log(userHints)

		if (!userHints)
			throw new HTTPException(404, { message: "User hints not found" })

		return c.json<SuccessResponse<UserHints>>({
			success: true,
			message: "User hints",
			data: userHints,
		})
	})
	.post("/purchase", loggedIn, zValidator("json", useHintSchema), async (c) => {
		const user = c.get("user")!
		const hintToPurchaseId = c.req.valid("json")

		//Check user coins
		const [userCoins] = await db
			.select({ coins: statsTable.coins })
			.from(statsTable)
			.where(eq(statsTable.userId, user.id))
			.limit(1)

		//Check hint value
		const [hintToPurchaseValue] = await db
			.select({ hintValue: hintsTable.value })
			.from(hintsTable)
			.where(eq(hintsTable.id, hintToPurchaseId.hintId))
			.limit(1)

		//If no hintValue founded
		if (!hintToPurchaseValue) {
			throw new HTTPException(404, { message: "Hint not found" })
		}

		//Check if user can buy hint
		if (userCoins.coins < hintToPurchaseValue.hintValue) {
			console.log(userCoins.coins, hintToPurchaseValue.hintValue)
			throw new HTTPException(404, { message: "Not enough coins" })
		}

		const [userHints] = await db
			.select({ hints: userHintsTable.hints })
			.from(userHintsTable)
			.where(eq(userHintsTable.userId, user.id))
			.limit(1)

		// Update number of buyed hints
		const updatedHints = userHints.hints.map((hint) =>
			hint.hintId === hintToPurchaseId.hintId
				? { ...hint, quantity: hint.quantity + 1 }
				: hint
		)

		// Save the new data
		await db.transaction(async (trx) => {
			// Restar monedas al usuario
			await trx
				.update(statsTable)
				.set({ coins: userCoins.coins - hintToPurchaseValue.hintValue })
				.where(eq(statsTable.userId, user.id))

			// Actualizar los hints del usuario
			await trx
				.update(userHintsTable)
				.set({ hints: updatedHints })
				.where(eq(userHintsTable.userId, user.id))
		})

		return c.json<SuccessResponse<typeof updatedHints>>({
			success: true,
			message: "Hint purschased",
			data: updatedHints,
		})
	})
	.post("/use", loggedIn, zValidator("json", useHintSchema), async (c) => {
		const user = c.get("user")!
		const usedUserHint = c.req.valid("json")

		const updatedUserHints = await db.transaction(async (trx) => {
			const [userHints] = await trx
				.select({ hints: userHintsTable.hints })
				.from(userHintsTable)
				.where(eq(userHintsTable.userId, user.id))
				.limit(1)

			if (!userHints) {
				throw new HTTPException(404, { message: "User not found" })
			}

			// Buscar el hint que el usuario quiere usar
			const hintToUse = userHints.hints.find(
				(hint) => hint.hintId === usedUserHint.hintId
			)

			// Validar si existe y si tiene cantidad disponible
			if (!hintToUse) {
				throw new HTTPException(400, { message: "Invalid hintId" })
			}

			if (hintToUse.quantity <= 0) {
				throw new HTTPException(400, { message: "No hints available to use" })
			}

			// Reducir la cantidad del hint usado
			const updatedHints = userHints.hints.map((hint) =>
				hint.hintId === usedUserHint.hintId
					? { ...hint, quantity: hint.quantity - 1 } // Ahora solo reduce si es válido
					: hint
			)

			const [updated] = await trx
				.update(userHintsTable)
				.set({ hints: updatedHints })
				.where(eq(userHintsTable.userId, user.id))
				.returning({ hints: userHintsTable.hints })

			if (!updated) {
				throw new HTTPException(500, { message: "Failed to update user hints" })
			}

			return updated
		})

		return c.json<SuccessResponse<typeof updatedUserHints>>({
			success: true,
			message: "Hint used",
			data: updatedUserHints,
		})
	})
