// FIFA World Cup 2026 - Complete Data
const FLAG_CODES = {
    "Mexico":"mx","South Africa":"za","South Korea":"kr","Czechia":"cz",
    "Canada":"ca","Bosnia and Herzegovina":"ba","Qatar":"qa","Switzerland":"ch",
    "Brazil":"br","Morocco":"ma","Haiti":"ht","Scotland":"gb-sct",
    "United States":"us","Paraguay":"py","Australia":"au","Türkiye":"tr",
    "Germany":"de","Curaçao":"cw","Ivory Coast":"ci","Ecuador":"ec",
    "Netherlands":"nl","Japan":"jp","Sweden":"se","Tunisia":"tn",
    "Belgium":"be","Egypt":"eg","Iran":"ir","New Zealand":"nz",
    "Spain":"es","Cape Verde":"cv","Saudi Arabia":"sa","Uruguay":"uy",
    "France":"fr","Senegal":"sn","Iraq":"iq","Norway":"no",
    "Argentina":"ar","Algeria":"dz","Austria":"at","Jordan":"jo",
    "Portugal":"pt","DR Congo":"cd","Uzbekistan":"uz","Colombia":"co",
    "England":"gb-eng","Croatia":"hr","Ghana":"gh","Panama":"pa"
};

function getFlagImg(name, size) {
    size = size || 24;
    const code = FLAG_CODES[name];
    if (!code) return '<span class="team-flag-placeholder">🏳️</span>';
    return `<img src="https://flagcdn.com/w40/${code}.png" width="${size}" height="${Math.round(size*0.75)}" alt="${name}" class="team-flag-img" loading="lazy">`;
}

const CONF = {
    "Mexico":"CONCACAF","South Africa":"CAF","South Korea":"AFC","Czechia":"UEFA",
    "Canada":"CONCACAF","Bosnia and Herzegovina":"UEFA","Qatar":"AFC","Switzerland":"UEFA",
    "Brazil":"CONMEBOL","Morocco":"CAF","Haiti":"CONCACAF","Scotland":"UEFA",
    "United States":"CONCACAF","Paraguay":"CONMEBOL","Australia":"AFC","Türkiye":"UEFA",
    "Germany":"UEFA","Curaçao":"CONCACAF","Ivory Coast":"CAF","Ecuador":"CONMEBOL",
    "Netherlands":"UEFA","Japan":"AFC","Sweden":"UEFA","Tunisia":"CAF",
    "Belgium":"UEFA","Egypt":"CAF","Iran":"AFC","New Zealand":"OFC",
    "Spain":"UEFA","Cape Verde":"CAF","Saudi Arabia":"AFC","Uruguay":"CONMEBOL",
    "France":"UEFA","Senegal":"CAF","Iraq":"AFC","Norway":"UEFA",
    "Argentina":"CONMEBOL","Algeria":"CAF","Austria":"UEFA","Jordan":"AFC",
    "Portugal":"UEFA","DR Congo":"CAF","Uzbekistan":"AFC","Colombia":"CONMEBOL",
    "England":"UEFA","Croatia":"UEFA","Ghana":"CAF","Panama":"CONCACAF"
};

const GROUPS = {
    A: ["Mexico","South Africa","South Korea","Czechia"],
    B: ["Canada","Bosnia and Herzegovina","Qatar","Switzerland"],
    C: ["Brazil","Morocco","Haiti","Scotland"],
    D: ["United States","Paraguay","Australia","Türkiye"],
    E: ["Germany","Curaçao","Ivory Coast","Ecuador"],
    F: ["Netherlands","Japan","Sweden","Tunisia"],
    G: ["Belgium","Egypt","Iran","New Zealand"],
    H: ["Spain","Cape Verde","Saudi Arabia","Uruguay"],
    I: ["France","Senegal","Iraq","Norway"],
    J: ["Argentina","Algeria","Austria","Jordan"],
    K: ["Portugal","DR Congo","Uzbekistan","Colombia"],
    L: ["England","Croatia","Ghana","Panama"]
};

