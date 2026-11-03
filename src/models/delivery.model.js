import mongoose from 'mongoose'
import { DELIVERY_STATUS } from '../constants/index.js'

const deliverySchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: Object.values(DELIVERY_STATUS),
    default: DELIVERY_STATUS.PENDING,
  },
  assignedAt: { type: Date, default: Date.now },
  deliveredAt: { type: Date, default: null },
}, { timestamps: true })

export default mongoose.model('Delivery', deliverySchema)
