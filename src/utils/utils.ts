import type { CardType } from "types/index";

/**
 * Selects the next card to review based on dueAt property.
 * Priority:
 * 1. Cards never reviewed (no dueAt)
 * 2. Cards that are due for review (dueAt <= now)
 * 3. Cards with the earliest due date
 */
export const selectNextCard = (
	cards: CardType[],
	excludeIndex: number | null = null,
): number => {
	if (cards.length === 0) {
		return -1;
	}
	if (cards.length === 1) {
		return 0;
	}

	const now = Date.now();

	// Calculate priority score for each card
	const cardScores = cards.map((card, index) => {
		if (excludeIndex !== null && index === excludeIndex) {
			return { index, score: -Infinity }; // Exclude this card
		}

		// Never reviewed - lowest priority
		if (!card.dueAt) {
			return { index, score: -now - 864000000 };// cca 10 days
		}

		const isDue = card.dueAt <= now;

		// Due cards get high priority (earlier due dates = higher priority)
		// Use negative due date so earlier dates have higher scores
		// Due cards are prioritized over future cards by adding a large offset
		return {
			index,
			score: isDue ? -card.dueAt : -card.dueAt - 432000000,// cca 5 days
		};
	});

	// Sort by score (descending) and return the index of the highest scoring card
	cardScores.sort((a, b) => b.score - a.score);
	return cardScores[0].index;
};

export const formatDueAt = (dueAt: number | null | undefined): string => {
	if (dueAt === Infinity || dueAt === null || dueAt === undefined) {
		return "Not reviewed";
	}
	const date = new Date(dueAt);
	const month = date.toLocaleString("en-US", { month: "short" });
	const day = date.getDate();
	const hours = date.getHours().toString().padStart(2, "0");
	const minutes = date.getMinutes().toString().padStart(2, "0");
	return `Due: ${month} ${day}, ${hours}:${minutes}`;
};

