import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    username: { type: String, trim: true, lowercase: true, maxlength: 40, sparse: true, unique: true },
    bio: { type: String, default: '', maxlength: 500 },
    avatarUrl: { type: String, default: '' },
    avatarColor: { type: String, default: '#6E56CF' },
    preferences: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
      language: { type: String, enum: ['mn', 'en'], default: 'mn' },
    },
  },
  { timestamps: true }
);

export type UserDoc = HydratedDocument<InferSchemaType<typeof userSchema>>;

export function toPublicUser(u: UserDoc) {
  return {
    id: u._id.toString(),
    email: u.email,
    name: u.name,
    username: u.username ?? '',
    bio: u.bio,
    avatarUrl: u.avatarUrl,
    avatarColor: u.avatarColor,
    preferences: u.preferences,
    createdAt: u.get('createdAt'),
  };
}

export const User = model('User', userSchema);
