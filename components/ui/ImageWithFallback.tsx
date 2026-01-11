"use client";

import React, { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';

interface ImageWithFallbackProps extends ImageProps {
    fallbackSrc?: string;
}

export function ImageWithFallback({ src, fallbackSrc = "/images/default-album.svg", alt, loading = "lazy", ...props }: Readonly<ImageWithFallbackProps>) {
    const [imgSrc, setImgSrc] = useState(src);

    useEffect(() => {
        setImgSrc(src);
    }, [src]);

    return (
        <Image
            {...props}
            src={imgSrc}
            alt={alt}
            loading={loading}
            onError={() => {
                // If the current src is not already the fallback, switch to fallback
                if (imgSrc !== fallbackSrc) {
                    setImgSrc(fallbackSrc);
                }
            }}
        />
    );
}
