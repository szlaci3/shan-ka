import { useEffect, useState } from "react";
import type { CardType, GroupType } from "types/index";
import { db } from "utils/db";

interface CreateGroupProps {
	groupId?: string;
	onSave: (newGroup: GroupType) => void;
}

function CreateGroup({ groupId, onSave }: CreateGroupProps) {
	const [cards, setCards] = useState<CardType[]>([]);
	const [hasPlusBeenClickedOnce, setHasPlusBeenClickedOnce] = useState(false);
	const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(
		new Set(),
	);
	const [groupName, setGroupName] = useState<string>("");
	const [isDefault, setIsDefault] = useState(false);

	useEffect(() => {
		async function loadData() {
			// Edit mode
			if (groupId) {
				const group = await db.groups.get(groupId);
				if (group) {
					setGroupName(group.name);
					const settings = await db.settings.get("global");
					setIsDefault(settings?.defaultGroupId === group.id);
					setSelectedCardIds(new Set(group.cardIds));

					// Load selected cards + up to 50 rate 0 cards
					const allCards = await db.cards.toArray();
					const selectedCards = allCards.filter((c) =>
						group.cardIds.includes(c.id),
					);
					const otherCards = allCards
						.filter(
							(c) =>
								!group.cardIds.includes(c.id) && (c.rate === 0 || c.rate === null),
						)
						.slice(0, 50);

					setCards([...selectedCards, ...otherCards]);
				}
			} else {
				// Create mode
				const allCards = await db.cards.toArray();
				// Filter for rate 0 or null (assuming null is like 0 explicitly mentioned rate 0)
				const eligibleCards = allCards.filter(
					(c) => c.rate === 0 || c.rate === null || c.rate === undefined,
				);

				// Take first 50
				const displayCards = eligibleCards.slice(0, 50);
				setCards(displayCards);

				// Select first 7 by default
				const initialSelection = displayCards.slice(0, 7).map((c) => c.id);
				setSelectedCardIds(new Set(initialSelection));
			}
		}
		loadData();
	}, [groupId]);

	const addCard = (clickedCardId: string) => {
		const newSelected = new Set(selectedCardIds);
		// Select
		newSelected.add(clickedCardId);
		setHasPlusBeenClickedOnce(true);
		setSelectedCardIds(newSelected);
	};

	const removeCardFromList = (cardId: string) => {
		// UI requirement: "removes the card both from the group and from the loaded list"
		// and "automatically selects another card, the first one that is not selected"
		const newCards = cards.filter((c) => c.id !== cardId);
		setCards(newCards);

		const newSelected = new Set(selectedCardIds);
		newSelected.delete(cardId);

		// If we removed a selected card, try to replace it
		if (selectedCardIds.has(cardId) && !hasPlusBeenClickedOnce) {
			const candidate = newCards.find((c) => !newSelected.has(c.id));
			if (candidate) {
				newSelected.add(candidate.id);
			}
		}
		setSelectedCardIds(newSelected);
	};

	const makeNameFromWord = () => {
		const expression = cards.find((c) => c.id === selectedCardIds.values().next().value)?.sides[0];
		if (!expression) return "A";	
		const [firstWord, secondWord] = expression.split(" ");
		return secondWord ?? firstWord;
	}
	
	const handleSave = async () => {
		const uniqueName = groupId
			? groupName
			: (() => {
					// Generate name: Nov 12 <engWord>, etc.
					const dateStr = new Date().toLocaleString("en-US", {
						month: "short",
						day: "numeric",
					});
					return `${dateStr} ${makeNameFromWord()}`; 
			  })();

		const newGroup: GroupType = {
			id: groupId || crypto.randomUUID(),
			name: uniqueName,
			cardIds: Array.from(selectedCardIds),
			// isDefault removed
		};

		setCardsToDueNow();

		await db.groups.put(newGroup);

		// Update settings
		if (isDefault) {
			await db.settings.put({ id: "global", defaultGroupId: newGroup.id });
		} else {
			// If we are unchecking it, and it WAS the default, we should unset it.
			const settings = await db.settings.get("global");
			if (settings?.defaultGroupId === newGroup.id) {
				await db.settings.put({ id: "global", defaultGroupId: undefined });
			}
		}

		onSave(newGroup);
	};

	const setCardsToDueNow = async () => {
		const cardsToUpdate = await db.cards.bulkGet(Array.from(selectedCardIds));
		const now = Date.now();
		const updates = cardsToUpdate
			.filter((c): c is CardType => !!c)
			.map((c) => ({ ...c, dueAt: now }));

		if (updates.length > 0) {
			await db.cards.bulkPut(updates);
		}
	};

	return (
		<div className="create-group-container">
			<div className="create-group-header">
				<button type="button" onClick={handleSave} className="save-group-btn winter">
					{groupId ? "Update Group" : "Save Group"}
				</button>
				{groupId && <button type="button" onClick={setCardsToDueNow} className="set-cards-to-due-btn winter">
					Set Cards to Due Now
				</button>}
				<label className="checkbox-label" style={{ display: "flex", alignItems: "center", marginLeft: "10px", color: "white" }}>
					<input
						type="checkbox"
						checked={isDefault}
						onChange={(e) => setIsDefault(e.target.checked)}
						style={{ marginRight: "5px" }}
					/>
					Default Group
				</label>
			</div>
			<div className="group-cards-list">
				{cards.map((card) => {
					const isSelected = selectedCardIds.has(card.id);
					return (
						<div key={card.id} className={isSelected ? "group-card-item selected" : "group-card-item"}>
							<div className="group-card-content">
                                {/* Display first two sides */}
								<div className="group-card-side">{card.sides[0]}</div>
								<div className="group-card-side">{card.sides[1]}</div>
							</div>
							<div className="group-card-action">
								{isSelected ? (
									<button
										type="button"
										className="remove-card-btn"
										onClick={() => removeCardFromList(card.id)}
									>
										-
									</button>
								) : (
									<button
										type="button"
										className="add-card-btn"
										onClick={() => addCard(card.id)}
									>
										+
									</button>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

export default CreateGroup;
