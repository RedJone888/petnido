import Image, { type ImageProps } from "next/image";

type AppImageProps = Omit<ImageProps, "width" | "height" | "unoptimized"> & {
  width?: number;
  height?: number;
  unoptimized?: boolean;
};

function canUseConfiguredOptimizer(src: ImageProps["src"]) {
  if (typeof src !== "string") return true;
  if (src.startsWith("/")) return true;
  if (src.startsWith("data:") || src.startsWith("blob:")) return false;
  try {
    const host = new URL(src).hostname;
    return (
      /^lh[3-6]\.googleusercontent\.com$/.test(host) ||
      host === "profile.line-scdn.net" ||
      host === "res.cloudinary.com"
    );
  } catch {
    return false;
  }
}

/**
 * Sized Next.js image for user-generated or legacy image URLs. Known hosts use
 * the configured optimizer; temporary and unknown URLs remain renderable
 * without broadening the production image allowlist.
 */
export function AppImage({
  src,
  alt,
  width = 800,
  height = 600,
  unoptimized,
  ...props
}: AppImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      unoptimized={unoptimized ?? !canUseConfiguredOptimizer(src)}
      {...props}
    />
  );
}
