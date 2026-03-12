/**
 * RoomBuilder.jsx — Treatment Room Configuration (Stitch design)
 * Route: /dashboard/rooms
 * Configure rooms, beds, equipment, modes, and allocation priority.
 * Wired to /rooms/business/{bid} API endpoints.
 */
import { useState, useEffect, useCallback } from 'react'
import { useBusiness } from '../../contexts/BusinessContext'
import api from '../../utils/api'
import AppLoader from '../../components/shared/AppLoader'
import {
  Plus, X, Trash2, Check
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════
// DESIGN TOKENS — Matched from Stitch Figma
// ═══════════════════════════════════════════════════════════════
const T = {
  bg: '#F5F5F0',
  card: '#FFFFFF',
  border: '#E8E8E3',
  borderLight: '#F0F0EB',
  black: '#111111',
  textSecondary: '#666666',
  textMuted: '#999999',
  gold: '#C9A84C',
  olive: '#5C6E30',
  dark: '#1A1A1A',
  radius: 16,
  radiusSm: 12,
  radiusPill: 24,
  font: "'Figtree', system-ui, -apple-system, sans-serif",
}

// Room card gradient headers (warm tones matching Stitch)
const GRADIENTS = [
  'linear-gradient(135deg, #E8DFD0 0%, #D4C9B5 100%)',
  'linear-gradient(135deg, #D0E0D4 0%, #B5CDB9 100%)',
  'linear-gradient(135deg, #D8D0E0 0%, #C5B9D0 100%)',
  'linear-gradient(135deg, #E0D8D0 0%, #D0C4B5 100%)',
]

const EQUIPMENT_LIST = [
  { id: 'medical_grade_laser', label: 'Medical Grade Laser', icon: '✦' },
  { id: 'steamer_unit', label: 'Steamer Unit', icon: '≋' },
  { id: 'led_panel', label: 'LED Panel', icon: '◐' },
  { id: 'microneedling_device', label: 'Microneedling Device', icon: '⊹' },
  { id: 'rf_device', label: 'RF Device', icon: '◈' },
  { id: 'cryotherapy_unit', label: 'Cryotherapy Unit', icon: '❄' },
  { id: 'extraction_lamp', label: 'Extraction Lamp', icon: '◉' },
  { id: 'magnifying_lamp', label: 'Magnifying Lamp', icon: '⊙' },
  { id: 'hot_towel_cabinet', label: 'Hot Towel Cabinet', icon: '▤' },
]

const EQUIPMENT_LABELS = Object.fromEntries(EQUIPMENT_LIST.map(e => [e.id, e.label]))
const EQUIPMENT_ICONS = Object.fromEntries(EQUIPMENT_LIST.map(e => [e.id, e.icon]))

// ═══════════════════════════════════════════════════════════════
// ICONS — Monochrome SVGs
// ═══════════════════════════════════════════════════════════════
const BedIcon = ({ color = T.gold, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <path d="M2 4v16" /><path d="M2 8h18a2 2 0 0 1 2 2v10" /><path d="M2 17h20" /><path d="M6 8v-2a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" />
  </svg>
)

const SoloIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
)

const DuoIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const GroupIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)


