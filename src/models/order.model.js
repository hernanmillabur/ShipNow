import mongoose from 'mongoose'
import { ORDER_PRIORITY, ORDER_STATUS } from '../constants/index.js'

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  address: { type: String, required: true },
  items: [{ name: String, price: Number, quantity: Number }],
  total: Number,
  status: { type: String, enum: Object.values(ORDER_STATUS), default: ORDER_STATUS.PENDING },
  priority: { type: String, enum: Object.values(ORDER_PRIORITY), default: ORDER_PRIORITY.NORMAL },
}, { timestamps: true })

export default mongoose.model('Order', orderSchema)
