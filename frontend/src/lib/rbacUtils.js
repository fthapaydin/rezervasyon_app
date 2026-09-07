import { supabase } from './supabase';

export const ALL_TABS = [
  { id: 'dashboard',  label: 'Dashboard',          desc: 'Genel istatistikler ve klinik özeti' },
  { id: 'requests',   label: 'Randevu Talepleri',  desc: 'Online gelen randevuları onaylama / reddetme' },
  { id: 'sessions',   label: 'Seans Takvimi',      desc: 'Haftalık seans takvimi ve randevu yönetimi' },
  { id: 'patients',   label: 'Hasta Yönetimi',     desc: 'Hasta kayıtları, seans geçmişi ve detaylar' },
  { id: 'treatments', label: 'Tedavi & Hizmetler', desc: 'Klinik hizmetleri, süreler ve fiyatlar' },
  { id: 'staff',      label: 'Ekip & Personel',    desc: 'Çalışanlar, roller ve sekme izinleri' },
  { id: 'payments',   label: 'Ödemeler & Kasa',    desc: 'Tahsilat, ciro ve kasa takibi' },
  { id: 'reports',    label: 'İstatistik & Rapor', desc: 'Doluluk, ciro ve performans analizleri' },
  { id: 'settings',   label: 'Klinik Ayarları',    desc: 'Çalışma saatleri, mola ve klinik profili' }
];

export const DEFAULT_ADMIN_TABS = [
  'dashboard', 'requests', 'sessions', 'patients', 'treatments', 'staff', 'payments', 'reports', 'settings'
];

export const DEFAULT_THERAPIST_TABS = ['sessions', 'patients', 'requests'];

export const DEFAULT_SECRETARY_TABS = ['sessions', 'requests', 'patients'];

export function getDefaultTabsForRole(role) {
  if (role === 'admin') return [...DEFAULT_ADMIN_TABS];
  if (role === 'secretary') return [...DEFAULT_SECRETARY_TABS];
  return [...DEFAULT_THERAPIST_TABS];
}

export function getStaffPassword(staffMember, clinic) {
  if (!staffMember) return '123456';
  if (staffMember.password) return staffMember.password;
  const meta = clinic?.working_days?.staff_meta?.[staffMember.id];
  if (meta?.password) return meta.password;
  try {
    const local = localStorage.getItem(`fizyo_staff_pass_${staffMember.id}`);
    if (local) return local;
  } catch {}
  return '123456';
}

export function getStaffAllowedTabs(staffMember, clinic) {
  if (!staffMember) return DEFAULT_ADMIN_TABS;
  if (staffMember.role === 'admin') return DEFAULT_ADMIN_TABS;
  if (Array.isArray(staffMember.allowed_tabs) && staffMember.allowed_tabs.length > 0) {
    return staffMember.allowed_tabs;
  }
  const meta = clinic?.working_days?.staff_meta?.[staffMember.id];
  if (Array.isArray(meta?.allowed_tabs) && meta.allowed_tabs.length > 0) {
    return meta.allowed_tabs;
  }
  try {
    const local = localStorage.getItem(`fizyo_staff_tabs_${staffMember.id}`);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return getDefaultTabsForRole(staffMember.role);
}

export function getTreatmentAssignedStaff(treatment, clinic) {
  if (!treatment) return [];
  if (Array.isArray(treatment.assigned_staff_ids) && treatment.assigned_staff_ids.length > 0) {
    return treatment.assigned_staff_ids;
  }
  const meta = clinic?.working_days?.treatment_staff?.[treatment.id];
  if (Array.isArray(meta) && meta.length > 0) {
    return meta;
  }
  try {
    const local = localStorage.getItem(`fizyo_treat_staff_${treatment.id}`);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [];
}

// Persist staff metadata (password and allowed_tabs) to clinic.working_days JSONB
export async function syncStaffMetaToClinic(clinic, staffId, { password, allowed_tabs }) {
  if (!clinic?.id || !staffId) return;

  try {
    // LocalStorage fallback
    if (password) localStorage.setItem(`fizyo_staff_pass_${staffId}`, password);
    if (allowed_tabs) localStorage.setItem(`fizyo_staff_tabs_${staffId}`, JSON.stringify(allowed_tabs));

    // Update clinic.working_days on Supabase
    const currentWd = clinic.working_days && typeof clinic.working_days === 'object' && !Array.isArray(clinic.working_days)
      ? { ...clinic.working_days }
      : { active_days: Array.isArray(clinic.working_days) ? clinic.working_days : ['Pzt','Sal','Çar','Per','Cum','Cmt'] };

    if (!currentWd.staff_meta) currentWd.staff_meta = {};
    currentWd.staff_meta[staffId] = {
      ...(currentWd.staff_meta[staffId] || {}),
      ...(password ? { password } : {}),
      ...(allowed_tabs ? { allowed_tabs } : {})
    };

    clinic.working_days = currentWd;
    localStorage.setItem('fizyo_clinic', JSON.stringify(clinic));

    await supabase
      .from('clinics')
      .update({ working_days: currentWd })
      .eq('id', clinic.id);
  } catch (err) {
    console.warn('syncStaffMetaToClinic warning:', err);
  }
}

// Persist treatment assigned staff to clinic.working_days JSONB
export async function syncTreatmentStaffToClinic(clinic, treatmentId, assignedStaffIds) {
  if (!clinic?.id || !treatmentId) return;

  try {
    localStorage.setItem(`fizyo_treat_staff_${treatmentId}`, JSON.stringify(assignedStaffIds));

    const currentWd = clinic.working_days && typeof clinic.working_days === 'object' && !Array.isArray(clinic.working_days)
      ? { ...clinic.working_days }
      : { active_days: Array.isArray(clinic.working_days) ? clinic.working_days : ['Pzt','Sal','Çar','Per','Cum','Cmt'] };

    if (!currentWd.treatment_staff) currentWd.treatment_staff = {};
    currentWd.treatment_staff[treatmentId] = assignedStaffIds;

    clinic.working_days = currentWd;
    localStorage.setItem('fizyo_clinic', JSON.stringify(clinic));

    await supabase
      .from('clinics')
      .update({ working_days: currentWd })
      .eq('id', clinic.id);
  } catch (err) {
    console.warn('syncTreatmentStaffToClinic warning:', err);
  }
}
