import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPromoBanner extends Document {
  title: string;
  subtitle: string;
  description: string;
  buttonText?: string;
  buttonLink?: string;
  imageUrl: string;
  backgroundColor?: string;
  textColor?: string;
  isActive: boolean;
  position: number;
  showButton: boolean;
  startDate?: Date;
  endDate?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const PromoBannerSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    subtitle: {
      type: String,
      required: [true, 'Subtitle is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    buttonText: {
      type: String,
      trim: true,
      default: 'Shop now',
    },
    buttonLink: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
    },
    backgroundColor: {
      type: String,
      default: '#DCFCE7',
    },
    textColor: {
      type: String,
      default: '#1E3A2F',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    position: {
      type: Number,
      default: 0,
    },
    showButton: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying active banners
PromoBannerSchema.index({ isActive: 1, position: 1 });
PromoBannerSchema.index({ startDate: 1, endDate: 1 });

const PromoBanner: Model<IPromoBanner> =
  mongoose.models.PromoBanner || mongoose.model<IPromoBanner>('PromoBanner', PromoBannerSchema);

export default PromoBanner;
