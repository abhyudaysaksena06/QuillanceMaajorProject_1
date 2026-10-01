import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function RouteLine() {
  const { pathname } = useLocation();
  const [key, setKey] = useState(0);
  useEffect(() => { setKey((k) => k + 1); }, [pathname]);
  return key > 1 ? <div key={key} className="route-line" aria-hidden /> : null;
}
