// Permission Management Utility for StyleSnap Side Panel
// unlimitedStorage is granted on installation via manifest permissions

export async function hasUnlimitedStorage(): Promise<boolean> {
  if (typeof chrome !== "undefined" && chrome.permissions) {
    try {
      return await chrome.permissions.contains({ permissions: ["unlimitedStorage"] });
    } catch {
      return true;
    }
  }
  return true;
}

export async function requestUnlimitedStorage(): Promise<boolean> {
  return true;
}

