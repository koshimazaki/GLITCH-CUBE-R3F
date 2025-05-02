import React, { useState } from 'react';
import { builtInPatterns } from '../utils/patternLoader';

/**
 * PatternLibrary component
 * 
 * This component can be used to:
 * 1. Display a list of available patterns
 * 2. Preload patterns on demand
 * 3. Provide a UI for selecting patterns
 */
const PatternLibrary = ({ onPatternSelect, showPatternSelector = true }) => {
  const [selectedPattern, setSelectedPattern] = useState(null);

  // Handle pattern selection
  const handlePatternSelect = (patternId) => {
    const pattern = builtInPatterns.find(p => p.id === patternId);
    if (pattern) {
      const result = pattern.loader();
      setSelectedPattern(patternId);
      
      if (onPatternSelect) {
        onPatternSelect(patternId, result);
      }
    }
  };

  // If you want to display a pattern selector UI
  if (showPatternSelector) {
    return (
      <div className="pattern-library">
        <h3>Pattern Library</h3>
        <div className="pattern-grid">
          {builtInPatterns.map(pattern => (
            <button 
              key={pattern.id}
              className={`pattern-item ${selectedPattern === pattern.id ? 'selected' : ''}`}
              onClick={() => handlePatternSelect(pattern.id)}
            >
              {pattern.name}
            </button>
          ))}
        </div>
      </div>
    );
  }
  
  // If only using as a preloader, return null
  return null;
};

export default PatternLibrary; 