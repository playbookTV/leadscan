import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLead, useLeadAction, useAddNote } from '../hooks/useLeads';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  ArrowLeft,
  ExternalLink,
  User,
  Calendar,
  Hash,
  Target,
  MessageSquare,
  CheckCircle,
  XCircle,
  Trophy,
  X
} from 'lucide-react';
import {
  formatDateTime,
  formatRelativeTime,
  getScoreColor,
  getStatusColor,
  getStatusLabel,
  getPlatformIcon,
  getPlatformColor
} from '../lib/utils';

export function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [noteText, setNoteText] = useState('');

  const { data: lead, isLoading, error } = useLead(id);
  const leadAction = useLeadAction();
  const addNote = useAddNote();

  const handleAction = async (action: 'contact' | 'skip' | 'win' | 'lose' | 'review') => {
    if (!id) return;
    await leadAction.mutateAsync({ id, action });
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !noteText.trim()) return;
    await addNote.mutateAsync({ id, note: noteText });
    setNoteText('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading lead details...</div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error loading lead details</div>
      </div>
    );
  }

  const aiAnalysis = lead.ai_analysis ? JSON.parse(lead.ai_analysis) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/leads')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Leads
          </Button>
          <Badge className={getStatusColor(lead.status)}>
            {getStatusLabel(lead.status)}
          </Badge>
          <Badge className={getPlatformColor(lead.platform)}>
            {getPlatformIcon(lead.platform)} {lead.platform}
          </Badge>
        </div>
        <a
          href={lead.post_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
        >
          View Original Post
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lead info */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <User className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{lead.author_name}</h3>
                  {lead.author_handle && (
                    <p className="text-sm text-gray-500">@{lead.author_handle}</p>
                  )}
                  {lead.author_bio && (
                    <p className="mt-2 text-sm text-gray-600">{lead.author_bio}</p>
                  )}
                  {lead.author_followers && (
                    <p className="mt-1 text-sm text-gray-500">
                      {lead.author_followers.toLocaleString()} followers
                    </p>
                  )}
                  <a
                    href={lead.author_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    View Profile
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-2">Post Content</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{lead.post_text}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium text-gray-900">
                    {formatDateTime(lead.created_at)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatRelativeTime(lead.created_at)}
                  </p>
                </div>
                {lead.contacted_at && (
                  <div>
                    <p className="text-sm text-gray-500">Contacted</p>
                    <p className="font-medium text-gray-900">
                      {formatDateTime(lead.contacted_at)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis */}
          {aiAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle>AI Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Project Type</p>
                    <p className="font-medium text-gray-900">
                      {aiAnalysis.projectType || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Estimated Budget</p>
                    <p className="font-medium text-gray-900">
                      {aiAnalysis.estimatedBudget || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Timeline</p>
                    <p className="font-medium text-gray-900">
                      {aiAnalysis.timeline || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">AI Score</p>
                    <p className="font-medium text-gray-900">
                      {aiAnalysis.score || 0}/5
                    </p>
                  </div>
                </div>

                {aiAnalysis.summary && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Summary</p>
                    <p className="text-gray-700">{aiAnalysis.summary}</p>
                  </div>
                )}

                {aiAnalysis.technologies && aiAnalysis.technologies.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Technologies</p>
                    <div className="flex flex-wrap gap-2">
                      {aiAnalysis.technologies.map((tech: string) => (
                        <Badge key={tech} variant="info" size="sm">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {aiAnalysis.redFlags && aiAnalysis.redFlags.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Red Flags</p>
                    <ul className="list-disc list-inside text-sm text-red-600">
                      {aiAnalysis.redFlags.map((flag: string, i: number) => (
                        <li key={i}>{flag}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddNote} className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add a note..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <Button type="submit" disabled={!noteText.trim()}>
                    Add Note
                  </Button>
                </div>
              </form>

              {lead.notes ? (
                <div className="space-y-2">
                  {lead.notes.split('\n').map((note, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-md text-sm">
                      {note}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No notes yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Score */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-3xl font-bold ${getScoreColor(lead.final_score || lead.score || 0)}`}>
                  {lead.final_score || lead.score || 0}/10
                </div>
                <div className="mt-4 space-y-2">
                  {lead.quick_score !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Quick Score:</span>
                      <span className="font-medium">{lead.quick_score}/10</span>
                    </div>
                  )}
                  {lead.ai_score !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">AI Score:</span>
                      <span className="font-medium">{lead.ai_score}/5</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full"
                variant="primary"
                onClick={() => handleAction('contact')}
                disabled={lead.status === 'contacted'}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Contacted
              </Button>
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => handleAction('review')}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Review Later
              </Button>
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => handleAction('skip')}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Skip Lead
              </Button>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => handleAction('win')}
                  disabled={lead.status !== 'contacted'}
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Won
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleAction('lose')}
                  disabled={lead.status !== 'contacted'}
                >
                  <X className="w-4 h-4 mr-2" />
                  Lost
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">ID:</span>
                <span className="font-mono text-xs">{lead.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">Post ID:</span>
                <span className="font-mono text-xs">{lead.post_id}</span>
              </div>
              {lead.updated_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Updated:</span>
                  <span>{formatRelativeTime(lead.updated_at)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}