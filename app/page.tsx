import Game from "../components/Game";
import { examplePuzzle } from "../data/examplePuzzle";

export default function Home() {
    return <Game puzzle={examplePuzzle} />;
}