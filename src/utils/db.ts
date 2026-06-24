import Dexie, { type Table } from "dexie";

import type { CardType, GroupType, SettingsType, SentenceType } from "types/index";

export class CardDatabase extends Dexie {
	cards!: Table<CardType, string>;
	groups!: Table<GroupType, string>;
	settings!: Table<SettingsType, string>;
	sentences!: Table<SentenceType, string>;

	constructor() {
		super("CardDatabase");

		// Old schema
		this.version(3).stores({
			cards: "id, reviewedAt, rate",
		});

		// New schema
		this.version(4)
			.stores({
				cards: "id, dueAt, rate",
			})
			.upgrade((tx) => {
				// Safely remove reviewedAt from every card
				return tx
					.table("cards")
					.toCollection()
					.modify((card: CardType & { reviewedAt?: number }) => {
						// biome-ignore lint/performance/noDelete: <explanation>
						delete card.reviewedAt;
					});
			});

		// Schema with groups
		this.version(5).stores({
			cards: "id, dueAt, rate",
			groups: "id, name",
		});

		// Migration: set dueAt to Infinity for rate 0
		this.version(8)
			.stores({
				cards: "id, dueAt, rate",
				groups: "id, name",
			})
			.upgrade((tx) => {
				return tx
					.table("cards")
					.toCollection()
					.modify((card: CardType) => {
						if (card.rate === 0) {
							card.dueAt = Infinity;
						}
					});
			});

		// Version 9: Add isDefault to groups
		this.version(9).stores({
			cards: "id, dueAt, rate",
			groups: "id, name, isDefault",
		});

		// Version 10: Initialize isDefault to false for existing groups
		this.version(10)
			.stores({
				cards: "id, dueAt, rate",
				groups: "id, name, isDefault",
			})
			.upgrade((tx) => {
				return tx
					.table("groups")
					.toCollection()
					.modify((group: GroupType) => {
						group.isDefault = false; // Initial value
					});
			});

		// Version 11: Add settings table and move default group to settings
		this.version(11)
			.stores({
				cards: "id, dueAt, rate",
				groups: "id, name", // Removed isDefault from schema definition, though it might persist in objects until cleaned
				settings: "id",
			})
			.upgrade(async (tx) => {
				// Find the group that was default
				const defaultGroup = await tx
					.table("groups")
					.filter((g) => !!g.isDefault)
					.first();

				if (defaultGroup) {
					await tx.table("settings").put({
						id: "global",
						defaultGroupId: defaultGroup.id,
					});
				}
				
				// Optional: Remove isDefault from groups? 
				// For now keeping it simple, new writes won't have it, old reads might ignore it.
			});

		// Version 12: Add sentences table
		this.version(12).stores({
			cards: "id, dueAt, rate",
			groups: "id, name",
			settings: "id",
			sentences: "id, dueAt, rate",
		});
	}
}

export const db = new CardDatabase();



export async function addToDefaultGroup(cardId: string): Promise<{ success: boolean; message: string }> {
	try {
		const settings = await db.settings.get("global");
		const defaultGroupId = settings?.defaultGroupId;

		if (!defaultGroupId) {
			return { success: false, message: "No default group set." };
		}

		const defaultGroup = await db.groups.get(defaultGroupId);

		if (!defaultGroup) {
			return { success: false, message: "Default group not found (maybe deleted)." };
		}

		if (defaultGroup.cardIds.includes(cardId)) {
			return { success: true, message: "Card already in default group." };
		}

		defaultGroup.cardIds.push(cardId);
		await db.groups.put(defaultGroup);
		return { success: true, message: `Added to default group: "${defaultGroup.name}"` };
	} catch (error) {
		console.error("Error adding to default group:", error);
		return { success: false, message: "Failed to add to default group." };
	}
}
