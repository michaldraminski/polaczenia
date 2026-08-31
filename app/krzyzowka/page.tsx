import { CrosswordBoard } from "../../components/CrosswordBoard";
import { testPuzzle } from "../../lib/crossword/testPuzzle";

export default function CrosswordPage() {
    return (
        <main className="min-h-screen flex flex-col items-center p-6 gap-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold">
                    {testPuzzle.title}
                </h1>

                <p className="text-sm text-gray-500 mt-1">
                    Autor: {testPuzzle.author}
                </p>
            </div>

            <CrosswordBoard 
                grid={testPuzzle.grid}
                entries={testPuzzle.entries}
            />
        </main>
    );
}
