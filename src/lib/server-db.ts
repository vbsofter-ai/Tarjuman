import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DATABASE_HOST || "31.97.198.49",
  port: parseInt(process.env.DATABASE_PORT || "3306", 10),
  database: process.env.DATABASE_NAME || "u170392488_Tarjuman",
  user: process.env.DATABASE_USER || "u170392488_Tarjuman",
  password: process.env.DATABASE_PASSWORD || "M0h@mm@d@Tef1976_2026",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 5000, // 5 seconds connection timeout to prevent hanging on hosting servers
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
}).promise();

// Resilient Fallback Mode State
let isFallbackMode = false;
let fallbackStartedAt = 0;
let isInitialized = false;

// Seed initial in-memory tables
let fallbackUsers: any[] = [
  {
    id: "usr-1",
    name: "Ramy Atef",
    email: "romyatef@gmail.com",
    plan: "pro",
    quotaUsed: 12450,
    quotaLimit: 100000,
    status: "active",
    joinedDate: "2026-03-12",
    lastActive: "2026-07-13 14:55",
    preferredDomain: "legal",
    role: "super_admin",
    permissions: JSON.stringify(["super_admin", "dashboard", "users_view", "users_manage", "config_manage", "logs_view", "translate", "upload_files", "linguistic_analysis", "analytics_view"])
  },
  {
    id: "usr-2",
    name: "عبد الله الغامدي",
    email: "abdullah.h@example.com",
    plan: "enterprise",
    quotaUsed: 450120,
    quotaLimit: 2000000,
    status: "active",
    joinedDate: "2026-01-20",
    lastActive: "2026-07-13 15:02",
    preferredDomain: "medical",
    role: "moderator",
    permissions: JSON.stringify(["dashboard", "users_view", "users_manage", "logs_view", "translate", "upload_files"])
  },
  {
    id: "usr-3",
    name: "Sarah Jenkins",
    email: "sarah.j@techcorp.com",
    plan: "pro",
    quotaUsed: 78900,
    quotaLimit: 100000,
    status: "active",
    joinedDate: "2026-05-15",
    lastActive: "2026-07-12 18:24",
    preferredDomain: "technical",
    role: "editor",
    permissions: JSON.stringify(["dashboard", "logs_view", "translate", "upload_files", "linguistic_analysis"])
  },
  {
    id: "usr-4",
    name: "مريم الصدّيق",
    email: "mariam.s@legalgroup.com",
    plan: "free",
    quotaUsed: 4950,
    quotaLimit: 5000,
    status: "active",
    joinedDate: "2026-06-01",
    lastActive: "2026-07-13 12:40",
    preferredDomain: "legal",
    role: "user",
    permissions: JSON.stringify(["translate", "upload_files"])
  },
  {
    id: "usr-5",
    name: "Jean-Pierre",
    email: "jp.leclerc@frenchmed.fr",
    plan: "free",
    quotaUsed: 1200,
    quotaLimit: 5000,
    status: "suspended",
    joinedDate: "2026-04-10",
    lastActive: "2026-06-25 09:15",
    preferredDomain: "medical",
    role: "user",
    permissions: JSON.stringify(["translate", "upload_files"])
  }
];

let fallbackSystemConfig: Record<string, any> = {
  defaultFreeLimit: 5000,
  translationEngine: "gemini-3.5-flash",
  requireAuthForUpload: true,
  maintenanceMode: false,
  enableLinguisticAnalysis: true,
  logTranslationRequests: true,
};

let fallbackLogs: any[] = [
  { id: 1, timestamp: new Date(), action: "Translation Request", type: "success", details: "User romyatef@gmail.com - Legal (ar -> en) - 1,240 words" },
  { id: 2, timestamp: new Date(), action: "User Registration", type: "info", details: "New user registered: abdullah.h@example.com" },
  { id: 3, timestamp: new Date(), action: "Quota Threshold", type: "warning", details: "mariam.s@legalgroup.com reached 98% of free quota" },
  { id: 4, timestamp: new Date(), action: "Glossary Created", type: "success", details: "Glossary updated for jp.leclerc@frenchmed.fr (32 terms)" }
];

