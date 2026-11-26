import mongoose from 'mongoose'
import { USER_ROLES } from '../constants/index.js'
import { documentMetadataSchema } from './schemas/document-metadata.schema.js'

const userDocumentSchema = documentMetadataSchema.clone()
userDocumentSchema.path('documentType').required(true)

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: Object.values(USER_ROLES), default: USER_ROLES.CUSTOMER },
  documents: { type: [userDocumentSchema], default: [] },
})

userSchema.index({ role: 1, _id: -1 })

export default mongoose.model('User', userSchema)
