import { useState, useEffect } from 'react';

export function LoadingPhrases({ phrases }: { phrases: string[] }) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % phrases.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [phrases]);

    return (
        <p className="text-sm text-gray-400 font-medium animate-pulse transition-all duration-300">
            {phrases[index]}
        </p>
    );
}
