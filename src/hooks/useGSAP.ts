"use client";

import { useLayoutEffect, useEffect } from "react";
import gsap from "gsap";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export interface UseGSAPOptions {
  scope?: React.RefObject<Element | null> | Element | null;
  dependencies?: any[];
}

export function useGSAP(
  callback: (context: gsap.Context) => void | (() => void),
  options: UseGSAPOptions | any[] = {}
) {
  const config = Array.isArray(options) ? { dependencies: options } : options;
  const { scope, dependencies = [] } = config;

  useIsomorphicLayoutEffect(() => {
    const scopeElement = scope && "current" in scope ? scope.current : scope;
    const ctx = gsap.context((c) => {
      callback(c);
    }, scopeElement || undefined);

    return () => {
      ctx.revert();
    };
  }, dependencies);
}
