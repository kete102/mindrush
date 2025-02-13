export function calculateCoins(correctAnswers: number): number {
	if (correctAnswers === 10) {
		return 10 // 10 respuestas correctas = 10 coins
	} else if (correctAnswers === 9) {
		return 3 // 9 respuestas correctas = 3 coins
	} else if (correctAnswers === 8) {
		return 1 // 8 respuestas correctas = 1 coin
	} else {
		return 0 // Menos de 8 respuestas correctas = 0 coins
	}
}
