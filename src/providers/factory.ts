import { identidadRepository } from "./identidad/repository";
import { IProviderRepository } from "./types";

const getProvider = (provider: string): IProviderRepository => {
  switch (provider) {
    case "identidad":
      return identidadRepository;
    default:
      throw new Error("Provider not supported");
  }
};

export { getProvider };
