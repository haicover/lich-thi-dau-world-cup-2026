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
    initLivePolling();        // US-18
    initThemeToggle();        // US-28
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

// ========== US-02 + US-23: SERVICE WORKER REGISTRATION ==========
let swRegistration = null;

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => {
                swRegistration = reg;
                console.log('[SW] Registered:', reg.scope);

                // US-23: Check for waiting worker (update available)
                if (reg.waiting) {
                    showSwUpdateBanner();
                }

                // US-23: Listen for new SW installing
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                showSwUpdateBanner();
                            }
                        });
                    }
                });
            })
            .catch(err => console.warn('[SW] Registration failed:', err));

        // US-23: Reload page when new SW takes over
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
                refreshing = true;
                window.location.reload();
            }
        });
    }
}

function showSwUpdateBanner() {
    const bar = document.getElementById('swUpdateBar');
    if (bar) bar.classList.add('visible');
}

window.applySwUpdate = function() {
    if (swRegistration && swRegistration.waiting) {
        swRegistration.waiting.postMessage('skipWaiting');
    }
};

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
            btns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false'); // US-24
            });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true'); // US-24
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            const tab = btn.dataset.tab;
            document.getElementById(`content-${tab}`).classList.add('active');
            const fb = document.getElementById('filterBar');
            fb.style.display = tab === 'schedule' ? 'block' : 'none';
        });

        // US-24: Arrow key navigation between tabs
        btn.addEventListener('keydown', (e) => {
            const tabs = [...btns];
            const idx = tabs.indexOf(btn);
            let target = null;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                target = tabs[(idx + 1) % tabs.length];
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                target = tabs[(idx - 1 + tabs.length) % tabs.length];
            } else if (e.key === 'Home') {
                e.preventDefault();
                target = tabs[0];
            } else if (e.key === 'End') {
                e.preventDefault();
                target = tabs[tabs.length - 1];
            }
            if (target) {
                target.focus();
                target.click();
            }
        });
    });
    document.getElementById('filterStage').addEventListener('change', renderSchedule);
    document.getElementById('filterGroup').addEventListener('change', renderSchedule);
    document.getElementById('filterTeam').addEventListener('change', renderSchedule);

    // View Toggles
    const btnList = document.getElementById('btnListView');
    const btnCal = document.getElementById('btnCalendarView');
    const listEl = document.getElementById('scheduleList');
    const calEl = document.getElementById('scheduleCalendar');

    if (btnList && btnCal) {
        btnList.addEventListener('click', () => {
            btnList.classList.add('active');
            btnCal.classList.remove('active');
            listEl.style.display = 'block';
            calEl.style.display = 'none';
        });
        btnCal.addEventListener('click', () => {
            btnCal.classList.add('active');
            btnList.classList.remove('active');
            calEl.style.display = 'block';
            listEl.style.display = 'none';
        });
    }
}

// ========== SCROLL TOP ==========
function initScrollTop() {
    const btn = document.getElementById('scrollTop');
    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 400);
    });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ========== US-25: PRINT SCHEDULE ==========
window.printSchedule = function() {
    // Temporarily show all tab content for printing
    const tabs = document.querySelectorAll('.tab-content');
    const wasActive = [];
    tabs.forEach(t => {
        wasActive.push(t.classList.contains('active'));
        t.classList.add('active');
    });

    // Small delay to let browser paint
    requestAnimationFrame(() => {
        window.print();

        // Restore tab state after print dialog closes
        setTimeout(() => {
            tabs.forEach((t, i) => {
                if (!wasActive[i]) t.classList.remove('active');
            });
        }, 500);
    });
};

// ========== HELPERS ==========
function getFlag(name, size) { return getFlagImg(name, size); }
function formatDate(d) {
    const days = ['CN','T2','T3','T4','T5','T6','T7'];
    return `${days[d.getDay()]}, ${d.getDate()}/${d.getMonth()+1}/2026`;
}
function formatDateShort(d) { return `${d.getDate()}/${d.getMonth()+1}`; }

