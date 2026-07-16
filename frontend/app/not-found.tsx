import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-50 p-6 text-center">
      <Image
        src="/images/404-illustration.png"
        alt=""
        width={360}
        height={360}
        priority
        className="h-auto w-full max-w-xs"
      />

      <h1 className="text-2xl font-semibold text-neutral-900">Page not found</h1>

      <p className="max-w-sm text-sm text-neutral-500">
        The page you're looking for doesn't exist, may have moved, or the link might be mistyped.
      </p>

      <div className="mt-2 flex gap-3">
        <Link
          href="/dashboard"
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
}