// ═══════════════════════════════════════════════════════════════
// ROOM CARD
// ═══════════════════════════════════════════════════════════════
function RoomCard({ room, index, isEditing, onClick }) {
  const gradient = GRADIENTS[index % GRADIENTS.length]

  return (
    <div
      onClick={onClick}
      style={{
        background: T.card,
        borderRadius: T.radius,
        overflow: 'hidden',
        cursor: 'pointer',
        border: isEditing ? `2px solid ${T.gold}` : `1px solid ${T.border}`,
        boxShadow: isEditing ? `0 0 0 2px ${T.gold}30` : 'none',
        transition: 'all 0.15s',
        position: 'relative',
      }}
    >
      {/* Gradient header */}
      <div style={{ background: gradient, padding: '24px 20px 20px', position: 'relative' }}>
        {isEditing && (
          <span style={{ position: 'absolute', top: 12, right: 12, padding: '3px 12px', borderRadius: T.radiusPill, background: T.olive, color: '#fff', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Editing</span>
        )}
        <div style={{ fontSize: 18, fontWeight: 800, color: T.black }}>{room.name}</div>
        {room.wing && <div style={{ fontSize: 11, fontWeight: 700, color: T.olive, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{room.wing}</div>}
      </div>

      {/* Details */}
      <div style={{ padding: '16px 20px' }}>
        {/* Beds + Priority */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 2 }}>
            {Array.from({ length: room.num_beds }, (_, i) => (
              <BedIcon key={i} />
            ))}
          </div>
          <span style={{ padding: '3px 10px', borderRadius: 6, background: T.dark, color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: 0.3 }}>
            PRIORITY #{room.solo_priority === 'low' ? 'Low' : room.solo_priority === 'last' ? 'Last' : room.solo_priority}
          </span>
        </div>

        {/* Mode badges */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
          {room.enabled_modes.map(mode => (
            <span key={mode} style={{ padding: '3px 10px', borderRadius: 6, background: T.olive, color: '#fff', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{mode}</span>
          ))}
        </div>

        {/* Equipment tags */}
        {room.equipment.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {room.equipment.map(eq => (
              <span key={eq} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: T.textSecondary }}>
                <span style={{ fontSize: 11 }}>{EQUIPMENT_ICONS[eq] || '•'}</span>
                {EQUIPMENT_LABELS[eq] || eq.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════
// ROOM INSPECTOR PANEL
// ═══════════════════════════════════════════════════════════════
function RoomInspector({ room, onUpdate, onDelete, onClose }) {
  const [name, setName] = useState(room.name)
  const [wing, setWing] = useState(room.wing || '')
  const [beds, setBeds] = useState(room.num_beds)
  const [modes, setModes] = useState(new Set(room.enabled_modes))
  const [priority, setPriority] = useState(room.solo_priority)
  const [equipment, setEquipment] = useState(new Set(room.equipment))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setName(room.name)
    setWing(room.wing || '')
    setBeds(room.num_beds)
    setModes(new Set(room.enabled_modes))
    setPriority(room.solo_priority)
    setEquipment(new Set(room.equipment))
  }, [room])

  const toggleMode = (m) => {
    const next = new Set(modes)
    if (next.has(m)) next.delete(m)
    else next.add(m)
    setModes(next)
  }

  const toggleEquip = (e) => {
    const next = new Set(equipment)
    if (next.has(e)) next.delete(e)
    else next.add(e)
    setEquipment(next)
  }

  const save = async () => {
    setSaving(true)
    await onUpdate(room.id, {
      name,
      wing,
      num_beds: beds,
      enabled_modes: [...modes],
      solo_priority: priority,
      equipment: [...equipment],
    })
    setSaving(false)
  }

  return (
    <div style={{ width: 320, borderLeft: `1px solid ${T.border}`, background: T.card, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' }}>Room Inspector</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => onDelete(room.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Trash2 size={16} color="#999" /></button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={16} color="#999" /></button>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

        {/* Room Identity */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Room Identity</label>
          <input
            value={name} onChange={e => setName(e.target.value)}
            style={{ width: '100%', padding: '12px 14px', borderRadius: T.radiusSm, border: `1.5px solid ${T.border}`, fontSize: 15, fontWeight: 600, fontFamily: T.font, outline: 'none', boxSizing: 'border-box', color: T.black }}
          />
          <input
            value={wing} onChange={e => setWing(e.target.value)} placeholder="Wing / Floor (e.g. Main Wing)"
            style={{ width: '100%', padding: '10px 14px', borderRadius: T.radiusSm, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font, outline: 'none', boxSizing: 'border-box', color: T.textSecondary, marginTop: 6 }}
          />
        </div>

        {/* Number of Beds */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Number of Beds</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {[1, 2, 3, 4].map(n => (
              <button key={n} onClick={() => setBeds(n)} style={{
                padding: '10px 0', borderRadius: T.radiusSm, fontSize: 15, fontWeight: 700, cursor: 'pointer',
                fontFamily: T.font, transition: 'all 0.15s',
                background: beds === n ? T.dark : T.card,
                color: beds === n ? '#fff' : T.textSecondary,
                border: beds === n ? `1.5px solid ${T.dark}` : `1.5px solid ${T.border}`,
              }}>{n}</button>
            ))}
          </div>
        </div>

        {/* Enabled Modes */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Enabled Modes</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {[
              { id: 'solo', label: 'SOLO', Icon: SoloIcon },
              { id: 'duo', label: 'DUO', Icon: DuoIcon },
              { id: 'group', label: 'GROUP', Icon: GroupIcon },
            ].map(m => {
              const active = modes.has(m.id)
              return (
                <button key={m.id} onClick={() => toggleMode(m.id)} style={{
                  padding: '10px 0', borderRadius: T.radiusSm, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                  fontFamily: T.font, transition: 'all 0.15s', textTransform: 'uppercase', letterSpacing: 0.3,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  background: active ? T.olive : T.card,
                  color: active ? '#fff' : T.textSecondary,
                  border: active ? `1.5px solid ${T.olive}` : `1.5px solid ${T.border}`,
                }}>
                  <m.Icon />
                  {m.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Solo Allocation Priority */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Solo Allocation Priority</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['1', '2', '3', 'low', 'last'].map(p => {
              const active = priority === p
              const label = p === 'low' ? 'Low' : p === 'last' ? 'Last' : `#${p}`
              return (
                <button key={p} onClick={() => setPriority(p)} style={{
                  padding: '6px 14px', borderRadius: T.radiusPill, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  fontFamily: T.font, transition: 'all 0.15s',
                  background: active ? T.olive : T.card,
                  color: active ? '#fff' : T.textSecondary,
                  border: active ? `1.5px solid ${T.olive}` : `1.5px solid ${T.border}`,
                }}>{label}</button>
              )
            })}
          </div>
        </div>

        {/* Installed Equipment */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Installed Equipment</label>
          {EQUIPMENT_LIST.map(eq => {
            const checked = equipment.has(eq.id)
            return (
              <div key={eq.id} onClick={() => toggleEquip(eq.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${T.borderLight}`, cursor: 'pointer' }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 6,
                  border: checked ? `2px solid ${T.olive}` : `2px solid ${T.border}`,
                  background: checked ? T.olive : T.card,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'all 0.15s',
                }}>
                  {checked && <Check size={13} color="#fff" strokeWidth={3} />}
                </div>
                <span style={{ fontSize: 13, color: T.black, flex: 1 }}>{eq.label}</span>
                <span style={{ fontSize: 14, color: T.textMuted }}>{eq.icon}</span>
              </div>
            )
          })}
        </div>

        {/* Save button */}
        <button onClick={save} disabled={saving} style={{
          width: '100%', padding: '12px 0', borderRadius: T.radiusSm, border: 'none',
          background: T.olive, color: '#fff', fontSize: 14, fontWeight: 700,
          cursor: saving ? 'wait' : 'pointer', fontFamily: T.font, opacity: saving ? 0.7 : 1,
        }}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function RoomBuilder() {
  const { business } = useBusiness()
  const bid = business?.id ?? business?._id

  const [loading, setLoading] = useState(true)
  const [rooms, setRooms] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)

  const loadRooms = useCallback(async () => {
    if (!bid) { setLoading(false); return }
    try {
      const res = await api.get(`/rooms/business/${bid}`)
      setRooms(res.rooms || [])
      setError(null)
    } catch (e) {
      console.error('Failed to load rooms:', e)
      // If 404 (no rooms endpoint yet) or empty, just show empty state
      setRooms([])
      setError(null)
    }
    setLoading(false)
  }, [bid])

  useEffect(() => { loadRooms() }, [loadRooms])

  const selectedRoom = rooms.find(r => r.id === selectedId) || null

  const createRoom = async () => {
    if (!bid || creating) return
    setCreating(true)
    try {
      const priorityMap = ['1', '2', '3', 'low', 'last']
      const priority = priorityMap[Math.min(rooms.length, priorityMap.length - 1)]
      const res = await api.post(`/rooms/business/${bid}`, {
        name: `Room ${rooms.length + 1}`,
        wing: '',
        num_beds: 1,
        enabled_modes: ['solo'],
        solo_priority: priority,
        equipment: [],
      })
      const newRoom = res.room
      setRooms([...rooms, newRoom])
      setSelectedId(newRoom.id)
    } catch (e) {
      console.error('Failed to create room:', e)
      alert('Failed to create room: ' + (e?.response?.data?.detail || e?.message || 'Unknown error'))
    }
    setCreating(false)
  }

  const updateRoom = async (roomId, data) => {
    if (!bid) return
    try {
      const res = await api.put(`/rooms/business/${bid}/${roomId}`, data)
      setRooms(rooms.map(r => r.id === roomId ? res.room : r))
    } catch (e) {
      console.error('Failed to update room:', e)
    }
  }

  const deleteRoom = async (roomId) => {
    if (!bid) return
    if (!window.confirm('Are you sure you want to remove this room?')) return
    try {
      await api.delete(`/rooms/business/${bid}/${roomId}`)
      setRooms(rooms.filter(r => r.id !== roomId))
      setSelectedId(null)
    } catch (e) {
      console.error('Failed to delete room:', e)
    }
  }

  if (loading) return <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AppLoader message="Loading rooms..." /></div>

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', display: 'flex' }}>

      {/* Main content */}
      <div style={{ flex: 1, padding: '24px 32px', overflow: 'auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: T.black, margin: '0 0 6px', fontFamily: T.font }}>Room Builder</h1>
          <p style={{ fontSize: 14, color: T.textSecondary, margin: 0, maxWidth: 400 }}>Configure layout, equipment, and allocation priorities for Reeve OS.</p>
        </div>

        {/* Room grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {rooms.map((room, i) => (
            <RoomCard
              key={room.id}
              room={room}
              index={i}
              isEditing={selectedId === room.id}
              onClick={() => setSelectedId(selectedId === room.id ? null : room.id)}
            />
          ))}

          {/* Add Room card */}
          <div
            onClick={createRoom}
            style={{
              minHeight: 180,
              borderRadius: T.radius,
              border: `2px dashed ${T.gold}`,
              background: `${T.gold}05`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
              cursor: creating ? 'wait' : 'pointer',
              transition: 'all 0.15s',
              opacity: creating ? 0.6 : 1,
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: `2px solid ${T.gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={20} color={T.gold} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: T.gold }}>Add Room</span>
          </div>
        </div>
      </div>

      {/* Inspector panel */}
      {selectedRoom && (
        <RoomInspector
          room={selectedRoom}
          onUpdate={updateRoom}
          onDelete={deleteRoom}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}
