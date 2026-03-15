'use client';

import NextImage, { ImageProps } from 'next/image';
import { useCallback, useRef, useState } from 'react';

function isExternalImage(src: ImageProps['src']): boolean {
    if (typeof src !== 'string') return false;
    return src.startsWith('http://') || src.startsWith('https://');
}

// Cek apakah URL adalah signed URL S3 -- MinIO menolak HEAD request dari Next.js Image Optimization
function isS3SignedUrl(src: ImageProps['src']): boolean {
    if (typeof src !== 'string') return false;
    return src.includes('X-Amz-Signature');
}

export default function Image(props: ImageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const imgRef = useRef<HTMLImageElement | null>(null);
    const isExternal = isExternalImage(props.src);
    const shouldSkipOptimization = isS3SignedUrl(props.src);
    const showSkeleton = isLoading && props.fill && isExternal;

    const handleRef = useCallback((el: HTMLImageElement | null) => {
        imgRef.current = el;
        if (el?.complete && el.naturalWidth > 0) {
            setIsLoading(false);
        }
    }, []);

    return (
        <>
            {showSkeleton && (
                <div
                    className="absolute inset-0 bg-gray-300 animate-pulse"
                    style={{ borderRadius: 'inherit' }}
                />
            )}
            <NextImage
                {...props}
                unoptimized={shouldSkipOptimization || props.unoptimized}
                ref={handleRef}
                onLoad={(e) => {
                    setIsLoading(false);
                    props.onLoad?.(e);
                }}
                onError={(e) => {
                    setIsLoading(false);
                    props.onError?.(e);
                }}
            />
        </>
    );
}
