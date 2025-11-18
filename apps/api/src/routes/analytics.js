import express from 'express'
import db from '../config/database.js'
import logger from '../utils/logger.js'

const router = express.Router()

// GET /api/analytics/overview - Last 30 days daily stats with comprehensive metrics
router.get('/overview', async (req, res, next) => {
  try {
    const { days = 30 } = req.query

    // Calculate date range
    const now = new Date()
    const startDate = new Date()
    startDate.setDate(now.getDate() - parseInt(days))

    // Get leads by platform
    const { data: platformStats, error: platformError } = await db
      .from('leads')
      .select('platform')
      .gte('created_at', startDate.toISOString())

    if (platformError) throw platformError

    // Count by platform
    const platformCounts = platformStats?.reduce((acc, lead) => {
      acc[lead.platform] = (acc[lead.platform] || 0) + 1
      return acc
    }, {}) || {}

    // Get leads by status
    const { data: statusStats, error: statusError } = await db
      .from('leads')
      .select('status')
      .gte('created_at', startDate.toISOString())

    if (statusError) throw statusError

    // Count by status
    const statusCounts = statusStats?.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1
      return acc
    }, {}) || {}

    // Get score distribution
    const { data: scoreStats, error: scoreError } = await db
      .from('leads')
      .select('score')
      .gte('created_at', startDate.toISOString())

    if (scoreError) throw scoreError

    // Create score distribution
    const scoreDistribution = {
      low: scoreStats?.filter(l => l.score < 4).length || 0,
      medium: scoreStats?.filter(l => l.score >= 4 && l.score < 7).length || 0,
      high: scoreStats?.filter(l => l.score >= 7).length || 0
    }

    // Get daily lead counts and contacted counts for the period
    const { data: dailyLeads, error: dailyError } = await db
      .from('leads')
      .select('created_at, status, contacted_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (dailyError) throw dailyError

    // Group by date and status
    const dailyData = {}

    // Initialize all days in the range
    for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
      const dateKey = new Date(d).toISOString().split('T')[0]
      dailyData[dateKey] = { leads: 0, contacted: 0 }
    }

    // Count leads per day
    dailyLeads?.forEach(lead => {
      const date = new Date(lead.created_at).toISOString().split('T')[0]
      if (dailyData[date]) {
        dailyData[date].leads++
        if (['contacted', 'responded', 'converted'].includes(lead.status)) {
          dailyData[date].contacted++
        }
      }
    })

    // Get high priority leads and revenue data
    const { data: highPriorityLeads, error: highPriorityError } = await db
      .from('leads')
      .select('created_at, estimated_budget, status')
      .gte('score', 7)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (highPriorityError) throw highPriorityError

    // Get won deals and revenue
    const { data: wonDeals, error: wonError } = await db
      .from('leads')
      .select('created_at, estimated_budget, converted_at')
      .eq('status', 'converted')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (wonError) throw wonError

    // Enhanced daily data with more metrics
    const enhancedDailyData = {}

    // Initialize all days
    for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
      const dateKey = new Date(d).toISOString().split('T')[0]
      enhancedDailyData[dateKey] = {
        date: dateKey,
        total_leads: 0,
        high_priority: 0,
        contacted: 0,
        won: 0,
        revenue: 0
      }
    }

    // Add standard lead data
    dailyLeads?.forEach(lead => {
      const date = new Date(lead.created_at).toISOString().split('T')[0]
      if (enhancedDailyData[date]) {
        enhancedDailyData[date].total_leads++
        if (['contacted', 'responded', 'converted'].includes(lead.status)) {
          enhancedDailyData[date].contacted++
        }
      }
    })

    // Add high priority data
    highPriorityLeads?.forEach(lead => {
      const date = new Date(lead.created_at).toISOString().split('T')[0]
      if (enhancedDailyData[date]) {
        enhancedDailyData[date].high_priority++
      }
    })

    // Add won deals and revenue
    wonDeals?.forEach(deal => {
      const date = new Date(deal.created_at).toISOString().split('T')[0]
      if (enhancedDailyData[date]) {
        enhancedDailyData[date].won++
        // Parse budget
        if (deal.estimated_budget) {
          const budget = typeof deal.estimated_budget === 'string'
            ? parseFloat(deal.estimated_budget.replace(/[^0-9.-]/g, ''))
            : deal.estimated_budget
          enhancedDailyData[date].revenue += budget || 0
        }
      }
    })

    // Convert to array format for charts
    const chartData = Object.values(enhancedDailyData).sort((a, b) =>
      new Date(a.date) - new Date(b.date)
    )

    res.json(chartData)
  } catch (error) {
    next(error)
  }
})

