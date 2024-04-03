const IS_PRODUCTION = import.meta.env.PROD;

const getAuthStorage = () => {
  if (IS_PRODUCTION) {
    return sessionStorage;
  }

  return localStorage;
};

export { getAuthStorage };
