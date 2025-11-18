import express from 'express'
import db from '../config/database.js'
import logger from '../utils/logger.js'

const router = express.Router()

// GET /api/leads - List leads with filters
router.get('/', async (req, res, next) => {
  try {
    const {
      platform,
      status,
      score_min,
      score_max,
      date_from,
      date_to,
      search,
      sort = 'created_at',
      order = 'desc',
      limit = 50,
      offset = 0
    } = req.query

    let query = db.from('leads').select('*', { count: 'exact' })

    // Apply filters
    if (platform) query = query.eq('platform', platform)
    if (status) query = query.eq('status', status)
    if (score_min) query = query.gte('score', score_min)
    if (score_max) query = query.lte('score', score_max)
    if (date_from) query = query.gte('created_at', date_from)
    if (date_to) query = query.lte('created_at', date_to)
    if (search) {
      query = query.or(`post_text.ilike.%${search}%,author_name.ilike.%${search}%,author_handle.ilike.%${search}%`)
    }

    // Sorting
    query = query.order(sort, { ascending: order === 'asc' })

    // Pagination
    query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1)

    const { data, error, count } = await query

    if (error) throw error

    res.json({
      data: data || [],
      pagination: {
        total: count || 0,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: count > parseInt(offset) + parseInt(limit)
      }
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/leads/stats/summary - Quick stats
router.get('/stats/summary', async (req, res, next) => {
  try {
    // Get total leads count
    const { count: totalCount, error: totalError } = await db
      .from('leads')
      .select('*', { count: 'exact', head: true })

    if (totalError) throw totalError

    // Get high priority leads (score >= 8)
    const { count: highPriorityCount, error: highPriorityError } = await db
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('score', 8)

    if (highPriorityError) throw highPriorityError

    // Get contacted leads
    const { count: contactedCount, error: contactedError } = await db
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'contacted')

    if (contactedError) throw contactedError

    // Get new leads (status = 'new')
    const { count: newCount, error: newError } = await db
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new')

    if (newError) throw newError

    res.json({
      total: totalCount || 0,
      high_priority: highPriorityCount || 0,
      contacted: contactedCount || 0,
      new_leads: newCount || 0
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/leads/:id - Get single lead
router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await db
      .from('leads')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Lead not found' })
      }
      throw error
    }

    res.json(data)
  } catch (error) {
    next(error)
  }
})

// PATCH /api/leads/:id - Update lead
router.patch('/:id', async (req, res, next) => {
  try {
    const updates = req.body

    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString()

    const { data, error } = await db
      .from('leads')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Lead not found' })
      }
      throw error
    }

    logger.info(`Lead ${req.params.id} updated`, { updates })
    res.json(data)
  } catch (error) {
    next(error)
  }
})

// POST /api/leads/:id/notes - Add note to lead
router.post('/:id/notes', async (req, res, next) => {
  try {
    const { note } = req.body

    if (!note) {
      return res.status(400).json({ error: 'Note content is required' })
    }

    // First get the current lead
    const { data: lead, error: fetchError } = await db
      .from('leads')
      .select('notes')
      .eq('id', req.params.id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Lead not found' })
      }
      throw fetchError
    }

    // Append to notes with timestamp
    const timestamp = new Date().toISOString()
    const newNote = `[${timestamp}] ${note}`
    const updatedNotes = lead.notes ? `${lead.notes}\n${newNote}` : newNote

    // Update the lead with new notes
    const { data, error } = await db
      .from('leads')
      .update({
        notes: updatedNotes,
        updated_at: timestamp
      })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error

    logger.info(`Note added to lead ${req.params.id}`)
    res.json(data)
  } catch (error) {
    next(error)
  }
})

// DELETE /api/leads/:id - Delete lead
router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await db
      .from('leads')
      .delete()
      .eq('id', req.params.id)

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Lead not found' })
      }
      throw error
    }

    logger.info(`Lead ${req.params.id} deleted`)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

export default router