import "./css/App.css";
import { BrowserRouter, Route, Routes } from "react-router";
import Navigation from "./components/Navigation";
import CardForm from "./pages/CardForm";
import Direct from "./pages/Direct";
import Full from "./pages/Full";
import Groups from "./pages/Groups";
import Home from "./pages/Home";
import Inverse from "./pages/Inverse";
import List from "./pages/List";
import Sentence from "./pages/Sentence";
import SentenceForm from "./pages/SentenceForm";
import SentenceFull from "./pages/SentenceFull";
import SentenceInverse from "./pages/SentenceInverse";
import SentenceList from "./pages/SentenceList";

function App() {
	return (
		<BrowserRouter>
			<Navigation />
			<Routes>
				<Route path="/" element={<Direct />} />
				<Route path="/full" element={<Full />} />
				<Route path="/inverse" element={<Inverse />} />
				<Route path="/list" element={<List />} />
				<Route path="/cardForm" element={<CardForm />} />
				<Route path="/cardForm/:id" element={<CardForm />} />
				<Route path="/direct" element={<Groups />} />
				<Route path="/groups" element={<Home />} />
				<Route path="/sentence" element={<Sentence />} />
				<Route path="/sentenceFull" element={<SentenceFull />} />
				<Route path="/sentenceInverse" element={<SentenceInverse />} />
				<Route path="/sentenceForm" element={<SentenceForm />} />
				<Route path="/sentenceForm/:id" element={<SentenceForm />} />
				<Route path="/sentenceList" element={<SentenceList />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
