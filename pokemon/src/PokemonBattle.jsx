import React, { useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";
import { matchAPI, battleRoomAPI } from "./services/api";
import { sendBattleAction, onBattleAction, getSocket } from "./services/socket";
import FriendBattleRoom from "./components/FriendBattle/FriendBattleRoom";

// CSS styles embedded in the component
const styles = `
  .game-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Arial', sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    color: white;
  }

  .game-container h1 {
    text-align: center;
    font-size: 2.5em;
    margin-bottom: 20px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  }

  .back-button {
    background: linear-gradient(45deg, #6c757d, #495057);
    border: none;
    padding: 10px 20px;
    font-size: 1em;
    font-weight: bold;
    border-radius: 20px;
    color: white;
    cursor: pointer;
    margin-bottom: 20px;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .back-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  }

  .game-rules {
    background: rgba(255,255,255,0.1);
    border-radius: 15px;
    padding: 30px;
    margin: 20px auto;
    max-width: 600px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.2);
  }

  .game-rules h2 {
    margin-bottom: 15px;
    font-size: 1.5em;
  }

  .game-mode-buttons {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-top: 20px;
  }

  @media (max-width: 768px) {
    .game-mode-buttons {
      grid-template-columns: 1fr;
    }
  }

  .mode-button {
    background: rgba(255,255,255,0.1);
    border: 2px solid rgba(255,255,255,0.3);
    border-radius: 15px;
    padding: 30px 20px;
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 1.2em;
    font-weight: bold;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    backdrop-filter: blur(10px);
  }

  .mode-button:hover {
    background: rgba(255,255,255,0.2);
    border-color: rgba(255,255,255,0.5);
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.3);
  }

  .mode-button span {
    font-size: 0.9em;
    opacity: 0.8;
    font-weight: normal;
  }

  .selection-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(255,255,255,0.1);
    border-radius: 15px;
    padding: 20px;
    margin-bottom: 30px;
    backdrop-filter: blur(10px);
  }

  .selection-counter {
    font-size: 1.3em;
    font-weight: bold;
    color: #ffa500;
  }

  .pokemon-search {
    display: flex;
    align-items: center;
  }

  .pokemon-search input {
    background: rgba(255,255,255,0.9);
    border: none;
    border-radius: 25px;
    padding: 12px 20px;
    font-size: 1em;
    color: #333;
    width: 250px;
    outline: none;
  }

  .selected-team {
    background: rgba(255,255,255,0.1);
    border-radius: 15px;
    padding: 20px;
    margin-bottom: 30px;
    backdrop-filter: blur(10px);
  }

  .selected-team h3 {
    margin-bottom: 15px;
    text-align: center;
    color: #ffa500;
  }

  .selected-cards {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 10px;
    margin-bottom: 20px;
  }

  .start-battle-button {
    background: linear-gradient(45deg, #00c851, #28a745);
    border: none;
    padding: 15px 30px;
    font-size: 1.3em;
    font-weight: bold;
    border-radius: 25px;
    color: white;
    cursor: pointer;
    margin: 20px auto;
    display: block;
    transition: all 0.3s ease;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(0, 200, 81, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(0, 200, 81, 0); }
    100% { box-shadow: 0 0 0 0 rgba(0, 200, 81, 0); }
  }

  .start-battle-button:hover {
    transform: translateY(-2px);
    background: linear-gradient(45deg, #00a84f, #218838);
  }

  .pokemon-selection h3 {
    text-align: center;
    margin-bottom: 20px;
    font-size: 1.3em;
  }

  .selection-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 15px;
    max-height: 60vh;
    overflow-y: auto;
    padding: 10px;
    background: rgba(255,255,255,0.05);
    border-radius: 15px;
  }

  .selection-card {
    min-height: 200px;
    cursor: pointer;
  }

  .selection-card.selected {
    background: linear-gradient(45deg, #00c851, #28a745);
    color: white;
    border: 3px solid #ffa500;
  }

  .selection-card.disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .selection-card.disabled:hover {
    transform: none;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  }
  .game-rules ul {
    list-style: none;
    padding: 0;
  }

  .game-rules li {
    padding: 8px 0;
    font-size: 1.1em;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }

  .start-button {
    background: linear-gradient(45deg, #ff6b6b, #ffa500);
    border: none;
    padding: 15px 30px;
    font-size: 1.2em;
    font-weight: bold;
    border-radius: 25px;
    color: white;
    cursor: pointer;
    margin: 20px auto;
    display: block;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .start-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  }

  .score-board {
    display: flex;
    justify-content: space-around;
    background: rgba(255,255,255,0.1);
    border-radius: 15px;
    padding: 15px;
    margin-bottom: 20px;
    backdrop-filter: blur(10px);
  }

  .score, .round {
    font-size: 1.2em;
    font-weight: bold;
  }

  .battle-area {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 20px;
    margin: 30px 0;
    align-items: center;
  }

  .battle-side {
    text-align: center;
  }

  .battle-side h3 {
    margin-bottom: 15px;
    font-size: 1.3em;
  }

  .vs-section {
    text-align: center;
    padding: 20px;
  }

  .vs-section h2 {
    font-size: 2em;
    margin-bottom: 10px;
    color: #ffa500;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  }

  .battle-result {
    font-size: 1.5em;
    font-weight: bold;
    padding: 10px;
    border-radius: 10px;
    background: linear-gradient(45deg, #00c851, #28a745);
    animation: glow 1s infinite alternate;
  }

  @keyframes glow {
    from { box-shadow: 0 0 10px rgba(255,255,255,0.5); }
    to { box-shadow: 0 0 20px rgba(255,255,255,0.8); }
  }

  .pokemon-card {
    background: rgba(255,255,255,0.9);
    border-radius: 15px;
    padding: 15px;
    margin: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
    color: #333;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    min-height: 250px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
  }

  .pokemon-card:hover {
    transform: translateY(-5px) scale(1.05);
    box-shadow: 0 8px 25px rgba(0,0,0,0.3);
  }

  .pokemon-card.selected {
    background: linear-gradient(45deg, #ffd700, #ffed4a);
    transform: scale(1.1);
    box-shadow: 0 0 20px rgba(255,215,0,0.8);
  }

  .pokemon-card.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .pokemon-card.disabled:hover {
    transform: none;
  }

  .pokemon-image {
    width: 80px !important;
    height: 80px !important;
    object-fit: contain !important;
    display: block !important;
    border: none !important;
    background: transparent !important;
  }

  .pokemon-name {
    font-size: 1.1em;
    font-weight: bold;
    margin-bottom: 5px;
    text-transform: capitalize;
    text-align: center;
  }

  .pokemon-types {
    font-size: 0.9em;
    color: #666;
    text-transform: capitalize;
    margin-bottom: 5px;
  }

  .attack-stat {
    font-size: 1em;
    font-weight: bold;
    color: #e74c3c;
    background: rgba(231,76,60,0.1);
    padding: 5px 10px;
    border-radius: 5px;
  }

  .player-cards {
    margin: 30px 0;
  }

  .player-cards h3 {
    text-align: center;
    margin-bottom: 20px;
    font-size: 1.3em;
  }

  .cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
    max-width: 900px;
    margin: 0 auto;
  }

  .battle-history {
    background: rgba(255,255,255,0.1);
    border-radius: 15px;
    padding: 20px;
    margin-top: 30px;
    backdrop-filter: blur(10px);
  }

  .battle-history h3 {
    margin-bottom: 15px;
    text-align: center;
  }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .history-item {
    display: grid;
    grid-template-columns: 1fr auto 1fr auto;
    gap: 10px;
    align-items: center;
    background: rgba(255,255,255,0.1);
    padding: 10px;
    border-radius: 8px;
    font-size: 0.9em;
  }

  .history-item .result {
    font-weight: bold;
    padding: 5px 10px;
    border-radius: 5px;
    text-align: center;
  }

  .final-score {
    text-align: center;
    background: rgba(255,255,255,0.1);
    border-radius: 15px;
    padding: 30px;
    margin: 20px auto;
    max-width: 400px;
    backdrop-filter: blur(10px);
  }

  .final-score h2 {
    margin-bottom: 15px;
    font-size: 1.5em;
  }

  .final-score p {
    font-size: 1.2em;
    margin: 10px 0;
  }

  .final-score h3 {
    margin-top: 20px;
    font-size: 1.8em;
    color: #ffa500;
  }

  @media (max-width: 768px) {
    .battle-area {
      grid-template-columns: 1fr;
      gap: 15px;
    }
    
    .cards-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .pokemon-card {
      min-height: 200px;
    }
    
    .history-item {
      grid-template-columns: 1fr;
      text-align: center;
    }
  }
`;

// Add styles to document
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

const PokemonBattleGame = ({ onBackToBrowse }) => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [allPokemon, setAllPokemon] = useState([]);
  const [playerCards, setPlayerCards] = useState([]);
  const [botCards, setBotCards] = useState([]);
  const [playerCurrentCard, setPlayerCurrentCard] = useState(null);
  const [botCurrentCard, setBotCurrentCard] = useState(null);
  const [gameState, setGameState] = useState("loading"); // loading, setup, selection, battle, gameOver
  const [battleResult, setBattleResult] = useState("");
  const [playerScore, setPlayerScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [battleHistory, setBattleHistory] = useState([]);
  const [selectedPokemon, setSelectedPokemon] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentMatchId, setCurrentMatchId] = useState(null);
  const [friendBattleRoomId, setFriendBattleRoomId] = useState(null);
  const [showFriendBattle, setShowFriendBattle] = useState(false);
  const [opponentTeam, setOpponentTeam] = useState([]);
  const [opponentCurrentCard, setOpponentCurrentCard] = useState(null);
  const [myTeamSubmitted, setMyTeamSubmitted] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [isFriendBattle, setIsFriendBattle] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [opponentHasSelected, setOpponentHasSelected] = useState(false);
  const [opponentUserInfo, setOpponentUserInfo] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [errorStatus, setErrorStatus] = useState("");

  const API = "https://pokeapi.co/api/v2/pokemon?limit=151";

  const fetchPokemon = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();

      const detailedPokemon = data.results.map(async (currPokemon) => {
        const res = await fetch(currPokemon.url);
        const data = await res.json();
        return data;
      });
      const detailedResponse = await Promise.all(detailedPokemon);
      setAllPokemon(detailedResponse);
      setLoading(false);
      setGameState("setup");
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPokemon();
  }, []);

  // Set up socket listeners for friend battles
  useEffect(() => {
    if (!isFriendBattle || !friendBattleRoomId) return;

    const socket = getSocket();
    if (!socket) return;

    const handleBattleAction = ({ action, data }) => {
      if (action === 'round-result') {
        // Handle round result from opponent if needed
      }
    };

    const handleTeamsReady = () => {
      setOpponentReady(true);
      checkOpponentTeam();
    };

    const handleOpponentSelected = () => {
      setOpponentHasSelected(true);
    };

    const handleRoundRevealed = ({ selections, round }) => {
      const opponentId = Object.keys(selections).find(id => id !== user.id);
      const opponentCard = selections[opponentId];
      const myCard = selections[user.id];
      
      setOpponentCurrentCard(opponentCard);
      setOpponentHasSelected(false);
      
      // The battle function will update scores and history
      setTimeout(() => {
        battle(myCard, opponentCard);
      }, 800);
    };

    const handleGameOverTriggered = ({ finalRound }) => {
      // Logic for game over already handled in battle() for state, 
      // but we use this to ensure final sync if needed
      setGameState("gameOver");
    };

    const handleMatchInitialized = ({ matchId }) => {
      setCurrentMatchId(matchId);
    };

    onBattleAction(handleBattleAction);
    socket.on('teams-ready', handleTeamsReady);
    socket.on('opponent-selected', handleOpponentSelected);
    socket.on('round-revealed', handleRoundRevealed);
    socket.on('game-over-triggered', handleGameOverTriggered);
    socket.on('match-initialized', handleMatchInitialized);

    return () => {
      if (socket) {
        socket.off('battle-action', handleBattleAction);
        socket.off('teams-ready', handleTeamsReady);
        socket.off('opponent-selected', handleOpponentSelected);
        socket.off('round-revealed', handleRoundRevealed);
        socket.off('game-over-triggered', handleGameOverTriggered);
        socket.off('match-initialized', handleMatchInitialized);
      }
    };
  }, [isFriendBattle, friendBattleRoomId, user?.id]);

  const getRandomPokemon = (excludeIds = []) => {
    const availablePokemon = allPokemon.filter(
      (p) => !excludeIds.includes(p.id)
    );
    return availablePokemon[
      Math.floor(Math.random() * availablePokemon.length)
    ];
  };

  const startPokemonSelection = () => {
    setSelectedPokemon([]);
    setSearch("");
    setErrorStatus("");
    setGameState("selection");
  };

  const togglePokemonSelection = (pokemon) => {
    if (selectedPokemon.find((p) => p.id === pokemon.id)) {
      // Remove if already selected
      setSelectedPokemon(selectedPokemon.filter((p) => p.id !== pokemon.id));
    } else if (selectedPokemon.length < 6) {
      // Add if less than 6 selected
      setSelectedPokemon([...selectedPokemon, pokemon]);
    }
  };

  const startBattleWithSelectedPokemon = async () => {
    if (selectedPokemon.length !== 6) return;

    // For friend battles, submit team and wait for opponent
    if (isFriendBattle && friendBattleRoomId) {
      setIsSubmitting(true);
      setErrorStatus("");
      try {
        const response = await battleRoomAPI.submitTeam(friendBattleRoomId, selectedPokemon);
        if (response.success) {
          setPlayerCards(selectedPokemon);
          setMyTeamSubmitted(true);
          setOpponentReady(response.bothTeamsReady);
          
          if (response.bothTeamsReady) {
            setTimeout(() => {
              checkOpponentTeam();
            }, 1000);
          }
        } else {
          setErrorStatus(response.message || "Failed to submit team");
        }
      } catch (error) {
        console.error('Failed to submit team:', error);
        setErrorStatus("Error: " + (error.message || "Connection failed"));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Regular bot/custom battle
    const usedIds = selectedPokemon.map((p) => p.id);
    const botTeam = [];

    // Select 6 random Pokemon for bot (excluding player's selections)
    for (let i = 0; i < 6; i++) {
      const pokemon = getRandomPokemon(usedIds);
      botTeam.push(pokemon);
      usedIds.push(pokemon.id);
    }

    setPlayerCards(selectedPokemon);
    setBotCards(botTeam);
    setPlayerScore(0);
    setBotScore(0);
    setBattleHistory([]);
    setGameState("battle");
    setPlayerCurrentCard(null);
    setBotCurrentCard(null);
    setBattleResult("");

    // Create match in backend if authenticated
    if (isAuthenticated && user) {
      try {
        const response = await matchAPI.createMatch({
          matchType: "custom",
          pokemonTeam: selectedPokemon,
          roomId: friendBattleRoomId
        });
        if (response.match) {
          setCurrentMatchId(response.match._id);
        }
      } catch (error) {
        console.error('Failed to create match:', error);
      }
    }
  };

  const checkOpponentTeam = async () => {
    try {
      const response = await battleRoomAPI.getOpponentTeam(friendBattleRoomId);
      if (response.success && response.opponentTeam) {
        setOpponentTeam(response.opponentTeam);
        setOpponentUserInfo(response.opponent);
        setBotCards(response.opponentTeam); 
        
        // Reset battle state for the new match
        setGameState("battle");
        setPlayerScore(0);
        setBotScore(0);
        setBattleHistory([]);
        setPlayerCurrentCard(null);
        setOpponentCurrentCard(null);
        setBattleResult("");
        
        // Only one player (the room creator) creates the match in the DB to avoid duplicates
        // We'll fetch room info to check who created it
        const roomResp = await battleRoomAPI.getRoom(friendBattleRoomId);
        const amICreator = roomResp.success && roomResp.room.createdBy === user.id;
        setIsCreator(amICreator);
        
        if (amICreator && isAuthenticated) {
          try {
            if (matchResponse.match) {
              setCurrentMatchId(matchResponse.match._id);
              // Broadcast the match ID to the other player so they can update the same record
              sendBattleAction(friendBattleRoomId, 'match-init', { matchId: matchResponse.match._id });
            }
          } catch (error) {
            console.error('Failed to create match:', error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to get opponent team:', error);
    }
  };
  const startNewGame = async () => {
    // Reset all match states
    setPlayerScore(0);
    setBotScore(0);
    setBattleHistory([]);
    setPlayerCurrentCard(null);
    setBotCurrentCard(null);
    setOpponentCurrentCard(null);
    setBattleResult("");
    setSelectedPokemon([]);
    setMyTeamSubmitted(false);
    setOpponentReady(false);
    setOpponentHasSelected(false);
    setIsFriendBattle(false);
    setFriendBattleRoomId(null);

    const usedIds = [];
    const playerTeam = [];
    const botTeam = [];

    // Select 6 random Pokemon for player
    for (let i = 0; i < 6; i++) {
      const pokemon = getRandomPokemon(usedIds);
      playerTeam.push(pokemon);
      usedIds.push(pokemon.id);
    }

    // Select 6 random Pokemon for bot
    for (let i = 0; i < 6; i++) {
      const pokemon = getRandomPokemon(usedIds);
      botTeam.push(pokemon);
      usedIds.push(pokemon.id);
    }

    setPlayerCards(playerTeam);
    setBotCards(botTeam);
    setGameState("battle");

    // Create match in backend if authenticated
    if (isAuthenticated && user) {
      try {
        const response = await matchAPI.createMatch({
          matchType: "vs-bot",
          pokemonTeam: playerTeam
        });
        if (response.match) {
          setCurrentMatchId(response.match._id);
        }
      } catch (error) {
        console.error('Failed to create match:', error);
      }
    }
  };

  const resetToSetup = () => {
    setGameState("setup");
    setPlayerScore(0);
    setBotScore(0);
    setBattleHistory([]);
    setPlayerCurrentCard(null);
    setBotCurrentCard(null);
    setOpponentCurrentCard(null);
    setBattleResult("");
    setSelectedPokemon([]);
    setMyTeamSubmitted(false);
    setOpponentReady(false);
    setOpponentHasSelected(false);
    setCurrentMatchId(null);
    setIsFriendBattle(false);
    setFriendBattleRoomId(null);
  };

  const selectPlayerCard = (card) => {
    if (playerCurrentCard) return;

    setPlayerCurrentCard(card);

    // For friend battles, send selection to server and wait for reveal
    if (isFriendBattle && friendBattleRoomId) {
      sendBattleAction(friendBattleRoomId, 'card-selected', { 
        pokemon: card,
        userId: user.id
      });
      return;
    }

    // Bot automatically selects a random card
    const availableBotCards = botCards.filter(
      (card) => !battleHistory.some((battle) => battle.botCard.id === card.id)
    );
    const selectedBotCard =
      availableBotCards[Math.floor(Math.random() * availableBotCards.length)];
    setBotCurrentCard(selectedBotCard);

    // Battle after a short delay
    setTimeout(() => {
      battle(card, selectedBotCard);
    }, 1000);
  };

  // Functional battle update to avoid closure traps
  const battle = (playerCard, opponentCard) => {
    const playerAttack = playerCard.stats[1].base_stat; // Attack stat
    const opponentAttack = opponentCard.stats[1].base_stat;

    let roundResultText = "";
    let roundWinner = "draw";

    if (playerAttack > opponentAttack) {
      roundResultText = isFriendBattle ? "You Win!" : "Player Wins!";
      roundWinner = "player1";
    } else if (opponentAttack > playerAttack) {
      roundResultText = isFriendBattle ? "Opponent Wins!" : "Bot Wins!";
      roundWinner = "player2";
    } else {
      roundResultText = "Draw!";
      roundWinner = "draw";
    }

    setBattleResult(roundResultText);
    
    // Update scores
    if (roundWinner === "player1") setPlayerScore(prev => prev + 1);
    else if (roundWinner === "player2") setBotScore(prev => prev + 1);

    setBattleHistory(prev => {
      const battleRecord = {
        playerCard,
        botCard: opponentCard,
        playerAttack,
        botAttack: opponentAttack,
        result: roundResultText,
        roundNumber: prev.length + 1,
        winner: roundWinner
      };
      
      const newHistory = [...prev, battleRecord];
      
      // Auto-reset cards for next round if not game over
      if (newHistory.length < 6) {
        setTimeout(() => {
          setPlayerCurrentCard(null);
          if (isFriendBattle) setOpponentCurrentCard(null);
          else setBotCurrentCard(null);
          setBattleResult("");
        }, 3000);
      }

      // Send result to opponent
      if (isFriendBattle && friendBattleRoomId) {
        sendBattleAction(friendBattleRoomId, 'round-result', {
          round: battleRecord.roundNumber,
          result: battleRecord
        });
      }

      return newHistory;
    });
  };

  // Separate effect for GameOver to ensure we have final scores and history
  useEffect(() => {
    if (battleHistory.length === 6 && gameState === "battle") {
      setTimeout(() => {
        completeMatch(playerScore, botScore, battleHistory);
        setGameState("gameOver");
      }, 2000);
    }
  }, [battleHistory.length, gameState]);


  const completeMatch = async (finalPlayerScore, finalBotScore, history = battleHistory) => {
    if (!isAuthenticated || !user) {
      console.warn("User not authenticated, skipping match save.");
      return;
    }

    try {
      // In friend battles, only the creator saves the match result to avoid duplicates and conflicts
      if (isFriendBattle && !isCreator) {
        console.log("Not the creator, skipping save, but refreshing stats...");
        setTimeout(() => refreshUser && refreshUser(), 3000);
        return;
      }

      // Calculate final scores from history just to be 100% sure we have final values
      const pScore = history.filter(h => h.winner === 'player1').length;
      const bScore = history.filter(h => h.winner === 'player2').length;
      
      const winner = pScore > bScore ? "player1" : 
                     bScore > pScore ? "player2" : "draw";
      
      console.log(`Completing match ${currentMatchId || 'New'} with score ${pScore}-${bScore}, winner: ${winner}`);

      const matchData = {
        matchType: isFriendBattle ? "vs-friend" : "vs-bot",
        pokemonTeam: playerCards,
        rounds: history.map((battle, index) => ({
          roundNumber: index + 1,
          player1Pokemon: {
            pokemonId: battle.playerCard.id,
            pokemonName: battle.playerCard.name,
            attack: battle.playerAttack
          },
          player2Pokemon: {
            pokemonId: battle.botCard.id,
            pokemonName: battle.botCard.name,
            attack: battle.botAttack
          },
          winner: battle.winner
        })),
        finalScore: {
          player1: pScore,
          player2: bScore
        },
        winner: winner,
        player2Team: botCards || []
      };

      let completedMatchId = currentMatchId;

      if (completedMatchId) {
        await matchAPI.completeMatch(completedMatchId, matchData);
      } else {
        const response = await matchAPI.createMatch(matchData);
        if (response.match) {
          completedMatchId = response.match._id;
          await matchAPI.completeMatch(completedMatchId, matchData);
        }
      }
      
      console.log("Match saved successfully. Refreshing user stats...");
      
      // Refresh user stats/points from server
      if (refreshUser) {
        await refreshUser();
      }
    } catch (error) {
      console.error('Failed to save match:', error);
    }
  };

  const getAvailablePlayerCards = () => {
    return playerCards.filter(
      (card) =>
        !battleHistory.some((battle) => battle.playerCard.id === card.id) &&
        card.id !== playerCurrentCard?.id
    );
  };

  // Poll for opponent team readiness in friend battles
  useEffect(() => {
    if (!isFriendBattle || !friendBattleRoomId || !myTeamSubmitted || opponentReady) return;

    const interval = setInterval(async () => {
      try {
        const response = await battleRoomAPI.getRoom(friendBattleRoomId);
        if (response.success && response.room.player1Ready && response.room.player2Ready) {
          setOpponentReady(true);
          checkOpponentTeam();
        }
      } catch (error) {
        console.error('Failed to check room status:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isFriendBattle, friendBattleRoomId, myTeamSubmitted, opponentReady]);

  const searchData = allPokemon.filter((currPokemon) =>
    currPokemon.name.toLowerCase().includes(search.toLowerCase())
  );

  const PokemonCard = ({
    pokemon,
    isSelected,
    onClick,
    disabled,
    showAttack = false,
    isInSelection = false,
  }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    // Get the best available image
    const getImageUrl = (pokemon) => {
      if (pokemon.sprites.other?.dream_world?.front_default) {
        return pokemon.sprites.other.dream_world.front_default;
      }
      if (pokemon.sprites.other?.["official-artwork"]?.front_default) {
        return pokemon.sprites.other["official-artwork"].front_default;
      }
      if (pokemon.sprites.front_default) {
        return pokemon.sprites.front_default;
      }
      return null;
    };

    const imageUrl = getImageUrl(pokemon);
    return (
      <div
        className={`pokemon-card ${isSelected ? "selected" : ""} ${
          disabled ? "disabled" : ""
        } ${isInSelection ? "selection-card" : ""}`}
        onClick={!disabled ? onClick : undefined}
      >
        <div className="pokemon-image-container">
          {!imageLoaded && !imageError && (
            <div className="pokemon-image-loading"></div>
          )}
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={pokemon.name}
              className="pokemon-image"
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(true);
              }}
              style={{
                opacity: imageLoaded ? 1 : 0,
                transition: "opacity 0.3s ease",
              }}
            />
          ) : (
            <div
              style={{
                width: "80px",
                height: "80px",
                background: "#f0f0f0",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2rem",
              }}
            >
              🎮
            </div>
          )}
        </div>
        <h3 className="pokemon-name">{pokemon.name}</h3>
        <div className="pokemon-types">
          {pokemon.types.map((type) => type.type.name).join(", ")}
        </div>
        {showAttack && (
          <div className="attack-stat">
            Attack: {pokemon.stats[1].base_stat}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="game-container">
        <button className="back-button" onClick={onBackToBrowse}>
          ← Back to Pokemon Gallery
        </button>
        <h1>Loading Pokemon...</h1>
      </div>
    );
  }

  const handleStartFriendBattle = (roomId) => {
    setFriendBattleRoomId(roomId);
    setIsFriendBattle(true);
    setShowFriendBattle(false);
    startPokemonSelection(); // Start team selection for friend battle
  };

  if (showFriendBattle) {
    return (
      <FriendBattleRoom
        onBack={() => setShowFriendBattle(false)}
        onStartBattle={handleStartFriendBattle}
      />
    );
  }

  if (gameState === "setup") {
    return (
      <div className="game-container">
        <button className="back-button" onClick={onBackToBrowse}>
          ← Back to Pokemon Gallery
        </button>
        <h1>Pokemon Battle Arena</h1>
        <div className="game-rules">
          <h2>Choose Your Battle Mode:</h2>
          <div className="game-mode-buttons">
            <button className="mode-button" onClick={() => setShowFriendBattle(true)}>
              👥 Friend Battle
              <span>Battle with a friend in real-time</span>
            </button>
            <button className="mode-button" onClick={startPokemonSelection}>
              🎯 Choose My Team
              <span>Select your own 6 Pokemon</span>
            </button>
            <button className="mode-button" onClick={startNewGame}>
              🎲 Random Battle
              <span>Get 6 random Pokemon</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "selection") {
    return (
      <div className="game-container">
        <button className="back-button" onClick={() => setGameState("setup")}>
          ← Back to Game Setup
        </button>
        <h1>Choose Your Pokemon Team</h1>

        <div className="selection-header">
          <div className="selection-counter">
            Selected: {selectedPokemon.length}/6 Pokemon
          </div>
          <div className="pokemon-search">
            <input
              type="text"
              placeholder="Search Pokemon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Selected Pokemon Display */}
        {selectedPokemon.length > 0 && (
          <div className="selected-team">
            <h3>Your Team:</h3>
            <div className="selected-cards">
              {selectedPokemon.map((pokemon) => (
                <PokemonCard
                  key={pokemon.id}
                  pokemon={pokemon}
                  isSelected={true}
                  onClick={() => togglePokemonSelection(pokemon)}
                  isInSelection={true}
                  showAttack={true}
                />
              ))}
            </div>
            {selectedPokemon.length === 6 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button
                    className="start-battle-button"
                    onClick={startBattleWithSelectedPokemon}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : (isFriendBattle ? 'Submit Team & Wait' : 'Start Battle!')} ⚔️
                  </button>
                  {isFriendBattle && !isSubmitting && (
                    <button
                      className="start-battle-button"
                      onClick={() => {
                        const usedIds = [];
                        const randomTeam = [];
                        for (let i = 0; i < 6; i++) {
                          const pokemon = getRandomPokemon(usedIds);
                          randomTeam.push(pokemon);
                          usedIds.push(pokemon.id);
                        }
                        setSelectedPokemon(randomTeam);
                      }}
                      style={{ background: 'linear-gradient(45deg, #2196F3, #21CBF3)' }}
                    >
                      🎲 Random Team
                    </button>
                  )}
                </div>
                {errorStatus && (
                  <div style={{ color: '#ff4d4d', background: 'rgba(0,0,0,0.5)', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold' }}>
                    ❌ {errorStatus}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Waiting for opponent in friend battle */}
        {isFriendBattle && myTeamSubmitted && !opponentReady && (
          <div className="friend-battle-card" style={{ marginBottom: '20px', textAlign: 'center', padding: '30px' }}>
            <div className="loading-spinner"></div>
            <h3>Waiting for opponent to select their team...</h3>
            <p>Your team is ready! Waiting for your friend to finish selecting.</p>
          </div>
        )}

        {/* Available Pokemon Grid */}
        {(!isFriendBattle || !myTeamSubmitted) && (
          <div className="pokemon-selection">
            <h3>Available Pokemon ({searchData.length}):</h3>
            {isFriendBattle && (
              <p style={{ textAlign: 'center', marginBottom: '15px', color: '#ffa500' }}>
                Select your 6 Pokemon team for the battle
              </p>
            )}
            <div className="selection-grid">
              {searchData.map((pokemon) => {
                const isSelected = selectedPokemon.find(
                  (p) => p.id === pokemon.id
                );
                const isDisabled = !isSelected && selectedPokemon.length >= 6;

                return (
                  <PokemonCard
                    key={pokemon.id}
                    pokemon={pokemon}
                    isSelected={!!isSelected}
                    disabled={isDisabled}
                    onClick={() => togglePokemonSelection(pokemon)}
                    isInSelection={true}
                    showAttack={true}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (gameState === "gameOver") {
    const finalWinner =
      playerScore > botScore
        ? "Player"
        : botScore > playerScore
        ? "Bot"
        : "Draw";

    return (
      <div className="game-container">
        <button className="back-button" onClick={onBackToBrowse}>
          ← Back to Pokemon Gallery
        </button>
        <h1>Game Over!</h1>
        <div className="final-score">
          <h2>Final Score</h2>
          <p>{isFriendBattle ? (user?.username || "You") : "Player"}: {playerScore}</p>
          <p>{isFriendBattle ? (opponentUserInfo?.username || "Opponent") : "Bot"}: {botScore}</p>
          <h3>
            {finalWinner === "Draw" 
              ? "It's a Draw!" 
              : finalWinner === "Player" 
                ? (isFriendBattle ? "You Win! 🎉" : "Player Wins!")
                : (isFriendBattle ? "Opponent Wins!" : "Bot Wins!")}
          </h3>
        </div>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <button className="start-button" onClick={startNewGame}>
            Play Again
          </button>
          <button className="start-button" style={{ background: 'linear-gradient(45deg, #6c757d, #495057)' }} onClick={resetToSetup}>
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <button className="back-button" onClick={onBackToBrowse}>
        ← Back to Pokemon Gallery
      </button>
      <h1>Pokemon Battle Arena</h1>

      <div className="score-board">
        <div className="score">{isFriendBattle ? user?.username : "Player"}: {playerScore}</div>
        <div className="score">{isFriendBattle ? (opponentUserInfo?.username || "Opponent") : "Bot"}: {botScore}</div>
        <div className="round">Round: {Math.min(battleHistory.length + 1, 6)}/6</div>
      </div>

      {/* Battle Area */}
      <div className="battle-area">
        <div className="battle-side">
          <h3>{isFriendBattle ? user?.username : "Your Pokemon"}</h3>
          {playerCurrentCard && (
            <PokemonCard
              pokemon={playerCurrentCard}
              isSelected={true}
              showAttack={true}
              disabled={true}
            />
          )}
        </div>

        <div className="vs-section">
          <h2>VS</h2>
          {battleResult && <div className="battle-result">{battleResult}</div>}
        </div>

        <div className="battle-side">
          <h3>{isFriendBattle ? (opponentUserInfo?.username || "Opponent") : "Bot's Pokemon"}</h3>
          {(isFriendBattle ? opponentCurrentCard : botCurrentCard) && (
            <PokemonCard
              pokemon={isFriendBattle ? opponentCurrentCard : botCurrentCard}
              isSelected={true}
              showAttack={true}
              disabled={true}
            />
          )}
        </div>
      </div>

      {/* Player's Available Cards */}
      <div className="player-cards">
        <h3>Select Your Pokemon:</h3>
        {isFriendBattle && playerCurrentCard && !opponentCurrentCard && (
          <p style={{ textAlign: 'center', color: '#ffa500', marginBottom: '15px', fontWeight: 'bold', animation: 'pulse 1.5s infinite' }}>
            {opponentHasSelected ? "Opponent has selected! Revealing soon..." : "Waiting for opponent's move..."}
          </p>
        )}
        {isFriendBattle && !playerCurrentCard && opponentHasSelected && (
          <p style={{ textAlign: 'center', color: '#00c851', marginBottom: '15px', fontWeight: 'bold' }}>
            Opponent is ready! Choose your Pokemon! ⚡
          </p>
        )}
        <div className="cards-grid">
          {getAvailablePlayerCards().map((pokemon) => (
            <PokemonCard
              key={pokemon.id}
              pokemon={pokemon}
              onClick={() => selectPlayerCard(pokemon)}
              disabled={!!playerCurrentCard || (isFriendBattle && !!opponentCurrentCard)}
            />
          ))}
        </div>
      </div>

      {/* Battle History */}
      {battleHistory.length > 0 && (
        <div className="battle-history">
          <h3>Battle History:</h3>
          <div className="history-list">
            {battleHistory.map((battle, index) => (
              <div key={index} className="history-item">
                <span>
                  {battle.playerCard?.name} ({battle.playerAttack})
                </span>
                <span>vs</span>
                <span>
                  {battle.botCard?.name} ({battle.botAttack})
                </span>
                <span className="result">{battle.result}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PokemonBattleGame;
