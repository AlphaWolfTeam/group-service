import { Schema, model, Document } from 'mongoose';
import { IGroup, GroupType } from './group.interface';
import userSchema from './user/user.schema';
import tagSchema from './tag/tag.schema';

const groupSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
    },
    tags: {
      _id: false,
      type: [tagSchema],
      default: [],
    },
    type: {
      type: GroupType,
      default: GroupType.Public,
    },
    users: {
      _id: false,
      type: [userSchema],
      default: [],
    },
    modifiedBy: {
      type: String,
      required: true,
    },
    externalSystem: {}, // Not Implemented
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const groupModel = model<IGroup & Document>('Group', groupSchema);
