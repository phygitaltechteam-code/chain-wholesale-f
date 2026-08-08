// components/PDF/PDFHeader.tsx
import React from 'react';

interface PDFHeaderProps {
    style?: React.CSSProperties;
    className?: string;
}

const PDFHeader: React.FC<PDFHeaderProps> = ({ style, className = '' }) => {
    return (
        <div
            className={className}
            style={{
                width: '100%',
                textAlign: 'center',
                margin: 0,
                padding: 0,
                ...style,
            }}
        >
            {/* Top Text */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    margin: 0,
                    padding: 0,
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#a84b20',
                }}
            >
                <span>॥ श्री गणेश प्रसन्न ॥</span>
                <span>॥ श्री साई प्रसन्न ॥</span>
            </div>

            {/* Factory Name */}
            <div
                style={{
                    margin: '2px 0 0 0',
                    padding: 0,
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: '#c43d5c',
                    lineHeight: 1.1,
                }}
            >
                मातोश्री चेन फॅक्टरी
            </div>

            {/* Description */}
            <div
                style={{
                    margin: '2px 0 0 0',
                    padding: 0,
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: '#8b451f',
                    lineHeight: 1.2,
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
                }}
            >
                प्रो. नितीन खरात&nbsp;&nbsp; मो. ९३७०२४७०३५ / ९३०९३५५१३६
            </div>
        </div>
    );
};

export default PDFHeader;