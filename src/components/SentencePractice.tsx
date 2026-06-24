import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import type { SentenceType } from "types/index";
import { db } from "utils/db";
import "css/App.css";
import { formatDueAt } from "utils/utils";
import ReviewTimer from "./ReviewTimer";

interface SentencePracticeProps {
	direction: "forward" | "reverse";
	isFullBatch?: boolean;
}

function SentencePractice({
	direction,
	isFullBatch = false,
}: SentencePracticeProps) {
	const [batch, setBatch] = useState<SentenceType[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [completedWordsIndex, setCompletedWordsIndex] = useState(0);
	const [inputValue, setInputValue] = useState<string>("1");
	const [currentTimerMs, setCurrentTimerMs] = useState(0);
	const [isTimerSkipped, setIsTimerSkipped] = useState(false);
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const initialSentenceId = searchParams.get("sentenceId");
	const hiddenInputRef = useRef<HTMLInputElement>(null);
	const timerStartedAtRef = useRef(Date.now());
	const timerStoppedRef = useRef(false);
	const timerValueRef = useRef(0);
	const deleteValue = searchParams.get("delete");
	const isDeleteMode =
		deleteValue === "true" || localStorage.getItem("isDeleteMode") === "true";

	const pageTitle = "Sentence Practice";

	useEffect(() => {
		if (deleteValue === "true") {
			localStorage.setItem("isDeleteMode", "true");
		} else if (deleteValue === "false") {
			localStorage.removeItem("isDeleteMode");
		}
	}, [deleteValue]);

	// Load due sentences
	useEffect(() => {
		async function loadSentences() {
			try {
				const allSentences = await db.sentences.toArray();
				const now = Date.now();

				let targetList = allSentences;

				if (!isFullBatch) {
					targetList = allSentences.filter((s) => {
						return typeof s.dueAt === "number" && s.dueAt <= now;
					});
				} else {
					targetList = allSentences.filter((s) => s.rate !== 0);
					// Shuffle the cards
					for (let i = targetList.length - 1; i > 0; i--) {
						const j = Math.floor(Math.random() * (i + 1));
						[targetList[i], targetList[j]] = [targetList[j], targetList[i]];
					}
				}

				if (initialSentenceId) {
					const target = allSentences.find((s) => s.id === initialSentenceId);
					if (target) {
						const rest = targetList.filter((s) => s.id !== initialSentenceId);
						setBatch([target, ...rest]);
					} else {
						setBatch(targetList);
					}
				} else {
					setBatch(targetList);
				}
			} catch (error) {
				console.error("Error fetching sentences:", error);
			}
		}
		loadSentences();
	}, [initialSentenceId]);

	const currentSentence = batch[currentIndex];

	const promptText = currentSentence
		? direction === "forward"
			? currentSentence.original
			: currentSentence.translation
		: "";
	const targetText = currentSentence
		? direction === "forward"
			? currentSentence.translation
			: currentSentence.original
		: "";

	const words = targetText.trim() ? targetText.trim().split(/\s+/) : [];

	useEffect(() => {
		setCompletedWordsIndex(0);
		setCurrentTimerMs(0);
		setIsTimerSkipped(false);
		timerStartedAtRef.current = Date.now();
		timerStoppedRef.current = false;
		timerValueRef.current = 0;
		if (currentSentence) {
			setInputValue(currentSentence.rate === 1 ? "2" : "1");
			if (currentSentence.rate === 0) setInputValue("1");
		}
	}, [currentSentence]);

	useEffect(() => {
		const intervalId = window.setInterval(() => {
			if (timerStoppedRef.current) return;
			const elapsedMs = Date.now() - timerStartedAtRef.current;
			const roundedMs = Math.floor(elapsedMs / 1000) * 1000;
			timerValueRef.current = roundedMs;
			setCurrentTimerMs(roundedMs);
		}, 1000);

		return () => window.clearInterval(intervalId);
	}, [currentSentence]);

	const stopTimer = () => {
		if (timerStoppedRef.current) return timerValueRef.current;

		const elapsedMs = Date.now() - timerStartedAtRef.current;
		timerStoppedRef.current = true;
		timerValueRef.current = elapsedMs;
		setCurrentTimerMs(elapsedMs);
		return elapsedMs;
	};

	// Auto-advance if a word has no alphanumeric characters
	useEffect(() => {
		if (!currentSentence) return;
		if (completedWordsIndex < words.length) {
			const currentWord = words[completedWordsIndex];
			const match = currentWord.match(/[a-z0-9]/i);
			if (!match) {
				setCompletedWordsIndex((prev) => prev + 1);
			}
		}
	}, [completedWordsIndex, words, currentSentence]);

	// Keep the hidden input focused so iOS shows the keyboard during typing phase
	useEffect(() => {
		if (!currentSentence) return;
		if (completedWordsIndex >= words.length) return; // Fully revealed
		const el = hiddenInputRef.current;
		if (el && document.activeElement !== el) el.focus();
	}, [currentSentence, completedWordsIndex, words]);

	useEffect(() => {
		if (!currentSentence) return;
		if (completedWordsIndex < words.length) return;
		stopTimer();
	}, [currentSentence, completedWordsIndex, words]);

	const handleRateSentence = async (rate: string | number) => {
		if (!currentSentence) return;

		const numericRate =
			typeof rate === "string" ? (rate === "" ? 1 : parseInt(rate)) : rate;

		try {
			const now = Date.now();
			const dayInMs = 24 * 60 * 60 * 1000;
			const minuteInMs = 60 * 1000;

			const dueAt =
				numericRate === 0 ? now + 10 * minuteInMs : now + numericRate * dayInMs;

			const timerMs = stopTimer();
			const updates: Partial<SentenceType> = { rate: numericRate, dueAt };
			if (!isTimerSkipped) updates.timerMs = timerMs;

			await db.sentences.update(currentSentence.id, updates);

			if (initialSentenceId) {
				navigate("/sentence", { replace: true });
			} else {
				// Move to next sentence
				setCurrentIndex((prev) => prev + 1);
			}
		} catch (error) {
			console.error("Error updating sentence:", error);
		}
	};

	const handleMove = (step: number) => {
		if (!currentSentence) return;
		const timerMs = stopTimer();
		setBatch((prev) => {
			const newBatch = [...prev];
			const sentenceToMove = newBatch.splice(currentIndex, 1)[0];
			const updatedSentenceToMove = isTimerSkipped
				? sentenceToMove
				: { ...sentenceToMove, timerMs };
			const insertIndex = (currentIndex + step) % (newBatch.length + 1);
			newBatch.splice(insertIndex, 0, updatedSentenceToMove);
			return newBatch;
		});
		setCompletedWordsIndex(0); // Reset for the next sentence
	};

	const handleSkip = () => {
		if (!currentSentence) return;
		const timerMs = stopTimer();
		setBatch((prev) => {
			const newBatch = [...prev];
			const sentenceToMove = newBatch.splice(currentIndex, 1)[0];
			const updatedSentenceToMove = isTimerSkipped
				? sentenceToMove
				: { ...sentenceToMove, timerMs };
			newBatch.push(updatedSentenceToMove);
			return newBatch;
		});
		setCompletedWordsIndex(0);
	};

	const onEditSentence = (sentenceToEdit: SentenceType) => {
		if (confirm("Sure you want to leave the page?")) {
			navigate(`/sentenceForm/${sentenceToEdit.id}`);
		}
	};

	const handleDelete = async (sentenceId: string) => {
		try {
			await db.sentences.delete(sentenceId);
			setBatch((prev) => prev.filter((s) => s.id !== sentenceId));
		} catch (error) {
			console.error("Error deleting sentence:", error);
		}
	};

	if (batch.length === 0) {
		return (
			<div className="app-container">
				<div className="background">
					<div className="background-base" />
				</div>
				<div
					className="content"
					style={{ textAlign: "center", marginTop: "50px" }}
				>
					<h2>No sentences due!</h2>
					<button
						type="button"
						className="action-button primary"
						onClick={() => navigate("/")}
					>
						Go Home
					</button>
				</div>
			</div>
		);
	}

	if (currentIndex >= batch.length) {
		return (
			<div className="app-container">
				<div className="background">
					<div className="background-base" />
				</div>
				<div
					className="content"
					style={{ textAlign: "center", marginTop: "50px" }}
				>
					<h2>All due sentences completed!</h2>
					<button
						type="button"
						className="action-button primary"
						onClick={() => navigate("/")}
					>
						Go Home
					</button>
				</div>
			</div>
		);
	}

	const isFullyRevealed = completedWordsIndex >= words.length;

	const option3 = currentSentence.rate === 0 ? 2 : currentSentence.rate || 2;
	const option4 = Math.max(3, Math.floor(option3 * 1.4));

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
						<span>Sentences left: {batch.length - currentIndex}</span>
					</div>
				</div>

				<div className="card-list">
					<div className="flashcard">
						<div className="language-indicator">
							<span className="category-label">{pageTitle}</span>
						</div>

						<div className="card-content">
							<div className="side">
								<h2>{promptText}</h2>
							</div>

							{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
							<div
								className="sentence-yellow"
								onClick={() => {
									const el = hiddenInputRef.current;
									if (el && document.activeElement !== el) el.focus();
								}}
							>
								{words.map((word, i) => {
									const isCompleted = i < completedWordsIndex;
									return (
										<span key={i}>
											{/* {isCompleted ? word : word.replace(/[a-z0-9]/gi, "_")} */}
											{isCompleted ? word : "__"}
										</span>
									);
								})}
							</div>
						</div>

						<div className="controls">
							<ReviewTimer
								lastTimerMs={currentSentence.timerMs}
								currentTimerMs={currentTimerMs}
								isSkipped={isTimerSkipped}
								onSkip={() => setIsTimerSkipped(true)}
							/>

							{/* Hidden input keeps iOS keyboard open during the typing phase */}
							{!isFullyRevealed && (
								<input
									ref={hiddenInputRef}
									type="text"
									autoComplete="off"
									autoCorrect="off"
									autoCapitalize="none"
									autoFocus={true}
									spellCheck={false}
									value=""
									onChange={(e) => {
										const typed = e.target.value.slice(-1).toLowerCase();
										if (!typed) return;
										const currentWord = words[completedWordsIndex];
										if (!currentWord) return;
										const match = currentWord.match(/[a-z0-9]/i);
										const expectedChar = match ? match[0].toLowerCase() : null;
										if (expectedChar && typed === expectedChar) {
											setCompletedWordsIndex((prev) => prev + 1);
										}
									}}
									style={{
										position: "fixed",
										top: 0,
										left: 0,
										width: "1px",
										height: "1px",
										opacity: 0,
										pointerEvents: "none",
									}}
								/>
							)}
							{!isFullyRevealed && (
								<button
									type="button"
									className="show-button"
									onClick={() => {
										stopTimer();
										setCompletedWordsIndex(words.length);
									}}
								>
									Show Answer
								</button>
							)}

							{isFullyRevealed && (
								<div className="review-buttons" style={{ marginTop: "20px" }}>
									<div className="rating-buttons">
										<button type="button" onClick={() => handleRateSentence(0)}>
											<div>10</div>
											<div>min</div>
										</button>
										<div className="interactive">
											<input
												autoFocus
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
												onClick={() => handleRateSentence(inputValue)}
												className="interactive-button"
											>
												<div>{inputValue || "0"}</div>
												<div>
													day
													{inputValue === "" || inputValue === "1" ? "" : "s"}
												</div>
											</button>
										</div>
										<button
											type="button"
											onClick={() => handleRateSentence(option3)}
										>
											<div>{option3}</div>
											<div>day{option3 === 1 ? "" : "s"}</div>
										</button>
										<button
											type="button"
											onClick={() => handleRateSentence(option4)}
										>
											<div>{option4}</div>
											<div>days</div>
										</button>
									</div>

									<div className="movement-buttons">
										<button
											type="button"
											className="winter"
											onClick={() => handleMove(7)}
										>
											#7
										</button>
										<button
											type="button"
											className="winter"
											onClick={() => handleMove(30)}
										>
											#30
										</button>
										<button
											type="button"
											className="winter"
											onClick={handleSkip}
										>
											Last
										</button>
									</div>
								</div>
							)}

							{isFullyRevealed && (
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
										className="action-button primary"
										onClick={() => onEditSentence(currentSentence)}
									>
										Edit
									</button>
								</div>
							)}

							{isDeleteMode && (
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
										className="delete-button"
										onClick={() => handleDelete(currentSentence.id)}
									>
										Delete
									</button>
								</div>
							)}
						</div>
					</div>
				</div>

				<div className="debug-info">
					<div>Index:</div>
					<div>{currentIndex}</div>
					<div>Rate: {currentSentence.rate}</div>
					<div>{formatDueAt(currentSentence.dueAt)}</div>
				</div>
			</div>
		</div>
	);
}

export default SentencePractice;
