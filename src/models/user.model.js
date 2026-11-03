import mongoose from 'mongoose'
import { USER_ROLES } from '../constants/index.js'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: Object.values(USER_ROLES), default: USER_ROLES.CUSTOMER },
})

export default mongoose.model('User', userSchema)
