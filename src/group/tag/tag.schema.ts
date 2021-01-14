import { Schema } from 'mongoose';

const toLower = (label: string): string => label.toLowerCase();

export default new Schema(
  {
    label: {
      type: String,
      required: true,
      index: true,
      set: toLower,
    },
  },
);
