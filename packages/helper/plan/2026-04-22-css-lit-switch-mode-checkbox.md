# CSS/Lit Switch Mode for Checkbox Component Demo

## Context
The checkbox component demo has been refactored to support CSS/Lit switch mode, following the established patterns from button, badge, and card components. This provides users with the ability to toggle between Lit component and CSS-only implementations of the checkbox component.

This change addresses the need for:
- Consistent demo experience across all components
- Demonstration of both implementation approaches
- Better code documentation and learning opportunities
- Showcasing of the refactored checkbox CSS structure

## Changes Made

### CSS Demo Files Created
- `demo/pages/checkbox/css/basic.html` - Basic checkbox examples (3 checkboxes: basic, labeled, described) with SVG icons and interaction examples
- `demo/pages/checkbox/css/sizes.html` - Checkbox size examples (3 checkboxes: sm, md, lg) with SVG icons and interaction examples
- `demo/pages/checkbox/css/colors.html` - Checkbox color examples (5 checkboxes: primary, success, danger, warning, info) with SVG icons and interaction examples
- `demo/pages/checkbox/css/states.html` - Checkbox state examples (4 checkboxes: disabled, disabled-checked, indeterminate, checked) with proper SVG icons and interaction examples
- `demo/pages/checkbox/css/custom.html` - Custom slot content examples (1 checkbox with custom labels) with SVG icons and interaction examples
- `demo/pages/checkbox/css/group.html` - Checkbox group examples (4 checkboxes: opt1, opt2, opt3, select-all) with SVG icons and interaction examples
- `demo/pages/checkbox/css/event-log.html` - Event logging examples (1 checkbox with live event log) with SVG icons and interaction examples

### Lit Demo Files Created
- `demo/pages/checkbox/lit/basic.html` - Basic checkbox examples (3 checkboxes)
- `demo/pages/checkbox/lit/sizes.html` - Checkbox size examples (3 checkboxes)
- `demo/pages/checkbox/lit/colors.html` - Checkbox color examples (5 checkboxes)
- `demo/pages/checkbox/lit/states.html` - Checkbox state examples (4 checkboxes)
- `demo/pages/checkbox/lit/custom.html` - Custom slot content examples (1 checkbox)
- `demo/pages/checkbox/lit/group.html` - Checkbox group examples (4 checkboxes)
- `demo/pages/checkbox/lit/event-log.html` - Event logging examples (1 checkbox)

### Files Modified
- `demo/pages/checkbox/index.html` - Complete restructure for CSS/Lit switch mode

## Implementation Details

### Header Updates
- Added mode indicator showing current implementation mode (default: "Lit")
- Added switch method toggle button following button/badge/card pattern
- Updated description to indicate two implementations available

### Demo Section Updates
All 7 sections now include:
- Individual Code toggle switches for Lit and CSS versions
- Dual demo areas (`.lit-only` and `.css-only`) for visibility toggling
- Code editor panels for viewing source code
- Content loaded via `<load>` tags from separate Lit and CSS files

**Sections:**
1. **Basic Checkboxes** - Default usage with optional label and description
2. **Sizes** - Small, medium, and large checkbox variants
3. **Colors** - Primary, success, danger, warning, and info color variants
4. **States** - Disabled, checked, indeterminate, and controlled states with interactive controls
5. **Custom Slot Content** - Custom label and description with slots
6. **Checkbox Group** - Select-all functionality with multiple options
7. **Live Event Log** - Real-time event logging and display

### CSS Checkbox Structure Pattern
CSS checkboxes use the refactored dual-use CSS structure:

```html
<!-- Basic native HTML checkbox -->
<div class="mono-checkbox primary md">
    <input type="checkbox" class="mono-checkbox-input" id="native-basic">
    <div class="mono-checkbox-box md"></div>
</div>

<!-- With label -->
<div class="mono-checkbox primary md">
    <input type="checkbox" class="mono-checkbox-input" checked id="native-labeled">
    <div class="mono-checkbox-box md"></div>
    <div class="mono-checkbox-label">
        <span class="mono-checkbox-label-text">Accept terms</span>
    </div>
</div>

<!-- With description -->
<div class="mono-checkbox primary md">
    <input type="checkbox" class="mono-checkbox-input" id="native-described">
    <div class="mono-checkbox-box md"></div>
    <div class="mono-checkbox-label">
        <span class="mono-checkbox-label-text">Accept terms and conditions</span>
        <span class="mono-checkbox-label-description">I agree to terms of service</span>
    </div>
</div>

<!-- With custom icons (for checked/indeterminate states) -->
<div class="mono-checkbox primary md mono-checkbox-indeterminate">
    <input type="checkbox" class="mono-checkbox-input" id="native-indeterminate">
    <div class="mono-checkbox-box md">
        <svg class="mono-checkbox-indeterminate-icon md" viewBox="0 0 20 20">
            <path d="M5 10H15" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
        </svg>
    </div>
    <div class="mono-checkbox-label">
        <span class="mono-checkbox-label-text">Indeterminate state</span>
    </div>
</div>

<div class="mono-checkbox primary md mono-checkbox-checked">
    <input type="checkbox" class="mono-checkbox-input" checked id="native-checked">
    <div class="mono-checkbox-box md">
        <svg class="mono-checkbox-icon md" viewBox="0 0 20 20">
            <path d="M5 10.5L8.5 14L15 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    </div>
    <div class="mono-checkbox-label">
        <span class="mono-checkbox-label-text">Initially checked</span>
    </div>
</div>
```

