# Mono Button API Reference

Complete API documentation for all button components.

## MonoButton

The main button component with extensive styling and behavior options.

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Button size |
| `color` | `'primary' \| 'secondary' \| 'success' \| 'danger' \| 'warning' \| 'info' \| 'teal' \| 'purple' \| 'dark' \| 'light'` | `'primary'` | Button color theme |
| `variant` | `'solid' \| 'outline' \| 'tonal' \| 'text'` | `'solid'` | Button visual style (`text` = no background or border at rest, tonal look on hover/focus) |
| `shape` | `'square' \| 'pill' \| 'circle'` | `'square'` | Button shape |
| `disabled` | `boolean` | `false` | Disable the button |
| `loading` | `boolean` | `false` | Show loading state. The spinner is drawn in the icon place (so it follows `iconPosition`) and the caption stays visible; a button with no icon grows a leading one |
| `fullWidth` | `boolean` | `false` | Make button full width |
| `href` | `string` | `undefined` | Render as link with this href |
| `target` | `string` | `undefined` | Link target (when href is set) |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | HTML button type |
| `iconPosition` | `'left' \| 'right'` | `'left'` | Position of icon slot |
| `badge` | `string` | `undefined` | Badge text content |
| `badgeColor` | `'red' \| 'green' \| 'orange' \| 'cobalt'` | `'red'` | Badge color |

### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `focus()` | - | `void` | Focus the button programmatically |
| `blur()` | - | `void` | Remove focus from the button |
| `click()` | - | `void` | Programmatically trigger button click |

### Events

| Event | Detail Type | Description |
|-------|-------------|-------------|
| `button-click` | `{ originalEvent: MouseEvent }` | Fired when the button is clicked |

### Slots

| Slot Name | Description |
|-----------|-------------|
| (default) | Button text content |
| `icon` | Icon content (SVG or other elements) |

### CSS Custom Properties

The component uses these CSS custom properties for theming:

| Property | Description | Default |
|----------|-------------|---------|
| `--theme-primary` | Primary color | Theme dependent |
| `--theme-secondary` | Secondary color | Theme dependent |
| `--theme-accent` | Accent color | Theme dependent |
| `--theme-background` | Background color | Theme dependent |

### Usage Example

```html
<mono-button
  size="lg"
  color="primary"
  variant="solid"
  shape="pill"
  loading="false"
  badge="5"
  badge-color="red"
>
  <svg slot="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
    <path d="M12 5v14M5 12h14"/>
  </svg>
  Click Me
</mono-button>
```

## MonoButtonIcon

Icon-only button variant for compact UI elements.

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Icon button size |
| `color` | `'primary' \| 'secondary' \| 'success' \| 'danger' \| 'warning' \| 'info' \| 'teal' \| 'purple' \| 'dark' \| 'light'` | `'primary'` | Icon button color |
| `round` | `boolean` | `false` | Make icon button circular |
| `glass` | `boolean` | `false` | Apply glass effect |
| `disabled` | `boolean` | `false` | Disable the icon button |
| `tooltip` | `string` | `undefined` | Tooltip text |
| `href` | `string` | `undefined` | Render as link |
| `target` | `string` | `undefined` | Link target |
| `badge` | `string` | `undefined` | Badge text |
| `badgeColor` | `'red' \| 'green' \| 'orange' \| 'cobalt'` | `'red'` | Badge color |

### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `focus()` | - | `void` | Focus the icon button |
| `blur()` | - | `void` | Remove focus from the icon button |

### Events

| Event | Detail Type | Description |
|-------|-------------|-------------|
| `button-click` | `{ originalEvent: MouseEvent }` | Fired when the icon button is clicked |

### Slots

| Slot Name | Description |
|-----------|-------------|
| (default) | Icon content (SVG or other elements) |

### Usage Example

```html
<mono-button-icon
  size="lg"
  color="primary"
  round
  tooltip="Add new item"
  badge="3"
>
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
    <path d="M12 5v14M5 12h14"/>
  </svg>
</mono-button-icon>
```

## MonoButtonFab

Floating Action Button variant for primary actions.

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `circle` | `boolean` | `false` | Make FAB circular (icon only) |
| `sm` | `boolean` | `false` | Small FAB variant |
| `disabled` | `boolean` | `false` | Disable the FAB |
| `href` | `string` | `undefined` | Render as link |
| `target` | `string` | `undefined` | Link target |

### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `focus()` | - | `void` | Focus the FAB |
| `blur()` | - | `void` | Remove focus from the FAB |

### Events

| Event | Detail Type | Description |
|-------|-------------|-------------|
| `button-click` | `{ originalEvent: MouseEvent }` | Fired when the FAB is clicked |

### Slots

| Slot Name | Description |
|-----------|-------------|
| (default) | FAB content (icon + optional text) |

### Usage Example

```html
<!-- FAB with text and icon -->
<mono-button-fab>
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
    <path d="M12 5v14M5 12h14"/>
  </svg>
  Add New
</mono-button-fab>

<!-- Circular FAB (icon only) -->
<mono-button-fab circle>
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
    <path d="M12 5v14M5 12h14"/>
  </svg>
</mono-button-fab>

<!-- Small circular FAB -->
<mono-button-fab sm circle>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
    <path d="M12 5v14M5 12h14"/>
  </svg>
</mono-button-fab>
```

## Type Definitions

### ButtonSize

```typescript
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
```

### ButtonColor

```typescript
type ButtonColor = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'teal' | 'purple' | 'dark' | 'light';
```

### ButtonVariant

```typescript
type ButtonVariant = 'solid' | 'outline' | 'tonal' | 'text';
```

### ButtonShape

```typescript
type ButtonShape = 'square' | 'pill' | 'circle';
```

### BadgeColor

```typescript
type BadgeColor = 'red' | 'green' | 'orange' | 'cobalt';
```

### ButtonProps

```typescript
interface ButtonProps {
  size?: ButtonSize;
  color?: ButtonColor;
  variant?: ButtonVariant;
  shape?: ButtonShape;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  href?: string;
  target?: string;
  type?: 'button' | 'submit' | 'reset';
  iconPosition?: 'left' | 'right';
  badge?: string;
  badgeColor?: BadgeColor;
}
```

### ButtonEvents

```typescript
interface ButtonEvents {
  click: CustomEvent<MouseEvent>;
  'button-click': CustomEvent<{ originalEvent: MouseEvent }>;
}
```

## Utility Functions

### generateButtonClasses()

Generate CSS classes for the main button component.

```typescript
function generateButtonClasses(
  size: ButtonSize = 'md',
  color: ButtonColor = 'primary',
  variant: ButtonVariant = 'solid',
  shape: ButtonShape = 'square',
  disabled: boolean = false,
  loading: boolean = false,
  fullWidth: boolean = false,
  iconPosition: 'left' | 'right' = 'left',
  badge: string | undefined,
  badgeColor: BadgeColor = 'red'
): string
```

### generateIconClasses()

Generate CSS classes for icon buttons.

```typescript
function generateIconClasses(
  size: ButtonSize = 'md',
  color: ButtonColor = 'primary',
  round: boolean = false,
  glass: boolean = false,
  disabled: boolean = false
): string
```

### generateFabClasses()

Generate CSS classes for FAB buttons.

```typescript
function generateFabClasses(
  circle: boolean = false,
  sm: boolean = false,
  disabled: boolean = false
): string
```

### processIconContent()

Process SVG icon content.

```typescript
function processIconContent(icon: string): string
```

### generateBadgeClasses()

Generate badge CSS classes.

```typescript
function generateBadgeClasses(badgeColor: BadgeColor = 'red'): string
```

## Theme Functions

### applyTheme()

Apply a theme to the document.

```typescript
function applyTheme(themeName: 'navy-sky' | 'navy-teal' | 'blue-gold' | 'light-blue' | 'material' | 'one'): void
```

### getCurrentTheme()

Get the current active theme.

```typescript
function getCurrentTheme(): 'navy-sky' | 'navy-teal' | 'blue-gold' | 'light-blue' | 'material' | 'one'
```

### getThemeData()

Get theme data by name.

```typescript
function getThemeData(themeName: ThemeName): ThemeConfig | undefined
```

### getAllThemes()

Get all available themes.

```typescript
function getAllThemes(): ThemeConfig[]
```

### isValidTheme()

Check if a theme name is valid.

```typescript
function isValidTheme(themeName: string): themeName is ThemeName
```

### resetTheme()

Reset to default theme (navy-sky).

```typescript
function resetTheme(): void
```

