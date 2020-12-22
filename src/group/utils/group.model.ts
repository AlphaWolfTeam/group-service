import { Schema, model, Document } from 'mongoose';
import { IGroup, GroupType } from './group.interface';

const groupSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    tags: {}, // Not Implemented
    type: {
      type: GroupType,
      default: GroupType.Public,
    },
    users: {
      type: [{
        _id : false,
        id: { type: String, index: true },
        role: Number,
      }],
      default: [],
    },
    modifiedBy: {
      type: String,
      required: true,
    },
    exchangeAddress: {
      type: String,
    },
    externalSystem: {}, // Not Implemented
    createdBy: {
      type: String,
      required: true,
    },
    icon: {}, // Not Implemented
  },
  {
    timestamps: true,
  },
);

export const groupModel = model<IGroup & Document>('Group', groupSchema);
