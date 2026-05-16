/**
 * KEYBOARD SHORTCUTS - TESTING CHECKLIST
 * 
 * Complete testing checklist for keyboard shortcuts system
 * Use this to verify all shortcuts work correctly across the app
 */

# Keyboard Shortcuts Testing Checklist

## ✅ Pre-Flight Checks

- [ ] App runs without errors
- [ ] No console warnings about shortcuts
- [ ] Settings page loads without errors
- [ ] Help modal (Ctrl+/) opens successfully

## 🌐 Global Shortcuts Testing

### Navigation Shortcuts

| Shortcut | Expected Behavior | Status |
|----------|------------------|--------|
| `Ctrl+K` | Opens command palette | ☐ Pass ☐ Fail |
| `Ctrl+D` | Navigates to Dashboard | ☐ Pass ☐ Fail |
| `Ctrl+P` | Navigates to POS | ☐ Pass ☐ Fail |
| `Ctrl+I` | Navigates to Products | ☐ Pass ☐ Fail |
| `Ctrl+S` | Navigates to Sales | ☐ Pass ☐ Fail |
| `Ctrl+B` | Navigates to Purchase | ☐ Pass ☐ Fail |
| `Ctrl+R` | Navigates to Reports | ☐ Pass ☐ Fail |
| `Ctrl+E` | Navigates to Expenses | ☐ Pass ☐ Fail |
| `Ctrl+,` | Navigates to Settings | ☐ Pass ☐ Fail |

### Utility Shortcuts

| Shortcut | Expected Behavior | Status |
|----------|------------------|--------|
| `Ctrl+/` | Opens shortcuts help modal | ☐ Pass ☐ Fail |
| `Esc` | Closes active modal | ☐ Pass ☐ Fail |
| `Ctrl+Shift+T` | Toggles theme (light/dark) | ☐ Pass ☐ Fail |
| `Ctrl+Shift+B` | Toggles sidebar | ☐ Pass ☐ Fail |

## 💳 POS Billing Shortcuts Testing

### F-Key Shortcuts

| Shortcut | Expected Behavior | Status |
|----------|------------------|--------|
| `F1` | Focus product search field | ☐ Pass ☐ Fail |
| `F2` | Focus customer search field | ☐ Pass ☐ Fail |
| `F3` | Hold current sale | ☐ Pass ☐ Fail |
| `F4` | Open payment section | ☐ Pass ☐ Fail |
| `F5` | Complete sale | ☐ Pass ☐ Fail |
| `F6` | Toggle cart drawer | ☐ Pass ☐ Fail |
| `F7` | Open discount dialog | ☐ Pass ☐ Fail |
| `F8` | Select cash payment | ☐ Pass ☐ Fail |
| `F9` | Select card payment | ☐ Pass ☐ Fail |
| `F10` | Select UPI payment | ☐ Pass ☐ Fail |
| `F11` | Print receipt | ☐ Pass ☐ Fail |
| `F12` | Start new sale | ☐ Pass ☐ Fail |

### Alternative Shortcuts

| Shortcut | Expected Behavior | Status |
|----------|------------------|--------|
| `Ctrl+Enter` | Complete sale (alternative) | ☐ Pass ☐ Fail |
| `Ctrl+P` | Print invoice | ☐ Pass ☐ Fail |
| `Ctrl+H` | Hold sale (alternative) | ☐ Pass ☐ Fail |
| `Ctrl+R` | Resume held sale | ☐ Pass ☐ Fail |
| `Ctrl+Delete` | Clear entire cart | ☐ Pass ☐ Fail |
| `Alt+C` | Cash payment | ☐ Pass ☐ Fail |
| `Alt+U` | UPI payment | ☐ Pass ☐ Fail |
| `Alt+B` | Bank/Card payment | ☐ Pass ☐ Fail |
| `Alt+W` | Wallet payment | ☐ Pass ☐ Fail |
| `Alt+S` | Split payment | ☐ Pass ☐ Fail |

## 📊 Sales Module Shortcuts

| Shortcut | Expected Behavior | Status |
|----------|------------------|--------|
| `F1` | Focus product search | ☐ Pass ☐ Fail |
| `F2` | Select customer | ☐ Pass ☐ Fail |
| `F3` | Add new item row | ☐ Pass ☐ Fail |
| `F4` | Open payment section | ☐ Pass ☐ Fail |
| `F5` | Save invoice | ☐ Pass ☐ Fail |
| `Ctrl+Enter` | Generate invoice | ☐ Pass ☐ Fail |
| `Ctrl+P` | Print invoice | ☐ Pass ☐ Fail |
| `Ctrl+N` | New invoice | ☐ Pass ☐ Fail |
| `Ctrl+H` | Hold invoice | ☐ Pass ☐ Fail |

