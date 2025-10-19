export interface IBanner {
  _id: string;
  title: string;
  subtitle: string;
  description?: string;
  buttonText: string;
  buttonLink: string;
  imageUrl: string;
  position: number;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  backgroundColor?: string;
  textColor?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
