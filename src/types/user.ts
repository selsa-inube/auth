interface IUser {
  id: string;
  identification: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  type: string;
  operator?: {
    name: string;
    logo: string;
  };
}

export type { IUser };
