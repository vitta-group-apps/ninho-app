import AsyncStorage from '@react-native-async-storage/async-storage';
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    getItem: async (key) => await AsyncStorage.getItem(key),
    setItem: async (key, value) => await AsyncStorage.setItem(key, value),
    removeItem: async (key) => await AsyncStorage.removeItem(key),
    clear: async () => await AsyncStorage.clear(),
  };
}
