import { useBreakpointContext, type Breakpoint } from "./BreakpointProvider.tsx";
import { isNil, isObject } from "./core-external-package/assertion.tsx";
import { Breakpoints } from "./generated-tokens/breakpoints.ts";

export type ResponsiveValue<T> = Partial<Record<Breakpoint, T>>;
export type ResponsiveProp<T> = T | ResponsiveValue<T>;

const responsiveKeys = [...Object.keys(Breakpoints), "base"];

export function isResponsiveObject(obj: unknown): obj is ResponsiveValue<unknown> {
    if (!isObject(obj)) {
        return false;
    }

    return Object.keys(obj).every(key => responsiveKeys.includes(key));
}

export function parseResponsiveValue<T>(value: T | ResponsiveValue<T>, matchedBreakpoints: Breakpoint[]) {
    if (isResponsiveObject(value)) {
        for (let i = 0; i < matchedBreakpoints.length; i++) {
            const responsiveValue = value[matchedBreakpoints[i]];

            if (!isNil(responsiveValue)) {
                return responsiveValue;
            }
        }

        return value["base"];
    }

    return value;
}

export function useResponsiveValue<T>(value: T | ResponsiveValue<T>) {
    const { matchedBreakpoints } = useBreakpointContext();

    return parseResponsiveValue(value, matchedBreakpoints);
}

