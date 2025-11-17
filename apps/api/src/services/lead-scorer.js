import config from '../config/env.js';
import logger from '../utils/logger.js';
import { callOpenAI } from '../config/openai.js';
import { getDatabase } from '../config/database.js';

/**
 * Stage 1: Quick regex-based scoring (0-10 scale)
 * @param {string} postText - The text content of the post
 * @returns {Object} Score breakdown and total
 */
function calculateQuickScore(postText) {
  if (!postText || typeof postText !== 'string') {
    return { score: 0, breakdown: {} };
  }

  const text = postText.toLowerCase();
  let score = 0;
  const breakdown = {};

  // Budget signals (+3 points)
  const budgetPatterns = [
    /\$\d+k?/i,                          // $5000, $5k
    /budget[:\s]*\$?\d+/i,               // budget: $5000
    /\d+k?\s*(usd|dollars|eur|euros)/i, // 5000 USD
    /paid\s+(project|work|job)/i,       // paid project
    /hourly\s*rate/i,                   // hourly rate
    /fixed\s*price/i                    // fixed price
  ];
  if (budgetPatterns.some(pattern => pattern.test(text))) {
    score += 3;
    breakdown.budgetMentioned = true;
  }

  // Urgency signals (+2 points)
  const urgencyPatterns = [
    /asap/i,
    /urgent/i,
    /immediately/i,
    /right\s*away/i,
    /this\s*week/i,
    /today/i,
    /tomorrow/i,
    /deadline/i,
    /time\s*sensitive/i
  ];
  if (urgencyPatterns.some(pattern => pattern.test(text))) {
    score += 2;
    breakdown.urgencyDetected = true;
  }

  // Timeline mentioned (+1 point)
  const timelinePatterns = [
    /\d+\s*(days?|weeks?|months?)/i,
    /by\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    /timeline/i,
    /timeframe/i,
    /duration/i,
    /start\s*(date|time)/i,
    /deliver(y)?\s*(date|time)/i
  ];
  if (timelinePatterns.some(pattern => pattern.test(text))) {
    score += 1;
    breakdown.timelineMentioned = true;
  }

  // Contact method provided (+2 points)
  const contactPatterns = [
    /dm\s*me/i,
    /message\s*me/i,
    /contact\s*me/i,
    /reach\s*out/i,
    /email.*@/i,
    /send\s*(me\s*)?(a\s*)?(message|dm|email)/i,
    /interested\?/i,
    /reply\s*(here|below)/i
  ];
  if (contactPatterns.some(pattern => pattern.test(text))) {
    score += 2;
    breakdown.contactMethodProvided = true;
  }

  // Technology match (+1-2 points)
  const techPatterns = [
    // High value (+2)
    { pattern: /react|vue|angular|next\.?js|node\.?js/i, points: 2 },
    { pattern: /typescript|javascript|python|java\b/i, points: 2 },
    { pattern: /api|backend|frontend|full[\s-]?stack/i, points: 2 },
    { pattern: /saas|web\s*app|mobile\s*app/i, points: 2 },
    // Medium value (+1)
    { pattern: /wordpress|shopify|wix|squarespace/i, points: 1 },
    { pattern: /html|css|jquery/i, points: 1 },
    { pattern: /website|landing\s*page|e[\s-]?commerce/i, points: 1 }
  ];

  let techScore = 0;
  const techMatches = [];
  for (const tech of techPatterns) {
    if (tech.pattern.test(text)) {
      techScore = Math.max(techScore, tech.points);
      techMatches.push(tech.pattern.source);
    }
  }
  score += techScore;
  if (techMatches.length > 0) {
    breakdown.technologiesMatched = techMatches;
  }

  // Project type clarity (+1 point)
  const projectTypePatterns = [
    /looking\s*for\s*(a\s*)?(developer|designer|freelancer|agency)/i,
    /need\s*(a\s*)?(developer|designer|freelancer|help)/i,
    /hiring\s*(a\s*)?(developer|designer|freelancer)/i,
    /project\s*(description|details|requirements)/i,
    /scope\s*of\s*work/i,
    /deliverables/i
  ];
  if (projectTypePatterns.some(pattern => pattern.test(text))) {
    score += 1;
    breakdown.projectTypeClarity = true;
  }

  // Red flags (negative points)
  const redFlagPatterns = [
    { pattern: /\bfree\b/i, points: -2, flag: 'free' },
    { pattern: /unpaid/i, points: -3, flag: 'unpaid' },
    { pattern: /equity\s*only/i, points: -4, flag: 'equity_only' },
    { pattern: /exposure/i, points: -2, flag: 'exposure' },
    { pattern: /volunteer/i, points: -3, flag: 'volunteer' },
    { pattern: /intern(ship)?/i, points: -2, flag: 'internship' },
    { pattern: /rev(enue)?\s*share/i, points: -2, flag: 'revenue_share' },
    { pattern: /no\s*budget/i, points: -3, flag: 'no_budget' }
  ];

  const redFlags = [];
  for (const flag of redFlagPatterns) {
    if (flag.pattern.test(text)) {
      score += flag.points;
      redFlags.push(flag.flag);
    }
  }
  if (redFlags.length > 0) {
    breakdown.redFlags = redFlags;
  }

  // Ensure score stays within 0-10 range
  score = Math.max(0, Math.min(10, score));

  return {
    score,
    breakdown
  };
}