// Initialize database tables
export async function initializeDatabase() {
  if (isInitialized) return;
  let conn;
  try {
    console.log("[DB] Connecting to MySQL database...");
    conn = await pool.getConnection();
    console.log("[DB] Successfully connected to MySQL database.");

    // Create users table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS tarjuman_users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        plan VARCHAR(50) DEFAULT 'free',
        quotaUsed INT DEFAULT 0,
        quotaLimit INT DEFAULT 5000,
        status VARCHAR(50) DEFAULT 'active',
        joinedDate VARCHAR(50) NOT NULL,
        lastActive VARCHAR(50) NOT NULL,
        preferredDomain VARCHAR(50) DEFAULT 'general',
        role VARCHAR(50) DEFAULT 'user',
        permissions TEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("[DB] Created/Verified 'tarjuman_users' table.");

    // Safeguard schema update: add role and permissions if table already exists without them
    try {
      await conn.query("ALTER TABLE tarjuman_users ADD COLUMN role VARCHAR(50) DEFAULT 'user'");
      console.log("[DB] Added 'role' column to tarjuman_users.");
    } catch (err) {
      // Column already exists, ignore
    }

    try {
      await conn.query("ALTER TABLE tarjuman_users ADD COLUMN permissions TEXT");
      console.log("[DB] Added 'permissions' column to tarjuman_users.");
    } catch (err) {
      // Column already exists, ignore
    }

    // Create system config table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS tarjuman_system_config (
        config_key VARCHAR(100) PRIMARY KEY,
        config_value TEXT NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("[DB] Created/Verified 'tarjuman_system_config' table.");

    // Create logs table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS tarjuman_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        action VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        details TEXT NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("[DB] Created/Verified 'tarjuman_logs' table.");

    // Create visits table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS tarjuman_visits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(50),
        user_agent TEXT,
        referrer TEXT,
        path VARCHAR(255)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("[DB] Created/Verified 'tarjuman_visits' table.");

    // Create feedback table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS tarjuman_feedback (
        id INT AUTO_INCREMENT PRIMARY KEY,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        email VARCHAR(100),
        rating INT NOT NULL,
        comment TEXT,
        details TEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("[DB] Created/Verified 'tarjuman_feedback' table.");

    // Create payments table (Paymob + PayPal subscription payments)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS tarjuman_payments (
        id VARCHAR(80) PRIMARY KEY,
        user_email VARCHAR(100) NOT NULL,
        plan_id VARCHAR(50) NOT NULL,
        billing_period VARCHAR(20) NOT NULL,
        amount_cents INT NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'EGP',
        provider VARCHAR(30) NOT NULL DEFAULT 'paymob',
        status VARCHAR(30) NOT NULL DEFAULT 'pending',
        paymob_order_id BIGINT,
        paymob_transaction_id BIGINT,
        paymob_payment_token TEXT,
        paymob_hmac_verified TINYINT(1) DEFAULT 0,
        paypal_order_id VARCHAR(80),
        paypal_capture_id VARCHAR(80),
        paypal_payer_id VARCHAR(80),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        paid_at DATETIME,
        INDEX idx_user_email (user_email),
        INDEX idx_status (status),
        INDEX idx_paymob_order (paymob_order_id),
        INDEX idx_paypal_order (paypal_order_id),
        INDEX idx_provider (provider)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("[DB] Created/Verified 'tarjuman_payments' table.");

    // Add columns idempotently to tarjuman_payments for older deployments
    const paymentColumns = [
      "paymob_order_id BIGINT",
      "paymob_transaction_id BIGINT",
      "paymob_payment_token TEXT",
      "paymob_hmac_verified TINYINT(1) DEFAULT 0",
      "paypal_order_id VARCHAR(80)",
      "paypal_capture_id VARCHAR(80)",
      "paypal_payer_id VARCHAR(80)",
      "paid_at DATETIME",
      "provider VARCHAR(30) NOT NULL DEFAULT 'paymob'",
    ];
    for (const col of paymentColumns) {
      try {
        const colName = col.split(" ")[0];
        await conn.query(`ALTER TABLE tarjuman_payments ADD COLUMN ${col}`);
        console.log(`[DB] Added '${colName}' column to tarjuman_payments.`);
      } catch (err) {
        // Column already exists, ignore.
      }
    }

    // Add quotaResetAt to users (used for monthly quota rollover).
    try {
      await conn.query("ALTER TABLE tarjuman_users ADD COLUMN quotaResetAt DATETIME");
      console.log("[DB] Added 'quotaResetAt' column to tarjuman_users.");
    } catch (err) {
      // Already exists
    }
    // Add subscriptionStartedAt (used for the cycle anchor on paid plans).
    try {
      await conn.query("ALTER TABLE tarjuman_users ADD COLUMN subscriptionStartedAt DATETIME");
      console.log("[DB] Added 'subscriptionStartedAt' column to tarjuman_users.");
    } catch (err) {
      // Already exists
    }

    // Promote romyatef@gmail.com to super_admin in database and set all permissions
    const superAdminPerms = JSON.stringify(["super_admin", "dashboard", "users_view", "users_manage", "config_manage", "logs_view", "translate", "upload_files", "linguistic_analysis", "analytics_view"]);
    await conn.query(
      "UPDATE tarjuman_users SET role = 'super_admin', permissions = ? WHERE email = 'romyatef@gmail.com'",
      [superAdminPerms]
    );

    // Ensure all config keys exist (upsert/individual check)
    const defaultConfig = {
      defaultFreeLimit: 5000,
      translationEngine: "gemini-3.5-flash",
      requireAuthForUpload: true,
      maintenanceMode: false,
      enableLinguisticAnalysis: true,
      logTranslationRequests: true,
      seo_title: "بوابة ترجمان للترجمة الذكية المتخصصة | Tarjuman Professional AI Translation Portal",
      seo_description: "ترجمان هو نظام ذكاء اصطناعي لترجمة النصوص والمستندات والملفات الطبية، القانونية، والمالية بدقة احترافية فائقة مع الحفاظ الكامل على التنسيقات والتبصر اللغوي والسياقي.",
      seo_keywords: "ترجمة, ذكاء اصطناعي, ترجمان, ترجمة ملفات, ترجمة قانونية, ترجمة طبية, ترجمة تقنية, ترجمة مستندات, ترجمة احترافية بالذكاء الاصطناعي, مترجم ذكي متخصص, ترجمة ملفات PDF, ترجمة معتمدة, ترجمة فورية دقيقة, ترجمة مصطلحات مالية, أفضل موقع ترجمة, مترجم نصوص كاملة, ترجمة مستندات مصورة, ترجمة ممسوحة ضوئياً, مترجم بي دي اف, ترجمة جوجل, بديل مترجم جوجل, AI Translation, Legal Translation, PDF Translation, Medical Translation, English to Arabic, Document Translator, Context-aware Translation, Neural Machine Translation, Professional Arabic Translation, OCR Translation, Translate PDF document, Gemini translation engine, terminology mining, neural translator",
      aeo_agent_description: "Tarjuman is an advanced contextual multi-domain neural AI translation platform specialized in medical, legal, technical, and financial translations. It features layout-preserving document/PDF OCR translation, custom vocabulary glossaries, speech generation, and deep linguistic analysis tools.",
      last_seo_update: "1970-01-01T00:00:00.000Z",
    };

    for (const [key, val] of Object.entries(defaultConfig)) {
      const [exists]: any = await conn.query("SELECT 1 FROM tarjuman_system_config WHERE config_key = ?", [key]);
      if (exists.length === 0) {
        await conn.query(
          "INSERT INTO tarjuman_system_config (config_key, config_value) VALUES (?, ?)",
          [key, JSON.stringify(val)]
        );
      }
    }
    console.log("[DB] Seeded and verified default system configurations.");

    // Seed default users if empty
    const [userRows]: any = await conn.query("SELECT COUNT(*) as count FROM tarjuman_users");
    if (userRows[0].count === 0) {
      for (const u of fallbackUsers) {
        await conn.query(
          `INSERT INTO tarjuman_users 
           (id, name, email, plan, quotaUsed, quotaLimit, status, joinedDate, lastActive, preferredDomain, role, permissions) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [u.id, u.name, u.email, u.plan, u.quotaUsed, u.quotaLimit, u.status, u.joinedDate, u.lastActive, u.preferredDomain, u.role, u.permissions]
        );
      }
      console.log("[DB] Seeded initial administration accounts.");
    }

    // Seed initial logs if empty
    const [logRows]: any = await conn.query("SELECT COUNT(*) as count FROM tarjuman_logs");
    if (logRows[0].count === 0) {
      for (const log of fallbackLogs) {
        await conn.query(
          "INSERT INTO tarjuman_logs (action, type, details) VALUES (?, ?, ?)",
          [log.action, log.type, log.details]
        );
      }
      console.log("[DB] Seeded baseline transaction logs.");
    }

    isInitialized = true;
  } catch (error) {
    console.error("[DB] Database initialization failed. Using professional in-memory fallback database:", error);
    isFallbackMode = true;
    fallbackStartedAt = Date.now();
  } finally {
    if (conn) conn.release();
  }
}

async function ensureInitialized() {
  // Circuit breaker: attempt to reconnect to DB pool after 30 seconds of fallback mode
  if (isFallbackMode && Date.now() - fallbackStartedAt > 30000) {
    console.log("[DB] Fallback cooldown expired. Attempting to reconnect to database pool...");
    isFallbackMode = false;
    isInitialized = false;
  }
  if (!isInitialized && !isFallbackMode) {
    await initializeDatabase();
  }
}

// Database helper functions
export async function getUsers() {
  await ensureInitialized();
  if (isFallbackMode) {
    return fallbackUsers;
  }
  try {
    const [rows] = await pool.query("SELECT * FROM tarjuman_users ORDER BY joinedDate DESC");
    return rows;
  } catch (error) {
    console.error("[DB] getUsers query failed, falling back to in-memory:", error);
    isFallbackMode = true;
    return fallbackUsers;
  }
}

export async function getUserByEmail(email: string) {
  await ensureInitialized();
  if (isFallbackMode) {
    return fallbackUsers.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }
  try {
    const [rows]: any = await pool.query("SELECT * FROM tarjuman_users WHERE email = ?", [email]);
    return rows[0] || null;
  } catch (error) {
    console.error("[DB] getUserByEmail query failed, falling back to in-memory:", error);
    isFallbackMode = true;
    fallbackStartedAt = Date.now();
    return fallbackUsers.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }
}

export async function createUser(user: { id: string; name: string; email: string; plan: string; quotaLimit: number; preferredDomain: string; role?: string; permissions?: string | string[] }) {
  await ensureInitialized();
  const nowStr = new Date().toISOString().split("T")[0];
  const lastActiveStr = new Date().toISOString().replace("T", " ").substring(0, 16);
  const role = user.role || "user";
  
  let permissions = typeof user.permissions === "object" ? JSON.stringify(user.permissions) : user.permissions;
  if (!permissions) {
    if (role === "super_admin") {
      permissions = JSON.stringify(["super_admin", "dashboard", "users_view", "users_manage", "config_manage", "logs_view", "translate", "upload_files", "linguistic_analysis", "analytics_view"]);
    } else if (role === "admin") {
      permissions = JSON.stringify(["dashboard", "users_view", "users_manage", "config_manage", "logs_view", "translate", "upload_files", "linguistic_analysis"]);
    } else if (role === "moderator") {
      permissions = JSON.stringify(["dashboard", "users_view", "users_manage", "logs_view", "translate", "upload_files"]);
    } else if (role === "editor") {
      permissions = JSON.stringify(["dashboard", "logs_view", "translate", "upload_files", "linguistic_analysis"]);
    } else {
      permissions = JSON.stringify(["translate", "upload_files"]);
    }
  }

  if (isFallbackMode) {
    const newUserObj = {
      id: user.id || `usr-${Date.now()}`,
      name: user.name,
      email: user.email,
      plan: user.plan,
      quotaUsed: 0,
      quotaLimit: user.quotaLimit,
      status: "active",
      joinedDate: nowStr,
      lastActive: lastActiveStr,
      preferredDomain: user.preferredDomain,
      role,
      permissions
    };
    fallbackUsers.push(newUserObj);
    return newUserObj;
  }

  try {
    await pool.query(
      `INSERT INTO tarjuman_users 
       (id, name, email, plan, quotaUsed, quotaLimit, status, joinedDate, lastActive, preferredDomain, role, permissions) 
       VALUES (?, ?, ?, ?, 0, ?, 'active', ?, ?, ?, ?, ?)`,
      [user.id, user.name, user.email, user.plan, user.quotaLimit, nowStr, lastActiveStr, user.preferredDomain, role, permissions]
    );
    return getUserByEmail(user.email);
  } catch (error) {
    console.error("[DB] createUser failed, using in-memory fallback:", error);
    isFallbackMode = true;
    const newUserObj = {
      id: user.id || `usr-${Date.now()}`,
      name: user.name,
      email: user.email,
      plan: user.plan,
      quotaUsed: 0,
      quotaLimit: user.quotaLimit,
      status: "active",
      joinedDate: nowStr,
      lastActive: lastActiveStr,
      preferredDomain: user.preferredDomain,
      role,
      permissions
    };
    fallbackUsers.push(newUserObj);
    return newUserObj;
  }
}

export async function updateUser(user: { id: string; name: string; email: string; plan: string; quotaUsed: number; quotaLimit: number; status: string; role?: string; permissions?: string | string[] }) {
  await ensureInitialized();
  const role = user.role || "user";
  let permissions = typeof user.permissions === "object" ? JSON.stringify(user.permissions) : user.permissions;
  if (!permissions) {
    if (role === "admin") {
      permissions = JSON.stringify(["dashboard", "users_view", "users_manage", "config_manage", "logs_view", "translate", "upload_files", "linguistic_analysis"]);
    } else if (role === "moderator") {
      permissions = JSON.stringify(["dashboard", "users_view", "users_manage", "logs_view", "translate", "upload_files"]);
    } else if (role === "editor") {
      permissions = JSON.stringify(["dashboard", "logs_view", "translate", "upload_files", "linguistic_analysis"]);
    } else {
      permissions = JSON.stringify(["translate", "upload_files"]);
    }
  }

  if (isFallbackMode) {
    fallbackUsers = fallbackUsers.map(u => {
      if (u.id === user.id) {
        return {
          ...u,
          name: user.name,
          email: user.email,
          plan: user.plan,
          quotaUsed: user.quotaUsed,
          quotaLimit: user.quotaLimit,
          status: user.status,
          role,
          permissions
        };
      }
      return u;
    });
    return fallbackUsers.find(u => u.id === user.id) || null;
  }

  try {
    await pool.query(
      `UPDATE tarjuman_users 
       SET name = ?, email = ?, plan = ?, quotaUsed = ?, quotaLimit = ?, status = ?, role = ?, permissions = ? 
       WHERE id = ?`,
      [user.name, user.email, user.plan, user.quotaUsed, user.quotaLimit, user.status, role, permissions, user.id]
    );
    return getUserByEmail(user.email);
  } catch (error) {
    console.error("[DB] updateUser failed, using in-memory fallback:", error);
    isFallbackMode = true;
    fallbackUsers = fallbackUsers.map(u => {
      if (u.id === user.id) {
        return {
          ...u,
          name: user.name,
          email: user.email,
          plan: user.plan,
          quotaUsed: user.quotaUsed,
          quotaLimit: user.quotaLimit,
          status: user.status,
          role,
          permissions
        };
      }
      return u;
    });
    return fallbackUsers.find(u => u.id === user.id) || null;
  }
}

export async function updateUserQuota(email: string, wordCount: number) {
  await ensureInitialized();
  if (isFallbackMode) {
    fallbackUsers = fallbackUsers.map(u => {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        return { ...u, quotaUsed: u.quotaUsed + wordCount };
      }
      return u;
    });
    return;
  }

  try {
    await pool.query(
      "UPDATE tarjuman_users SET quotaUsed = quotaUsed + ? WHERE email = ?",
      [wordCount, email]
    );
  } catch (error) {
    console.error("[DB] updateUserQuota failed, using in-memory fallback:", error);
    isFallbackMode = true;
    fallbackStartedAt = Date.now();
    fallbackUsers = fallbackUsers.map(u => {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        return { ...u, quotaUsed: u.quotaUsed + wordCount };
      }
      return u;
    });
  }
}

export async function updateLastActive(email: string) {
  await ensureInitialized();
  const lastActiveStr = new Date().toISOString().replace("T", " ").substring(0, 16);
  if (isFallbackMode) {
    fallbackUsers = fallbackUsers.map(u => {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        return { ...u, lastActive: lastActiveStr };
      }
      return u;
    });
    return;
  }

  try {
    await pool.query(
      "UPDATE tarjuman_users SET lastActive = ? WHERE email = ?",
      [lastActiveStr, email]
    );
  } catch (error) {
    console.error("[DB] updateLastActive failed, using in-memory fallback:", error);
    isFallbackMode = true;
    fallbackUsers = fallbackUsers.map(u => {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        return { ...u, lastActive: lastActiveStr };
      }
      return u;
    });
  }
}

export async function updateUserStatus(id: string, status: string) {
  await ensureInitialized();
  if (isFallbackMode) {
    fallbackUsers = fallbackUsers.map(u => {
      if (u.id === id) {
        return { ...u, status };
      }
      return u;
    });
    return;
  }

  try {
    await pool.query(
      "UPDATE tarjuman_users SET status = ? WHERE id = ?",
      [status, id]
    );
  } catch (error) {
    console.error("[DB] updateUserStatus failed, using in-memory fallback:", error);
    isFallbackMode = true;
    fallbackUsers = fallbackUsers.map(u => {
      if (u.id === id) {
        return { ...u, status };
      }
      return u;
    });
  }
}

export async function getSystemConfig() {
  await ensureInitialized();
  if (isFallbackMode) {
    return fallbackSystemConfig;
  }

  try {
    const [rows]: any = await pool.query("SELECT * FROM tarjuman_system_config");
    const config: Record<string, any> = {};
    for (const r of rows) {
      try {
        config[r.config_key] = JSON.parse(r.config_value);
      } catch {
        config[r.config_key] = r.config_value;
      }
    }
    return config;
  } catch (error) {
    console.error("[DB] getSystemConfig query failed, using in-memory fallback:", error);
    isFallbackMode = true;
    fallbackStartedAt = Date.now();
    return fallbackSystemConfig;
  }
}

export async function updateSystemConfig(config: Record<string, any>) {
  await ensureInitialized();
  if (isFallbackMode) {
    fallbackSystemConfig = { ...fallbackSystemConfig, ...config };
    return;
  }

  try {
    for (const [key, val] of Object.entries(config)) {
      await pool.query(
        `INSERT INTO tarjuman_system_config (config_key, config_value) 
         VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE config_value = ?`,
        [key, JSON.stringify(val), JSON.stringify(val)]
      );
    }
  } catch (error) {
    console.error("[DB] updateSystemConfig failed, using in-memory fallback:", error);
    isFallbackMode = true;
    fallbackStartedAt = Date.now();
    fallbackSystemConfig = { ...fallbackSystemConfig, ...config };
  }
}

export async function getLogs() {
  await ensureInitialized();
  if (isFallbackMode) {
    return fallbackLogs.map((r: any) => ({
      id: `log-${r.id}`,
      time: new Date(r.timestamp).toTimeString().split(" ")[0],
      action: r.action,
      type: r.type,
      details: r.details
    }));
  }

  try {
    const [rows]: any = await pool.query("SELECT * FROM tarjuman_logs ORDER BY timestamp DESC LIMIT 30");
    return rows.map((r: any) => ({
      id: `log-${r.id}`,
      time: new Date(r.timestamp).toTimeString().split(" ")[0],
      action: r.action,
      type: r.type,
      details: r.details
    }));
  } catch (error) {
    console.error("[DB] getLogs failed, using in-memory fallback:", error);
    isFallbackMode = true;
    return fallbackLogs.map((r: any) => ({
      id: `log-${r.id}`,
      time: new Date(r.timestamp).toTimeString().split(" ")[0],
      action: r.action,
      type: r.type,
      details: r.details
    }));
  }
}

export async function logAction(action: string, type: string, details: string) {
  await ensureInitialized();
  if (isFallbackMode) {
    fallbackLogs.unshift({
      id: Date.now() + Math.floor(Math.random() * 1000),
      timestamp: new Date(),
      action,
      type,
      details
    });
    if (fallbackLogs.length > 50) {
      fallbackLogs = fallbackLogs.slice(0, 50);
    }
    return;
  }

  try {
    await pool.query(
      "INSERT INTO tarjuman_logs (action, type, details) VALUES (?, ?, ?)",
      [action, type, details]
    );
  } catch (error) {
    console.error("[DB] Logging failed, using in-memory fallback:", error);
    isFallbackMode = true;
    fallbackStartedAt = Date.now();
    fallbackLogs.unshift({
      id: Date.now() + Math.floor(Math.random() * 1000),
      timestamp: new Date(),
      action,
      type,
      details
    });
    if (fallbackLogs.length > 50) {
      fallbackLogs = fallbackLogs.slice(0, 50);
    }
  }
}

export async function deleteUser(id: string) {
  await ensureInitialized();
  if (isFallbackMode) {
    fallbackUsers = fallbackUsers.filter(u => u.id !== id);
    return;
  }
  try {
    await pool.query("DELETE FROM tarjuman_users WHERE id = ?", [id]);
  } catch (error) {
    console.error("[DB] deleteUser failed, using in-memory fallback:", error);
    isFallbackMode = true;
    fallbackUsers = fallbackUsers.filter(u => u.id !== id);
  }
}

// In-memory fallback visits log
let fallbackVisits: any[] = [
  { timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), ip_address: "192.168.1.1", user_agent: "Mozilla/5.0 (Windows NT 10.0)", referrer: "", path: "/" },
  { timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), ip_address: "192.168.1.2", user_agent: "Mozilla/5.0 (Windows NT 10.0)", referrer: "", path: "/" },
  { timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), ip_address: "192.168.1.1", user_agent: "Mozilla/5.0 (Macintosh)", referrer: "google.com", path: "/" },
  { timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), ip_address: "192.168.1.3", user_agent: "Mozilla/5.0 (iPhone)", referrer: "", path: "/" },
  { timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), ip_address: "192.168.1.4", user_agent: "Mozilla/5.0 (Windows NT 10.0)", referrer: "facebook.com", path: "/" },
  { timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), ip_address: "192.168.1.5", user_agent: "Mozilla/5.0 (Windows NT 10.0)", referrer: "", path: "/" },
  { timestamp: new Date(), ip_address: "192.168.1.6", user_agent: "Mozilla/5.0 (Windows NT 10.0)", referrer: "", path: "/" }
];

// In-memory fallback for tarjuman_payments (used when MySQL is unreachable)
let fallbackPayments: any[] = [];

export async function isSuperAdmin(email: string): Promise<boolean> {
  const user = await getUserByEmail(email);
  return user?.role === "super_admin";
}

export async function trackVisit(ip: string, userAgent: string, referrer: string, path: string) {
  await ensureInitialized();
  if (isFallbackMode) {
    fallbackVisits.push({
      timestamp: new Date(),
      ip_address: ip,
      user_agent: userAgent,
      referrer: referrer || "",
      path: path || "/"
    });
    return;
  }

  try {
    await pool.query(
      "INSERT INTO tarjuman_visits (ip_address, user_agent, referrer, path) VALUES (?, ?, ?, ?)",
      [ip, userAgent, referrer || "", path || "/"]
    );
  } catch (error) {
    console.error("[DB] trackVisit failed, using in-memory fallback:", error);
    isFallbackMode = true;
    fallbackVisits.push({
      timestamp: new Date(),
      ip_address: ip,
      user_agent: userAgent,
      referrer: referrer || "",
      path: path || "/"
    });
  }
}

export async function getAnalytics() {
  await ensureInitialized();
  
  let visitsList: any[] = [];
  let logsList: any[] = [];
  let usersCount = 0;

  if (isFallbackMode) {
    visitsList = fallbackVisits;
    logsList = fallbackLogs;
    usersCount = fallbackUsers.length;
  } else {
    try {
      const [vRows]: any = await pool.query("SELECT timestamp, ip_address, user_agent, referrer, path FROM tarjuman_visits");
      visitsList = vRows;

      const [lRows]: any = await pool.query("SELECT action FROM tarjuman_logs");
      logsList = lRows;

      const [uRows]: any = await pool.query("SELECT COUNT(*) as count FROM tarjuman_users");
      usersCount = uRows[0].count;
    } catch (error) {
      console.error("[DB] getAnalytics failed, falling back to in-memory:", error);
      isFallbackMode = true;
      visitsList = fallbackVisits;
      logsList = fallbackLogs;
      usersCount = fallbackUsers.length;
    }
  }

  // Calculate statistics
  const totalVisits = visitsList.length;
  const uniqueIPs = new Set(visitsList.map(v => v.ip_address));
  const uniqueVisitors = uniqueIPs.size;
  
  // Total translations count (from logs)
  const totalTranslations = logsList.filter(l => l.action === "Translation Request" || l.action === "Translation").length;

  // Daily Trend (last 7 days)
  const dailyTrendMap = new Map<string, { visits: number, visitors: Set<string> }>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    dailyTrendMap.set(dateStr, { visits: 0, visitors: new Set<string>() });
  }

  visitsList.forEach(v => {
    const dateStr = new Date(v.timestamp).toISOString().split("T")[0];
    if (dailyTrendMap.has(dateStr)) {
      const dayData = dailyTrendMap.get(dateStr)!;
      dayData.visits++;
      dayData.visitors.add(v.ip_address);
    }
  });

  const dailyTrend: any[] = [];
  dailyTrendMap.forEach((val, key) => {
    dailyTrend.push({
      date: key,
      visits: val.visits,
      visitors: val.visitors.size
    });
  });

  // Page views breakdown
  const pathMap: Record<string, number> = {};
  visitsList.forEach(v => {
    const p = v.path || "/";
    pathMap[p] = (pathMap[p] || 0) + 1;
  });
  const pageViews = Object.entries(pathMap).map(([path, count]) => ({ path, count })).sort((a, b) => b.count - a.count);

  // Referrers breakdown
  const refMap: Record<string, number> = {};
  visitsList.forEach(v => {
    let r = v.referrer || "Direct";
    if (r.startsWith("http")) {
      try {
        r = new URL(r).hostname;
      } catch {
        // use default
      }
    }
    refMap[r] = (refMap[r] || 0) + 1;
  });
  const referrers = Object.entries(refMap).map(([referrer, count]) => ({ referrer, count })).sort((a, b) => b.count - a.count);

  // Browser family breakdown (simple parsing)
  const browserMap: Record<string, number> = {};
  visitsList.forEach(v => {
    const ua = (v.user_agent || "").toLowerCase();
    let b = "Other";
    if (ua.includes("firefox")) b = "Firefox";
    else if (ua.includes("chrome") && !ua.includes("edge") && !ua.includes("opr")) b = "Chrome";
    else if (ua.includes("safari") && !ua.includes("chrome")) b = "Safari";
    else if (ua.includes("edge")) b = "Edge";
    else if (ua.includes("opera") || ua.includes("opr")) b = "Opera";
    browserMap[b] = (browserMap[b] || 0) + 1;
  });
  const browsers = Object.entries(browserMap).map(([browser, count]) => ({ browser, count })).sort((a, b) => b.count - a.count);

  return {
    totalVisits,
    uniqueVisitors,
    totalTranslations,
    totalUsers: usersCount,
    dailyTrend,
    pageViews,
    referrers,
    browsers
  };
}

// =====================================================================
// QUOTA RESET — monthly rollover for the word quota on tarjuman_users
// =====================================================================
//
// Each user has a `quotaResetAt` timestamp and a `quotaUsed` integer. On
// upgrade/downgrade we set `quotaResetAt` to "now + 1 month". The reset
// job (see runMonthlyQuotaReset below) walks the table and, for any user
// whose `quotaResetAt` is in the past, sets `quotaUsed = 0` and pushes
// the timestamp forward by another month.

const QUOTA_LIMITS: Record<string, number> = {
  free: 5000,
  pro: 100000,
  enterprise: 9999999,
};

function nextMonth(date: Date): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  return d;
}

/**
 * Stamp the cycle anchor for a user. Called after plan upgrades and on
 * every successful reset. Does NOT touch `quotaUsed`.
 */
export async function setQuotaResetAt(id: string, at: Date): Promise<void> {
  const isoAt = at.toISOString().slice(0, 19).replace("T", " ");
  if (isFallbackMode) {
    fallbackUsers = fallbackUsers.map(u => {
      if (u.id === id) {
        return { ...u, quotaResetAt: isoAt };
      }
      return u;
    });
    return;
  }
  try {
    await pool.query("UPDATE tarjuman_users SET quotaResetAt = ? WHERE id = ?", [isoAt, id]);
  } catch (error) {
    console.error("[DB] setQuotaResetAt failed:", error);
    isFallbackMode = true;
  }
}

/**
 * Reset the word quota for one user. Idempotent — only resets if the
 * `quotaResetAt` is in the past. Returns `true` if a reset actually ran.
 */
export async function resetUserQuotaIfDue(email: string): Promise<boolean> {
  const user = await getUserByEmail(email);
  if (!user) return false;
  const now = new Date();
  const resetAt = user.quotaResetAt ? new Date(user.quotaResetAt) : null;
  if (resetAt && resetAt > now) {
    return false;
  }
  const newResetAt = resetAt ? nextMonth(resetAt) : nextMonth(now);

  if (isFallbackMode) {
    fallbackUsers = fallbackUsers.map(u => {
      if (u.id === user.id) {
        return { ...u, quotaUsed: 0, quotaResetAt: newResetAt.toISOString() };
      }
      return u;
    });
    return true;
  }
  try {
    await pool.query(
      "UPDATE tarjuman_users SET quotaUsed = 0, quotaResetAt = ? WHERE id = ?",
      [newResetAt.toISOString().slice(0, 19).replace("T", " "), user.id]
    );
    return true;
  } catch (error) {
    console.error("[DB] resetUserQuotaIfDue failed:", error);
    return false;
  }
}

/**
 * Walk all users and reset any whose `quotaResetAt` has passed. Returns
 * the count of users that were reset. Safe to run periodically (e.g.
 * from a daily CRON, or via the /api/admin/billing/reset-quotas endpoint).
 */
export async function runMonthlyQuotaReset(): Promise<{ reset: number; total: number; skipped: number }> {
  await ensureInitialized();
  const now = new Date();
  let reset = 0;
  let total = 0;
  let skipped = 0;

  if (isFallbackMode) {
    for (const u of fallbackUsers) {
      total++;
      const due = !u.quotaResetAt || new Date(u.quotaResetAt) <= now;
      if (!due) { skipped++; continue; }
      u.quotaUsed = 0;
      u.quotaResetAt = nextMonth(u.quotaResetAt ? new Date(u.quotaResetAt) : now).toISOString();
      reset++;
    }
    return { reset, total, skipped };
  }

  let conn;
  try {
    conn = await pool.getConnection();
    const [rows]: any = await conn.query("SELECT id, quotaResetAt FROM tarjuman_users");
    total = rows.length;
    for (const row of rows) {
      const due = !row.quotaResetAt || new Date(row.quotaResetAt) <= now;
      if (!due) { skipped++; continue; }
      const next = nextMonth(row.quotaResetAt ? new Date(row.quotaResetAt) : now);
      const iso = next.toISOString().slice(0, 19).replace("T", " ");
      await conn.query("UPDATE tarjuman_users SET quotaUsed = 0, quotaResetAt = ? WHERE id = ?", [iso, row.id]);
      reset++;
    }
  } catch (error) {
    console.error("[DB] runMonthlyQuotaReset failed:", error);
  } finally {
    if (conn) conn.release();
  }
  return { reset, total, skipped };
}

/**
 * Return quota status info for a user: used / limit / resetAt / daysUntilReset.
 * Also opportunistically resets the quota if it's due (so callers don't
 * have to remember). Use this in /api/translate to keep state always correct.
 */
export async function getQuotaStatus(email: string): Promise<{
  quotaUsed: number;
  quotaLimit: number;
  quotaResetAt: string | null;
  daysUntilReset: number;
  wasReset: boolean;
} | null> {
  // Lazy reset if due.
  const wasReset = await resetUserQuotaIfDue(email);
  const user = await getUserByEmail(email);
  if (!user) return null;
  const resetAt = user.quotaResetAt ? new Date(user.quotaResetAt) : null;
  const now = new Date();
  const daysUntilReset = resetAt
    ? Math.max(0, Math.ceil((resetAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  return {
    quotaUsed: wasReset ? 0 : user.quotaUsed,
    quotaLimit: user.quotaLimit,
    quotaResetAt: resetAt ? resetAt.toISOString() : null,
    daysUntilReset,
    wasReset,
  };
}

export async function addFeedback(email: string | null, rating: number, comment: string, details?: string) {
  await ensureInitialized();
  if (isFallbackMode) {
    fallbackLogs.unshift({
      id: fallbackLogs.length + 1,
      timestamp: new Date(),
      action: "Feedback Submitted",
      type: "info",
      details: `Rating: ${rating}* - ${comment} (User: ${email || "anonymous"})`
    });
    return { success: true };
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(
      "INSERT INTO tarjuman_feedback (email, rating, comment, details) VALUES (?, ?, ?, ?)",
      [email, rating, comment, details || null]
    );
    return { success: true };
  } catch (err) {
    console.error("[DB] addFeedback error:", err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

export async function getFeedback() {
  await ensureInitialized();
  if (isFallbackMode) {
    return [
      { id: 1, timestamp: new Date().toISOString(), email: "user1@example.com", rating: 5, comment: "مترجم رائع وسريع جداً، الدقة ممتازة!", details: null },
      { id: 2, timestamp: new Date().toISOString(), email: "user2@example.com", rating: 4, comment: "Great tool, UI is neat.", details: null }
    ];
  }

  let conn;
  try {
    conn = await pool.getConnection();
    const [rows] = await conn.query("SELECT * FROM tarjuman_feedback ORDER BY timestamp DESC LIMIT 100");
    return (rows as any[]).map(row => ({
      ...row,
      timestamp: row.timestamp ? new Date(row.timestamp).toISOString() : null
    }));
  } catch (err) {
    console.error("[DB] getFeedback error:", err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

// =====================================================================
// PAYMENT HELPERS — used by /api/billing/* routes (Paymob integration)
// =====================================================================

export interface PaymentRecord {
  id: string;                       // our internal payment id
  user_email: string;
  plan_id: "free" | "pro" | "enterprise";
  billing_period: "monthly" | "yearly";
  amount_cents: number;
  currency: string;
  provider: "paymob" | "paypal";
  status: "pending" | "paid" | "failed" | "cancelled" | "refunded";
  // Paymob fields
  paymob_order_id?: number;
  paymob_transaction_id?: number;
  paymob_payment_token?: string;
  paymob_hmac_verified?: 0 | 1;
  // PayPal fields
  paypal_order_id?: string;
  paypal_capture_id?: string;
  paypal_payer_id?: string;
  // Timestamps
  created_at?: string;
  updated_at?: string;
  paid_at?: string | null;
}

export async function createPayment(record: Omit<PaymentRecord, "created_at" | "updated_at" | "status" | "provider"> & { provider?: PaymentRecord["provider"]; status?: PaymentRecord["status"] }): Promise<PaymentRecord> {
  await ensureInitialized();
  const newRecord: PaymentRecord = {
    ...record,
    provider: record.provider || "paymob",
    status: record.status || "pending",
    paymob_hmac_verified: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    paid_at: null,
  };

  if (isFallbackMode) {
    fallbackPayments.push(newRecord);
    return newRecord;
  }

  try {
    await pool.query(
      `INSERT INTO tarjuman_payments
       (id, user_email, plan_id, billing_period, amount_cents, currency, provider, status,
        paymob_order_id, paymob_transaction_id, paymob_payment_token, paymob_hmac_verified,
        paypal_order_id, paypal_capture_id, paypal_payer_id, paid_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newRecord.id,
        newRecord.user_email,
        newRecord.plan_id,
        newRecord.billing_period,
        newRecord.amount_cents,
        newRecord.currency,
        newRecord.provider,
        newRecord.status,
        newRecord.paymob_order_id ?? null,
        newRecord.paymob_transaction_id ?? null,
        newRecord.paymob_payment_token ?? null,
        newRecord.paymob_hmac_verified ?? 0,
        newRecord.paypal_order_id ?? null,
        newRecord.paypal_capture_id ?? null,
        newRecord.paypal_payer_id ?? null,
        newRecord.paid_at ?? null,
      ]
    );
    return newRecord;
  } catch (error) {
    console.error("[DB] createPayment failed, using in-memory fallback:", error);
    isFallbackMode = true;
    fallbackPayments.push(newRecord);
    return newRecord;
  }
}

export async function getPaymentById(id: string): Promise<PaymentRecord | null> {
  await ensureInitialized();
  if (isFallbackMode) {
    return fallbackPayments.find(p => p.id === id) || null;
  }
  try {
    const [rows]: any = await pool.query("SELECT * FROM tarjuman_payments WHERE id = ?", [id]);
    if (!rows[0]) return null;
    return rowsToPayment(rows[0]);
  } catch (error) {
    console.error("[DB] getPaymentById failed, using in-memory fallback:", error);
    isFallbackMode = true;
    return fallbackPayments.find(p => p.id === id) || null;
  }
}

export async function getPaymentByPaymobOrderId(paymobOrderId: number): Promise<PaymentRecord | null> {
  await ensureInitialized();
  if (isFallbackMode) {
    return fallbackPayments.find(p => p.paymob_order_id === paymobOrderId) || null;
  }
  try {
    const [rows]: any = await pool.query(
      "SELECT * FROM tarjuman_payments WHERE paymob_order_id = ? ORDER BY created_at DESC LIMIT 1",
      [paymobOrderId]
    );
    if (!rows[0]) return null;
    return rowsToPayment(rows[0]);
  } catch (error) {
    console.error("[DB] getPaymentByPaymobOrderId failed, using in-memory fallback:", error);
    isFallbackMode = true;
    return fallbackPayments.find(p => p.paymob_order_id === paymobOrderId) || null;
  }
}

export async function getLatestPaymentForUser(email: string): Promise<PaymentRecord | null> {
  await ensureInitialized();
  if (isFallbackMode) {
    const userPayments = fallbackPayments
      .filter(p => p.user_email.toLowerCase() === email.toLowerCase())
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
    return userPayments[0] || null;
  }
  try {
    const [rows]: any = await pool.query(
      "SELECT * FROM tarjuman_payments WHERE user_email = ? ORDER BY created_at DESC LIMIT 1",
      [email]
    );
    if (!rows[0]) return null;
    return rowsToPayment(rows[0]);
  } catch (error) {
    console.error("[DB] getLatestPaymentForUser failed, using in-memory fallback:", error);
    isFallbackMode = true;
    const userPayments = fallbackPayments
      .filter(p => p.user_email.toLowerCase() === email.toLowerCase())
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
    return userPayments[0] || null;
  }
}

/**
 * Persist Paymob's order id and (optionally) the single-use payment token
 * on an existing `tarjuman_payments` row.
 */
export async function storePaymobIdentifiers(
  id: string,
  identifiers: { paymob_order_id?: number; paymob_payment_token?: string }
): Promise<PaymentRecord | null> {
  await ensureInitialized();
  const sets: string[] = [];
  const params: any[] = [];
  if (identifiers.paymob_order_id !== undefined) {
    sets.push("paymob_order_id = ?");
    params.push(identifiers.paymob_order_id);
  }
  if (identifiers.paymob_payment_token !== undefined) {
    sets.push("paymob_payment_token = ?");
    params.push(identifiers.paymob_payment_token);
  }
  if (sets.length === 0) return getPaymentById(id);
  sets.push("updated_at = CURRENT_TIMESTAMP");

  if (isFallbackMode) {
    let updated: PaymentRecord | null = null;
    fallbackPayments = fallbackPayments.map(p => {
      if (p.id === id) {
        updated = { ...p, ...identifiers, updated_at: new Date().toISOString() };
        return updated;
      }
      return p;
    });
    return updated;
  }
  try {
    await pool.query(
      `UPDATE tarjuman_payments SET ${sets.join(", ")} WHERE id = ?`,
      [...params, id]
    );
    return getPaymentById(id);
  } catch (error) {
    console.error("[DB] storePaymobIdentifiers failed, using in-memory fallback:", error);
    isFallbackMode = true;
    let updated: PaymentRecord | null = null;
    fallbackPayments = fallbackPayments.map(p => {
      if (p.id === id) {
        updated = { ...p, ...identifiers, updated_at: new Date().toISOString() };
        return updated;
      }
      return p;
    });
    return updated;
  }
}

/**
 * Persist PayPal order id and (optionally) payer id on an existing
 * `tarjuman_payments` row.
 */
export async function storePaypalIdentifiers(
  id: string,
  identifiers: { paypal_order_id?: string; paypal_payer_id?: string; paypal_capture_id?: string }
): Promise<PaymentRecord | null> {
  await ensureInitialized();
  const sets: string[] = [];
  const params: any[] = [];
  if (identifiers.paypal_order_id !== undefined) {
    sets.push("paypal_order_id = ?");
    params.push(identifiers.paypal_order_id);
  }
  if (identifiers.paypal_payer_id !== undefined) {
    sets.push("paypal_payer_id = ?");
    params.push(identifiers.paypal_payer_id);
  }
  if (identifiers.paypal_capture_id !== undefined) {
    sets.push("paypal_capture_id = ?");
    params.push(identifiers.paypal_capture_id);
  }
  if (sets.length === 0) return getPaymentById(id);
  sets.push("updated_at = CURRENT_TIMESTAMP");

  if (isFallbackMode) {
    let updated: PaymentRecord | null = null;
    fallbackPayments = fallbackPayments.map(p => {
      if (p.id === id) {
        updated = { ...p, ...identifiers, updated_at: new Date().toISOString() };
        return updated;
      }
      return p;
    });
    return updated;
  }
  try {
    await pool.query(
      `UPDATE tarjuman_payments SET ${sets.join(", ")} WHERE id = ?`,
      [...params, id]
    );
    return getPaymentById(id);
  } catch (error) {
    console.error("[DB] storePaypalIdentifiers failed, using in-memory fallback:", error);
    isFallbackMode = true;
    let updated: PaymentRecord | null = null;
    fallbackPayments = fallbackPayments.map(p => {
      if (p.id === id) {
        updated = { ...p, ...identifiers, updated_at: new Date().toISOString() };
        return updated;
      }
      return p;
    });
    return updated;
  }
}

/**
 * Look up a payment by its PayPal order id (used by the capture endpoint
 * after PayPal redirects the user back).
 */
export async function getPaymentByPaypalOrderId(paypalOrderId: string): Promise<PaymentRecord | null> {
  await ensureInitialized();
  if (isFallbackMode) {
    return fallbackPayments.find(p => p.paypal_order_id === paypalOrderId) || null;
  }
  try {
    const [rows]: any = await pool.query(
      "SELECT * FROM tarjuman_payments WHERE paypal_order_id = ? ORDER BY created_at DESC LIMIT 1",
      [paypalOrderId]
    );
    if (!rows[0]) return null;
    return rowsToPayment(rows[0]);
  } catch (error) {
    console.error("[DB] getPaymentByPaypalOrderId failed, using in-memory fallback:", error);
    isFallbackMode = true;
    return fallbackPayments.find(p => p.paypal_order_id === paypalOrderId) || null;
  }
}

export async function updatePaymentStatus(
  id: string,
  update: {
    status?: PaymentRecord["status"];
    paymob_transaction_id?: number;
    paymob_hmac_verified?: 0 | 1;
    paid_at?: string | null;
  }
): Promise<PaymentRecord | null> {
  await ensureInitialized();
  const sets: string[] = [];
  const params: any[] = [];
  if (update.status !== undefined) { sets.push("status = ?"); params.push(update.status); }
  if (update.paymob_transaction_id !== undefined) { sets.push("paymob_transaction_id = ?"); params.push(update.paymob_transaction_id); }
  if (update.paymob_hmac_verified !== undefined) { sets.push("paymob_hmac_verified = ?"); params.push(update.paymob_hmac_verified); }
  if (update.paid_at !== undefined) { sets.push("paid_at = ?"); params.push(update.paid_at); }
  sets.push("updated_at = CURRENT_TIMESTAMP");

  if (isFallbackMode) {
    let updated: PaymentRecord | null = null;
    fallbackPayments = fallbackPayments.map(p => {
      if (p.id === id) {
        updated = { ...p, ...update, updated_at: new Date().toISOString() };
        return updated;
      }
      return p;
    });
    return updated;
  }

  try {
    await pool.query(
      `UPDATE tarjuman_payments SET ${sets.join(", ")} WHERE id = ?`,
      [...params, id]
    );
    return await getPaymentById(id);
  } catch (error) {
    console.error("[DB] updatePaymentStatus failed, using in-memory fallback:", error);
    isFallbackMode = true;
    let updated: PaymentRecord | null = null;
    fallbackPayments = fallbackPayments.map(p => {
      if (p.id === id) {
        updated = { ...p, ...update, updated_at: new Date().toISOString() };
        return updated;
      }
      return p;
    });
    return updated;
  }
}

export async function getAllPayments(): Promise<PaymentRecord[]> {
  await ensureInitialized();
  if (isFallbackMode) {
    return fallbackPayments.slice().sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
  }
  try {
    const [rows]: any = await pool.query("SELECT * FROM tarjuman_payments ORDER BY created_at DESC LIMIT 200");
    return (rows as any[]).map(rowsToPayment);
  } catch (error) {
    console.error("[DB] getAllPayments failed, using in-memory fallback:", error);
    isFallbackMode = true;
    return fallbackPayments.slice().sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
  }
}

function rowsToPayment(row: any): PaymentRecord {
  return {
    id: row.id,
    user_email: row.user_email,
    plan_id: row.plan_id,
    billing_period: row.billing_period,
    amount_cents: row.amount_cents,
    currency: row.currency,
    provider: row.provider || "paymob",
    status: row.status,
    paymob_order_id: row.paymob_order_id ?? undefined,
    paymob_transaction_id: row.paymob_transaction_id ?? undefined,
    paymob_payment_token: row.paymob_payment_token ?? undefined,
    paymob_hmac_verified: row.paymob_hmac_verified ?? 0,
    paypal_order_id: row.paypal_order_id ?? undefined,
    paypal_capture_id: row.paypal_capture_id ?? undefined,
    paypal_payer_id: row.paypal_payer_id ?? undefined,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
    paid_at: row.paid_at ? new Date(row.paid_at).toISOString() : null,
  };
}
