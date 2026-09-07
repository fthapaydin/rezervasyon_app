export const ALL_DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export const DAY_FULL_NAMES = {
  Pzt: 'Pazartesi',
  Sal: 'Salı',
  Çar: 'Çarşamba',
  Per: 'Perşembe',
  Cum: 'Cuma',
  Cmt: 'Cumartesi',
  Paz: 'Pazar'
};

export const TIME_OPTIONS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  '19:00', '20:00', '21:00', '22:00'
];

export function getClinicSchedule(clinic) {
  const wd = clinic?.working_schedule || clinic?.working_days;

  if (wd && typeof wd === 'object' && !Array.isArray(wd) && wd.days) {
    const activeDays = wd.active_days || Object.keys(wd.days).filter(k => wd.days[k]?.active);
    return {
      active_days: activeDays,
      break_enabled: !!wd.break_enabled,
      break_start: wd.break_start || '12:00',
      break_end: wd.break_end || '13:00',
      days: wd.days
    };
  }

  // Fallback: Eski dizi formatı veya boş veri
  const activeArr = Array.isArray(wd) ? wd : ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  const start = clinic?.work_start_time || '08:00';
  const end = clinic?.work_end_time || '20:00';

  const defaultDays = {};
  ALL_DAYS.forEach(d => {
    defaultDays[d] = {
      active: activeArr.includes(d),
      start: d === 'Cmt' ? '10:00' : start,
      end: d === 'Cmt' ? '16:00' : end
    };
  });

  return {
    active_days: activeArr,
    break_enabled: true,
    break_start: '12:00',
    break_end: '13:00',
    days: defaultDays
  };
}

// Belirli bir gün ve saat mola aralığına denk geliyor mu?
export function isBreakSlot(hour, schedule) {
  if (!schedule || !schedule.break_enabled) return false;
  const h = hour.substring(0, 5);
  const bs = (schedule.break_start || '12:00').substring(0, 5);
  const be = (schedule.break_end || '13:00').substring(0, 5);
  return h >= bs && h < be;
}

// Belirli bir gün ve saatte klinik açık mı?
export function isDayWorkingHour(dayKey, hour, schedule) {
  if (!schedule) return true;
  const dayConf = schedule.days?.[dayKey];
  if (!dayConf || !dayConf.active) return false;
  
  const h = hour.substring(0, 5);
  const start = (dayConf.start || '08:00').substring(0, 5);
  const end = (dayConf.end || '20:00').substring(0, 5);
  return h >= start && h < end;
}