/**
 * Stage 2: AI Analysis using OpenAI
 * @param {Object} lead - The lead object with post text
 * @returns {Object} AI analysis results
 */
async function analyzeWithAI(lead) {
  try {
    if (!config.scoring.enableAiAnalysis) {
      logger.debug('AI analysis disabled by configuration');
      return null;
    }

    const systemPrompt = `You are a lead scoring assistant for a web development agency. Analyze the following social media post and determine if it's a legitimate business opportunity for web development services.

Score the lead from 0-5 where:
- 0: Not a lead (spam, unrelated, or no project)
- 1: Very poor lead (unclear, likely unpaid)
- 2: Poor lead (low budget, unclear requirements)
- 3: Average lead (some potential, needs clarification)
- 4: Good lead (clear project, reasonable budget likely)
- 5: Excellent lead (urgent, clear budget, perfect fit)

Extract the following information:
1. Score (0-5)
2. Brief summary (max 100 chars)
3. Project type (website, webapp, mobile, api, other)
4. Estimated budget (if mentioned or inferred)
5. Timeline (if mentioned)
6. Technologies mentioned
7. Red flags (if any)
8. Reasoning for the score`;

    const userPrompt = `Analyze this post:\n\n${lead.post_text}`;

    const response = await callOpenAI({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' },
      tools: [{
        type: 'function',
        function: {
          name: 'analyze_lead',
          description: 'Analyze and score a lead',
          parameters: {
            type: 'object',
            properties: {
              score: { type: 'number', minimum: 0, maximum: 5 },
              summary: { type: 'string', maxLength: 100 },
              projectType: { type: 'string', enum: ['website', 'webapp', 'mobile', 'api', 'ecommerce', 'other'] },
              estimatedBudget: { type: 'string', nullable: true },
              timeline: { type: 'string', nullable: true },
              technologies: { type: 'array', items: { type: 'string' } },
              redFlags: { type: 'array', items: { type: 'string' } },
              reasoning: { type: 'string' }
            },
            required: ['score', 'summary', 'projectType', 'reasoning']
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'analyze_lead' } }
    });

    // Extract the function call result
    const toolCall = response.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall || !toolCall.function) {
      throw new Error('Invalid AI response format');
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    logger.debug('AI analysis completed', {
      leadId: lead.id,
      aiScore: analysis.score,
      cost: response.cost
    });

    return {
      ...analysis,
      cost: response.cost
    };
  } catch (error) {
    logger.error('AI analysis failed', {
      error: error.message,
      leadId: lead.id
    });
    throw error;
  }
}

/**
 * Check if a lead is a duplicate
 * @param {Object} lead - The lead to check
 * @returns {Object|null} Duplicate lead if found
 */
async function checkDuplicate(lead) {
  try {
    const db = getDatabase();

    // Check by post_id (exact match)
    if (lead.post_id) {
      const { data: exactMatch } = await db
        .from('leads')
        .select('id, post_id, created_at')
        .eq('post_id', lead.post_id)
        .single();

      if (exactMatch) {
        logger.debug('Duplicate lead found by post_id', {
          leadId: lead.id,
          duplicateId: exactMatch.id,
          postId: lead.post_id
        });
        return exactMatch;
      }
    }

    // Check by text similarity (80%+ match from same author within 24 hours)
    if (lead.author_username && lead.post_text) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data: similarLeads } = await db
        .from('leads')
        .select('id, post_text, created_at, author_username')
        .eq('author_username', lead.author_username)
        .gte('created_at', twentyFourHoursAgo);

      if (similarLeads && similarLeads.length > 0) {
        for (const similar of similarLeads) {
          const similarity = calculateTextSimilarity(lead.post_text, similar.post_text);
          if (similarity >= 0.8) {
            logger.debug('Duplicate lead found by text similarity', {
              leadId: lead.id,
              duplicateId: similar.id,
              similarity: Math.round(similarity * 100) + '%'
            });
            return similar;
          }
        }
      }
    }

    return null;
  } catch (error) {
    logger.error('Error checking for duplicate lead', {
      error: error.message,
      leadId: lead.id
    });
    // Don't throw - allow lead to be processed even if duplicate check fails
    return null;
  }
}

