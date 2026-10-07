<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>EkaJaya — Beauty Management System</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <style>
    /* ═══════════════════════════════════════════════════════════
       EKAJAYA DASHBOARD — Brand-accurate color palette
       Logo colors:
         Cobalt    #2563a8  primary blue (teks EKA JAYA)
         Sky       #4a9fd4  bright blue  (daun atas / highlight)
         Teal      #3aaa8c  teal green   (daun bawah)
         Silver    #8ba0b0  sphere accent
         White     #ffffff  background
       ═══════════════════════════════════════════════════════════ */

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --cobalt:      #2563a8;
      --cobalt-dark: #1a4a85;
      --cobalt-deep: #0f3060;
      --cobalt-mid:  #3070b8;
      --cobalt-lite: #dbeafe;
      --cobalt-soft: #eff6ff;

      --sky:         #4a9fd4;
      --sky-dark:    #2e7db0;
      --sky-lite:    #cde8f8;
      --sky-soft:    #f0f8fd;

      --teal:        #3aaa8c;
      --teal-dark:   #2a8870;
      --teal-lite:   #c6ede3;
      --teal-soft:   #f0faf7;

      --silver:      #8ba0b0;
      --silver-lite: #e8f0f5;
      --silver-soft: #f4f7fa;

      --ink:         #1a2d42;
      --ink-mid:     #3a5068;
      --ink-soft:    #6a8098;
      --ink-faint:   #9ab0c0;

      --bg:          #f4f8fc;
      --surface:     #ffffff;
      --border:      #d0e4f0;
      --border-lite: #e8f2f8;
    }

    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: var(--bg);
      background-image:
        radial-gradient(ellipse at 0% 0%,   rgba(74,159,212,.10) 0%, transparent 45%),
        radial-gradient(ellipse at 100% 100%, rgba(58,170,140,.08) 0%, transparent 45%);
      min-height: 100vh;
      color: var(--ink);
    }

    /* ── Scrollbars ── */
    #sidebar::-webkit-scrollbar        { width: 4px; }
    #sidebar::-webkit-scrollbar-track  { background: transparent; }
    #sidebar::-webkit-scrollbar-thumb  { background: var(--sky-dark); border-radius: 99px; }
    #main-content::-webkit-scrollbar        { width: 5px; }
    #main-content::-webkit-scrollbar-track  { background: transparent; }
    #main-content::-webkit-scrollbar-thumb  { background: var(--border); border-radius: 99px; }

    /* ═══════════════════════════════════════════════════════════
       SIDEBAR
       ═══════════════════════════════════════════════════════════ */
    #sidebar {
      width: 268px;
      /* Sidebar: white with cobalt accent — matches logo's clean style */
      background: #ffffff;
      border-right: 1px solid var(--border-lite);
      box-shadow: 4px 0 24px rgba(37,99,168,.08);
      display: flex; flex-direction: column;
      position: fixed; top: 0; left: 0; bottom: 0;
      z-index: 50; overflow-y: auto;
      transition: left .26s ease;
    }
    .main-wrapper { margin-left: 268px; display: flex; flex-direction: column; min-height: 100vh; }

    /* Brand */
    .sb-brand {
      padding: 1.1rem 1.1rem .9rem;
      background: linear-gradient(135deg, var(--cobalt-deep) 0%, var(--cobalt) 55%, var(--sky) 100%);
      position: relative;
    }
    .sb-brand::after {
      content: '';
      position: absolute; right: -20px; top: -20px;
      width: 100px; height: 100px; border-radius: 50%;
      background: rgba(255,255,255,.06);
      pointer-events: none;
    }
    .sb-brand-row { display: flex; align-items: center; gap: .85rem; position: relative; z-index: 1; }
    .sb-logo-box {
      /* Putih bersih agar logo PNG transparan terlihat sempurna */
      width: 52px; height: 52px; border-radius: 10px; flex-shrink: 0;
      background: #ffffff;
      border: 2px solid rgba(255,255,255,.5);
      box-shadow: 0 2px 10px rgba(0,0,0,.18);
      display: flex; align-items: center; justify-content: center;
      padding: 3px;
    }
    .sb-logo-box img {
      width: 100%; height: 100%;
      object-fit: contain;
      display: block;
    }
    .sb-logo-fallback { display: none; color: var(--cobalt); font-size: 1.4rem; font-weight: 900; }
    .sb-name { color: #fff; font-size: 1.1rem; font-weight: 800; letter-spacing: .03em; line-height: 1.2; }
    .sb-sub  { color: rgba(255,255,255,.7); font-size: .68rem; font-weight: 500; letter-spacing: .13em; text-transform: uppercase; margin-top: 2px; }

    /* User card */
    .sb-user { padding: .85rem 1rem; border-bottom: 1px solid var(--border-lite); }
    .sb-user-inner {
      display: flex; align-items: center; gap: .75rem;
      background: var(--cobalt-soft); border-radius: 12px;
      padding: .6rem .85rem; border: 1px solid var(--cobalt-lite);
    }
    .sb-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, var(--cobalt), var(--sky));
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: .75rem; font-weight: 700; flex-shrink: 0;
    }
    .sb-uname { color: var(--ink); font-size: .85rem; font-weight: 700; line-height: 1.2; }
    .sb-urole { color: var(--ink-soft); font-size: .72rem; }
    .sb-dot   { width: 8px; height: 8px; border-radius: 50%; background: var(--teal); flex-shrink: 0; margin-left: auto; box-shadow: 0 0 0 2px var(--teal-lite); }

    /* Nav */
    .sb-nav { flex: 1; padding: .85rem .75rem; display: flex; flex-direction: column; gap: 2px; }
    .nav-group {
      font-size: .65rem; font-weight: 700; letter-spacing: .16em;
      text-transform: uppercase; color: var(--silver);
      padding: 0 12px; margin: 16px 0 5px;
    }
    .nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 12px; border-radius: 10px;
      cursor: pointer; transition: all .15s ease;
      color: var(--ink-mid); font-size: .83rem; font-weight: 500;
      border: 1px solid transparent; text-decoration: none;
      user-select: none;
    }
    .nav-item:hover {
      background: var(--cobalt-soft);
      color: var(--cobalt);
      border-color: var(--cobalt-lite);
    }
    .nav-item.active {
      background: linear-gradient(135deg, var(--cobalt), var(--sky));
      color: #fff; border-color: transparent;
      box-shadow: 0 4px 14px rgba(37,99,168,.28);
    }
    .nav-badge { margin-left: auto; font-size: .7rem; border-radius: 99px; padding: 2px 7px; background: var(--silver-lite); color: var(--ink-mid); font-family: 'DM Mono', monospace; }
    .nav-item.active .nav-badge { background: rgba(255,255,255,.22); color: #fff; }
    .nav-badge-red { background: #fee2e2; color: #dc2626; }
    .nav-item.active .nav-badge-red { background: rgba(239,68,68,.3); color: #fca5a5; }

    /* Sidebar bottom */
    .sb-bottom { padding: .85rem .75rem; border-top: 1px solid var(--border-lite); }
    .sb-btn {
      width: 100%; display: flex; align-items: center; gap: .75rem;
      padding: .6rem 1rem; border-radius: 10px; font-size: .83rem; font-weight: 500;
      cursor: pointer; border: none; font-family: 'Plus Jakarta Sans', sans-serif;
      transition: all .15s; color: var(--ink-soft); background: transparent;
    }
    .sb-btn:hover { background: var(--silver-soft); color: var(--ink); }
    .sb-btn-logout {
      margin-top: 4px; background: #fef2f2; color: #dc2626;
      border: 1px solid #fecaca; font-weight: 600;
    }
    .sb-btn-logout:hover { background: #fee2e2; }
    .sb-version { text-align: center; font-size: .67rem; color: var(--ink-faint); margin-top: .7rem; }

    /* Mobile overlay */
    #sidebar-overlay { display: none; }

    /* ═══════════════════════════════════════════════════════════
       TOPBAR
       ═══════════════════════════════════════════════════════════ */
    .topbar {
      position: sticky; top: 0; z-index: 30;
      display: flex; align-items: center; gap: 1rem;
      padding: .8rem 1.75rem;
      background: rgba(255,255,255,.95);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-lite);
      box-shadow: 0 1px 8px rgba(37,99,168,.06);
    }
    .topbar-ham { display: none; flex-direction: column; gap: 5px; padding: .4rem; border-radius: 10px; background: transparent; border: none; cursor: pointer; }
    .topbar-ham span { display: block; width: 20px; height: 2px; background: var(--ink); border-radius: 2px; }
    .topbar-ham:hover { background: var(--cobalt-soft); }
    .topbar-title h1 { font-size: 1.05rem; font-weight: 700; color: var(--cobalt-deep); line-height: 1.2; }
    .topbar-title p  { font-size: .73rem; color: var(--ink-soft); margin-top: 2px; }
    .topbar-search { position: relative; width: 260px; margin-left: auto; }
    .topbar-search span { position: absolute; left: .75rem; top: 50%; transform: translateY(-50%); font-size: .9rem; pointer-events: none; }
    .topbar-search input {
      width: 100%; padding: .55rem .9rem .55rem 2.1rem;
      background: var(--cobalt-soft); border: 1.5px solid var(--cobalt-lite);
      border-radius: 10px; font-size: .83rem;
      font-family: 'Plus Jakarta Sans', sans-serif; color: var(--ink); outline: none;
      transition: all .18s;
    }
    .topbar-search input::placeholder { color: var(--ink-faint); }
    .topbar-search input:focus { background: #fff; border-color: var(--sky); box-shadow: 0 0 0 3px var(--sky-lite); }
    .topbar-actions { display: flex; align-items: center; gap: .25rem; }

    /* Icon button */
    .topbar-icon-btn {
      position: relative; padding: .52rem .58rem; border-radius: 10px;
      background: transparent; border: 1px solid transparent; cursor: pointer;
      font-size: .9rem; transition: all .15s; display: flex; align-items: center;
      color: var(--ink-mid);
    }
    .topbar-icon-btn:hover  { background: var(--cobalt-soft); border-color: var(--cobalt-lite); }
    .topbar-icon-btn.dd-open{ background: var(--cobalt-soft); border-color: var(--cobalt-lite); }
    .topbar-notif-count {
      position: absolute; top: 4px; right: 4px; min-width: 16px; height: 16px;
      border-radius: 99px; background: #ef4444; color: #fff;
      font-size: .58rem; font-weight: 700; line-height: 1;
      display: flex; align-items: center; justify-content: center; padding: 0 3px;
      border: 1.5px solid #fff;
    }

    /* Avatar button */
    .topbar-avatar-btn {
      display: flex; align-items: center; gap: .5rem;
      padding: .32rem .55rem .32rem .32rem;
      border-radius: 10px; border: 1px solid transparent; cursor: pointer;
      background: transparent; transition: all .15s;
      font-family: 'Plus Jakarta Sans', sans-serif; margin-left: .1rem;
    }
    .topbar-avatar-btn:hover  { background: var(--cobalt-soft); border-color: var(--cobalt-lite); }
    .topbar-avatar-btn.dd-open{ background: var(--cobalt-soft); border-color: var(--cobalt-lite); }
    .topbar-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: linear-gradient(135deg, var(--cobalt), var(--sky));
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: .72rem; font-weight: 700; flex-shrink: 0;
    }
    .topbar-avatar-info { text-align: left; }
    .topbar-avatar-name { font-size: .8rem; font-weight: 600; color: var(--ink); line-height: 1.2; }
    .topbar-avatar-role { font-size: .68rem; color: var(--ink-soft); }
    .topbar-chevron { font-size: .6rem; color: var(--ink-faint); margin-left: .15rem; transition: transform .18s; display: inline-block; }
    .topbar-avatar-btn.dd-open .topbar-chevron { transform: rotate(180deg); }

    /* Dropdown wrapper */
    .dd-wrap { position: relative; }

    /* Dropdown panel */
    .dd-panel {
      display: none; position: absolute; top: calc(100% + 8px); right: 0;
      background: #fff; border: 1px solid var(--border-lite); border-radius: 14px;
      box-shadow: 0 12px 40px rgba(37,99,168,.14), 0 2px 8px rgba(0,0,0,.06);
      z-index: 200; min-width: 230px; overflow: hidden;
      animation: ddIn .15s ease both;
    }
    .dd-panel.wide { min-width: 300px; }
    .dd-panel.open { display: block; }

    @keyframes ddIn {
      from { opacity:0; transform:translateY(-6px); }
      to   { opacity:1; transform:translateY(0); }
    }

    /* Panel header */
    .dd-head {
      padding: .85rem 1rem .7rem; background: var(--cobalt-soft);
      border-bottom: 1px solid var(--cobalt-lite);
    }
    .dd-head-title { font-size: .8rem; font-weight: 700; color: var(--cobalt-deep); }
    .dd-head-sub   { font-size: .7rem; color: var(--ink-soft); margin-top: 2px; }

    /* Panel item */
    .dd-item {
      display: flex; align-items: center; gap: .75rem; padding: .7rem 1rem;
      cursor: pointer; transition: background .12s; text-decoration: none;
      color: var(--ink-mid); border: none; background: none;
      width: 100%; font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: .83rem; text-align: left;
    }
    .dd-item:hover { background: var(--cobalt-soft); color: var(--cobalt); }
    .dd-item:hover .dd-ico { background: var(--cobalt-lite); }
    .dd-ico {
      width: 32px; height: 32px; border-radius: 8px; background: var(--silver-lite);
      display: flex; align-items: center; justify-content: center;
      font-size: .9rem; flex-shrink: 0; transition: background .12s;
    }
    .dd-ico-cobalt { background: var(--cobalt-lite); }
    .dd-ico-teal   { background: var(--teal-lite); }
    .dd-ico-red    { background: #fee2e2; }
    .dd-item-body  { flex: 1; min-width: 0; }
    .dd-item-label { font-weight: 600; font-size: .83rem; color: var(--ink); }
    .dd-item-desc  { font-size: .7rem; color: var(--ink-soft); margin-top: 1px; }
    .dd-pill {
      font-size: .62rem; font-weight: 700; padding: 2px 7px; border-radius: 99px;
      flex-shrink: 0;
    }
    .dd-pill-red  { background: #fee2e2; color: #dc2626; }
    .dd-pill-blue { background: var(--cobalt-lite); color: var(--cobalt); }
    .dd-pill-teal { background: var(--teal-lite); color: var(--teal-dark); }

    /* Inbox item */
    .dd-inbox {
      display: flex; gap: .65rem; padding: .75rem 1rem;
      cursor: pointer; transition: background .12s;
      border-bottom: 1px solid var(--border-lite);
    }
    .dd-inbox:last-child { border-bottom: none; }
    .dd-inbox:hover { background: var(--cobalt-soft); }
    .dd-inbox-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
    .dd-inbox-dot.unread { background: var(--cobalt); box-shadow: 0 0 0 3px var(--cobalt-lite); }
    .dd-inbox-dot.read   { background: var(--border); }
    .dd-inbox-body { flex:1; min-width:0; }
    .dd-inbox-title{ font-size:.79rem; font-weight:600; color:var(--ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .dd-inbox-sub  { font-size:.71rem; color:var(--ink-soft); margin-top:1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .dd-inbox-time { font-size:.67rem; color:var(--ink-faint); margin-top:3px; }

    /* User profile section inside dropdown */
    .dd-profile {
      display: flex; align-items: center; gap: .75rem;
      padding: .9rem 1rem; background: var(--cobalt-soft);
      border-bottom: 1px solid var(--cobalt-lite);
    }
    .dd-profile-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: linear-gradient(135deg, var(--cobalt), var(--sky));
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: .85rem; font-weight: 700; flex-shrink: 0;
    }
    .dd-profile-name { font-size: .85rem; font-weight: 700; color: var(--cobalt-deep); }
    .dd-profile-role { font-size: .72rem; color: var(--ink-soft); }
    .dd-profile-email{ font-size: .7rem; color: var(--ink-faint); margin-top:1px; }

    /* Divider */
    .dd-divider { height: 1px; background: var(--border-lite); margin: .2rem 0; }

    /* Footer link */
    .dd-foot {
      padding: .6rem 1rem; border-top: 1px solid var(--border-lite);
      background: var(--cobalt-soft); text-align: center;
    }
    .dd-foot a { font-size: .78rem; font-weight: 600; color: var(--cobalt); text-decoration: none; cursor: pointer; }
    .dd-foot a:hover { text-decoration: underline; }

    /* Logout item style */
    .dd-item.danger { color: #dc2626; }
    .dd-item.danger:hover { background: #fef2f2; }
    .dd-item.danger .dd-ico { background: #fee2e2; }

    /* ═══════════════════════════════════════════════════════════
       MAIN CONTENT
       ═══════════════════════════════════════════════════════════ */
    #main-content { flex: 1; overflow-y: auto; padding: 1.5rem 1.75rem; display: flex; flex-direction: column; gap: 2rem; }

    /* ── Stat cards ── */
    .stat-top { display: grid; grid-template-columns: 2fr 1fr; gap: 1rem; margin-bottom: 1rem; }

    .stat-card {
      background: #fff; border: 1px solid var(--border-lite);
      border-radius: 18px; padding: 1.5rem;
      box-shadow: 0 2px 16px rgba(37,99,168,.07);
      position: relative; overflow: hidden;
    }
    /* Gradient top strip */
    .stat-card::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
      background: linear-gradient(90deg, var(--cobalt), var(--sky), var(--teal));
    }
    .stat-wm { position: absolute; right: 18px; top: 20px; font-size: 3.8rem; opacity: .045; user-select: none; color: var(--cobalt); font-weight: 900; line-height: 1; letter-spacing: -.02em; }
    .stat-lbl { font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .13em; color: var(--sky); margin-bottom: .75rem; }
    .stat-nums { display: flex; align-items: baseline; gap: .5rem; flex-wrap: wrap; }
    .stat-big  { font-family: 'DM Mono', monospace; font-size: 2.8rem; font-weight: 700; color: var(--cobalt); line-height: 1; }
    .stat-sep  { font-size: 1.5rem; color: var(--border); }
    .stat-sm   { font-family: 'DM Mono', monospace; font-size: 1.9rem; font-weight: 600; color: var(--sky); line-height: 1; }
    .stat-desc { font-size: .73rem; color: var(--ink-soft); margin-top: .3rem; }
    .stat-bar-track { margin-top: 1rem; background: var(--cobalt-soft); border-radius: 99px; height: 7px; max-width: 360px; }
    .stat-bar-fill  {
      height: 7px; border-radius: 99px;
      background: linear-gradient(90deg, var(--cobalt), var(--sky), var(--teal));
      transition: width 1.3s cubic-bezier(.4,0,.2,1);
    }
    .stat-rate { font-size: .72rem; color: var(--ink-soft); margin-top: .4rem; font-family: 'DM Mono', monospace; }

    /* Dark stat card */
    .stat-dark {
      border-radius: 18px; padding: 1.5rem;
      background: linear-gradient(135deg, var(--cobalt-deep) 0%, var(--cobalt) 60%, var(--sky) 100%);
      box-shadow: 0 6px 24px rgba(37,99,168,.28);
      position: relative; overflow: hidden;
      display: flex; flex-direction: column; justify-content: space-between;
    }
    .stat-dark::before {
      content: ''; position: absolute;
      right: -24px; bottom: -24px;
      width: 120px; height: 120px; border-radius: 50%;
      background: rgba(255,255,255,.08);
    }
    .stat-dark::after {
      content: ''; position: absolute;
      right: 20px; top: 20px;
      width: 50px; height: 50px; border-radius: 50%;
      background: rgba(74,159,212,.2);
    }
    .stat-dark .stat-lbl  { color: var(--sky-lite); }
    .stat-dark .stat-big  { color: #fff; }
    .stat-dark .stat-desc { color: rgba(255,255,255,.65); }
    .stat-pending {
      display: inline-flex; align-items: center; gap: .3rem;
      font-size: .7rem; font-weight: 600; padding: 5px 12px; border-radius: 99px;
      background: rgba(255,255,255,.15); color: #fff;
      border: 1px solid rgba(255,255,255,.25);
      align-self: flex-start; margin-top: .75rem; backdrop-filter: blur(4px);
    }

    /* Quick stats */
    .stat-quick { display: grid; grid-template-columns: repeat(4,1fr); gap: .85rem; }
    .stat-quick-card {
      background: #fff; border: 1px solid var(--border-lite);
      border-radius: 14px; padding: 1rem 1.1rem;
      box-shadow: 0 2px 8px rgba(37,99,168,.05);
      display: flex; align-items: center; gap: .85rem;
      transition: all .18s;
    }
    .stat-quick-card:hover { box-shadow: 0 6px 20px rgba(37,99,168,.10); transform: translateY(-1px); }
    .stat-quick-num { font-family: 'DM Mono', monospace; font-size: 1.25rem; font-weight: 700; color: var(--cobalt); }
    .stat-quick-lbl { font-size: .72rem; color: var(--ink-soft); }

    /* ═══════════════════════════════════════════════════════════
       SECTION HEADING
       ═══════════════════════════════════════════════════════════ */
    .sec-rule { display: flex; align-items: center; gap: 12px; margin-bottom: 1rem; }
    .sec-bar  { width: 4px; height: 22px; border-radius: 2px; flex-shrink: 0; }
    .sec-rule h2 { font-size: 1rem; font-weight: 700; color: var(--cobalt-deep); white-space: nowrap; }
    .sec-sub  { font-size: .73rem; color: var(--ink-soft); }
    .sec-line { flex: 1; height: 1px; background: linear-gradient(90deg, var(--border-lite), transparent); }
    .sec-badge-red { font-size: .68rem; font-weight: 700; padding: 3px 10px; border-radius: 99px; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; white-space: nowrap; }

    /* ═══════════════════════════════════════════════════════════
       MENU CARDS
       ═══════════════════════════════════════════════════════════ */
    .menu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px,1fr)); gap: 1rem; }

    .menu-card {
      background: #fff; border: 1px solid var(--border-lite);
      border-radius: 14px; padding: 18px;
      cursor: pointer; transition: all .2s ease;
      position: relative; overflow: hidden;
      display: flex; flex-direction: column; gap: 10px;
      text-decoration: none; color: inherit;
      animation: fadeUp .35s ease both;
    }
    /* Subtle top border accent */
    .menu-card::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
      border-radius: 14px 14px 0 0; opacity: 0;
      transition: opacity .2s;
    }
    .menu-card:hover { box-shadow: 0 10px 32px rgba(37,99,168,.13); border-color: var(--sky-lite); transform: translateY(-3px); }
    .menu-card:hover::before { opacity: 1; }

    /* Accent top bar variants */
    .ac-cobalt::before { background: linear-gradient(90deg, var(--cobalt), var(--sky)); }
    .ac-sky::before    { background: linear-gradient(90deg, var(--sky), #82c8e8); }
    .ac-teal::before   { background: linear-gradient(90deg, var(--teal), #5dd4b4); }
    .ac-mixed::before  { background: linear-gradient(90deg, var(--cobalt), var(--teal)); }
    .ac-danger::before { background: linear-gradient(90deg, #ef4444, #f87171); }

    /* Icon wrap */
    .iw { width: 42px; height: 42px; border-radius: 11px; display: flex; align-items: center; justify-content: center; font-size: 1.15rem; flex-shrink: 0; }
    .iw-cobalt { background: var(--cobalt-soft); }
    .iw-sky    { background: var(--sky-soft); }
    .iw-teal   { background: var(--teal-soft); }
    .iw-silver { background: var(--silver-soft); }
    .iw-danger { background: #fef2f2; }

    /* Card title & desc */
    .ct { font-size: .88rem; font-weight: 700; line-height: 1.3; }
    .ct-cobalt { color: var(--cobalt); }
    .ct-sky    { color: var(--sky-dark); }
    .ct-teal   { color: var(--teal-dark); }
    .ct-danger { color: #dc2626; }

    .cd { font-size: .74rem; color: var(--ink-soft); line-height: 1.4; }

    /* Badges */
    .badge { display: inline-flex; align-items: center; font-size: .64rem; font-weight: 600; letter-spacing: .04em; padding: 3px 9px; border-radius: 99px; align-self: flex-start; margin-top: auto; }
    .bd-cobalt { background: var(--cobalt-soft); color: var(--cobalt); border: 1px solid var(--cobalt-lite); }
    .bd-sky    { background: var(--sky-soft);    color: var(--sky-dark); border: 1px solid var(--sky-lite); }
    .bd-teal   { background: var(--teal-soft);   color: var(--teal-dark); border: 1px solid var(--teal-lite); }
    .bd-danger { background: #fef2f2;             color: #dc2626; border: 1px solid #fecaca; }

    /* Stagger animations */
    @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
    .menu-card:nth-child(1)  { animation-delay:.03s } .menu-card:nth-child(2)  { animation-delay:.06s }
    .menu-card:nth-child(3)  { animation-delay:.09s } .menu-card:nth-child(4)  { animation-delay:.12s }
    .menu-card:nth-child(5)  { animation-delay:.15s } .menu-card:nth-child(6)  { animation-delay:.18s }
    .menu-card:nth-child(7)  { animation-delay:.21s } .menu-card:nth-child(8)  { animation-delay:.24s }
    .menu-card:nth-child(9)  { animation-delay:.27s } .menu-card:nth-child(10) { animation-delay:.30s }
    .menu-card:nth-child(11) { animation-delay:.33s } .menu-card:nth-child(12) { animation-delay:.36s }

    /* Footer */
    .page-footer { text-align: center; padding: 1.5rem 0 .5rem; font-size: .72rem; color: var(--ink-faint); border-top: 1px solid var(--border-lite); margin-top: .5rem; }

    /* ═══════════════════════════════════════════════════════════
       RESPONSIVE
       ═══════════════════════════════════════════════════════════ */
    @media (max-width:1024px) {
      #sidebar { left:-268px; }
      #sidebar.open { left:0; }
      #sidebar-overlay { display:block; }
      #sidebar-overlay.visible { position:fixed; inset:0; z-index:40; background:rgba(15,48,96,.45); backdrop-filter:blur(3px); }
      .main-wrapper { margin-left:0; }
      .topbar-ham { display:flex; }
      .topbar-search { width:200px; }
      .stat-top { grid-template-columns:1fr; }
      .stat-quick { grid-template-columns:repeat(2,1fr); }
    }
    @media (max-width:640px) {
      #main-content { padding:1rem; }
      .topbar { padding:.65rem 1rem; }
      .topbar-search { display:none; }
      .menu-grid { grid-template-columns:repeat(auto-fill,minmax(155px,1fr)); gap:.7rem; }
      .menu-card { padding:14px; }
      .stat-quick { grid-template-columns:1fr 1fr; gap:.65rem; }
    }
  </style>
</head>

<body>

<div id="sidebar-overlay" onclick="closeSidebar()"></div>

<!-- ═══════════════════════════════════════════════════════════
     SIDEBAR
     ═══════════════════════════════════════════════════════════ -->
<aside id="sidebar">

  <!-- Brand — gradient cobalt→sky sesuai logo -->
  <div class="sb-brand">
    <div class="sb-brand-row">
      <div class="sb-logo-box">
        <img src="https://esw.eji.co.id/res/img/logo.png" alt="Logo EkaJaya"
             onerror="this.style.display='none';this.nextElementSibling.style.display='block'" />
        <span class="sb-logo-fallback">EJ</span>
      </div>
      <div>
        <div class="sb-name">EKA JAYA</div>
        <div class="sb-sub">Internasional</div>
      </div>
    </div>
  </div>

  <!-- User -->
  <div class="sb-user">
    <div class="sb-user-inner">
      <div class="sb-avatar">AD</div>
      <div>
        <div class="sb-uname">Administrator</div>
        <div class="sb-urole">Super Admin</div>
      </div>
      <div class="sb-dot"></div>
    </div>
  </div>

  <!-- Navigation -->
  <nav class="sb-nav">

    <div class="nav-item active" onclick="showSection('all',this)">
      <span>🏠</span><span>Dashboard</span>
      <span class="nav-badge">56</span>
    </div>

    <div class="nav-group">Penjualan</div>
    <div class="nav-item" onclick="showSection('sellout',this)"><span>💰</span><span>Sell Out</span></div>
    <div class="nav-item" onclick="showSection('sellin',this)"><span>🧾</span><span>Sell In</span></div>
    <div class="nav-item" onclick="showSection('target',this)"><span>🎯</span><span>Target &amp; Periode</span></div>
    <div class="nav-item" onclick="showSection('salesman',this)"><span>🚗</span><span>Salesman &amp; BA</span></div>
    <div class="nav-item" onclick="showSection('promo',this)"><span>🎁</span><span>Promo &amp; Kompetitor</span></div>

    <div class="nav-group">Klaim</div>
    <div class="nav-item" onclick="showSection('klaim',this)">
      <span>📌</span><span>Manajemen Klaim</span>
      <span class="nav-badge nav-badge-red">4.4K</span>
    </div>
    <div class="nav-item" onclick="showSection('logbook',this)"><span>📓</span><span>Logbook</span></div>

    <div class="nav-group">Laporan</div>
    <div class="nav-item" onclick="showSection('report',this)"><span>📊</span><span>Report &amp; Analisis</span></div>
    <div class="nav-item" onclick="showSection('finance',this)"><span>💵</span><span>Keuangan</span></div>

    <div class="nav-group">Master Data</div>
    <div class="nav-item" onclick="showSection('master',this)"><span>🗄️</span><span>Data Master</span></div>
    <div class="nav-item" onclick="showSection('visit',this)"><span>👁️</span><span>Visit &amp; Monitoring</span></div>

  </nav>

  <div class="sb-bottom">
    <button class="sb-btn"><span>❓</span> Bantuan</button>
    <button class="sb-btn sb-btn-logout"><span>🚪</span> Log Out</button>
    <p class="sb-version">v2.5.0 · © 2025 PT EkaJaya</p>
  </div>
</aside>


<!-- ═══════════════════════════════════════════════════════════
     MAIN
     ═══════════════════════════════════════════════════════════ -->
<div class="main-wrapper">

  <header class="topbar">
    <button class="topbar-ham" onclick="openSidebar()"><span></span><span></span><span></span></button>
    <div class="topbar-title">
      <h1 id="page-title">Dashboard</h1>
      <p  id="page-sub">Selamat datang kembali, Administrator</p>
    </div>
    <div class="topbar-search">
      <span>🔍</span>
      <input id="searchInput" type="text" placeholder="Cari menu…" oninput="filterCards()" />
    </div>
    <div class="topbar-actions">

      <!-- ── DROPDOWN: My Inbox ── -->
      <div class="dd-wrap">
        <button class="topbar-icon-btn" onclick="toggleDD('dd-inbox')" id="btn-inbox" title="My Inbox">
          📩
          <span class="topbar-notif-count">3</span>
        </button>
        <div class="dd-panel wide" id="dd-inbox">
          <div class="dd-head">
            <div class="dd-head-title">My Inbox</div>
            <div class="dd-head-sub">3 pesan belum dibaca</div>
          </div>
          <!-- Inbox items — backend: loop notifikasi di sini -->
          <div class="dd-inbox">
            <div class="dd-inbox-dot unread"></div>
            <div class="dd-inbox-body">
              <div class="dd-inbox-title">Pengajuan Klaim #KLM-2024-0891</div>
              <div class="dd-inbox-sub">Menunggu approval Anda</div>
              <div class="dd-inbox-time">5 menit lalu</div>
            </div>
          </div>
          <div class="dd-inbox">
            <div class="dd-inbox-dot unread"></div>
            <div class="dd-inbox-body">
              <div class="dd-inbox-title">Report Sell Out Bulan Ini</div>
              <div class="dd-inbox-sub">Sudah tersedia untuk diunduh</div>
              <div class="dd-inbox-time">1 jam lalu</div>
            </div>
          </div>
          <div class="dd-inbox">
            <div class="dd-inbox-dot unread"></div>
            <div class="dd-inbox-body">
              <div class="dd-inbox-title">Target Insentif BA — Update</div>
              <div class="dd-inbox-sub">Data Q4 telah diperbarui</div>
              <div class="dd-inbox-time">3 jam lalu</div>
            </div>
          </div>
          <div class="dd-inbox">
            <div class="dd-inbox-dot read"></div>
            <div class="dd-inbox-body">
              <div class="dd-inbox-title">Pembayaran Klaim #KLM-2024-0870</div>
              <div class="dd-inbox-sub">Sudah diproses</div>
              <div class="dd-inbox-time">Kemarin</div>
            </div>
          </div>
          <div class="dd-foot"><a href="#">Lihat semua pesan →</a></div>
        </div>
      </div>

      <!-- ── DROPDOWN: Apps ── -->
      <div class="dd-wrap">
        <button class="topbar-icon-btn" onclick="toggleDD('dd-apps')" id="btn-apps" title="Apps">
          ⊞
        </button>
        <div class="dd-panel" id="dd-apps">
          <div class="dd-head">
            <div class="dd-head-title">Aplikasi</div>
            <div class="dd-head-sub">Akses cepat ke semua modul</div>
          </div>
          <!-- Apps items — backend: sesuaikan dengan modul yang tersedia -->
          <button class="dd-item" onclick="navigateTo('https://esw.eji.co.id/sell-out-harian')">
            <div class="dd-ico dd-ico-cobalt">💰</div>
            <div class="dd-item-body">
              <div class="dd-item-label">Sell Out</div>
              <div class="dd-item-desc">Penjualan harian & bulanan</div>
            </div>
          </button>
          <button class="dd-item" onclick="navigateTo('https://esw.eji.co.id/klaim-sales')">
            <div class="dd-ico dd-ico-red">📌</div>
            <div class="dd-item-body">
              <div class="dd-item-label">Manajemen Klaim</div>
              <div class="dd-item-desc">Pengajuan & pembayaran</div>
            </div>
            <span class="dd-pill dd-pill-red">4.4K</span>
          </button>
          <button class="dd-item" onclick="navigateTo('https://esw.eji.co.id/report-all')">
            <div class="dd-ico dd-ico-teal">📊</div>
            <div class="dd-item-body">
              <div class="dd-item-label">Report & Analisis</div>
              <div class="dd-item-desc">Semua laporan penjualan</div>
            </div>
          </button>
          <button class="dd-item" onclick="navigateTo('https://esw.eji.co.id/sap-report-sales')">
            <div class="dd-ico">🗂️</div>
            <div class="dd-item-body">
              <div class="dd-item-label">SAP Report</div>
              <div class="dd-item-desc">Laporan terintegrasi SAP</div>
            </div>
          </button>
          <div class="dd-divider"></div>
          <button class="dd-item" onclick="navigateTo('https://esw.eji.co.id/master-database')">
            <div class="dd-ico">🗄️</div>
            <div class="dd-item-body">
              <div class="dd-item-label">Master Database</div>
              <div class="dd-item-desc">Kelola data master</div>
            </div>
          </button>
          <div class="dd-foot"><a href="#">Lihat semua aplikasi →</a></div>
        </div>
      </div>

      <!-- ── DROPDOWN: Pengaturan ── -->
      <div class="dd-wrap">
        <button class="topbar-icon-btn" onclick="toggleDD('dd-settings')" id="btn-settings" title="Pengaturan">
          ⚙️
        </button>
        <div class="dd-panel" id="dd-settings">
          <div class="dd-head">
            <div class="dd-head-title">Pengaturan</div>
          </div>
          <!-- Settings items — backend: sesuaikan dengan fitur yang ada -->
          <button class="dd-item" onclick="navigateTo('#')">
            <div class="dd-ico">🎨</div>
            <div class="dd-item-body">
              <div class="dd-item-label">Tampilan</div>
              <div class="dd-item-desc">Tema & preferensi UI</div>
            </div>
          </button>
          <button class="dd-item" onclick="navigateTo('#')">
            <div class="dd-ico">🔔</div>
            <div class="dd-item-body">
              <div class="dd-item-label">Notifikasi</div>
              <div class="dd-item-desc">Atur preferensi notifikasi</div>
            </div>
          </button>
          <button class="dd-item" onclick="navigateTo('#')">
            <div class="dd-ico">🔒</div>
            <div class="dd-item-body">
              <div class="dd-item-label">Keamanan</div>
              <div class="dd-item-desc">Password & sesi login</div>
            </div>
          </button>
          <button class="dd-item" onclick="navigateTo('#')">
            <div class="dd-ico">🌐</div>
            <div class="dd-item-body">
              <div class="dd-item-label">Bahasa & Wilayah</div>
              <div class="dd-item-desc">Bahasa Indonesia</div>
            </div>
            <span class="dd-pill dd-pill-blue">ID</span>
          </button>
        </div>
      </div>

      <!-- ── DROPDOWN: User Profile ── -->
      <div class="dd-wrap">
        <button class="topbar-avatar-btn" onclick="toggleDD('dd-user')" id="btn-user">
          <div class="topbar-avatar">AD</div>
          <div class="topbar-avatar-info">
            <div class="topbar-avatar-name">Administrator</div>
            <div class="topbar-avatar-role">Super Admin</div>
          </div>
          <span class="topbar-chevron">▼</span>
        </button>
        <div class="dd-panel" id="dd-user">
          <!-- Profile header -->
          <div class="dd-profile">
            <div class="dd-profile-avatar">AD</div>
            <div>
              <div class="dd-profile-name">Administrator</div>
              <div class="dd-profile-role">Super Admin · EkaJaya</div>
              <div class="dd-profile-email">admin@ekajaya.co.id</div>
            </div>
          </div>
          <!-- User menu items — backend: sesuaikan URL -->
          <button class="dd-item" onclick="navigateTo('#')">
            <div class="dd-ico dd-ico-cobalt">👤</div>
            <div class="dd-item-body">
              <div class="dd-item-label">Profil Saya</div>
              <div class="dd-item-desc">Lihat & edit profil</div>
            </div>
          </button>
          <button class="dd-item" onclick="navigateTo('#')">
            <div class="dd-ico">🔑</div>
            <div class="dd-item-body">
              <div class="dd-item-label">Ganti Password</div>
              <div class="dd-item-desc">Perbarui kata sandi</div>
            </div>
          </button>
          <button class="dd-item" onclick="navigateTo('#')">
            <div class="dd-ico">📋</div>
            <div class="dd-item-body">
              <div class="dd-item-label">Aktivitas Login</div>
              <div class="dd-item-desc">Riwayat sesi masuk</div>
            </div>
          </button>
          <div class="dd-divider"></div>
          <button class="dd-item danger" onclick="navigateTo('#logout')">
            <div class="dd-ico">🚪</div>
            <div class="dd-item-body">
              <div class="dd-item-label">Log Out</div>
              <div class="dd-item-desc">Keluar dari sistem</div>
            </div>
          </button>
        </div>
      </div>

    </div><!-- /.topbar-actions -->
  </header>

  <main id="main-content">

    <!-- ─── STAT CARDS ─── -->
    <div id="stats-wrapper">
      <div class="stat-top">

        <div class="stat-card">
          <div class="stat-wm">EJI</div>
          <p class="stat-lbl">Total Klaim</p>
          <div class="stat-nums">
            <span class="stat-big">53,129</span>
            <span class="stat-sep">/</span>
            <span class="stat-sm">57,840</span>
          </div>
          <p class="stat-desc">Klaim Selesai / Total Klaim Masuk</p>
          <div class="stat-bar-track"><div class="stat-bar-fill" style="width:91.7%"></div></div>
          <p class="stat-rate">91.7% completion rate</p>
        </div>

        <div class="stat-dark">
          <p class="stat-lbl">Klaim Dalam Proses</p>
          <div>
            <div class="stat-big">4,445</div>
            <p class="stat-desc">Menunggu tindak lanjut</p>
          </div>
          <span class="stat-pending">⏳ Pending Review</span>
        </div>

      </div>

      <div class="stat-quick">
        <div class="stat-quick-card">
          <div class="iw iw-cobalt">🧴</div>
          <div><div class="stat-quick-num">1,248</div><div class="stat-quick-lbl">Produk Aktif</div></div>
        </div>
        <div class="stat-quick-card">
          <div class="iw iw-sky">🏪</div>
          <div><div class="stat-quick-num">386</div><div class="stat-quick-lbl">Outlet Aktif</div></div>
        </div>
        <div class="stat-quick-card">
          <div class="iw iw-teal">🚗</div>
          <div><div class="stat-quick-num">94</div><div class="stat-quick-lbl">Salesman</div></div>
        </div>
        <div class="stat-quick-card">
          <div class="iw iw-cobalt">🎁</div>
          <div><div class="stat-quick-num">12</div><div class="stat-quick-lbl">Promo Aktif</div></div>
        </div>
      </div>
    </div>


    <!-- ═══ SELL OUT ═══ -->
    <section data-section="sellout" class="section-block">
      <div class="sec-rule">
        <div class="sec-bar" style="background:linear-gradient(180deg,var(--cobalt),var(--sky))"></div>
        <h2>Sell Out</h2><span class="sec-sub">Penjualan Harian &amp; Bulanan</span>
        <div class="sec-line"></div>
      </div>
      <div class="menu-grid">
        <a href="https://esw.eji.co.id/sell-out-harian" class="menu-card ac-cobalt" data-search="sell out hari harian penjualan">
          <div class="iw iw-cobalt">💰</div><div class="ct ct-cobalt">Sell Out (Hari)</div><div class="cd">Menu penjualan harian</div><span class="badge bd-cobalt">Harian</span>
        </a>
        <a href="https://esw.eji.co.id/sell-out-bulanan" class="menu-card ac-sky" data-search="sell out bulan bulanan penjualan">
          <div class="iw iw-sky">📅</div><div class="ct ct-sky">Sell Out (Bulan)</div><div class="cd">Menu penjualan bulanan</div><span class="badge bd-sky">Bulanan</span>
        </a>
        <a href="https://esw.eji.co.id/periode-sales" class="menu-card ac-cobalt" data-search="periode sales tutup buka">
          <div class="iw iw-cobalt">🔒</div><div class="ct ct-cobalt">Periode Sales</div><div class="cd">Tutup/buka periode sales</div><span class="badge bd-cobalt">Periode</span>
        </a>
        <a href="https://esw.eji.co.id/report-sell-out" class="menu-card ac-sky" data-search="report sell out laporan sales ba bulanan">
          <div class="iw iw-sky">📊</div><div class="ct ct-sky">Report Sell Out</div><div class="cd">Laporan Sales BA bulanan</div><span class="badge bd-sky">Report</span>
        </a>
      </div>
    </section>


    <!-- ═══ SELL IN ═══ -->
    <section data-section="sellin" class="section-block">
      <div class="sec-rule">
        <div class="sec-bar" style="background:linear-gradient(180deg,var(--sky),var(--teal))"></div>
        <h2>Sell In</h2><span class="sec-sub">Transaksi &amp; Faktur</span>
        <div class="sec-line"></div>
      </div>
      <div class="menu-grid">
        <a href="https://esw.eji.co.id/sell-in" class="menu-card ac-sky" data-search="sell in transaksi">
          <div class="iw iw-sky">🧾</div><div class="ct ct-sky">Sell In</div><div class="cd">Transaksi Sell In</div><span class="badge bd-sky">Transaksi</span>
        </a>
        <a href="https://esw.eji.co.id/faktur-penjualan" class="menu-card ac-cobalt" data-search="faktur penjualan laporan invoice">
          <div class="iw iw-cobalt">📋</div><div class="ct ct-cobalt">Faktur Penjualan</div><div class="cd">Laporan Faktur Penjualan</div><span class="badge bd-cobalt">Faktur</span>
        </a>
        <a href="https://esw.eji.co.id/laporan-sell-in" class="menu-card ac-teal" data-search="laporan sell in proses">
          <div class="iw iw-teal">📈</div><div class="ct ct-teal">Laporan Sell In</div><div class="cd">Proses laporan Sell In</div><span class="badge bd-teal">Laporan</span>
        </a>
        <a href="https://esw.eji.co.id/retur-distributor" class="menu-card ac-sky" data-search="retur distributor form pengembalian">
          <div class="iw iw-sky">🔄</div><div class="ct ct-sky">Retur Distributor</div><div class="cd">Form Retur</div><span class="badge bd-sky">Retur</span>
        </a>
        <a href="https://esw.eji.co.id/stock-outlet-ba" class="menu-card ac-cobalt" data-search="stock outlet ba tambah stok">
          <div class="iw iw-cobalt">📦</div><div class="ct ct-cobalt">Stock Outlet BA</div><div class="cd">Tambah Stock</div><span class="badge bd-cobalt">Stock</span>
        </a>
        <a href="https://esw.eji.co.id/tracking-order" class="menu-card ac-teal" data-search="tracking order tms pengiriman">
          <div class="iw iw-teal">🚚</div><div class="ct ct-teal">Tracking Order</div><div class="cd">Tracking Order TMS</div><span class="badge bd-teal">Tracking</span>
        </a>
        <a href="https://esw.eji.co.id/smt" class="menu-card ac-sky" data-search="smt monitoring">
          <div class="iw iw-sky">🔁</div><div class="ct ct-sky">SMT</div><div class="cd">Monitoring SMT</div><span class="badge bd-sky">SMT</span>
        </a>
      </div>
    </section>


    <!-- ═══ TARGET & PERIODE ═══ -->
    <section data-section="target" class="section-block">
      <div class="sec-rule">
        <div class="sec-bar" style="background:linear-gradient(180deg,var(--cobalt),var(--teal))"></div>
        <h2>Target &amp; Periode</h2>
        <div class="sec-line"></div>
      </div>
      <div class="menu-grid">
        <a href="https://esw.eji.co.id/target-sales-ba" class="menu-card ac-cobalt" data-search="target sales ba input">
          <div class="iw iw-cobalt">🎯</div><div class="ct ct-cobalt">Target Sales BA</div><div class="cd">Input Target Sales BA</div><span class="badge bd-cobalt">Target</span>
        </a>
        <a href="https://esw.eji.co.id/sales-quotation" class="menu-card ac-sky" data-search="sales quotation form penawaran">
          <div class="iw iw-sky">💼</div><div class="ct ct-sky">Sales Quotation</div><div class="cd">Form sales quotation</div><span class="badge bd-sky">Form</span>
        </a>
        <a href="https://esw.eji.co.id/sq-vs-so" class="menu-card ac-teal" data-search="sq vs so laporan analisis perbandingan">
          <div class="iw iw-teal">⚖️</div><div class="ct ct-teal">SQ VS SO</div><div class="cd">Laporan SQ VS SO</div><span class="badge bd-teal">Analisis</span>
        </a>
        <a href="https://esw.eji.co.id/target-insentif-salesman" class="menu-card ac-cobalt" data-search="target insentif salesman input">
          <div class="iw iw-cobalt">🏅</div><div class="ct ct-cobalt">Target Insentif Salesman</div><div class="cd">Input Target Insentif</div><span class="badge bd-cobalt">Insentif</span>
        </a>
      </div>
    </section>


    <!-- ═══ SALESMAN & BA ═══ -->
    <section data-section="salesman" class="section-block">
      <div class="sec-rule">
        <div class="sec-bar" style="background:linear-gradient(180deg,var(--sky),var(--teal))"></div>
        <h2>Salesman &amp; BA</h2>
        <div class="sec-line"></div>
      </div>
      <div class="menu-grid">
        <a href="https://esw.eji.co.id/salesman" class="menu-card ac-cobalt" data-search="salesman monitoring daftar">
          <div class="iw iw-cobalt">🚗</div><div class="ct ct-cobalt">Salesman</div><div class="cd">Monitoring Salesman</div><span class="badge bd-cobalt">Monitoring</span>
        </a>
        <a href="https://esw.eji.co.id/materi-ba" class="menu-card ac-teal" data-search="materi ba beauty advisor">
          <div class="iw iw-teal">📚</div><div class="ct ct-teal">Materi BA</div><div class="cd">Materi untuk BA</div><span class="badge bd-teal">Materi</span>
        </a>
        <a href="https://esw.eji.co.id/pk-test-ba" class="menu-card ac-sky" data-search="pk test ba form ujian">
          <div class="iw iw-sky">🧪</div><div class="ct ct-sky">PK Test BA</div><div class="cd">Form Test BA</div><span class="badge bd-sky">Test</span>
        </a>
        <a href="https://esw.eji.co.id/sample-tester-allocation" class="menu-card ac-teal" data-search="sample tester allocation alokasi">
          <div class="iw iw-teal">🧫</div><div class="ct ct-teal">Sample Tester Allocation</div><div class="cd">Mengalokasikan sample tester</div><span class="badge bd-teal">Alokasi</span>
        </a>
        <a href="https://esw.eji.co.id/ppl" class="menu-card ac-cobalt" data-search="ppl menu promosi">
          <div class="iw iw-cobalt">📋</div><div class="ct ct-cobalt">PPL</div><div class="cd">Menu PPL</div><span class="badge bd-cobalt">PPL</span>
        </a>
        <a href="https://esw.eji.co.id/report-realisasi-ppl" class="menu-card ac-sky" data-search="report realisasi ppl laporan">
          <div class="iw iw-sky">📊</div><div class="ct ct-sky">Report Realisasi PPL</div><div class="cd">Laporan Realisasi PPL</div><span class="badge bd-sky">Report</span>
        </a>
        <a href="https://esw.eji.co.id/monitoring-bonus" class="menu-card ac-teal" data-search="monitoring bonus salesman">
          <div class="iw iw-teal">⭐</div><div class="ct ct-teal">Monitoring Bonus</div><div class="cd">Monitoring bonus salesman</div><span class="badge bd-teal">Bonus</span>
        </a>
        <a href="https://esw.eji.co.id/report-insentif-ba" class="menu-card ac-cobalt" data-search="report insentif ba laporan">
          <div class="iw iw-cobalt">🏅</div><div class="ct ct-cobalt">Report Insentif BA</div><div class="cd">Laporan insentif BA</div><span class="badge bd-cobalt">Insentif</span>
        </a>
      </div>
    </section>


    <!-- ═══ PROMO & KOMPETITOR ═══ -->
    <section data-section="promo" class="section-block">
      <div class="sec-rule">
        <div class="sec-bar" style="background:linear-gradient(180deg,var(--sky),var(--cobalt))"></div>
        <h2>Promo &amp; Kompetitor</h2>
        <div class="sec-line"></div>
      </div>
      <div class="menu-grid">
        <a href="https://esw.eji.co.id/promo-hanasui" class="menu-card ac-sky" data-search="promo hanasui aktivitas program">
          <div class="iw iw-sky">🎁</div><div class="ct ct-sky">Promo Hanasui</div><div class="cd">Aktivitas Promo Hanasui</div><span class="badge bd-sky">Promo</span>
        </a>
        <a href="https://esw.eji.co.id/kompetitor" class="menu-card ac-cobalt" data-search="kompetitor promo saingan">
          <div class="iw iw-cobalt">🏆</div><div class="ct ct-cobalt">Kompetitor</div><div class="cd">Promo Kompetitor</div><span class="badge bd-cobalt">Kompetitor</span>
        </a>
        <a href="https://esw.eji.co.id/price-monitoring" class="menu-card ac-teal" data-search="price monitoring harga pantau">
          <div class="iw iw-teal">🏷️</div><div class="ct ct-teal">Price Monitoring</div><div class="cd">Menu Price Monitoring</div><span class="badge bd-teal">Monitoring</span>
        </a>
        <a href="https://esw.eji.co.id/post-budget" class="menu-card ac-cobalt" data-search="post budget ppl proposal anggaran">
          <div class="iw iw-cobalt">🗂️</div><div class="ct ct-cobalt">Post Budget</div><div class="cd">Post Budget PPL/Proposal</div><span class="badge bd-cobalt">Budget</span>
        </a>
      </div>
    </section>


    <!-- ═══ MANAJEMEN KLAIM ═══ -->
    <section data-section="klaim" class="section-block">
      <div class="sec-rule">
        <div class="sec-bar" style="background:linear-gradient(180deg,#ef4444,#f87171)"></div>
        <h2>Manajemen Klaim</h2>
        <span class="sec-badge-red">4,445 Pending</span>
        <div class="sec-line"></div>
      </div>
      <div class="menu-grid">
        <a href="https://esw.eji.co.id/klaim-sales" class="menu-card ac-danger" data-search="klaim sales input">
          <div class="iw iw-danger">🚨</div><div class="ct ct-danger">Klaim Sales</div><div class="cd">Input klaim</div><span class="badge bd-danger">Klaim</span>
        </a>
        <a href="https://esw.eji.co.id/pengajuan-klaim" class="menu-card ac-danger" data-search="pengajuan klaim transaksi form">
          <div class="iw iw-danger">📩</div><div class="ct ct-danger">Pengajuan Klaim</div><div class="cd">Transaksi pengajuan klaim</div><span class="badge bd-danger">Pengajuan</span>
        </a>
        <a href="https://esw.eji.co.id/pembayaran-klaim" class="menu-card ac-danger" data-search="pembayaran klaim form bayar">
          <div class="iw iw-danger">💳</div><div class="ct ct-danger">Pembayaran Klaim</div><div class="cd">Form pembayaran klaim</div><span class="badge bd-danger">Pembayaran</span>
        </a>
        <a href="https://esw.eji.co.id/bukti-potong" class="menu-card ac-danger" data-search="bukti potong klaim pajak">
          <div class="iw iw-danger">📎</div><div class="ct ct-danger">Bukti Potong</div><div class="cd">Bukti potong klaim</div><span class="badge bd-danger">Bukti</span>
        </a>
        <a href="https://esw.eji.co.id/form-keluhan" class="menu-card ac-danger" data-search="form keluhan isi komplain">
          <div class="iw iw-danger">💬</div><div class="ct ct-danger">Form Keluhan</div><div class="cd">Isi Form Keluhan</div><span class="badge bd-danger">Keluhan</span>
        </a>
      </div>
    </section>


    <!-- ═══ LOGBOOK ═══ -->
    <section data-section="logbook" class="section-block">
      <div class="sec-rule">
        <div class="sec-bar" style="background:linear-gradient(180deg,var(--cobalt),var(--sky))"></div>
        <h2>Logbook</h2>
        <div class="sec-line"></div>
      </div>
      <div class="menu-grid">
        <a href="https://esw.eji.co.id/logbook" class="menu-card ac-cobalt" data-search="logbook klaim catatan">
          <div class="iw iw-cobalt">📓</div><div class="ct ct-cobalt">Logbook</div><div class="cd">Logbook klaim</div><span class="badge bd-cobalt">Logbook</span>
        </a>
        <a href="https://esw.eji.co.id/logbook-ops" class="menu-card ac-sky" data-search="logbook ops operasional klaim">
          <div class="iw iw-sky">🔧</div><div class="ct ct-sky">Logbook OPS</div><div class="cd">Logbook Operasional-Klaim</div><span class="badge bd-sky">OPS</span>
        </a>
        <a href="https://esw.eji.co.id/logbook-nka" class="menu-card ac-teal" data-search="logbook nka klaim">
          <div class="iw iw-teal">📗</div><div class="ct ct-teal">Logbook NKA</div><div class="cd">Logbook NKA-Klaim</div><span class="badge bd-teal">NKA</span>
        </a>
        <a href="https://esw.eji.co.id/logbook-mkt" class="menu-card ac-cobalt" data-search="logbook mkt marketing klaim">
          <div class="iw iw-cobalt">📘</div><div class="ct ct-cobalt">Logbook MKT</div><div class="cd">Logbook MKT-Klaim</div><span class="badge bd-cobalt">MKT</span>
        </a>
      </div>
    </section>


    <!-- ═══ REPORT & ANALISIS ═══ -->
    <section data-section="report" class="section-block">
      <div class="sec-rule">
        <div class="sec-bar" style="background:linear-gradient(180deg,var(--sky),var(--teal))"></div>
        <h2>Report &amp; Analisis</h2>
        <div class="sec-line"></div>
      </div>
      <div class="menu-grid">
        <a href="https://esw.eji.co.id/report-listing" class="menu-card ac-cobalt" data-search="report listing laporan daftar">
          <div class="iw iw-cobalt">📊</div><div class="ct ct-cobalt">Report Listing</div><div class="cd">Laporan listing</div><span class="badge bd-cobalt">Listing</span>
        </a>
        <a href="https://esw.eji.co.id/sap-report-sales" class="menu-card ac-sky" data-search="sap report sales laporan erp">
          <div class="iw iw-sky">🗂️</div><div class="ct ct-sky">[SAP] Report Sales</div><div class="cd">Laporan sales SAP</div><span class="badge bd-sky">SAP</span>
        </a>
        <a href="https://esw.eji.co.id/report-all" class="menu-card ac-teal" data-search="report all semua laporan">
          <div class="iw iw-teal">📂</div><div class="ct ct-teal">Report All</div><div class="cd">Semua laporan</div><span class="badge bd-teal">All</span>
        </a>
        <a href="https://esw.eji.co.id/report-acc-ppl" class="menu-card ac-cobalt" data-search="report acc vs ppl budget anggaran">
          <div class="iw iw-cobalt">📑</div><div class="ct ct-cobalt">Report Acc VS PPL</div><div class="cd">Report Budget Acc VS PPL</div><span class="badge bd-cobalt">Budget</span>
        </a>
        <a href="https://esw.eji.co.id/report-ar" class="menu-card ac-sky" data-search="report ar account receivable piutang">
          <div class="iw iw-sky">💰</div><div class="ct ct-sky">Report AR</div><div class="cd">Laporan Account Receivable</div><span class="badge bd-sky">AR</span>
        </a>
        <a href="https://esw.eji.co.id/report-insentif-ba" class="menu-card ac-teal" data-search="report insentif ba laporan bonus">
          <div class="iw iw-teal">🏅</div><div class="ct ct-teal">Report Insentif BA</div><div class="cd">Laporan insentif BA</div><span class="badge bd-teal">Insentif</span>
        </a>
      </div>
    </section>


    <!-- ═══ KEUANGAN ═══ -->
    <section data-section="finance" class="section-block">
      <div class="sec-rule">
        <div class="sec-bar" style="background:linear-gradient(180deg,var(--teal),var(--sky))"></div>
        <h2>Keuangan</h2>
        <div class="sec-line"></div>
      </div>
      <div class="menu-grid">
        <a href="https://esw.eji.co.id/petty-cash" class="menu-card ac-teal" data-search="petty cash form kas kecil keuangan">
          <div class="iw iw-teal">💵</div><div class="ct ct-teal">Petty Cash</div><div class="cd">Form Petty Cash</div><span class="badge bd-teal">Keuangan</span>
        </a>
        <a href="https://esw.eji.co.id/master-vendor" class="menu-card ac-sky" data-search="master vendor data supplier">
          <div class="iw iw-sky">🏦</div><div class="ct ct-sky">Master Vendor</div><div class="cd">Data Master Vendor</div><span class="badge bd-sky">Vendor</span>
        </a>
      </div>
    </section>


    <!-- ═══ DATA MASTER ═══ -->
    <section data-section="master" class="section-block">
      <div class="sec-rule">
        <div class="sec-bar" style="background:linear-gradient(180deg,var(--cobalt),var(--teal))"></div>
        <h2>Data Master</h2>
        <div class="sec-line"></div>
      </div>
      <div class="menu-grid">
        <a href="https://esw.eji.co.id/master-database" class="menu-card ac-cobalt" data-search="master all database semua data">
          <div class="iw iw-cobalt">🗃️</div><div class="ct ct-cobalt">Master All Database</div><div class="cd">Master seluruh database</div><span class="badge bd-cobalt">Master</span>
        </a>
        <a href="https://esw.eji.co.id/tambah-produk" class="menu-card ac-sky" data-search="tambah produk baru item kosmetik">
          <div class="iw iw-sky">🧴</div><div class="ct ct-sky">Tambah Produk</div><div class="cd">Tambah Produk Baru</div><span class="badge bd-sky">Produk</span>
        </a>
        <a href="https://esw.eji.co.id/store-baru" class="menu-card ac-teal" data-search="store baru tambah toko gerai">
          <div class="iw iw-teal">🏪</div><div class="ct ct-teal">Store Baru</div><div class="cd">Tambah Store Baru</div><span class="badge bd-teal">Store</span>
        </a>
        <a href="https://esw.eji.co.id/pengajuan-outlet" class="menu-card ac-cobalt" data-search="pengajuan outlet form registrasi">
          <div class="iw iw-cobalt">🏠</div><div class="ct ct-cobalt">Pengajuan Outlet</div><div class="cd">Form pengajuan outlet</div><span class="badge bd-cobalt">Outlet</span>
        </a>
        <a href="https://esw.eji.co.id/user-login" class="menu-card ac-sky" data-search="user login tambah pengguna akun">
          <div class="iw iw-sky">👤</div><div class="ct ct-sky">User Login</div><div class="cd">Tambah user login</div><span class="badge bd-sky">User</span>
        </a>
      </div>
    </section>


    <!-- ═══ VISIT & MONITORING ═══ -->
    <section data-section="visit" class="section-block">
      <div class="sec-rule">
        <div class="sec-bar" style="background:linear-gradient(180deg,var(--sky),var(--cobalt))"></div>
        <h2>Visit &amp; Monitoring</h2>
        <div class="sec-line"></div>
      </div>
      <div class="menu-grid">
        <a href="https://esw.eji.co.id/visit-ba" class="menu-card ac-cobalt" data-search="visit ba assessment form kunjungan">
          <div class="iw iw-cobalt">👁️</div><div class="ct ct-cobalt">Visit BA</div><div class="cd">Form Visit BA Assessment</div><span class="badge bd-cobalt">Visit</span>
        </a>
        <a href="https://esw.eji.co.id/visit-tl" class="menu-card ac-teal" data-search="visit tl team leader kunjungan">
          <div class="iw iw-teal">🚶</div><div class="ct ct-teal">Visit TL</div><div class="cd">Visit Team Leader</div><span class="badge bd-teal">Visit</span>
        </a>
      </div>
    </section>


    <div class="page-footer">
      EkaJaya Internasional — Beauty Management System &nbsp;·&nbsp; v2.5.0 &nbsp;·&nbsp; © 2025 PT EkaJaya
    </div>

  </main>
</div>

<!-- ═══════════════════════════════════════════════════════════
     JS
     ═══════════════════════════════════════════════════════════ -->
<script>
  'use strict';

  const SECTION_META = {
    all:      ['Dashboard',          'Selamat datang kembali, Administrator'],
    sellout:  ['Sell Out',           'Penjualan Harian & Bulanan'],
    sellin:   ['Sell In',            'Transaksi & Faktur'],
    target:   ['Target & Periode',   'Manajemen Target Penjualan'],
    salesman: ['Salesman & BA',      'Manajemen Tim Lapangan'],
    promo:    ['Promo & Kompetitor', 'Aktivitas Promo & Riset Kompetitor'],
    klaim:    ['Manajemen Klaim',    'Pengajuan, Pembayaran & Monitoring Klaim'],
    logbook:  ['Logbook',            'Catatan Operasional Harian'],
    report:   ['Report & Analisis',  'Laporan Penjualan & Analisis Data'],
    finance:  ['Keuangan',           'Petty Cash & Vendor'],
    master:   ['Data Master',        'Kelola Produk, Outlet & User'],
    visit:    ['Visit & Monitoring', 'Kunjungan BA & Team Leader'],
  };

  function showSection(key, el) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if (el) el.classList.add('active');
    const [title, sub] = SECTION_META[key] || ['Dashboard', ''];
    document.getElementById('page-title').textContent = title;
    document.getElementById('page-sub').textContent   = sub;
    const sw = document.getElementById('stats-wrapper');
    if (sw) sw.style.display = key === 'all' ? '' : 'none';
    document.querySelectorAll('.section-block').forEach(s => {
      s.style.display = (key === 'all' || s.dataset.section === key) ? '' : 'none';
    });
    const inp = document.getElementById('searchInput');
    if (inp) inp.value = '';
    closeSidebar();
    const mc = document.getElementById('main-content');
    if (mc) mc.scrollTop = 0;
  }

  function filterCards() {
    const q = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
    const sw = document.getElementById('stats-wrapper');
    if (!q) {
      const active = document.querySelector('.nav-item.active');
      const key = active
        ? (active.getAttribute('onclick') || '').match(/'([^']+)'/)?.[1] || 'all'
        : 'all';
      showSection(key, active);
      return;
    }
    if (sw) sw.style.display = 'none';
    document.querySelectorAll('.section-block').forEach(s => s.style.display = '');
    document.querySelectorAll('.menu-card').forEach(card => {
      const kw    = (card.dataset.search || '').toLowerCase();
      const title = (card.querySelector('.ct')?.textContent || '').toLowerCase();
      const desc  = (card.querySelector('.cd')?.textContent || '').toLowerCase();
      card.style.display = (kw.includes(q) || title.includes(q) || desc.includes(q)) ? '' : 'none';
    });
    document.querySelectorAll('.section-block').forEach(s => {
      const has = [...s.querySelectorAll('.menu-card')].some(c => c.style.display !== 'none');
      s.style.display = has ? '' : 'none';
    });
  }

  function openSidebar()  {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebar-overlay').classList.add('visible');
  }
  function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('visible');
  }

  /* ── Dropdown toggle ── */
  const DD_IDS = ['dd-inbox','dd-apps','dd-settings','dd-user'];
  const BTN_MAP = { 'dd-inbox':'btn-inbox', 'dd-apps':'btn-apps', 'dd-settings':'btn-settings', 'dd-user':'btn-user' };

  function toggleDD(id) {
    const isOpen = document.getElementById(id).classList.contains('open');
    closeAllDD();
    if (!isOpen) {
      document.getElementById(id).classList.add('open');
      const btn = document.getElementById(BTN_MAP[id]);
      if (btn) btn.classList.add('dd-open');
    }
  }

  function closeAllDD() {
    DD_IDS.forEach(id => {
      document.getElementById(id)?.classList.remove('open');
    });
    document.querySelectorAll('.topbar-icon-btn,.topbar-avatar-btn').forEach(b => b.classList.remove('dd-open'));
  }

  /* Close dropdown when clicking outside */
  document.addEventListener('click', e => {
    if (!e.target.closest('.dd-wrap')) closeAllDD();
  });

  /* Close on Escape */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeAllDD(); closeSidebar(); }
  });

  /* Navigate helper */
  function navigateTo(url) {
    closeAllDD();
    if (url && url !== '#' && !url.endsWith('#logout')) window.location.href = url;
    if (url.endsWith('#logout')) {
      /* Backend: ganti dengan logout handler yang sebenarnya */
      if (confirm('Yakin ingin keluar?')) window.location.href = '/logout';
    }
  }
</script>

</body>
</html>
