import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import logger from './utils/logger.js'

// Route imports
import leadsRoutes from './routes/leads.js'
import keywordsRoutes from './routes/keywords.js'
import analyticsRoutes from './routes/analytics.js'
import settingsRoutes from './routes/settings.js'
import emailRoutes from './routes/email.js'
import telegramRoutes from './routes/telegram.js'
import diagnosticsRoutes from './routes/diagnostics.js'

const app = express()

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})
app.use('/api/', limiter)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api/leads', leadsRoutes)
app.use('/api/keywords', keywordsRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/email', emailRoutes)
app.use('/api/telegram', telegramRoutes)
app.use('/api/diagnostics', diagnosticsRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('API Error:', err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

export default app