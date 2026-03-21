import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number; // Current average rating
  count: number; // Total number of ratings
  onRate?: (stars: number) => void; // Callback when user clicks a star
  userRating?: number; // If user already rated, show their rating
  readOnly?: boolean; // If true, just display the stars
}

export default function StarRating({ rating, count, onRate, userRating, readOnly = false }: StarRatingProps) {
  const [hover, setHover] = useState(0);

  // Helper to determine star color/fill
  const getStarState = (index: number) => {
    const starValue = index + 1;
    
    // If user is hovering, show hover state
    if (!readOnly && hover >= starValue) return 'hover';
    
    // If user already rated, show their rating
    if (userRating && userRating >= starValue) return 'rated';
    
    // Otherwise show average rating
    if (rating >= starValue) return 'full';
    if (rating >= starValue - 0.5) return 'half';
    
    return 'empty';
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => {
          const state = getStarState(i);
          const starValue = i + 1;
          
          return (
            <button
              key={i}
              type="button"
              disabled={readOnly}
              onMouseEnter={() => !readOnly && setHover(starValue)}
              onMouseLeave={() => !readOnly && setHover(0)}
              onClick={() => !readOnly && onRate?.(starValue)}
              className={`${readOnly ? 'cursor-default' : 'cursor-pointer transition-transform hover:scale-110'}`}
            >
              <Star
                size={18}
                className={`${
                  state === 'hover' ? 'text-yellow-400 fill-yellow-400' :
                  state === 'rated' ? 'text-indigo-500 fill-indigo-500' :
                  state === 'full' ? 'text-yellow-500 fill-yellow-500' :
                  state === 'half' ? 'text-yellow-500' : // Half fill is tricky with simple SVG, we'll stick to full/empty or use a mask
                  'text-gray-300'
                }`}
                strokeWidth={2}
              />
            </button>
          );
        })}
        <span className="text-sm font-bold text-gray-700 ml-1">
          {rating.toFixed(1)}
        </span>
      </div>
      <span className="text-xs text-gray-400">
        ({count} {count === 1 ? 'avaliação' : 'avaliações'})
      </span>
    </div>
  );
}
