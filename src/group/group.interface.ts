import User from './user/user.interface';

export interface IGroupPrimal {
  name: string;
  description: string;
  type: GroupType;
  tags: string[];
  users: User[];
  modifiedBy: User['id'];
  createdBy: User['id'];
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
