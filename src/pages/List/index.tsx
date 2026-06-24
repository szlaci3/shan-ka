import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { CardType } from "types/index";
import { addToDefaultGroup, db } from "utils/db";
import "css/App.css";
import { formatDueAt } from "utils/utils";

function List() {
	const [cards, setCards] = useState<CardType[]>([]);
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [filteredCards, setFilteredCards] = useState<CardType[]>([]);
	const navigate = useNavigate();

	useEffect(() => {
		async function loadCards() {
			try {

				const allCards = await db.cards.toArray();
				setCards(allCards);
			} catch (error) {
				console.error("Error fetching cards:", error);
			}
		}
		loadCards();
	}, []);

	useEffect(() => {
		// allow max 50 cards to show
		if (searchQuery.trim() === "") {
			setFilteredCards(cards.slice(0, 50));
		} else {
			const query = searchQuery.toLowerCase();
			const filtered = cards.filter((card) =>
				card.sides.some((side) => side.toLowerCase().includes(query)),
			);
			setFilteredCards(filtered.slice(0, 50));
		}
	}, [searchQuery, cards]);

	const handleEdit = (cardId: string, e: React.MouseEvent) => {
		e.stopPropagation();
		navigate(`/cardForm/${cardId}`);
	};

	const handleDelete = async (cardId: string, e: React.MouseEvent) => {
		e.stopPropagation();
		if (confirm("Are you sure you want to delete this card?")) {
			try {
				await db.cards.delete(cardId);
				setCards((prevCards) => prevCards.filter((card) => card.id !== cardId));
			} catch (error) {
				console.error("Error deleting card:", error);
			}
		}
	};

	
	const handleDeleteAll = async () => {
		if (
			confirm(
				"Delete ALL?",
			) && confirm(
				"Are you sure you want to delete ALL cards? This action cannot be undone.",
			)
		) {
			try {
				await db.cards.clear();
				setCards([]);
			} catch (error) {
				console.error("Error deleting all cards:", error);
			}
		}
	};


	const handleAddToDefaultGroup = async (cardId: string, e: React.MouseEvent) => {
		e.stopPropagation();
		const result = await addToDefaultGroup(cardId);
		alert(result.message);
	};

	const handleCardClick = (cardId: string) => {
		navigate(`/?cardId=${cardId}`);
	};

	const handleExportDB = async () => {
		try {
			const allCards = await db.cards.toArray();
			const dataStr = JSON.stringify(allCards, null, 2);
			const dataBlob = new Blob([dataStr], { type: "application/json" });
			const url = URL.createObjectURL(dataBlob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `card-database-backup-${new Date().toISOString().split("T")[0]}.json`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Error exporting database:", error);
			alert("Failed to export database. Please try again.");
		}
	};

	const handleImportDB = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		try {
			const text = await file.text();
			const importedCards: CardType[] = JSON.parse(text);

			if (!Array.isArray(importedCards)) {
				throw new Error("Invalid file format. Expected an array of cards.");
			}

			if (
				!confirm(
					`This will add/update ${importedCards.length} cards from the uploaded file to your existing collection. Are you sure?`,
				)
			) {
				event.target.value = "";
				return;
			}

			// Add or update cards from import
			await db.cards.bulkPut(importedCards);
			const allCards = await db.cards.toArray();
			setCards(allCards);

			alert(`Successfully added/updated ${importedCards.length} cards!`);
		} catch (error) {
			console.error("Error importing database:", error);
			alert(
				"Failed to import database. Please make sure the file is a valid JSON backup.",
			);
		} finally {
			// Reset the input so the same file can be selected again
			event.target.value = "";
		}
	};

	const handleFastForward = async () => {
		if (
			!confirm(
				"Are you sure you want to fast forward all cards by 1 day? This will make all cards due 1 day earlier.",
			)
		) {
			return;
		}

		try {
			const dayInMs = 24 * 60 * 60 * 1000;
			const allCards = await db.cards.toArray();

			// Update all cards that have a dueAt value
			const updates = allCards
				.filter((card) => card.dueAt !== null && card.dueAt !== undefined)
				.map((card) => ({
					...card,
					dueAt: (card.dueAt as number) - dayInMs,
				}));

			await db.cards.bulkPut(updates);
			const updatedCards = await db.cards.toArray();
			setCards(updatedCards);
		} catch (error) {
			console.error("Error fast forwarding cards:", error);
			alert("Failed to fast forward cards. Please try again.");
		}
	};

	const handleSlowDown = async () => {
		if (
			!confirm(
				"Are you sure you want to slow down all cards by 1 day? This will make all cards due 1 day later.",
			)
		) {
			return;
		}

		try {
			const dayInMs = 24 * 60 * 60 * 1000;
			const allCards = await db.cards.toArray();

			// Update all cards that have a dueAt value
			const updates = allCards
				.filter((card) => card.dueAt !== null && card.dueAt !== undefined)
				.map((card) => ({
					...card,
					dueAt: (card.dueAt as number) + dayInMs,
				}));

			await db.cards.bulkPut(updates);
			const updatedCards = await db.cards.toArray();
			setCards(updatedCards);
		} catch (error) {
			console.error("Error slowing down cards:", error);
			alert("Failed to slow down cards. Please try again.");
		}
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
					<h1>Card List</h1>
					<div className="list-controls">
						<div className="search-wrapper">
							<input
								type="text"
								placeholder="Search cards..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="search-input"
							/>
							{searchQuery && (
								<button
									type="button"
									className="search-clear-btn"
									onClick={() => setSearchQuery("")}
									aria-label="Clear search"
								>
									✕
								</button>
							)}
						</div>
						<button
							type="button"
							onClick={handleFastForward}
							className="fast-forward-button"
							title="Fast forward: Make all cards due 1 day earlier"
						>
							&gt;&gt;
						</button>
						<button
							type="button"
							onClick={handleSlowDown}
							className="slow-down-button"
							title="Slow down: Make all cards due 1 day later"
						>
							&lt;&lt;
						</button>
						<button
							type="button"
							onClick={handleDeleteAll}
							className="delete-all-button"
						>
							Delete All Cards
						</button>
						<button
							type="button"
							onClick={handleExportDB}
							className="export-button"
						>
							Export DB
						</button>
						<label htmlFor="import-db-input" className="import-button">
							Add to DB
							<input
								id="import-db-input"
								type="file"
								accept=".json"
								onChange={handleImportDB}
								style={{ display: "none" }}
							/>
						</label>
					</div>
					<div className="card-count">
						Showing {filteredCards.length} of {cards.length} cards
					</div>
				</div>

				<div className="cards-list-container">
					{filteredCards.length === 0 ? (
						<div className="no-cards-message">
							{searchQuery.trim() === ""
								? "No cards found. Create your first card!"
								: "No cards match your search."}
						</div>
					) : (
						filteredCards.map((card) => (
							<div
								key={card.id}
								className="card-list-item"
								onClick={() => handleCardClick(card.id)}
								role="button"
								tabIndex={0}
							>
								<div className="card-list-content">
									<div className="card-list-side">
										{card.sides[0] || "Empty card"}
									</div>
									<div
										className={`card-list-due ${
											card.dueAt != null && card.dueAt < Date.now()
												? "past"
												: ""
										}`}
									>
										{formatDueAt(card.dueAt)}
									</div>
								</div>
								<div className="card-list-actions">
									<button
										type="button"
										onClick={(e) => handleAddToDefaultGroup(card.id, e)}
										className="add-to-default-btn winter"
										title="Add to Default Group"
										style={{ marginRight: "5px", cursor: "pointer" }}
									>
										★
									</button>
									<button
										type="button"
										onClick={(e) => handleEdit(card.id, e)}
										className="edit-button"
									>
										Edit
									</button>
									<button
										type="button"
										onClick={(e) => handleDelete(card.id, e)}
										className="delete-button"
									>
										Delete
									</button>
								</div>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
}

export default List;
