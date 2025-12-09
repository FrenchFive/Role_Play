import { useState, useEffect } from 'react';
import { database } from '../utils/database';
import { rollDice, diceTypes, sumRolls } from '../utils/dice';
import './CharacterMain.css';

function CharacterMain({ character, onUpdate }) {
  const [editingHp, setEditingHp] = useState(false);
  const [tempHp, setTempHp] = useState(character?.hp || 0);
  const [diceRolls, setDiceRolls] = useState([]);
  const [selectedDice, setSelectedDice] = useState(6);
  const [diceCount, setDiceCount] = useState(1);

  useEffect(() => {
    if (character) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTempHp(character.hp);
    }
  }, [character]);

  const handleHpChange = (newHp) => {
    const clampedHp = Math.max(0, Math.min(newHp, character.maxHp));
    const updated = database.updateCharacter(character.id, { hp: clampedHp });
    onUpdate(updated);
    setTempHp(clampedHp);
  };

  const handleDiceRoll = () => {
    const rolls = rollDice(selectedDice, diceCount);
    const total = sumRolls(rolls);
    const result = {
      id: Date.now(),
      type: `${diceCount}D${selectedDice}`,
      rolls,
      total,
      timestamp: new Date().toLocaleTimeString()
    };
    setDiceRolls(prev => [result, ...prev.slice(0, 9)]);
  };

  const getStatModifier = (stat) => {
    return Math.floor((stat - 10) / 2);
  };

  const formatModifier = (mod) => {
    return mod >= 0 ? `+${mod}` : mod;
  };

  if (!character) {
    return (
      <div className="character-main">
        <div className="card">
          <h2>No Character Selected</h2>
          <p>Please select or create a character first.</p>
        </div>
      </div>
    );
  }

  const hpPercentage = (character.hp / character.maxHp) * 100;

  return (
    <div className="character-main">
      <div className="main-layout">
        <div className="left-column">
          {/* Character Card */}
          <div className="card character-display">
            <div className="character-portrait">
              {character.image ? (
                <img src={character.image} alt={character.name} />
              ) : (
                <div className="default-portrait">
                  {character.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <h2 className="character-name">{character.name}</h2>
            <div className="character-level">Level {character.level} Hunter</div>
          </div>

          {/* HP Card */}
          <div className="card hp-card">
            <div className="card-header">❤️ Life Points</div>
            <div className="hp-display">
              {editingHp ? (
                <div className="hp-edit">
                  <input
                    type="number"
                    className="input"
                    value={tempHp}
                    onChange={(e) => setTempHp(parseInt(e.target.value) || 0)}
                    min="0"
                    max={character.maxHp}
                  />
                  <div className="hp-buttons">
                    <button
                      className="btn btn-success"
                      onClick={() => {
                        handleHpChange(tempHp);
                        setEditingHp(false);
                      }}
                    >
                      ✓
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => {
                        setTempHp(character.hp);
                        setEditingHp(false);
                      }}
                    >
                      ✗
                    </button>
                  </div>
                </div>
              ) : (
                <div className="hp-value" onClick={() => setEditingHp(true)}>
                  <span className="hp-current">{character.hp}</span>
                  <span className="hp-separator">/</span>
                  <span className="hp-max">{character.maxHp}</span>
                </div>
              )}
            </div>
            <div className="hp-bar">
              <div
                className="hp-bar-fill"
                style={{
                  width: `${hpPercentage}%`,
                  backgroundColor: hpPercentage > 50 ? '#BAFFC9' : hpPercentage > 25 ? '#FFDFBA' : '#FF9AA2'
                }}
              />
            </div>
            <div className="hp-quick-actions">
              <button className="btn btn-danger" onClick={() => handleHpChange(character.hp - 10)}>
                -10
              </button>
              <button className="btn btn-danger" onClick={() => handleHpChange(character.hp - 1)}>
                -1
              </button>
              <button className="btn btn-success" onClick={() => handleHpChange(character.hp + 1)}>
                +1
              </button>
              <button className="btn btn-success" onClick={() => handleHpChange(character.hp + 10)}>
                +10
              </button>
            </div>
          </div>

          {/* Stats Card */}
          <div className="card stats-card">
            <div className="card-header">📊 Character Stats</div>
            <div className="stats-display">
              {['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].map(stat => {
                const value = character[stat] || 10;
                const modifier = getStatModifier(value);
                return (
                  <div key={stat} className="stat-row">
                    <div className="stat-name">
                      {stat.charAt(0).toUpperCase() + stat.slice(1).substring(0, 3).toUpperCase()}
                    </div>
                    <div className="stat-value">{value}</div>
                    <div className="stat-modifier">{formatModifier(modifier)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="right-column">
          {/* Dice Roller Card */}
          <div className="card dice-roller">
            <div className="card-header">🎲 Dice Roller</div>
            <div className="dice-controls">
              <div className="form-group">
                <label>Number of Dice</label>
                <input
                  type="number"
                  className="input"
                  value={diceCount}
                  onChange={(e) => setDiceCount(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  max="10"
                />
              </div>
              <div className="dice-type-selector">
                {diceTypes.map(dice => (
                  <button
                    key={dice.sides}
                    className={`btn ${selectedDice === dice.sides ? 'btn-accent' : 'btn-secondary'}`}
                    onClick={() => setSelectedDice(dice.sides)}
                  >
                    {dice.name}
                  </button>
                ))}
              </div>
              <button className="btn btn-success roll-button" onClick={handleDiceRoll}>
                🎲 Roll {diceCount}D{selectedDice}
              </button>
            </div>

            {diceRolls.length > 0 && (
              <div className="dice-results">
                <h3>Recent Rolls</h3>
                {diceRolls.map(roll => (
                  <div key={roll.id} className="dice-result">
                    <div className="result-header">
                      <span className="result-type">{roll.type}</span>
                      <span className="result-time">{roll.timestamp}</span>
                    </div>
                    <div className="result-rolls">
                      {roll.rolls.map((r, i) => (
                        <span key={i} className="roll-value">{r}</span>
                      ))}
                    </div>
                    <div className="result-total">Total: {roll.total}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CharacterMain;
