import { User } from "../entities";


export interface ISavedResponse {
  message: string;
  status: boolean;
  payload?: any;
}

export interface IMailResponse {
  message: string;
  status: boolean;
}

export interface ISavePractice {
  user: User,
  date: Date;
  link: string;
  feedback?: any | null;
}