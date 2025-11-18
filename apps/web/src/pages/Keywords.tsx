import React, { useState, useRef, useEffect } from 'react';
import {
  useKeywords,
  useCreateKeyword,
  useUpdateKeyword,
  useDeleteKeyword,
  useToggleKeyword
} from '../hooks/useKeywords';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { EmptyState } from '../components/ui/EmptyState';
import { KeywordForm, type KeywordFormData } from '../components/KeywordForm';
import { Plus, Pencil, Trash2, Power, Search, Key as KeyIcon, Filter, Download, HelpCircle } from 'lucide-react';
import type { Keyword } from '../lib/api';
import { exportToCSV, formatDateForExport } from '../utils/export';
import { useKeyboardShortcuts, isMac } from '../hooks/useKeyboardShortcuts';
import { HelpModal } from '../components/HelpModal';

export function Keywords() {
  const { data: keywords, isLoading, error } = useKeywords();
  const createKeyword = useCreateKeyword();
  const updateKeyword = useUpdateKeyword();
  const deleteKeyword = useDeleteKeyword();
  const toggleKeyword = useToggleKeyword();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<Keyword | null>(null);
  const [deletingKeyword, setDeletingKeyword] = useState<Keyword | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter keywords
  const filteredKeywords = keywords?.filter((keyword) => {
    const matchesSearch = keyword.keyword.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = filterPlatform === 'all' || keyword.platform === filterPlatform;
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && keyword.enabled) ||
      (filterStatus === 'inactive' && !keyword.enabled);
    return matchesSearch && matchesPlatform && matchesStatus;
  });

  const handleCreate = async (data: KeywordFormData) => {
    await createKeyword.mutateAsync(data);
    setIsCreateDialogOpen(false);
  };

  const handleUpdate = async (data: KeywordFormData) => {
    if (!editingKeyword) return;
    await updateKeyword.mutateAsync({
      id: editingKeyword.id,
      updates: data,
    });
    setEditingKeyword(null);
  };

  const handleDelete = async () => {
    if (!deletingKeyword) return;
    await deleteKeyword.mutateAsync(deletingKeyword.id);
    setDeletingKeyword(null);
  };

  const handleToggle = async (keyword: Keyword) => {
    await toggleKeyword.mutateAsync({
      id: keyword.id,
      enabled: !keyword.enabled,
    });
  };

  const handleExport = () => {
    if (!filteredKeywords || filteredKeywords.length === 0) {
      return;
    }

    const exportData = filteredKeywords.map((keyword) => ({
      id: keyword.id,
      keyword: keyword.keyword,
      platform: keyword.platform,
      enabled: keyword.enabled ? 'Yes' : 'No',
      leads_found: keyword.leads_found || 0,
      conversion_rate: keyword.conversion_rate ? `${keyword.conversion_rate}%` : '-',
      last_checked: keyword.last_checked || '-',
      created_at: formatDateForExport(keyword.created_at),
    }));

    exportToCSV(exportData, 'keywords');
  };

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrlKey: !isMac(),
      metaKey: isMac(),
      description: 'Add new keyword',
      action: () => setIsCreateDialogOpen(true),
    },
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
  ]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading keywords...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error loading keywords</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Keywords</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage search keywords for lead discovery
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
            disabled={!filteredKeywords || filteredKeywords.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Keyword
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
            </div>

            {/* Platform Filter */}
            <div>
              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Platforms</option>
                <option value="twitter">Twitter</option>
                <option value="linkedin">LinkedIn</option>
                <option value="both">Both</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keywords Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Keyword
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Platform
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leads Found
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversion Rate
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredKeywords && filteredKeywords.length > 0 ? (
                  filteredKeywords.map((keyword) => (
                    <tr key={keyword.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {keyword.keyword}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="default">{keyword.platform}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={keyword.enabled ? 'success' : 'default'}>
                          {keyword.enabled ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {keyword.leads_found || 0}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {keyword.conversion_rate ? `${keyword.conversion_rate}%` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggle(keyword)}
                            className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${
                              keyword.enabled ? 'text-green-600' : 'text-gray-400'
                            }`}
                            title={keyword.enabled ? 'Disable' : 'Enable'}
                          >
                            <Power className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingKeyword(keyword)}
                            className="p-1.5 rounded hover:bg-gray-100 text-blue-600 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingKeyword(keyword)}
                            className="p-1.5 rounded hover:bg-gray-100 text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <EmptyState
                        icon={searchTerm || filterPlatform !== 'all' || filterStatus !== 'all' ? Filter : KeyIcon}
                        title={searchTerm || filterPlatform !== 'all' || filterStatus !== 'all'
                          ? 'No keywords match your filters'
                          : 'No keywords yet'}
                        description={searchTerm || filterPlatform !== 'all' || filterStatus !== 'all'
                          ? 'Try adjusting your search or filter criteria to find what you\'re looking for.'
                          : 'Keywords help you discover leads on Twitter and LinkedIn. Add your first keyword to start monitoring social platforms for business opportunities.'}
                        action={!(searchTerm || filterPlatform !== 'all' || filterStatus !== 'all') ? {
                          label: 'Add Your First Keyword',
                          onClick: () => setIsCreateDialogOpen(true),
                        } : undefined}
                        secondaryAction={searchTerm || filterPlatform !== 'all' || filterStatus !== 'all' ? {
                          label: 'Clear Filters',
                          onClick: () => {
                            setSearchTerm('');
                            setFilterPlatform('all');
                            setFilterStatus('all');
                          },
                        } : undefined}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        title="Add New Keyword"
      >
        <KeywordForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateDialogOpen(false)}
          isLoading={createKeyword.isPending}
        />
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingKeyword}
        onClose={() => setEditingKeyword(null)}
        title="Edit Keyword"
      >
        <KeywordForm
          keyword={editingKeyword || undefined}
          onSubmit={handleUpdate}
          onCancel={() => setEditingKeyword(null)}
          isLoading={updateKeyword.isPending}
        />
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingKeyword}
        onClose={() => setDeletingKeyword(null)}
        title="Delete Keyword"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete the keyword <strong>"{deletingKeyword?.keyword}"</strong>?
            This action cannot be undone.
          </p>
          {deletingKeyword && deletingKeyword.leads_found > 0 && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                This keyword has {deletingKeyword.leads_found} associated lead(s).
              </p>
            </div>
          )}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={() => setDeletingKeyword(null)}
              disabled={deleteKeyword.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleteKeyword.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteKeyword.isPending ? 'Deleting...' : 'Delete Keyword'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Help Modal */}
      <HelpModal open={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
    </div>
  );
}