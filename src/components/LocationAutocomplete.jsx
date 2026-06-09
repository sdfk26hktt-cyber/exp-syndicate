import React from 'react';

const LocationAutocomplete = ({ value, onChange, placeholder, style }) => {
  // Bypassing Google Maps Autocomplete due to API Key / Billing errors
  // returning a standard text input so the app doesn't freeze.
  return (
    <input
      type="text"
      placeholder={placeholder || "Location or Link (Optional)"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={style}
      className="w-full p-2 border rounded"
    />
  );
};

export default LocationAutocomplete;
