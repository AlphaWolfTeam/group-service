import { Schema } from 'mongoose';

export default new Schema(
  {
    label: {
      type: String,
      required: true,
      index: true,
    },
  },
);
