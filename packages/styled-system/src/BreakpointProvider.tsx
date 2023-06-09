import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { isNil } from "./core-external-package/assertion.tsx";
import { useIsSSR } from "./core-external-package/ssr.ts";
import { Breakpoints } from "./generated-tokens/breakpoints.ts";
import { supportsMatchMedia } from "./useMediaQuery.ts";

export type Breakpoint = keyof typeof Breakpoints | "base"; // TODO,

export interface BreakpointContextType {
    matchedBreakpoints: Breakpoint[];
}

const BreakpointContext = createContext<BreakpointContextType | undefined>(undefined);

export interface BreakpointProviderProps {
    children: ReactNode;
    unsupportedMatchMediaBreakpoint?: Breakpoint;
}

export function BreakpointProvider({
    children,
    unsupportedMatchMediaBreakpoint = "lg"
}: BreakpointProviderProps) {
    const matchedBreakpoints = useMatchedBreakpoints(unsupportedMatchMediaBreakpoint);

    return (
        <BreakpointContext.Provider value={{ matchedBreakpoints }} >
            {children}
        </BreakpointContext.Provider>
    );
}

function useMatchedBreakpoints(unsupportedMatchMediaBreakpoint: Breakpoint = "lg") {
    const entries =
        Object.entries(Breakpoints)
            .sort(([, valueA], [, valueB]) => valueB - valueA);
    const breakpointQueries = entries.map(([, value]) => `(min-width: ${value}px)`);

    const getBreakpointHandler = useCallback(() => {
        const matched: Breakpoint[] = [];

        for (const i in breakpointQueries) {
            const query = breakpointQueries[i];
            if (window.matchMedia(query).matches) {
                matched.push(entries[i][0] as Breakpoint);
            }
        }

        matched.push("base");

        return matched;
    }, [unsupportedMatchMediaBreakpoint]);

    const [matchedBreakpoints, setMatchedBreakpoints] = useState<Breakpoint[]>(
        supportsMatchMedia
            ? getBreakpointHandler()
            : [unsupportedMatchMediaBreakpoint]);

    useEffect(() => {
        if (!supportsMatchMedia) {
            return;
        }

        const handleResize = () => {
            const breakpointHandler = getBreakpointHandler();

            setMatchedBreakpoints(previousMatchedBreakpoints => {
                if (previousMatchedBreakpoints.length !== breakpointHandler.length ||
          previousMatchedBreakpoints.some((breakpoint, idx) => breakpoint !== breakpointHandler[idx])) {
                    return [...breakpointHandler]; // Return a new array to force state change
                }

                return previousMatchedBreakpoints;
            });
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [supportsMatchMedia]);

    // If in SSR, the media query should never match. Once the page hydrates,
    // this will update and the real value will be returned.
    const isSSR = useIsSSR();

    return isSSR ? [unsupportedMatchMediaBreakpoint] : matchedBreakpoints;
}

export function useBreakpointContext() {
    const context = useContext(BreakpointContext);

    if (isNil(context)) {
        throw new Error("useBreakpointContext must be used within a BreakpointProvider");
    }

    return context;
}
