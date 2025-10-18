export const users = {
  admin: {
    email: 'admin@assurkit.local',
    password: 'admin123',
  },
  manager: {
    email: 'manager@assurkit.local',
    password: 'manager123',
  },
  tester: {
    email: 'tester@assurkit.local',
    password: 'tester123',
  },
  viewer: {
    email: 'viewer@assurkit.local',
    password: 'viewer123',
  },
} as const

export type UserRole = keyof typeof users
