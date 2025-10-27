# UI Components - Usage Guide

Artifact-inspired design system components for YikYak app.

## Quick Import

```javascript
import { Button, Card, Input, Text, Heading, Body, Caption, Avatar, Badge, Container, Section, Divider } from '../components/ui';
```

## Components

### Button

Primary, Secondary, Tertiary, Ghost, and Outline button variants.

```jsx
// Primary button (black)
<Button variant="primary" onPress={handlePress}>
  Submit
</Button>

// Secondary button (orange)
<Button variant="secondary" onPress={handlePress}>
  Cancel
</Button>

// Tertiary button (pale blue)
<Button variant="tertiary" onPress={handlePress}>
  Learn More
</Button>

// Ghost button (light gray)
<Button variant="ghost" onPress={handlePress}>
  Skip
</Button>

// With icon
<Button 
  variant="primary" 
  icon={<Plus size={20} color="#FFFFFF" />}
  iconPosition="left"
>
  Create Post
</Button>

// Loading state
<Button variant="primary" loading={true}>
  Submitting...
</Button>

// Sizes
<Button size="small">Small</Button>
<Button size="medium">Medium</Button>
<Button size="large">Large</Button>

// Full width
<Button fullWidth>Full Width Button</Button>
```

### Card

Clean white cards with subtle borders.

```jsx
// Default card
<Card>
  <Text>Card content</Text>
</Card>

// Interactive card (with shadow)
<Card interactive>
  <Text>Clickable card</Text>
</Card>

// Custom padding
<Card padding="small">Small padding</Card>
<Card padding="default">Default padding</Card>
<Card padding="large">Large padding</Card>
<Card padding="none">No padding</Card>
```

### Input

Form inputs with label and error support.

```jsx
// Basic input
<Input
  placeholder="Enter your email"
  value={email}
  onChangeText={setEmail}
/>

// With label
<Input
  label="Email Address"
  placeholder="you@example.com"
  value={email}
  onChangeText={setEmail}
/>

// With error
<Input
  label="Password"
  placeholder="Enter password"
  value={password}
  onChangeText={setPassword}
  error="Password is required"
  secureTextEntry
/>

// With icons
<Input
  leftIcon={<Mail size={20} color="#6B7280" />}
  placeholder="Email"
/>

// Multiline
<Input
  multiline
  placeholder="Write your post..."
  numberOfLines={4}
/>
```

### Text Components

Typography components with consistent styling.

```jsx
// Headings
<Heading variant="hero">Hero Text</Heading>
<Heading variant="h1">Main Heading</Heading>
<Heading variant="h2">Subheading</Heading>

// Body text
<Body variant="bodyLarge">Large body text</Body>
<Body variant="body">Regular body text</Body>
<Body variant="bodySmall">Small body text</Body>

// Caption
<Caption>Small caption text</Caption>

// Custom color
<Heading variant="h1" color="#FF5A1F">
  Colored Heading
</Heading>

// Or use individual components
import { Heading, Body, Caption } from '../components/ui/Text';
```

### Avatar

User avatars with initials fallback.

```jsx
// With image
<Avatar
  source={{ uri: 'https://...' }}
  name="John Doe"
  size="medium"
/>

// With initials (no image)
<Avatar
  name="John Doe"
  size="medium"
/>

// Sizes
<Avatar name="John" size="small" />   // 32x32
<Avatar name="John" size="medium" />  // 40x40
<Avatar name="John" size="large" />   // 56x56
<Avatar name="John" size="xlarge" />  // 80x80
```

### Badge

Notification badges and status indicators.

```jsx
// Variants
<Badge variant="primary">5</Badge>
<Badge variant="secondary">New</Badge>
<Badge variant="accent">Beta</Badge>
<Badge variant="error">!</Badge>
<Badge variant="success">✓</Badge>

// Sizes
<Badge size="small">3</Badge>
<Badge size="medium">10</Badge>
<Badge size="large">99+</Badge>
```

### Container

Screen container with proper padding.

```jsx
<Container>
  <Text>Screen content</Text>
</Container>

// Custom padding
<Container padding="small">Small padding</Container>
<Container padding="default">Default padding</Container>
<Container padding="large">Large padding</Container>
<Container padding="none">No padding</Container>
```

### Section

Section wrapper with consistent spacing.

```jsx
<Section>
  <Heading variant="h2">Section Title</Heading>
  <Body>Section content</Body>
</Section>

// Custom spacing
<Section spacing="small">Small spacing</Section>
<Section spacing="default">Default spacing</Section>
<Section spacing="large">Large spacing</Section>
<Section spacing="none">No spacing</Section>
```

