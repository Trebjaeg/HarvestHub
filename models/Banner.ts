import mongoose, { Schema, Document } from 'mongoose';

export interface IBanner extends Document {
  _id: string;
  title: string;
  subtitle: string;
  description?: string;
  buttonText: string;
  buttonLink: string;
  imageUrl: string;
  position: number; // For ordering banners
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  backgroundColor?: string;
  textColor?: string;
  createdBy: string; // Admin user ID
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Banner title is required'],
      trim: true,
    },
    subtitle: {
      type: String,
      required: [true, 'Banner subtitle is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    buttonText: {
      type: String,
      required: [true, 'Button text is required'],
      default: 'Shop now',
    },
    buttonLink: {
      type: String,
      required: [true, 'Button link is required'],
      default: '/home',
    },
    imageUrl: {
      type: String,
      required: [true, 'Banner image is required'],
    },
    position: {
      type: Number,
      default: 0,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    backgroundColor: {
      type: String,
      default: '#D4A574', // Brown/beige color from your design
    },
    textColor: {
      type: String,
      default: '#103C2E', // Dark green
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
BannerSchema.index({ isActive: 1, position: 1 });
BannerSchema.index({ startDate: 1, endDate: 1 });

export default mongoose.models.Banner || mongoose.model<IBanner>('Banner', BannerSchema);
