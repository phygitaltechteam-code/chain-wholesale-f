// components/PDF/PDFHeader.tsx
import React from 'react';

interface PDFHeaderProps {
    style?: React.CSSProperties;
    className?: string;
}

const PDFHeader: React.FC<PDFHeaderProps> = ({ style, className = '' }) => {
    return (<div
    className={className}
    style={{
        width: '100%',
        textAlign: 'center',
        margin: 0,
        padding: 0,
        ...style,
    }}
>
    {/* Top Row - Ganesh, Factory Name, Sai all in one row */}
<div
    style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        margin: 0,
        padding: 0,
        width: '100%',
    }}
>
    <span style={{ 
        fontSize: '12px', 
        fontWeight: 'bold', 
        color: '#a84b20',
        whiteSpace: 'nowrap',
        flex: '0 0 auto',
    }}>
        ॥ श्री गणेश प्रसन्न ॥
    </span>
    <span style={{ 
        fontSize: '28px', 
        fontWeight: 'bold', 
        color: '#c43d5c',
        whiteSpace: 'nowrap',
        flex: '1 1 auto',
        textAlign: 'center',
        padding: '0 10px',
    }}>
        मातोश्री चेन फॅक्टरी
    </span>
    <span style={{ 
        fontSize: '12px', 
        fontWeight: 'bold', 
        color: '#a84b20',
        whiteSpace: 'nowrap',
        flex: '0 0 auto',
    }}>
        ॥ श्री साई प्रसन्न ॥
    </span>
</div>

{/* Description */}
<div
    style={{
        margin: '2px 0 0 0',
        padding: 1,
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#8b451f',
        lineHeight: 1.2,
        textAlign: 'center',
    }}
>
    आमचेकडे ऑर्डर प्रमाणे सोन्याच्या चेन बनवल्या जातील.
</div>

{/* Contact */}
<div
    style={{
        margin: '2px 0 0 0',
        padding: 0,
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#a84b20',
        lineHeight: 1.2,
        textAlign: 'center',
    }}
>
    प्रो. नितीन खरात&nbsp;&nbsp; मो. ९३७०२४७०३५ / ९३०९३५५१३६
</div>
</div>
    );
};

export default PDFHeader;