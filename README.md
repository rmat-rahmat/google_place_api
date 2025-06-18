# Google Place API React Native App

This project is a React Native application that demonstrates searching, viewing, and managing places using the Google Places API. It features a map, search bar with autocomplete, recent search history, and place details.

## Features

- Google Places Autocomplete and Text Search
- Interactive Map with Markers
- Recent Search History (with local storage)
- Place Details and Photos
- Clean, modular code using hooks and context

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or newer recommended)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- A Google Maps API key with Places API enabled

## Getting Started

### 1. Clone the repository

```sh
git clone https://github.com/your-username/google-place-api-app.git
cd google_place_api
```

### 2. Install dependencies

```sh
npm install
# or
yarn install
```

### 3. Set up your Google Maps API Key

- Create a file named `.env` in the root directory.
- Add your API key:

```
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

- Alternatively, you can directly edit the API key in `hooks/useGooglePlaces.js` for quick testing.

### 4. Start the app

```sh
npx expo start
```

- Use the Expo Go app on your device or an emulator to view the app.

## Project Structure

- `App.js` - Main entry point, navigation, and context setup
- `screens/` - App screens (Map, Search List, Search History)
- `components/` - UI components (SearchBar, RecentHistory, etc.)
- `context/PlaceContext.js` - Context for managing selected place and history
- `hooks/useGooglePlaces.js` - Custom hook for Google Places API

## Notes

- Make sure your Google Maps API key has the Places API enabled.
- For production, restrict your API key and do not commit it to public repositories.

## License

MIT

```# Google Place API React Native App

This project is a React Native application that demonstrates searching, viewing, and managing places using the Google Places API. It features a map, search bar with autocomplete, recent search history, and place details.

## Features

- Google Places Autocomplete and Text Search
- Interactive Map with Markers
- Recent Search History (with local storage)
- Place Details and Photos
- Clean, modular code using hooks and context

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or newer recommended)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- A Google Maps API key with Places API enabled

## Getting Started

### 1. Clone the repository

```sh
git clone https://github.com/rmat-rahmat/google_place_api.git
cd google_place_api
```

### 2. Install dependencies

```sh
npx expo install
# or
npm install
# or
yarn install
```

### 3. Set up your Google Maps API Key

- Create a file named `.env` in the root directory.
- Add your API key:

```
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

- Alternatively, you can directly edit the API key in `hooks/useGooglePlaces.js` for quick testing.

### 4. Start the app

```sh
npx expo start
```

- Use the Expo Go app on your device or an emulator to view the app.

## Project Structure

- `App.js` - Main entry point, navigation, and context setup
- `screens/` - App screens (Map, Search List, Search History)
- `components/` - UI components (SearchBar, RecentHistory, etc.)
- `context/PlaceContext.js` - Context for managing selected place and history
- `hooks/useGooglePlaces.js` - Custom hook for Google Places API

## Notes

- Make sure your Google Maps API key has the Places API enabled.
- For production, restrict your API key and do not commit it to public repositories.

## License
