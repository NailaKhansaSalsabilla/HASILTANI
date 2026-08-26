import Image from "next/image";
import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      className={`brand brand-identity ${compact ? "is-compact" : ""}`}
      href="/"
      aria-label="HASILTANI Beranda"
    >
      <Image
        className="brand-identity-icon"
        src="/brand/identity-mascot.png"
        alt=""
        width={62}
        height={58}
        priority
      />

      {!compact && (
        <Image
          className="brand-identity-wordmark"
          src="/brand/identity-wordmark.png"
          alt="HASILTANI — Platform Hasil Pertanian"
          width={240}
          height={90}
          priority
        />
      )}
    </Link>
  );
}