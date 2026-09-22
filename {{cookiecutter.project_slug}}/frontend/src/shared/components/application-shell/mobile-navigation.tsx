"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { AuthUser } from "@/features/auth/types/auth-user";
import { getVisibleNavigation } from "@/shared/config/navigation";

import { NavigationLink } from "./navigation-link";

const ANIMATION_DURATION_MS = 300;

interface MobileNavigationProps {
  readonly user: AuthUser;
}

export function MobileNavigation({
  user,
}: MobileNavigationProps): React.ReactNode {
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);

  const navigation = getVisibleNavigation(user);
  const navigationId = useId();
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isRendered) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isRendered]);

  useEffect(() => {
    if (!isRendered) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        closeNavigation();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isRendered]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  function openNavigation(): void {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    setIsRendered(true);

    requestAnimationFrame(() => {
      setIsOpen(true);
    });
  }

  function closeNavigation(): void {
    setIsOpen(false);

    closeTimerRef.current = setTimeout(() => {
      setIsRendered(false);
      closeTimerRef.current = null;
    }, ANIMATION_DURATION_MS);
  }

  const drawer =
    isRendered && typeof document !== "undefined"
      ? createPortal(
          <div
            className={`fixed inset-0 z-100 lg:hidden ${
              isOpen ? "pointer-events-auto" : "pointer-events-none"
            }`}
          >
            <button
              type="button"
              aria-label="Close navigation"
              className={`fixed inset-0 bg-slate-950/50 transition-opacity duration-300 motion-reduce:transition-none ${
                isOpen ? "opacity-100" : "opacity-0"
              }`}
              onClick={closeNavigation}
            />

            <aside
              id={navigationId}
              aria-label="Mobile navigation"
              className={`fixed inset-x-0 top-0 z-101 flex max-h-[85dvh] flex-col overflow-hidden rounded-b-2xl bg-white shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none ${
                isOpen ? "translate-y-0" : "-translate-y-full"
              }`}
            >
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-5">
                <div>
                  <p className="font-semibold text-slate-950">
                    {{ cookiecutter.project_name }}
                  </p>

                  <p className="text-xs text-slate-500">
                    Internal application
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Close navigation"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
                  onClick={closeNavigation}
                >
                  <svg
                    aria-hidden="true"
                    className="size-5"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>

              <nav className="flex-1 space-y-6 overflow-y-auto p-4">
                {navigation.map((section, sectionIndex) => (
                  <div key={section.label ?? `section-${sectionIndex}`}>
                    {section.label ? (
                      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {section.label}
                      </p>
                    ) : null}

                    <div className="space-y-1">
                      {section.items.map((item) => (
                        <NavigationLink
                          key={item.href}
                          item={item}
                          onNavigate={closeNavigation}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </nav>

              <div className="shrink-0 border-t border-slate-200 p-4 text-xs text-slate-500">
                Secure internal application
              </div>
            </aside>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        aria-controls={navigationId}
        aria-expanded={isOpen}
        aria-label="Open navigation"
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-700 transition-colors hover:bg-slate-100 lg:hidden"
        onClick={openNavigation}
      >
        <svg
          aria-hidden="true"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {drawer}
    </>
  );
}