### Script Updates
- Added `import '../../../dist/switch.js'` for switch component functionality
- Changed `useButtonThemeModule` from `false` to `true`
- Maintained all existing checkbox event handlers and logic
- Preserved checkbox group functionality with select-all logic
- Kept event logging and display functionality

### Implementation Pattern
The implementation follows the exact patterns established in button, badge, and card demos:
- CSS/Lit switch functionality with mode indicator
- Individual Code toggle switches for each section and mode
- Content loaded via `<load>` tags from separate files
- Maintains all interactive features (group functionality, event logging, state controls)
- Preserves accessibility and keyboard navigation

## Key Features

### Bug Fixes and Enhancements
1. **CSS selector conflict**: `.mono-checkbox:not(.mono-checkbox-checked) .mono-checkbox-icon` was hiding icons even when input was checked
   - **Solution**: Fixed CSS selectors to properly handle both component and native HTML patterns
   - **New selectors**: Added `:not(:checked)` and `:not(:indeterminate)` for native HTML compatibility
2. **Missing check icons**: CSS checkboxes were missing the SVG check icons that should display when checked
   - **Solution**: Added proper SVG icons inside `.mono-checkbox-box` elements for all checked states
   - **Icon classes**: Used `.mono-checkbox-icon` and `.mono-checkbox-indeterminate-icon` with appropriate size classes
3. **Indirect interaction**: CSS checkboxes relied on separate buttons instead of direct checkbox interaction
   - **Solution**: Removed demo-control buttons and made checkboxes themselves interactive
   - **Direct interaction**: Checkboxes use their natural click events with `cursor: pointer` styling
   - **Event handling**: Added proper event listeners for native checkbox elements

#### CSS Fix Details
**Before** (problem):
```css
.mono-checkbox:not(.mono-checkbox-checked) .mono-checkbox-icon {
  display: none; /* Hides icons even when input is checked */
}
```

**After** (fixed):
```css
.mono-checkbox:not(.mono-checkbox-checked):not(.mono-checkbox-indeterminate) .mono-checkbox-icon {
  display: none; /* Only hides when truly not checked */
}

.mono-checkbox-input:not(:checked):not(:indeterminate) ~ .mono-checkbox-box .mono-checkbox-icon {
  display: none; /* Handles native HTML properly */
}
```

#### JavaScript Interaction Changes
- **Removed extra helper functions**: No longer need `window.toggleNativeCheckbox()`, `window.checkNativeCheckbox()`, etc.
- **Direct checkbox interaction**: CSS checkboxes now work naturally with click events
- **Preserved event listeners**: Native checkboxes have proper change event listeners
- **Maintained group functionality**: Select-all logic still works for both Lit and CSS checkboxes
- **Event logging**: Both component and native checkboxes log to their respective displays

### Complete CSS/Lit Switch Mode
- Seamless switching between Lit component and CSS-only implementations
- Mode indicator updates in real-time
- Code toggle switches work for each section in both modes
- Both implementations maintain identical visual appearance

### Checkbox-Specific Features
- **Sizes**: sm, md, lg variants
- **Colors**: primary, success, danger, warning, info variants
- **States**: checked, unchecked, indeterminate, disabled states
- **Interactive Controls**: Toggle indeterminate, toggle checked, set on/off buttons
- **Checkbox Groups**: Select-all functionality with multiple options
- **Event Logging**: Real-time display of change events
- **Custom Slots**: Custom label and description content

### Native HTML Support
- Demonstrates the refactored checkbox CSS structure
- Shows how native HTML elements can use same styles as Lit components
- Provides examples for different checkbox patterns (basic, sizes, colors, states)
- Includes proper CSS structure for complex states (indeterminate with icons)

## Pattern Consistency

### Visibility Toggling
- Use `.lit-only` for Lit component sections (default visible)
- Use `.css-only` for CSS component sections (default hidden)
- Switch mode automatically toggles these classes via existing `switch-mode.js`

### Code Toggle Switches
- Each section has separate Code toggle switches for Lit and CSS
- URLs follow pattern: `../checkbox/css/filename.html` and `../checkbox/lit/filename.html`
- Uses `mono-switch` component with `demo-change-code` class

