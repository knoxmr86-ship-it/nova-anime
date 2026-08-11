const express = require("express");
const session = require("express-session");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config?.();

const app = express();
const db = new Database("animevault.db");
const PORT = process.env.PORT || 3000;

app.use(express.json({limit:"2mb"}));
app.use(express.urlencoded({extended:true}));
app.use(session({
  secret: process.env.SESSION_SECRET || "CHANGE_ME_IN_PRODUCTION",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly:true, sameSite:"lax", secure:false, maxAge: 7*24*60*60*1000 }
}));

db.exec(`
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  membership_until TEXT
);
CREATE TABLE IF NOT EXISTS anime (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  poster TEXT DEFAULT '',
  video_url TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

function setting(key, fallback) {
  const row = db.prepare("SELECT value FROM settings WHERE key=?").get(key);
  return row ? row.value : fallback;
}
function setSetting(key, value) {
  db.prepare("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(key, String(value));
}
setSetting("site_name", setting("site_name", "NOVA ANIME"));
setSetting("weekly_price", setting("weekly_price", "199"));
setSetting("currency", setting("currency", "PKR"));

const adminUser = process.env.ADMIN_USERNAME || "owner";
const adminPass = process.env.ADMIN_PASSWORD || "CHANGE_THIS_PASSWORD";
if (!db.prepare("SELECT id FROM users WHERE username=?").get(adminUser)) {
  db.prepare("INSERT INTO users(username,password_hash) VALUES(?,?)").run(adminUser, bcrypt.hashSync(adminPass, 12));
}

function requireAdmin(req,res,next){
  if (!req.session.admin) return res.status(401).json({error:"Admin login required"});
  next();
}
function requireMember(req,res,next){
  if (!req.session.user) return res.status(401).json({error:"Login required"});
  const u = db.prepare("SELECT membership_until FROM users WHERE id=?").get(req.session.user.id);
  if (!u || !u.membership_until || new Date(u.membership_until) <= new Date())
    return res.status(403).json({error:"Active membership required"});
  next();
}

app.get("/api/public", (req,res)=>{
  res.json({
    site_name: setting("site_name","NOVA ANIME"),
    weekly_price: setting("weekly_price","199"),
    currency: setting("currency","PKR"),
    logged_in: !!req.session.user,
    is_member: !!req.session.user && (() => {
      const u=db.prepare("SELECT membership_until FROM users WHERE id=?").get(req.session.user.id);
      return !!u?.membership_until && new Date(u.membership_until)>new Date();
    })()
  });
});

app.post("/api/login", (req,res)=>{
  const {username,password}=req.body;
  const u=db.prepare("SELECT * FROM users WHERE username=?").get(username);
  if(!u || !bcrypt.compareSync(password,u.password_hash)) return res.status(401).json({error:"Invalid login"});
  req.session.user={id:u.id,username:u.username};
  res.json({ok:true});
});

app.post("/api/logout",(req,res)=>req.session.destroy(()=>res.json({ok:true})));

app.get("/api/anime", (req,res)=>{
  const rows=db.prepare("SELECT id,title,description,poster,created_at FROM anime ORDER BY id DESC").all();
  res.json(rows);
});

app.get("/api/anime/:id", requireMember, (req,res)=>{
  const row=db.prepare("SELECT * FROM anime WHERE id=?").get(req.params.id);
  if(!row) return res.status(404).json({error:"Anime not found"});
  res.json(row);
});

/*
  Payment flow:
  1) Create a verified merchant account with Easypaisa/JazzCash.
  2) Put their server-side credentials in environment variables.
  3) Replace /api/payment/create with the gateway's official API flow.
  4) Only activate membership after the gateway's server-to-server
     callback/webhook confirms a successful payment.
  The demo button below intentionally does NOT fake a successful payment.
*/
app.post("/api/payment/create", (req,res)=>{
  const {method}=req.body;
  if(!["easypaisa","jazzcash"].includes(method)) return res.status(400).json({error:"Unsupported payment method"});
  res.json({
    ok:false,
    message:`${method} is selected. Connect the official merchant API/webhook before accepting real payments.`
  });
});

app.get("/api/admin/me", requireAdmin, (req,res)=>res.json({username:req.session.admin.username}));

app.post("/api/admin/login",(req,res)=>{
  const {username,password}=req.body;
  const u=db.prepare("SELECT * FROM users WHERE username=?").get(username);
  if(!u || u.username !== adminUser || !bcrypt.compareSync(password,u.password_hash))
    return res.status(401).json({error:"Invalid admin credentials"});
  req.session.admin={username:u.username};
  res.json({ok:true});
});
app.post("/api/admin/logout",(req,res)=>{ req.session.admin=null; res.json({ok:true}); });

app.get("/api/admin/settings", requireAdmin, (req,res)=>{
  res.json({
    site_name:setting("site_name","NOVA ANIME"),
    weekly_price:setting("weekly_price","199")
  });
});
app.put("/api/admin/settings", requireAdmin, (req,res)=>{
  if(req.body.site_name!==undefined) setSetting("site_name",req.body.site_name);
  if(req.body.weekly_price!==undefined) setSetting("weekly_price",req.body.weekly_price);
  res.json({ok:true});
});

app.post("/api/admin/anime", requireAdmin, (req,res)=>{
  const {title,description,poster,video_url}=req.body;
  if(!title || !video_url) return res.status(400).json({error:"Title and video URL are required"});
  const info=db.prepare("INSERT INTO anime(title,description,poster,video_url) VALUES(?,?,?,?)")
    .run(title,description||"",poster||"",video_url);
  res.json({id:info.lastInsertRowid});
});
app.delete("/api/admin/anime/:id", requireAdmin, (req,res)=>{
  db.prepare("DELETE FROM anime WHERE id=?").run(req.params.id);
  res.json({ok:true});
});

app.get("/admin", (req,res)=>res.sendFile(path.join(__dirname,"public","admin.html")));
app.use(express.static(path.join(__dirname,"public")));
app.listen(PORT,()=>console.log(`NOVA ANIME running at http://localhost:${PORT}`));