/**
 * Calculate text similarity between two strings (Jaccard similarity)
 * @param {string} text1 - First text
 * @param {string} text2 - Second text
 * @returns {number} Similarity score between 0 and 1
 */
function calculateTextSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;

  // Convert to lowercase and split into words
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));

  // Calculate Jaccard similarity
  const intersection = new Set([...words1].filter(word => words2.has(word)));
  const union = new Set([...words1, ...words2]);

  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * Main scoring function that combines both stages
 * @param {Object} lead - The lead object to score
 * @returns {Object} Complete scoring results
 */
async function scoreLead(lead) {
  try {
    // Stage 1: Quick scoring
    const quickScoreResult = calculateQuickScore(lead.post_text);

    logger.debug('Quick score calculated', {
      leadId: lead.id,
      quickScore: quickScoreResult.score,
      breakdown: quickScoreResult.breakdown
    });

    // Initialize result object
    let result = {
      quickScore: quickScoreResult.score,
      quickScoreBreakdown: quickScoreResult.breakdown,
      aiScore: null,
      aiAnalysis: null,
      finalScore: quickScoreResult.score,
      shouldNotify: false
    };

    // Stage 2: AI analysis (only if quick score >= threshold)
    if (quickScoreResult.score >= config.scoring.aiAnalysisMinScore) {
      try {
        const aiAnalysis = await analyzeWithAI(lead);
        if (aiAnalysis) {
          result.aiScore = aiAnalysis.score;
          result.aiAnalysis = aiAnalysis;

          // Combine scores: weighted average (quick: 30%, AI: 70%)
          result.finalScore = Math.round(
            (quickScoreResult.score * 0.3 + aiAnalysis.score * 2 * 0.7) // AI score is 0-5, scale to 0-10
          );
        }
      } catch (aiError) {
        logger.error('AI analysis failed, using quick score only', {
          error: aiError.message,
          leadId: lead.id
        });
        // Continue with quick score only
      }
    }

    // Determine if notification should be sent
    result.shouldNotify = result.finalScore >= config.scoring.notificationMinScore;

    logger.info('Lead scoring completed', {
      leadId: lead.id,
      quickScore: result.quickScore,
      aiScore: result.aiScore,
      finalScore: result.finalScore,
      shouldNotify: result.shouldNotify
    });

    return result;
  } catch (error) {
    logger.error('Lead scoring failed', {
      error: error.message,
      leadId: lead.id
    });
    throw error;
  }
}

export {
  calculateQuickScore,
  analyzeWithAI,
  checkDuplicate,
  scoreLead,
  calculateTextSimilarity
};

export default {
  calculateQuickScore,
  analyzeWithAI,
  checkDuplicate,
  scoreLead,
  calculateTextSimilarity
};