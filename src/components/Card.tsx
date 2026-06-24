import { useEffect, useState } from "react";
import type { CardCategory, CardProps } from "types/index";

function Card({
	card,
	onRateCard,
	allCards,
	// selectedCategory,
	// onCategoryChange,
}: CardProps) {
	const [revealCount, setRevealCount] = useState(0);
	const [inputValue, setInputValue] = useState<string>("1");

	// biome-ignore lint/correctness/useExhaustiveDependencies: <I need the stale value of inputValue>
	useEffect(() => {
		// Inp remains from prev card. If btn_2 == btn_3, change btn_2.
		if (card.rate === parseInt(inputValue)) {
			setInputValue(card.rate === 1 ? "2" : "1");
		}
		// rate 0 also makes btn_3 '2', so change btn_2 to '1'.
		if (card.rate === 0 && inputValue === "2") {
			setInputValue("1");
		}
		setRevealCount(0); // Matters when switching groups

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [card]);

	const handleShowNextSide = () => {
		setRevealCount((prev) => prev + 1);
	};

	const handleRateCard = (rate: string | number) => {
		const numericRate =
			typeof rate === "string" ? (rate === "" ? 1 : parseInt(rate)) : rate;
		onRateCard(numericRate);
		setRevealCount(0);
	};

	const category = card.category || "EN to NL";
	const isDevCategory = category === "Dev";

	// Check which categories have cards
	const categoriesWithCards: Set<CardCategory> = new Set();
	for (const c of allCards) {
		categoriesWithCards.add(c.category || "EN to NL");
	}

	// const allCategories: CardCategory[] = ["EN to NL", "Question NL", "Dev"];

	// const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
	// 	const newCategory = e.target.value as CardCategory;
	// 	setRevealCount(0);
	// 	onCategoryChange(newCategory);
	// };

	const renderSide = (side: string, index: number) => (
		// biome-ignore lint/suspicious/noArrayIndexKey: <Sides are static>
		<div key={index} className={`side ${index % 2 === 0 ? "" : "side-yellow"}`}>
			<h2>{side}</h2>
		</div>
	);

	return (
		<div className="flashcard">
			<div>
				<div className={`card-content ${isDevCategory ? "dev-content" : ""}`}>
					{card.sides.slice(0, revealCount + 1).map(renderSide)}
				</div>

				<div className="controls">
					{card.sides.length - 1 > revealCount && (
						<button
							type="button"
							className="show-button"
							onClick={handleShowNextSide}
						>
							{revealCount ? "Show Next Side" : "Show Answer"}
						</button>
					)}

					{revealCount > 0 && (
						<button
							type="button"
							className="show-button"
							onClick={() => handleRateCard(1)}
						>
							<div>Next</div>
						</button>
					)}

					<div className="difficulty-dots">
						{[1, 2, 3].map((dot) => (
							<div key={dot} className="dot" />
						))}
					</div>

					{/* <div
						style={{
							display: "flex",
							gap: "10px",
							justifyContent: "center",
							marginTop: "10px",
						}}
					>
						<button
							type="button"
							onClick={async () => {
								const result = await addToDefaultGroup(card.id);
								alert(result.message);
							}}
							className="add-to-default-btn winter"
							style={{ padding: "8px 16px", color: "white" }}
						>
							Add to Default
						</button>
					</div> */}
				</div>
			</div>
		</div>
	);
}

export default Card;
