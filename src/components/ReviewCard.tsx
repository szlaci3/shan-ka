import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import type { CardCategory, CardType } from "types/index";
import { addToDefaultGroup } from "utils/db";
import ReviewTimer from "./ReviewTimer";

interface ReviewCardProps {
	card: CardType;
	onRate: (rate: number, timerMs?: number) => void;
	onMove: (step: number, timerMs?: number) => void;
	onSkip: (timerMs?: number) => void;
	allCards: CardType[];
	category: CardCategory;
}

function ReviewCard({ card, onRate, onMove, onSkip }: ReviewCardProps) {
	const [revealCount, setRevealCount] = useState(0);
	const [inputValue, setInputValue] = useState<string>("1");
	const [currentTimerMs, setCurrentTimerMs] = useState(0);
	const [isTimerSkipped, setIsTimerSkipped] = useState(false);
	const timerStartedAtRef = useRef(Date.now());
	const timerStoppedRef = useRef(false);
	const timerValueRef = useRef(0);
	const navigate = useNavigate();

	const onEditCard = (cardToEdit: CardType) => {
		if (confirm("Sure you want to leave the page?")) {
			navigate(`/cardForm/${cardToEdit.id}`);
		}
	};

	useEffect(() => {
		// Reset state when card changes
		if (card.rate === parseInt(inputValue)) {
			setInputValue(card.rate === 1 ? "2" : "1");
		}
		if (card.rate === 0 && inputValue === "2") {
			setInputValue("1");
		}
		setRevealCount(0);
		setCurrentTimerMs(0);
		setIsTimerSkipped(false);
		timerStartedAtRef.current = Date.now();
		timerStoppedRef.current = false;
		timerValueRef.current = 0;
	}, [card]);

	useEffect(() => {
		const intervalId = window.setInterval(() => {
			if (timerStoppedRef.current) return;
			const elapsedMs = Date.now() - timerStartedAtRef.current;
			const roundedMs = Math.floor(elapsedMs / 1000) * 1000;
			timerValueRef.current = roundedMs;
			setCurrentTimerMs(roundedMs);
		}, 1000);

		return () => window.clearInterval(intervalId);
	}, [card]);

	const stopTimer = () => {
		if (timerStoppedRef.current) return timerValueRef.current;

		const elapsedMs = Date.now() - timerStartedAtRef.current;
		timerStoppedRef.current = true;
		timerValueRef.current = elapsedMs;
		setCurrentTimerMs(elapsedMs);
		return elapsedMs;
	};

	const handleShowNextSide = () => {
		if (revealCount === 0) {
			stopTimer();
		}
		setRevealCount((prev) => prev + 1);
	};

	const handleRateCard = (rate: string | number) => {
		const numericRate =
			typeof rate === "string" ? (rate === "" ? 1 : parseInt(rate)) : rate;
		const timerMs = stopTimer();
		onRate(numericRate, isTimerSkipped ? undefined : timerMs);
		setRevealCount(0);
	};

	const handleMoveCard = (step: number) => {
		const timerMs = stopTimer();
		onMove(step, isTimerSkipped ? undefined : timerMs);
	};

	const handleSkipCard = () => {
		const timerMs = stopTimer();
		onSkip(isTimerSkipped ? undefined : timerMs);
	};

	const option3 = card.rate === 0 ? 2 : card.rate || 2;
	const option4 = Math.max(3, Math.floor(option3 * 1.4));

	const isDevCategory = card.category === "Dev";

	const isInverse = window.location.pathname.includes("/inverse");
	const isGroup = window.location.pathname.includes("/groups");
	const isInverseOrGroup = isInverse || isGroup;

	const renderSide = (side: string, index: number) => (
		// biome-ignore lint/suspicious/noArrayIndexKey: <Sides are static>
		<div key={index} className={`side ${index % 2 === 0 ? "" : "side-yellow"}`}>
			<h2>{side}</h2>
		</div>
	);

	return (
		<div className="card-list">
			<div className="flashcard">
				<div>
					<div className="language-indicator">
						<span className="category-label">
							{card.category || "EN to NL"}
						</span>
					</div>

					<div className={`card-content ${isDevCategory ? "dev-content" : ""}`}>
						{card.sides.slice(0, revealCount + 1).map(renderSide)}
					</div>

					<div className="controls">
						<ReviewTimer
							lastTimerMs={card.timerMs}
							currentTimerMs={currentTimerMs}
							isSkipped={isTimerSkipped}
							onSkip={() => setIsTimerSkipped(true)}
						/>

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
							<div className="review-buttons">
								<div className="rating-buttons">
									<button type="button" onClick={() => handleRateCard(0)}>
										<div>10</div>
										<div>min</div>
									</button>
									<div className="interactive">
										<input
											type="number"
											value={inputValue}
											onChange={(ev) => {
												const num =
													ev.target.value === ""
														? ""
														: Math.max(
																1,
																Math.min(999, +ev.target.value),
															).toString();
												setInputValue(num);
											}}
											onFocus={() => setInputValue("")}
											min={1}
											max={999}
										/>
										<button
											type="button"
											onClick={() => handleRateCard(inputValue)}
											className="interactive-button"
										>
											<div>{inputValue || "0"}</div>
											<div>
												day{inputValue === "" || inputValue === "1" ? "" : "s"}
											</div>
										</button>
									</div>
									<button type="button" onClick={() => handleRateCard(option3)}>
										<div>{option3}</div>
										<div>day{option3 === 1 ? "" : "s"}</div>
									</button>
									{!isInverseOrGroup && (
										<button
											type="button"
											onClick={() => handleRateCard(option4)}
										>
											<div>{option4}</div>
											<div>days</div>
										</button>
									)}
								</div>

								<div className="movement-buttons">
									<button
										type="button"
										className="winter"
										onClick={() => handleMoveCard(7)}
									>
										#7
									</button>
									<button
										type="button"
										className="winter"
										onClick={() => handleMoveCard(30)}
									>
										#30
									</button>
									<button
										type="button"
										className="winter"
										onClick={handleSkipCard}
									>
										Last
									</button>
								</div>
							</div>
						)}

						<div className="difficulty-dots">
							{[1, 2, 3].map((dot) => (
								<div key={dot} className="dot" />
							))}
						</div>

						<div
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
							<button
								type="button"
								className="action-button primary"
								onClick={() => onEditCard(card)}
							>
								Edit
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default ReviewCard;
