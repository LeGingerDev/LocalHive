# Custom Components

## CustomAlert

A custom alert component that provides a more visually appealing alternative to the default React Native Alert.

### Features

- Rounded corners
- Darkened background overlay
- Smooth animations (fade in/out and scale)
- Customizable buttons with different styles
- Theme-aware (adapts to light/dark mode)
- Dismissible by tapping outside the alert

### Usage

```jsx
import CustomAlert from '../components/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';

const MyComponent = () => {
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();
  
  const handleShowAlert = () => {
    showAlert(
      'Alert Title',
      'This is the alert message',
      [
        { 
          text: 'Cancel', 
          style: 'cancel' 
        },
        { 
          text: 'OK', 
          style: 'default',
          onPress: () => console.log('OK pressed')
        },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => console.log('Delete pressed')
        }
      ]
    );
  };
  
  return (
    <View>
      <Button title="Show Alert" onPress={handleShowAlert} />
      
      {/* Add this at the end of your component */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onDismiss={hideAlert}
      />
    </View>
  );
};
```

### Button Styles

- `default`: Primary action button (uses primary color)
- `cancel`: Secondary action button (light gray)
- `destructive`: Dangerous action button (red)

You can also customize button colors directly:

```jsx
{
  text: 'Custom',
  backgroundColor: '#8A2BE2', // Custom background color
  textColor: '#FFFFFF'        // Custom text color
}
```

## ThemeToggle

A component that allows users to toggle between light and dark mode.

### Features

- Animated switch
- Sun and moon icons
- Theme-aware styling
- Optional label

### Usage

```jsx
import ThemeToggle from '../components/ThemeToggle';

const MyComponent = () => {
  return (
    <View>
      {/* Basic usage */}
      <ThemeToggle />
      
      {/* Without label */}
      <ThemeToggle showLabel={false} />
      
      {/* Custom icon size */}
      <ThemeToggle iconSize={24} />
      
      {/* With custom style */}
      <ThemeToggle style={{ marginVertical: 20 }} />
    </View>
  );
};
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `style` | Object | `{}` | Additional styles to apply to the container |
| `showLabel` | Boolean | `true` | Whether to show the "Dark Mode"/"Light Mode" label |
| `iconSize` | Number | `20` | Size of the sun and moon icons |

## GradientBackground

A component that provides a beautiful gradient background that adapts to the current theme.

### Features

- Uses expo-linear-gradient for Expo compatibility
- Theme-aware gradient colors
- Customizable gradient direction
- Customizable colors
- Seamless integration with the app's theme

### Usage

```jsx
import GradientBackground from '../components/GradientBackground';

const MyComponent = () => {
  return (
    <GradientBackground>
      {/* Your content here */}
    </GradientBackground>
  );
};

// With custom colors
const CustomGradient = () => {
  return (
    <GradientBackground
      colors={['#4776E6', '#8E54E9', '#9b59b6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Your content here */}
    </GradientBackground>
  );
};
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `colors` | Array | Theme-based | Array of colors to use for the gradient |
| `style` | Object | `{ flex: 1 }` | Additional styles to apply to the gradient |
| `start` | Object | `{ x: 0, y: 0 }` | Starting point of the gradient |
| `end` | Object | `{ x: 1, y: 1 }` | Ending point of the gradient |

## ThemedView

A wrapper component that applies the current theme to a View component.

### Usage

```jsx
import ThemedView from '../components/ThemedView';

const MyComponent = () => {
  return (
    <ThemedView style={styles.container}>
      {/* Your content here */}
    </ThemedView>
  );
};
``` 