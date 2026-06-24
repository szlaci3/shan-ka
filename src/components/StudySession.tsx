import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import type { CardCategory, CardType, StudySessionProps } from "src/types";
import { selectNextCard } from "utils/utils";
import Card from "./Card";

function StudySession({ cards, onRateCard }: StudySessionProps) {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const initialCardId = searchParams.get("cardId") || undefined;
	const [selectedCategory, setSelectedCategory] =
		useState<CardCategory>("EN to NL");
	const [filteredCards, setFilteredCards] = useState<CardType[]>([]);
	const [currentCardIndex, setCurrentCardIndex] = useState<number>(-1);

	// Filter cards by category
	useEffect(() => {
		const filtered: CardType[] = cards.filter(
			(card) => (card.category || "EN to NL") === selectedCategory,
		);

		setFilteredCards(filtered);

		// If selected category has no cards, switch to first available category
		if (filtered.length === 0 && cards.length > 0) {
			const categoriesWithCards: Set<CardCategory> = new Set();
			for (const card of cards) {
				categoriesWithCards.add(card.category || "EN to NL");
			}
			const allCategories: CardCategory[] = [
				"EN to NL",
				"Question NL",
				"Dev",
			];
			const firstAvailable = allCategories.find((cat) =>
				categoriesWithCards.has(cat),
			);
			if (firstAvailable) {
				setSelectedCategory(firstAvailable);
			}
		}
	}, [cards, selectedCategory]);

	// Handle initial card ID from query parameter
	useEffect(() => {
		if (initialCardId && cards.length > 0) {
			const card = cards.find((c) => c.id === initialCardId);
			if (card) {
				// Set the category to match the card's category
				setSelectedCategory(card.category || "EN to NL");
			}
		}
	}, [initialCardId, cards]);

	// Update card selection when filtered cards change
	useEffect(() => {
		if (filteredCards.length > 0) {
			// If we have an initialCardId, try to find and select that card
			if (initialCardId) {
				const cardIndex = filteredCards.findIndex(
					(c) => c.id === initialCardId,
				);
				if (cardIndex >= 0) {
					setCurrentCardIndex(cardIndex);
					return;
				}
			}
			// Otherwise, use the normal selection algorithm
			setCurrentCardIndex(selectNextCard(filteredCards));
		} else {
			setCurrentCardIndex(-1);
		}
	}, [filteredCards, initialCardId]);

	const handleCategoryChange = (category: CardCategory) => {
		setSelectedCategory(category);
	};


	const goToNextCard = () => {
		setCurrentCardIndex((prev) => selectNextCard(filteredCards, prev));

		// Remove initialCardId from URL after rating if it exists
		if (initialCardId) {
			navigate("/", { replace: true });
		}
	};
	
	const handleRateCard = (rating: number) => {
		if (currentCardIndex >= 0 && currentCardIndex < filteredCards.length) {
			const cardToRate = filteredCards[currentCardIndex];
			onRateCard(cardToRate, rating);
			goToNextCard();
		}
	};

	const currentCard =
		currentCardIndex >= 0 && currentCardIndex < filteredCards.length
			? filteredCards[currentCardIndex]
			: null;

	return (
		<div className="card-list">
			{currentCard && (
				<Card
					card={currentCard}
					onRateCard={handleRateCard}
					allCards={cards}
					selectedCategory={selectedCategory}
					onCategoryChange={handleCategoryChange}
				/>
			)}
		</div>
	);
}

export default StudySession;
