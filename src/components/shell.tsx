"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Wordmark } from "@/components/wordmark";

const NAV = [
  { href: "/close", id: "close", label: "Close" },
  { href: "/close#today", id: "tally", label: "Tally" },
  { href: "/close#moves", id: "moves", label: "Moves" },
  { href: "/audit", id: "audit", label: "3P audit" },
  { href: "/trial", id: "seat", label: "Owner seat" },
] as const;

export type ShellActive = (typeof NAV)[number]["id"] | "home";

export function Shell({
  active,
  title,
  meta,
  location,
  action,
  aside,
  children,
}: {
  active: ShellActive;
  title: string;
  meta?: string;
  location?: ReactNode;
  action?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8f6f2] text-[#25262a]">
      <p className="bg-[#fffbeb] px-4 py-2 text-center text-xs font-semibold text-[#7b3306]">
        Private preview. Fictional examples until your files land.
      </p>
      <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
        {open ? (
          <button type="button" className="fixed inset-0 z-30 bg-[#18232b]/50 lg:hidden" aria-label="Close menu" onClick={() => setOpen(false)} />
        ) : null}
        <aside
          className={`n86-drawer fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col bg-[#18232b] text-white transition-transform duration-200 lg:static lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex h-[76px] items-center px-5">
            <Wordmark light />
          </div>
          <p className="px-5 pb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9aada4]">1 to 9 units</p>
          <nav className="grid gap-1 px-3" aria-label="Primary">
            {NAV.map((item) => {
              const on = item.id === active;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex min-h-11 items-center rounded-md px-3 text-sm font-semibold ${on ? "bg-[#2c3c48] shadow-[inset_3px_0_0_#e97b4c]" : "hover:bg-[#263640]"}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <p className="mt-auto px-5 py-5 text-xs leading-5 text-[#9aada4]">One location and the owner seat are free. More units stay TBD.</p>
        </aside>
        <div className="min-w-0">
          <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-[#d8d5cd] bg-[#fffefa] px-4 py-3">
            <button type="button" className="n86-btn-secondary lg:hidden" onClick={() => setOpen(true)}>
              Menu
            </button>
            <div className="min-w-0 flex-1">
              <p className="n86-eyebrow text-[#963c1c]">Find the leak. Assign the fix.</p>
              <h1 className="truncate text-xl font-bold tracking-[-0.04em]">{title}</h1>
              {meta ? <p className="text-xs text-[#657078]">{meta}</p> : null}
            </div>
            {location}
            {action}
          </header>
          <div className={aside ? "xl:grid xl:grid-cols-[minmax(0,1fr)_260px]" : ""}>
            <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
            {aside ? <div className="border-t border-[#dbe1e5] bg-[#eef1f3] px-4 py-5 xl:border-l xl:border-t-0">{aside}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
