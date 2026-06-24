import Review from "components/Review";
import { useEffect, useState } from "react";
import type { CardType } from "types/index";
import { db } from "utils/db";

function Full() {
	const [cards, setCards] = useState<CardType[]>([]);

	useEffect(() => {
		async function loadCards() {
			try {
				const allCards = await db.cards.toArray();
				const enToNlCards = allCards.filter(
					(card) => (card.category || "EN to NL") === "EN to NL" && card.rate !== 0,
				);

				const fullCards = enToNlCards;
                
                // Shuffle the cards
                for (let i = fullCards.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [fullCards[i], fullCards[j]] = [fullCards[j], fullCards[i]];
                }

				setCards(fullCards);
			} catch (error) {
				console.error("Error fetching flashcards:", error);
			}
		}
		loadCards();
	}, []);
    
	const handleRateCard = async (card: CardType, rate: number, timerMs?: number) => {
		try {
			const now = Date.now();
			const dayInMs = 24 * 60 * 60 * 1000;
			const minuteInMs = 60 * 1000;

			// Calculate dueAt
			const dueAt =
				rate === 0
					? now + 10 * minuteInMs
					: now + rate * dayInMs;
            
			const updates: Partial<CardType> = { rate, dueAt };
			if (typeof timerMs === "number") updates.timerMs = timerMs;

            // Perform a partial update to avoid overwriting sides with inverted ones
			await db.cards.update(card.id, updates);
            
            // We don't need to update local 'cards' state because Review handles removing the card from the batch.
		} catch (error) {
			console.error("Error updating flashcard:", error);
		}
	};

	return (
		<div className="app-container">
            {/* Reuse background from App.css / Home */}
			<div className="background">
				<div className="background-base" />
				<div className="background-middle">
					<div className="diagonal-section-middle" />
				</div>
				<div className="background-top">
					<div className="diagonal-section-top" />
				</div>
			</div>

			<div className="content">
				<div className="header">
					<div className="streak">
						<span>Cards in batch: {cards.length}</span>
						<span>🔥🔥🔥</span>
					</div>
					<div className="progress-bar">
						<div className="progress-fill" />
					</div>
				</div>

				<Review 
                    cards={cards} 
                    setCards={setCards} 
                    onRateCard={handleRateCard}
                    onClearUrl={() => {}} 
                />
			</div>
		</div>
	);
}

export default Full;
