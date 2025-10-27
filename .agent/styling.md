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

🎨 Color Palette (Artifact-inspired)

Primary background: Light gray (#F8F9FA) for app background
Card background: Pure white (#FFFFFF)
Primary text: Black (#000000)

Accent Pale Blue: #B7D4FF (used for highlights, illustrations, decorative elements, and secondary actions)
Accent Orange: #FF5A1F (used for important CTAs, alerts, and vibrant accents)

Primary CTA Colors:
- Black (#000000) for primary buttons and bold actions
- Orange (#FF5A1F) for secondary important actions
- Pale Blue (#B7D4FF) for tertiary actions or backgrounds

Grays / Neutrals:
- Light gray background: #F8F9FA
- Card borders: #E5E7EB (1px solid)
- Divider gray: #E5E7EB
- Secondary text: #6B7280
- Disabled text: #9CA3AF

Overall, the color contrast should feel bold but clean, emphasizing black and white with subtle injections of pale blue and orange for vibrance and personality.

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

Background: Pure white (#FFFFFF)
Border: 1px solid #E5E7EB
Shadow: Minimal — only 0 1px 3px rgba(0, 0, 0, 0.06) on interactive cards
Padding: 20–24px internal
Margin: 16–20px between cards

Cards should feel clean and defined but not heavy. Use subtle borders and minimal shadows.

🔘 Buttons & Interactive Elements

Primary Button (Black):
- Background: #000000
- Text: #FFFFFF
- Border radius: 24–28px
- Padding: 16px 32px
- Font weight: 600
- Minimum height: 48px

Secondary Button (Orange):
- Background: #FF5A1F
- Text: #FFFFFF
- Border radius: 24–28px
- Padding: 16px 32px
- Font weight: 600
- Minimum height: 48px

Tertiary Button (Pale Blue):
- Background: #B7D4FF
- Text: #000000
- Border radius: 24–28px
- Padding: 16px 32px
- Font weight: 600
- Minimum height: 48px

Ghost Button:
- Background: #F3F4F6
- Text: #000000
- Border radius: 24–28px
- Padding: 16px 32px
- Font weight: 600
- Minimum height: 48px

Pills/Tabs:
- Inactive: Background #F3F4F6, text #6B7280
- Active: Background #000000, text #FFFFFF
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
Configure custom theme to match Artifact palette:
```typescript
const config = {
  tokens: {
    colors: {
      primary: '#000000',
      secondary: '#FF5A1F',
      accent: '#B7D4FF',
      background: '#F8F9FA',
      surface: '#FFFFFF',
      border: '#E5E7EB',
      text: '#000000',
      textSecondary: '#6B7280',
    },
    space: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      '2xl': 48,
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
Artifact's bold geometry, generous whitespace, and color contrasts.
Clubhouse's approachable and human visual tone.
Coinbase's structured layout, professional polish, and clear hierarchy.
Minimal ornamentation — let typography, layout, and subtle color pops do the work.
Confident and bold without being aggressive.
Clean and minimal without being cold.
