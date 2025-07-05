# Local Hive - React Native App

A local knowledge sharing platform built with React Native and Supabase.

## Supabase Integration

This project uses Supabase for authentication and database operations.

### Setup Instructions

1. **Install dependencies**

```bash
npm install
```

2. **Supabase Configuration**

The Supabase client is configured in `lib/supabase.js`. The URL and anonymous key are currently hardcoded for development purposes.

In a production environment, you should use environment variables:
- Create a `.env` file based on `.env.example`
- Add your Supabase URL and anonymous key

3. **Disable Email Confirmation (Important)**

For this app, email confirmation is disabled to allow immediate sign-in after registration:

- Go to your Supabase dashboard at https://xnnobyeytyycngybinqj.supabase.co
- Navigate to Authentication > Settings
- Under "Email Auth", uncheck "Enable email confirmations"
- Save changes

4. **Database Schema**

Create the following tables in your Supabase project:

**profiles**
```sql
-- Create profiles table
create table public.profiles (
  id uuid references auth.users primary key,
  full_name text,
  email text,
  bio text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Create policies for authenticated users
create policy "Users can view their own profile" 
  on public.profiles for select 
  using (auth.uid() = id);

create policy "Users can update their own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

create policy "New users can create their profile" 
  on public.profiles for insert 
  with check (auth.uid() = id);

-- Important: Create a policy to allow the service role to manage profiles
-- This is needed for server-side operations
create policy "Service role can manage all profiles" 
  on public.profiles 
  using (auth.role() = 'service_role');
```

5. **Authentication**

The app uses Supabase Authentication with email/password sign-in. The authentication flow is managed through the `AuthContext` in `context/AuthContext.jsx`.

6. **Environment-specific Databases**

The app is configured to support different databases for development, testing, and production environments. See `lib/supabaseDb.js` for the implementation.

## Running the App

```bash
npm start
```

## Features

- User authentication (sign up, sign in, sign out)
- Profile management
- Theme switching (light/dark mode) with toggle control
- Protected routes
- Custom alert dialogs with animations and theming
- Beautiful gradient backgrounds that adapt to the current theme (using expo-linear-gradient)

## Project Structure

- `app/` - Expo Router screens
- `components/` - Reusable React components
- `context/` - React context providers
- `lib/` - Utility functions and Supabase client
- `constants/` - App constants like colors
- `assets/` - Images and other static assets
- `hooks/` - Custom React hooks

## UI Components

### CustomAlert

The app uses a custom alert component instead of the default React Native Alert for a more polished user experience:

- Rounded corners
- Darkened background overlay
- Smooth animations (fade in/out and scale)
- Theme-aware (adapts to light/dark mode)
- Customizable buttons with different styles

To use the custom alert in a component:

```jsx
import CustomAlert from '../components/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';

const MyComponent = () => {
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();
  
  // Show an alert
  showAlert(
    'Alert Title',
    'Alert message here',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'OK', onPress: () => console.log('OK pressed') }
    ]
  );
  
  return (
    <View>
      {/* Your component content */}
      
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
}
```

### ThemeToggle

A reusable component for switching between light and dark mode:

- Located in the profile page under "App Settings"
- Features animated switch with sun/moon icons
- Automatically persists theme preference
- Adapts UI colors throughout the app

### GradientBackground

A component that provides beautiful gradient backgrounds:

- Uses expo-linear-gradient for compatibility with Expo
- Theme-aware gradient colors that change with light/dark mode
- Used on the landing page for a visually appealing introduction
- Customizable with your own gradient colors and directions
- Seamless integration with the app's theme system

For more details, see the [components documentation](./components/README.md). 