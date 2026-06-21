"use client";

import { Component, type ReactNode } from "react";

/**
 * Catches any error thrown while rendering a WebGL <Canvas> (driver crash,
 * context-creation failure, runtime context loss) and renders `fallback`
 * instead of letting the whole section go blank. Pairs with the up-front
 * `useWebGLSupport()` check, which can't predict mid-session failures.
 */
export class CanvasErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    // Surface for debugging without breaking the page.
    console.warn("WebGL scene failed, showing fallback:", error);
  }

  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}
