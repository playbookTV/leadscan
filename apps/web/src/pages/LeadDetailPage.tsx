import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Button,
  Textarea,
  Select,
  SelectItem,
} from '@heroui/react'
import { supabase, Lead } from '@/lib/supabase'
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  DollarSign,
  Clock,
  User,
  TrendingUp,
  MessageSquare,
  Heart,
  Share2,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (id) {
      fetchLead()
    }
  }, [id])

  const fetchLead = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setLead(data)
      setNotes(data.notes || '')
      setStatus(data.status)
    } catch (error) {
      console.error('Error fetching lead:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!lead) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('leads')
        .update({
          status,
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id)

      if (error) throw error
      fetchLead()
    } catch (error) {
      console.error('Error updating lead:', error)
    } finally {
      setSaving(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 9) return 'danger'
    if (score >= 8) return 'warning'
    if (score >= 6) return 'primary'
    return 'default'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading lead...</div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-lg text-gray-600">Lead not found</div>
        <Link to="/leads">
          <Button color="primary">Back to Leads</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/leads">
          <Button isIconOnly variant="flat" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Lead Details</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Found {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
          </p>
        </div>
        <Button
          as="a"
          href={lead.post_url}
          target="_blank"
          color="primary"
          variant="flat"
          endContent={<ExternalLink className="w-4 h-4" />}
        >
          View Post
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Post Content */}
          <Card className="border-none shadow-sm">
            <CardHeader className="flex gap-3 px-6 py-4">
              <span className="text-3xl">{lead.platform === 'twitter' ? '𝕏' : '💼'}</span>
              <div className="flex flex-col flex-1">
                <h2 className="text-xl font-semibold">{lead.platform === 'twitter' ? 'Twitter' : 'LinkedIn'} Post</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Posted {format(new Date(lead.posted_at), 'PPpp')}
                </p>
              </div>
              <Chip size="lg" color={getScoreColor(lead.score)} variant="flat">
                Score: {lead.score}/10
              </Chip>
            </CardHeader>
            <CardBody className="px-6 pb-6">
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap mb-4">
                {lead.post_text}
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span>{lead.likes_count}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  <span>{lead.comments_count}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Share2 className="w-4 h-4" />
                  <span>{lead.shares_count}</span>
                </div>
                {lead.engagement_rate && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>{lead.engagement_rate.toFixed(2)}% engagement</span>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* AI Analysis */}
          {lead.ai_summary && (
            <Card className="border-none shadow-sm">
              <CardHeader className="px-6 py-4">
                <h3 className="text-lg font-semibold">🤖 AI Analysis</h3>
              </CardHeader>
              <CardBody className="px-6 pb-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Summary</p>
                  <p className="text-gray-900 dark:text-white">{lead.ai_summary}</p>
                </div>
                {lead.ai_confidence && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Confidence</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${lead.ai_confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-sm">{(lead.ai_confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                )}
                {lead.ai_red_flags && lead.ai_red_flags.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">⚠️ Red Flags</p>
                    <div className="flex flex-wrap gap-2">
                      {lead.ai_red_flags.map((flag, index) => (
                        <Chip key={index} size="sm" color="danger" variant="flat">
                          {flag}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* Notes */}
          <Card className="border-none shadow-sm">
            <CardHeader className="px-6 py-4">
              <h3 className="text-lg font-semibold">Notes</h3>
            </CardHeader>
            <CardBody className="px-6 pb-6">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add your notes about this lead..."
                minRows={4}
                variant="bordered"
              />
              <div className="mt-4 flex justify-end">
                <Button
                  color="primary"
                  onPress={handleSave}
                  isLoading={saving}
                >
                  Save Notes
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Author Info */}
          <Card className="border-none shadow-sm">
            <CardHeader className="px-6 py-4">
              <h3 className="text-lg font-semibold">Author</h3>
            </CardHeader>
            <CardBody className="px-6 pb-6 space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-medium">{lead.author_name || 'Unknown'}</p>
                  {lead.author_verified && <span className="text-blue-500">✓</span>}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Handle</p>
                <p className="font-medium mt-1">@{lead.author_handle}</p>
              </div>
              {lead.author_followers_count > 0 && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Followers</p>
                  <p className="font-medium mt-1">{lead.author_followers_count.toLocaleString()}</p>
                </div>
              )}
              {lead.author_location && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                  <p className="font-medium mt-1">{lead.author_location}</p>
                </div>
              )}
              {lead.author_bio && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Bio</p>
                  <p className="text-sm mt-1">{lead.author_bio}</p>
                </div>
              )}
              {lead.author_profile_url && (
                <Button
                  as="a"
                  href={lead.author_profile_url}
                  target="_blank"
                  color="primary"
                  variant="flat"
                  size="sm"
                  fullWidth
                  endContent={<ExternalLink className="w-4 h-4" />}
                >
                  View Profile
                </Button>
              )}
            </CardBody>
          </Card>

          {/* Lead Status */}
          <Card className="border-none shadow-sm">
            <CardHeader className="px-6 py-4">
              <h3 className="text-lg font-semibold">Status</h3>
            </CardHeader>
            <CardBody className="px-6 pb-6 space-y-4">
              <Select
                label="Lead Status"
                selectedKeys={[status]}
                onChange={(e) => setStatus(e.target.value)}
                variant="bordered"
              >
                <SelectItem key="new" value="new">New</SelectItem>
                <SelectItem key="reviewed" value="reviewed">Reviewed</SelectItem>
                <SelectItem key="contacted" value="contacted">Contacted</SelectItem>
                <SelectItem key="responded" value="responded">Responded</SelectItem>
                <SelectItem key="negotiating" value="negotiating">Negotiating</SelectItem>
                <SelectItem key="won" value="won">Won</SelectItem>
                <SelectItem key="lost" value="lost">Lost</SelectItem>
                <SelectItem key="ignored" value="ignored">Ignored</SelectItem>
              </Select>
              <Button
                color="primary"
                onPress={handleSave}
                isLoading={saving}
                fullWidth
              >
                Update Status
              </Button>
            </CardBody>
          </Card>

          {/* Project Details */}
          <Card className="border-none shadow-sm">
            <CardHeader className="px-6 py-4">
              <h3 className="text-lg font-semibold">Project Details</h3>
            </CardHeader>
            <CardBody className="px-6 pb-6 space-y-3">
              {lead.budget_amount && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-600" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Budget</p>
                    <p className="font-medium">{lead.budget_amount}</p>
                  </div>
                </div>
              )}
              {lead.timeline && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Timeline</p>
                    <p className="font-medium">{lead.timeline}</p>
                  </div>
                </div>
              )}
              {lead.project_type && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Type</p>
                    <p className="font-medium capitalize">{lead.project_type}</p>
                  </div>
                </div>
              )}
              {lead.technologies && lead.technologies.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Technologies</p>
                  <div className="flex flex-wrap gap-2">
                    {lead.technologies.map((tech, index) => (
                      <Chip key={index} size="sm" color="primary" variant="flat">
                        {tech}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
              <div className="pt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Budget Signal</span>
                  <Chip size="sm" color={lead.has_budget ? 'success' : 'default'} variant="flat">
                    {lead.has_budget ? 'Yes' : 'No'}
                  </Chip>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Urgency</span>
                  <Chip size="sm" color={lead.has_urgency ? 'danger' : 'default'} variant="flat">
                    {lead.has_urgency ? 'Yes' : 'No'}
                  </Chip>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Timeline Mentioned</span>
                  <Chip size="sm" color={lead.has_timeline ? 'success' : 'default'} variant="flat">
                    {lead.has_timeline ? 'Yes' : 'No'}
                  </Chip>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Contact Method</span>
                  <Chip size="sm" color={lead.has_contact_method ? 'success' : 'default'} variant="flat">
                    {lead.has_contact_method ? 'Yes' : 'No'}
                  </Chip>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
