"use client";

import Link from "next/link";
import { useSyncExternalStore, type ComponentProps } from "react";
import { visibleInsetPath } from "@/lib/inset/routing";

// On inset.andraspop.com links drop the /inset prefix (the proxy adds it back); elsewhere
// (andraspop.com/inset, previews) they keep it. The server and first render use the prefixed
// path, then switch after hydration, so the markup always matches.

const noop = () => () => {};
const onInsetHost = () => window.location.hostname.startsWith("inset.");

export function useOnInsetHost() {
  return useSyncExternalStore(noop, onInsetHost, () => false);
}

type Props = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

export function InsetLink({ href, ...props }: Props) {
  const insetHost = useOnInsetHost();
  return <Link href={visibleInsetPath(href, insetHost)} {...props} />;
}
