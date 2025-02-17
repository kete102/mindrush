import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { createRootRoute, Link, Outlet } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/router-devtools"
import * as React from "react"

export const Route = createRootRoute({
	component: RootComponent,
})

function RootComponent() {
	return (
		<>
			<div className="p-2 flex gap-2 text-lg">
				<Link
					to="/"
					activeProps={{
						className: "font-bold",
					}}
					activeOptions={{ exact: true }}
				>
					Home
				</Link>{" "}
				<Link
					to="/about"
					activeProps={{
						className: "font-bold",
					}}
				>
					About
				</Link>
			</div>
			<hr />
			<Outlet />
			<ReactQueryDevtools position="left" />
			<TanStackRouterDevtools position="bottom-left" />
		</>
	)
}
