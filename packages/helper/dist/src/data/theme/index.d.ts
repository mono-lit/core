import { FlavorName, ThemeName } from './presets';
export interface ThemeConfig {
    name: ThemeName;
    displayName: string;
}
export interface FlavorConfig {
    name: FlavorName;
    displayName: string;
}
export declare const themes: Record<ThemeName, ThemeConfig>;
export declare const flavors: Record<FlavorName, FlavorConfig>;
export type ApplyThemeInput = ThemeName | {
    color?: ThemeName;
    flavor?: FlavorName;
};
export declare function applyTheme(input: ApplyThemeInput): void;
export declare function applyFlavor(flavorName: FlavorName): void;
export declare function getCurrentTheme(): ThemeName;
export declare function getCurrentFlavor(): FlavorName;
export declare function getThemeData(themeName: ThemeName): ThemeConfig | undefined;
export declare function getFlavorData(flavorName: FlavorName): FlavorConfig | undefined;
export declare function getAllThemes(): ThemeConfig[];
export declare function getAllFlavors(): FlavorConfig[];
export declare function isValidTheme(themeName: string): themeName is ThemeName;
export declare function isValidFlavor(flavorName: string): flavorName is FlavorName;
export declare function resetTheme(): void;
export declare function resetFlavor(): void;
export declare function createThemeClass(themeName: ThemeName): string;
/** Structure class for a flavor — empty for `one` (the default, no class). */
export declare function createFlavorClass(flavorName: FlavorName): string;