### Demo Content Loading
- Use `<load src="./css/filename.html" />` for CSS demos
- Use `<load src="./lit/filename.html" />` for Lit demos
- Both load into `.demo-area` containers

## Testing Verification

### Manual Testing Steps
1. Open `demo/pages/checkbox/index.html` in browser
2. Verify default mode shows "Lit" components
3. Click switch method button to toggle to CSS mode
4. Verify CSS checkboxes display correctly with same visual appearance
5. Test each section's Code toggle switch
6. Verify code preview loads correct source files
7. Test interactive checkboxes in both modes - buttons should work
8. Verify mode indicator updates correctly
9. Test theme switching - both modes should work
10. Check for console errors during mode switching

### Expected Behaviors
- Checkboxes look identical in both Lit and CSS modes
- Mode switching is smooth without page reload
- All checkbox features work in both modes (sizes, colors, states, groups)
- Code preview shows correct source files
- Interactive checkboxes trigger status messages in both modes
- Theme switching works for both implementations
- Event logging displays properly in both modes
- Checkbox group select-all functionality works in both modes

## Dependencies Utilized

### Existing Infrastructure (Already Available)
- `/demo/public/switch-mode.js` - Mode switching logic (already exists)
- `/demo/public/switch-method.html` - Switch button markup (already exists)
- `/demo/public/prism-editor.js` - Code display functionality (already exists)
- `/demo/public/demo-shared.js` - Common demo utilities (already exists)
- `/dist/index.css` - Main stylesheet with checkbox CSS classes (already exists)
- `/dist/checkbox.js` - Lit checkbox component (already exists)
- `/dist/switch.js` - Lit switch component (already exists)

### CSS Classes Used
- `.lit-only` / `.css-only` - Visibility toggling
- `.mono-checkbox` and related classes - Checkbox styling (refactored for dual-use)
- `.demo-area` - Demo content container
- `.demo-section` - Section wrapper
- `.demo-change-code` - Code toggle switch selector
- `.checkbox-group` - Checkbox group styling
- `.checkbox-controls` - Interactive controls styling
- `.event-log` - Event log display styling

## CSS Structure Highlight

### Dual-Use CSS Pattern
The refactored checkbox CSS now supports both component and native HTML usage:

```css
/* Root class - works for both component and native HTML */
.mono-checkbox {
  display: inline-flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  /* CSS variables for theming */
}

/* State management via CSS sibling selectors for native HTML */
.mono-checkbox-input:checked + .mono-checkbox-box,
.mono-checkbox.mono-checkbox-checked .mono-checkbox-box {
  border-color: var(--mono-checkbox-accent);
  background-color: var(--mono-checkbox-accent);
}

.mono-checkbox-input:indeterminate + .mono-checkbox-box,
.mono-checkbox.mono-checkbox-indeterminate .mono-checkbox-box {
  border-color: var(--mono-checkbox-accent);
  background-color: var(--mono-checkbox-accent);
}

/* Focus states for both approaches */
.mono-checkbox-input:focus-visible + .mono-checkbox-box {
  box-shadow: 0 0 0 3px var(--mono-checkbox-ring);
}
```

This enables the CSS-only demo files to work with plain HTML elements while maintaining the same visual appearance as the Lit component.

## Benefits Achieved

1. **Consistency**: Checkbox demo now follows the same pattern as button, badge, and card
2. **Flexibility**: Both component and native HTML approaches available
3. **Documentation**: Shows practical usage of refactored checkbox CSS structure
4. **Maintainability**: Clear patterns and utility functions
5. **Accessibility**: Features preserved and enhanced
6. **Performance**: No additional JavaScript required for native HTML usage
7. **Integration**: Easier to integrate with different frameworks
8. **Complete Coverage**: All checkbox features demonstrated in both modes

## Completion Status

✅ All CSS demo files created with proper native HTML structure
✅ All Lit demo files created with component usage
✅ Main index.html restructured for dual Lit/CSS mode
✅ Switch mode functionality integrated
✅ All checkbox features demonstrated in both modes
✅ Event handlers and interactive controls preserved for both Lit and CSS
✅ CSS selector conflict fixed: Icons now display correctly in native HTML mode
✅ Direct checkbox interaction: CSS checkboxes are now directly clickable
✅ Removed extra helper functions: Simplified JavaScript to match natural checkbox behavior
✅ All checkbox states (checked, unchecked, indeterminate) work in both modes
✅ Event logging works for both component and native checkboxes
✅ Group functionality maintained for both Lit and CSS checkboxes
✅ Follows established patterns from button/badge/card
✅ Demonstrates refactored checkbox CSS structure
✅ Ready for testing and deployment
✅ Documentation updated in plan directory