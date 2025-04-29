import { useEffect, useState } from 'react';

const useDebounce = (query, fetchFn, delay = 1000) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  console.log(query);
  

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const handler = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await fetchFn(query);
        setResults(data || []);
      } catch (err) {
        console.error('Debounced fetch error:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, delay);

    return () => clearTimeout(handler);
  }, [query, fetchFn, delay]);

  return { results, loading };
};

export default useDebounce;
