import type { ErrorResponse } from "@/shared/types"
import { Hono } from "hono"
import { HTTPException } from "hono/http-exception"

const app = new Hono()

app.get("/", (c) => {
	return c.text("Hello Hono!")
})

app.onError((err, c) => {
	if (err instanceof HTTPException) {
		const errResponse =
			err.res ??
			c.json<ErrorResponse>(
				{
					success: false,
					error: err.message,
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
