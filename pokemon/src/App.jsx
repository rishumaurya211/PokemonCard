import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { Pokemon } from "./Pokemon";
import PokemonBattleGame from "./PokemonBattle";

function App() {
  const [currentView, setCurrentView] = useState("browse"); // 'browse' or 'battle'

  return (
    <>
      {currentView === "browse" ? (
        <Pokemon onPlayGame={() => setCurrentView("battle")} />
      ) : (
        <PokemonBattleGame onBackToBrowse={() => setCurrentView("browse")} />
      )}
    </>
  );
}

export default App;
