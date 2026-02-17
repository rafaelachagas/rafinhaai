import React from 'react';

export function renderBBCode(text: string) {
    if (!text) return null;

    // Split text by tags to handle nesting or multiple tags smoothly
    // [b]bold[/b], [i]italic[/i], [u]underline[/u], [url=link]text[/url]
    const parts = text.split(/(\[b\].*?\[\/b\]|\[i\].*?\[\/i\]|\[u\].*?\[\/u\]|\[url=.*?\](.*?)\[\/url\])/gi);

    return parts.map((part, index) => {
        if (!part) return null;

        // Bold [b]...[/b]
        if (part.match(/^\[b\](.*?)\[\/b\]$/i)) {
            const content = part.replace(/^\[b\]|\[\/b\]$/gi, '');
            return <strong key={index} className="font-bold">{content}</strong>;
        }

        // Italic [i]...[/i]
        if (part.match(/^\[i\](.*?)\[\/i\]$/i)) {
            const content = part.replace(/^\[i\]|\[\/i\]$/gi, '');
            return <em key={index} className="italic">{content}</em>;
        }

        // Underline [u]...[/u]
        if (part.match(/^\[u\](.*?)\[\/u\]$/i)) {
            const content = part.replace(/^\[u\]|\[\/u\]$/gi, '');
            return <u key={index} className="underline">{content}</u>;
        }

        // URL [url=...]...[/url]
        const urlMatch = part.match(/^\[url=(.*?)\](.*?)\[\/url\]$/i);
        if (urlMatch) {
            const url = urlMatch[1];
            const content = urlMatch[2];
            return (
                <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#6C5DD3] hover:underline font-bold"
                >
                    {content}
                </a>
            );
        }

        // Plain text
        return part;
    });
}
