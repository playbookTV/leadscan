import express from 'express'
import db from '../config/database.js'
import logger from '../utils/logger.js'

const router = express.Router()

// GET /api/keywords - List all keywords
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await db
      .from('keywords')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json(data || [])
  } catch (error) {
    next(error)
  }
})

// GET /api/keywords/stats - Keyword statistics
router.get('/stats', async (req, res, next) => {
  try {
    // Get keyword with lead counts
    const { data, error } = await db
      .from('keywords')
      .select(`
        *,
        lead_count:leads(count)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Process stats
    const stats = {
      total_keywords: data?.length || 0,
      active_keywords: data?.filter(k => k.is_active).length || 0,
      total_leads_found: data?.reduce((sum, k) => sum + (k.lead_count?.[0]?.count || 0), 0) || 0,
      keywords: data || []
    }

    res.json(stats)
  } catch (error) {
    next(error)
  }
})

// GET /api/keywords/:id - Get single keyword
router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await db
      .from('keywords')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Keyword not found' })
      }
      throw error
    }

    res.json(data)
  } catch (error) {
    next(error)
  }
})

// POST /api/keywords - Create new keyword
router.post('/', async (req, res, next) => {
  try {
    const { keyword, platform, is_active = true } = req.body

    if (!keyword || !platform) {
      return res.status(400).json({
        error: 'Keyword and platform are required'
      })
    }

    // Check if keyword already exists for this platform
    const { data: existing, error: checkError } = await db
      .from('keywords')
      .select('id')
      .eq('keyword', keyword)
      .eq('platform', platform)
      .single()

    if (existing) {
      return res.status(409).json({
        error: 'This keyword already exists for the specified platform'
      })
    }

    const { data, error } = await db
      .from('keywords')
      .insert({
        keyword,
        platform,
        is_active,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    logger.info(`New keyword created: ${keyword} for ${platform}`)
    res.status(201).json(data)
  } catch (error) {
    next(error)
  }
})

// PATCH /api/keywords/:id - Update keyword
router.patch('/:id', async (req, res, next) => {
  try {
    const updates = req.body

    const { data, error } = await db
      .from('keywords')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Keyword not found' })
      }
      throw error
    }

    logger.info(`Keyword ${req.params.id} updated`, { updates })
    res.json(data)
  } catch (error) {
    next(error)
  }
})

// DELETE /api/keywords/:id - Delete keyword
router.delete('/:id', async (req, res, next) => {
  try {
    // Check if keyword has associated leads
    const { count, error: countError } = await db
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .contains('matched_keywords', [req.params.id])

    if (countError) throw countError

    if (count > 0) {
      return res.status(409).json({
        error: `Cannot delete keyword. It has ${count} associated leads.`,
        lead_count: count
      })
    }

    const { error } = await db
      .from('keywords')
      .delete()
      .eq('id', req.params.id)

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Keyword not found' })
      }
      throw error
    }

    logger.info(`Keyword ${req.params.id} deleted`)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

// POST /api/keywords/bulk - Bulk create keywords
router.post('/bulk', async (req, res, next) => {
  try {
    const { keywords, platform } = req.body

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({
        error: 'Keywords array is required and must not be empty'
      })
    }

    if (!platform) {
      return res.status(400).json({
        error: 'Platform is required'
      })
    }

    // Prepare keyword objects
    const keywordObjects = keywords.map(keyword => ({
      keyword,
      platform,
      is_active: true,
      created_at: new Date().toISOString()
    }))

    // Insert keywords, ignoring duplicates
    const { data, error } = await db
      .from('keywords')
      .insert(keywordObjects)
      .select()

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          error: 'Some keywords already exist',
          details: error.details
        })
      }
      throw error
    }

    logger.info(`Bulk created ${data.length} keywords for ${platform}`)
    res.status(201).json({
      created: data.length,
      keywords: data
    })
  } catch (error) {
    next(error)
  }
})

export default router