let profileNeedsRefresh = false;
const listeners = new Set<() => void>();

export function setProfileNeedsRefresh() {
  profileNeedsRefresh = true;
  listeners.forEach((listener) => listener());
}

export function consumeProfileNeedsRefresh() {
  const shouldRefresh = profileNeedsRefresh;
  profileNeedsRefresh = false;
  return shouldRefresh;
}

export function subscribeProfileRefresh(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
