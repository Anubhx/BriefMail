import React from "react";
import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";

export type LogoVariant = "long" | "square" | "text";
export type LogoFormat = "svg" | "png";

interface LogoProps {
  variant?: LogoVariant;
  format?: LogoFormat;
  className?: string;
  width?: number;
  height?: number;
  href?: string;
  priority?: boolean;
  alt?: string;
}

const LOGO_SRC: Record<LogoFormat, Record<LogoVariant, string>> = {
  svg: {
    long: "/logos/logo-long.svg",
    square: "/logos/logo-square.svg",
    text: "/logos/logo-text.svg",
  },
  png: {
    long: "/logos/logo-long.png",
    square: "/logos/logo-square.png",
    text: "/logos/logo-text.png",
  },
};

// Default aspect ratio dimensions
const DEFAULT_DIMENSIONS: Record<LogoVariant, { width: number; height: number }> = {
  long: { width: 160, height: 30 },
  square: { width: 36, height: 33 },
  text: { width: 130, height: 27 },
};

export function Logo({
  variant = "long",
  format = "svg",
  className,
  width,
  height,
  href,
  priority = false,
  alt = "BriefMail Logo",
}: LogoProps) {
  const dimensions = DEFAULT_DIMENSIONS[variant];
  const w = width ?? dimensions.width;
  const h = height ?? dimensions.height;
  const src = LOGO_SRC[format][variant];

  const imageElement = (
    <Image
      src={src}
      alt={alt}
      width={w}
      height={h}
      priority={priority}
      className={clsx("object-contain select-none transition-opacity duration-150", className)}
    />
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center group cursor-pointer focus:outline-hidden">
        {imageElement}
      </Link>
    );
  }

  return imageElement;
}
