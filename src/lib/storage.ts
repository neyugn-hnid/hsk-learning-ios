import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "hsk_mobile_token";
const USERS_KEY = "hsk_mobile_users";

export async function getStoredToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setStoredToken(token: string) {
  return SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearStoredToken() {
  return SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getStoredUsers() {
  return SecureStore.getItemAsync(USERS_KEY);
}

export async function setStoredUsers(payload: string) {
  return SecureStore.setItemAsync(USERS_KEY, payload);
}
