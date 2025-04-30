import { useState, useEffect } from 'react';
import './ColorPickerInput.css';

/**
 * ColorPickerInput - A simple color picker component that ensures the native color picker opens on click
 * @param {Object} props - Component props
 * @param {string} props.label - Label text for the color picker
 * @param {string} props.value - Current color value in hex format
 * @param {function} props.onChange - Callback function when color changes
 * @param {string} props.className - Additional CSS class names
 * @returns {JSX.Element} - Rendered component
 */
const ColorPickerInput = ({ label, value, onChange, className = '' }) => {
  // Local state to avoid re-renders during color selection
  const [localValue, setLocalValue] = useState(value);
  
  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };
  
  return (
    <div className={`color-picker-container ${className}`}>
      {label && <label>{label}:</label>}
      <div className="color-picker-input">
        <div className="color-input-wrapper">
          <input 
            type="color" 
            value={localValue} 
            onChange={handleChange} 
            id={`color-picker-${label?.replace(/\s+/g, '-').toLowerCase() || 'main'}`}
          />
          <div 
            className="color-swatch" 
            style={{ backgroundColor: localValue }}
            onClick={() => document.getElementById(`color-picker-${label?.replace(/\s+/g, '-').toLowerCase() || 'main'}`).click()}
          ></div>
        </div>
        <div 
          className="color-value"
          onClick={() => document.getElementById(`color-picker-${label?.replace(/\s+/g, '-').toLowerCase() || 'main'}`).click()}
        >
          {localValue}
        </div>
      </div>
    </div>
  );
};

export default ColorPickerInput; 