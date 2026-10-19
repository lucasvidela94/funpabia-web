// Maps Better Auth's model and field names to the tables in migrations/0001_init.sql and 0002_auth.sql.

export const userModel = {
  modelName: 'app_user',
  fields: {
    emailVerified: 'email_verified',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
}

export const sessionModel = {
  modelName: 'session',
  fields: {
    userId: 'user_id',
    expiresAt: 'expires_at',
    ipAddress: 'ip_address',
    userAgent: 'user_agent',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
}

export const accountModel = {
  modelName: 'account',
  fields: {
    userId: 'user_id',
    accountId: 'account_id',
    providerId: 'provider_id',
    accessToken: 'access_token',
    refreshToken: 'refresh_token',
    idToken: 'id_token',
    accessTokenExpiresAt: 'access_token_expires_at',
    refreshTokenExpiresAt: 'refresh_token_expires_at',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
}

export const verificationModel = {
  modelName: 'verification',
  fields: {
    expiresAt: 'expires_at',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
}

export const rateLimitModel = {
  modelName: 'rate_limit',
  fields: {
    lastRequest: 'last_request',
  },
}
