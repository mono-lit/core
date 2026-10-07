import { NavDensity, NavProps } from './nav-types.js';
export declare function getNavHeight(density: NavDensity): number;
export declare function generateNavRootClasses(props: {
    density: NavDensity;
    color: string;
    variant: string;
    sticky: boolean;
    extension: boolean;
    rootExtra?: string;
    cssClassName?: string;
}): string;
export declare function validateNavProps(props: NavProps): string[];
