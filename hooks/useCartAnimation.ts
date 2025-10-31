'use client';

import { useEffect, useState } from 'react';

export function useCartAnimation() {
  const [shouldShake, setShouldShake] = useState(false);

  const triggerShake = () => {
    setShouldShake(true);
    setTimeout(() => setShouldShake(false), 600);
  };

  return { shouldShake, triggerShake };
}
