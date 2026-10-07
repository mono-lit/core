# CSS/Lit Switch Mode for Card Component Demo

## Context
Added CSS/Lit switch mode functionality to the card component demo to match the established patterns in the codebase (button and badge components). This provides users with the ability to toggle between Lit component and CSS-only implementations of the card component.

## Changes Made

### Files Created
**CSS Demo Files:**
- `demo/pages/card/css/basic.html` - Basic card examples (2 cards)
- `demo/pages/card/css/variants.html` - Card variant examples (4 cards: elevated, outlined, flat, tonal)
- `demo/pages/card/css/colors.html` - Card color examples (5 cards: primary, success, danger, warning, info)
- `demo/pages/card/css/states.html` - Card state examples (4 cards: bordered, hoverable, clickable, disabled)
- `demo/pages/card/css/actions.html` - Card action examples (2 cards with CSS button components)

**Lit Demo Files:**
- `demo/pages/card/lit/basic.html` - Basic card examples (2 cards)
- `demo/pages/card/lit/variants.html` - Card variant examples (4 cards: elevated, outlined, flat, tonal)
- `demo/pages/card/lit/colors.html` - Card color examples (5 cards: primary, success, danger, warning, info)
- `demo/pages/card/lit/states.html` - Card state examples (4 cards: bordered, hoverable, clickable, disabled)
- `demo/pages/card/lit/actions.html` - Card action examples (2 cards with Lit button components)

### Files Modified
- `demo/pages/card/index.html` - Complete restructure to support CSS/Lit switch mode

### Implementation Details

#### Header Updates
- Added mode indicator showing current implementation mode (default: "Lit")
- Added switch method toggle button following button/badge pattern
- Updated description to indicate two implementations available

#### Demo Section Updates
All 5 sections (Basic Cards, Variants, Colors, States, Cards with Actions) now include:
- Individual Code toggle switches for Lit and CSS versions
- Dual demo areas (`.lit-only` and `.css-only`) for visibility toggling
- Code editor panels for viewing source code
- Content loaded via `<load>` tags from separate Lit and CSS files

#### CSS Card Structure Pattern
CSS cards use class-based styling instead of custom elements:
```html
<div class="mono-card [variant] [color] [state]">
    <div class="mono-card-header">
        <div class="mono-card-header-content">
            <h3 class="card-title">Title</h3>
            <p class="card-subtitle">Subtitle</p>
        </div>
    </div>
    <div class="mono-card-body">
        <p>Card content...</p>
    </div>
    <div class="mono-card-actions">
        <!-- Action buttons using CSS button pattern -->
    </div>
</div>
```

#### Script Updates
- Added `import '../../../dist/switch.js'` for switch component functionality
- Changed `useButtonThemeModule` from `false` to `true`
- Added CSS card event handlers using standard click events
- Kept Lit card event handlers using custom `card-click` events

## Pattern Consistency
This implementation follows the exact patterns established in:
- `demo/pages/button/index.html` - Primary pattern reference
- `demo/pages/badge/index.html` - Additional pattern reference

## Key Features
- Seamless switching between Lit and CSS implementations
- Both implementations maintain identical visual appearance
- Code preview loads correct source files based on current mode
- Interactive cards work in both modes with proper event handling
- Theme switching works for both implementations
- Mode indicator updates in real-time

## Testing Verification
Users should verify:
1. Default mode shows "Lit" components with correct styling
2. Switch method button toggles to "CSS" mode smoothly
3. CSS cards display identically to Lit cards
4. All card features work in both modes (variants, colors, states, actions)
5. Code toggle switches work for each section in both modes
6. Interactive cards trigger status messages in both modes
7. Theme switching works for both implementations
8. Mode indicator updates correctly
9. No console errors during mode switching

## Dependencies Utilized
- `/demo/public/switch-mode.js` - Mode switching logic (already exists)
- `/demo/public/switch-method.html` - Switch button markup (already exists)
- `/demo/public/prism-editor.js` - Code display functionality (already exists)
- `/demo/public/demo-shared.js` - Common demo utilities (already exists)
- `/dist/index.css` - Main stylesheet with card CSS classes (already exists)
- `/dist/card.js` - Lit card component (already exists)
- `/dist/button.js` - Lit button component (already exists)
- `/dist/switch.js` - Lit switch component (already exists)

## CSS Classes Used
- `.lit-only` / `.css-only` - Visibility toggling
- `.mono-card` and related classes - Card styling (defined in card.css)
- `.demo-area` - Demo content container
- `.demo-section` - Section wrapper
- `.demo-change-code` - Code toggle switch selector

## Completion Status
✅ All CSS demo files created with proper structure
✅ All Lit demo files created with proper structure
✅ Main index.html restructured for dual Lit/CSS mode
✅ Demo content now loaded via `<load>` tags for both implementations
✅ Switch mode functionality integrated
✅ Event handlers updated for both implementations
✅ Follows established patterns from button/badge demos
✅ Ready for testing and deployment