### Divider

Clean dividers for separating content.

```jsx
// Horizontal divider
<Divider />

// Vertical divider
<Divider orientation="vertical" />

// Custom spacing
<Divider spacing="small" />
<Divider spacing="default" />
<Divider spacing="large" />
<Divider spacing="none" />
```

## Theme Hook

Access theme values in your components:

```jsx
import { useTheme } from '../../utils/theme';

function MyComponent() {
  const { colors, spacing, radius, typography, shadows } = useTheme();
  
  return (
    <View style={{
      backgroundColor: colors.surface,
      padding: spacing.xl,
      borderRadius: radius.card,
      ...shadows.minimal,
    }}>
      <Text style={{
        color: colors.text,
        ...typography.h2,
      }}>
        Hello World
      </Text>
    </View>
  );
}
```

## Color Palette

```javascript
colors.background      // #F8F9FA (light gray)
colors.surface         // #FFFFFF (white)
colors.text            // #000000 (black)
colors.textSecondary   // #6B7280 (gray)
colors.primary         // #000000 (black)
colors.secondary       // #FF5A1F (orange)
colors.accent          // #B7D4FF (pale blue)
colors.border          // #E5E7EB (light gray)
colors.error           // #EF4444 (red)
colors.success         // #10B981 (green)
colors.warning         // #F59E0B (yellow)
```

## Spacing Scale (4px-based)

```javascript
spacing.xs    // 4px
spacing.sm    // 8px
spacing.md    // 12px
spacing.lg    // 16px
spacing.xl    // 20px
spacing["2xl"] // 24px
spacing["3xl"] // 32px
spacing["4xl"] // 40px
spacing["5xl"] // 48px
spacing["6xl"] // 64px
```

## Border Radius

```javascript
radius.small       // 8px
radius.card        // 12px
radius.cardLarge   // 16px
radius.button      // 24px
radius.buttonLarge // 28px
radius.pill        // 20px
radius.pillLarge   // 24px
radius.input       // 12px
radius.inputLarge  // 16px
radius.avatar      // 9999px (circle)
```

## Typography

```javascript
typography.hero        // 48px, weight 800
typography.h1          // 32px, weight 700
typography.h2          // 24px, weight 600
typography.bodyLarge   // 18px, weight 400
typography.body        // 16px, weight 400
typography.bodySmall   // 14px, weight 400
typography.caption     // 12px, weight 400
```

## Design Principles

1. **Spacing**: Use 4px-based scale consistently
2. **Typography**: Bold headings (700-800), regular body (400)
3. **Colors**: Black/white base with pale blue and orange accents
4. **Shadows**: Minimal (only on interactive elements)
5. **Touch Targets**: Minimum 48px for all interactive elements
6. **Border Radius**: Cards 12-16px, Buttons 24-28px
7. **Contrast**: High contrast for readability

## Examples

### Login Form

```jsx
<Container>
  <Section spacing="large">
    <Heading variant="h1">Welcome Back</Heading>
    <Body color={colors.textSecondary}>Sign in to continue</Body>
  </Section>
  
  <Section>
    <Input
      label="Email"
      placeholder="you@example.com"
      value={email}
      onChangeText={setEmail}
      keyboardType="email-address"
    />
    
    <Input
      label="Password"
      placeholder="Enter password"
      value={password}
      onChangeText={setPassword}
      secureTextEntry
      error={error}
    />
  </Section>
  
  <Button variant="primary" fullWidth onPress={handleLogin}>
    Sign In
  </Button>
</Container>
```

### Post Card

```jsx
<Card interactive>
  <View style={{ flexDirection: 'row', marginBottom: spacing.md }}>
    <Avatar name={post.author} size="medium" />
    <View style={{ marginLeft: spacing.md, flex: 1 }}>
      <Body variant="bodyMedium">{post.author}</Body>
      <Caption>{post.timestamp}</Caption>
    </View>
  </View>
  
  <Body style={{ marginBottom: spacing.lg }}>
    {post.content}
  </Body>
  
  <View style={{ flexDirection: 'row', gap: spacing.lg }}>
    <Button variant="ghost" size="small">
      <ChevronUp size={16} /> {post.upvotes}
    </Button>
    <Button variant="ghost" size="small">
      <MessageCircle size={16} /> {post.comments}
    </Button>
  </View>
</Card>
```
