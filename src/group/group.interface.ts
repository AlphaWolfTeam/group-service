import User from './user/user.interface';

export interface IGroupPrimal {
  name: string;
  description: string;
  type: GroupType;
  users: User[];
  modifiedBy: User['id'];
  createdBy: User['id'];
}

export interface IGroup {
  _id: string;
  name: string;
  description: string;
  type: GroupType;
  users: User[];
  modifiedBy: User['id'];
  createdBy: User['id'];
  exchangeAddress?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum GroupType {
  Private = 'private',
  Public = 'public',
  // Technical = 'technical',
}