### getThemeColor()

Get CSS variable value for current theme.

```typescript
function getThemeColor(variableName: keyof ThemeConfig['colors']): string
```

### createThemeStyles()

Create a theme-aware style object.

```typescript
function createThemeStyles(): Record<string, string>
```

## Theme Types

### ThemeName

```typescript
type ThemeName = 'navy-sky' | 'navy-teal' | 'blue-gold' | 'light-blue' | 'material' | 'one';
```

### ThemeConfig

```typescript
interface ThemeConfig {
  name: ThemeName;
  displayName: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    border: string;
    success: string;
    danger: string;
    warning: string;
    info: string;
  };
}
```

## Event Handling

### Button Click Event

```typescript
const button = document.querySelector('mono-button');

button.addEventListener('button-click', (event) => {
  // Access the original mouse event
  const originalEvent = event.detail.originalEvent;

  // Get button properties
  const buttonElement = event.target;
  const size = buttonElement.size;
  const color = buttonElement.color;

  console.log('Button clicked:', {
    size,
    color,
    timestamp: originalEvent.timeStamp
  });
});
```

### Theme Change Event

```typescript
window.addEventListener('theme-changed', (event) => {
  const { theme, themeData } = event.detail;

  console.log('Theme changed to:', theme);
  console.log('Theme colors:', themeData.colors);
});
```

## TypeScript Support

All components are fully typed with TypeScript. Import types for better development experience:

```typescript
import type {
  ButtonSize,
  ButtonColor,
  ButtonVariant,
  ButtonProps,
  ThemeName,
  ThemeConfig
} from '@mono-helper/mono-button';

// Use types in your code
const buttonProps: ButtonProps = {
  size: 'lg',
  color: 'primary',
  variant: 'solid',
  loading: false
};
```

## Browser API

### Web Component Lifecycle

The components follow standard Web Component lifecycle:

- **connectedCallback()**: Called when element is added to DOM
- **disconnectedCallback()**: Called when element is removed from DOM
- **attributeChangedCallback()**: Called when observed attributes change
- **adoptedCallback()**: Called when element is moved to new document

### Custom Element Registry

Components are automatically registered with customElements:

```typescript
// Check if component is defined
console.log(customElements.get('mono-button')); // MonoButton class
console.log(customElements.get('mono-button-icon')); // MonoButtonIcon class
console.log(customElements.get('mono-button-fab')); // MonoButtonFab class
```

## CSS Shadow DOM

All components use Shadow DOM for style isolation. Styles are scoped to the component and don't leak to other elements.

### Accessing Shadow DOM

```typescript
const button = document.querySelector('mono-button');
const shadowRoot = button.shadowRoot; // Access shadow root

// Note: Direct manipulation of Shadow DOM is not recommended
```

## Performance Considerations

### Bundle Size

- **MonoButton**: ~8KB (minified + gzipped)
- **MonoButtonIcon**: ~4KB (minified + gzipped)
- **MonoButtonFab**: ~3KB (minified + gzipped)
- **Total**: ~12KB (minified + gzipped) for all button components

### Tree Shaking

Import only what you need:

```typescript
// Import specific components
import { MonoButton } from '@mono-helper/mono-button';

// Import specific utilities
import { applyTheme, getCurrentTheme } from '@mono-helper/mono-button';

// Import specific types
import type { ButtonSize, ButtonColor } from '@mono-helper/mono-button';
```

### Rendering Performance

- **Lit Element**: Efficient reactivity with minimal re-renders
- **Shadow DOM**: Isolated rendering prevents style thrashing
- **CSS**: UnoCSS generates only used utilities
- **Events**: Event delegation for better performance

## Accessibility Features

### Keyboard Navigation

- **Tab**: Navigate to button
- **Enter/Space**: Activate button
- **Escape**: Cancel (if applicable)

### Screen Reader Support

- **Semantic HTML**: Proper button/anchor elements
- **ARIA Labels**: Automatic ARIA attribute generation
- **Focus Management**: Clear focus indicators
- **Status Announcements**: Loading state announcements

### High Contrast Mode

Components automatically adapt to high contrast mode preferences:

```css
@media (prefers-contrast: high) {
  /* Enhanced contrast styles applied automatically */
}
```

### Reduced Motion

Respects user's motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  /* Reduced motion styles applied automatically */
}
```
