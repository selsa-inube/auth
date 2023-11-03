const getAuthorizationCode = () => {
  const url = new URL(window.location.href);
  const searchParams = new URLSearchParams(url.search);
  const authorizationCode = searchParams.get("code");
  const state = searchParams.get("state");

  return {
    authorizationCode,
    state,
  };
};

export { getAuthorizationCode };
