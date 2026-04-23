let profileNeedsRefresh = false;

export function setProfileNeedsRefresh() {
  profileNeedsRefresh = true;
}

export function consumeProfileNeedsRefresh() {
  const shouldRefresh = profileNeedsRefresh;
  profileNeedsRefresh = false;
  return shouldRefresh;
}
