'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Search,
  User,
  Phone,
  Building,
  MapPin,
  IndianRupee,
  CheckCircle2,
  Send,
  ExternalLink,
  MessageSquare,
  Globe,
} from 'lucide-react';
import { api } from '../../lib/api';
import { formatPrice, formatBudgetRange } from '../../lib/utils';

interface SharePropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: any | null;
  onSuccess?: () => void;
}

export function SharePropertyModal({
  isOpen,
  onClose,
  property,
  onSuccess,
}: SharePropertyModalProps) {
  const [search, setSearch] = useState('');
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [customNote, setCustomNote] = useState('');

  useEffect(() => {
    if (isOpen && property) {
      setLoading(true);
      setSelectedLead(null);
      setSearch('');
      setCustomNote('');

      api.getLeads({ limit: 100 })
        .then((res) => {
          setLeads(res.data || []);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, property]);

  if (!isOpen || !property) return null;

  const filteredLeads = leads.filter((l) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    const name = (l.customer?.name || '').toLowerCase();
    const phone = (l.customer?.phone || '').toLowerCase();
    const loc = (l.requirement?.preferredLocation || '').toLowerCase();
    const bhk = (l.requirement?.bhk || '').toLowerCase();
    const propType = (l.requirement?.propertyType || '').toLowerCase();
    return (
      name.includes(q) ||
      phone.includes(q) ||
      loc.includes(q) ||
      bhk.includes(q) ||
      propType.includes(q)
    );
  });

  const generateWhatsAppText = () => {
    const custName = selectedLead?.customer?.name || 'Customer';
    const lines = [
      `Hello ${custName} 👋,`,
      ``,
      `Here are details of a property that matches your requirement:`,
      `🏡 *${property.title}*`,
      `📍 Location: ${property.location}`,
      `📐 Config: ${property.bhk || property.propertyType || ''} (${property.area} sq.ft)`,
      `💰 Price: ${formatPrice(property.price)}`,
      `🔑 Possession: ${property.possession || 'Ready to Move'}`,
      property.furnishing ? `🛋️ Furnishing: ${property.furnishing}` : '',
      property.mapUrl ? `🗺️ Location Map: ${property.mapUrl}` : '',
      property.description ? `\n✨ Highlights: ${property.description}` : '',
      customNote ? `\n📌 Note: ${customNote}` : '',
      ``,
      `Please let me know if you would like to schedule a site visit or receive more photos!`,
    ].filter(Boolean);

    return lines.join('\n');
  };

  const handleSendWhatsApp = async () => {
    if (!selectedLead) return;

    let rawPhone =
      selectedLead.customer?.whatsappNumber || selectedLead.customer?.phone || '';
    let cleanPhone = rawPhone.replace(/[^0-9]/g, '');

    // Default to Indian country code 91 if 10 digits
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    const message = generateWhatsAppText();
    const encoded = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`;

    // Record note on the lead that property was shared
    try {
      await api.createNote({
        customerId: selectedLead.customer?.id,
        leadId: selectedLead.id,
        content: `Shared property "${property.title}" (${property.location} - ${formatPrice(
          property.price,
        )}) with client via WhatsApp.`,
      });
    } catch (e) {
      // ignore
    }

    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div
        className="w-full max-w-3xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border bg-card/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-sm">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <span>Share Property via WhatsApp</span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Direct Lead Targeting
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Select a lead to automatically craft and dispatch customized property details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-5">
          {/* Property Being Shared Summary Card */}
          <div className="p-4 rounded-2xl bg-secondary/30 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-xl bg-secondary overflow-hidden shrink-0 border border-border">
                <img
                  src={
                    property.images?.[0]?.imageUrl ||
                    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80'
                  }
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground line-clamp-1">{property.title}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span className="text-primary font-extrabold font-mono">
                    {formatPrice(property.price)}
                  </span>
                  <span>•</span>
                  <span>{property.bhk || property.propertyType}</span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5">
                    <MapPin className="w-3 h-3 text-accent" />
                    {property.location}
                  </span>
                </div>
                {property.mapUrl && (
                  <div className="text-[11px] text-accent flex items-center gap-1 mt-1 font-mono">
                    <Globe className="w-3 h-3" />
                    <span className="truncate max-w-xs">{property.mapUrl}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="px-2.5 py-1 rounded-full bg-secondary text-[10px] font-bold uppercase tracking-wider text-muted-foreground border border-border">
                {property.status}
              </span>
            </div>
          </div>

          {/* Step 1: Select Target Lead */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-accent" />
                <span>1. Select Client / Lead to Receive Property</span>
              </label>
              <span className="text-[11px] text-muted-foreground">
                {filteredLeads.length} leads available
              </span>
            </div>

            {/* Lead Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search leads by customer name, phone number, BHK, preferred location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/40 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>

            {/* Leads List Box */}
            <div className="rounded-2xl border border-border bg-card/60 max-h-56 overflow-y-auto divide-y divide-border">
              {loading ? (
                <div className="p-6 text-center text-xs text-muted-foreground animate-pulse">
                  Loading leads directory...
                </div>
              ) : filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => {
                  const isSelected = selectedLead?.id === lead.id;
                  return (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-primary/10 border-l-4 border-primary'
                          : 'hover:bg-secondary/50'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-foreground">
                            {lead.customer?.name}
                          </span>
                          <span className="text-[11px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                            {lead.customer?.whatsappNumber || lead.customer?.phone}
                          </span>
                          <span
                            className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded badge-${lead.status.toLowerCase()}`}
                          >
                            {lead.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        {lead.requirement && (
                          <p className="text-[11px] text-muted-foreground">
                            Req: {lead.requirement.bhk || ''} {lead.requirement.propertyType} in{' '}
                            {lead.requirement.preferredLocation} (
                            {formatBudgetRange(
                              lead.requirement.minBudget,
                              lead.requirement.maxBudget,
                            )}
                            )
                          </p>
                        )}
                      </div>

                      <div className="shrink-0">
                        {isSelected ? (
                          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border border-border hover:border-foreground/40" />
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No leads matching search criteria.
                </div>
              )}
            </div>
          </div>

          {/* Optional Note to Append */}
          {selectedLead && (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <label className="block text-xs font-semibold text-foreground">
                Optional Personalized Note (Appended to Message)
              </label>
              <input
                type="text"
                placeholder="e.g. As discussed over call, this unit is on the 8th floor with pool view."
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-secondary/40 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
          )}

          {/* WhatsApp Message Preview */}
          {selectedLead && (
            <div className="space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  WhatsApp Message Preview
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Target: {selectedLead.customer?.name} ({selectedLead.customer?.whatsappNumber || selectedLead.customer?.phone})
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-secondary/50 border border-border text-foreground text-xs font-mono whitespace-pre-line shadow-inner max-h-48 overflow-y-auto leading-relaxed">
                {generateWhatsAppText()}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-border bg-card/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!selectedLead}
            onClick={handleSendWhatsApp}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            <span>
              {selectedLead
                ? `Send to ${selectedLead.customer?.name} on WhatsApp`
                : 'Select a Lead to Send'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