// ========== US-04 & US-21: STANDINGS DATA ==========
function getStandingsForGroup(groupName) {
    const teams = GROUPS[groupName];
    
    const stats = {};
    teams.forEach(t => {
        stats[t] = { team: t, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
    });

    ALL_MATCHES.forEach(m => {
        if (m.stage === 'group' && m.group === groupName && m.score && m.score !== 'vs') {
            const parts = m.score.split('-');
            if (parts.length === 2) {
                const homeGoals = parseInt(parts[0].trim());
                const awayGoals = parseInt(parts[1].trim());
                if (!isNaN(homeGoals) && !isNaN(awayGoals)) {
                    const home = stats[m.home];
                    const away = stats[m.away];
                    
                    if (home && away) {
                        home.played++; away.played++;
                        home.gf += homeGoals; home.ga += awayGoals;
                        away.gf += awayGoals; away.ga += homeGoals;
                        
                        if (homeGoals > awayGoals) {
                            home.wins++; home.pts += 3;
                            away.losses++;
                        } else if (homeGoals < awayGoals) {
                            away.wins++; away.pts += 3;
                            home.losses++;
                        } else {
                            home.draws++; home.pts += 1;
                            away.draws++; away.pts += 1;
                        }
                    }
                }
            }
        }
    });

    const standings = Object.values(stats).map(s => {
        s.gd = s.gf - s.ga;
        return s;
    });

    standings.sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.gf - a.gf;
    });

    standings.forEach((s, i) => s.pos = i + 1);
    return standings;
}

window.updateLiveStandings = function(groupName) {
    const tbody = document.querySelector(`#standings-${groupName} tbody`);
    if (!tbody) return;
    
    // Lưu lại hạng cũ
    const oldRanks = {};
    Array.from(tbody.querySelectorAll('tr')).forEach(tr => {
        const teamNameEl = tr.querySelector('.standings-team span');
        if (teamNameEl) {
            const teamName = teamNameEl.textContent.trim();
            const pos = parseInt(tr.querySelector('td').textContent);
            oldRanks[teamName] = pos;
        }
    });

    const standings = getStandingsForGroup(groupName);
    
    tbody.innerHTML = standings.map((s, i) => {
        const oldPos = oldRanks[s.team];
        let rankChangeHtml = '';
        if (oldPos && s.pos < oldPos) rankChangeHtml = '<span style="color:var(--green);font-size:0.7rem;margin-left:4px">▲</span>';
        else if (oldPos && s.pos > oldPos) rankChangeHtml = '<span style="color:var(--red);font-size:0.7rem;margin-left:4px">▼</span>';
        
        return `
            <tr class="${i < 2 ? 'pos-qualified' : i === 2 ? 'pos-possible' : ''}" style="transition: background-color 1s;">
                <td>${s.pos}${rankChangeHtml}</td>
                <td class="standings-team">${getFlag(s.team, 20)} <span onclick="showTeamProfile('${s.team}')" style="cursor: pointer;">${s.team}</span></td>
                <td>${s.played}</td><td>${s.wins}</td><td>${s.draws}</td><td>${s.losses}</td>
                <td>${s.gf}</td><td>${s.ga}</td><td>${s.gd}</td>
                <td class="standings-pts">${s.pts}</td>
            </tr>
        `;
    }).join('');

    // Highlight card
    const card = document.getElementById(`standings-${groupName}`);
    if (card && !card.classList.contains('hidden')) {
        card.closest('.group-card').style.boxShadow = '0 0 20px rgba(34, 197, 94, 0.4)';
        setTimeout(() => card.closest('.group-card').style.boxShadow = '', 2000);
    }
};

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
                    <div class="match-card ${favs.includes(m.home) || favs.includes(m.away) ? 'match-fav' : ''}" data-home="${m.home}" data-away="${m.away}">
                        <div class="match-team home">
                            <span class="team-flag">${getFlag(m.home, 30)}</span>
                            <span class="team-name" onclick="showTeamProfile('${m.home}')" style="cursor: pointer;">${m.home}</span>
                        </div>
                        <div class="match-center">
                            <div class="match-time ${m.score ? 'live-score-text' : ''}">${m.score || m.time}</div>
                            <div class="match-info">${m.isLive ? '<span class="live-badge">🔴 LIVE</span>' : (m.score ? '(Đã kết thúc)' : '(Giờ VN)')}</div>
                            ${m.group ? `<div class="match-group-tag">Bảng ${m.group}</div>` : `<div class="match-group-tag">${stageNames[m.stage]||''}</div>`}
                            <div class="match-venue">📍 ${m.venue}</div>
                        </div>
                        <div class="match-team away">
                            <span class="team-flag">${getFlag(m.away, 30)}</span>
                            <span class="team-name" onclick="showTeamProfile('${m.away}')" style="cursor: pointer;">${m.away}</span>
                        </div>
                        <div class="match-actions">
                            <button class="action-btn" onclick="showMatchDetails('${m.home}', '${m.away}')" title="Chi tiết trận đấu (Timeline & Stats)">📊 Stats</button>
                            <button class="action-btn btn-h2h" onclick="showH2H('${m.home}', '${m.away}')" title="Lịch sử đối đầu">⚔️ H2H</button>
                            <button class="action-btn" onclick="downloadICS(ALL_MATCHES[${ALL_MATCHES.indexOf(m)}])" title="Thêm vào Calendar">📅</button>
                            <button class="action-btn" onclick="shareMatch(ALL_MATCHES[${ALL_MATCHES.indexOf(m)}])" title="Chia sẻ">🔗</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');

    renderCalendar(filtered, favs, byDate);
}

