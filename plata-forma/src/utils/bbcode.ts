/**
 * Converts BBCode to HTML for rendering in the UI.
 */
export const bbcodeToHtml = (text: string) => {
    if (!text) return '';
    let html = text
        .replace(/\[b\]([\s\S]*?)\[\/b\]/gi, '<strong>$1</strong>')
        .replace(/\[i\]([\s\S]*?)\[\/i\]/gi, '<em>$1</em>')
        .replace(/\[u\]([\s\S]*?)\[\/u\]/gi, '<u>$1</u>')
        .replace(/\[left\]([\s\S]*?)\[\/left\]/gi, '<div style="text-align: left">$1</div>')
        .replace(/\[center\]([\s\S]*?)\[\/center\]/gi, '<div style="text-align: center">$1</div>')
        .replace(/\[right\]([\s\S]*?)\[\/right\]/gi, '<div style="text-align: right">$1</div>')
        .replace(/\[url=(.*?)\]([\s\S]*?)\[\/url\]/gi, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #6C5DD3; font-weight: bold; text-decoration: underline;">$2</a>')
        .replace(/\[img\](.*?)\[\/img\]/gi, '<img src="$1" style="max-width: 100%; border-radius: 8px; margin: 10px 0;" />')
        .replace(/\[pdf\](.*?)\[\/pdf\]/gi, '<div style="padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-weight: bold; color: #ef4444; margin: 10px 0;">[Arquivo PDF Anexado]</div>');

    // Handle unordered lists [list]
    html = html.replace(/\[list\]([\s\S]*?)\[\/list\]/gi, (match, p1) => {
        const items = p1.split(/\[\*\]/)
            .map((item: string) => item.trim())
            .filter((item: string) => item.length > 0)
            .map((item: string) => `<li>${item}</li>`)
            .join('');
        return `<ul style="list-style-type: disc; padding-left: 1.5rem; margin: 1.25rem 0;">${items}</ul>`;
    });

    // Handle ordered lists [list=1]
    html = html.replace(/\[list=1\]([\s\S]*?)\[\/list\]/gi, (match, p1) => {
        const items = p1.split(/\[\*\]/)
            .map((item: string) => item.trim())
            .filter((item: string) => item.length > 0)
            .map((item: string) => `<li>${item}</li>`)
            .join('');
        return `<ol style="list-style-type: decimal; padding-left: 1.5rem; margin: 1.25rem 0;">${items}</ol>`;
    });

    return html.replace(/\n/g, '<br />');
};

/**
 * Converts HTML from contentEditable div back to BBCode for saving in database.
 */
export const htmlToBbcode = (html: string) => {
    if (!html) return '';

    const tmp = document.createElement('div');
    tmp.innerHTML = html;

    const walk = (node: Node): string => {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent || '';
        }

        if (node.nodeType !== Node.ELEMENT_NODE) return '';

        const el = node as HTMLElement;
        let content = '';

        for (const child of Array.from(el.childNodes)) {
            content += walk(child);
        }

        const tag = el.tagName.toLowerCase();

        if (tag === 'strong' || tag === 'b' || el.style.fontWeight === 'bold' || parseInt(el.style.fontWeight) >= 600) {
            return `[b]${content}[/b]`;
        }
        if (tag === 'em' || tag === 'i' || el.style.fontStyle === 'italic') {
            return `[i]${content}[/i]`;
        }
        if (tag === 'u' || tag === 'ins' || (el.style.textDecoration && el.style.textDecoration.includes('underline'))) {
            return `[u]${content}[/u]`;
        }
        if (tag === 'a') {
            const href = el.getAttribute('href');
            if (!href) return content;
            // Strip any inner formatting to avoid double-wrapping in bbcode
            const cleanContent = content.trim();
            return `[url=${href}]${cleanContent}[/url]`;
        }
        if (tag === 'img') {
            const src = el.getAttribute('src');
            return src ? `[img]${src}[/img]` : '';
        }
        if (tag === 'font') {
            // Browser may wrap text in <font> when using execCommand, just pass content through
            return content;
        }
        if (tag === 'span') {
            // Detect underline from span style (browser compatibility)
            if (el.style.textDecoration && el.style.textDecoration.includes('underline')) {
                return `[u]${content}[/u]`;
            }
            // Otherwise pass through transparently
            return content;
        }
        if (tag === 'ul') {
            return `[list]\n${content.trim()}\n[/list]`;
        }
        if (tag === 'ol') {
            return `[list=1]\n${content.trim()}\n[/list]`;
        }
        if (tag === 'li') {
            return `[*] ${content.trim()}\n`;
        }
        if (tag === 'div' || tag === 'p') {
            const align = el.style.textAlign;
            if (content === '\n') return '\n';
            if (align === 'center' || align === 'right' || align === 'left') {
                return `[${align}]${content}[/${align}]\n`;
            }
            return content + (content.endsWith('\n') ? '' : '\n');
        }
        if (tag === 'br') {
            return '\n';
        }

        return content;
    };

    let result = walk(tmp);

    return result
        .replace(/&nbsp;/g, ' ')
        .replace(/\[(b|i|u|left|center|right)\]\s*\[\/\1\]/gi, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
};
