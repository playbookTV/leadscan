import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLeads, useLeadAction } from '../hooks/useLeads';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { HelpModal } from '../components/HelpModal';
import {
  Search,
  Filter,
  ExternalLink,
  MessageSquare,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  HelpCircle,
  Users
} from 'lucide-react';
import {
  formatRelativeTime,
  getScoreColor,
  getStatusColor,
  getStatusLabel,
  getPlatformIcon,
  truncateText
} from '../lib/utils';
import { exportToCSV, formatDateForExport, formatCurrencyForExport } from '../utils/export';
import { useKeyboardShortcuts, isMac } from '../hooks/useKeyboardShortcuts';
import BulkActions from '../components/BulkActions';
import { leads as leadsApi } from '../lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function Leads() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    search: '',
    platform: '',
    status: '',
    score_min: '',
  });
  const [page, setPage] = useState(0);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const limit = 20;
  const searchInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

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

  const handleExport = () => {
    if (!leads || leads.length === 0) return;

    const exportData = leads.map((lead) => ({
      id: lead.id,
      platform: lead.platform,
      author_name: lead.author_name,
      author_handle: lead.author_handle || '-',
      post_text: lead.post_text,
      final_score: lead.final_score || 0,
      status: getStatusLabel(lead.status),
      created_at: formatDateForExport(lead.created_at),
      contacted_at: lead.contacted_at ? formatDateForExport(lead.contacted_at) : '-',
      post_url: lead.post_url,
      notes: lead.notes || '-',
    }));

    exportToCSV(exportData, 'leads');
  };

  // Bulk operations mutation
  const bulkMutation = useMutation({
    mutationFn: ({ leadIds, action }: { leadIds: string[]; action: string }) =>
      leadsApi.bulk(leadIds, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setSelectedLeadIds([]);
      toast.success('Bulk operation completed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to perform bulk operation');
    },
  });

  const handleBulkAction = async (action: string) => {
    if (selectedLeadIds.length === 0) return;
    await bulkMutation.mutateAsync({ leadIds: selectedLeadIds, action });
  };

  const handleSelectAll = () => {
    if (selectedLeadIds.length === leads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(leads.map((lead) => lead.id));
    }
  };

  const handleSelectLead = (leadId: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(leadId)
        ? prev.filter((id) => id !== leadId)
        : [...prev, leadId]
    );
  };

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'f',
      ctrlKey: !isMac(),
      metaKey: isMac(),
      description: 'Focus search',
      action: () => searchInputRef.current?.focus(),
    },
    {
      key: 'e',
      ctrlKey: !isMac(),
      metaKey: isMac(),
      description: 'Export to CSV',
      action: handleExport,
    },
    {
      key: '/',
      ctrlKey: !isMac(),
      metaKey: isMac(),
      description: 'Show help',
      action: () => setIsHelpModalOpen(true),
    },
    {
      key: 'a',
      ctrlKey: !isMac(),
      metaKey: isMac(),
      description: 'Select all leads',
      action: () => handleSelectAll(),
    },
  ]);

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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Leads</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage and track all your potential leads
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsHelpModalOpen(true)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Keyboard shortcuts"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          <Button
            variant="secondary"
            onClick={handleExport}
            disabled={!leads || leads.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Badge variant="info" size="lg">
            {data?.pagination.total || 0} Total Leads
          </Badge>
        </div>
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
                  ref={searchInputRef}
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search leads..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-gray-100"
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
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedLeadIds.length === leads.length && leads.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
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
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {leads.length > 0 ? leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${selectedLeadIds.includes(lead.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  >
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedLeadIds.includes(lead.id)}
                        onChange={() => handleSelectLead(lead.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 cursor-pointer" onClick={() => navigate(`/leads/${lead.id}`)}>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {lead.author_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
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
                )) : (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <EmptyState
                        icon={filters.search || filters.platform || filters.status || filters.score_min ? Filter : Users}
                        title={filters.search || filters.platform || filters.status || filters.score_min
                          ? 'No leads match your filters'
                          : 'No leads yet'}
                        description={filters.search || filters.platform || filters.status || filters.score_min
                          ? 'Try adjusting your search criteria or filters to find what you\'re looking for.'
                          : 'Leads will appear here as they are discovered from your monitored keywords on Twitter and LinkedIn.'}
                        secondaryAction={filters.search || filters.platform || filters.status || filters.score_min ? {
                          label: 'Clear Filters',
                          onClick: () => {
                            setFilters({
                              search: '',
                              platform: '',
                              status: '',
                              score_min: '',
                            });
                            setPage(0);
                          },
                        } : undefined}
                      />
                    </td>
                  </tr>
                )}
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

      {/* Help Modal */}
      <HelpModal open={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />

      {/* Bulk Actions */}
      <BulkActions
        selectedCount={selectedLeadIds.length}
        onAction={handleBulkAction}
        onClear={() => setSelectedLeadIds([])}
        isProcessing={bulkMutation.isPending}
      />
    </div>
  );
}