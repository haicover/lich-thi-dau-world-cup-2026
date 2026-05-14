// ========== APP LOGIC — Sprint 2 ==========
let GROUPS = {};
let FLAG_CODES = {};
let CONF = {};
let ALL_MATCHES = [];
let GROUP_MATCHES = [];
let KNOCKOUT_MATCHES = [];
let VENUES = [];
let TEAMS_DATA = [];

document.addEventListener('DOMContentLoaded', async () => {
    await fetchData();
    registerServiceWorker();  // US-02
    initOfflineDetection();   // US-02
    initCountdown();
    initTabs();
    initScrollTop();
    renderGroups();
    populateTeamFilter();
    renderSchedule();
    renderVenues();
    initFavoritesFilter();    // US-03
    initSearch();             // US-09
});

async function fetchData() {
    try {
        const [teamsRes, matchesRes, venuesRes] = await Promise.all([
            fetch('./teams.json'), fetch('./matches.json'), fetch('./venues.json')
        ]);
        const teamsData = await teamsRes.json();
        const matchesData = await matchesRes.json();
        VENUES = await venuesRes.json();
        TEAMS_DATA = teamsData;

        teamsData.forEach(t => {
            if (!GROUPS[t.group]) GROUPS[t.group] = [];
            GROUPS[t.group].push(t.name);
            FLAG_CODES[t.name] = t.code;
            CONF[t.name] = t.confederation;
        });

        const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
            hour: '2-digit', minute: '2-digit', hour12: false
        });

        ALL_MATCHES = matchesData.map(m => {
            const d = new Date(m.utcTime);
            return {
                ...m,
                date: d,
                time: timeFormatter.format(d)
            };
        });

        GROUP_MATCHES = ALL_MATCHES.filter(m => m.stage === 'group');
        KNOCKOUT_MATCHES = ALL_MATCHES.filter(m => m.stage !== 'group');

    } catch (e) {
        console.error("Lỗi khi tải dữ liệu:", e);
        showToast('Lỗi tải dữ liệu, vui lòng thử lại', 'warning');
    }
}

function getFlagImg(name, size) {
    size = size || 24;
    const code = FLAG_CODES[name];
    if (!code) return '<span class="team-flag-placeholder">🏳️</span>';
    return `<img src="https://flagcdn.com/w40/${code}.png" width="${size}" height="${Math.round(size*0.75)}" alt="${name}" class="team-flag-img" loading="lazy">`;
}

// ========== US-02: SERVICE WORKER REGISTRATION ==========
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('[SW] Registered:', reg.scope))
            .catch(err => console.warn('[SW] Registration failed:', err));
    }
}

// ========== US-02: OFFLINE DETECTION ==========
function initOfflineDetection() {
    const bar = document.getElementById('offlineBar');
    function updateStatus() {
        bar.classList.toggle('visible', !navigator.onLine);
    }
    window.addEventListener('online', () => {
        updateStatus();
        showToast('🌐 Đã kết nối mạng!', 'success');
    });
    window.addEventListener('offline', () => {
        updateStatus();
        showToast('📶 Mất kết nối — Đang xem offline', 'warning');
    });
    updateStatus();
}

