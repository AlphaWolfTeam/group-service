import { Schema } from 'mongoose';

export default new Schema(
  {
    id: { type: String, index: true },
    role: Number,
  },
);
