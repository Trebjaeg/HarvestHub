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
    fullName?: string;
    phone?: string;
    latitude?: number;
    longitude?: number;
  };
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'completed';
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderDate: Date;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  notes?: { text: string; createdAt: Date }[];
  refusalReason?: string;
  refusalDate?: Date;
  refusalProof?: {
    fileUrl: string;
    fileName: string;
    uploadedAt: Date;
  }[];
  cancellationRequest?: {
    requestedBy: 'buyer' | 'seller';
    reason?: string;
    reasonCategory?: 'change_address' | 'modify_order' | 'wrong_item' | 'changed_mind' | 'duplicate_order' | 'other';
    requestedAt: Date;
    status: 'pending' | 'approved' | 'rejected';
  };
  deliveryAttempts?: {
    attemptNumber: number;
    attemptDate: Date;
    status: 'failed' | 'successful';
    notes?: string;
    markedBy: string; // seller ID
  }[];
  // Lalamove delivery fields
  delivery_provider?: 'lalamove' | 'manual';
  lalamove_order_id?: string;
  lalamove_quotation_id?: string;
  lalamove_share_link?: string;
  delivery_status?: string;
  delivery_eta?: Date;
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
    },
    fullName: {
      type: String
    },
    phone: {
      type: String
    },
    latitude: {
      type: Number
    },
    longitude: {
      type: Number
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
  notes: [{
    text: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  refusalReason: {
    type: String,
    maxlength: [1000, 'Refusal reason cannot exceed 1000 characters']
  },
  refusalDate: {
    type: Date
  },
  refusalProof: [{
    fileUrl: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  cancellationRequest: {
    type: {
      requestedBy: {
        type: String,
        enum: ['buyer', 'seller'],
        required: true
      },
      reason: {
        type: String,
        maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
      },
      reasonCategory: {
        type: String,
        enum: ['change_address', 'modify_order', 'wrong_item', 'changed_mind', 'duplicate_order', 'other']
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
  },
  deliveryAttempts: [{
    attemptNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 2
    },
    attemptDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['failed', 'successful'],
      required: true
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    markedBy: {
      type: String,
      required: true
    }
  }],
  // Lalamove delivery fields
  delivery_provider: {
    type: String,
    enum: ['lalamove', 'manual'],
    default: 'lalamove'
  },
  lalamove_order_id: {
    type: String
  },
  lalamove_quotation_id: {
    type: String
  },
  lalamove_share_link: {
    type: String
  },
  delivery_status: {
    type: String
  },
  delivery_eta: {
    type: Date
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
