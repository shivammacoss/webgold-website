export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  userAppUrl: process.env.NEXT_PUBLIC_USER_APP_URL || "http://localhost:3000",
} as const;