let CURRENT_FILTERED_MATCHES = [];

// ========== RENDER CALENDAR (US-12) ==========
function renderCalendar(filtered, favs, byDate) {
    CURRENT_FILTERED_MATCHES = filtered;
    const calContainer = document.getElementById('scheduleCalendar');
    if (!calContainer) return;

    // June & July 2026
    const months = [
        { year: 2026, month: 5, name: 'Tháng 6, 2026' }, // 0-indexed month
        { year: 2026, month: 6, name: 'Tháng 7, 2026' }
    ];

    let html = '';
    const todayStr = new Date().toISOString().split('T')[0];

    months.forEach(mo => {
        html += `<div class="calendar-month-wrapper">
            <div class="calendar-header"><h3>${mo.name}</h3></div>
            <div class="calendar-grid">
                <div class="calendar-day-header">CN</div>
                <div class="calendar-day-header">T2</div>
                <div class="calendar-day-header">T3</div>
                <div class="calendar-day-header">T4</div>
                <div class="calendar-day-header">T5</div>
                <div class="calendar-day-header">T6</div>
                <div class="calendar-day-header">T7</div>`;

        const firstDay = new Date(mo.year, mo.month, 1).getDay(); // 0 = Sun
        const daysInMonth = new Date(mo.year, mo.month + 1, 0).getDate();

        // Padding before day 1
        for (let i = 0; i < firstDay; i++) {
            html += `<div class="calendar-day empty"></div>`;
        }

        // Days
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${mo.year}-${String(mo.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const matchesForDay = byDate[dateStr] || [];
            
            let classes = ['calendar-day'];
            if (dateStr === todayStr) classes.push('today');
            if (matchesForDay.length > 0) classes.push('has-matches');

            let badgeHtml = '';
            if (matchesForDay.length > 0) {
                badgeHtml = `<div class="calendar-badges"><span class="match-badge">${matchesForDay.length} trận</span></div>`;
            }

            html += `
                <div class="${classes.join(' ')}" onclick="showCalendarDayMatches('${dateStr}')">
                    <div class="calendar-date-num">${d}</div>
                    ${badgeHtml}
                </div>
            `;
        }

        // Padding after last day to complete grid (optional, but good for borders)
        const totalCells = firstDay + daysInMonth;
        const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        for (let i = 0; i < remainingCells; i++) {
            html += `<div class="calendar-day empty"></div>`;
        }

        html += `</div></div>`;
    });

    html += `<div id="calendarDayDetails" class="calendar-day-details" style="display:none;"></div>`;
    calContainer.innerHTML = html;
}

// Global matches lookup for calendar
function showCalendarDayMatches(dateStr) {
    const detailsContainer = document.getElementById('calendarDayDetails');
    const dayMatches = CURRENT_FILTERED_MATCHES.filter(m => m.date.toISOString().split('T')[0] === dateStr);
    
    if (dayMatches.length === 0) {
        detailsContainer.style.display = 'block';
        detailsContainer.innerHTML = `<h4>Lịch thi đấu ngày ${formatDateShort(new Date(dateStr))}</h4><p style="color:var(--text-muted)">Không có trận đấu nào.</p>`;
        return;
    }

    const stageNames = { group:"Vòng bảng", round32:"Vòng 32", round16:"Vòng 16", quarter:"Tứ kết", semi:"Bán kết", third:"Tranh hạng 3", final:"Chung kết" };
    const favs = getFavorites();

    let html = `<h4>Lịch thi đấu ngày ${formatDateShort(new Date(dateStr))}</h4>`;
    html += `<div class="day-matches">` + dayMatches.map(m => `
        <div class="match-card ${favs.includes(m.home) || favs.includes(m.away) ? 'match-fav' : ''}" data-home="${m.home}" data-away="${m.away}">
            <div class="match-team home">
                <span class="team-flag">${getFlag(m.home, 30)}</span>
                <span class="team-name" onclick="showTeamProfile('${m.home}')" style="cursor: pointer;">${m.home}</span>
            </div>
            <div class="match-center">
                <div class="match-time ${m.score ? 'live-score-text' : ''}">${m.score || m.time}</div>
                <div class="match-info">${m.isLive ? '<span class="live-badge">🔴 LIVE</span>' : (m.score ? '(Đã kết thúc)' : '(Giờ VN)')}</div>
                ${m.group ? `<div class="match-group-tag">Bảng ${m.group}</div>` : `<div class="match-group-tag">${stageNames[m.stage]||''}</div>`}
                <div class="match-venue">📍 ${m.venue}</div>
            </div>
            <div class="match-team away">
                <span class="team-flag">${getFlag(m.away, 30)}</span>
                <span class="team-name" onclick="showTeamProfile('${m.away}')" style="cursor: pointer;">${m.away}</span>
            </div>
            <div class="match-actions" style="margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px;">
                <button class="action-btn" onclick="showMatchDetails('${m.home}', '${m.away}')" title="Chi tiết trận đấu (Timeline & Stats)">📊 Stats</button>
                <button class="action-btn btn-h2h" onclick="showH2H('${m.home}', '${m.away}')" title="Lịch sử đối đầu">⚔️ H2H</button>
                <button class="action-btn" onclick="downloadICS(ALL_MATCHES[${ALL_MATCHES.indexOf(m)}])" title="Thêm vào Calendar">📅</button>
                <button class="action-btn" onclick="shareMatch(ALL_MATCHES[${ALL_MATCHES.indexOf(m)}])" title="Chia sẻ">🔗</button>
            </div>
        </div>
    `).join('') + `</div>`;

    detailsContainer.innerHTML = html;
    detailsContainer.style.display = 'block';
    detailsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ========== RENDER KNOCKOUT ==========
function renderKnockout() {
    const container = document.getElementById('knockoutBracket');
    const stageNames = { round32:"Vòng 32 Đội", round16:"Vòng 16 Đội", quarter:"Tứ Kết", semi:"Bán Kết", third:"Hạng Ba", final:"Chung Kết" };
    const stages = ["round32","round16","quarter","semi","final", "third"];
    const stageIcons = { round32:"⚡", round16:"🔥", quarter:"💎", semi:"🌟", third:"🥉", final:"🏆" };

    let html = `<div class="bracket-wrapper">
                    <div class="bracket-scroll-container">`;

    stages.forEach(stage => {
        const matches = KNOCKOUT_MATCHES.filter(m => m.stage === stage);
        if (!matches.length) return;
        
        html += `
            <div class="bracket-column bracket-${stage}">
                <div class="bracket-column-header">
                    <h3>${stageIcons[stage]} ${stageNames[stage]}</h3>
                </div>
                <div class="bracket-matches">
                    ${matches.map(m => `
                        <div class="bracket-match-card ${stage==='final'?'final-card':''}" data-home="${m.home}" data-away="${m.away}" onclick="showMatchDetails('${m.home}', '${m.away}')" style="cursor:pointer;" title="Xem chi tiết trận đấu">
                            ${m.isLive ? '<div class="live-badge-bracket">🔴 LIVE</div>' : ''}
                            <div class="b-match-num">Trận #${m.num}</div>
                            <div class="b-match-teams">
                                <div class="b-team">
                                    <span class="b-team-flag">${getFlag(m.home, 20)}</span>
                                    <span class="b-team-name" onclick="showTeamProfile('${m.home}')">${m.home}</span>
                                </div>
                                <div class="b-team">
                                    <span class="b-team-flag">${getFlag(m.away, 20)}</span>
                                    <span class="b-team-name" onclick="showTeamProfile('${m.away}')">${m.away}</span>
                                </div>
                            </div>
                            <div class="b-match-date ${m.score ? 'live-score-text' : ''}">${m.score || (formatDateShort(m.date) + ' ' + m.time)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });

    html += `</div></div>`;
    
    // Add instruction for users
    html = `<div class="bracket-instruction">👈 Vuốt ngang để xem toàn bộ nhánh đấu 👉</div>` + html;

    container.innerHTML = html;
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
    openModal('teamModal');
}

document.getElementById('closeTeamModal').addEventListener('click', () => {
    closeModal('teamModal');
});

document.getElementById('teamModal').addEventListener('click', (e) => {
    if (e.target.id === 'teamModal') {
        closeModal('teamModal');
    }
});

// ========== US-15: H2H MODAL LOGIC ==========
function generateMockH2H(teamA, teamB) {
    // Generate some stable fake data based on team names length
    const hash = teamA.length + teamB.length;
    
    // Thắng / Hòa / Thua của Team A
    const wins = hash % 4;
    const draws = (hash + 1) % 3;
    const losses = (hash + 2) % 4;
    
    const matches = [];
    let currentYear = 2024;
    for (let i = 0; i < (wins + draws + losses); i++) {
        currentYear -= (1 + (hash % 2));
        
        // Random kết quả
        let scoreA, scoreB;
        if (i < wins) { scoreA = 2 + (i%2); scoreB = i%2; }
        else if (i < wins + draws) { scoreA = 1 + (i%2); scoreB = scoreA; }
        else { scoreA = i%2; scoreB = 2 + (i%2); }
        
        matches.push({
            year: currentYear,
            tournament: i % 2 === 0 ? 'Giao hữu quốc tế' : 'World Cup',
            scoreA, scoreB
        });
    }
    
    return { wins, draws, losses, matches };
}

window.showH2H = function(teamA, teamB) {
    const modal = document.getElementById('h2hModal');
    const body = document.getElementById('h2hModalBody');
    
    const data = generateMockH2H(teamA, teamB);
    const totalMatches = data.wins + data.draws + data.losses;

    let html = `
        <div class="h2h-header">
            <h3>Lịch Sử Đối Đầu</h3>
            <p style="color: var(--text-muted); font-size: 0.8rem; margin-top: 5px;">(Dữ liệu mô phỏng tham khảo)</p>
        </div>
        <div class="h2h-matchup">
            <div class="h2h-team">
                ${getFlag(teamA, 40)}
                <div class="h2h-team-name">${teamA}</div>
                <div class="h2h-wins-count">${data.wins} Thắng</div>
            </div>
            <div class="h2h-center">
                <div class="h2h-vs">VS</div>
                <div class="h2h-draws">${data.draws} Hòa</div>
            </div>
            <div class="h2h-team">
                ${getFlag(teamB, 40)}
                <div class="h2h-team-name">${teamB}</div>
                <div class="h2h-wins-count">${data.losses} Thắng</div>
            </div>
        </div>
    `;

    if (totalMatches === 0) {
        html += `<div style="text-align:center; padding: 2rem; color: var(--text-muted);">Hai đội chưa từng gặp nhau trong quá khứ.</div>`;
    } else {
        html += `<div class="h2h-history-list">
            <h4 style="margin-bottom: 1rem; color: var(--gold); border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px;">Các trận gần nhất</h4>
        `;
        data.matches.forEach(m => {
            let resultClass = '';
            if (m.scoreA > m.scoreB) resultClass = 'h2h-win-a';
            else if (m.scoreA < m.scoreB) resultClass = 'h2h-win-b';
            else resultClass = 'h2h-draw';

            html += `
                <div class="h2h-match-item">
                    <div class="h2h-match-meta">${m.year} • ${m.tournament}</div>
                    <div class="h2h-match-score ${resultClass}">
                        <span>${teamA}</span>
                        <strong>${m.scoreA} - ${m.scoreB}</strong>
                        <span>${teamB}</span>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }

    body.innerHTML = html;
    openModal('h2hModal');
}

// Close H2H Modal
document.getElementById('closeH2hModal').addEventListener('click', () => {
    closeModal('h2hModal');
});

// Click outside H2H modal
document.getElementById('h2hModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('h2hModal')) {
        closeModal('h2hModal');
    }
});

// ========== US-18: LIVE POLLING ==========
let livePollingInterval;

function initLivePolling() {
    fetchLiveScores();
    // Fetch every 60 seconds
    livePollingInterval = setInterval(fetchLiveScores, 60000);
}

async function fetchLiveScores() {
    // US-23: Skip polling when offline — giữ dữ liệu cũ, không hiện lỗi
    if (!navigator.onLine) {
        console.log('[Live] Offline — bỏ qua polling');
        return;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const res = await fetch('/api/live', { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await res.json();
        
        let liveMatches = data.matches || [];
        
        // Mock data logic if no real matches and we are in dev/testing
        if (liveMatches.length === 0 && data.note) {
             const mockMatch = ALL_MATCHES.find(m => m.stage === 'group' && m.group === 'A');
             if (mockMatch) {
                 // Giả lập trận đấu ngẫu nhiên
                 liveMatches.push({
                     homeTeam: { name: mockMatch.home },
                     awayTeam: { name: mockMatch.away },
                     score: { fullTime: { home: Math.floor(Math.random()*4), away: Math.floor(Math.random()*4) } },
                     status: 'IN_PLAY'
                 });
             }
        }
        
        liveMatches.forEach(lm => {
            const target = ALL_MATCHES.find(m => 
                (lm.homeTeam.name.includes(m.home) || m.home.includes(lm.homeTeam.name)) && 
                (lm.awayTeam.name.includes(m.away) || m.away.includes(lm.awayTeam.name))
            );
            
            if (target) {
                // Check score structure
                const homeScore = lm.score?.fullTime?.home ?? lm.score?.home ?? 0;
                const awayScore = lm.score?.fullTime?.away ?? lm.score?.away ?? 0;
                const newScore = `${homeScore} - ${awayScore}`;
                const isLive = lm.status === 'IN_PLAY' || lm.status === 'PAUSED';
                
                const oldScoreStr = target.score;

                if (target.score !== newScore || target.isLive !== isLive) {
                    target.score = newScore;
                    target.isLive = isLive;
                    updateMatchDOM(target.home, target.away, newScore, isLive);

                    // Update Live Standings (US-21)
                    if (target.stage === 'group' && target.group) {
                        updateLiveStandings(target.group);
                    }

                    // ========== US-19: GOAL NOTIFICATIONS ==========
                    if (oldScoreStr && oldScoreStr.includes('-')) {
                        const [oldH, oldA] = oldScoreStr.split('-').map(s => parseInt(s.trim()));
                        if (!isNaN(oldH) && !isNaN(oldA)) {
                            if (homeScore > oldH) {
                                showGoalNotification(target.home, target.home, target.away, newScore);
                            } else if (awayScore > oldA) {
                                showGoalNotification(target.away, target.home, target.away, newScore);
                            }
                        }
                    }
                }
            }
        });
        
    } catch(err) {
        console.error("Live Polling Error", err);
    }
}

function showGoalNotification(scoringTeam, home, away, scoreStr) {
    const banner = document.createElement('div');
    banner.className = 'goal-notification';
    banner.innerHTML = `
        <div class="goal-icon">⚽</div>
        <div class="goal-text">
            <strong>VÀOOO! ${scoringTeam}</strong>
            <span>${home} <b style="color:var(--gold)">${scoreStr}</b> ${away}</span>
        </div>
    `;
    document.body.appendChild(banner);

    // Thử phát âm thanh (Browser có thể block nếu user chưa tương tác)
    try {
        const audio = new Audio('https://actions.google.com/sounds/v1/crowds/crowd_cheer.ogg');
        audio.volume = 0.6;
        audio.play().catch(e => console.log('Autoplay prevented:', e));
    } catch(err) {}

    // Tự động ẩn sau 5 giây
    setTimeout(() => {
        banner.classList.add('goal-fade-out');
        setTimeout(() => banner.remove(), 500);
    }, 5000);
}

function updateMatchDOM(home, away, score, isLive) {
    const cards = document.querySelectorAll(`.match-card[data-home="${home}"][data-away="${away}"], .bracket-match-card[data-home="${home}"][data-away="${away}"]`);
    
    cards.forEach(card => {
        const timeEl = card.querySelector('.match-time, .b-match-date');
        if (timeEl) {
            timeEl.textContent = score;
            timeEl.classList.add('live-score-text');
        }
        
        const infoEl = card.querySelector('.match-info');
        if (infoEl) {
            if (isLive) {
                infoEl.innerHTML = '<span class="live-badge">🔴 LIVE</span>';
            } else {
                infoEl.innerHTML = '(Đã kết thúc)';
            }
        } else if (card.classList.contains('bracket-match-card')) {
            // Update bracket badge
            let badge = card.querySelector('.live-badge-bracket');
            if (isLive && !badge) {
                card.insertAdjacentHTML('afterbegin', '<div class="live-badge-bracket">🔴 LIVE</div>');
            } else if (!isLive && badge) {
                badge.remove();
            }
        }
    });
}

// ========== US-20: MATCH DETAILS & TIMELINE MODAL ==========

window.showMatchDetails = function(home, away) {
    const modal = document.getElementById('matchDetailsModal');
    const body = document.getElementById('matchDetailsModalBody');
    
    const match = ALL_MATCHES.find(m => m.home === home && m.away === away);
    const scoreStr = match?.score || 'VS';
    
    // Generate Mock Stats
    const stats = {
        possession: [Math.floor(Math.random()*40 + 30), 0],
        shots: [Math.floor(Math.random()*15 + 2), Math.floor(Math.random()*15 + 2)],
        shotsOnTarget: [Math.floor(Math.random()*8 + 1), Math.floor(Math.random()*8 + 1)],
        corners: [Math.floor(Math.random()*8), Math.floor(Math.random()*8)],
        fouls: [Math.floor(Math.random()*15 + 5), Math.floor(Math.random()*15 + 5)]
    };
    stats.possession[1] = 100 - stats.possession[0];

    // Generate Mock Timeline
    const events = [];
    const eventTypes = ['goal', 'yellow-card', 'red-card', 'sub'];
    for(let i=0; i<Math.floor(Math.random()*6 + 2); i++) {
        events.push({
            minute: Math.floor(Math.random()*90 + 1),
            type: eventTypes[Math.floor(Math.random()*eventTypes.length)],
            team: Math.random() > 0.5 ? home : away,
            player: 'Cầu thủ số ' + Math.floor(Math.random()*20 + 1)
        });
    }
    events.sort((a,b) => a.minute - b.minute);

    const html = `
        <div class="md-header">
            <div class="md-team md-home">
                ${getFlag(home, 50)}
                <h4>${home}</h4>
            </div>
            <div class="md-score-board">
                <div class="md-status">${match?.isLive ? '🔴 ĐANG ĐÁ' : 'KẾT QUẢ'}</div>
                <div class="md-score ${match?.isLive ? 'live-score-text' : ''}">${scoreStr}</div>
            </div>
            <div class="md-team md-away">
                ${getFlag(away, 50)}
                <h4>${away}</h4>
            </div>
        </div>

        <div class="md-tabs">
            <button class="md-tab-btn active" onclick="switchMdTab('timeline', this)">Dòng thời gian</button>
            <button class="md-tab-btn" onclick="switchMdTab('stats', this)">Thống kê</button>
        </div>

        <div id="md-timeline" class="md-panel active">
            <div class="md-timeline-container">
                ${events.length === 0 ? '<p style="text-align:center; color:gray">Chưa có sự kiện nào</p>' : ''}
                ${events.map(e => `
                    <div class="timeline-row ${e.team === home ? 'row-left' : 'row-right'}">
                        <div class="timeline-event-box">
                            <div class="t-min">${e.minute}'</div>
                            <div class="t-icon">${getEventIcon(e.type)}</div>
                            <div class="t-desc">${e.player}</div>
                        </div>
                    </div>
                `).join('')}
                <div class="timeline-line"></div>
            </div>
        </div>

        <div id="md-stats" class="md-panel">
            <div class="md-stats-container">
                ${renderStatBar('Kiểm soát bóng (%)', stats.possession[0], stats.possession[1])}
                ${renderStatBar('Số cú sút', stats.shots[0], stats.shots[1])}
                ${renderStatBar('Sút trúng đích', stats.shotsOnTarget[0], stats.shotsOnTarget[1])}
                ${renderStatBar('Phạt góc', stats.corners[0], stats.corners[1])}
                ${renderStatBar('Phạm lỗi', stats.fouls[0], stats.fouls[1])}
            </div>
        </div>
    `;

    body.innerHTML = html;
    openModal('matchDetailsModal');
};

function getEventIcon(type) {
    if(type === 'goal') return '⚽';
    if(type === 'yellow-card') return '<div class="card-icon yellow"></div>';
    if(type === 'red-card') return '<div class="card-icon red"></div>';
    if(type === 'sub') return '🔄';
    return '•';
}

function renderStatBar(label, val1, val2) {
    const total = val1 + val2 || 1;
    const p1 = (val1 / total) * 100;
    const p2 = (val2 / total) * 100;
    return `
        <div class="stat-row">
            <div class="stat-labels">
                <span class="stat-val home-val">${val1}</span>
                <span class="stat-name">${label}</span>
                <span class="stat-val away-val">${val2}</span>
            </div>
            <div class="stat-bar-wrapper">
                <div class="stat-bar-left" style="width: ${p1}%"></div>
                <div class="stat-bar-right" style="width: ${p2}%"></div>
            </div>
        </div>
    `;
}

window.switchMdTab = function(tabId, btn) {
    document.querySelectorAll('.md-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.md-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('md-' + tabId).classList.add('active');
};

document.getElementById('closeMatchDetailsModal').addEventListener('click', () => {
    closeModal('matchDetailsModal');
});

document.getElementById('matchDetailsModal').addEventListener('click', (e) => {
    if (e.target.id === 'matchDetailsModal') {
        closeModal('matchDetailsModal');
    }
});

// ========== US-24: ACCESSIBILITY UTILITIES ==========

// Store the element that opened the modal so we can return focus
let lastFocusedElement = null;

// Open modal with focus management
function openModal(modalId) {
    lastFocusedElement = document.activeElement;
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
    // Focus the close button inside
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) setTimeout(() => closeBtn.focus(), 100);
    // Trap focus
    modal.addEventListener('keydown', trapFocusHandler);
}

// Close modal with focus restoration
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
    modal.removeEventListener('keydown', trapFocusHandler);
    // Return focus to trigger element
    if (lastFocusedElement) {
        lastFocusedElement.focus();
        lastFocusedElement = null;
    }
}

// Focus trap handler — keeps Tab cycling within the modal
function trapFocusHandler(e) {
    if (e.key === 'Escape') {
        const modal = e.currentTarget;
        closeModal(modal.id);
        return;
    }
    if (e.key !== 'Tab') return;

    const modal = e.currentTarget;
    const focusable = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
        if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
        }
    } else {
        if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }
}

// Global Escape key handler for any open modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        ['teamModal', 'h2hModal', 'matchDetailsModal'].forEach(id => {
            const modal = document.getElementById(id);
            if (modal && modal.classList.contains('active')) {
                closeModal(id);
            }
        });
    }
});

// ========== US-28: THEME TOGGLE ==========
function initThemeToggle() {
    const btn = document.getElementById('themeToggle');
    const icon = document.getElementById('themeIcon');
    if (!btn || !icon) return;

    // Check LocalStorage or System Preference
    const savedTheme = localStorage.getItem('wc2026_theme');
    let isLight = false;

    if (savedTheme === 'light') {
        isLight = true;
    } else if (savedTheme === 'dark') {
        isLight = false;
    } else {
        // No saved preference, check system
        isLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    }

    if (isLight) {
        document.documentElement.classList.add('light-theme');
        icon.textContent = '☀️';
    }

    btn.addEventListener('click', () => {
        document.documentElement.classList.toggle('light-theme');
        const isNowLight = document.documentElement.classList.contains('light-theme');
        localStorage.setItem('wc2026_theme', isNowLight ? 'light' : 'dark');
        
        // Spin animation for icon
        icon.style.transition = 'transform 0.15s ease-in';
        icon.style.transform = 'rotate(180deg) scale(0)';
        
        setTimeout(() => {
            icon.textContent = isNowLight ? '☀️' : '🌙';
            icon.style.transition = 'transform 0.15s ease-out';
            icon.style.transform = 'rotate(360deg) scale(1)';
            
            setTimeout(() => {
                icon.style.transition = '';
                icon.style.transform = ''; // reset for hover effect
            }, 150);
        }, 150);
    });
}
