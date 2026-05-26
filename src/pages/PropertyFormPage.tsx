// PAGE: PropertyFormPage
// CHANGES: Ambiance "Lin naturel" — fond #FAF7F2.
// Mode création : wizard 3 étapes (Type → Infos → Accès) avec indicateur de progression.
// Mode édition : sections dépliables, drag-and-drop pièces, bouton sauvegarder fixe.
// Récapitulatif étape 1 visible à l'étape 2. Chips de taille. Aperçu pièces générées.

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Plus, Trash2,
  Building, Home, GripVertical, Check,
  Zap, ChevronDown, ChevronUp
} from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { Input, Textarea, Select, Toggle, BottomSheet, Spinner, Toast, useToast } from '../components/ui'
import type { Room } from '../types'

// ─── Indicateur d'étapes ───────────────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  const steps = ['Type', 'Infos', 'Accès']
  return (
    <div className="flex items-center px-5 pb-5 flex-shrink-0">
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10"
                style={{
                  background: done ? '#6B9E78' : active ? '#fff' : '#FAF7F2',
                  border: done ? 'none' : active ? '2px solid #6B9E78' : '2px solid #EDE0D0',
                  color: done ? '#fff' : active ? '#6B9E78' : '#C4A882',
                }}
              >
                {done
                  ? <Check size={13} />
                  : i + 1}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider"
                style={{ color: done || active ? '#6B9E78' : '#C4A882' }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-1 mt-[-14px]"
                style={{ background: done ? '#6B9E78' : '#EDE0D0' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Étape 1 : Type ────────────────────────────────────────────────────────
function Step1({
  type, setType, size, setSize, hasTerrace, setHasTerrace, hasVeranda, setHasVeranda, onNext,
}: {
  type: string; setType: (v: string) => void
  size: string; setSize: (v: string) => void
  hasTerrace: boolean; setHasTerrace: (v: boolean) => void
  hasVeranda: boolean; setHasVeranda: (v: boolean) => void
  onNext: () => void
}) {
  const aptSizes = ['Studio', 'T2', 'T3', 'T4', 'T5', 'T6+']
  const generatedRooms = getGeneratedRooms(type, size, hasTerrace, hasVeranda)

  return (
    <>
      <div className="scroll-area px-5 pb-5">
        {/* Type */}
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3 pl-0.5"
          style={{ color: '#C4A882' }}>Type de bien</p>
        <div className="flex gap-3 mb-6">
          {[
            { val: 'apartment', label: 'Appartement', Icon: Building, iconBg: '#CCFBF1', iconColor: '#0D9488', selectedBorder: '#0D9488', selectedBg: '#F0FDFB', selectedText: '#0F766E' },
            { val: 'house',     label: 'Maison',       Icon: Home,     iconBg: '#DCFCE7', iconColor: '#6B9E78', selectedBorder: '#6B9E78', selectedBg: '#EEF4EF', selectedText: '#2C4A30' },
          ].map(opt => (
            <button key={opt.val} onClick={() => setType(opt.val)}
              className="flex-1 flex flex-col items-center gap-2.5 rounded-2xl py-5 px-3 transition-all"
              style={{
                background: type === opt.val ? opt.selectedBg : '#fff',
                border: `2px solid ${type === opt.val ? opt.selectedBorder : '#EDE0D0'}`,
              }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{
                  background: type === opt.val ? opt.iconBg : '#F5F0EA',
                  color: type === opt.val ? opt.iconColor : '#C4A882',
                }}>
                <opt.Icon size={22} />
              </div>
              <span className="text-sm font-bold"
                style={{ color: type === opt.val ? opt.selectedText : '#A8937A' }}>
                {opt.label}
              </span>
            </button>
          ))}
        </div>

        {/* Taille */}
        {type === 'apartment' && (
          <>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3 pl-0.5"
              style={{ color: '#C4A882' }}>Taille</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {aptSizes.map(s => (
                <button key={s} onClick={() => setSize(s)}
                  className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                  style={{
                    background: size === s ? '#F0FDFB' : '#fff',
                    border: `1.5px solid ${size === s ? '#0D9488' : '#EDE0D0'}`,
                    color: size === s ? '#0F766E' : '#A8937A',
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Options */}
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3 pl-0.5"
          style={{ color: '#C4A882' }}>Options</p>
        <div className="flex gap-2 mb-6">
          {[
            { val: hasTerrace, set: setHasTerrace, label: 'Terrasse', icon: '🌿' },
            { val: hasVeranda, set: setHasVeranda, label: 'Véranda',  icon: '🏠' },
          ].map(opt => (
            <button key={opt.label} onClick={() => opt.set(!opt.val)}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 transition-all"
              style={{
                background: opt.val ? '#EEF4EF' : '#fff',
                border: `1.5px solid ${opt.val ? '#6B9E78' : '#EDE0D0'}`,
              }}>
              <span>{opt.icon}</span>
              <span className="text-sm font-semibold"
                style={{ color: opt.val ? '#2C4A30' : '#A8937A' }}>
                {opt.label}
              </span>
            </button>
          ))}
        </div>

        {/* Aperçu pièces */}
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3 pl-0.5"
          style={{ color: '#C4A882' }}>Pièces générées</p>
        <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1px solid #EDE0D0' }}>
          <p className="text-xs font-bold mb-3" style={{ color: '#A8937A' }}>
            Aperçu automatique · {type === 'apartment' ? size : 'Maison'}
            {hasTerrace ? ' + Terrasse' : ''}{hasVeranda ? ' + Véranda' : ''}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {generatedRooms.map(room => (
              <span key={room} className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: '#F5F0EA', color: '#A8937A' }}>
                {room}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 flex gap-2.5 px-5 pt-3.5 pb-8"
        style={{ borderTop: '1px solid #EDE0D0', background: 'rgba(250,247,242,0.97)' }}>
        <button className="w-10 h-[50px] rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#fff', border: '1px solid #EDE0D0', color: '#A8937A' }}>
          <ArrowLeft size={18} />
        </button>
        <button onClick={onNext} disabled={!type}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white"
          style={{ background: type ? '#6B9E78' : '#EDE0D0', color: type ? '#fff' : '#C4A882' }}>
          Suivant <ArrowRight size={16} />
        </button>
      </div>
    </>
  )
}

// ─── Étape 2 : Infos ───────────────────────────────────────────────────────
function Step2({
  type, size, hasTerrace, hasVeranda,
  name, setName, address, setAddress,
  floor, setFloor, hasElevator, setHasElevator,
  bedroomCount, setBedroomCount, livingCount, setLivingCount,
  onBack, onNext,
}: any) {
  return (
    <>
      <div className="scroll-area px-5 pb-5">
        {/* Récap étape 1 */}
        <div className="flex items-center gap-3 rounded-2xl p-3.5 mb-5"
          style={{ background: '#fff', border: '1px solid #EDE0D0' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#CCFBF1', color: '#0D9488' }}>
            {type === 'apartment' ? <Building size={17} /> : <Home size={17} />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: '#2C1F0E' }}>
              {type === 'apartment' ? `Appartement ${size}` : 'Maison'}
              {hasTerrace ? ' · Terrasse' : ''}{hasVeranda ? ' · Véranda' : ''}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#A8937A' }}>
              {getGeneratedRooms(type, size, hasTerrace, hasVeranda).length} pièces générées
            </p>
          </div>
          <button onClick={onBack} className="text-xs font-semibold" style={{ color: '#6B9E78' }}>
            Modifier
          </button>
        </div>

        {/* Identité */}
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3 pl-0.5"
          style={{ color: '#C4A882' }}>Identité</p>
        <div className="flex flex-col gap-3 mb-6">
          <Input label="Nom du logement *" type="text" value={name}
            onChange={e => setName(e.target.value)} placeholder="Ex : Studio Croisette" />
          <Input label="Adresse" type="text" value={address}
            onChange={e => setAddress(e.target.value)} placeholder="Ex : 12 Bd de la Croisette, Cannes" />
        </div>

        {/* Localisation */}
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3 pl-0.5"
          style={{ color: '#C4A882' }}>Localisation immeuble</p>
        <div className="flex gap-3 mb-6">
          <div className="flex-1">
            <Input label="Étage" type="number" value={floor}
              onChange={e => setFloor(e.target.value)} placeholder="Ex : 3" />
          </div>
          <div className="flex-1 flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#A8937A' }}>
              Ascenseur
            </span>
            <div className="flex items-center justify-between rounded-2xl px-4 py-3.5"
              style={{ background: '#fff', border: '1px solid #EDE0D0' }}>
              <span className="text-sm" style={{ color: '#2C1F0E' }}>Oui</span>
              <Toggle label="" checked={hasElevator} onChange={setHasElevator} />
            </div>
          </div>
        </div>

        {/* Caractéristiques */}
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3 pl-0.5"
          style={{ color: '#C4A882' }}>Caractéristiques</p>
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <Input label="Chambres" type="number" value={bedroomCount}
              onChange={e => setBedroomCount(e.target.value)} placeholder="1" />
          </div>
          <div className="flex-1">
            <Input label="Salons" type="number" value={livingCount}
              onChange={e => setLivingCount(e.target.value)} placeholder="1" />
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 flex gap-2.5 px-5 pt-3.5 pb-8"
        style={{ borderTop: '1px solid #EDE0D0', background: 'rgba(250,247,242,0.97)' }}>
        <button onClick={onBack}
          className="w-10 h-[50px] rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#fff', border: '1px solid #EDE0D0', color: '#A8937A' }}>
          <ArrowLeft size={18} />
        </button>
        <button onClick={onNext} disabled={!name.trim()}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold"
          style={{ background: name.trim() ? '#6B9E78' : '#EDE0D0', color: name.trim() ? '#fff' : '#C4A882' }}>
          Suivant <ArrowRight size={16} />
        </button>
      </div>
    </>
  )
}

// ─── Étape 3 : Accès ───────────────────────────────────────────────────────
function Step3({
  buildingCode, setBuildingCode, doorCode, setDoorCode,
  keyBox, setKeyBox, keyBoxCode, setKeyBoxCode, keyInstructions, setKeyInstructions,
  linenLocation, setLinenLocation, dirtyLinenLocation, setDirtyLinenLocation,
  productsLocation, setProductsLocation, trashLocation, setTrashLocation,
  notes, setNotes, onBack, onSubmit, saving,
}: any) {
  return (
    <>
      <div className="scroll-area px-5 pb-5">

        {/* Codes accès */}
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3 pl-0.5"
          style={{ color: '#C4A882' }}>Codes d'accès</p>
        <div className="rounded-2xl overflow-hidden mb-6"
          style={{ background: '#fff', border: '1px solid #EDE0D0' }}>
          {[
            { label: 'Code immeuble', val: buildingCode, set: setBuildingCode, code: true,  placeholder: 'Ex : 4521' },
            { label: 'Code porte',    val: doorCode,     set: setDoorCode,     code: true,  placeholder: 'Ex : B12' },
            { label: 'Boîte à clés',  val: keyBox,       set: setKeyBox,       code: false, placeholder: 'Ex : Boîte verte, entrée' },
            { label: 'Code boîte',    val: keyBoxCode,   set: setKeyBoxCode,   code: true,  placeholder: 'Ex : 1234' },
            { label: 'Consignes clés',val: keyInstructions, set: setKeyInstructions, code: false, placeholder: 'Ex : Remettre après fermeture' },
          ].map((field, i, arr) => (
            <div key={field.label}
              className="flex flex-col gap-1.5 px-4 py-3"
              style={{ borderBottom: i < arr.length - 1 ? '1px solid #F5F0EA' : 'none' }}>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#C4A882' }}>
                {field.label}
              </span>
              <input
                value={field.val} onChange={e => field.set(e.target.value)}
                placeholder={field.placeholder}
                className="outline-none text-sm border-b pb-1"
                style={{
                  background: 'transparent',
                  borderBottom: '1.5px solid #EDE0D0',
                  color: '#2C1F0E',
                  fontFamily: field.code ? 'monospace' : 'inherit',
                  fontWeight: field.code ? 700 : 400,
                  letterSpacing: field.code ? '0.08em' : 'normal',
                  fontSize: field.code ? 16 : 14,
                }}
              />
            </div>
          ))}
        </div>

        {/* Matériel */}
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3 pl-0.5"
          style={{ color: '#C4A882' }}>Matériel</p>
        <div className="rounded-2xl overflow-hidden mb-6"
          style={{ background: '#fff', border: '1px solid #EDE0D0' }}>
          {[
            { label: 'Linge propre',    val: linenLocation,      set: setLinenLocation,      placeholder: 'Ex : Placard entrée' },
            { label: 'Linge sale',      val: dirtyLinenLocation, set: setDirtyLinenLocation, placeholder: 'Ex : Sac rouge, SDB' },
            { label: 'Produits ménagers', val: productsLocation, set: setProductsLocation,   placeholder: 'Ex : Sous l\'évier cuisine' },
            { label: 'Poubelles',       val: trashLocation,      set: setTrashLocation,      placeholder: 'Ex : Container vert en bas' },
          ].map((field, i, arr) => (
            <div key={field.label}
              className="flex flex-col gap-1.5 px-4 py-3"
              style={{ borderBottom: i < arr.length - 1 ? '1px solid #F5F0EA' : 'none' }}>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#C4A882' }}>
                {field.label}
              </span>
              <input
                value={field.val} onChange={e => field.set(e.target.value)}
                placeholder={field.placeholder}
                className="outline-none text-sm border-b pb-1"
                style={{
                  background: 'transparent',
                  borderBottom: '1.5px solid #EDE0D0',
                  color: '#2C1F0E',
                  fontFamily: 'inherit',
                  fontSize: 14,
                }}
              />
            </div>
          ))}
        </div>

        {/* Notes */}
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3 pl-0.5"
          style={{ color: '#C4A882' }}>Notes logement</p>
        <Textarea label="" value={notes} onChange={e => setNotes(e.target.value)} rows={3} />

      </div>

      <div className="flex-shrink-0 flex gap-2.5 px-5 pt-3.5 pb-8"
        style={{ borderTop: '1px solid #EDE0D0', background: 'rgba(250,247,242,0.97)' }}>
        <button onClick={onBack}
          className="w-10 h-[50px] rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#fff', border: '1px solid #EDE0D0', color: '#A8937A' }}>
          <ArrowLeft size={18} />
        </button>
        <button onClick={onSubmit} disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white"
          style={{ background: '#6B9E78' }}>
          {saving ? <Spinner size={18} /> : <Check size={18} />}
          {saving ? 'Création…' : 'Créer le logement'}
        </button>
      </div>
    </>
  )
}

// ─── Mode édition ──────────────────────────────────────────────────────────
function EditMode({ property, onSave, onDelete }: { property: any; onSave: (data: any) => void; onDelete: () => void }) {
  const [name, setName] = useState(property.name ?? '')
  const [address, setAddress] = useState(property.address ?? '')
  const [floor, setFloor] = useState(property.floor?.toString() ?? '')
  const [hasElevator, setHasElevator] = useState(property.elevator ?? false)
  const [buildingCode, setBuildingCode] = useState(property.building_code ?? '')
  const [doorCode, setDoorCode] = useState(property.door_code ?? '')
  const [keyBox, setKeyBox] = useState(property.key_box ?? '')
  const [keyBoxLocation, setKeyBoxLocation] = useState(property.key_box_location ?? '')
  const [keyInstructions, setKeyInstructions] = useState(property.key_instructions ?? '')
  const [linenLocation, setLinenLocation] = useState(property.linen_location ?? '')
  const [dirtyLinenLocation, setDirtyLinenLocation] = useState(property.dirty_linen_location ?? '')
  const [productsLocation, setProductsLocation] = useState(property.products_location ?? '')
  const [trashLocation, setTrashLocation] = useState(property.trash_location ?? '')
  const [notes, setNotes] = useState(property.notes ?? '')
  const [rooms, setRooms] = useState<Room[]>(property.rooms ?? [])
  const [showAddRoom, setShowAddRoom] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomType, setNewRoomType] = useState('other')
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['info']))
  const toast = useToast()

  const toggleSection = (s: string) => setOpenSections(prev => {
    const next = new Set(prev)
    next.has(s) ? next.delete(s) : next.add(s)
    return next
  })

  const handleSave = async () => {
    setSaving(true)
    await onSave({ name, address, floor: floor ? parseInt(floor) : null, elevator: hasElevator, building_code: buildingCode, door_code: doorCode, key_box: keyBox, key_box_location: keyBoxLocation, key_instructions: keyInstructions, linen_location: linenLocation, dirty_linen_location: dirtyLinenLocation, products_location: productsLocation, trash_location: trashLocation, notes, rooms })
    setSaving(false)
    toast.trigger()
  }

  const addRoom = () => {
    if (!newRoomName.trim()) return
    setRooms(prev => [...prev, { id: `tmp-${Date.now()}`, name: newRoomName.trim(), room_type: newRoomType as import('../types').RoomType, order_index: prev.length, property_id: property.id, created_at: new Date().toISOString() }])
    setNewRoomName('')
    setShowAddRoom(false)
  }

  const removeRoom = (roomId: string) => setRooms(prev => prev.filter(r => r.id !== roomId))

  const SectionHeader = ({ id, label }: { id: string; label: string }) => (
    <button onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between px-4 py-3.5 cursor-pointer"
      style={{ borderBottom: openSections.has(id) ? '1px solid #F5F0EA' : 'none' }}>
      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#A8937A' }}>{label}</span>
      {openSections.has(id) ? <ChevronUp size={16} style={{ color: '#D5C4AF' }} /> : <ChevronDown size={16} style={{ color: '#D5C4AF' }} />}
    </button>
  )

  const roomTypeOptions = [
    { value: 'entrance', label: 'Entrée' }, { value: 'bedroom', label: 'Chambre' },
    { value: 'bathroom', label: 'Salle de bain' }, { value: 'wc', label: 'WC' },
    { value: 'kitchen', label: 'Cuisine' }, { value: 'living', label: 'Salon' },
    { value: 'balcony', label: 'Balcon' }, { value: 'terrace', label: 'Terrasse' },
    { value: 'laundry', label: 'Buanderie' }, { value: 'garage', label: 'Garage' },
    { value: 'other', label: 'Autre' },
  ]

  return (
    <>
      <div className="scroll-area px-5 pb-5">

        {/* Informations */}
        <div className="rounded-2xl overflow-hidden mb-3"
          style={{ background: '#fff', border: '1px solid #EDE0D0' }}>
          <SectionHeader id="info" label="Informations" />
          {openSections.has('info') && (
            <div className="flex flex-col gap-3 p-4">
              <Input label="Nom *" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nom du logement" />
              <Input label="Adresse" type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Adresse complète" />
              <div className="flex gap-3">
                <div className="flex-1"><Input label="Étage" type="number" value={floor} onChange={e => setFloor(e.target.value)} placeholder="3" /></div>
                <div className="flex-1 flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#A8937A' }}>Ascenseur</span>
                  <div className="flex items-center justify-between rounded-2xl px-4 py-3.5" style={{ background: '#FAF7F2', border: '1px solid #EDE0D0' }}>
                    <span className="text-sm" style={{ color: '#2C1F0E' }}>Oui</span>
                    <Toggle label="" checked={hasElevator} onChange={setHasElevator} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Accès */}
        <div className="rounded-2xl overflow-hidden mb-3"
          style={{ background: '#fff', border: '1px solid #EDE0D0' }}>
          <SectionHeader id="access" label="Accès" />
          {openSections.has('access') && (
            <div className="flex flex-col gap-3 p-4">
              <Input label="Code immeuble" type="text" value={buildingCode} onChange={e => setBuildingCode(e.target.value)} placeholder="4521" />
              <Input label="Code porte" type="text" value={doorCode} onChange={e => setDoorCode(e.target.value)} placeholder="B12" />
              <Input label="Boîte à clés" type="text" value={keyBox} onChange={e => setKeyBox(e.target.value)} placeholder="Boîte verte, entrée" />
              <Input label="Code boîte" type="text" value={keyBoxLocation} onChange={e => setKeyBoxLocation(e.target.value)} placeholder="1234" />
              <Input label="Consignes clés" type="text" value={keyInstructions} onChange={e => setKeyInstructions(e.target.value)} placeholder="Remettre les clés…" />
            </div>
          )}
        </div>

        {/* Matériel */}
        <div className="rounded-2xl overflow-hidden mb-3"
          style={{ background: '#fff', border: '1px solid #EDE0D0' }}>
          <SectionHeader id="material" label="Matériel" />
          {openSections.has('material') && (
            <div className="flex flex-col gap-3 p-4">
              <Input label="Linge propre" type="text" value={linenLocation} onChange={e => setLinenLocation(e.target.value)} placeholder="Placard entrée" />
              <Input label="Linge sale" type="text" value={dirtyLinenLocation} onChange={e => setDirtyLinenLocation(e.target.value)} placeholder="Sac rouge, SDB" />
              <Input label="Produits ménagers" type="text" value={productsLocation} onChange={e => setProductsLocation(e.target.value)} placeholder="Sous l'évier cuisine" />
              <Input label="Poubelles" type="text" value={trashLocation} onChange={e => setTrashLocation(e.target.value)} placeholder="Container vert en bas" />
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="rounded-2xl overflow-hidden mb-3"
          style={{ background: '#fff', border: '1px solid #EDE0D0' }}>
          <SectionHeader id="notes" label="Notes" />
          {openSections.has('notes') && (
            <div className="p-4">
              <Textarea label="" value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
            </div>
          )}
        </div>

        {/* Pièces */}
        <div className="rounded-2xl overflow-hidden mb-3"
          style={{ background: '#fff', border: '1px solid #EDE0D0' }}>
          <SectionHeader id="rooms" label="Pièces" />
          {openSections.has('rooms') && (
            <div>
              {rooms.map((room, i) => (
                <div key={room.id}
                  className="flex items-center gap-2.5 px-4 py-3"
                  style={{ borderBottom: '1px solid #F5F0EA' }}>
                  <GripVertical size={16} style={{ color: '#D5C4AF', flexShrink: 0, cursor: 'grab' }} />
                  <span className="flex-1 text-sm font-medium" style={{ color: '#2C1F0E' }}>{room.name}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: '#F5F0EA', color: '#A8937A' }}>
                    {room.room_type}
                  </span>
                  <button onClick={() => removeRoom(room.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: '#FEF2F2', color: '#DC2626' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <button onClick={() => setShowAddRoom(true)}
                className="flex items-center gap-2 px-4 py-3 w-full text-left text-sm font-semibold"
                style={{ color: '#6B9E78' }}>
                <Plus size={15} /> Ajouter une pièce
              </button>
            </div>
          )}
        </div>

        {/* Supprimer */}
        <button onClick={() => setShowDeleteConfirm(true)}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold mt-2"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
          <Trash2 size={16} /> Supprimer le logement
        </button>

      </div>

      {/* CTA fixe */}
      <div className="flex-shrink-0 px-5 pt-3.5 pb-8"
        style={{ borderTop: '1px solid #EDE0D0', background: 'rgba(250,247,242,0.97)' }}>
        <button onClick={handleSave} disabled={saving || !name.trim()}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold text-white"
          style={{ background: '#6B9E78' }}>
          {saving ? <Spinner size={18} /> : <Check size={18} />}
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>

      {/* Add room sheet */}
      <BottomSheet open={showAddRoom} onClose={() => setShowAddRoom(false)} title="Ajouter une pièce">
        <div className="flex flex-col gap-3 mb-4">
          <Input label="Nom de la pièce" type="text" value={newRoomName}
            onChange={e => setNewRoomName(e.target.value)} placeholder="Ex : Chambre 2" />
          <Select label="Type" value={newRoomType} onChange={e => setNewRoomType(e.target.value)}
            options={roomTypeOptions} />
        </div>
        <button onClick={addRoom} disabled={!newRoomName.trim()}
          className="w-full py-4 rounded-2xl text-sm font-bold text-white"
          style={{ background: newRoomName.trim() ? '#6B9E78' : '#EDE0D0', color: newRoomName.trim() ? '#fff' : '#C4A882' }}>
          Ajouter
        </button>
      </BottomSheet>

      {/* Delete confirm */}
      <BottomSheet open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Supprimer ce logement ?">
        <p className="text-sm mb-5" style={{ color: '#A8937A' }}>
          Cette action est irréversible. Toutes les pièces et workflows associés seront supprimés.
        </p>
        <div className="flex gap-2.5">
          <button onClick={() => setShowDeleteConfirm(false)}
            className="flex-1 py-3.5 rounded-2xl text-sm font-semibold"
            style={{ background: '#F5F0EA', color: '#A8937A' }}>Annuler</button>
          <button onClick={onDelete}
            className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white"
            style={{ background: '#DC2626' }}>Supprimer</button>
        </div>
      </BottomSheet>

      <Toast show={toast.show} message="Logement enregistré ✓" variant="success" />
    </>
  )
}

// ─── Page principale ───────────────────────────────────────────────────────
export default function PropertyFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { properties, addProperty, updateProperty, deleteProperty, fetchProperties } = useAppStore()
  const isNew = !id || id === 'new'

  const [step, setStep] = useState(0)
  const [type, setType] = useState('apartment')
  const [size, setSize] = useState('T2')
  const [hasTerrace, setHasTerrace] = useState(false)
  const [hasVeranda, setHasVeranda] = useState(false)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [floor, setFloor] = useState('')
  const [hasElevator, setHasElevator] = useState(false)
  const [bedroomCount, setBedroomCount] = useState('1')
  const [livingCount, setLivingCount] = useState('1')
  const [buildingCode, setBuildingCode] = useState('')
  const [doorCode, setDoorCode] = useState('')
  const [keyBox, setKeyBox] = useState('')
  const [keyBoxCode, setKeyBoxCode] = useState('')
  const [keyInstructions, setKeyInstructions] = useState('')
  const [linenLocation, setLinenLocation] = useState('')
  const [dirtyLinenLocation, setDirtyLinenLocation] = useState('')
  const [productsLocation, setProductsLocation] = useState('')
  const [trashLocation, setTrashLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (!isNew) fetchProperties() }, [])

  const property = properties.find(p => p.id === id)

  const handleCreateSubmit = async () => {
    setSaving(true)
    await addProperty({
      name, address, property_type: type as 'apartment' | 'house',
      apartment_type: type === 'apartment' ? size.toLowerCase() : null,
      building_code: buildingCode, door_code: doorCode,
      key_box: keyBox, 
      key_instructions: keyInstructions, linen_location: linenLocation,
      dirty_linen_location: dirtyLinenLocation,
      products_location: productsLocation,
      trash_location: trashLocation, notes,
    })
    setSaving(false)
    navigate('/config/properties')
  }

  const handleEditSave = async (data: any) => {
    await updateProperty(id!, data)
    navigate('/config/properties')
  }

  const handleDelete = async () => {
    await deleteProperty(id!)
    navigate('/config/properties')
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#FAF7F2' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-4 flex-shrink-0">
        <button onClick={() => isNew && step > 0 ? setStep(s => s - 1) : navigate(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#fff', border: '1px solid #EDE0D0', color: '#A8937A' }}>
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-bold flex-1" style={{ color: '#2C1F0E', letterSpacing: '-0.02em' }}>
          {isNew ? 'Nouveau logement' : property?.name ?? 'Logement'}
        </h1>
      </div>

      {/* Wizard steps (création) */}
      {isNew && <StepIndicator current={step} />}

      {/* Contenu */}
      {isNew ? (
        step === 0 ? (
          <Step1 type={type} setType={setType} size={size} setSize={setSize}
            hasTerrace={hasTerrace} setHasTerrace={setHasTerrace}
            hasVeranda={hasVeranda} setHasVeranda={setHasVeranda}
            onNext={() => setStep(1)} />
        ) : step === 1 ? (
          <Step2 type={type} size={size} hasTerrace={hasTerrace} hasVeranda={hasVeranda}
            name={name} setName={setName} address={address} setAddress={setAddress}
            floor={floor} setFloor={setFloor} hasElevator={hasElevator} setHasElevator={setHasElevator}
            bedroomCount={bedroomCount} setBedroomCount={setBedroomCount}
            livingCount={livingCount} setLivingCount={setLivingCount}
            onBack={() => setStep(0)} onNext={() => setStep(2)} />
        ) : (
          <Step3 buildingCode={buildingCode} setBuildingCode={setBuildingCode}
            doorCode={doorCode} setDoorCode={setDoorCode}
            keyBox={keyBox} setKeyBox={setKeyBox}
            keyBoxCode={keyBoxCode} setKeyBoxCode={setKeyBoxCode}
            keyInstructions={keyInstructions} setKeyInstructions={setKeyInstructions}
            linenLocation={linenLocation} setLinenLocation={setLinenLocation}
            dirtyLinenLocation={dirtyLinenLocation} setDirtyLinenLocation={setDirtyLinenLocation}
            productsLocation={productsLocation} setProductsLocation={setProductsLocation}
            trashLocation={trashLocation} setTrashLocation={setTrashLocation}
            notes={notes} setNotes={setNotes}
            onBack={() => setStep(1)} onSubmit={handleCreateSubmit} saving={saving} />
        )
      ) : (
        property
          ? <EditMode property={property} onSave={handleEditSave} onDelete={handleDelete} />
          : <div className="flex justify-center py-12"><Spinner size={28} /></div>
      )}
    </div>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function getGeneratedRooms(type: string, size: string, terrace: boolean, veranda: boolean): string[] {
  const base = ['Entrée']
  if (type === 'apartment') {
    const sizes: Record<string, string[]> = {
      'Studio': ['Pièce principale', 'Cuisine', 'Salle de bain', 'WC'],
      'T2':     ['Salon', 'Cuisine', 'Chambre', 'Salle de bain', 'WC'],
      'T3':     ['Salon', 'Cuisine', 'Chambre 1', 'Chambre 2', 'Salle de bain', 'WC'],
      'T4':     ['Salon', 'Cuisine', 'Chambre 1', 'Chambre 2', 'Chambre 3', 'Salle de bain', 'WC'],
      'T5':     ['Salon', 'Cuisine', 'Chambre 1', 'Chambre 2', 'Chambre 3', 'Chambre 4', 'Salle de bain', 'WC'],
      'T6+':    ['Salon', 'Cuisine', 'Chambre 1', 'Chambre 2', 'Chambre 3', 'Chambre 4', 'Chambre 5', 'Salle de bain', 'WC'],
    }
    base.push(...(sizes[size] ?? sizes['T2']))
  } else {
    base.push('Salon', 'Cuisine', 'Chambre 1', 'Salle de bain', 'WC')
  }
  if (terrace) base.push('Terrasse')
  if (veranda) base.push('Véranda')
  return base
}
