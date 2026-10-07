# Mono Button Component

A comprehensive, accessible button component built with Lit Element and styled with UnoCSS. The button component supports multiple variants, sizes, colors, and interactive states, making it suitable for any UI design.

## Installation

### Install the package

```bash
npm install @mono-helper/mono-button
```

### Import the component

```html
<script type="module">
  import '@mono-helper/mono-button';
</script>
```

Or import specific components:

```html
<script type="module">
  import { MonoButton, MonoButtonIcon, MonoButtonFab } from '@mono-helper/mono-button';
</script>
```

## Basic Usage

### Standard Button

```html
<mono-button>Click me</mono-button>
<mono-button color="success">Success</mono-button>
<mono-button color="danger">Danger</mono-button>
```

### Button with Icon

```html
<mono-button color="primary">
  <svg slot="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
    <path d="M12 5v14M5 12h14"/>
  </svg>
  Add Item
</mono-button>
```

### Loading State

```html
<mono-button loading>Loading...</mono-button>
```

The spinner is drawn **in the icon place**, so it follows `iconPosition` and the caption stays
readable. A button with no icon grows a leading spinner in the slot an icon would have used; an
`iconOnly` button simply swaps its icon for the ring. The box is sized ahead of time, so the button
never changes width or height entering or leaving loading.

```html
<!-- ring on the left, where the save icon sits -->
<mono-button loading>
  <span slot="icon" class="i-mdi-content-save"></span>
  Saving...
</mono-button>

<!-- ring on the right, where the arrow sits -->
<mono-button loading icon-position="right">
  <span slot="icon" class="i-mdi-arrow-right"></span>
  Saving...
</mono-button>
```

Self-driven loading (`handler`, `debounce`, `throttle`) renders exactly the same way — one look,
however loading was switched on.

### Disabled Button

```html
<mono-button disabled>Disabled</mono-button>
```

## Props

### Size

Control the button size with the `size` prop:

- `xs` - Extra small button
- `sm` - Small button
- `md` - Medium button (default)
- `lg` - Large button
- `xl` - Extra large button

```html
<mono-button size="xs">Extra Small</mono-button>
<mono-button size="sm">Small</mono-button>
<mono-button size="md">Medium</mono-button>
<mono-button size="lg">Large</mono-button>
<mono-button size="xl">Extra Large</mono-button>
```

### Color

Choose from various color options:

- `primary` - Primary theme color (default)
- `secondary` - Secondary color
- `success` - Success/green
- `danger` - Danger/red
- `warning` - Warning/yellow
- `info` - Info/blue
- `teal` - Teal
- `purple` - Purple
- `dark` - Dark
- `light` - Light

```html
<mono-button color="primary">Primary</mono-button>
<mono-button color="success">Success</mono-button>
<mono-button color="danger">Danger</mono-button>
<mono-button color="warning">Warning</mono-button>
```

### Variant

Different button styles:

- `solid` - Solid background (default)
- `outline` - Outlined button
- `tonal` - Tonal button

```html
<mono-button variant="solid">Solid</mono-button>
<mono-button variant="outline">Outline</mono-button>
<mono-button variant="tonal">Tonal</mono-button>
```

### Shape

Button shape variations:

- `square` - Rounded corners (default)
- `pill` - Fully rounded/pill shape
- `circle` - Circular (for icon buttons)

```html
<mono-button shape="square">Square</mono-button>
<mono-button shape="pill">Pill</mono-button>
<mono-button shape="pill" color="primary">Pill Button</mono-button>
```

### Other Props

- `disabled` - Disable the button
- `loading` - Show loading state; the spinner replaces the icon, in the icon position
- `fullWidth` - Make button full width
- `href` - Render as link with this href
- `target` - Link target (when href is set)
- `type` - Button type: 'button' | 'submit' | 'reset'
- `iconPosition` - Icon position: 'left' | 'right'
- `badge` - Badge text
- `badgeColor` - Badge color: 'red' | 'green' | 'orange' | 'cobalt'

## Examples

### Outline Buttons

```html
<mono-button variant="outline" color="primary">Primary</mono-button>
<mono-button variant="outline" color="success">Success</mono-button>
<mono-button variant="outline" color="danger">Danger</mono-button>
```

### Tonal Buttons

```html
<mono-button variant="tonal" color="primary">Primary</mono-button>
<mono-button variant="tonal" color="success">Success</mono-button>
<mono-button variant="tonal" color="danger">Danger</mono-button>
```

### Buttons with Badges

```html
<mono-button badge="3" badge-color="red">
  Notifications
</mono-button>
<mono-button badge="99+" badge-color="green" color="success">
  Messages
</mono-button>
```

### Link Buttons

```html
<mono-button href="https://example.com" target="_blank">
  External Link
</mono-button>

<mono-button href="/about" color="primary">
  About Page
</mono-button>
```

### Full Width Button

```html
<mono-button fullWidth>Full Width Button</mono-button>
```

### Icon Position

```html
<!-- Icon on left (default) -->
<mono-button icon-position="left" color="primary">
  <svg slot="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
    <path d="M12 5v14M5 12h14"/>
  </svg>
  Add Item
</mono-button>

<!-- Icon on right -->
<mono-button icon-position="right" color="success">
  Continue
  <svg slot="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
</mono-button>
```

