import mysql from "mysql2/promise";
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
});

// Resilient Fallback Mode State
let isFallbackMode = false;
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

    // Promote romyatef@gmail.com to super_admin in database and set all permissions
    const superAdminPerms = JSON.stringify(["super_admin", "dashboard", "users_view", "users_manage", "config_manage", "logs_view", "translate", "upload_files", "linguistic_analysis", "analytics_view"]);
    await conn.query(
      "UPDATE tarjuman_users SET role = 'super_admin', permissions = ? WHERE email = 'romyatef@gmail.com'",
      [superAdminPerms]
    );

    // Seed default configuration if empty
    const [configRows]: any = await conn.query("SELECT COUNT(*) as count FROM tarjuman_system_config");
    if (configRows[0].count === 0) {
      const defaultConfig = {
        defaultFreeLimit: 5000,
        translationEngine: "gemini-3.5-flash",
        requireAuthForUpload: true,
        maintenanceMode: false,
        enableLinguisticAnalysis: true,
        logTranslationRequests: true,
      };
      for (const [key, val] of Object.entries(defaultConfig)) {
        await conn.query(
          "INSERT INTO tarjuman_system_config (config_key, config_value) VALUES (?, ?)",
          [key, JSON.stringify(val)]
        );
      }
      console.log("[DB] Seeded default system configurations.");
    }

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
  } finally {
    if (conn) conn.release();
  }
}

async function ensureInitialized() {
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
