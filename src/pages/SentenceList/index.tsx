import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { SentenceType } from "types/index";
import { db } from "utils/db";
import "css/App.css";
import { formatDueAt } from "utils/utils";

function SentenceList() {
	const [sentences, setSentences] = useState<SentenceType[]>([]);
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [filteredSentences, setFilteredSentences] = useState<SentenceType[]>([]);
	const navigate = useNavigate();

	useEffect(() => {
		async function loadSentences() {
			try {
				const allSentences = await db.sentences.toArray();
				setSentences(allSentences);
			} catch (error) {
				console.error("Error fetching sentences:", error);
			}
		}
		loadSentences();
	}, []);

	useEffect(() => {
		// allow max 50 sentences to show
		if (searchQuery.trim() === "") {
			setFilteredSentences(sentences.slice(0, 50));
		} else {
			const query = searchQuery.toLowerCase();
			const filtered = sentences.filter((s) =>
				s.original.toLowerCase().includes(query) || s.translation.toLowerCase().includes(query)
			);
			setFilteredSentences(filtered.slice(0, 50));
		}
	}, [searchQuery, sentences]);

	const handleEdit = (sentenceId: string, e: React.MouseEvent) => {
		e.stopPropagation();
		navigate(`/sentenceForm/${sentenceId}`);
	};

	const handleDelete = async (sentenceId: string, e: React.MouseEvent) => {
		e.stopPropagation();
		if (confirm("Are you sure you want to delete this sentence?")) {
			try {
				await db.sentences.delete(sentenceId);
				setSentences((prev) => prev.filter((s) => s.id !== sentenceId));
			} catch (error) {
				console.error("Error deleting sentence:", error);
			}
		}
	};

	const handleDeleteAll = async () => {
		if (
			confirm("Delete ALL?") && 
			confirm("Are you sure you want to delete ALL sentences? This action cannot be undone.")
		) {
			try {
				await db.sentences.clear();
				setSentences([]);
			} catch (error) {
				console.error("Error deleting all sentences:", error);
			}
		}
	};

	const handleExportDB = async () => {
		try {
			const allSentences = await db.sentences.toArray();
			const dataStr = JSON.stringify(allSentences, null, 2);
			const dataBlob = new Blob([dataStr], { type: "application/json" });
			const url = URL.createObjectURL(dataBlob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `sentence-database-backup-${new Date().toISOString().split("T")[0]}.json`;
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
			const importedSentences: SentenceType[] = JSON.parse(text);

			if (!Array.isArray(importedSentences)) {
				throw new Error("Invalid file format. Expected an array of sentences.");
			}

			if (
				!confirm(
					`This will add/update ${importedSentences.length} sentences from the uploaded file to your existing collection. Are you sure?`,
				)
			) {
				event.target.value = "";
				return;
			}

			// Add or update sentences from import
			await db.sentences.bulkPut(importedSentences);
			const allSentences = await db.sentences.toArray();
			setSentences(allSentences);

			alert(`Successfully added/updated ${importedSentences.length} sentences!`);
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
				"Are you sure you want to fast forward all sentences by 1 day? This will make all sentences due 1 day earlier.",
			)
		) {
			return;
		}

		try {
			const dayInMs = 24 * 60 * 60 * 1000;
			const allSentences = await db.sentences.toArray();

			// Update all sentences that have a dueAt value
			const updates = allSentences
				.filter((s) => s.dueAt !== null && s.dueAt !== undefined)
				.map((s) => ({
					...s,
					dueAt: (s.dueAt as number) - dayInMs,
				}));

			await db.sentences.bulkPut(updates);
			const updatedSentences = await db.sentences.toArray();
			setSentences(updatedSentences);
		} catch (error) {
			console.error("Error fast forwarding sentences:", error);
			alert("Failed to fast forward sentences. Please try again.");
		}
	};

	const handleSlowDown = async () => {
		if (
			!confirm(
				"Are you sure you want to slow down all sentences by 1 day? This will make all sentences due 1 day later.",
			)
		) {
			return;
		}

		try {
			const dayInMs = 24 * 60 * 60 * 1000;
			const allSentences = await db.sentences.toArray();

			// Update all sentences that have a dueAt value
			const updates = allSentences
				.filter((s) => s.dueAt !== null && s.dueAt !== undefined)
				.map((s) => ({
					...s,
					dueAt: (s.dueAt as number) + dayInMs,
				}));

			await db.sentences.bulkPut(updates);
			const updatedSentences = await db.sentences.toArray();
			setSentences(updatedSentences);
		} catch (error) {
			console.error("Error slowing down sentences:", error);
			alert("Failed to slow down sentences. Please try again.");
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
					<h1>Sentence List</h1>
					<div className="list-controls">
						<div className="search-wrapper">
							<input
								type="text"
								placeholder="Search sentences..."
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
							title="Fast forward: Make all sentences due 1 day earlier"
						>
							&gt;&gt;
						</button>
						<button
							type="button"
							onClick={handleSlowDown}
							className="slow-down-button"
							title="Slow down: Make all sentences due 1 day later"
						>
							&lt;&lt;
						</button>
						<button
							type="button"
							onClick={handleDeleteAll}
							className="delete-all-button"
						>
							Delete All Sentences
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
						Showing {filteredSentences.length} of {sentences.length} sentences
					</div>
				</div>

				<div className="cards-list-container">
					{filteredSentences.length === 0 ? (
						<div className="no-cards-message">
							{searchQuery.trim() === ""
								? "No sentences found. Create your first sentence!"
								: "No sentences match your search."}
						</div>
					) : (
						filteredSentences.map((sentence) => (
							<div
								key={sentence.id}
								className="card-list-item"
								onClick={() => navigate(`/sentence?sentenceId=${sentence.id}`)}
								role="button"
								tabIndex={0}
								style={{ cursor: "pointer" }}
							>
								<div className="card-list-content" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px" }}>
									<div className="card-list-side" style={{ fontWeight: "bold" }}>
										{sentence.original || "Empty"}
									</div>
									<div className="card-list-side" style={{ fontSize: "0.9em", color: "#666" }}>
										{sentence.translation || "Empty"}
									</div>
									<div
										className={`card-list-due ${
											sentence.dueAt != null && sentence.dueAt < Date.now()
												? "past"
												: ""
										}`}
										style={{ marginTop: "4px" }}
									>
										{formatDueAt(sentence.dueAt)}
									</div>
								</div>
								<div className="card-list-actions">
									<button
										type="button"
										onClick={(e) => handleEdit(sentence.id, e)}
										className="edit-button"
									>
										Edit
									</button>
									<button
										type="button"
										onClick={(e) => handleDelete(sentence.id, e)}
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

export default SentenceList;