## 📦 Purchase Module Shortcuts

| Shortcut | Expected Behavior | Status |
|----------|------------------|--------|
| `F1` | Focus product search | ☐ Pass ☐ Fail |
| `F2` | Select supplier | ☐ Pass ☐ Fail |
| `F3` | Add product row | ☐ Pass ☐ Fail |
| `F4` | Add charges | ☐ Pass ☐ Fail |
| `F5` | Submit purchase | ☐ Pass ☐ Fail |
| `Ctrl+Enter` | Save purchase | ☐ Pass ☐ Fail |
| `Ctrl+P` | Print bill | ☐ Pass ☐ Fail |
| `Ctrl+N` | New purchase | ☐ Pass ☐ Fail |
| `Delete` | Remove item | ☐ Pass ☐ Fail |

## 📦 Products Module Shortcuts

| Shortcut | Expected Behavior | Status |
|----------|------------------|--------|
| `Ctrl+N` | Add new product | ☐ Pass ☐ Fail |
| `Ctrl+F` | Focus search | ☐ Pass ☐ Fail |
| `Ctrl+E` | Edit selected | ☐ Pass ☐ Fail |
| `Delete` | Delete selected | ☐ Pass ☐ Fail |
| `Ctrl+U` | Upload image | ☐ Pass ☐ Fail |
| `Ctrl+B` | Generate barcode | ☐ Pass ☐ Fail |
| `↑` Arrow Up | Previous row | ☐ Pass ☐ Fail |
| `↓` Arrow Down | Next row | ☐ Pass ☐ Fail |
| `Enter` | Open details | ☐ Pass ☐ Fail |

## 👥 Parties Module Shortcuts

| Shortcut | Expected Behavior | Status |
|----------|------------------|--------|
| `Ctrl+N` | Add new party | ☐ Pass ☐ Fail |
| `Ctrl+F` | Focus search | ☐ Pass ☐ Fail |
| `Ctrl+E` | Edit selected | ☐ Pass ☐ Fail |
| `Enter` | Open details | ☐ Pass ☐ Fail |
| `Ctrl+L` | Open ledger | ☐ Pass ☐ Fail |
| `Ctrl+P` | Record payment | ☐ Pass ☐ Fail |

## 📈 Reports Module Shortcuts

| Shortcut | Expected Behavior | Status |
|----------|------------------|--------|
| `Ctrl+F` | Focus search | ☐ Pass ☐ Fail |
| `Ctrl+E` | Export report | ☐ Pass ☐ Fail |
| `Ctrl+P` | Print report | ☐ Pass ☐ Fail |
| `Alt+1` | Inventory report | ☐ Pass ☐ Fail |
| `Alt+2` | Sales report | ☐ Pass ☐ Fail |
| `Alt+3` | Purchase report | ☐ Pass ☐ Fail |

## 📝 Form Shortcuts

| Shortcut | Expected Behavior | Status |
|----------|------------------|--------|
| `Ctrl+S` | Save form | ☐ Pass ☐ Fail |
| `Ctrl+Enter` | Submit form | ☐ Pass ☐ Fail |
| `Escape` | Cancel/close form | ☐ Pass ☐ Fail |
| `Ctrl+Backspace` | Reset form | ☐ Pass ☐ Fail |

## 📋 Table Navigation

| Shortcut | Expected Behavior | Status |
|----------|------------------|--------|
| `↑` Arrow Up | Select previous row | ☐ Pass ☐ Fail |
| `↓` Arrow Down | Select next row | ☐ Pass ☐ Fail |
| `Enter` | Open selected row | ☐ Pass ☐ Fail |
| `Ctrl+E` | Edit selected row | ☐ Pass ☐ Fail |
| `Delete` | Delete selected row | ☐ Pass ☐ Fail |

## 🔍 Barcode Scanner Testing

### Basic Barcode Scanning

- [ ] Scanner connects without errors
- [ ] Barcode scans are recognized (4+ characters)
- [ ] Product is found and added to cart
- [ ] Toast notification shows success
- [ ] Barcode mode can be toggled in settings

### Error Handling

- [ ] Barcode too short shows error
- [ ] Product not found shows error
- [ ] Scanner timeout works correctly
- [ ] Multiple rapid scans work

## 🚫 Conflict Prevention Testing

### Input Fields (Shortcuts Should NOT Trigger)

- [ ] Typing in search input doesn't trigger shortcuts
- [ ] Typing in text field doesn't trigger navigation
- [ ] Typing in form doesn't trigger form shortcuts
- [ ] Copy/paste shortcuts (Ctrl+C, Ctrl+V) still work

