'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  Search,
  Plus,
  MapPin,
  LayoutGrid,
  List,
  Share2,
  Globe,
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { AddPropertyModal } from '../../components/modals/AddPropertyModal';
import { SharePropertyModal } from '../../components/modals/SharePropertyModal';
import { api } from '../../lib/api';
import { formatPrice } from '../../lib/utils';
import { useAuth } from '../../lib/auth';

export default function PropertiesPage() {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [bhk, setBhk] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [sharingProperty, setSharingProperty] = useState<any | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['properties-list', search, propertyType, bhk, location, status],
    queryFn: () =>
      api.getProperties({
        search: search.trim() || undefined,
        propertyType: propertyType || undefined,
        bhk: bhk || undefined,
        location: location.trim() || undefined,
        status: status || undefined,
        limit: 50,
      }),
  });

  return (
    <AppLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
              <span>Property Inventory</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25">
                {data?.meta?.total || 0} Units
              </span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Active inventory catalog with real-time match integration
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-secondary border border-border">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'grid' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'list' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {isAdmin && (
              <button
                onClick={() => setAddModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Property</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 rounded-2xl bg-card border border-border luxury-card space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative sm:col-span-2">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search property title, neighborhood, address..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none focus:border-primary"
              >
                <option value="">All Types</option>
                <option value="Apartment">Apartment</option>
                <option value="Villa">Villa</option>
                <option value="Plot">Plot</option>
                <option value="Commercial">Commercial</option>
              </select>
            </div>

            <div>
              <select
                value={bhk}
                onChange={(e) => setBhk(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none focus:border-primary"
              >
                <option value="">All BHKs</option>
                <option value="1 BHK">1 BHK</option>
                <option value="2 BHK">2 BHK</option>
                <option value="3 BHK">3 BHK</option>
                <option value="4 BHK">4 BHK</option>
              </select>
            </div>

            <div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none focus:border-primary"
              >
                <option value="">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="RESERVED">Reserved</option>
                <option value="SOLD">Sold</option>
                <option value="RENTED">Rented</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content View: Grid or List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-72 rounded-3xl bg-card border border-border" />
            ))}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.data?.map((prop: any) => (
              <div
                key={prop.id}
                className="rounded-3xl bg-card border border-border luxury-card overflow-hidden shadow-sm flex flex-col justify-between group hover:border-accent transition-all"
              >
                <div>
                  <div className="h-48 w-full relative bg-secondary overflow-hidden">
                    <img
                      src={prop.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80'}
                      alt={prop.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Dark gradient overlay for adaptive contrast across all image brightness levels */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 pointer-events-none" />

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/65 backdrop-blur-md text-[10px] font-extrabold uppercase tracking-wider text-white border border-white/25 shadow-md">
                      {prop.status}
                    </div>

                    {/* Location & Map Overlay */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-1.5 pointer-events-auto">
                      <div className="px-3 py-1.5 rounded-xl bg-black/65 hover:bg-black/80 backdrop-blur-md text-xs font-bold text-white flex items-center gap-1.5 border border-white/25 shadow-lg transition-colors">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 drop-shadow" />
                        <span className="truncate drop-shadow tracking-wide capitalize">{prop.location}</span>
                      </div>
                      {prop.mapUrl && (
                        <a
                          href={prop.mapUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Open in Google Maps"
                          className="px-3 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 backdrop-blur-md text-[11px] font-bold text-white flex items-center gap-1.5 border border-white/25 shadow-lg transition-all shrink-0"
                        >
                          <Globe className="w-3.5 h-3.5 text-emerald-200" />
                          <span>Map</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="font-bold text-sm text-foreground line-clamp-1">{prop.title}</h3>
                      <div className="text-sm font-extrabold text-foreground font-mono mt-1">
                        {formatPrice(prop.price)}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-border text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase">Config</span>
                        <p className="font-semibold text-foreground">{prop.bhk || prop.propertyType}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase">Super Area</span>
                        <p className="font-semibold text-foreground">{prop.area} sq.ft</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase">Possession</span>
                        <p className="font-semibold text-success truncate">{prop.possession || 'Ready'}</p>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {prop.description || prop.address}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>{prop._count?.siteVisits || 0} visits conducted</span>
                  <button
                    type="button"
                    onClick={() => setSharingProperty(prop)}
                    className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold flex items-center gap-1.5 border border-border transition-all shadow-sm"
                  >
                    <Share2 className="w-3.5 h-3.5 text-accent" />
                    <span>Share to Lead</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-card border border-border luxury-card shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/60 border-b border-border text-muted-foreground uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Property</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Type / BHK</th>
                  <th className="py-3.5 px-4">Area</th>
                  <th className="py-3.5 px-4">Possession</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.data?.map((prop: any) => (
                  <tr key={prop.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-foreground">{prop.title}</td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <span>{prop.location}</span>
                        {prop.mapUrl && (
                          <a
                            href={prop.mapUrl}
                            target="_blank"
                            rel="noreferrer"
                            title="Open Google Maps"
                            className="text-primary dark:text-accent hover:underline"
                          >
                            <Globe className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      {formatPrice(prop.price)}
                    </td>
                    <td className="py-3.5 px-4 text-foreground">{prop.bhk || prop.propertyType}</td>
                    <td className="py-3.5 px-4 font-mono text-muted-foreground">{prop.area} sq.ft</td>
                    <td className="py-3.5 px-4 text-muted-foreground">{prop.possession || '—'}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-secondary text-foreground border border-border">
                        {prop.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSharingProperty(prop)}
                        className="px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-semibold text-xs flex items-center gap-1 ml-auto transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddPropertyModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={() => refetch()}
      />

      <SharePropertyModal
        isOpen={!!sharingProperty}
        property={sharingProperty}
        onClose={() => setSharingProperty(null)}
        onSuccess={() => refetch()}
      />
    </AppLayout>
  );
}
