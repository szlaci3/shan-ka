export type CardCategory = "EN to NL" | "Question NL" | "Dev";


export interface GroupType {
	id: string;
	cardIds: string[];
	name: string;
	/** @deprecated Use settings for default group now */
	isDefault?: boolean;
}

export interface SettingsType {
	id: string;
	defaultGroupId?: string;
}

export interface CardType {
	id: string;
	sides: string[];
	dueAt?: number | null;
	rate?: number | null;
	category?: CardCategory;
	timerMs?: number;
}

export interface CardProps {
	card: CardType;
	onRateCard: (rate: number) => void;
	allCards: CardType[];
	selectedCategory: CardCategory;
	onCategoryChange: (category: CardCategory) => void;
}

export interface StudySessionProps {
	cards: CardType[];
	onRateCard: (card: CardType, rate: number) => void;
}

export interface SentenceType {
	id: string;
	original: string;
	translation: string;
	rate: number | null;
	dueAt: number | null;
	timerMs?: number;
}
