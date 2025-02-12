//Default success response with generic optinal data
export type SuccessResponse<T = void> = {
	success: true
	message: string
} & (T extends void ? {} : { data: T })

export type ErrorResponse = {
	success: false
	error: string
}
