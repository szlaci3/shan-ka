interface ReviewTimerProps {
	lastTimerMs?: number;
	currentTimerMs: number;
	isSkipped: boolean;
	onSkip: () => void;
}

export function formatTimerMs(ms: number): string {
	const sign = ms < 0 ? "-" : "";
	const absoluteMs = Math.abs(ms);
	const totalSeconds = Math.floor(absoluteMs / 1000);
	const deciseconds = absoluteMs % 10;
	const seconds = totalSeconds % 60;
	const minutes = Math.floor(totalSeconds / 60) % 60;
	const hours = Math.floor(totalSeconds / 3600);
	const parts: string[] = [];

	if (hours > 0) parts.push(hours.toString());
	if (minutes > 0) parts.push(minutes.toString());
	parts.push(seconds.toString());
	parts.push(deciseconds.toString());

	return `${sign}${parts.join(":")}`;
}

function ReviewTimer({
	lastTimerMs,
	currentTimerMs,
	isSkipped,
	onSkip,
}: ReviewTimerProps) {
	const lastText =
		typeof lastTimerMs === "number" ? formatTimerMs(lastTimerMs) : "N/A";
	const thisText = formatTimerMs(currentTimerMs);
	const diffText =
		typeof lastTimerMs === "number"
			? formatTimerMs(currentTimerMs - lastTimerMs)
			: "N/A";

	return (
		<div className="review-timer">
			<span>Timer MS:</span>
			<span>last {lastText}</span>
			<span>this {thisText}</span>
			<span>diff {diffText}</span>
			<button
				type="button"
				className="review-timer-skip winter"
				onClick={onSkip}
				disabled={isSkipped}
			>
				{isSkipped ? "Skipped" : "Skip"}
			</button>
		</div>
	);
}

export default ReviewTimer;
