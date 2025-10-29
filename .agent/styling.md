🎨 UI Design Description for Claude

Overall Style:
Design a modern, minimalist interface that blends the clarity and layout of Coinbase, the warmth and personality of Clubhouse, and the geometric simplicity of Artifact.
The app should feel clean, editorial, spacious, and professional — not playful or childish. Focus on generous whitespace, confident bold typography, and subtle geometric accents.

🧩 Layout and Structure

Use a grid-based layout with clear spacing and alignment similar to Coinbase's card and section organization.

SPACIOUSNESS IS KEY: Each screen should have generous breathing room with consistent padding:

- Screen edges: 20–24px horizontal padding
- Between sections: 32–48px vertical spacing
- Card internal padding: 20–24px
- Component spacing: 16–24px

Visual hierarchy defined by text weight, size, and spacing rather than heavy borders or shadows.

Use a 4px-based spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px for consistency.

Employ mostly flat elements with minimal shadows (only on interactive cards).

Top navigation is simple and fixed, with a clear title and right-aligned utility icons (48px touch targets).

Bottom navigation should have 4–5 icons with clear labels (like Coinbase), 56px height minimum.

🎨 Modern Color Palette

**Philosophy: Layered Depth**
Instead of harsh black/white contrasts, we use layered gray scales that create subtle depth through background progression:

- **bg-dark** (deepest layer: app background) → **bg** (surfaces/cards) → **bg-light** (elevated/hover states)

This creates a sophisticated, high-end look with natural visual hierarchy.

**Dark Mode Palette**
| Role | HSL Value | Usage |
|------|-----------|-------|
| bg-dark | `hsl(0 0% 0%)` | Deepest background (base layer, app background) |
| bg | `hsl(0 0% 5%)` | Main background for surfaces, cards |
| bg-light | `hsl(0 0% 10%)` | Slightly elevated surface (hover states, panels) |
| text | `hsl(0 0% 95%)` | Primary text color |
| text-muted | `hsl(0 0% 70%)` | Secondary/disabled text color |
| border | `hsl(0 0% 15%)` | Subtle borders (slightly lighter than surface) |
| accent-primary | `#60A5FA` | Main accent (buttons, highlights) |
| accent-secondary | `#A5B4FC` | Subtle highlight (hover, secondary button) |

**Borders:** Use slightly lighter shade than surface (hsl 0 0% 15%) to subtly separate layers without harsh contrast.

**Shadows:** Use light "lift" effects instead of dark shadows. Add subtle inner glow or lighter outline for depth. Avoid pure black shadows.

**Light Mode Palette**
| Role | HSL Value | Usage |
|------|-----------|-------|
| bg-dark | `hsl(0 0% 100%)` | Deepest background (base layer, app background) |
| bg | `hsl(0 0% 95%)` | Main background for surfaces, cards |
| bg-light | `hsl(0 0% 90%)` | Slightly elevated surface (hover states, panels) |
| text | `hsl(0 0% 5%)` | Primary text color |
| text-muted | `hsl(0 0% 30%)` | Secondary/disabled text color |
| border | `hsl(0 0% 85%)` | Subtle borders (slightly darker than surface) |
| accent-primary | `#4998e9` | Main accent (buttons, highlights) |
| accent-secondary | `#ebf5fd` | Subtle highlight (hover, secondary button) |

**Borders:** Use slightly darker tone than surface (hsl 0 0% 85%) to separate components without harsh black outlines.

**Shadows:** Soft, blurred shadows with low opacity (e.g., `0 1px 2px rgba(0,0,0,0.1)` or `0 4px 12px rgba(0,0,0,0.08)`). Combine shadow + border for realistic layering.

**Status Colors**

- Error: Light #F87171 / Dark #EF4444
- Success: #4ADE80 / #10B981
- Warning: #FBBF24 / #F59E0B

🔤 Typography

Primary Font: Instrument Sans

- Clean geometric feel, fits both editorial and tech branding
- Alternative Option: Space Grotesk for stronger geometric identity

Font Sizes & Weights:

- Hero/Display: 32–48px, weight 700–800 (extra bold)
- H1 Headings: 24–32px, weight 700
- H2 Headings: 20–24px, weight 600–700
- Body Large: 18px, weight 400–500
- Body Regular: 16px, weight 400
- Body Small: 14px, weight 400
- Caption: 12px, weight 400–500

Use bold weights (700–800) for headings to create strong visual hierarchy.
Use regular weights (400–500) for body text for readability.
Line height: 1.5 for body text, 1.2–1.3 for headings.

Avoid decorative or rounded fonts to maintain a professional tone.

🧱 Corner Rounding & Shapes

Cards and containers: 12–16px border radius
Buttons: 24–28px border radius (strong rounding for tactile feel)
Pills/Tabs: 20–24px border radius
Input fields: 12–16px border radius
Profile images: Full circle (50% border radius)

Avoid overly rounded corners on cards — aim for modern but not playful.

🎴 Cards & Containers

**Dark Mode:**

