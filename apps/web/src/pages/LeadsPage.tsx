import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Card,
  CardBody,
  Input,
  Select,
  SelectItem,
  Chip,
  Button,
  Pagination,
} from '@heroui/react'
import { supabase, Lead } from '@/lib/supabase'
import { Search, Filter, Download, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [scoreFilter, setScoreFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const leadsPerPage = 20

  useEffect(() => {
    fetchLeads()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [leads, searchQuery, platformFilter, statusFilter, scoreFilter])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setLeads(data || [])
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...leads]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (lead) =>
          lead.post_text.toLowerCase().includes(query) ||
          lead.author_name?.toLowerCase().includes(query) ||
          lead.author_handle?.toLowerCase().includes(query)
      )
    }

    // Platform filter
    if (platformFilter !== 'all') {
      filtered = filtered.filter((lead) => lead.platform === platformFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((lead) => lead.status === statusFilter)
    }

    // Score filter
    if (scoreFilter !== 'all') {
      if (scoreFilter === 'high') {
        filtered = filtered.filter((lead) => lead.score >= 8)
      } else if (scoreFilter === 'medium') {
        filtered = filtered.filter((lead) => lead.score >= 6 && lead.score < 8)
      } else if (scoreFilter === 'low') {
        filtered = filtered.filter((lead) => lead.score < 6)
      }
    }

    setFilteredLeads(filtered)
    setCurrentPage(1)
  }

  const getScoreColor = (score: number) => {
    if (score >= 9) return 'danger'
    if (score >= 8) return 'warning'
    if (score >= 6) return 'primary'
    return 'default'
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, any> = {
      new: 'default',
      reviewed: 'primary',
      contacted: 'secondary',
      responded: 'success',
      negotiating: 'warning',
      won: 'success',
      lost: 'danger',
      ignored: 'default',
    }
    return colors[status] || 'default'
  }

  const getPlatformIcon = (platform: string) => {
    return platform === 'twitter' ? '𝕏' : '💼'
  }

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage)
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * leadsPerPage,
    currentPage * leadsPerPage
  )

  const exportToCSV = () => {
    const headers = ['Date', 'Platform', 'Author', 'Text', 'Score', 'Status', 'Budget', 'URL']
    const rows = filteredLeads.map((lead) => [
      new Date(lead.created_at).toLocaleDateString(),
      lead.platform,
      lead.author_name || lead.author_handle,
      lead.post_text.replace(/"/g, '""'),
      lead.score,
      lead.status,
      lead.budget_amount || 'N/A',
      lead.post_url,
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leads</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : 'leads'} found
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            color="default"
            variant="flat"
            startContent={<RefreshCw className="w-4 h-4" />}
            onPress={fetchLeads}
          >
            Refresh
          </Button>
          <Button
            color="primary"
            variant="flat"
            startContent={<Download className="w-4 h-4" />}
            onPress={exportToCSV}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-sm">
        <CardBody className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startContent={<Search className="w-4 h-4 text-gray-400" />}
              variant="bordered"
              classNames={{
                input: 'text-sm',
              }}
            />
            <Select
              label="Platform"
              selectedKeys={[platformFilter]}
              onChange={(e) => setPlatformFilter(e.target.value)}
              variant="bordered"
              classNames={{
                label: 'text-sm',
              }}
            >
              <SelectItem key="all" value="all">All Platforms</SelectItem>
              <SelectItem key="twitter" value="twitter">Twitter</SelectItem>
              <SelectItem key="linkedin" value="linkedin">LinkedIn</SelectItem>
            </Select>
            <Select
              label="Status"
              selectedKeys={[statusFilter]}
              onChange={(e) => setStatusFilter(e.target.value)}
              variant="bordered"
              classNames={{
                label: 'text-sm',
              }}
            >
              <SelectItem key="all" value="all">All Status</SelectItem>
              <SelectItem key="new" value="new">New</SelectItem>
              <SelectItem key="contacted" value="contacted">Contacted</SelectItem>
              <SelectItem key="responded" value="responded">Responded</SelectItem>
              <SelectItem key="won" value="won">Won</SelectItem>
              <SelectItem key="lost" value="lost">Lost</SelectItem>
            </Select>
            <Select
              label="Score"
              selectedKeys={[scoreFilter]}
              onChange={(e) => setScoreFilter(e.target.value)}
              variant="bordered"
              classNames={{
                label: 'text-sm',
              }}
            >
              <SelectItem key="all" value="all">All Scores</SelectItem>
              <SelectItem key="high" value="high">High (8+)</SelectItem>
              <SelectItem key="medium" value="medium">Medium (6-7)</SelectItem>
              <SelectItem key="low" value="low">Low (&lt;6)</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Leads List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-lg">Loading leads...</div>
        </div>
      ) : paginatedLeads.length === 0 ? (
        <Card className="border-none shadow-sm">
          <CardBody className="p-12 text-center">
            <p className="text-gray-500">No leads found matching your filters.</p>
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedLeads.map((lead) => (
              <Link key={lead.id} to={`/leads/${lead.id}`}>
                <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                  <CardBody className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Main Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-3">
                          <span className="text-2xl">{getPlatformIcon(lead.platform)}</span>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <Chip size="sm" color={getScoreColor(lead.score)} variant="flat">
                                {lead.score}/10
                              </Chip>
                              {lead.has_budget && (
                                <Chip size="sm" color="success" variant="flat">
                                  💰 {lead.budget_amount || 'Budget'}
                                </Chip>
                              )}
                              {lead.has_urgency && (
                                <Chip size="sm" color="danger" variant="flat">
                                  ⚡ Urgent
                                </Chip>
                              )}
                              {lead.technologies && lead.technologies.length > 0 && (
                                <Chip size="sm" color="primary" variant="flat">
                                  🛠️ {lead.technologies.slice(0, 2).join(', ')}
                                </Chip>
                              )}
                            </div>
                            <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2 mb-2">
                              {lead.post_text}
                            </h3>
                            {lead.ai_summary && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                🤖 {lead.ai_summary}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="font-medium">{lead.author_name || lead.author_handle}</span>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(lead.posted_at), { addSuffix: true })}</span>
                          {lead.author_followers_count > 0 && (
                            <>
                              <span>•</span>
                              <span>{lead.author_followers_count.toLocaleString()} followers</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex sm:flex-col gap-2 sm:items-end">
                        <Chip
                          size="sm"
                          variant="dot"
                          color={getStatusColor(lead.status)}
                        >
                          {lead.status}
                        </Chip>
                        {lead.project_value && (
                          <Chip size="sm" color="success" variant="flat">
                            ${(lead.project_value / 1000).toFixed(1)}k
                          </Chip>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination
                total={totalPages}
                page={currentPage}
                onChange={setCurrentPage}
                showControls
                color="primary"
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
