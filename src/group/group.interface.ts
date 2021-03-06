import IUser from './user/user.interface';

export interface IGroupPrimal {
  name: string;
  description: string;
  icon: string;
  type: GroupType;
  tags: { label: string }[];
  users: IUser[];
  modifiedBy: IUser['id'];
  createdBy: IUser['id'];
}

export interface IGroup extends IGroupPrimal {
  _id: string;
  exchangeAddress?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum GroupType {
  Private = 'private',
  Public = 'public',
  // Technical = 'technical',
}
