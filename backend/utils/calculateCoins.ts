const TOTAL_QUESTIONS = 10
/**
 * @description Function to calculate the total earned coins in a game.
 *
 * Each correct answer is equal to 1 coin.
 *
 * If the users correctly answers all the questions a bonus of 5 coins is earned.
 *
 * @param Number {correctAnswers}  Total correct answers of the gameT
 */
export function calculateCoins(correctAnswers: number): number {
	let earnedCoins = correctAnswers

	if (correctAnswers === TOTAL_QUESTIONS) earnedCoins += 5

	return earnedCoins
}
