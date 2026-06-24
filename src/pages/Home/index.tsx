import Review from "components/Review";
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import type { CardCategory, CardType } from "types/index";
import { db } from "utils/db";

function Home() {
	const [allCards, setAllCards] = useState<CardType[]>([]);
	const [batch, setBatch] = useState<CardType[]>([]);
	const [selectedCategory, setSelectedCategory] = useState<CardCategory>("EN to NL");
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const initialCardId = searchParams.get("cardId");
    
    const prevCategoryRef = useRef<string | null>(null);
    const hasLoadedCardsRef = useRef(false);

	// Load all cards initially
	useEffect(() => {
		async function loadCards() {
			try {

				const cards = await db.cards.toArray();
				setAllCards(cards);
			} catch (error) {
				console.error("Error fetching flashcards:", error);
			}
		}
		loadCards();
	}, []);

	// Update batch based on selected category and due status
    
    // Update batch based on selected category and due status or initial card
    useEffect(() => {
        if (allCards.length === 0) return;

        const categoryChanged = prevCategoryRef.current !== selectedCategory;
        const initialLoad = !hasLoadedCardsRef.current;
        const forceId = !!initialCardId;

        // Perform update if:
        // 1. Category changed
        // 2. This is the first valid load of cards
        // 3. We have an initialCardId (deep link) that overrides everything
        if (categoryChanged || initialLoad || forceId) {
            const now = Date.now();
            const categoryCards = allCards.filter(c => (c.category || "EN to NL") === selectedCategory);
            
            const dueList = categoryCards.filter(c => {
                // Include if dueAt is passed
                return typeof c.dueAt === "number" && c.dueAt <= now;
            });

            if (forceId) {
                const initialCard = allCards.find(c => c.id === initialCardId);
                if (initialCard) {
                    const dueWithoutInitial = dueList.filter(c => c.id !== initialCardId);
                    setBatch([initialCard, ...dueWithoutInitial]);
                } else {
                    setBatch(dueList);
                }
            } else {
                setBatch(dueList);
            }

            prevCategoryRef.current = selectedCategory;
            hasLoadedCardsRef.current = true;
        }
    }, [selectedCategory, allCards, initialCardId]);

    const handleClearUrl = () => {
        if (initialCardId) {
             navigate("/", { replace: true });
        }
    };
    // Depend on allCards to refresh batch when cards are rated/updated (dueAt passes now)
    
    const allCategories: CardCategory[] = [
		"EN to NL",
		"Question NL",
		"Dev",
	];

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

			await db.cards.update(card.id, updates);
            
            // Update allCards to reflect change
            setAllCards((prev) => 
                prev.map((c) => c.id === card.id ? { ...card, ...updates } : c)
            );
		} catch (error) {
			console.error("Error updating flashcard:", error);
		}
	};

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedCategory(e.target.value as CardCategory);
    };

	return (
		<div className="app-container">
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
						<span>All cards: {allCards.length}, Due cards: {batch.length}</span>
						<span>🔥🔥🔥</span>
					</div>
					<div className="progress-bar">
						<div className="progress-fill" />
					</div>
				</div>

                <div className="category-selector-container" style={{ textAlign: 'center', margin: '10px 0' }}>
                     <select
						className="category-button"
						value={selectedCategory}
						onChange={handleCategoryChange}
						aria-label="Select card category"
					>
						{allCategories.map((cat) => (
							<option
								key={cat}
								value={cat}
                                // Show all categories regardless of card counts
							>
								{cat}
							</option>
						))}
					</select>
                </div>

				<Review 
                    cards={batch} 
                    setCards={setBatch} 
                    onRateCard={handleRateCard}
                    onClearUrl={handleClearUrl} 
                />
			</div>
		</div>
	);
}

export default Home;