- Background: hsl(0, 0%, 5%)
- Border: 1px solid hsl(0, 0%, 15%)
- Shadow: Minimal light lift — 0 1px 2px rgba(255, 255, 255, 0.05) on interactive cards
- Padding: 20–24px internal
- Margin: 16–20px between cards

**Light Mode:**

- Background: hsl(0, 0%, 95%)
- Border: 1px solid hsl(0, 0%, 85%)
- Shadow: Minimal — 0 1px 2px rgba(0, 0, 0, 0.1) on interactive cards
- Padding: 20–24px internal
- Margin: 16–20px between cards

Cards should feel clean and defined but not heavy. Use subtle borders and mode-appropriate shadows for depth.

🔘 Buttons & Interactive Elements

**Dark Mode Buttons:**

Primary Button (Blue Accent):

- Background: #60A5FA
- Text: hsl(0, 0%, 95%)
- Border radius: 24–28px
- Padding: 16px 32px
- Font weight: 600
- Minimum height: 48px

Secondary Button (Light Blue):

- Background: #A5B4FC
- Text: hsl(0, 0%, 95%)
- Border radius: 24–28px
- Padding: 16px 32px
- Font weight: 600
- Minimum height: 48px

Ghost Button:

- Background: hsl(0, 0%, 10%)
- Text: hsl(0, 0%, 95%)
- Border radius: 24–28px
- Padding: 16px 32px
- Font weight: 600
- Minimum height: 48px

Pills/Tabs:

- Inactive: Background hsl(0, 0%, 10%), text hsl(0, 0%, 70%)
- Active: Background #60A5FA, text hsl(0, 0%, 95%)
- Border radius: 20–24px
- Padding: 10px 20px
- Font weight: 500

**Light Mode Buttons:**

Primary Button (Blue Accent):

- Background: #4998e9
- Text: #FFFFFF
- Border radius: 24–28px
- Padding: 16px 32px
- Font weight: 600
- Minimum height: 48px

Secondary Button (Light Blue):

- Background: #ebf5fd
- Text: hsl(0, 0%, 5%)
- Border radius: 24–28px
- Padding: 16px 32px
- Font weight: 600
- Minimum height: 48px

Ghost Button:

- Background: hsl(0, 0%, 90%)
- Text: hsl(0, 0%, 5%)
- Border radius: 24–28px
- Padding: 16px 32px
- Font weight: 600
- Minimum height: 48px

Pills/Tabs:

- Inactive: Background hsl(0, 0%, 90%), text hsl(0, 0%, 30%)
- Active: Background #4998e9, text #FFFFFF
- Border radius: 20–24px
- Padding: 10px 20px
- Font weight: 500

All interactive elements should have minimum 48px touch targets for accessibility.

🪄 Iconography

Use a professional vector icon library:

- Lucide Icons (recommended)
- Feather Icons
- Heroicons

Icon sizes: 20px (small), 24px (default), 32px (large)

Avoid emojis — icons should represent meaning clearly with line consistency.

Use outlined icons for navigation and secondary actions.
Use solid/filled icons for primary actions and active states.

🎯 Component Library: Gluestack UI

Use Gluestack UI (https://gluestack.io/) as the foundation component library:

Core Components to Use:

- Box: For layout containers
- VStack/HStack: For vertical/horizontal layouts
- Button: For all button variants
- Text/Heading: For typography
- Input: For form fields
- Card: For card containers
- Pressable: For custom touchable areas
- Icon: For icon rendering
- Avatar: For profile images
- Badge: For notification badges

Theming with Gluestack:
Configure custom theme with modern color palette:

```typescript
const config = {
  tokens: {
    colors: {
      // Primary blue accent
      primary: "#4998e9",
      primaryText: "#FFFFFF",

      // Secondary light blue
      secondary: "#ebf5fd",
      secondaryText: "hsl(0, 0%, 5%)",

      // Layered backgrounds (light mode)
      background: "hsl(0, 0%, 100%)",
      surface: "hsl(0, 0%, 95%)",
      surfaceElevated: "hsl(0, 0%, 90%)",

      // Subtle borders
      border: "hsl(0, 0%, 85%)",

      // Text colors
      text: "hsl(0, 0%, 5%)",
      textSecondary: "hsl(0, 0%, 30%)",
    },
    space: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      "2xl": 48,
    },
    radii: {
      sm: 8,
      md: 12,
      lg: 16,
      xl: 24,
      full: 9999,
    },
  },
};
```

Benefits:

- Cross-platform consistency (React Native + Web)
- Accessible by default
- Customizable theming
- Performance optimized
- TypeScript support

🌐 Vibe Summary

Feels modern, editorial, spacious, and balanced.
Sophisticated layered backgrounds create natural depth without harsh contrasts.
Blue accent colors provide vibrance without being aggressive.
Generous whitespace and confident bold typography define hierarchy.
Coinbase's structured layout and professional polish.
Clubhouse's approachable and human visual tone.
Minimal ornamentation — let typography, layout, and subtle layering do the work.
Confident and polished without being aggressive.
Clean and minimal without being cold.
High-end aesthetic through subtle shading and proper shadows/borders.
