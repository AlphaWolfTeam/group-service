import { Schema, model, Document, Types } from 'mongoose';
import { UserRole } from '../user/user.role';
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
        id: Schema.Types.ObjectId,
        role: String,
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

groupSchema.index({ _id: 1, 'users.id': 1 }, { unique: true });

export const groupModel = model<IGroup & Document>('Group', groupSchema);