// GET /api/analytics/funnel - Conversion funnel
router.get('/funnel', async (req, res, next) => {
  try {
    // Get counts for each stage
    const { count: totalLeads, error: totalError } = await db
      .from('leads')
      .select('*', { count: 'exact', head: true })

    if (totalError) throw totalError

    const { count: reviewedLeads, error: reviewedError } = await db
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'new')

    if (reviewedError) throw reviewedError

    const { count: contactedLeads, error: contactedError } = await db
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .in('status', ['contacted', 'responded', 'converted'])

    if (contactedError) throw contactedError

    const { count: respondedLeads, error: respondedError } = await db
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .in('status', ['responded', 'converted'])

    if (respondedError) throw respondedError

    const { count: convertedLeads, error: convertedError } = await db
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'converted')

    if (convertedError) throw convertedError

    // Return proper funnel format
    res.json({
      new: totalLeads || 0,
      reviewed: reviewedLeads || 0,
      contacted: contactedLeads || 0,
      responded: respondedLeads || 0,
      won: convertedLeads || 0
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/analytics/keywords - Keyword performance
router.get('/keywords', async (req, res, next) => {
  try {
    // Get all keywords
    const { data: keywords, error: keywordsError } = await db
      .from('keywords')
      .select('*')
      .order('created_at', { ascending: false })

    if (keywordsError) throw keywordsError

    // For each keyword, get lead stats
    const keywordPerformance = await Promise.all(
      keywords?.map(async (keyword) => {
        // Count leads that match this keyword
        const { count: leadCount, error: countError } = await db
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .contains('matched_keywords', [keyword.id])

        if (countError) {
          logger.error(`Error counting leads for keyword ${keyword.id}:`, countError)
          return null
        }

        // Get average score for leads matching this keyword
        const { data: scoreData, error: scoreError } = await db
          .from('leads')
          .select('score')
          .contains('matched_keywords', [keyword.id])

        if (scoreError) {
          logger.error(`Error getting scores for keyword ${keyword.id}:`, scoreError)
        }

        const avgScore = scoreData?.length > 0
          ? (scoreData.reduce((sum, l) => sum + l.score, 0) / scoreData.length).toFixed(1)
          : 0

        return {
          id: keyword.id,
          keyword: keyword.keyword,
          platform: keyword.platform,
          is_active: keyword.is_active,
          lead_count: leadCount || 0,
          average_score: parseFloat(avgScore),
          created_at: keyword.created_at
        }
      }) || []
    )

    // Filter out null results and sort by lead count
    const validResults = keywordPerformance
      .filter(k => k !== null)
      .sort((a, b) => b.lead_count - a.lead_count)

    res.json({
      total_keywords: validResults.length,
      active_keywords: validResults.filter(k => k.is_active).length,
      keywords: validResults
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/analytics/activity - Recent activity log
router.get('/activity', async (req, res, next) => {
  try {
    const { limit = 50 } = req.query

    // Get recent polling logs
    const { data: pollingLogs, error: pollingError } = await db
      .from('polling_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit))

    if (pollingError) throw pollingError

    // Get recent leads
    const { data: recentLeads, error: leadsError } = await db
      .from('leads')
      .select('id, platform, author_name, score, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (leadsError) throw leadsError

    // Combine and format activity
    const activity = []

    // Add polling logs
    pollingLogs?.forEach(log => {
      activity.push({
        type: 'polling',
        timestamp: log.created_at,
        platform: log.platform,
        status: log.status,
        message: `${log.status === 'success' ? 'Successfully polled' : 'Failed to poll'} ${log.platform}`,
        details: log.error_message || `Found ${log.leads_found || 0} leads`
      })
    })

    // Add new leads
    recentLeads?.forEach(lead => {
      activity.push({
        type: 'new_lead',
        timestamp: lead.created_at,
        platform: lead.platform,
        message: `New lead from ${lead.author_name}`,
        details: `Score: ${lead.score}/10`,
        lead_id: lead.id
      })
    })

    // Sort by timestamp
    activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    res.json({
      activity: activity.slice(0, parseInt(limit)),
      total_items: activity.length
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/analytics/platform-performance - Platform comparison
router.get('/platform-performance', async (req, res, next) => {
  try {
    const { period = '30d' } = req.query

    // Calculate date range
    const now = new Date()
    let startDate = new Date()

    switch(period) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Get platform-specific metrics
    const platforms = ['twitter', 'reddit']
    const platformMetrics = await Promise.all(
      platforms.map(async (platform) => {
        // Total leads
        const { count: totalLeads, error: totalError } = await db
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('platform', platform)
          .gte('created_at', startDate.toISOString())

        if (totalError) throw totalError

        // Contacted leads
        const { count: contactedLeads, error: contactedError } = await db
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('platform', platform)
          .in('status', ['contacted', 'responded', 'converted'])
          .gte('created_at', startDate.toISOString())

        if (contactedError) throw contactedError

        // Converted leads
        const { count: convertedLeads, error: convertedError } = await db
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('platform', platform)
          .eq('status', 'converted')
          .gte('created_at', startDate.toISOString())

        if (convertedError) throw convertedError

        // Average score
        const { data: scoreData, error: scoreError } = await db
          .from('leads')
          .select('score')
          .eq('platform', platform)
          .gte('created_at', startDate.toISOString())

        if (scoreError) throw scoreError

        const avgScore = scoreData?.length > 0
          ? (scoreData.reduce((sum, l) => sum + l.score, 0) / scoreData.length).toFixed(1)
          : 0

        // Response rate
        const responseRate = contactedLeads > 0
          ? ((convertedLeads / contactedLeads) * 100).toFixed(1)
          : 0

        return {
          platform,
          leads: totalLeads || 0,
          converted: convertedLeads || 0,
          rate: totalLeads > 0 ? parseFloat(((convertedLeads / totalLeads) * 100).toFixed(1)) : 0
        }
      })
    )

    res.json(platformMetrics)
  } catch (error) {
    next(error)
  }
})

// GET /api/analytics/timeline - Response time analysis
router.get('/timeline', async (req, res, next) => {
  try {
    // Get leads with response times
    const { data: leads, error } = await db
      .from('leads')
      .select('created_at, contacted_at, responded_at, status')
      .not('contacted_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    // Calculate response metrics
    const responseMetrics = leads?.map(lead => {
      const createdAt = new Date(lead.created_at)
      const contactedAt = lead.contacted_at ? new Date(lead.contacted_at) : null
      const respondedAt = lead.responded_at ? new Date(lead.responded_at) : null

      const timeToContact = contactedAt
        ? (contactedAt - createdAt) / (1000 * 60 * 60) // hours
        : null

      const timeToResponse = respondedAt && contactedAt
        ? (respondedAt - contactedAt) / (1000 * 60 * 60) // hours
        : null

      return {
        date: lead.created_at.split('T')[0],
        time_to_contact: timeToContact ? parseFloat(timeToContact.toFixed(1)) : null,
        time_to_response: timeToResponse ? parseFloat(timeToResponse.toFixed(1)) : null,
        status: lead.status
      }
    }) || []

    // Group by date and calculate averages
    const dailyMetrics = {}
    responseMetrics.forEach(metric => {
      if (!dailyMetrics[metric.date]) {
        dailyMetrics[metric.date] = {
          date: metric.date,
          avg_time_to_contact: [],
          avg_time_to_response: [],
          count: 0
        }
      }

      if (metric.time_to_contact !== null) {
        dailyMetrics[metric.date].avg_time_to_contact.push(metric.time_to_contact)
      }
      if (metric.time_to_response !== null) {
        dailyMetrics[metric.date].avg_time_to_response.push(metric.time_to_response)
      }
      dailyMetrics[metric.date].count++
    })

    // Calculate averages
    const timeline = Object.values(dailyMetrics).map(day => ({
      date: day.date,
      avg_time_to_contact: day.avg_time_to_contact.length > 0
        ? (day.avg_time_to_contact.reduce((a, b) => a + b, 0) / day.avg_time_to_contact.length).toFixed(1)
        : null,
      avg_time_to_response: day.avg_time_to_response.length > 0
        ? (day.avg_time_to_response.reduce((a, b) => a + b, 0) / day.avg_time_to_response.length).toFixed(1)
        : null,
      leads_contacted: day.count
    }))

    // Calculate overall averages
    const allContactTimes = responseMetrics
      .filter(m => m.time_to_contact !== null)
      .map(m => m.time_to_contact)

    const allResponseTimes = responseMetrics
      .filter(m => m.time_to_response !== null)
      .map(m => m.time_to_response)

    const overallAvgContact = allContactTimes.length > 0
      ? (allContactTimes.reduce((a, b) => a + b, 0) / allContactTimes.length).toFixed(1)
      : 0

    const overallAvgResponse = allResponseTimes.length > 0
      ? (allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length).toFixed(1)
      : 0

    res.json({
      timeline: timeline.slice(0, 30), // Last 30 days
      overall_metrics: {
        avg_time_to_contact_hours: parseFloat(overallAvgContact),
        avg_time_to_response_hours: parseFloat(overallAvgResponse),
        total_contacted: allContactTimes.length,
        total_responded: allResponseTimes.length
      }
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/analytics/score-distribution - Distribution of lead scores
router.get('/score-distribution', async (req, res, next) => {
  try {
    // Get all leads with scores
    const { data: leads, error } = await db
      .from('leads')
      .select('score')

    if (error) throw error

    // Create distribution buckets
    const distribution = [
      { score: '0-2', count: 0 },
      { score: '3-4', count: 0 },
      { score: '5-6', count: 0 },
      { score: '7-8', count: 0 },
      { score: '9-10', count: 0 }
    ]

    // Count leads in each bucket
    leads?.forEach(lead => {
      if (lead.score <= 2) distribution[0].count++
      else if (lead.score <= 4) distribution[1].count++
      else if (lead.score <= 6) distribution[2].count++
      else if (lead.score <= 8) distribution[3].count++
      else distribution[4].count++
    })

    res.json(distribution)
  } catch (error) {
    next(error)
  }
})

// GET /api/analytics/response-times - Average response times
router.get('/response-times', async (req, res, next) => {
  try {
    // Get leads with contact times
    const { data: leads, error } = await db
      .from('leads')
      .select('created_at, contacted_at, responded_at')
      .not('contacted_at', 'is', null)

    if (error) throw error

    // Calculate response time distributions
    const responseTimes = leads?.map(lead => {
      const createdAt = new Date(lead.created_at)
      const contactedAt = new Date(lead.contacted_at)
      const hoursToContact = (contactedAt - createdAt) / (1000 * 60 * 60)
      return hoursToContact
    }) || []

    // Calculate distributions
    const under1h = responseTimes.filter(h => h < 1).length
    const under24h = responseTimes.filter(h => h < 24).length
    const under48h = responseTimes.filter(h => h < 48).length
    const over48h = responseTimes.filter(h => h >= 48).length

    const avgHours = responseTimes.length > 0
      ? responseTimes.reduce((sum, h) => sum + h, 0) / responseTimes.length
      : 0

    res.json({
      avg_hours: parseFloat(avgHours.toFixed(1)),
      under_1h: under1h,
      under_24h: under24h,
      under_48h: under48h,
      over_48h: over48h,
      total_contacted: responseTimes.length,
      distribution_percentage: {
        under_1h: responseTimes.length > 0
          ? parseFloat(((under1h / responseTimes.length) * 100).toFixed(1))
          : 0,
        under_24h: responseTimes.length > 0
          ? parseFloat(((under24h / responseTimes.length) * 100).toFixed(1))
          : 0,
        under_48h: responseTimes.length > 0
          ? parseFloat(((under48h / responseTimes.length) * 100).toFixed(1))
          : 0,
        over_48h: responseTimes.length > 0
          ? parseFloat(((over48h / responseTimes.length) * 100).toFixed(1))
          : 0
      }
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/analytics/top-keywords - Best performing keywords
router.get('/top-keywords', async (req, res, next) => {
  try {
    const { limit = 10 } = req.query

    // Get all keywords with their performance metrics
    const { data: keywords, error: keywordsError } = await db
      .from('keywords')
      .select('*')
      .eq('is_active', true)

    if (keywordsError) throw keywordsError

    // Calculate performance for each keyword
    const keywordPerformance = await Promise.all(
      keywords?.map(async (keyword) => {
        // Get leads for this keyword
        const { data: leads, error: leadsError } = await db
          .from('leads')
          .select('score, status, estimated_budget')
          .contains('matched_keywords', [keyword.id])

        if (leadsError) {
          logger.error(`Error fetching leads for keyword ${keyword.id}:`, leadsError)
          return null
        }

        const totalLeads = leads?.length || 0
        const convertedLeads = leads?.filter(l => l.status === 'converted').length || 0
        const avgScore = totalLeads > 0
          ? (leads.reduce((sum, l) => sum + l.score, 0) / totalLeads).toFixed(1)
          : 0

        // Calculate total revenue (sum of estimated budgets for converted leads)
        const totalRevenue = leads
          ?.filter(l => l.status === 'converted' && l.estimated_budget)
          .reduce((sum, l) => {
            // Parse budget string to number
            const budget = typeof l.estimated_budget === 'string'
              ? parseFloat(l.estimated_budget.replace(/[^0-9.-]/g, ''))
              : l.estimated_budget
            return sum + (budget || 0)
          }, 0) || 0

        return {
          keyword: keyword.keyword,
          leads: totalLeads,
          converted: convertedLeads,
          revenue: totalRevenue
        }
      }) || []
    )

    // Filter out nulls and sort by total revenue
    const validKeywords = keywordPerformance
      .filter(k => k !== null)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, parseInt(limit))

    res.json(validKeywords)
  } catch (error) {
    next(error)
  }
})

export default router