const VENUES = [
    {city:"Mexico City",name:"Estadio Azteca",country:"Mexico",cap:"87,523",emoji:"🏟️",matches:6},
    {city:"Guadalajara",name:"Estadio Akron",country:"Mexico",cap:"49,850",emoji:"🏟️",matches:4},
    {city:"Monterrey",name:"Estadio BBVA",country:"Mexico",cap:"53,500",emoji:"🏟️",matches:3},
    {city:"Vancouver",name:"BC Place",country:"Canada",cap:"54,500",emoji:"🏟️",matches:7},
    {city:"Toronto",name:"BMO Field",country:"Canada",cap:"45,736",emoji:"🏟️",matches:6},
    {city:"Atlanta",name:"Mercedes-Benz Stadium",country:"USA",cap:"71,000",emoji:"🏟️",matches:8},
    {city:"Boston",name:"Gillette Stadium",country:"USA",cap:"65,878",emoji:"🏟️",matches:6},
    {city:"Dallas",name:"AT&T Stadium",country:"USA",cap:"80,000",emoji:"🏟️",matches:8},
    {city:"Houston",name:"NRG Stadium",country:"USA",cap:"72,220",emoji:"🏟️",matches:7},
    {city:"Kansas City",name:"Arrowhead Stadium",country:"USA",cap:"76,416",emoji:"🏟️",matches:6},
    {city:"Los Angeles",name:"SoFi Stadium",country:"USA",cap:"70,240",emoji:"🏟️",matches:7},
    {city:"Miami",name:"Hard Rock Stadium",country:"USA",cap:"64,767",emoji:"🏟️",matches:7},
    {city:"New York/New Jersey",name:"MetLife Stadium",country:"USA",cap:"82,500",emoji:"🏟️",matches:8},
    {city:"Philadelphia",name:"Lincoln Financial Field",country:"USA",cap:"69,176",emoji:"🏟️",matches:6},
    {city:"San Francisco",name:"Levi's Stadium",country:"USA",cap:"68,500",emoji:"🏟️",matches:8},
    {city:"Seattle",name:"Lumen Field",country:"USA",cap:"69,000",emoji:"🏟️",matches:7}
];

// Helper: generate group matches (6 per group = 72 total)
function generateGroupMatches() {
    const matches = [];
    const groupKeys = Object.keys(GROUPS);
    // Dates: June 11-27, 2026 (spreading across days)
    const startDate = new Date(2026, 5, 11); // June 11
    let matchNum = 1;
    const venueNames = VENUES.map(v => v.city);

    // Each group plays 3 matchdays
    // MD1: 1v2, 3v4  |  MD2: 1v3, 4v2  |  MD3: 4v1, 2v3
    const pairings = [
        [[0,1],[2,3]], // MD1
        [[0,2],[3,1]], // MD2
        [[3,0],[1,2]]  // MD3
    ];

    // Schedule 4 groups per matchday set, spread across dates
    const mdDates = [
        // MD1: June 11-14
        [new Date(2026,5,11), new Date(2026,5,12), new Date(2026,5,13), new Date(2026,5,14)],
        // MD2: June 15-19
        [new Date(2026,5,15), new Date(2026,5,16), new Date(2026,5,17), new Date(2026,5,18)],
        // MD3: June 22-27
        [new Date(2026,5,22), new Date(2026,5,23), new Date(2026,5,24), new Date(2026,5,25)]
    ];

    const times = ["01:00","04:00","07:00","10:00","22:00","19:00"];
    let tIdx = 0;
    let vIdx = 0;

    for (let md = 0; md < 3; md++) {
        for (let gi = 0; gi < groupKeys.length; gi++) {
            const g = groupKeys[gi];
            const teams = GROUPS[g];
            const dateIdx = gi % mdDates[md].length;
            const date = mdDates[md][dateIdx];

            for (let pi = 0; pi < pairings[md].length; pi++) {
                const [a, b] = pairings[md][pi];
                matches.push({
                    num: matchNum++,
                    stage: "group",
                    group: g,
                    home: teams[a],
                    away: teams[b],
                    date: new Date(date),
                    time: times[tIdx % times.length],
                    venue: venueNames[vIdx % venueNames.length]
                });
                tIdx++;
                vIdx++;
            }
        }
    }
    return matches;
}

