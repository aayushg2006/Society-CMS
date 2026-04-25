'use client';

import { useEffect, useState } from 'react';
import { societyApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import toast, { Toaster } from 'react-hot-toast';

export default function BuildingsPage() {
  const { user } = useAuth();
  const [buildings, setBuildings] = useState<any[]>([]);
  const [flats, setFlats] = useState<any[]>([]);
  const [commonAreas, setCommonAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'buildings' | 'flats' | 'areas'>('buildings');

  // Modal states
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [showFlatModal, setShowFlatModal] = useState(false);
  const [showAreaModal, setShowAreaModal] = useState(false);

  // Form states
  const [buildingForm, setBuildingForm] = useState({ name: '', code: '', totalFloors: 1, hasLift: false });
  const [flatForm, setFlatForm] = useState({ buildingId: '', floorNumber: 1, flatNumber: '', type: '2BHK', intercomExtension: '' });
  const [areaForm, setAreaForm] = useState({ name: '', buildingId: '', floorNumber: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [bRes, fRes, aRes] = await Promise.all([
        societyApi.getBuildings(),
        societyApi.getFlats(),
        societyApi.getCommonAreas(),
      ]);
      if (bRes.data.success) setBuildings(bRes.data.data);
      if (fRes.data.success) setFlats(fRes.data.data);
      if (aRes.data.success) setCommonAreas(aRes.data.data);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBuilding = async () => {
    try {
      const res = await societyApi.createBuilding(buildingForm);
      if (res.data.success) {
        toast.success('Building created!');
        setShowBuildingModal(false);
        setBuildingForm({ name: '', code: '', totalFloors: 1, hasLift: false });
        loadData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create building');
    }
  };

  const handleCreateFlat = async () => {
    try {
      const res = await societyApi.createFlat({
        ...flatForm,
        buildingId: parseInt(flatForm.buildingId),
        floorNumber: parseInt(String(flatForm.floorNumber)),
      });
      if (res.data.success) {
        toast.success('Flat created!');
        setShowFlatModal(false);
        setFlatForm({ buildingId: '', floorNumber: 1, flatNumber: '', type: '2BHK', intercomExtension: '' });
        loadData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create flat');
    }
  };

  const handleCreateArea = async () => {
    try {
      const res = await societyApi.createCommonArea({
        name: areaForm.name,
        buildingId: areaForm.buildingId ? parseInt(areaForm.buildingId) : null,
        floorNumber: areaForm.floorNumber ? parseInt(areaForm.floorNumber) : null,
      });
      if (res.data.success) {
        toast.success('Common area created!');
        setShowAreaModal(false);
        setAreaForm({ name: '', buildingId: '', floorNumber: '' });
        loadData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create area');
    }
  };

  return (
    <div>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.08)' } }} />

      <div className="top-bar">
        <div>
          <h1 className="page-title">Buildings & Infrastructure</h1>
          <p className="page-subtitle">Manage buildings, flats, and common areas</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {[
          { key: 'buildings' as const, label: '🏢 Buildings', count: buildings.length },
          { key: 'flats' as const, label: '🏠 Flats', count: flats.length },
          { key: 'areas' as const, label: '📍 Common Areas', count: commonAreas.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={activeTab === tab.key ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : (
        <>
          {/* Buildings Tab */}
          {activeTab === 'buildings' && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <button onClick={() => setShowBuildingModal(true)} className="btn btn-primary btn-sm">
                  ➕ Add Building
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {buildings.map((b: any) => (
                  <div key={b.id} className="glass-card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 'var(--radius-md)',
                        background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 22
                      }}>🏢</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{b.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Code: {b.code}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
                      <span>🏗️ {b.totalFloors} floors</span>
                      <span>{b.hasLift ? '🛗 Lift' : '🚫 No lift'}</span>
                    </div>
                  </div>
                ))}
                {buildings.length === 0 && (
                  <div className="glass-card empty-state" style={{ gridColumn: '1 / -1' }}>
                    <div className="empty-state-icon">🏢</div>
                    <div className="empty-state-title">No buildings yet</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Flats Tab */}
          {activeTab === 'flats' && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <button onClick={() => setShowFlatModal(true)} className="btn btn-primary btn-sm">
                  ➕ Add Flat
                </button>
              </div>
              <div className="glass-card" style={{ padding: 4 }}>
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Flat No.</th>
                        <th>Building</th>
                        <th>Floor</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Intercom</th>
                      </tr>
                    </thead>
                    <tbody>
                      {flats.map((f: any) => (
                        <tr key={f.id}>
                          <td style={{ fontWeight: 600 }}>{f.flatNumber}</td>
                          <td>{f.building?.name || '-'}</td>
                          <td>{f.floorNumber}</td>
                          <td><span className="badge badge-medium">{f.type?.replace('_', '')}</span></td>
                          <td>
                            <span className={`badge ${(f.occupancyStatus || 'VACANT') === 'OCCUPIED' ? 'badge-resolved' : 'badge-open'}`}>
                              {f.occupancyStatus || 'VACANT'}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>{f.intercomExtension || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {flats.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-state-icon">🏠</div>
                    <div className="empty-state-title">No flats yet</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Common Areas Tab */}
          {activeTab === 'areas' && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <button onClick={() => setShowAreaModal(true)} className="btn btn-primary btn-sm">
                  ➕ Add Common Area
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
                {commonAreas.map((a: any) => (
                  <div key={a.id} className="glass-card" style={{ padding: 20 }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>📍</div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{a.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {a.building?.name && `Building: ${a.building.name}`}
                      {a.floorNumber != null && ` • Floor ${a.floorNumber}`}
                    </div>
                  </div>
                ))}
                {commonAreas.length === 0 && (
                  <div className="glass-card empty-state" style={{ gridColumn: '1 / -1' }}>
                    <div className="empty-state-icon">📍</div>
                    <div className="empty-state-title">No common areas yet</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Building Modal */}
      {showBuildingModal && (
        <div className="modal-overlay" onClick={() => setShowBuildingModal(false)}>
          <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Add Building</h3>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" placeholder="e.g., Tower A" value={buildingForm.name}
                onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Code</label>
              <input className="form-input" placeholder="e.g., A" value={buildingForm.code}
                onChange={(e) => setBuildingForm({ ...buildingForm, code: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Total Floors</label>
                <input type="number" className="form-input" min={1} value={buildingForm.totalFloors}
                  onChange={(e) => setBuildingForm({ ...buildingForm, totalFloors: parseInt(e.target.value) })} />
              </div>
              <div className="form-group">
                <label className="form-label">Has Lift?</label>
                <select className="form-select" value={buildingForm.hasLift ? 'true' : 'false'}
                  onChange={(e) => setBuildingForm({ ...buildingForm, hasLift: e.target.value === 'true' })}>
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowBuildingModal(false)} className="btn btn-ghost">Cancel</button>
              <button onClick={handleCreateBuilding} className="btn btn-primary">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Flat Modal */}
      {showFlatModal && (
        <div className="modal-overlay" onClick={() => setShowFlatModal(false)}>
          <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Add Flat</h3>
            <div className="form-group">
              <label className="form-label">Building</label>
              <select className="form-select" value={flatForm.buildingId}
                onChange={(e) => setFlatForm({ ...flatForm, buildingId: e.target.value })}>
                <option value="">Select building</option>
                {buildings.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Flat Number</label>
                <input className="form-input" placeholder="e.g., 101" value={flatForm.flatNumber}
                  onChange={(e) => setFlatForm({ ...flatForm, flatNumber: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Floor</label>
                <input type="number" className="form-input" min={0} value={flatForm.floorNumber}
                  onChange={(e) => setFlatForm({ ...flatForm, floorNumber: parseInt(e.target.value) })} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={flatForm.type}
                  onChange={(e) => setFlatForm({ ...flatForm, type: e.target.value })}>
                  {['1BHK', '2BHK', '3BHK', '4BHK', 'STUDIO', 'PENTHOUSE'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Intercom</label>
                <input className="form-input" placeholder="Extension" value={flatForm.intercomExtension}
                  onChange={(e) => setFlatForm({ ...flatForm, intercomExtension: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowFlatModal(false)} className="btn btn-ghost">Cancel</button>
              <button onClick={handleCreateFlat} className="btn btn-primary">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Common Area Modal */}
      {showAreaModal && (
        <div className="modal-overlay" onClick={() => setShowAreaModal(false)}>
          <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Add Common Area</h3>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" placeholder="e.g., Swimming Pool" value={areaForm.name}
                onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Building (Optional)</label>
                <select className="form-select" value={areaForm.buildingId}
                  onChange={(e) => setAreaForm({ ...areaForm, buildingId: e.target.value })}>
                  <option value="">Society-wide</option>
                  {buildings.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Floor (Optional)</label>
                <input type="number" className="form-input" value={areaForm.floorNumber}
                  onChange={(e) => setAreaForm({ ...areaForm, floorNumber: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAreaModal(false)} className="btn btn-ghost">Cancel</button>
              <button onClick={handleCreateArea} className="btn btn-primary">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
