'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { dateTime } from '@/components/portal/format';
import { Badge, Button, Empty, ErrorNote, Loading, Notice, PageHead, Panel, Select, Table, Td } from '@/components/portal/ui';
import { listCustomers, listMessages, listTemplates, previewMessage, sendMessage } from '@/lib/portal/api';

const TONE = { Sent: 'blue', Delivered: 'green', Failed: 'red' } as const;

export default function MessagesPage() {
  const qc = useQueryClient();
  const [customerId, setCustomerId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const templates = useQuery({ queryKey: ['templates'], queryFn: listTemplates });
  const customers = useQuery({ queryKey: ['customers', ''], queryFn: () => listCustomers('') });
  const messages = useQuery({ queryKey: ['messages'], queryFn: listMessages });
  const preview = useQuery({ queryKey: ['preview', templateId, customerId], queryFn: () => previewMessage(templateId, customerId), enabled: !!templateId && !!customerId });
  const send = useMutation({
    mutationFn: () => sendMessage(customerId, templateId),
    onSuccess: async (m) => { setSentTo(m.customerName); await qc.invalidateQueries({ queryKey: ['messages'] }); },
  });
  const template = templates.data?.find((t) => t.id === templateId);
  const customer = customers.data?.find((c) => c.id === customerId);
  const blocked = template?.channel === 'WhatsApp' && customer && !customer.consentGiven ? `${customer.name} has not given consent for WhatsApp messages. Record consent in their file first.`
    : template?.channel === 'Email' && customer && !customer.email ? `${customer.name} has no email address.` : null;

  return (
    <>
      <PageHead title="Messages" sub="Company-approved templates, filled with the customer's details. WhatsApp only with consent." />
      <div className="grid gap-6 xl:grid-cols-[1fr_1.15fr]">
        <Panel title="Send a message">
          {sentTo && <Notice tone="green">Message sent to {sentTo}.</Notice>}
          <div className="grid gap-4">
            <Select label="Customer" value={customerId} onChange={(e) => { setCustomerId(e.target.value); setSentTo(null); }}>
              <option value="">Choose a customer</option>{customers.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Select label="Template" value={templateId} onChange={(e) => { setTemplateId(e.target.value); setSentTo(null); }}>
              <option value="">Choose a template</option>{templates.data?.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.channel})</option>)}
            </Select>
            {templateId && customerId && (
              <div>
                <p className="text-[14px] font-semibold text-ink">Preview</p>
                {preview.isLoading ? <Loading /> : <p className="mt-1.5 whitespace-pre-wrap rounded-xl bg-[#e7f6ee] px-4 py-3 text-[15px] text-ink">{preview.data}</p>}
              </div>
            )}
            {blocked && <p className="rounded-xl bg-[#fdf0db] px-4 py-3 text-[14.5px] text-[#7a4a08]">{blocked}</p>}
            <ErrorNote error={send.error ?? preview.error} />
            <div><Button disabled={!templateId || !customerId || !!blocked} busy={send.isPending} onClick={() => send.mutate()}>Send {template?.channel ?? 'message'}</Button></div>
          </div>
        </Panel>
        <div>
          <h2 className="mb-3 font-display text-[18px] font-semibold">Sent messages</h2>
          {messages.isLoading ? <Loading /> : (
            <Table head={['To', 'Template', 'Status', 'Sent']} empty={!messages.data?.length && <Empty title="Nothing sent yet" />}>
              {messages.data?.map((m) => (
                <tr key={m.id}>
                  <Td>{m.customerName}<span className="block text-[13px] text-muted">{m.channel}</span></Td>
                  <Td className="max-w-[260px]">{m.templateName}<span className="block truncate text-[13px] text-muted" title={m.text}>{m.text}</span></Td>
                  <Td><Badge tone={TONE[m.status]}>{m.status}</Badge></Td>
                  <Td className="whitespace-nowrap text-muted">{dateTime(m.sentAt)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </div>
      </div>
    </>
  );
}