function generateKnockoutMatches(startNum) {
    const matches = [];
    let n = startNum;
    // Round of 32: June 28 - July 3 (16 matches)
    const r32Dates = [
        new Date(2026,5,28),new Date(2026,5,28),new Date(2026,5,29),new Date(2026,5,29),
        new Date(2026,5,30),new Date(2026,5,30),new Date(2026,6,1),new Date(2026,6,1),
        new Date(2026,6,1),new Date(2026,6,2),new Date(2026,6,2),new Date(2026,6,2),
        new Date(2026,6,3),new Date(2026,6,3),new Date(2026,6,3),new Date(2026,6,3)
    ];
    const r32Labels = [
        ["1A","2B"],["1C","2D"],["1E","2F"],["1G","2H"],
        ["1I","2J"],["1K","2L"],["1B","2A"],["1D","2C"],
        ["1F","2E"],["1H","2G"],["1J","2I"],["1L","2K"],
        ["3A/B/C","3D/E/F"],["3A/B/C","3G/H/I"],["3D/E/F","3J/K/L"],["3G/H/I","3J/K/L"]
    ];
    const times32 = ["01:00","04:00","07:00","10:00"];
    for (let i = 0; i < 16; i++) {
        matches.push({
            num: n++, stage:"round32", group:null,
            home: `Nhất ${r32Labels[i][0]}`, away: `Nhì ${r32Labels[i][1]}`,
            date: r32Dates[i], time: times32[i%4],
            venue: VENUES[i % VENUES.length].city
        });
    }

    // Round of 16: July 4-7 (8 matches)
    const r16Dates = [
        new Date(2026,6,4),new Date(2026,6,4),new Date(2026,6,5),new Date(2026,6,5),
        new Date(2026,6,6),new Date(2026,6,6),new Date(2026,6,7),new Date(2026,6,7)
    ];
    for (let i = 0; i < 8; i++) {
        matches.push({
            num: n++, stage:"round16", group:null,
            home: `Thắng trận ${73+i*2}`, away: `Thắng trận ${74+i*2}`,
            date: r16Dates[i], time: i%2===0?"01:00":"04:00",
            venue: VENUES[(i+4) % VENUES.length].city
        });
    }

    // QF: July 9-11
    const qfDates = [new Date(2026,6,9),new Date(2026,6,9),new Date(2026,6,10),new Date(2026,6,11)];
    for (let i = 0; i < 4; i++) {
        matches.push({
            num: n++, stage:"quarter", group:null,
            home: `Thắng trận ${89+i*2}`, away: `Thắng trận ${90+i*2}`,
            date: qfDates[i], time: i%2===0?"01:00":"07:00",
            venue: VENUES[(i+8) % VENUES.length].city
        });
    }

    // SF: July 14-15
    matches.push({num:n++,stage:"semi",group:null,home:"Thắng TK1",away:"Thắng TK2",date:new Date(2026,6,14),time:"04:00",venue:"Dallas"});
    matches.push({num:n++,stage:"semi",group:null,home:"Thắng TK3",away:"Thắng TK4",date:new Date(2026,6,15),time:"04:00",venue:"Atlanta"});

    // 3rd place: July 18
    matches.push({num:n++,stage:"third",group:null,home:"Thua BK1",away:"Thua BK2",date:new Date(2026,6,18),time:"04:00",venue:"Miami"});

    // Final: July 19
    matches.push({num:n++,stage:"final",group:null,home:"Thắng BK1",away:"Thắng BK2",date:new Date(2026,6,19),time:"04:00",venue:"New York/New Jersey"});

    return matches;
}

const GROUP_MATCHES = generateGroupMatches();
const KNOCKOUT_MATCHES = generateKnockoutMatches(GROUP_MATCHES.length + 1);
const ALL_MATCHES = [...GROUP_MATCHES, ...KNOCKOUT_MATCHES];
