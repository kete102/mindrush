import type { ErrorResponse } from "@/shared/types"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { HTTPException } from "hono/http-exception"
import type { Context } from "./context"
import { lucia } from "./lucia"
import { achievementsRouter } from "./routes/ahievements.routes"
import { authRouter } from "./routes/auth.routes"
import { hintsRouter } from "./routes/hints.routes"
import { statsRouter } from "./routes/stats.routes"

const app = new Hono<Context>()

//Middlware  to check if the user is signedIn
app.use("*", cors(), async (c, next) => {
	const sessionId = lucia.readSessionCookie(c.req.header("Cookie") ?? "")
	if (!sessionId) {
		c.set("user", null)
		c.set("session", null)
		return next()
	}

	const { session, user } = await lucia.validateSession(sessionId)
	if (session && session.fresh) {
		c.header("Set-Cookie", lucia.createSessionCookie(session.id).serialize(), {
			append: true,
		})
	}
	if (!session) {
		c.header("Set-Cookie", lucia.createBlankSessionCookie().serialize(), {
			append: true,
		})
	}
	c.set("session", session)
	c.set("user", user)
	return next()
})

const routes = app
	.basePath("/api")
	.route("/auth", authRouter)
	.route("/stats", statsRouter)
	.route("/hints", hintsRouter)
	.route("/achievements", achievementsRouter)

app.onError((err, c) => {
	if (err instanceof HTTPException) {
		const errResponse =
			err.res ??
			c.json<ErrorResponse>(
				{
					success: false,
					error: err.message,
					isFormError:
						err.cause && typeof err.cause === "object" && "form" in err.cause
							? err.cause.form === true
							: false,
				},
				err.status
			)
		return errResponse
	}

	return c.json<ErrorResponse>(
		{
			success: false,
			error:
				process.env.NODE_ENV === "production"
					? "Internal Server Error"
					: (err.stack ?? err.message),
		},
		500
	)
})

export default app
export type ApiRoutes = typeof routes
