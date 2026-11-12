import mongoose from 'mongoose';

export const ITEM_MAX_LENGTH = 200;

const todoSchema = new mongoose.Schema(
  {
    item: {
      type: String,
      required: [true, 'A todo item is required.'],
      trim: true,
      maxlength: [
        ITEM_MAX_LENGTH,
        `Todo items cannot exceed ${ITEM_MAX_LENGTH} characters.`,
      ],
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

todoSchema.set('toJSON', {
  versionKey: false,
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

export const Todo = mongoose.model('Todo', todoSchema);
