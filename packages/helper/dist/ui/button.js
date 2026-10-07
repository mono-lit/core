import { t as MonoButton } from "../mono-button-CoVnBLav.js";
//#region src/components/button/button-utils.ts
/**
* Generate badge CSS classes
*/
function generateBadgeClasses(badgeColor = "red") {
	return `btn-badge bb-${badgeColor}`;
}
/**
* Process SVG icon content
*/
function processIconContent(icon) {
	if (icon.startsWith("<svg")) return icon;
	return icon;
}
/**
* Validate button props
*/
function validateButtonProps(props) {
	const validSizes = [
		"xs",
		"sm",
		"md",
		"lg",
		"xl",
		"xxl"
	];
	const validColors = [
		"primary",
		"secondary",
		"success",
		"danger",
		"warning",
		"info",
		"teal",
		"purple",
		"dark",
		"light"
	];
	const validVariants = [
		"solid",
		"outline",
		"tonal",
		"text"
	];
	const validRounded = [
		"none",
		"xs",
		"sm",
		"md",
		"lg",
		"xl",
		"xxl",
		"full"
	];
	if (props.size && !validSizes.includes(props.size)) return false;
	if (props.color && !validColors.includes(props.color)) return false;
	if (props.variant && !validVariants.includes(props.variant)) return false;
	if (props.rounded && !validRounded.includes(props.rounded)) return false;
	return true;
}
//#endregion
export { MonoButton, generateBadgeClasses, processIconContent, validateButtonProps };
