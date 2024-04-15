const getAuthStorage = (isProduction?: boolean) => {
  if (isProduction) {
    return sessionStorage;
  }

  return localStorage;
};

export { getAuthStorage };
