import mongoose from 'mongoose';

export interface IOrder {
  _id?: string;
  orderNumber: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  sellerId: string;
  sellerName: string;
  products: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    unit: string;
  }[];
  totalAmount: number;
  deliveryFee: number;
  finalAmount: number;
  deliveryAddress: {
    street: string;
    city: string;
    province: string;
    zipCode: string;
  };
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'completed';
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderDate: Date;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  notes?: string | { text: string; createdAt: Date }[];
  refusalReason?: string;
  refusalDate?: Date;
  cancellationRequest?: {
    requestedBy: 'buyer';
    reason?: string;
    requestedAt: Date;
    status: 'pending' | 'approved' | 'rejected';
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new mongoose.Schema<IOrder>({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  buyerId: {
    type: String,
    required: true
  },
  buyerName: {
    type: String,
    required: true
  },
  buyerEmail: {
    type: String,
    required: true
  },
  sellerId: {
    type: String,
    required: true
  },
  sellerName: {
    type: String,
    required: true
  },
  products: [{
    productId: {
      type: String,
      required: true
    },
    productName: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryFee: {
    type: Number,
    default: 0,
    min: 0
  },
  finalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryAddress: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    province: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled', 'completed'],
    default: 'preparing'
  },
  paymentMethod: {
    type: String,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  orderDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  estimatedDelivery: {
    type: Date
  },
  actualDelivery: {
    type: Date
  },
  notes: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  refusalReason: {
    type: String,
    maxlength: [1000, 'Refusal reason cannot exceed 1000 characters']
  },
  refusalDate: {
    type: Date
  },
  cancellationRequest: {
    type: {
      requestedBy: {
        type: String,
        enum: ['buyer'],
        required: true
      },
      reason: {
        type: String,
        maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
      },
      requestedAt: {
        type: Date,
        required: true,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        required: true,
        default: 'pending'
      }
    },
    required: false
  }
}, {
  timestamps: true
});

// Indexes for better performance
OrderSchema.index({ buyerId: 1, status: 1 });
OrderSchema.index({ sellerId: 1, status: 1 });
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ orderDate: -1 });

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);