// ========== TOAST NOTIFICATION (US-03, US-05, US-06) ==========
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show toast-${type}`;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ========== US-03: FAVORITES ==========
function getFavorites() {
    try { return JSON.parse(localStorage.getItem('wc2026_favorites') || '[]'); }
    catch { return []; }
}
function setFavorites(favs) {
    localStorage.setItem('wc2026_favorites', JSON.stringify(favs));
}
function isFavorite(teamName) {
    return getFavorites().includes(teamName);
}
function toggleFavorite(teamName) {
    let favs = getFavorites();
    if (favs.includes(teamName)) {
        favs = favs.filter(t => t !== teamName);
        showToast(`❌ Đã bỏ ${teamName} khỏi yêu thích`, 'info');
    } else {
        if (favs.length >= 5) {
            showToast('⚠️ Tối đa 5 đội yêu thích!', 'warning');
            return;
        }
        favs.push(teamName);
        showToast(`⭐ Đã thêm ${teamName} vào yêu thích!`, 'success');
    }
    setFavorites(favs);
    renderGroups();
    // Update filter chip style
    updateFavoriteChip();
}
function updateFavoriteChip() {
    const btn = document.getElementById('filterFavorites');
    const clearBtn = document.getElementById('clearFavorites');
    const favs = getFavorites();
    btn.classList.toggle('active', favs.length > 0);
    btn.textContent = favs.length > 0 ? `⭐ Yêu thích (${favs.length})` : '⭐ Đội yêu thích';
    // Show/hide clear button
    if (clearBtn) clearBtn.style.display = favs.length > 0 ? 'inline-block' : 'none';
}
function clearAllFavorites() {
    const favs = getFavorites();
    if (favs.length === 0) return;
    setFavorites([]);
    favoritesFilterActive = false;
    document.getElementById('filterFavorites').classList.remove('filter-active');
    updateFavoriteChip();
    renderGroups();
    renderSchedule();
    showToast(`🗑️ Đã xóa ${favs.length} đội khỏi yêu thích`, 'info');
}
let favoritesFilterActive = false;
function initFavoritesFilter() {
    const btn = document.getElementById('filterFavorites');
    const clearBtn = document.getElementById('clearFavorites');
    updateFavoriteChip();
    btn.addEventListener('click', () => {
        favoritesFilterActive = !favoritesFilterActive;
        btn.classList.toggle('filter-active', favoritesFilterActive);
        renderSchedule();
        if (favoritesFilterActive) {
            const favs = getFavorites();
            if (favs.length === 0) {
                showToast('Chưa có đội yêu thích — hãy ⭐ chọn ở tab Bảng Đấu', 'warning');
                favoritesFilterActive = false;
                btn.classList.remove('filter-active');
            }
        }
    });
    // US-03 AC6: Clear all favorites
    if (clearBtn) {
        clearBtn.addEventListener('click', clearAllFavorites);
    }
}

// ========== US-05: ICS CALENDAR ==========
function generateICS(match) {
    const startDate = new Date(match.date);
    const timeArr = match.time.replace('h', ':').split(':');
    startDate.setHours(parseInt(timeArr[0]) - 7, parseInt(timeArr[1] || 0)); // VN time → UTC
    const endDate = new Date(startDate.getTime() + 2 * 3600000); // 2 hours
    const fmt = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const title = `🏆 ${match.home} vs ${match.away} — World Cup 2026`;
    const desc = `FIFA World Cup 2026\\n${match.home} vs ${match.away}\\nVòng: ${match.stage === 'group' ? 'Bảng ' + match.group : match.stage}\\nSân: ${match.venue}`;
    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//WC2026 App//VI',
        'BEGIN:VEVENT',
        `DTSTART:${fmt(startDate)}`,
        `DTEND:${fmt(endDate)}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${desc}`,
        `LOCATION:${match.venue}`,
        'BEGIN:VALARM',
        'TRIGGER:-PT30M',
        'ACTION:DISPLAY',
        'DESCRIPTION:Trận đấu sắp bắt đầu trong 30 phút!',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');
}
function downloadICS(match) {
    const content = generateICS(match);
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WC2026_${match.home}_vs_${match.away}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📅 Đã tải file lịch — mở để thêm vào Calendar!', 'success');
}
function exportFavoriteICS() {
    const favs = getFavorites();
    if (favs.length === 0) { showToast('Chưa có đội yêu thích!', 'warning'); return; }
    const matches = ALL_MATCHES.filter(m => favs.includes(m.home) || favs.includes(m.away));
    const events = matches.map(m => {
        const startDate = new Date(m.date);
        const timeArr = m.time.replace('h', ':').split(':');
        startDate.setHours(parseInt(timeArr[0]) - 7, parseInt(timeArr[1] || 0));
        const endDate = new Date(startDate.getTime() + 2 * 3600000);
        const fmt = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        return [
            'BEGIN:VEVENT',
            `DTSTART:${fmt(startDate)}`,
            `DTEND:${fmt(endDate)}`,
            `SUMMARY:🏆 ${m.home} vs ${m.away} — WC2026`,
            `LOCATION:${m.venue}`,
            'BEGIN:VALARM','TRIGGER:-PT30M','ACTION:DISPLAY','DESCRIPTION:Sắp bắt đầu!','END:VALARM',
            'END:VEVENT'
        ].join('\r\n');
    });
    const ics = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//WC2026//VI',...events,'END:VCALENDAR'].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'WC2026_Doi_Yeu_Thich.ics';
    a.click();
    showToast(`📅 Đã xuất ${matches.length} trận của đội yêu thích!`, 'success');
}

// ========== US-06: SHARE ==========
function shareMatch(match) {
    const text = `${match.home} 🆚 ${match.away}\n📅 ${formatDate(match.date)} • ${match.time} (Giờ VN)\n📍 ${match.venue}\n🏆 FIFA World Cup 2026`;
    if (navigator.share) {
        navigator.share({ title: 'World Cup 2026', text: text })
            .catch(() => {});
    } else {
        navigator.clipboard.writeText(text).then(() => {
            showToast('📋 Đã copy thông tin trận đấu!', 'success');
        }).catch(() => {
            // Fallback
            const ta = document.createElement('textarea');
            ta.value = text; document.body.appendChild(ta);
            ta.select(); document.execCommand('copy');
            document.body.removeChild(ta);
            showToast('📋 Đã copy thông tin trận đấu!', 'success');
        });
    }
}

// ========== US-11: NEXT MATCH COUNTDOWN ==========
let currentNextMatchId = null;

function scrollToNextMatch() {
    if (!currentNextMatchId) return;
    document.getElementById('tab-schedule').click();
    setTimeout(() => {
        const els = document.querySelectorAll('.match-card');
        for (let el of els) {
            const home = el.querySelector('.home .team-name').textContent;
            const away = el.querySelector('.away .team-name').textContent;
            if (home === currentNextMatchId.home && away === currentNextMatchId.away) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.5)';
                setTimeout(() => el.style.boxShadow = '', 2000);
                break;
            }
        }
    }, 100);
}

function initCountdown() {
    function update() {
        const now = new Date();
        
        let nextMatch = null;
        for (let m of ALL_MATCHES) {
            // Assume a match lasts ~2 hours (7200000 ms)
            if (m.date.getTime() + 7200000 > now.getTime()) {
                nextMatch = m;
                break;
            }
        }

        const container = document.getElementById('countdownContainer');
        if (!container) return;

        if (!nextMatch) {
            container.innerHTML = '<span style="color:var(--gold);font-weight:700;">🎉 Giải đấu đã kết thúc!</span>';
            container.onclick = null;
            container.style.cursor = 'default';
            return;
        }

        currentNextMatchId = nextMatch;
        container.onclick = scrollToNextMatch;
        container.style.cursor = 'pointer';

        const diff = nextMatch.date - now;
        
        if (diff <= 0) {
            container.innerHTML = `
                <div style="color:var(--red); font-weight:700; font-size:1.1rem; animation:pulse-glow 2s infinite; text-align:right;">
                    🔴 ĐANG DIỄN RA: ${getFlag(nextMatch.home, 20)} ${nextMatch.home} vs ${nextMatch.away} ${getFlag(nextMatch.away, 20)}
                </div>
                <div style="font-size:0.8rem; color:var(--text-muted); margin-top:4px; text-align:right;">📍 ${nextMatch.venue}</div>
            `;
            return;
        }

        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const min = Math.floor((diff % 3600000) / 60000);
        const sec = Math.floor((diff % 60000) / 1000);

        container.innerHTML = `
            <div class="next-match-label" id="nextMatchLabel">
                Sắp tới: ${getFlag(nextMatch.home, 16)} ${nextMatch.home} vs ${nextMatch.away} ${getFlag(nextMatch.away, 16)} <br>
                <span style="font-size:0.6rem;color:var(--text-muted);font-weight:normal">📍 ${nextMatch.venue} • ${nextMatch.time} (Giờ VN)</span>
            </div>
            <div class="countdown-timer" id="countdown">
                <div class="countdown-item"><span class="countdown-value">${String(d).padStart(2, '0')}</span><span class="countdown-label">Ngày</span></div><div class="countdown-sep">:</div>
                <div class="countdown-item"><span class="countdown-value">${String(h).padStart(2, '0')}</span><span class="countdown-label">Giờ</span></div><div class="countdown-sep">:</div>
                <div class="countdown-item"><span class="countdown-value">${String(min).padStart(2, '0')}</span><span class="countdown-label">Phút</span></div><div class="countdown-sep">:</div>
                <div class="countdown-item"><span class="countdown-value">${String(sec).padStart(2, '0')}</span><span class="countdown-label">Giây</span></div>
            </div>
        `;
    }
    
    if (ALL_MATCHES.length > 0) {
        ALL_MATCHES.sort((a, b) => a.date - b.date);
        update();
        setInterval(update, 1000);
    }
}

// ========== TABS ==========
function initTabs() {
    const btns = document.querySelectorAll('.tab-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            const tab = btn.dataset.tab;
            document.getElementById(`content-${tab}`).classList.add('active');
            const fb = document.getElementById('filterBar');
            fb.style.display = tab === 'schedule' ? 'block' : 'none';
        });
    });
    document.getElementById('filterStage').addEventListener('change', renderSchedule);
    document.getElementById('filterGroup').addEventListener('change', renderSchedule);
    document.getElementById('filterTeam').addEventListener('change', renderSchedule);
}

// ========== SCROLL TOP ==========
function initScrollTop() {
    const btn = document.getElementById('scrollTop');
    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 400);
    });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ========== HELPERS ==========
function getFlag(name, size) { return getFlagImg(name, size); }
function formatDate(d) {
    const days = ['CN','T2','T3','T4','T5','T6','T7'];
    return `${days[d.getDay()]}, ${d.getDate()}/${d.getMonth()+1}/2026`;
}
function formatDateShort(d) { return `${d.getDate()}/${d.getMonth()+1}`; }

// ========== US-04: STANDINGS DATA ==========
function getStandingsForGroup(groupName) {
    const teams = GROUPS[groupName];
    return teams.map((t, i) => ({
        team: t,
        pos: i + 1,
        played: 0, wins: 0, draws: 0, losses: 0,
        gf: 0, ga: 0, gd: 0, pts: 0
    }));
}

// ========== RENDER GROUPS (US-03 + US-04) ==========
function renderGroups() {
    const grid = document.getElementById('groupsGrid');
    grid.innerHTML = '';
    const favs = getFavorites();

    Object.entries(GROUPS).forEach(([g, teams]) => {
        const card = document.createElement('div');
        card.className = 'group-card';

        // US-04: Standings toggle state
        const standings = getStandingsForGroup(g);

        card.innerHTML = `
            <div class="group-header">
                <h3>Bảng ${g}</h3>
                <div class="group-header-actions">
                    <button class="standings-toggle" data-group="${g}" title="Xem bảng xếp hạng">📊</button>
                    <span>4 đội</span>
                </div>
            </div>
            <!-- Team List View -->
            <div class="group-teams" id="teamlist-${g}">
                ${teams.map((t, i) => `
                    <div class="team-row ${favs.includes(t) ? 'team-favorite' : ''}">
                        <span class="team-rank">${i + 1}</span>
                        <span class="team-flag">${getFlag(t, 28)}</span>
                        <span class="team-name" onclick="showTeamProfile('${t}')" style="cursor: pointer;">${t}</span>
                        <button class="fav-btn ${favs.includes(t) ? 'fav-active' : ''}" onclick="toggleFavorite('${t}')" title="${favs.includes(t) ? 'Bỏ yêu thích' : 'Yêu thích'}">
                            ${favs.includes(t) ? '★' : '☆'}
                        </button>
                        <span class="team-conf">${CONF[t] || ''}</span>
                    </div>
                `).join('')}
            </div>
            <!-- US-04: Standings Table View -->
            <div class="group-standings hidden" id="standings-${g}">
                <table class="standings-table">
                    <thead>
                        <tr>
                            <th>#</th><th>Đội</th><th>ST</th><th>T</th><th>H</th><th>B</th>
                            <th>BT</th><th>BB</th><th>HS</th><th>Đ</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${standings.map((s, i) => `
                            <tr class="${i < 2 ? 'pos-qualified' : i === 2 ? 'pos-possible' : ''}">
                                <td>${s.pos}</td>
                                <td class="standings-team">${getFlag(s.team, 20)} <span onclick="showTeamProfile('${s.team}')" style="cursor: pointer;">${s.team}</span></td>
                                <td>${s.played}</td><td>${s.wins}</td><td>${s.draws}</td><td>${s.losses}</td>
                                <td>${s.gf}</td><td>${s.ga}</td><td>${s.gd}</td>
                                <td class="standings-pts">${s.pts}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        grid.appendChild(card);
    });

    // Bind standings toggles
    document.querySelectorAll('.standings-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const g = btn.dataset.group;
            const teamList = document.getElementById(`teamlist-${g}`);
            const standingsEl = document.getElementById(`standings-${g}`);
            const isShowingStandings = !standingsEl.classList.contains('hidden');
            teamList.classList.toggle('hidden', !isShowingStandings);
            standingsEl.classList.toggle('hidden', isShowingStandings);
            btn.textContent = isShowingStandings ? '📊' : '👥';
            btn.title = isShowingStandings ? 'Xem bảng xếp hạng' : 'Xem danh sách đội';
        });
    });
}

// ========== POPULATE TEAM FILTER ==========
function populateTeamFilter() {
    const sel = document.getElementById('filterTeam');
    const allTeams = Object.values(GROUPS).flat().sort();
    allTeams.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t; opt.textContent = t;
        sel.appendChild(opt);
    });
}

// ========== RENDER SCHEDULE (US-03 favorites filter + US-05 calendar + US-06 share) ==========
function renderSchedule() {
    const list = document.getElementById('scheduleList');
    const stageFilter = document.getElementById('filterStage').value;
    const groupFilter = document.getElementById('filterGroup').value;
    const teamFilter = document.getElementById('filterTeam').value;
    const favs = getFavorites();

    let filtered = ALL_MATCHES.filter(m => {
        if (stageFilter !== 'all' && m.stage !== stageFilter) return false;
        if (groupFilter !== 'all' && m.group !== groupFilter) return false;
        if (teamFilter !== 'all' && m.home !== teamFilter && m.away !== teamFilter) return false;
        if (favoritesFilterActive && favs.length > 0) {
            if (!favs.includes(m.home) && !favs.includes(m.away)) return false;
        }
        return true;
    });

    if (filtered.length === 0) {
        list.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><p>Không tìm thấy trận đấu phù hợp.</p></div>`;
        return;
    }

    const byDate = {};
    filtered.forEach(m => {
        const key = m.date.toISOString().split('T')[0];
        if (!byDate[key]) byDate[key] = [];
        byDate[key].push(m);
    });

    const stageNames = { group:"Vòng bảng", round32:"Vòng 32", round16:"Vòng 16", quarter:"Tứ kết", semi:"Bán kết", third:"Tranh hạng 3", final:"Chung kết" };

    list.innerHTML = Object.entries(byDate).map(([dateKey, matches]) => `
        <div class="schedule-day">
            <div class="day-header">
                <span class="day-date">${formatDate(new Date(dateKey))}</span>
                <span class="day-count">${matches.length} trận</span>
            </div>
            <div class="day-matches">
                ${matches.map((m, idx) => `
                    <div class="match-card ${favs.includes(m.home) || favs.includes(m.away) ? 'match-fav' : ''}">
                        <div class="match-team home">
                            <span class="team-flag">${getFlag(m.home, 30)}</span>
                            <span class="team-name" onclick="showTeamProfile('${m.home}')" style="cursor: pointer;">${m.home}</span>
                        </div>
                        <div class="match-center">
                            <div class="match-time">${m.time}</div>
                            <div class="match-info">(Giờ VN)</div>
                            ${m.group ? `<div class="match-group-tag">Bảng ${m.group}</div>` : `<div class="match-group-tag">${stageNames[m.stage]||''}</div>`}
                            <div class="match-venue">📍 ${m.venue}</div>
                        </div>
                        <div class="match-team away">
                            <span class="team-flag">${getFlag(m.away, 30)}</span>
                            <span class="team-name" onclick="showTeamProfile('${m.away}')" style="cursor: pointer;">${m.away}</span>
                        </div>
                        <div class="match-actions">
                            <button class="action-btn" onclick="downloadICS(ALL_MATCHES[${ALL_MATCHES.indexOf(m)}])" title="Thêm vào Calendar">📅</button>
                            <button class="action-btn" onclick="shareMatch(ALL_MATCHES[${ALL_MATCHES.indexOf(m)}])" title="Chia sẻ">🔗</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// ========== RENDER KNOCKOUT ==========
function renderKnockout() {
    const container = document.getElementById('knockoutBracket');
    const stageNames = { round32:"Vòng 32 Đội", round16:"Vòng 16 Đội", quarter:"Tứ Kết", semi:"Bán Kết", third:"Tranh Hạng Ba", final:"Chung Kết 🏆" };
    const stages = ["round32","round16","quarter","semi","third","final"];
    const stageIcons = { round32:"⚡", round16:"🔥", quarter:"💎", semi:"🌟", third:"🥉", final:"🏆" };

    container.innerHTML = stages.map(stage => {
        const matches = KNOCKOUT_MATCHES.filter(m => m.stage === stage);
        if (!matches.length) return '';
        return `
            <div class="knockout-round">
                <h3 class="round-title">${stageIcons[stage]} ${stageNames[stage]}</h3>
                <div class="round-matches">
                    ${matches.map(m => `
                        <div class="knockout-card ${stage==='final'?'final-card':''}">
                            <div class="knockout-header">
                                <span class="knockout-match-num">Trận #${m.num}</span>
                                <span class="knockout-date">${formatDate(m.date)} • ${m.time}</span>
                            </div>
                            <div class="knockout-teams">
                                <div class="knockout-team">
                                    <span class="team-flag">${getFlag(m.home, 24)}</span>
                                    <span class="team-name" onclick="showTeamProfile('${m.home}')" style="cursor: pointer;">${m.home}</span>
                                </div>
                                <div class="knockout-vs">VS</div>
                                <div class="knockout-team">
                                    <span class="team-flag">${getFlag(m.away, 24)}</span>
                                    <span class="team-name" onclick="showTeamProfile('${m.away}')" style="cursor: pointer;">${m.away}</span>
                                </div>
                            </div>
                            <div class="knockout-venue">📍 ${m.venue}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

// ========== RENDER VENUES ==========
function renderVenues() {
    const grid = document.getElementById('venuesGrid');
    const countryFlags = { "USA": getFlagImg("United States", 16), "Mexico": getFlagImg("Mexico", 16), "Canada": getFlagImg("Canada", 16) };
    grid.innerHTML = VENUES.map(v => `
        <div class="venue-card">
            <div class="venue-img">${v.emoji}</div>
            <div class="venue-info">
                <div class="venue-city">${v.city}</div>
                <div class="venue-name">${v.name}</div>
                <div class="venue-meta">
                    <span class="venue-tag venue-country">${countryFlags[v.country]||''} ${v.country}</span>
                    <span class="venue-tag">🪑 ${v.cap}</span>
                    <span class="venue-tag">⚽ ${v.matches} trận</span>
                </div>
            </div>
        </div>
    `).join('');
}

// ========== US-09: GLOBAL SEARCH (Fuse.js) ==========
function initSearch() {
    const input = document.getElementById('globalSearchInput');
    const dropdown = document.getElementById('searchResults');
    if (!input || !dropdown) return;

    // Prepare data for Fuse
    const teamsData = Object.keys(FLAG_CODES).map(name => ({ type: 'team', name, conf: CONF[name] }));
    const fuseTeams = new Fuse(teamsData, { keys: ['name', 'conf'], threshold: 0.3 });
    
    const fuseMatches = new Fuse(ALL_MATCHES, { keys: ['home', 'away', 'venue'], threshold: 0.3 });
    const fuseVenues = new Fuse(VENUES, { keys: ['name', 'city'], threshold: 0.3 });

    let debounceTimer;

    input.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const q = e.target.value.trim();
            if (q.length < 2) {
                dropdown.style.display = 'none';
                return;
            }

            const resTeams = fuseTeams.search(q).slice(0, 3).map(r => r.item);
            const resMatches = fuseMatches.search(q).slice(0, 3).map(r => r.item);
            const resVenues = fuseVenues.search(q).slice(0, 3).map(r => r.item);

            if (!resTeams.length && !resMatches.length && !resVenues.length) {
                dropdown.innerHTML = '<div class="search-result-item"><div class="search-result-text"><div class="search-result-title">Không tìm thấy kết quả</div></div></div>';
                dropdown.style.display = 'block';
                return;
            }

            let html = '';
            if (resTeams.length) {
                html += '<div class="search-results-group"><div class="search-group-title">Đội tuyển</div>';
                resTeams.forEach(t => {
                    html += `
                        <div class="search-result-item" onclick="document.getElementById('globalSearchInput').value=''; document.getElementById('searchResults').style.display='none'; showTeamProfile('${t.name}');">
                            <div class="search-result-icon">🏳️</div>
                            <div class="search-result-text">
                                <div class="search-result-title">${t.name}</div>
                                <div class="search-result-desc">${t.conf}</div>
                            </div>
                        </div>
                    `;
                });
                html += '</div>';
            }

            if (resMatches.length) {
                html += '<div class="search-results-group"><div class="search-group-title">Trận đấu</div>';
                resMatches.forEach(m => {
                    html += `
                        <div class="search-result-item" onclick="document.getElementById('tab-schedule').click(); document.getElementById('globalSearchInput').value=''; document.getElementById('searchResults').style.display='none';">
                            <div class="search-result-icon">⚽</div>
                            <div class="search-result-text">
                                <div class="search-result-title">${m.home} vs ${m.away}</div>
                                <div class="search-result-desc">${formatDateShort(m.date)} • ${m.venue}</div>
                            </div>
                        </div>
                    `;
                });
                html += '</div>';
            }

            if (resVenues.length) {
                html += '<div class="search-results-group"><div class="search-group-title">Sân vận động</div>';
                resVenues.forEach(v => {
                    html += `
                        <div class="search-result-item" onclick="document.getElementById('tab-venues').click(); document.getElementById('globalSearchInput').value=''; document.getElementById('searchResults').style.display='none';">
                            <div class="search-result-icon">🏟️</div>
                            <div class="search-result-text">
                                <div class="search-result-title">${v.name}</div>
                                <div class="search-result-desc">${v.city}</div>
                            </div>
                        </div>
                    `;
                });
                html += '</div>';
            }

            dropdown.innerHTML = html;
            dropdown.style.display = 'block';

        }, 200);
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            dropdown.style.display = 'none';
        }
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
}

// ========== US-10: TEAM PROFILE MODAL ==========
function showTeamProfile(teamName) {
    const teamInfo = TEAMS_DATA.find(t => t.name === teamName);
    if (!teamInfo) return;

    const matches = ALL_MATCHES.filter(m => m.home === teamName || m.away === teamName);
    const isFav = favorites.includes(teamName);

    const matchHtml = matches.map(m => `
        <div class="profile-match-card">
            <div class="profile-match-teams">
                ${m.home === teamName ? `<strong>${m.home}</strong> vs ${m.away}` : `${m.home} vs <strong>${m.away}</strong>`}
            </div>
            <div class="profile-match-time">
                ${formatDateShort(m.date)} ${m.time}<br>
                ${m.venue}
            </div>
        </div>
    `).join('');

    const html = `
        <div class="team-profile-header">
            <div class="team-profile-flag">
                <img src="${getFlagUrl(FLAG_CODES[teamName])}" alt="${teamName}" width="120" loading="lazy">
            </div>
            <div class="team-profile-name">${teamName}</div>
            <div class="team-profile-meta">
                <span class="team-profile-tag">${CONF[teamName] || ''}</span>
                <span class="team-profile-tag">Bảng ${teamInfo.group}</span>
            </div>
        </div>
        
        <div class="team-profile-info">
            <div class="profile-info-row">
                <span class="profile-info-label">Huấn luyện viên</span>
                <span class="profile-info-value">${teamInfo.coach || 'Đang cập nhật'}</span>
            </div>
            <div class="profile-info-row">
                <span class="profile-info-label">Biệt danh</span>
                <span class="profile-info-value">${teamInfo.nickname || 'Đang cập nhật'}</span>
            </div>
            <div class="profile-info-row">
                <span class="profile-info-label">Xếp hạng FIFA</span>
                <span class="profile-info-value">Hạng ${teamInfo.ranking || '-'}</span>
            </div>
            <div class="profile-info-row">
                <span class="profile-info-label">Thành tích tốt nhất</span>
                <span class="profile-info-value">${teamInfo.best_finish || 'Đang cập nhật'}</span>
            </div>
        </div>

        <div class="team-profile-matches">
            <h4>Lịch thi đấu (${matches.length} trận)</h4>
            ${matchHtml}
        </div>

        <div class="team-profile-actions">
            <button class="btn ${isFav ? 'btn-outline' : ''}" onclick="toggleFavorite(event, '${teamName}'); showTeamProfile('${teamName}')">
                ${isFav ? '❌ Bỏ Yêu Thích' : '⭐ Yêu Thích Đội Này'}
            </button>
        </div>
    `;

    document.getElementById('teamModalBody').innerHTML = html;
    document.getElementById('teamModal').classList.add('active');
}

document.getElementById('closeTeamModal').addEventListener('click', () => {
    document.getElementById('teamModal').classList.remove('active');
});

document.getElementById('teamModal').addEventListener('click', (e) => {
    if (e.target.id === 'teamModal') {
        document.getElementById('teamModal').classList.remove('active');
    }
});
