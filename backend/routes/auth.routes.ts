import { db } from "@/adapter"
import type { Context } from "@/context"
import { lucia } from "@/lucia"
import { loggedIn } from "@/middleware/loggedIn"
import { userTable } from "@/models/auth.model"
import { loginSchema, type SuccessResponse } from "@/shared/types"
import { zValidator } from "@hono/zod-validator"
import { eq } from "drizzle-orm"
import { Hono } from "hono"
import { HTTPException } from "hono/http-exception"
import { generateId } from "lucia"
import postgres from "postgres"

export const authRouter = new Hono<Context>()
	.post("/signup", zValidator("form", loginSchema), async (c) => {
		// Validated username and password through the zValidator with the loginSchema
		const { username, password } = c.req.valid("form")
		const passHash = await Bun.password.hash(password)
		const userId = generateId(15)

		try {
			//1. Insert the user in the userTable
			await db.insert(userTable).values({
				id: userId,
				username,
				passwor_hash: passHash,
			})

			//2. Create a session and a cookieSession for the new user
			const session = await lucia.createSession(userId, { username })
			const sessionCookie = lucia.createSessionCookie(session.id).serialize()

			//3. Attach the sessionCookie to the header of the response
			c.header("Set-Cookie", sessionCookie, { append: true })

			return c.json<SuccessResponse>(
				{
					success: true,
					message: "User Authenticated",
				},
				201
			)
		} catch (error) {
			//Error if the user is already used
			if (error instanceof postgres.PostgresError && error.code === "23505") {
				throw new HTTPException(409, { message: "Username already used" })
			}

			//Unexpected error
			throw new HTTPException(500, { message: "Failed to create user" })
		}
	})
	.post("/login", zValidator("form", loginSchema), async (c) => {
		const { username, password } = c.req.valid("form")

		//Check if user exists

		const [existingUser] = await db
			.select()
			.from(userTable)
			.where(eq(userTable.username, username))
			.limit(1)

		//If no user, throw error
		if (!existingUser) {
			throw new HTTPException(401, { message: "Incorrect username" })
		}

		//Checks the given password  with the passwor from the userTable
		const validPassword = await Bun.password.verify(
			password,
			existingUser.passwor_hash
		)

		if (!validPassword) {
			throw new HTTPException(401, { message: "Incorrect password" })
		}

		//Create a session for the user
		const session = await lucia.createSession(existingUser.id, { username })
		const sessionCookie = lucia.createSessionCookie(session.id).serialize()

		//Attach session to the response header
		c.header("Set-Cookie", sessionCookie, { append: true })

		return c.json<SuccessResponse>(
			{
				success: true,
				message: "User logged in",
			},
			200
		)
	})
	.get("/logout", async (c) => {
		//Check if there is a session
		const session = c.get("session")
		//If no session, redirect to home page
		if (!session) {
			return c.redirect("/")
		}

		//Invalidate the session
		await lucia.invalidateSession(session.id)

		//Set a blank session to the response header
		c.header("Set-Cookie", lucia.createBlankSessionCookie().serialize())

		//Redirect to home page
		return c.redirect("/")
	})
	.get("/user", loggedIn, async (c) => {
		const user = c.get("user")!

		return c.json<SuccessResponse<{ username: string }>>({
			success: true,
			message: "User fetched",
			data: { username: user.username },
		})
	})
