import { useEffect, useState, type ChangeEvent } from "react";
import type { SentenceType } from "types/index";
import "css/form.css";
import { useNavigate, useParams } from "react-router";
import { db } from "utils/db";

const SentenceForm = () => {
	const [original, setOriginal] = useState<string>("");
	const [translation, setTranslation] = useState<string>("");
	const [sentence, setSentence] = useState<SentenceType | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [dueNow, setDueNow] = useState<boolean>(true);

	const { id } = useParams();
	const navigate = useNavigate();

	useEffect(() => {
		if (id) {
			fetchSentence(id);
		} else {
			setLoading(false);
		}
		return () => {
			setSentence(null);
			setOriginal("");
			setTranslation("");
			setError(null);
			setLoading(true);
		};
	}, [id]);

	const fetchSentence = async (sentenceId: string) => {
		try {
			const fetchedSentence = await db.sentences.get(sentenceId);
			if (fetchedSentence) {
				setSentence(fetchedSentence);
				setOriginal(fetchedSentence.original);
				setTranslation(fetchedSentence.translation);
			} else {
				setError("Sentence not found");
			}
		} catch {
			setError("Error fetching sentence data");
		} finally {
			setLoading(false);
		}
	};

	if (loading) return <div>Loading...</div>;
	if (error) return <div>{error}</div>;

	const handleSubmit = async (): Promise<void> => {
		try {
			if (!original.trim() || !translation.trim()) {
				alert("Please fill in both fields");
				return;
			}

			if (!sentence) {
				// Create new sentence
				const newSentence: SentenceType = {
					id: crypto.randomUUID(),
					original: original.trim(),
					translation: translation.trim(),
					rate: null,
					dueAt: dueNow ? Date.now() : null,
				};

				await db.sentences.add(newSentence);

				// Reset form for next sentence
				setOriginal("");
				setTranslation("");
			} else {
				// Update existing sentence
				await db.sentences.update(sentence.id, {
					original: original.trim(),
					translation: translation.trim(),
				});
				navigate("/sentence");
			}
		} catch (error) {
			console.error("Error creating/updating sentence:", error);
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
					<h1>{sentence ? "Edit Sentence" : "Create a New Sentence"}</h1>
				</div>

				<div className="card-form" key={id} id={id}>
					{sentence && <h4 className="card-id">ID: {sentence.id}</h4>}

					<div className="sides-container">
						<div className="card-list">
							<div className="input-group flashcard">
								<label className="side-label" htmlFor="_original">
									Original
								</label>
								<textarea
									id="_original"
									className="side-input"
									value={original}
									autoCorrect="off"
									onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
										setOriginal(e.target.value)
									}
									placeholder="e.g. You are very happy"
								/>
							</div>
						</div>

						<div className="card-list">
							<div className="input-group flashcard">
								<label className="side-label" htmlFor="_translation">
									Translation
								</label>
								<textarea
									id="_translation"
									className="side-input"
									value={translation}
									autoCorrect="off"
									onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
										setTranslation(e.target.value)
									}
									placeholder="e.g. Jij bent heel blij"
								/>
							</div>
						</div>
					</div>

					<div className="button-group">
						{!sentence && (
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "8px",
									color: "white",
								}}
							>
								<input
									type="checkbox"
									id="dueNow"
									checked={dueNow}
									onChange={(e) => setDueNow(e.target.checked)}
									style={{ width: "20px", height: "20px" }}
								/>
								<label htmlFor="dueNow" style={{ cursor: "pointer" }}>
									{dueNow ? "Due now" : 'Due: "null"'}
								</label>
							</div>
						)}
						<button
							className={`action-button ${original && translation ? "primary" : "secondary"}`}
							type="button"
							onClick={handleSubmit}
						>
							Submit
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SentenceForm;
