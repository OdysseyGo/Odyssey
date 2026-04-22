let _needsRefresh = false;

export const setProfileNeedsRefresh = () => {
  _needsRefresh = true;
};

export const consumeProfileNeedsRefresh = () => {
  const v = _needsRefresh;
  _needsRefresh = false;
  return v;
};
