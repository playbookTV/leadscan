import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Chip,
  Card,
  CardBody
} from '@heroui/react';
import { Mail, Send, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  variables: string[];
}

interface EmailComposerProps {
  lead: any;
  isOpen: boolean;
  onClose: () => void;
  onSent?: () => void;
}

export default function EmailComposer({ lead, isOpen, onClose, onSent }: EmailComposerProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('initial-outreach');
  const [to, setTo] = useState(lead?.author_email || lead?.contact_info || '');
  const [subject, setSubject] = useState(`Re: ${lead?.project_type || 'Your project'}`);
  const [customData, setCustomData] = useState<any>({});
  const [previewMode, setPreviewMode] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  // Fetch available templates
  const { data: templates } = useQuery<EmailTemplate[]>({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const response = await api.get('/email/templates');
      return response.data;
    }
  });

  // Preview email mutation
  const previewEmail = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/email/preview/${selectedTemplate}`, {
        data: {
          leadName: lead?.author_name || 'there',
          postText: lead?.post_text,
          projectType: lead?.project_type,
          budget: lead?.budget_amount,
          ...customData
        }
      });
      return response.data;
    },
    onSuccess: (html) => {
      setPreviewHtml(html);
      setPreviewMode(true);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to preview email');
    }
  });

  // Send email mutation
  const sendEmail = useMutation({
    mutationFn: async () => {
      const response = await api.post('/email/send', {
        leadId: lead?.id,
        to,
        subject,
        template: selectedTemplate,
        data: {
          leadName: lead?.author_name || 'there',
          postText: lead?.post_text,
          projectType: lead?.project_type,
          budget: lead?.budget_amount,
          ...customData
        }
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Email sent successfully!', {
        description: `Email delivered to ${to}`,
        icon: <CheckCircle className="w-4 h-4" />
      });
      onSent?.();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to send email');
    }
  });

  const handleSend = () => {
    if (!to) {
      toast.error('Please enter a recipient email');
      return;
    }
    if (!subject) {
      toast.error('Please enter a subject');
      return;
    }
    sendEmail.mutate();
  };

  const selectedTemplateData = templates?.find(t => t.id === selectedTemplate);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onModalClose) => (
          <>
            <ModalHeader className="flex items-center gap-2">
              <Mail size={20} />
              Send Email to Lead
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                {/* Lead Info */}
                <Card>
                  <CardBody className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{lead?.author_name || 'Unknown'}</p>
                        <p className="text-sm text-default-500">{lead?.platform}</p>
                      </div>
                      <Chip color="primary" variant="flat">
                        Score: {lead?.final_score || lead?.score}/10
                      </Chip>
                    </div>
                  </CardBody>
                </Card>

                {/* Email Form */}
                {!previewMode ? (
                  <>
                    <Input
                      label="To"
                      type="email"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      placeholder="email@example.com"
                      startContent={<Mail className="w-4 h-4 text-default-400" />}
                      isRequired
                    />

                    <Input
                      label="Subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Email subject"
                      isRequired
                    />

                    <Select
                      label="Email Template"
                      selectedKeys={[selectedTemplate]}
                      onSelectionChange={(keys) => setSelectedTemplate(Array.from(keys)[0] as string)}
                    >
                      {templates?.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div>
                            <p className="font-medium">{template.name}</p>
                            <p className="text-xs text-default-500">{template.description}</p>
                          </div>
                        </SelectItem>
                      ))}
                    </Select>

                    {/* Template-specific fields */}
                    {selectedTemplate === 'follow-up' && (
                      <Input
                        label="Days Since Last Contact"
                        type="number"
                        value={customData.daysSince || '3'}
                        onChange={(e) => setCustomData({ ...customData, daysSince: e.target.value })}
                      />
                    )}

                    {selectedTemplate === 'proposal' && (
                      <>
                        <Input
                          label="Timeline"
                          value={customData.timeline || '2-3 weeks'}
                          onChange={(e) => setCustomData({ ...customData, timeline: e.target.value })}
                          placeholder="e.g., 2-3 weeks"
                        />
                        <Textarea
                          label="Deliverables (one per line)"
                          value={customData.deliverables?.join('\n') || ''}
                          onChange={(e) => setCustomData({
                            ...customData,
                            deliverables: e.target.value.split('\n').filter(Boolean)
                          })}
                          placeholder="Website design&#10;Development&#10;Testing&#10;Deployment"
                        />
                      </>
                    )}

                    {selectedTemplateData && (
                      <div className="text-sm text-default-500">
                        <p>Available variables: {selectedTemplateData.variables.join(', ')}</p>
                      </div>
                    )}
                  </>
                ) : (
                  /* Preview Mode */
                  <div className="border rounded-lg p-4 bg-default-50">
                    <div className="mb-3 pb-3 border-b">
                      <p className="text-sm text-default-600">To: {to}</p>
                      <p className="text-sm text-default-600">Subject: {subject}</p>
                    </div>
                    <div
                      className="email-preview"
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  </div>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              {!previewMode ? (
                <>
                  <Button
                    variant="light"
                    onPress={onModalClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    color="secondary"
                    variant="flat"
                    onPress={() => previewEmail.mutate()}
                    isLoading={previewEmail.isPending}
                  >
                    Preview
                  </Button>
                  <Button
                    color="primary"
                    onPress={handleSend}
                    isLoading={sendEmail.isPending}
                    startContent={!sendEmail.isPending && <Send size={16} />}
                  >
                    {sendEmail.isPending ? 'Sending...' : 'Send Email'}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="light"
                    onPress={() => setPreviewMode(false)}
                  >
                    Back to Edit
                  </Button>
                  <Button
                    color="primary"
                    onPress={handleSend}
                    isLoading={sendEmail.isPending}
                    startContent={!sendEmail.isPending && <Send size={16} />}
                  >
                    {sendEmail.isPending ? 'Sending...' : 'Send Email'}
                  </Button>
                </>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}