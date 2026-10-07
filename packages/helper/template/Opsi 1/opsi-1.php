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
    /*
      EkaJaya BMS — Layout: List + Group
      Palette (bright, from logo):
        Cobalt  #2563a8   Royal Blue — teks EKA JAYA
        Sky     #4a9fd4   Bright Blue — daun atas
        Teal    #3aaa8c   Teal Green  — daun bawah
      Sidebar: WHITE (bukan gelap!)
    */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --cobalt:       #2563a8;
      --cobalt-dark:  #1a4a85;
      --cobalt-deep:  #0f3060;
      --cobalt-lite:  #dbeafe;
      --cobalt-soft:  #eff6ff;
      --sky:          #4a9fd4;
      --sky-dark:     #2e7db0;
      --sky-lite:     #cde8f8;
      --sky-soft:     #f0f8fd;
      --teal:         #3aaa8c;
      --teal-dark:    #2a8870;
      --teal-lite:    #c6ede3;
      --teal-soft:    #f0faf7;
      --silver:       #8ba0b0;
      --silver-lite:  #e8f0f5;
      --silver-soft:  #f4f7fa;
      --ink:          #1a2d42;
      --ink-mid:      #3a5068;
      --ink-soft:     #6a8098;
      --ink-faint:    #9ab0c0;
      --bg:           #f0f6fb;
      --surface:      #ffffff;
      --border:       #d0e4f0;
      --border-lite:  #e4eff8;
    }

    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: var(--bg);
      min-height: 100vh;
      color: var(--ink);
    }

    /* ── Scrollbars ── */
    #sidebar::-webkit-scrollbar        { width: 3px; }
    #sidebar::-webkit-scrollbar-thumb  { background: var(--cobalt-lite); border-radius: 99px; }
    #main-content::-webkit-scrollbar       { width: 5px; }
    #main-content::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }

    /* ════════ SIDEBAR — putih bersih ════════ */
    #sidebar {
      width: 264px;
      background: #ffffff;
      border-right: 1.5px solid var(--border-lite);
      box-shadow: 3px 0 20px rgba(37,99,168,.07);
      display: flex; flex-direction: column;
      position: fixed; top: 0; left: 0; bottom: 0;
      z-index: 50; overflow-y: auto;
      transition: left .26s ease;
    }
    .main-wrapper { margin-left: 264px; display: flex; flex-direction: column; min-height: 100vh; }

    /* ── Brand header sidebar — gradient cerah ── */
    .sb-brand {
      padding: 1rem 1rem .85rem;
      background: linear-gradient(135deg, var(--cobalt) 0%, var(--sky) 100%);
      flex-shrink: 0;
    }
    .sb-brand-row { display: flex; align-items: center; gap: .8rem; }
    .sb-logo-box {
      width: 50px; height: 50px; border-radius: 10px; flex-shrink: 0;
      background: #ffffff;
      border: 2px solid rgba(255,255,255,.6);
      box-shadow: 0 2px 12px rgba(0,0,0,.15);
      display: flex; align-items: center; justify-content: center;
      padding: 4px; overflow: visible;
    }
    .sb-logo-box img { width: 100%; height: 100%; object-fit: contain; display: block; border-radius: 6px; }
    .sb-logo-fallback { display: none; color: var(--cobalt); font-size: 1.3rem; font-weight: 900; }
    .sb-name { color: #ffffff; font-size: 1.05rem; font-weight: 800; letter-spacing: .03em; line-height: 1.2; text-shadow: 0 1px 4px rgba(0,0,0,.15); }
    .sb-sub  { color: rgba(255,255,255,.82); font-size: .67rem; font-weight: 600; letter-spacing: .13em; text-transform: uppercase; margin-top: 2px; }

    /* ── User card ── */
    .sb-user { padding: .75rem .85rem; border-bottom: 1px solid var(--border-lite); }
    .sb-user-inner {
      display: flex; align-items: center; gap: .7rem;
      background: var(--cobalt-soft); border-radius: 11px;
      padding: .55rem .8rem; border: 1px solid var(--cobalt-lite);
    }
    .sb-avatar {
      width: 34px; height: 34px; border-radius: 50%;
      background: linear-gradient(135deg, var(--cobalt), var(--sky));
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: .72rem; font-weight: 700; flex-shrink: 0;
    }
    .sb-uname { color: var(--ink); font-size: .83rem; font-weight: 700; line-height: 1.2; }
    .sb-urole { color: var(--ink-soft); font-size: .7rem; }
    .sb-dot   { width: 8px; height: 8px; border-radius: 50%; background: var(--teal); box-shadow: 0 0 0 2px var(--teal-lite); flex-shrink: 0; margin-left: auto; }

    /* ── Navigation ── */
    .sb-nav { flex: 1; padding: .6rem .7rem; display: flex; flex-direction: column; gap: 1px; }

    .nav-group {
      font-size: .64rem; font-weight: 700; letter-spacing: .16em;
      text-transform: uppercase; color: var(--silver);
      padding: 0 10px; margin: 12px 0 3px;
    }
    .nav-item {
      display: flex; align-items: center; gap: 9px;
      padding: 8px 10px; border-radius: 9px;
      cursor: pointer; transition: all .14s;
      color: var(--ink-mid); font-size: .82rem; font-weight: 500;
      border: 1px solid transparent; text-decoration: none; user-select: none;
    }
    .nav-item:hover  { background: var(--cobalt-soft); color: var(--cobalt); border-color: var(--cobalt-lite); }
    .nav-item.active {
      background: linear-gradient(135deg, var(--cobalt), var(--sky));
      color: #fff; border-color: transparent;
      box-shadow: 0 3px 12px rgba(37,99,168,.25);
    }
    .nav-badge { margin-left: auto; font-size: .68rem; border-radius: 99px; padding: 1px 7px; background: var(--silver-lite); color: var(--ink-mid); font-family: 'DM Mono', monospace; }
    .nav-item.active .nav-badge { background: rgba(255,255,255,.25); color: #fff; }
    .nav-badge-red { background: #fee2e2 !important; color: #dc2626 !important; }

    /* ── Sidebar bottom ── */
    .sb-bottom { padding: .75rem .7rem; border-top: 1px solid var(--border-lite); }
    .sb-btn { width: 100%; display: flex; align-items: center; gap: .7rem; padding: .55rem .9rem; border-radius: 9px; font-size: .82rem; font-weight: 500; cursor: pointer; border: none; font-family: 'Plus Jakarta Sans', sans-serif; transition: all .14s; color: var(--ink-soft); background: transparent; }
    .sb-btn:hover { background: var(--silver-soft); color: var(--ink); }
    .sb-btn-logout { margin-top: 3px; background: #fff0f0; color: #dc2626; border: 1px solid #fecaca; font-weight: 600; }
    .sb-btn-logout:hover { background: #fee2e2; }
    .sb-version { text-align: center; font-size: .66rem; color: var(--ink-faint); margin-top: .6rem; }

    /* Mobile overlay */
    #sidebar-overlay { display: none; }

    /* ════════ TOPBAR ════════ */
    .topbar {
      position: sticky; top: 0; z-index: 30;
      display: flex; align-items: center; gap: .85rem;
      padding: .75rem 1.5rem;
      background: rgba(255,255,255,.96);
      backdrop-filter: blur(12px);
      border-bottom: 1.5px solid var(--border-lite);
      box-shadow: 0 2px 12px rgba(37,99,168,.06);
    }
    .topbar-ham { display: none; flex-direction: column; gap: 5px; padding: .35rem; border-radius: 9px; background: transparent; border: none; cursor: pointer; }
    .topbar-ham span { display: block; width: 19px; height: 2px; background: var(--ink); border-radius: 2px; }
    .topbar-ham:hover { background: var(--cobalt-soft); }
    .topbar-title h1 { font-size: 1rem; font-weight: 700; color: var(--cobalt-deep); line-height: 1.2; }
    .topbar-title p  { font-size: .72rem; color: var(--ink-soft); margin-top: 1px; }
    .topbar-search { position: relative; width: 250px; margin-left: auto; }
    .topbar-search-icon { position: absolute; left: .7rem; top: 50%; transform: translateY(-50%); font-size: .85rem; pointer-events: none; }
    .topbar-search input {
      width: 100%; padding: .5rem .85rem .5rem 2rem;
      background: var(--cobalt-soft); border: 1.5px solid var(--cobalt-lite);
      border-radius: 9px; font-size: .82rem;
      font-family: 'Plus Jakarta Sans', sans-serif; color: var(--ink); outline: none;
      transition: all .18s;
    }
    .topbar-search input::placeholder { color: var(--ink-faint); }
    .topbar-search input:focus { background: #fff; border-color: var(--sky); box-shadow: 0 0 0 3px var(--sky-lite); }

    /* Topbar right actions */
    .topbar-actions { display: flex; align-items: center; gap: .2rem; }
    .topbar-icon-btn { position: relative; padding: .48rem .55rem; border-radius: 9px; background: transparent; border: 1px solid transparent; cursor: pointer; font-size: .88rem; transition: all .14s; display: flex; align-items: center; color: var(--ink-mid); }
    .topbar-icon-btn:hover, .topbar-icon-btn.dd-open { background: var(--cobalt-soft); border-color: var(--cobalt-lite); }
    .topbar-notif-count { position: absolute; top: 4px; right: 4px; min-width: 15px; height: 15px; border-radius: 99px; background: #ef4444; color: #fff; font-size: .56rem; font-weight: 700; display: flex; align-items: center; justify-content: center; padding: 0 3px; border: 1.5px solid #fff; }
    .topbar-avatar-btn { display: flex; align-items: center; gap: .45rem; padding: .28rem .5rem .28rem .28rem; border-radius: 9px; border: 1px solid transparent; cursor: pointer; background: transparent; transition: all .14s; font-family: 'Plus Jakarta Sans', sans-serif; margin-left: .1rem; }
    .topbar-avatar-btn:hover, .topbar-avatar-btn.dd-open { background: var(--cobalt-soft); border-color: var(--cobalt-lite); }
    .topbar-avatar { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, var(--cobalt), var(--sky)); display: flex; align-items: center; justify-content: center; color: #fff; font-size: .7rem; font-weight: 700; flex-shrink: 0; }
    .topbar-avatar-name { font-size: .78rem; font-weight: 600; color: var(--ink); line-height: 1.2; }
    .topbar-avatar-role { font-size: .67rem; color: var(--ink-soft); }
    .topbar-chevron { font-size: .58rem; color: var(--ink-faint); margin-left: .1rem; transition: transform .18s; display: inline-block; }
    .topbar-avatar-btn.dd-open .topbar-chevron { transform: rotate(180deg); }

    /* ── Dropdown panels ── */
    .dd-wrap { position: relative; }
    .dd-panel { display: none; position: absolute; top: calc(100% + 7px); right: 0; background: #fff; border: 1px solid var(--border-lite); border-radius: 13px; box-shadow: 0 10px 36px rgba(37,99,168,.13), 0 2px 8px rgba(0,0,0,.05); z-index: 200; min-width: 224px; overflow: hidden; animation: ddIn .14s ease both; }
    .dd-panel.wide { min-width: 290px; }
    .dd-panel.open { display: block; }
    @keyframes ddIn { from { opacity:0; transform:translateY(-5px); } to { opacity:1; transform:translateY(0); } }
    .dd-head { padding: .8rem 1rem .65rem; background: var(--cobalt-soft); border-bottom: 1px solid var(--cobalt-lite); }
    .dd-head-title { font-size: .79rem; font-weight: 700; color: var(--cobalt-deep); }
    .dd-head-sub   { font-size: .69rem; color: var(--ink-soft); margin-top: 2px; }
    .dd-item { display: flex; align-items: center; gap: .7rem; padding: .65rem .95rem; cursor: pointer; transition: background .12s; text-decoration: none; color: var(--ink-mid); border: none; background: none; width: 100%; font-family: 'Plus Jakarta Sans', sans-serif; font-size: .82rem; text-align: left; }
    .dd-item:hover { background: var(--cobalt-soft); color: var(--cobalt); }
    .dd-item:hover .dd-ico { background: var(--cobalt-lite); }
    .dd-ico { width: 30px; height: 30px; border-radius: 7px; background: var(--silver-lite); display: flex; align-items: center; justify-content: center; font-size: .85rem; flex-shrink: 0; transition: background .12s; }
    .dd-ico-cobalt { background: var(--cobalt-lite); } .dd-ico-teal { background: var(--teal-lite); } .dd-ico-red { background: #fee2e2; }
    .dd-item-body { flex: 1; min-width: 0; }
    .dd-item-label { font-weight: 600; font-size: .82rem; color: var(--ink); }
    .dd-item-desc  { font-size: .69rem; color: var(--ink-soft); margin-top: 1px; }
    .dd-pill { font-size: .61rem; font-weight: 700; padding: 2px 6px; border-radius: 99px; flex-shrink: 0; }
    .dd-pill-red  { background: #fee2e2; color: #dc2626; }
    .dd-pill-blue { background: var(--cobalt-lite); color: var(--cobalt); }
    .dd-pill-teal { background: var(--teal-lite); color: var(--teal-dark); }
    .dd-inbox { display: flex; gap: .6rem; padding: .7rem .95rem; cursor: pointer; transition: background .12s; border-bottom: 1px solid var(--border-lite); }
    .dd-inbox:last-child { border-bottom: none; }
    .dd-inbox:hover { background: var(--cobalt-soft); }
    .dd-inbox-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
    .dd-inbox-dot.unread { background: var(--cobalt); box-shadow: 0 0 0 2px var(--cobalt-lite); }
    .dd-inbox-dot.read   { background: var(--border); }
    .dd-inbox-body { flex:1; min-width:0; }
    .dd-inbox-title { font-size:.78rem; font-weight:600; color:var(--ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .dd-inbox-sub   { font-size:.7rem; color:var(--ink-soft); margin-top:1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .dd-inbox-time  { font-size:.66rem; color:var(--ink-faint); margin-top:2px; }
    .dd-profile { display: flex; align-items: center; gap: .7rem; padding: .85rem .95rem; background: var(--cobalt-soft); border-bottom: 1px solid var(--cobalt-lite); }
    .dd-profile-avatar { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, var(--cobalt), var(--sky)); display: flex; align-items: center; justify-content: center; color: #fff; font-size: .82rem; font-weight: 700; flex-shrink: 0; }
    .dd-profile-name  { font-size: .83rem; font-weight: 700; color: var(--cobalt-deep); }
    .dd-profile-role  { font-size: .7rem; color: var(--ink-soft); }
    .dd-profile-email { font-size: .68rem; color: var(--ink-faint); margin-top:1px; }
    .dd-divider { height: 1px; background: var(--border-lite); margin: .15rem 0; }
    .dd-foot { padding: .55rem .95rem; border-top: 1px solid var(--border-lite); background: var(--cobalt-soft); text-align: center; }
    .dd-foot a { font-size: .77rem; font-weight: 600; color: var(--cobalt); text-decoration: none; }
    .dd-foot a:hover { text-decoration: underline; }
    .dd-item.danger:hover { background: #fef2f2; color: #dc2626; }
    .dd-item.danger .dd-ico { background: #fee2e2; }

    /* ════════ MAIN CONTENT ════════ */
    #main-content { flex: 1; overflow-y: auto; padding: 1.4rem 1.6rem; display: flex; flex-direction: column; gap: 1.25rem; }

    /* ── Stat section ── */
    .stat-top { display: grid; grid-template-columns: 2fr 1fr; gap: 1rem; }

    .stat-card {
      background: #fff; border: 1px solid var(--border-lite);
      border-radius: 16px; padding: 1.3rem 1.4rem;
      box-shadow: 0 2px 14px rgba(37,99,168,.07);
      position: relative; overflow: hidden;
    }
    .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, var(--cobalt), var(--sky), var(--teal)); }
    .stat-wm { position: absolute; right: 14px; top: 16px; font-size: 3.2rem; opacity: .04; user-select: none; color: var(--cobalt); font-weight: 900; line-height: 1; }
    .stat-lbl  { font-size: .68rem; font-weight: 700; text-transform: uppercase; letter-spacing: .13em; color: var(--sky); margin-bottom: .55rem; }
    .stat-nums { display: flex; align-items: baseline; gap: .45rem; flex-wrap: wrap; }
    .stat-big  { font-family: 'DM Mono', monospace; font-size: 2.5rem; font-weight: 700; color: var(--cobalt); line-height: 1; }
    .stat-sep  { font-size: 1.3rem; color: var(--border); }
    .stat-sm   { font-family: 'DM Mono', monospace; font-size: 1.7rem; font-weight: 600; color: var(--sky); line-height: 1; }
    .stat-desc { font-size: .72rem; color: var(--ink-soft); margin-top: .22rem; }
    .stat-bar-track { margin-top: .85rem; background: var(--cobalt-soft); border-radius: 99px; height: 6px; max-width: 320px; }
    .stat-bar-fill  { height: 6px; border-radius: 99px; background: linear-gradient(90deg, var(--cobalt), var(--sky), var(--teal)); transition: width 1.3s cubic-bezier(.4,0,.2,1); }
    .stat-rate { font-size: .7rem; color: var(--ink-soft); margin-top: .32rem; font-family: 'DM Mono', monospace; }

    .stat-dark {
      border-radius: 16px; padding: 1.3rem 1.4rem;
      background: linear-gradient(135deg, var(--cobalt) 0%, var(--sky) 100%);
      box-shadow: 0 6px 22px rgba(37,99,168,.25);
      position: relative; overflow: hidden;
      display: flex; flex-direction: column; justify-content: space-between;
    }
    .stat-dark::before { content:''; position:absolute; right:-20px; bottom:-20px; width:100px; height:100px; border-radius:50%; background:rgba(255,255,255,.1); }
    .stat-dark::after  { content:''; position:absolute; right:16px; top:16px; width:44px; height:44px; border-radius:50%; background:rgba(255,255,255,.12); }
    .stat-dark .stat-lbl  { color: rgba(255,255,255,.8); }
    .stat-dark .stat-big  { color: #fff; }
    .stat-dark .stat-desc { color: rgba(255,255,255,.7); }
    .stat-pending { display: inline-flex; align-items: center; gap: .3rem; font-size: .69rem; font-weight: 600; padding: 4px 10px; border-radius: 99px; background: rgba(255,255,255,.18); color: #fff; border: 1px solid rgba(255,255,255,.3); align-self: flex-start; margin-top: .7rem; }

    .stat-quick { display: grid; grid-template-columns: repeat(4,1fr); gap: .8rem; }
    .stat-quick-card { background: #fff; border: 1px solid var(--border-lite); border-radius: 12px; padding: .85rem 1rem; box-shadow: 0 2px 8px rgba(37,99,168,.05); display: flex; align-items: center; gap: .75rem; transition: all .16s; }
    .stat-quick-card:hover { box-shadow: 0 6px 18px rgba(37,99,168,.10); transform: translateY(-1px); }
    .stat-quick-ico { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: .95rem; flex-shrink: 0; }
    .sqi-cobalt { background: var(--cobalt-soft); }
    .sqi-sky    { background: var(--sky-soft); }
    .sqi-teal   { background: var(--teal-soft); }
    .stat-quick-num { font-family: 'DM Mono', monospace; font-size: 1.15rem; font-weight: 700; color: var(--cobalt); line-height: 1; }
    .stat-quick-lbl { font-size: .7rem; color: var(--ink-soft); margin-top: 2px; }

    /* ════════ LIST GROUP ════════ */
    .list-groups { display: flex; flex-direction: column; gap: 1rem; }

    .lg {
      background: #fff;
      border: 1px solid var(--border-lite);
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(37,99,168,.05);
      animation: fadeUp .32s ease both;
    }
    .lg:nth-child(1)  { animation-delay:.04s } .lg:nth-child(2)  { animation-delay:.08s }
    .lg:nth-child(3)  { animation-delay:.12s } .lg:nth-child(4)  { animation-delay:.16s }
    .lg:nth-child(5)  { animation-delay:.20s } .lg:nth-child(6)  { animation-delay:.24s }
    .lg:nth-child(7)  { animation-delay:.28s } .lg:nth-child(8)  { animation-delay:.32s }
    .lg:nth-child(9)  { animation-delay:.36s } .lg:nth-child(10) { animation-delay:.40s }
    .lg:nth-child(11) { animation-delay:.44s }

    /* Group header */
    .lg-head {
      display: flex; align-items: center; gap: 10px;
      padding: .75rem 1.1rem;
      border-bottom: 1px solid var(--border-lite);
      cursor: pointer; user-select: none;
      transition: background .13s;
    }
    .lg-head:hover { background: var(--cobalt-soft); }

    /* Colored left strip per category */
    .lg-strip { width: 4px; height: 18px; border-radius: 2px; flex-shrink: 0; }
    .ls-cobalt { background: linear-gradient(180deg, var(--cobalt), var(--sky)); }
    .ls-sky    { background: linear-gradient(180deg, var(--sky), #82c8e8); }
    .ls-teal   { background: linear-gradient(180deg, var(--teal), #5dd4b4); }
    .ls-red    { background: linear-gradient(180deg, #ef4444, #f87171); }

    .lg-title { font-size: .9rem; font-weight: 700; color: var(--cobalt-deep); flex: 1; }
    .lg-sub   { font-size: .71rem; color: var(--ink-soft); }
    .lg-badge { font-size: .67rem; font-weight: 700; padding: 2px 8px; border-radius: 99px; font-family: 'DM Mono', monospace; }
    .lb-cobalt { background: var(--cobalt-lite); color: var(--cobalt); }
    .lb-red    { background: #fee2e2; color: #dc2626; }
    .lg-chevron { font-size: .72rem; color: var(--ink-faint); transition: transform .18s; flex-shrink: 0; }
    .lg-head.collapsed .lg-chevron { transform: rotate(-90deg); }

    /* Group body */
    .lg-body { display: block; }
    .lg-body.collapsed { display: none; }

    /* Row item */
    .lg-row {
      display: flex; align-items: center; gap: 12px;
      padding: .72rem 1.1rem;
      border-bottom: 1px solid var(--border-lite);
      text-decoration: none; color: inherit;
      transition: background .13s;
      cursor: pointer;
    }
    .lg-row:last-child { border-bottom: none; }
    .lg-row:hover { background: var(--cobalt-soft); }
    .lg-row:hover .lg-arr { color: var(--cobalt); transform: translateX(3px); }

    /* Row icon */
    .lg-ico {
      width: 36px; height: 36px; border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem; flex-shrink: 0;
      transition: box-shadow .13s;
    }
    .li-cobalt { background: var(--cobalt-soft); }
    .li-sky    { background: var(--sky-soft); }
    .li-teal   { background: var(--teal-soft); }
    .li-red    { background: #fef2f2; }

    /* Row text */
    .lg-body-text { flex: 1; min-width: 0; }
    .lg-row-title { font-size: .86rem; font-weight: 600; color: var(--ink); line-height: 1.3; }
    .lg-row-desc  { font-size: .73rem; color: var(--ink-soft); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    /* Row right */
    .lg-row-right { display: flex; align-items: center; gap: 7px; flex-shrink: 0; }
    .lg-pill { font-size: .64rem; font-weight: 600; padding: 2px 8px; border-radius: 99px; white-space: nowrap; }
    .lp-cobalt { background: var(--cobalt-lite); color: var(--cobalt); }
    .lp-sky    { background: var(--sky-lite);    color: var(--sky-dark); }
    .lp-teal   { background: var(--teal-lite);   color: var(--teal-dark); }
    .lp-red    { background: #fee2e2;             color: #dc2626; }
    .lp-silver { background: var(--silver-lite);  color: var(--ink-mid); }
    .lg-arr { font-size: .85rem; color: var(--ink-faint); transition: all .13s; }

    /* Search hidden state */
    .lg-row.hidden { display: none; }
    .lg.all-hidden  { display: none; }

    /* No result */
    .no-result { display: none; text-align: center; padding: 2.5rem 1rem; color: var(--ink-soft); font-size: .85rem; }
    .no-result.show { display: block; }

    @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }

    /* Footer */
    .page-footer { text-align: center; padding: 1.25rem 0 .5rem; font-size: .7rem; color: var(--ink-faint); border-top: 1px solid var(--border-lite); }

    /* ════════ RESPONSIVE ════════ */
    @media (max-width:1024px) {
      #sidebar { left:-264px; } #sidebar.open { left:0; }
      #sidebar-overlay { display:block; }
      #sidebar-overlay.visible { position:fixed; inset:0; z-index:40; background:rgba(15,45,90,.4); backdrop-filter:blur(3px); }
      .main-wrapper { margin-left:0; }
      .topbar-ham { display:flex; }
      .topbar-search { width:180px; }
      .stat-top { grid-template-columns:1fr; }
      .stat-quick { grid-template-columns:repeat(2,1fr); }
    }
    @media (max-width:640px) {
      #main-content { padding:1rem; }
      .topbar { padding:.6rem 1rem; }
      .topbar-search { display:none; }
      .stat-quick { grid-template-columns:1fr 1fr; gap:.6rem; }
      .lg-sub { display:none; }
      .topbar-avatar-info { display:none; }
      .topbar-chevron { display:none; }
    }
  </style>
</head>
<body>

<div id="sidebar-overlay" onclick="closeSidebar()"></div>

<!-- ════════════════════════════ SIDEBAR ══ -->
<aside id="sidebar">

  <!-- Brand -->
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

  <!-- Nav -->
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

<!-- ════════════════════════════ MAIN ══ -->
<div class="main-wrapper">

  <!-- Topbar -->
  <header class="topbar">
    <button class="topbar-ham" onclick="openSidebar()"><span></span><span></span><span></span></button>
    <div class="topbar-title">
      <h1 id="page-title">Dashboard</h1>
      <p id="page-sub">Selamat datang kembali, Administrator</p>
    </div>
    <div class="topbar-search">
      <span class="topbar-search-icon">🔍</span>
      <input id="searchInput" type="text" placeholder="Cari menu…" oninput="filterRows()" />
    </div>

    <div class="topbar-actions">

      <!-- Inbox -->
      <div class="dd-wrap">
        <button class="topbar-icon-btn" onclick="toggleDD('dd-inbox')" id="btn-inbox" title="My Inbox">
          📩 <span class="topbar-notif-count">3</span>
        </button>
        <div class="dd-panel wide" id="dd-inbox">
          <div class="dd-head"><div class="dd-head-title">My Inbox</div><div class="dd-head-sub">3 pesan belum dibaca</div></div>
          <div class="dd-inbox"><div class="dd-inbox-dot unread"></div><div class="dd-inbox-body"><div class="dd-inbox-title">Pengajuan Klaim #KLM-2024-0891</div><div class="dd-inbox-sub">Menunggu approval Anda</div><div class="dd-inbox-time">5 menit lalu</div></div></div>
          <div class="dd-inbox"><div class="dd-inbox-dot unread"></div><div class="dd-inbox-body"><div class="dd-inbox-title">Report Sell Out Bulan Ini</div><div class="dd-inbox-sub">Sudah tersedia untuk diunduh</div><div class="dd-inbox-time">1 jam lalu</div></div></div>
          <div class="dd-inbox"><div class="dd-inbox-dot unread"></div><div class="dd-inbox-body"><div class="dd-inbox-title">Target Insentif BA — Update</div><div class="dd-inbox-sub">Data Q4 telah diperbarui</div><div class="dd-inbox-time">3 jam lalu</div></div></div>
          <div class="dd-inbox"><div class="dd-inbox-dot read"></div><div class="dd-inbox-body"><div class="dd-inbox-title">Pembayaran Klaim #KLM-0870</div><div class="dd-inbox-sub">Sudah diproses</div><div class="dd-inbox-time">Kemarin</div></div></div>
          <div class="dd-foot"><a href="#">Lihat semua pesan →</a></div>
        </div>
      </div>

      <!-- Apps -->
      <div class="dd-wrap">
        <button class="topbar-icon-btn" onclick="toggleDD('dd-apps')" id="btn-apps" title="Apps">⊞</button>
        <div class="dd-panel" id="dd-apps">
          <div class="dd-head"><div class="dd-head-title">Aplikasi</div><div class="dd-head-sub">Akses cepat modul utama</div></div>
          <button class="dd-item" onclick="go('https://esw.eji.co.id/sell-out-harian')"><div class="dd-ico dd-ico-cobalt">💰</div><div class="dd-item-body"><div class="dd-item-label">Sell Out</div><div class="dd-item-desc">Penjualan harian & bulanan</div></div></button>
          <button class="dd-item" onclick="go('https://esw.eji.co.id/klaim-sales')"><div class="dd-ico dd-ico-red">📌</div><div class="dd-item-body"><div class="dd-item-label">Manajemen Klaim</div><div class="dd-item-desc">Pengajuan & pembayaran</div></div><span class="dd-pill dd-pill-red">4.4K</span></button>
          <button class="dd-item" onclick="go('https://esw.eji.co.id/report-all')"><div class="dd-ico dd-ico-teal">📊</div><div class="dd-item-body"><div class="dd-item-label">Report & Analisis</div><div class="dd-item-desc">Semua laporan penjualan</div></div></button>
          <button class="dd-item" onclick="go('https://esw.eji.co.id/sap-report-sales')"><div class="dd-ico">🗂️</div><div class="dd-item-body"><div class="dd-item-label">SAP Report</div><div class="dd-item-desc">Laporan terintegrasi SAP</div></div></button>
          <div class="dd-divider"></div>
          <button class="dd-item" onclick="go('https://esw.eji.co.id/master-database')"><div class="dd-ico">🗄️</div><div class="dd-item-body"><div class="dd-item-label">Master Database</div><div class="dd-item-desc">Kelola data master</div></div></button>
          <div class="dd-foot"><a href="#">Lihat semua →</a></div>
        </div>
      </div>

      <!-- Settings -->
      <div class="dd-wrap">
        <button class="topbar-icon-btn" onclick="toggleDD('dd-settings')" id="btn-settings" title="Pengaturan">⚙️</button>
        <div class="dd-panel" id="dd-settings">
          <div class="dd-head"><div class="dd-head-title">Pengaturan</div></div>
          <button class="dd-item" onclick="go('#')"><div class="dd-ico">🎨</div><div class="dd-item-body"><div class="dd-item-label">Tampilan</div><div class="dd-item-desc">Tema & preferensi UI</div></div></button>
          <button class="dd-item" onclick="go('#')"><div class="dd-ico">🔔</div><div class="dd-item-body"><div class="dd-item-label">Notifikasi</div><div class="dd-item-desc">Atur preferensi notifikasi</div></div></button>
          <button class="dd-item" onclick="go('#')"><div class="dd-ico">🔒</div><div class="dd-item-body"><div class="dd-item-label">Keamanan</div><div class="dd-item-desc">Password & sesi login</div></div></button>
          <button class="dd-item" onclick="go('#')"><div class="dd-ico">🌐</div><div class="dd-item-body"><div class="dd-item-label">Bahasa & Wilayah</div><div class="dd-item-desc">Bahasa Indonesia</div></div><span class="dd-pill dd-pill-blue">ID</span></button>
        </div>
      </div>

      <!-- User Profile -->
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
          <div class="dd-profile">
            <div class="dd-profile-avatar">AD</div>
            <div><div class="dd-profile-name">Administrator</div><div class="dd-profile-role">Super Admin · EkaJaya</div><div class="dd-profile-email">admin@ekajaya.co.id</div></div>
          </div>
          <button class="dd-item" onclick="go('#')"><div class="dd-ico dd-ico-cobalt">👤</div><div class="dd-item-body"><div class="dd-item-label">Profil Saya</div><div class="dd-item-desc">Lihat & edit profil</div></div></button>
          <button class="dd-item" onclick="go('#')"><div class="dd-ico">🔑</div><div class="dd-item-body"><div class="dd-item-label">Ganti Password</div><div class="dd-item-desc">Perbarui kata sandi</div></div></button>
          <button class="dd-item" onclick="go('#')"><div class="dd-ico">📋</div><div class="dd-item-body"><div class="dd-item-label">Aktivitas Login</div><div class="dd-item-desc">Riwayat sesi masuk</div></div></button>
          <div class="dd-divider"></div>
          <button class="dd-item danger" onclick="go('#logout')"><div class="dd-ico">🚪</div><div class="dd-item-body"><div class="dd-item-label">Log Out</div><div class="dd-item-desc">Keluar dari sistem</div></div></button>
        </div>
      </div>

    </div>
  </header>

  <!-- Content -->
  <main id="main-content">

    <!-- ── STAT CARDS ── -->
    <div id="stats-wrapper">
      <div class="stat-top" style="margin-bottom:.85rem;">
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
        <div class="stat-quick-card"><div class="stat-quick-ico sqi-cobalt">🧴</div><div><div class="stat-quick-num">1,248</div><div class="stat-quick-lbl">Produk Aktif</div></div></div>
        <div class="stat-quick-card"><div class="stat-quick-ico sqi-sky">🏪</div><div><div class="stat-quick-num">386</div><div class="stat-quick-lbl">Outlet Aktif</div></div></div>
        <div class="stat-quick-card"><div class="stat-quick-ico sqi-teal">🚗</div><div><div class="stat-quick-num">94</div><div class="stat-quick-lbl">Salesman</div></div></div>
        <div class="stat-quick-card"><div class="stat-quick-ico sqi-cobalt">🎁</div><div><div class="stat-quick-num">12</div><div class="stat-quick-lbl">Promo Aktif</div></div></div>
      </div>
    </div>

    <!-- ── LIST GROUPS ── -->
    <div class="list-groups" id="list-groups-wrapper">

      <!-- No result -->
      <div class="no-result" id="no-result">
        <div style="font-size:2rem;margin-bottom:.5rem;">🔍</div>
        <div>Tidak ada menu yang cocok.</div>
        <div style="font-size:.78rem;margin-top:.25rem;color:#9ab0c0;">Coba kata kunci lain</div>
      </div>

      <!-- ══ SELL OUT ══ -->
      <div class="lg" data-section="sellout">
        <div class="lg-head" onclick="toggleGroup(this)">
          <div class="lg-strip ls-cobalt"></div>
          <span class="lg-title">Sell Out</span>
          <span class="lg-sub">Penjualan Harian &amp; Bulanan</span>
          <span class="lg-badge lb-cobalt">4 menu</span>
          <span class="lg-chevron">▾</span>
        </div>
        <div class="lg-body">
          <a href="https://esw.eji.co.id/sell-out-harian" class="lg-row" data-search="sell out hari harian penjualan">
            <div class="lg-ico li-cobalt">💰</div>
            <div class="lg-body-text"><div class="lg-row-title">Sell Out (Hari)</div><div class="lg-row-desc">Menu penjualan harian</div></div>
            <div class="lg-row-right"><span class="lg-pill lp-cobalt">Harian</span><span class="lg-arr">›</span></div>
          </a>
          <a href="https://esw.eji.co.id/sell-out-bulanan" class="lg-row" data-search="sell out bulan bulanan penjualan">
            <div class="lg-ico li-sky">📅</div>
            <div class="lg-body-text"><div class="lg-row-title">Sell Out (Bulan)</div><div class="lg-row-desc">Menu penjualan bulanan</div></div>
            <div class="lg-row-right"><span class="lg-pill lp-sky">Bulanan</span><span class="lg-arr">›</span></div>
          </a>
          <a href="https://esw.eji.co.id/periode-sales" class="lg-row" data-search="periode sales tutup buka">
            <div class="lg-ico li-cobalt">🔒</div>
            <div class="lg-body-text"><div class="lg-row-title">Periode Sales</div><div class="lg-row-desc">Tutup/buka periode sales</div></div>
            <div class="lg-row-right"><span class="lg-pill lp-cobalt">Periode</span><span class="lg-arr">›</span></div>
          </a>
          <a href="https://esw.eji.co.id/report-sell-out" class="lg-row" data-search="report sell out laporan sales ba">
            <div class="lg-ico li-sky">📊</div>
            <div class="lg-body-text"><div class="lg-row-title">Report Sell Out</div><div class="lg-row-desc">Laporan Sales BA bulanan</div></div>
            <div class="lg-row-right"><span class="lg-pill lp-sky">Report</span><span class="lg-arr">›</span></div>
          </a>
        </div>
      </div>

      <!-- ══ SELL IN ══ -->
      <div class="lg" data-section="sellin">
        <div class="lg-head" onclick="toggleGroup(this)">
          <div class="lg-strip ls-sky"></div>
          <span class="lg-title">Sell In</span>
          <span class="lg-sub">Transaksi &amp; Faktur</span>
          <span class="lg-badge lb-cobalt">7 menu</span>
          <span class="lg-chevron">▾</span>
        </div>
        <div class="lg-body">
          <a href="https://esw.eji.co.id/sell-in" class="lg-row" data-search="sell in transaksi"><div class="lg-ico li-sky">🧾</div><div class="lg-body-text"><div class="lg-row-title">Sell In</div><div class="lg-row-desc">Transaksi Sell In</div></div><div class="lg-row-right"><span class="lg-pill lp-sky">Transaksi</span><span class="lg-arr">›</span></div></a>
          <a href="https://esw.eji.co.id/faktur-penjualan" class="lg-row" data-search="faktur penjualan laporan invoice"><div class="lg-ico li-cobalt">📋</div><div class="lg-body-text"><div class="lg-row-title">Faktur Penjualan</div><div class="lg-row-desc">Laporan Faktur Penjualan</div></div><div class="lg-row-right"><span class="lg-pill lp-cobalt">Faktur</span><span class="lg-arr">›</span></div></a>
          <a href="https://esw.eji.co.id/laporan-sell-in" class="lg-row" data-search="laporan sell in proses"><div class="lg-ico li-teal">📈</div><div class="lg-body-text"><div class="lg-row-title">Laporan Sell In</div><div class="lg-row-desc">Proses laporan Sell In</div></div><div class="lg-row-right"><span class="lg-pill lp-teal">Laporan</span><span class="lg-arr">›</span></div></a>
          <a href="https://esw.eji.co.id/retur-distributor" class="lg-row" data-search="retur distributor form pengembalian"><div class="lg-ico li-sky">🔄</div><div class="lg-body-text"><div class="lg-row-title">Retur Distributor</div><div class="lg-row-desc">Form Retur</div></div><div class="lg-row-right"><span class="lg-pill lp-sky">Retur</span><span class="lg-arr">›</span></div></a>
          <a href="https://esw.eji.co.id/stock-outlet-ba" class="lg-row" data-search="stock outlet ba tambah stok"><div class="lg-ico li-cobalt">📦</div><div class="lg-body-text"><div class="lg-row-title">Stock Outlet BA</div><div class="lg-row-desc">Tambah Stock</div></div><div class="lg-row-right"><span class="lg-pill lp-cobalt">Stock</span><span class="lg-arr">›</span></div></a>
          <a href="https://esw.eji.co.id/tracking-order" class="lg-row" data-search="tracking order tms pengiriman"><div class="lg-ico li-teal">🚚</div><div class="lg-body-text"><div class="lg-row-title">Tracking Order</div><div class="lg-row-desc">Tracking Order TMS</div></div><div class="lg-row-right"><span class="lg-pill lp-teal">Tracking</span><span class="lg-arr">›</span></div></a>
          <a href="https://esw.eji.co.id/smt" class="lg-row" data-search="smt monitoring"><div class="lg-ico li-sky">🔁</div><div class="lg-body-text"><div class="lg-row-title">SMT</div><div class="lg-row-desc">Monitoring SMT</div></div><div class="lg-row-right"><span class="lg-pill lp-sky">SMT</span><span class="lg-arr">›</span></div></a>
        </div>
      </div>

      <!-- ══ TARGET & PERIODE ══ -->
      <div class="lg" data-section="target">
        <div class="lg-head" onclick="toggleGroup(this)">
          <div class="lg-strip ls-teal"></div>
          <span class="lg-title">Target &amp; Periode</span>
          <span class="lg-sub">Manajemen Target Penjualan</span>
          <span class="lg-badge lb-cobalt">4 menu</span>
          <span class="lg-chevron">▾</span>
        </div>
        <div class="lg-body">
          <a href="https://esw.eji.co.id/target-sales-ba" class="lg-row" data-search="target sales ba input"><div class="lg-ico li-cobalt">🎯</div><div class="lg-body-text"><div class="lg-row-title">Target Sales BA</div><div class="lg-row-desc">Input Target Sales BA</div></div><div class="lg-row-right"><span class="lg-pill lp-cobalt">Target</span><span class="lg-arr">›</span></div></a>
          <a href="https://esw.eji.co.id/sales-quotation" class="lg-row" data-search="sales quotation form penawaran"><div class="lg-ico li-sky">💼</div><div class="lg-body-text"><div class="lg-row-title">Sales Quotation</div><div class="lg-row-desc">Form sales quotation</div></div><div class="lg-row-right"><span class="lg-pill lp-sky">Form</span><span class="lg-arr">›</span></div></a>
          <a href="https://esw.eji.co.id/sq-vs-so" class="lg-row" data-search="sq vs so laporan analisis"><div class="lg-ico li-teal">⚖️</div><div class="lg-body-text"><div class="lg-row-title">SQ VS SO</div><div class="lg-row-desc">Laporan SQ VS SO</div></div><div class="lg-row-right"><span class="lg-pill lp-teal">Analisis</span><span class="lg-arr">›</span></div></a>
          <a href="https://esw.eji.co.id/target-insentif-salesman" class="lg-row" data-search="target insentif salesman input"><div class="lg-ico li-cobalt">🏅</div><div class="lg-body-text"><div class="lg-row-title">Target Insentif Salesman</div><div class="lg-row-desc">Input Target Insentif</div></div><div class="lg-row-right"><span class="lg-pill lp-cobalt">Insentif</span><span class="lg-arr">›</span></div></a>
        </div>
      </div>

      <!-- ══ SALESMAN & BA ══ -->
      <div class="lg" data-section="salesman">
        <div class="lg-head" onclick="toggleGroup(this)">
          <div class="lg-strip ls-sky"></div>
          <span class="lg-title">Salesman &amp; BA</span>
          <span class="lg-sub">Tim Lapangan</span>
          <span class="lg-badge lb-cobalt">8 menu</span>
          <span class="lg-chevron">▾</span>
        </div>
        <div class="lg-body">
          <a href="https://esw.eji.co.id/salesman" class="lg-row" data-search="salesman monitoring"><div class="lg-ico li-cobalt">🚗</div><div class="lg-body-text"><div class="lg-row-title">Salesman</div><div class="lg-row-desc">Monitoring Salesman</div></div><div class="lg-row-right"><span class="lg-pill lp-cobalt">Monitoring</span><span class="lg-arr">›</span></div></a>
          <a href="https://esw.eji.co.id/materi-ba" class="lg-row" data-search="materi ba beauty advisor"><div class="lg-ico li-teal">📚</div><div class="lg-body-text"><div class="lg-row-title">Materi BA</div><div class="lg-row-desc">Materi untuk BA</div></div><div class="lg-row-right"><span class="lg-pill lp-teal">Materi</span><span class="lg-arr">›</span></div></a>
          <a href="https://esw.eji.co.id/pk-test-ba" class="lg-row" data-search="pk test ba form ujian"><div class="lg-ico li-sky">🧪</div><div class="lg-body-text"><div class="lg-row-title">PK Test BA</div><div class="lg-row-desc">Form Test BA</div></div><div class="lg-row-right"><span class="lg-pill lp-sky">Test</span><span class="lg-arr">›</span></div></a>
          <a href="https://esw.eji.co.id/sample-tester-allocation" class="lg-row" data-search="sample tester allocation alokasi"><div class="lg-ico li-teal">🧫</div><div class="lg-body-text"><div class="lg-row-title">Sample Tester Allocation</div><div class="lg-row-desc">Mengalokasikan sample tester</div></div><div class="lg-row-right"><span class="lg-pill lp-teal">Alokasi</span><span class="lg-arr">›</span></div></a>
          <a href="https://esw.eji.co.id/ppl" class="lg-row" data-search="ppl menu promosi"><div class="lg-ico li-cobalt">📋</div><div class="lg-body-text"><div class="lg-row-title">PPL</div><div class="lg-row-desc">Menu PPL</div></div><div class="lg-row-right"><span class="lg-pill lp-cobalt">PPL</span><span class="lg-arr">›</span></div></a>
          <a href="https://esw.eji.co.id/report-realisasi-ppl" class="lg-row" data-search="report realisasi ppl laporan"><div class="lg-ico li-sky">📊</div><div class="lg-body-text"><div class="lg-row-title">Report Realisasi PPL</div><div class="lg-row-desc">Laporan Realisasi PPL</div></div><div class="lg-row-right"><span class="lg-pill lp-sky">Report</span><span class="lg-arr">›</span></div></a>
          <a href="https://esw.eji.co.id/monitoring-bonus" class="lg-row" data-search="monitoring bonus salesman"><div class="lg-ico li-teal">⭐</div><div class="lg-body-text"><div class="lg-row-title">Monitoring Bonus</div><div class="lg-row-desc">Monitoring bonus salesman</div></div><div class="lg-row-right"><span class="lg-pill lp-teal">Bonus</span><span class="lg-arr">›</span></div></a>
          <a href="https://esw.eji.co.id/report-insentif-ba" class="lg-row" data-search="report insentif ba laporan"><div class="lg-ico li-cobalt">🏅</div><div class="lg-body-text"><div class="lg-row-title">Report Insentif BA</div><div class="lg-row-desc">Laporan insentif BA</div></div><div class="lg-row-right"><span class="lg-pill lp-cobalt">Insentif</span><span class="lg-arr">›</span></div></a>
        </div>
      </div>

      <!-- ══ PROMO & KOMPETITOR ══ -->
      <div class="lg" data-section="promo">
        <div class="lg-head" onclick="toggleGroup(this)">
          <div class="lg-strip ls-teal"></div>
          <span class="lg-title">Promo &amp; Kompetitor</span>
          <span class="lg-sub">Aktivitas Promo</span>
          <span class="lg-badge lb-cobalt">4 menu</span>
          <span class="lg-chevron">▾</span>
        </div>
        <div class="lg-body">
          <a href="https://esw.eji.co.id/promo-hanasui" class="lg-row" data-search="promo hanasui aktivitas"><div class="lg-ico li-sky">🎁</div><div class="lg-body-text"><div class="lg-row-title">Promo Hanasui</div><div class="lg-row-desc">Aktivitas Promo Hanasui</div></div><div class="lg-row-right"><span class="lg-pill lp-sky">Promo</span><span class="lg-arr">›</span></div></a>
          <a href="https://esw.eji.co.id/kompetitor" class="lg-row" data-search="kompetitor promo saingan"><div class="lg-ico li-cobalt">🏆</div><div class="lg-body-text"><div class="lg-row-title">Kompetitor</div><div class="lg-row-desc">Promo Kompetitor</div></div><div class="lg-row-right"><span class="lg-pill lp-cobalt">Kompetitor</span><span class="lg-arr">›</span></div></a>
          <a href="https://esw.eji.co.id/price-monitoring" class="lg-row" data-search="price monitoring harga pantau"><div class="lg-ico li-teal">🏷️</div><div class="lg-body-text"><div class="lg-row-title">Price Monitoring</div><div class="lg-row-desc">Menu Price Monitoring</div></div><div class="lg-row-right"><span class="lg-pill lp-teal">Monitoring</span><span class="lg-arr">›</span></div></a>
          <a href="https://esw.eji.co.id/post-budget" class="lg-row" data-search="post budget ppl proposal anggaran"><div class="lg-ico li-cobalt">🗂️</div><div class="lg-body-text"><div class="lg-row-title">Post Budget</div><div class="lg-row-desc">Post Budget PPL/Proposal</div></div><div class="lg-row-right"><span class="lg-pill lp-cobalt">Budget</span><span class="lg-arr">›</span></div></a>
        </div>
      </div>

      <!-- ══ MANAJEMEN KLAIM ══ -->
      <div class="lg" data-section="klaim">
        <div class="lg-head" onclick="toggleGroup(this)">
          <div class="lg-strip ls-red"></div>
          <span class="lg-title">Manajemen Klaim</span>
          <span class="lg-sub">Pengajuan &amp; Pembayaran</span>
          <span class="lg-badge lb-red">4,445 Pending</span>
          <span class="lg-chevron">▾</span>
        </div>
        <div class="lg-body">
          <a href="https://esw.eji.co.id/klaim-sales" class="lg-row" data-search="klaim sales input"><div class="lg-ico li-red">🚨</div><div class="lg-body-text"><div class="lg-row-title">Klaim Sales</div><div class="lg-row-desc">Input klaim</div></div><div class="lg-row-right"><span class="lg-pill lp-red">Klaim</span><span class="lg-arr">›</span></div></a>
          <a href="https://esw.eji.co.id/pengajuan-klaim" class="lg-row" data-search="pengajuan klaim transaksi form"><div class="lg-ico li-red">📩</div><div class="lg-body-text"><div class="lg-row-title">Pengajuan Klaim</div><div class="lg-row-desc">Transaksi pengajuan klaim</div></div><div class="lg-row-right"><span class="lg-pill lp-red">Pengajuan</span><span class="lg-arr">›</span></div></a>
          <a href="https://esw.eji.co.id/pembayaran-klaim" class="lg-row" data-search="pembayaran klaim form bayar"><div class="lg-ico li-red">💳</div><div class="lg-body-text"><div class="lg-row-title">Pembayaran Klaim</div><div class="lg-row-desc">Form pembayaran klaim</div></div><div class="lg-row-right"><span class="lg-pill lp-red">Pembayaran</span><span class="lg-arr">›</span></div></a>
          <a href="https://esw.eji.co.id/bukti-potong" class="lg-row" data-search="bukti potong klaim pajak"><div class="lg-ico li-red">📎</div><div class="lg-body-text"><div class="lg-row-title">Bukti Potong</div><div class="lg-row-desc">Bukti potong klaim</div></div><div class="lg-row-right"><span class="lg-pill lp-red">Bukti</span><span class="lg-arr">›</span></div></a>
          <a href="https://esw.eji.co.id/form-keluhan" class="lg-row" data-search="form keluhan isi komplain"><div class="lg-ico li-red">💬</div><div class="lg-body-text"><div class="lg-row-title">Form Keluhan</div><div class="lg-row-desc">Isi Form Keluhan</div></div><div class="lg-row-right"><span class="lg-pill lp-red">Keluhan</span><span class="lg-arr">›</span></div></a>
        </div>
      </div>

      <!-- ══ LOGBOOK ══ -->
      <div class="lg" data-section="logbook">
        <div class="lg-head" onclick="toggleGroup(this)">
          <div class="lg-strip ls-cobalt"></div>
          <span class="lg-title">Logbook</span>
          <span class="lg-sub">Catatan Operasional</span>
          <span class="lg-badge lb-cobalt">4 menu</span>
          <span class="lg-chevron">▾</span>
        </div>
        <div class="lg-body">
          <a href="https://esw.eji.co.id/logbook" class="lg-row" data-search="logbook klaim catatan"><div class="lg-ico li-cobalt">📓</div><div class="lg-body-text"><div class="lg-row-title">Logbook</div><div class="lg-row-desc">Logbook klaim</div></div><div class="lg-row-right"><span class="lg-pill lp-cobalt">Logbook</span><span class="lg-arr">›</span></div></a>
          <a href="https://esw.eji.co.id/logbook-ops" class="lg-row" data-search="logbook ops operasional klaim"><div class="lg-ico li-sky">🔧</div><div class="lg-body-text"><div class="lg-row-title">Logbook OPS</div><div class="lg-row-desc">Logbook Operasional-Klaim</div></div><div class="lg-row-right"><span class="lg-pill lp-sky">OPS</span><span class="lg-arr">›</span></div></a>
          <a href="https://esw.eji.co.id/logbook-nka" class="lg-row" data-search="logbook nka klaim"><div class="lg-ico li-teal">📗</div><div class="lg-body-text"><div class="lg-row-title">Logbook NKA</div><div class="lg-row-desc">Logbook NKA-Klaim</div></div><div class="lg-row-right"><span class="lg-pill lp-teal">NKA</span><span class="lg-arr">›</span></div></a>
          <a href="https://esw.eji.co.id/logbook-mkt" class="lg-row" data-search="logbook mkt marketing klaim"><div class="lg-ico li-cobalt">📘</div><div class="lg-body-text"><div class="lg-row-title">Logbook MKT</div><div class="lg-row-desc">Logbook MKT-Klaim</div></div><div class="lg-row-right"><span class="lg-pill lp-cobalt">MKT</span><span class="lg-arr">›</span></div></a>
        </div>
      </div>

      <!-- ══ REPORT & ANALISIS ══ -->
      <div class="lg" data-section="report">
        <div class="lg-head" onclick="toggleGroup(this)">
          <div class="lg-strip ls-teal"></div>
          <span class="lg-title">Report &amp; Analisis</span>
          <span class="lg-sub">Laporan &amp; Data</span>
          <span class="lg-badge lb-cobalt">6 menu</span>
          <span class="lg-chevron">▾</span>
        </div>
        <div class="lg-body">
          <a href="https://esw.eji.co.id/report-listing" class="lg-row" data-search="report listing laporan daftar"><div class="lg-ico li-cobalt">📊</div><div class="lg-body-text"><div class="lg-row-title">Report Listing</div><div class="lg-row-desc">Laporan listing</div></div><div class="lg-row-right"><span class="lg-pill lp-cobalt">Listing</span><span class="lg-arr">›</span></div></a>
          <a href="https://esw.eji.co.id/sap-report-sales" class="lg-row" data-search="sap report sales laporan erp"><div class="lg-ico li-sky">🗂️</div><div class="lg-body-text"><div class="lg-row-title">[SAP] Report Sales</div><div class="lg-row-desc">Laporan sales SAP</div></div><div class="lg-row-right"><span class="lg-pill lp-sky">SAP</span><span class="lg-arr">›</span></div></a>
          <a href="https://esw.eji.co.id/report-all" class="lg-row" data-search="report all semua laporan"><div class="lg-ico li-teal">📂</div><div class="lg-body-text"><div class="lg-row-title">Report All</div><div class="lg-row-desc">Semua laporan</div></div><div class="lg-row-right"><span class="lg-pill lp-teal">All</span><span class="lg-arr">›</span></div></a>
          <a href="https://esw.eji.co.id/report-acc-ppl" class="lg-row" data-search="report acc vs ppl budget"><div class="lg-ico li-cobalt">📑</div><div class="lg-body-text"><div class="lg-row-title">Report Acc VS PPL</div><div class="lg-row-desc">Report Budget Acc VS PPL</div></div><div class="lg-row-right"><span class="lg-pill lp-cobalt">Budget</span><span class="lg-arr">›</span></div></a>
          <a href="https://esw.eji.co.id/report-ar" class="lg-row" data-search="report ar account receivable piutang"><div class="lg-ico li-sky">💰</div><div class="lg-body-text"><div class="lg-row-title">Report AR</div><div class="lg-row-desc">Laporan Account Receivable</div></div><div class="lg-row-right"><span class="lg-pill lp-sky">AR</span><span class="lg-arr">›</span></div></a>
          <a href="https://esw.eji.co.id/report-insentif-ba" class="lg-row" data-search="report insentif ba laporan"><div class="lg-ico li-teal">🏅</div><div class="lg-body-text"><div class="lg-row-title">Report Insentif BA</div><div class="lg-row-desc">Laporan insentif BA</div></div><div class="lg-row-right"><span class="lg-pill lp-teal">Insentif</span><span class="lg-arr">›</span></div></a>
        </div>
      </div>

      <!-- ══ KEUANGAN ══ -->
      <div class="lg" data-section="finance">
        <div class="lg-head" onclick="toggleGroup(this)">
          <div class="lg-strip ls-teal"></div>
          <span class="lg-title">Keuangan</span>
          <span class="lg-sub">Kas &amp; Vendor</span>
          <span class="lg-badge lb-cobalt">2 menu</span>
          <span class="lg-chevron">▾</span>
        </div>
        <div class="lg-body">
          <a href="https://esw.eji.co.id/petty-cash" class="lg-row" data-search="petty cash form kas kecil keuangan"><div class="lg-ico li-teal">💵</div><div class="lg-body-text"><div class="lg-row-title">Petty Cash</div><div class="lg-row-desc">Form Petty Cash</div></div><div class="lg-row-right"><span class="lg-pill lp-teal">Keuangan</span><span class="lg-arr">›</span></div></a>
          <a href="https://esw.eji.co.id/master-vendor" class="lg-row" data-search="master vendor data supplier"><div class="lg-ico li-sky">🏦</div><div class="lg-body-text"><div class="lg-row-title">Master Vendor</div><div class="lg-row-desc">Data Master Vendor</div></div><div class="lg-row-right"><span class="lg-pill lp-sky">Vendor</span><span class="lg-arr">›</span></div></a>
        </div>
      </div>

      <!-- ══ DATA MASTER ══ -->
      <div class="lg" data-section="master">
        <div class="lg-head" onclick="toggleGroup(this)">
          <div class="lg-strip ls-cobalt"></div>
          <span class="lg-title">Data Master</span>
          <span class="lg-sub">Produk, Outlet &amp; User</span>
          <span class="lg-badge lb-cobalt">5 menu</span>
          <span class="lg-chevron">▾</span>
        </div>
        <div class="lg-body">
          <a href="https://esw.eji.co.id/master-database" class="lg-row" data-search="master all database semua data"><div class="lg-ico li-cobalt">🗃️</div><div class="lg-body-text"><div class="lg-row-title">Master All Database</div><div class="lg-row-desc">Master seluruh database</div></div><div class="lg-row-right"><span class="lg-pill lp-cobalt">Master</span><span class="lg-arr">›</span></div></a>
          <a href="https://esw.eji.co.id/tambah-produk" class="lg-row" data-search="tambah produk baru kosmetik item"><div class="lg-ico li-sky">🧴</div><div class="lg-body-text"><div class="lg-row-title">Tambah Produk</div><div class="lg-row-desc">Tambah Produk Baru</div></div><div class="lg-row-right"><span class="lg-pill lp-sky">Produk</span><span class="lg-arr">›</span></div></a>
          <a href="https://esw.eji.co.id/store-baru" class="lg-row" data-search="store baru tambah toko gerai"><div class="lg-ico li-teal">🏪</div><div class="lg-body-text"><div class="lg-row-title">Store Baru</div><div class="lg-row-desc">Tambah Store Baru</div></div><div class="lg-row-right"><span class="lg-pill lp-teal">Store</span><span class="lg-arr">›</span></div></a>
          <a href="https://esw.eji.co.id/pengajuan-outlet" class="lg-row" data-search="pengajuan outlet form registrasi"><div class="lg-ico li-cobalt">🏠</div><div class="lg-body-text"><div class="lg-row-title">Pengajuan Outlet</div><div class="lg-row-desc">Form pengajuan outlet</div></div><div class="lg-row-right"><span class="lg-pill lp-cobalt">Outlet</span><span class="lg-arr">›</span></div></a>
          <a href="https://esw.eji.co.id/user-login" class="lg-row" data-search="user login tambah pengguna akun"><div class="lg-ico li-sky">👤</div><div class="lg-body-text"><div class="lg-row-title">User Login</div><div class="lg-row-desc">Tambah user login</div></div><div class="lg-row-right"><span class="lg-pill lp-sky">User</span><span class="lg-arr">›</span></div></a>
        </div>
      </div>

      <!-- ══ VISIT & MONITORING ══ -->
      <div class="lg" data-section="visit">
        <div class="lg-head" onclick="toggleGroup(this)">
          <div class="lg-strip ls-sky"></div>
          <span class="lg-title">Visit &amp; Monitoring</span>
          <span class="lg-sub">Kunjungan BA &amp; TL</span>
          <span class="lg-badge lb-cobalt">2 menu</span>
          <span class="lg-chevron">▾</span>
        </div>
        <div class="lg-body">
          <a href="https://esw.eji.co.id/visit-ba" class="lg-row" data-search="visit ba assessment form kunjungan"><div class="lg-ico li-cobalt">👁️</div><div class="lg-body-text"><div class="lg-row-title">Visit BA</div><div class="lg-row-desc">Form Visit BA Assessment</div></div><div class="lg-row-right"><span class="lg-pill lp-cobalt">Visit</span><span class="lg-arr">›</span></div></a>
          <a href="https://esw.eji.co.id/visit-tl" class="lg-row" data-search="visit tl team leader kunjungan"><div class="lg-ico li-sky">🚶</div><div class="lg-body-text"><div class="lg-row-title">Visit TL</div><div class="lg-row-desc">Visit Team Leader</div></div><div class="lg-row-right"><span class="lg-pill lp-sky">Visit</span><span class="lg-arr">›</span></div></a>
        </div>
      </div>

    </div><!-- /#list-groups-wrapper -->

    <div class="page-footer">
      EkaJaya Internasional — Beauty Management System &nbsp;·&nbsp; v2.5.0 &nbsp;·&nbsp; © 2025 PT EkaJaya
    </div>
  </main>
</div>

<!-- ════════════════════════ SCRIPTS ════════════════════════ -->
<script>
  'use strict';

  const SECTION_META = {
    all:      ['Dashboard',          'Selamat datang kembali, Administrator'],
    sellout:  ['Sell Out',           'Penjualan Harian & Bulanan'],
    sellin:   ['Sell In',            'Transaksi & Faktur'],
    target:   ['Target & Periode',   'Manajemen Target Penjualan'],
    salesman: ['Salesman & BA',      'Manajemen Tim Lapangan'],
    promo:    ['Promo & Kompetitor', 'Aktivitas Promo & Kompetitor'],
    klaim:    ['Manajemen Klaim',    'Pengajuan, Pembayaran & Monitoring'],
    logbook:  ['Logbook',            'Catatan Operasional Harian'],
    report:   ['Report & Analisis',  'Laporan Penjualan & Data'],
    finance:  ['Keuangan',           'Petty Cash & Vendor'],
    master:   ['Data Master',        'Kelola Produk, Outlet & User'],
    visit:    ['Visit & Monitoring', 'Kunjungan BA & Team Leader'],
  };

  /* ── Sidebar section filter ── */
  function showSection(key, el) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if (el) el.classList.add('active');
    const [title, sub] = SECTION_META[key] || ['Dashboard',''];
    document.getElementById('page-title').textContent = title;
    document.getElementById('page-sub').textContent   = sub;

    const sw = document.getElementById('stats-wrapper');
    if (sw) sw.style.display = key === 'all' ? '' : 'none';

    document.querySelectorAll('.lg').forEach(g => {
      g.style.display = (key === 'all' || g.dataset.section === key) ? '' : 'none';
    });

    // Reset search
    const inp = document.getElementById('searchInput');
    if (inp) inp.value = '';
    document.querySelectorAll('.lg-row').forEach(r => r.classList.remove('hidden'));
    document.getElementById('no-result').classList.remove('show');

    closeSidebar();
    const mc = document.getElementById('main-content');
    if (mc) mc.scrollTop = 0;
  }

  /* ── Search / filter rows ── */
  function filterRows() {
    const q = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
    const sw = document.getElementById('stats-wrapper');

    if (!q) {
      // Restore
      if (sw) sw.style.display = '';
      document.querySelectorAll('.lg').forEach(g => g.style.display = '');
      document.querySelectorAll('.lg-row').forEach(r => r.classList.remove('hidden'));
      document.querySelectorAll('.lg-body.collapsed').forEach(b => {
        b.classList.remove('collapsed');
        b.previousElementSibling?.classList.remove('collapsed');
      });
      document.getElementById('no-result').classList.remove('show');
      return;
    }

    if (sw) sw.style.display = 'none';
    document.querySelectorAll('.lg').forEach(g => {
      g.style.display = '';
      // expand all groups while searching
      const body = g.querySelector('.lg-body');
      const head = g.querySelector('.lg-head');
      if (body)  body.classList.remove('collapsed');
      if (head)  head.classList.remove('collapsed');
    });

    let anyVisible = false;
    document.querySelectorAll('.lg-row').forEach(row => {
      const kw    = (row.dataset.search || '').toLowerCase();
      const title = (row.querySelector('.lg-row-title')?.textContent || '').toLowerCase();
      const desc  = (row.querySelector('.lg-row-desc')?.textContent  || '').toLowerCase();
      const match = kw.includes(q) || title.includes(q) || desc.includes(q);
      row.classList.toggle('hidden', !match);
      if (match) anyVisible = true;
    });

    // Hide groups with no visible rows
    document.querySelectorAll('.lg').forEach(g => {
      const hasVisible = [...g.querySelectorAll('.lg-row')].some(r => !r.classList.contains('hidden'));
      g.style.display = hasVisible ? '' : 'none';
    });

    document.getElementById('no-result').classList.toggle('show', !anyVisible);
  }

  /* ── Collapse/expand group ── */
  function toggleGroup(head) {
    head.classList.toggle('collapsed');
    const body = head.nextElementSibling;
    if (body) body.classList.toggle('collapsed');
  }

  /* ── Sidebar mobile ── */
  function openSidebar()  { document.getElementById('sidebar').classList.add('open'); document.getElementById('sidebar-overlay').classList.add('visible'); }
  function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebar-overlay').classList.remove('visible'); }

  /* ── Dropdown ── */
  const DD_IDS  = ['dd-inbox','dd-apps','dd-settings','dd-user'];
  const BTN_MAP = { 'dd-inbox':'btn-inbox','dd-apps':'btn-apps','dd-settings':'btn-settings','dd-user':'btn-user' };

  function toggleDD(id) {
    const isOpen = document.getElementById(id)?.classList.contains('open');
    closeAllDD();
    if (!isOpen) {
      document.getElementById(id)?.classList.add('open');
      document.getElementById(BTN_MAP[id])?.classList.add('dd-open');
    }
  }
  function closeAllDD() {
    DD_IDS.forEach(id => document.getElementById(id)?.classList.remove('open'));
    document.querySelectorAll('.topbar-icon-btn,.topbar-avatar-btn').forEach(b => b.classList.remove('dd-open'));
  }
  document.addEventListener('click', e => { if (!e.target.closest('.dd-wrap')) closeAllDD(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeAllDD(); closeSidebar(); } });

  /* ── Navigate helper ── */
  function go(url) {
    closeAllDD();
    if (!url || url === '#') return;
    if (url === '#logout') { if (confirm('Yakin ingin keluar?')) window.location.href = '/logout'; return; }
    window.location.href = url;
  }
</script>
</body>
</html>
