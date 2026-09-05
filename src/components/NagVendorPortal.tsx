'use client';

import { useEffect, useRef, useState } from 'react';

type VendorCategory = 'food' | 'liquor';

type Vendor = {
  id: string;
  operatorId: string;
  name: string;
  category: VendorCategory;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  notes: string | null;
  createdAt: string;
};

type SourceTag = { tag: 'verified' | 'estimated' | 'unverified'; source: string };

type VendorPhoto = {
  id: string;
  filename: string;
  storageBackend: 'r2' | 'neon-object-fallback' | 'memory';
  sourceTags: SourceTag[];
  createdAt: string;
};

const BLUE = '#0066ff';

const TAG_LABEL: Record<SourceTag['tag'], string> = {
  verified: 'Verified',
  estimated: 'Estimated',
  unverified: 'Unverified',
};

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const body = (await res.json()) as T & { success?: boolean; error?: string };
  if (!res.ok || body.success === false) {
    throw new Error(body.error || 'Request failed.');
  }
  return body;
}

export function NagVendorPortal() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<VendorCategory>('food');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [photosByVendor, setPhotosByVendor] = useState<Record<string, VendorPhoto[]>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function loadVendors() {
    try {
      const body = await fetchJson<{ vendors: Vendor[] }>('/api/nag/vendors');
      setVendors(body.vendors);
    } catch (err) {
      setFlash(err instanceof Error ? err.message : 'Could not load vendors.');
    }
  }

  useEffect(() => {
    void loadVendors();
  }, []);

  async function loadPhotos(vendorId: string) {
    try {
      const body = await fetchJson<{ photos: VendorPhoto[] }>(`/api/nag/vendors/${vendorId}/photos`);
      setPhotosByVendor((prev) => ({ ...prev, [vendorId]: body.photos }));
    } catch (err) {
      setFlash(err instanceof Error ? err.message : 'Could not load photos.');
    }
  }

  async function addVendor(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setFlash(null);
    try {
      await fetchJson('/api/nag/vendors', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          contactName: contactName || undefined,
          contactPhone: contactPhone || undefined,
        }),
      });
      setName('');
      setContactName('');
      setContactPhone('');
      await loadVendors();
    } catch (err) {
      setFlash(err instanceof Error ? err.message : 'Could not add vendor.');
    } finally {
      setBusy(false);
    }
  }

  async function uploadPhoto(vendorId: string) {
    const input = fileRefs.current[vendorId];
    const file = input?.files?.[0];
    if (!file) return;
    setBusy(true);
    setFlash(null);
    try {
      const form = new FormData();
      form.set('file', file);
      await fetchJson(`/api/nag/vendors/${vendorId}/photos`, { method: 'POST', body: form });
      if (input) input.value = '';
      await loadPhotos(vendorId);
    } catch (err) {
      setFlash(err instanceof Error ? err.message : 'Could not upload photo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-2xl">
        <p
          className="text-xs font-semibold uppercase tracking-[0.16em]"
          style={{ color: BLUE }}
        >
          Never 86&rsquo;d · Vendor portal
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Food &amp; liquor vendors</h1>
        <p className="mt-2 text-sm text-slate-600">
          Add a vendor, then attach delivery, invoice, or product photos. Every photo is
          source-tagged and tied to this vendor forever &mdash; nothing here is invented.
        </p>

        {flash && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {flash}
          </p>
        )}

        <form onSubmit={addVendor} className="mt-6 space-y-3 rounded-xl border border-slate-200 p-4">
          <div className="flex gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Vendor name"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              required
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as VendorCategory)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="food">Food</option>
              <option value="liquor">Liquor</option>
            </select>
          </div>
          <div className="flex gap-3">
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Contact name (optional)"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="Contact phone (optional)"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: BLUE }}
          >
            Add vendor
          </button>
        </form>

        <ul className="mt-8 space-y-4">
          {vendors.map((vendor) => (
            <li key={vendor.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{vendor.name}</p>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{vendor.category}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void loadPhotos(vendor.id)}
                  className="text-xs font-semibold"
                  style={{ color: BLUE }}
                >
                  View photos
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  ref={(el) => {
                    fileRefs.current[vendor.id] = el;
                  }}
                  className="text-xs"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void uploadPhoto(vendor.id)}
                  className="rounded-full border px-3 py-1 text-xs font-semibold disabled:opacity-50"
                  style={{ borderColor: BLUE, color: BLUE }}
                >
                  Upload photo
                </button>
              </div>

              {photosByVendor[vendor.id] && (
                <ul className="mt-3 space-y-1 text-xs text-slate-600">
                  {photosByVendor[vendor.id].length === 0 && <li>No photos yet.</li>}
                  {photosByVendor[vendor.id].map((photo) => (
                    <li key={photo.id} className="flex items-center justify-between">
                      <span>{photo.filename}</span>
                      <span className="text-slate-400">
                        {photo.sourceTags.map((t) => TAG_LABEL[t.tag]).join(', ')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
          {vendors.length === 0 && <li className="text-sm text-slate-500">No vendors yet.</li>}
        </ul>
      </div>
    </main>
  );
}
