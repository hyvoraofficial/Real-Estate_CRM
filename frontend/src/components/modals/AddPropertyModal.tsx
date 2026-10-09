'use client';

import React, { useState, useRef } from 'react';
import {
  Building2,
  X,
  Plus,
  Trash2,
  MapPin,
  Globe,
  UploadCloud,
  Image as ImageIcon,
  Sparkles,
  Check,
  Link,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../lib/api';

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const LUXURY_PRESETS = [
  {
    name: 'Luxury Apartment',
    category: 'Apartment',
    url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Private Villa',
    category: 'Villa',
    url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Sky Penthouse',
    category: 'Penthouse',
    url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Gated Villa Plot',
    category: 'Plot',
    url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Commercial Space',
    category: 'Office',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Modern Living',
    category: 'Interior',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
  },
];

export function AddPropertyModal({ isOpen, onClose, onSuccess }: AddPropertyModalProps) {
  const [title, setTitle] = useState('');
  const [propertyType, setPropertyType] = useState('Apartment');
  const [customPropertyType, setCustomPropertyType] = useState('');
  const [bhk, setBhk] = useState('2 BHK');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [mapUrl, setMapUrl] = useState('');
  const [price, setPrice] = useState('7500000');
  const [area, setArea] = useState('1200');
  const [furnishing, setFurnishing] = useState('Semi Furnished');
  const [possession, setPossession] = useState('Ready to Move');
  const [description, setDescription] = useState('');

  // Photo management state
  const [imageTab, setImageTab] = useState<'upload' | 'preset' | 'url'>('upload');
  const [imageUrl, setImageUrl] = useState(LUXURY_PRESETS[0].url);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, JPEG, WEBP)');
      return;
    }
    setError(null);
    setIsCompressing(true);
    setUploadedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress & scale to max 1400px width/height for fast transmission
        const canvas = document.createElement('canvas');
        const maxDim = 1400;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setImageUrl(dataUrl);
        } else {
          setImageUrl(event.target?.result as string);
        }
        setIsCompressing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim()) {
      setError('Please fill required fields (Title, Location)');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const finalPropertyType =
        propertyType === 'Other'
          ? (customPropertyType.trim() || 'Other')
          : propertyType;

      await api.createProperty({
        title: title.trim(),
        propertyType: finalPropertyType,
        bhk: propertyType === 'Plot' ? 'Plot' : bhk,
        location: location.trim(),
        address: address.trim() || undefined,
        mapUrl: mapUrl.trim() || undefined,
        price: Number(price),
        area: Number(area),
        furnishing,
        possession,
        description: description.trim() || undefined,
        images: imageUrl ? [imageUrl] : [],
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add property');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-border bg-card/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Add New Property to Inventory</h3>
              <p className="text-xs text-muted-foreground">Inventory Catalog</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[75vh] space-y-4">
          {error && <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">{error}</div>}

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Property Title / Project Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Prestige Lakeside Habitat - Luxury 2 BHK"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Property Type</label>
              <select
                value={propertyType}
                onChange={(e) => {
                  const val = e.target.value;
                  setPropertyType(val);
                  if (val === 'Other') {
                    setBhk('Other');
                    setFurnishing('Other');
                    setPossession('Other');
                  } else {
                    setCustomPropertyType('');
                    if (bhk === 'Other') setBhk('2 BHK');
                    if (furnishing === 'Other') setFurnishing('Semi Furnished');
                    if (possession === 'Other') setPossession('Ready to Move');
                  }
                }}
                className="w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border text-xs text-foreground focus:outline-none focus:border-primary"
              >
                <option value="Apartment">Apartment</option>
                <option value="Villa">Villa</option>
                <option value="Plot">Plot</option>
                <option value="Commercial">Commercial</option>
                <option value="Office">Office</option>
                <option value="Shop">Shop</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">BHK</label>
              <select
                value={bhk}
                onChange={(e) => setBhk(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border text-xs text-foreground focus:outline-none focus:border-primary"
              >
                <option value="1 BHK">1 BHK</option>
                <option value="2 BHK">2 BHK</option>
                <option value="2.5 BHK">2.5 BHK</option>
                <option value="3 BHK">3 BHK</option>
                <option value="4 BHK">4 BHK</option>
                <option value="Villa">Villa</option>
                <option value="Plot">Plot</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Price (₹)</label>
              <input
                type="number"
                required
                placeholder="7500000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border text-xs font-mono text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Area (Sq Ft)</label>
              <input
                type="number"
                required
                placeholder="1200"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border text-xs font-mono text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {propertyType === 'Other' && (
            <div className="p-3.5 rounded-xl bg-secondary/50 border border-accent/40 shadow-lg animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-foreground">
                  Specify Custom Property Type
                </label>
                <span className="text-[11px] text-muted-foreground font-normal">
                  Type a custom name or leave empty to keep as &quot;Other&quot;
                </span>
              </div>
              <input
                type="text"
                autoFocus
                placeholder="e.g. Penthouse, Studio, Farmhouse, Duplex, Warehouse, Agricultural Land..."
                value={customPropertyType}
                onChange={(e) => setCustomPropertyType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-medium"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Location / Neighborhood <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Whitefield, Electronic City, Sarjapur"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Full Address</label>
              <input
                type="text"
                placeholder="e.g. Varthur Main Road, Whitefield, Bengaluru"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-accent" />
                Google Maps Location URL / Pin Link
              </span>
              <span className="text-[11px] text-muted-foreground font-normal">Optional</span>
            </label>
            <input
              type="url"
              placeholder="e.g. https://maps.app.goo.gl/xyz or https://maps.google.com/?q=..."
              value={mapUrl}
              onChange={(e) => setMapUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Furnishing</label>
              <select
                value={furnishing}
                onChange={(e) => setFurnishing(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border text-xs text-foreground focus:outline-none"
              >
                <option value="Semi Furnished">Semi Furnished</option>
                <option value="Fully Furnished">Fully Furnished</option>
                <option value="Unfurnished">Unfurnished</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Possession</label>
              <select
                value={possession}
                onChange={(e) => setPossession(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border text-xs text-foreground focus:outline-none"
              >
                <option value="Ready to Move">Ready to Move</option>
                <option value="Within 3 Months">Within 3 Months</option>
                <option value="Within 6 Months">Within 6 Months</option>
                <option value="Under Construction">Under Construction</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* PROPERTY PHOTO MANAGEMENT SECTION */}
          <div className="space-y-2.5 p-4 rounded-2xl bg-secondary/30 border border-border">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-accent" />
                <span>Property Featured Photo</span>
              </label>

              {/* Selection Mode Tabs */}
              <div className="flex items-center gap-1 bg-secondary/80 p-0.5 rounded-lg border border-border text-[11px]">
                <button
                  type="button"
                  onClick={() => setImageTab('upload')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    imageTab === 'upload'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setImageTab('preset')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    imageTab === 'preset'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Luxury Presets
                </button>
                <button
                  type="button"
                  onClick={() => setImageTab('url')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    imageTab === 'url'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Web Link
                </button>
              </div>
            </div>

            {/* TAB 1: DIRECT FILE UPLOAD / DRAG & DROP */}
            {imageTab === 'upload' && (
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 sm:p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                    isDragging
                      ? 'border-primary bg-primary/10 scale-[0.99]'
                      : 'border-border hover:border-accent hover:bg-secondary/40'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Click to choose photo from your device, or drag and drop
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Supports JPG, PNG, WEBP, Camera roll photos (Auto-optimized)
                    </p>
                  </div>
                  {isCompressing && (
                    <div className="text-[11px] text-primary flex items-center gap-1 font-medium">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Optimizing photo...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: LUXURY PRESETS */}
            {imageTab === 'preset' && (
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground">
                  Choose a high-resolution architectural photo for instant catalog presentation:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {LUXURY_PRESETS.map((preset) => {
                    const isSelected = imageUrl === preset.url;
                    return (
                      <div
                        key={preset.name}
                        onClick={() => {
                          setImageUrl(preset.url);
                          setUploadedFileName(null);
                        }}
                        className={`group relative rounded-xl overflow-hidden cursor-pointer border transition-all h-20 ${
                          isSelected
                            ? 'border-primary ring-2 ring-primary/40 scale-[0.98]'
                            : 'border-border hover:border-accent'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-white truncate drop-shadow">
                            {preset.name}
                          </span>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: WEB URL */}
            {imageTab === 'url' && (
              <div className="space-y-1.5">
                <div className="relative">
                  <Link className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setUploadedFileName(null);
                    }}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary/40 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Paste any direct public image URL from the web.
                </p>
              </div>
            )}

            {/* LIVE PHOTO PREVIEW BOX */}
            {imageUrl && (
              <div className="pt-2 border-t border-border flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-secondary border border-border shrink-0">
                    <img
                      src={imageUrl}
                      alt="Property Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">
                      {uploadedFileName ? `Photo: ${uploadedFileName}` : 'Featured Image Selected'}
                    </p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> Ready for catalog
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-xs font-semibold text-foreground transition-colors shrink-0"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Description & Highlights</label>
            <textarea
              rows={3}
              placeholder="e.g. Stunning pool-facing 2 BHK flat on 12th floor with modular kitchen, premium fittings and covered car parking."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-border">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Add Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
