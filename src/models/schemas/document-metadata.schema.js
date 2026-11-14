import mongoose from 'mongoose'

export const DOCUMENT_TYPES = Object.freeze([
  'identity',
  'driver_license',
  'proof_of_address',
])

export const documentMetadataSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  generatedName: { type: String, required: true },
  relativePath: { type: String, required: true },
  mimeType: { type: String, required: true, enum: ['application/pdf', 'image/jpeg', 'image/png'] },
  sizeBytes: { type: Number, required: true, min: 0 },
  documentType: { type: String, enum: DOCUMENT_TYPES },
  uploadedAt: { type: Date, required: true, default: Date.now },
}, { _id: true })