## Icon Button Component

Use `mono-button-icon` for icon-only buttons:

```html
<mono-button-icon size="md" color="primary" round>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
    <path d="M12 5v14M5 12h14"/>
  </svg>
</mono-button-icon>

<mono-button-icon size="lg" color="danger" tooltip="Delete">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
  </svg>
</mono-button-icon>

<mono-button-icon size="md" color="success" glass>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
    <path d="M5 13l4 4L19 7"/>
  </svg>
</mono-button-icon>
```

## FAB Component

Use `mono-button-fab` for floating action buttons:

```html
<!-- FAB with text -->
<mono-button-fab>
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
    <path d="M12 5v14M5 12h14"/>
  </svg>
  Add New
</mono-button-fab>

<!-- Circular FAB -->
<mono-button-fab circle>
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
    <path d="M12 5v14M5 12h14"/>
  </svg>
</mono-button-fab>

<!-- Small FAB -->
<mono-button-fab sm circle>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
    <path d="M12 5v14M5 12h14"/>
  </svg>
</mono-button-fab>
```

## Events

### button-click

Fired when the button is clicked:

```javascript
const button = document.querySelector('mono-button');
button.addEventListener('button-click', (event) => {
  console.log('Button clicked', event.detail.originalEvent);
});
```

## Methods

### focus()

Focus the button programmatically:

```javascript
const button = document.querySelector('mono-button');
button.focus();
```

### blur()

Remove focus from the button:

```javascript
const button = document.querySelector('mono-button');
button.blur();
```

### click()

Programmatically click the button:

```javascript
const button = document.querySelector('mono-button');
button.click();
```

## Theming

The button component supports 6 color themes:

### Available Themes

1. **Opsi A – Navy & Sky Blue** (default)
2. **Opsi B – Navy Teal**
3. **Opsi C – Royal Blue + Gold**
4. **Opsi D – Biru Cerah**
5. **Material Blue** (MUI palette)
6. **ONE** (EJI ONE design system, brand core `#1f2664`)

### Switching Themes

```javascript
import { applyTheme } from '@mono-helper/mono-button';

// Apply a specific theme
applyTheme('navy-teal'); // Navy Teal
applyTheme('blue-gold'); // Royal Blue + Gold
applyTheme('light-blue'); // Biru Cerah
applyTheme('material'); // Material Blue
applyTheme('one'); // EJI ONE

// Get current theme
import { getCurrentTheme } from '@mono-helper/mono-button';
const currentTheme = getCurrentTheme();
console.log(currentTheme); // 'navy-sky', 'navy-teal', etc.

// Reset to default theme
import { resetTheme } from '@mono-helper/mono-button';
resetTheme();
```

### Theme Event

Listen for theme changes:

```javascript
window.addEventListener('theme-changed', (event) => {
  console.log('Theme changed to:', event.detail.theme);
  console.log('Theme data:', event.detail.themeData);
});
```

## Accessibility

The button component is designed with accessibility in mind:

- **Keyboard Navigation**: Fully keyboard accessible with Tab, Enter, and Space keys
- **ARIA Attributes**: Proper ARIA attributes automatically applied
- **Focus States**: Visible focus indicators for keyboard navigation
- **Screen Reader Support**: Semantic HTML with proper labels
- **High Contrast Support**: Optimized for high contrast mode
- **Reduced Motion**: Respects prefers-reduced-motion preference

### ARIA Attributes

The component automatically handles ARIA attributes:

- `role="button"` - Applied to all button variants
- `aria-disabled` - Set when button is disabled or loading
- `aria-busy` - Set when button is in loading state
- `aria-label` - Uses tooltip text or badge text when available

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Mobile)

## Vue Integration

The button component works seamlessly with Vue:

```vue
<template>
  <div>
    <mono-button
      :size="buttonSize"
      :color="buttonColor"
      :loading="isLoading"
      @button-click="handleClick"
    >
      <svg slot="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M12 5v14M5 12h14"/>
      </svg>
      {{ buttonText }}
    </mono-button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const buttonSize = ref('md');
const buttonColor = ref('primary');
const isLoading = ref(false);
const buttonText = ref('Click me');

const handleClick = (event) => {
  console.log('Button clicked', event.detail.originalEvent);
  isLoading.value = true;
  setTimeout(() => {
    isLoading.value = false;
  }, 2000);
};
</script>
```

## Best Practices

1. **Use appropriate colors**: Match button colors to actions (primary for main actions, danger for destructive actions)
2. **Provide clear labels**: Ensure button text is descriptive and action-oriented
3. **Consider loading states**: Use loading state for async operations
4. **Maintain consistency**: Use consistent button styles across your application
5. **Test accessibility**: Verify keyboard navigation and screen reader compatibility
6. **Use badges sparingly**: Only use badges when they provide meaningful information
7. **Consider mobile**: Ensure buttons are large enough for touch targets (minimum 44px)

## Performance

The button component is optimized for performance:

- **Tree-shaking**: Import only what you need
- **Minimal bundle size**: Core component < 10KB (minified + gzipped)
- **Efficient rendering**: Lit Element's efficient reactivity system
- **CSS optimization**: UnoCSS generates only used utilities

## License

MIT

## Support

For issues, questions, or contributions, please visit the project repository.