### Input Fields (Shortcuts SHOULD Allow)

- [ ] Form shortcuts work even with form focused (Ctrl+S, Ctrl+Enter)
- [ ] Barcode scanner input works in barcode field
- [ ] F-keys trigger even when in inputs on POS

## 💾 Persistence Testing

- [ ] Disable shortcuts → Reload → Still disabled
- [ ] Enable shortcuts → Reload → Still enabled
- [ ] Toggle barcode mode → Reload → Preference saved
- [ ] Preference persists across sessions

## 🧩 UI Component Testing

### ShortcutBadge Component

- [ ] Badge displays correctly (default variant)
- [ ] Badge displays correctly (outline variant)
- [ ] Badge displays correctly (subtle variant)
- [ ] Tooltip shows on hover
- [ ] Works with different key combinations

### ShortcutButton Component

- [ ] Button displays with badge
- [ ] Badge position is correct
- [ ] Shortcut works when button clicked
- [ ] Works with all button variants

### ShortcutHelpModal

- [ ] Opens with Ctrl+/
- [ ] Modal displays all categories
- [ ] Search filtering works
- [ ] Tab switching works
- [ ] Scrolling works in modal
- [ ] Close button works (Esc key)

### DataTableKeyboardNavigation

- [ ] Arrow keys navigate rows
- [ ] Selected row is highlighted
- [ ] Enter opens row
- [ ] Delete removes row
- [ ] Ctrl+E edits row

### FormKeyboardShortcuts

- [ ] Ctrl+S saves form
- [ ] Ctrl+Enter submits form
- [ ] Escape cancels form
- [ ] Ctrl+Backspace resets form

## ⚙️ Settings Page Testing

- [ ] Keyboard Shortcuts section displays
- [ ] Shows total shortcut count
- [ ] Shows count by module
- [ ] Toggle enables/disables shortcuts
- [ ] Toggle enables/disables barcode mode
- [ ] "View All Shortcuts" button works
- [ ] Settings persist on reload

## 📱 Cross-Platform Testing

### Windows

- [ ] Ctrl shortcuts work
- [ ] Alt shortcuts work
- [ ] Shift combinations work
- [ ] F-keys work

### Mac

- [ ] Cmd shortcuts work (Ctrl should map to Cmd)
- [ ] Option (Alt) shortcuts work
- [ ] Shift combinations work
- [ ] F-keys work

### Linux

- [ ] Ctrl shortcuts work
- [ ] Alt shortcuts work
- [ ] Shift combinations work
- [ ] F-keys work

## 🎯 Edge Cases

- [ ] Multiple shortcuts don't conflict
- [ ] No accidental double triggers
- [ ] Works with external keyboards
- [ ] Works with software keyboards (on-screen)
- [ ] Focus management is correct
- [ ] Modal stacking works
- [ ] Nested forms work
- [ ] Multiple tables work independently

## 🐛 Common Issues to Check

### Issue: Shortcuts not working

- [ ] Check if shortcuts are enabled in settings
- [ ] Check browser console for errors
- [ ] Check if correct scope is active
- [ ] Check if focused element is an input field

### Issue: Barcode scanner not working

- [ ] Check if barcode mode is enabled
- [ ] Check if barcode is long enough (min 4 chars)
- [ ] Check if product exists in database
- [ ] Check scan timeout isn't too short

### Issue: Conflicts with browser shortcuts

- [ ] Ctrl+S might trigger browser save - should be prevented
- [ ] Ctrl+P might trigger browser print (but we want this)
- [ ] Ctrl+Shift+T might conflict with browser
- [ ] F11 might trigger fullscreen

## 📊 Performance Testing

- [ ] No lag when pressing shortcuts
- [ ] No memory leaks with event listeners
- [ ] Smooth transitions with animations
- [ ] Modal opens/closes quickly
- [ ] No slowdown with many shortcuts

## ✨ Final Verification

- [ ] All modules have shortcuts
- [ ] All shortcuts have help text
- [ ] All shortcuts have badges on buttons
- [ ] Help modal is comprehensive
- [ ] Documentation is complete
- [ ] Example component works
- [ ] Settings integration complete
- [ ] No console errors or warnings

## 🎉 Sign-Off

- [ ] Tested on Windows
- [ ] Tested on Mac
- [ ] Tested on Linux
- [ ] All tests passing
- [ ] Ready for production

---

**Testing Date:** _______________

**Tested By:** _______________

**Notes:**
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

**Status:** ☐ PASS ☐ FAIL ☐ NEEDS FIXES
