/**
 * Run 5: Staff tier limits
 */
export const STAFF_TIER_LIMITS = {
  free: 1,
  starter: 3,
  growth: 5,
  scale: 999,
  enterprise: 999,
}

export const PERMISSION_LABELS = {
  owner: 'Owner',
  manager: 'Manager',
  staff: 'Staff',
  readonly: 'Read-only',
}

export const DAY_LABELS = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
}

// 15-min increments 00:00 - 23:45
export const TIME_SLOTS = (() => {
  const slots = []
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return slots
})()
