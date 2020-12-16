import User from '../user/user.interface';

export interface IGroup {
  id?: string;
  name: string;
  description: string;
  type: GroupType;
  users: User[];
  modifiedBy: User['id'];
  exchangeAddress?: string;
  createdBy: User['id'];
  createdAt?: Date;
  updatedAt?: Date;
}

export enum GroupType {
  Private = 'private',
  Public = 'public',
  // Technical = 'technical',
}
