let profileNeedsRefresh = false;

export function markProfileNeedsRefresh() {
  profileNeedsRefresh = true;
}

export function consumeProfileNeedsRefresh() {
  const shouldRefresh = profileNeedsRefresh;
  profileNeedsRefresh = false;
  return shouldRefresh;
}
