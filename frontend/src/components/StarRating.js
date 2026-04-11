import React, { useState } from 'react';

const LABELS = ['Poor', 'Below Average', 'Average', 'Good', 'Excellent'];

export default function StarRating({ value, onChange, disabled = false }) {
  const [hover, setHover] = useState(0);
  const current = hover || value;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <div className="star-group">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= current ? 'active' : ''}`}
            onClick={() => !disabled && onChange(star)}
            onMouseEnter={() => !disabled && setHover(star)}
            onMouseLeave={() => !disabled && setHover(0)}
            style={{ cursor: disabled ? 'default' : 'pointer' }}
            title={LABELS[star - 1]}
          >★</span>
        ))}
      </div>
      {current > 0 && <span className="rating-value">{current}/5</span>}
    </div>
  );
}