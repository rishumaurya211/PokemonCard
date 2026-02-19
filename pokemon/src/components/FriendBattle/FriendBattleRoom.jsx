import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { joinBattleRoom, onRoomUpdate, onBattleReady, onPlayerLeft, leaveBattleRoom, getSocket } from '../../services/socket';
import { battleRoomAPI } from '../../services/api';
import './FriendBattle.css';

const FriendBattleRoom = ({ onBack, onStartBattle }) => {
  const { user } = useAuth();
  const [mode, setMode] = useState('select'); // 'select', 'create', 'join', 'waiting', 'joined'
  const [roomId, setRoomId] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState(0);
  const [playerList, setPlayerList] = useState([]);
  const [gameState, setGameState] = useState('waiting'); // 'waiting', 'ready'
  const [error, setError] = useState('');
  const [inputRoomCode, setInputRoomCode] = useState('');

  useEffect(() => {
    // Create room when in create mode and roomId is not set
    if (mode === 'create' && !roomId && user) {
      createRoom();
    }
  }, [mode]);

  const createRoom = async () => {
    try {
      const response = await battleRoomAPI.createRoom();
      if (response.success) {
        setRoomId(response.room.roomId);
        setRoomCode(response.room.roomCode);
      }
    } catch (error) {
      setError('Failed to create room: ' + error.message);
    }
  };

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleRoomUpdate = (data) => {
      setPlayers(data.players);
      if (data.playerList) {
        setPlayerList(data.playerList);
      }
      setGameState(data.gameState);
      if (data.gameState === 'ready') {
        setGameState('ready');
      }
    };

    const handleBattleReady = () => {
      setGameState('ready');
    };

    const handlePlayerLeft = () => {
      setPlayers(prev => Math.max(0, prev - 1));
      setGameState('waiting');
    };

    onRoomUpdate(handleRoomUpdate);
    onBattleReady(handleBattleReady);
    onPlayerLeft(handlePlayerLeft);

    return () => {
      if (socket) {
        socket.off('room-update', handleRoomUpdate);
        socket.off('battle-ready', handleBattleReady);
        socket.off('player-left', handlePlayerLeft);
      }
    };
  }, []);

  const handleCreateRoom = async () => {
    if (!user) {
      setError('Please login to create a battle room');
      return;
    }

    if (!roomId) {
      await createRoom();
      return;
    }

    const socket = getSocket();
    if (!socket || !socket.connected) {
      setError('Socket not connected. Please refresh the page.');
      return;
    }

    joinBattleRoom(roomId, user.id, user.username);
    setMode('waiting');
  };

  const handleJoinRoom = async () => {
    if (!roomCode && !inputRoomCode) {
      setError('Please enter a room code');
      return;
    }

    const codeToUse = roomCode || inputRoomCode;

    if (!user) {
      setError('Please login to join a battle room');
      return;
    }

    try {
      const response = await battleRoomAPI.joinRoom(codeToUse);
      if (response.success) {
        setRoomId(response.room.roomId);
        setRoomCode(response.room.roomCode);
        setPlayers(response.room.players);
        setGameState(response.room.gameState);
        
        const socket = getSocket();
        if (socket && socket.connected) {
          joinBattleRoom(response.room.roomId, user.id, user.username);
        }
        
        setMode('joined');
      }
    } catch (error) {
      setError(error.message || 'Failed to join room');
    }
  };

  const handleStartBattle = () => {
    if (gameState === 'ready' && players === 2) {
      onStartBattle(roomId);
    }
  };

  const copyRoomCode = () => {
    if (roomCode) {
      const shareLink = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
      navigator.clipboard.writeText(shareLink);
      alert(`Battle link copied! Share this with your friend:\n${shareLink}\n\nOr just share the code: ${roomCode}`);
    }
  };

      return (
    <div className="friend-battle-container">
      <button className="back-button" onClick={onBack}>
        ← Back
      </button>

      <h1>Friend Battle 👥</h1>
      <p className="subtitle">Play 1v1 battles with your friends!</p>

      {mode === 'select' && (
        <div className="friend-battle-card">
          <h2>Choose an Option</h2>
          <div className="mode-selection">
            <button 
              className="mode-option create-option"
              onClick={() => {
                setMode('create');
                setError('');
              }}
            >
              <div className="option-icon">🏠</div>
              <div className="option-title">Create Room</div>
              <div className="option-description">
                Create a battle room and invite your friend with a code
              </div>
            </button>
            <button 
              className="mode-option join-option"
              onClick={() => {
                setMode('join');
                setError('');
              }}
            >
              <div className="option-icon">🔑</div>
              <div className="option-title">Join Room</div>
              <div className="option-description">
                Enter a room code to join your friend's battle
              </div>
            </button>
          </div>
        </div>
      )}

      {mode === 'create' && !roomId && (
        <div className="friend-battle-card">
          <h2>Creating Room...</h2>
          <div className="loading-message">
            <div className="loading-spinner"></div>
            <p>Generating your battle room code...</p>
          </div>
        </div>
      )}

      {mode === 'create' && roomId && (
        <div className="friend-battle-card">
          <h2>Create Battle Room</h2>
          <div className="room-info">
            <div className="room-code-display">
              <label>Room Code:</label>
              <div className="code-box">
                <span className="code-text">{roomCode}</span>
                <button className="copy-btn" onClick={copyRoomCode}>
                  📋 Copy Link
                </button>
              </div>
            </div>
            <p className="room-instructions">
              Share this code with your friend to invite them to battle!
            </p>
            <button className="create-room-btn" onClick={handleCreateRoom}>
              Create Room
            </button>
          </div>
        </div>
      )}

      {mode === 'join' && (
        <div className="friend-battle-card">
          <h2>Join Battle Room</h2>
          <div className="join-room-form">
            <label>Enter Room Code:</label>
            <p className="code-hint">Ask your friend for their 6-digit room code</p>
            <input
              type="text"
              value={inputRoomCode}
              onChange={(e) => {
                const code = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                setInputRoomCode(code);
                setError('');
              }}
              placeholder="ABC123"
              maxLength={6}
              className="room-code-input"
            />
            <button className="join-room-btn" onClick={() => {
              if (inputRoomCode.length === 6) {
                setRoomCode(inputRoomCode);
                handleJoinRoom();
              } else {
                setError('Please enter a valid 6-digit room code');
              }
            }}>
              Join Room
            </button>
            <button 
              className="back-option-btn" 
              onClick={() => {
                setMode('select');
                setInputRoomCode('');
                setError('');
              }}
            >
              ← Back to Options
            </button>
          </div>
        </div>
      )}

      {(mode === 'waiting' || mode === 'joined') && (
        <div className="friend-battle-card">
          <h2>Waiting Room</h2>
          <div className="room-status">
            <div className="players-indicator">
              <span>Players: {players}/2</span>
              {playerList.length > 0 && (
                <div className="player-names">
                  ({playerList.map(p => p.username).join(', ')})
                </div>
              )}
            </div>
            <div className="room-code-info">
              <p>Room Code: <strong className="code-display">{roomCode}</strong></p>
              {mode === 'waiting' && (
                <button className="copy-code-btn" onClick={copyRoomCode}>
                  📋 Copy Link
                </button>
              )}
            </div>
            {players < 2 && (
              <div className="waiting-message">
                <div className="loading-spinner"></div>
                <p>Waiting for opponent to join...</p>
                <p className="share-code">Share this code with your friend: <strong>{roomCode}</strong></p>
              </div>
            )}
            {players === 2 && gameState === 'ready' && (
              <div className="ready-message">
                <p>✅ Both players ready!</p>
                <button className="start-battle-btn" onClick={handleStartBattle}>
                  Start Battle ⚔️
                </button>
              </div>
            )}
          </div>
          {mode === 'waiting' && (
            <button 
              className="back-option-btn" 
              onClick={() => {
                leaveBattleRoom(roomId);
                setMode('select');
                setRoomId('');
                setRoomCode('');
                setPlayers(0);
              }}
            >
              ← Cancel & Go Back
            </button>
          )}
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default FriendBattleRoom;
