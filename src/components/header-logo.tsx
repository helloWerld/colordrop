import Link from "next/link";
import Image from "next/image";

type HeaderLogoProps = {
  href?: string;
  className?: string;
  imageClassName?: string;
  /** "default" (text-xl) or "sm" (text-lg) for dashboard */
  size?: "default" | "sm";
};

export function HeaderLogo({
  href = "/",
  className,
  imageClassName,
  size = "default",
}: HeaderLogoProps) {
  const textClass =
    size === "sm"
      ? "font-heading text-xl font-extrabold text-primary"
      : "font-heading text-2xl font-extrabold text-primary";

  const content = (
    <>
      <Image
        src="/colordrop.png"
        alt="ColorDrop"
        width={40}
        height={40}
        className={`shrink-0 -mr-2 ${imageClassName ?? ""}`}
      />
      <span className={textClass}>
        Color<span className="font-medium">Drop</span>
      </span>
    </>
  );

  const sharedClass = `flex items-center gap-2 ${className ?? ""}`.trim();

  if (href) {
    return (
      <Link href={href} className={sharedClass}>
        {content}
      </Link>
    );
  }

  return <span className={sharedClass}>{content}</span>;
}
