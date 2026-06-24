import Review from "components/Review";
import { useEffect, useMemo, useState } from "react";
import type { CardType, GroupType } from "types/index";
import { db } from "utils/db";

interface StudyByGroupProps {
	group: GroupType;
}

function StudyByGroup({ group }: StudyByGroupProps) {
	const [cardList, setCardList] = useState<CardType[]>([]);

	useEffect(() => {
		async function loadCards() {
			if (!group.cardIds || group.cardIds.length === 0) {
				setCardList([]);
				return;
			}
			try {
				// bulkGet is more efficient but requires id array
				// db.cards.bulkGet(group.cardIds) returns (CardType | undefined)[]
				// we need to filter out undefineds just in case
				const cards = await db.cards.bulkGet(group.cardIds);
				setCardList(cards.filter((c): c is CardType => !!c));
			} catch (error) {
				console.error("Error fetching group cards:", error);
			}
		}
		loadCards();
	}, [group]);

	const handleRateCard = async (card: CardType, rate: number, timerMs?: number) => {
		try {
			const now = Date.now();
			const dayInMs = 24 * 60 * 60 * 1000;
			const minuteInMs = 60 * 1000;

			// Calculate dueAt: rate 0 = 10 minutes, rate > 0 = n days
			const dueAt =
				rate === 0
					? now + 10 * minuteInMs // 10 minutes
					: now + rate * dayInMs; // n days

			const updates: Partial<CardType> = { rate, dueAt };
			if (typeof timerMs === "number") updates.timerMs = timerMs;

			await db.cards.update(card.id, updates);
		} catch (error) {
			console.error("Error updating flashcard:", error);
		}
	};

	const dueCount = useMemo(() => {
		const now = Date.now();
		return cardList.filter(
			(card) => typeof card.dueAt === "number" && card.dueAt <= now,
		).length;
	}, [cardList]);

	return (
		<div className="study-group-container">
			<div className="header">
				<div className="streak">
					<span>Due cards: {dueCount}</span>
					<span>🔥🔥🔥</span>
				</div>
				<div className="progress-bar">
					<div className="progress-fill" />
				</div>
			</div>
			{cardList.length > 0 ? (
				<Review 
                    cards={cardList} 
                    setCards={setCardList} 
                    onRateCard={handleRateCard} 
                    onClearUrl={() => {}} 
                />
			) : (
				<div className="empty-group-message">
					<p>No cards in this group.</p>
				</div>
			)}
		</div>
	);
}

export default StudyByGroup;
