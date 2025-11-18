import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLeads, useLeadAction } from '../hooks/useLeads';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  Search,
  Filter,
  ExternalLink,
  MessageSquare,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';
import {
  formatRelativeTime,
  getScoreColor,
  getStatusColor,
  getStatusLabel,
  getPlatformIcon,
  truncateText
} from '../lib/utils';

export function Leads() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    search: '',
    platform: '',
    status: '',
    score_min: '',
  });
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, isLoading, error } = useLeads({
    ...filters,
    limit,
    offset: page * limit,
    sort: 'created_at',
    order: 'desc',
  });

  const leadAction = useLeadAction();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
  };

  const handleAction = async (leadId: string, action: 'contact' | 'skip' | 'review') => {
    await leadAction.mutateAsync({ id: leadId, action });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading leads...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error loading leads</div>
      </div>
    );
  }

  const leads = data?.data || [];
  const totalPages = Math.ceil((data?.pagination.total || 0) / limit);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leads</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage and track all your potential leads
          </p>
        </div>
        <Badge variant="info" size="lg">
          {data?.pagination.total || 0} Total Leads
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search leads..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Platform
              </label>
              <select
                value={filters.platform}
                onChange={(e) => setFilters({ ...filters, platform: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All</option>
                <option value="twitter">Twitter</option>
                <option value="linkedin">LinkedIn</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All</option>
                <option value="new">New</option>
                <option value="pending">Pending</option>
                <option value="contacted">Contacted</option>
                <option value="reviewing">Reviewing</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
                <option value="skipped">Skipped</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Score
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={filters.score_min}
                onChange={(e) => setFilters({ ...filters, score_min: e.target.value })}
                placeholder="0"
                className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <Button type="submit">
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Leads table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Platform
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/leads/${lead.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {lead.author_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {truncateText(lead.post_text, 100)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="default">
                        {getPlatformIcon(lead.platform)} {lead.platform}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreColor(lead.final_score || lead.score || 0)}`}>
                        {lead.final_score || lead.score || 0}/10
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getStatusColor(lead.status)}>
                        {getStatusLabel(lead.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatRelativeTime(lead.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAction(lead.id, 'contact')}
                          disabled={lead.status === 'contacted'}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAction(lead.id, 'skip')}
                          disabled={lead.status === 'skipped'}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                        <a
                          href={lead.post_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {page * limit + 1} to {Math.min((page + 1) * limit, data?.pagination.total || 0)} of{' '}
                {data?.pagination.total || 0} results
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages - 1}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}