import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { DialogFooter } from './ui/Dialog';
import type { Keyword } from '../lib/api';

interface KeywordFormProps {
  keyword?: Keyword;
  onSubmit: (data: KeywordFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface KeywordFormData {
  keyword: string;
  platform: 'twitter' | 'linkedin' | 'both';
  enabled: boolean;
}

export function KeywordForm({ keyword, onSubmit, onCancel, isLoading }: KeywordFormProps) {
  const [formData, setFormData] = useState<KeywordFormData>({
    keyword: keyword?.keyword || '',
    platform: keyword?.platform || 'both',
    enabled: keyword?.enabled ?? true,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof KeywordFormData, string>>>({});

  useEffect(() => {
    if (keyword) {
      setFormData({
        keyword: keyword.keyword,
        platform: keyword.platform,
        enabled: keyword.enabled,
      });
    }
  }, [keyword]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof KeywordFormData, string>> = {};

    if (!formData.keyword.trim()) {
      newErrors.keyword = 'Keyword is required';
    } else if (formData.keyword.trim().length < 2) {
      newErrors.keyword = 'Keyword must be at least 2 characters';
    } else if (formData.keyword.trim().length > 100) {
      newErrors.keyword = 'Keyword must be less than 100 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        ...formData,
        keyword: formData.keyword.trim(),
      });
    }
  };

  const handleChange = (field: keyof KeywordFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        {/* Keyword Input */}
        <div>
          <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-1">
            Keyword <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="keyword"
            value={formData.keyword}
            onChange={(e) => handleChange('keyword', e.target.value)}
            placeholder="e.g., looking for developer, need help with..."
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.keyword ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          {errors.keyword && (
            <p className="mt-1 text-sm text-red-600">{errors.keyword}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Enter the search term to monitor for lead opportunities
          </p>
        </div>

        {/* Platform Selection */}
        <div>
          <label htmlFor="platform" className="block text-sm font-medium text-gray-700 mb-1">
            Platform <span className="text-red-500">*</span>
          </label>
          <select
            id="platform"
            value={formData.platform}
            onChange={(e) => handleChange('platform', e.target.value as 'twitter' | 'linkedin' | 'both')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="both">Both (Twitter & LinkedIn)</option>
            <option value="twitter">Twitter Only</option>
            <option value="linkedin">LinkedIn Only</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Choose which platform(s) to monitor for this keyword
          </p>
        </div>

        {/* Enabled Toggle */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => handleChange('enabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={isLoading}
            />
            <span className="ml-2 text-sm text-gray-700">
              Enable keyword monitoring
            </span>
          </label>
          <p className="mt-1 ml-6 text-xs text-gray-500">
            Disabled keywords will not be included in lead searches
          </p>
        </div>
      </div>

      {/* Footer */}
      <DialogFooter>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (keyword ? 'Updating...' : 'Creating...') : (keyword ? 'Update Keyword' : 'Create Keyword')}
        </Button>
      </DialogFooter>
    </form>
  );
}
