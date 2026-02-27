import { ProviderType } from "src/context/types";
import { iAuthRepository } from "./iauth/repository";
import { identidadV1Repository } from "./identidadv1/repository";
import { identidadV2Repository } from "./identidadv2/repository";
import { IProviderRepository } from "./types";

const getProvider = (provider: ProviderType): IProviderRepository => {
  switch (provider) {
    case "identidadv1":
      return identidadV1Repository;
    case "identidadv2":
      return identidadV2Repository;
    case "iauth":
      return iAuthRepository;
    default:
      throw new Error("Provider not supported");
  }
};

export { getProvider };
