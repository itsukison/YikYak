# YikYak Redesign Style Guide

## 1. Design Analysis & Issues
The current YikYak design has been identified as "tacky" due to:
- **Generic Color Palette**: The standard blue (`#4998e9`) feels dated and lacks the premium "pop" of modern fintech apps.
- **Flat Depth**: The current gray scale (`hsl(0, 0%, 95%)`) is functional but lacks the sophisticated, high-contrast look of the Wise example.
- **Typography**: While `Instrument Sans` is a good font, the current usage might not match the crisp, geometric feel of `Inter` used in Wise.

## 2. New Design Direction ("Wise" Vibe)
The new design will focus on a **Clean, High-End** aesthetic with **Neon Accents**.

### Color Palette

#### Accents (Neon)
- **Primary Neon**: `#9FE870` (Wise Green) - Used for primary actions, success states, and key highlights.
- **Secondary Neon**: `#8AD460` (Darker Green) - Used for pressed states or gradients.

#### Neutrals (Light Mode)
- **Background**: `#FFFFFF` (Pure White)
- **Surface**: `#F2F2F2` (Light Gray) - For cards and inputs.
- **Text Primary**: `#1C1C1E` (Almost Black)
- **Text Secondary**: `#767676` (Medium Gray)

#### Neutrals (Dark Mode)
- **Background**: `#000000` (Pure Black) - High contrast.
- **Surface**: `#1C1C1E` (Dark Gray) - For cards and inputs.
- **Text Primary**: `#FFFFFF` (Pure White)
- **Text Secondary**: `#A1A1AA` (Light Gray)

### Typography
- **Font Family**: `Inter` (Switching from Instrument Sans to match Wise).
- **Weights**:
    - **Regular (400)**: Body text.
    - **Medium (500)**: Interactive elements.
    - **SemiBold (600)**: Section headers.
    - **Bold (700/800)**: Hero text and amounts.

### Spacing & Radius
- **Radius**:
    - **Cards**: `16px` or `24px` (Softer, more organic shapes).
    - **Buttons**: `9999px` (Full pill shape).
- **Spacing**: Generous whitespace to create a "clean" feel.

## 3. Component Updates
- **Buttons**: Full-width, pill-shaped, neon green background with black text (high contrast).
- **Cards**: Flat surfaces with subtle borders or deep shadows in light mode; distinct gray surfaces in dark mode.
- **Inputs**: Minimalist, large text, clear focus states.

### Visual Hierarchy & Accent Usage
- **Philosophy**: "Less is More". Use the Neon Green accent **sparingly**.
- **Do Not Use Accents For**:
    - Usernames or secondary metadata (use `Text Secondary` or `Text Primary`).
    - Backgrounds of secondary cards.
    - Borders of non-active elements.
- **Reserved For**:
    - Primary Call-to-Actions (FAB, "Post" button).
    - Active states (Selected tab, Active toggle).
    - Critical notifications or success states.
- **Goal**: When the user looks at the screen, their eye should be drawn *only* to the most important action or information. Everything else should be monochrome/neutral.
