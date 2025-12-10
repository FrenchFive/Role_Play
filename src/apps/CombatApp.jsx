import { useState } from 'react';
import { SwordsIcon } from '../components/icons/Icons';
import './CombatApp.css';

function CombatApp() {
  const [message] = useState('Combat Grid System');

  return (
    <div className="combat-app">
      <div className="combat-header">
        <h1><SwordsIcon size={32} /> Combat</h1>
      </div>

      <div className="combat-placeholder">
        <div className="placeholder-icon">
          <SwordsIcon size={72} />
        </div>
        <h2>{message}</h2>
        <p className="placeholder-text">
          Advanced tactical combat grid with drawing tools, initiative tracking, and token movement.
        </p>
        <p className="placeholder-text">
          Full implementation coming soon with:
        </p>
        <ul className="feature-list">
          <li>Infinite scrollable grid</li>
          <li>Drawing tools (pen, line, shapes)</li>
          <li>Player and monster tokens</li>
          <li>Initiative tracker</li>
          <li>DM visibility controls</li>
          <li>Turn-based combat flow</li>
        </ul>
      </div>
    </div>
  );
}

export default CombatApp;
