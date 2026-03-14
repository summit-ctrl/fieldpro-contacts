// ─── FieldPro Demo Seed Data ───────────────────────────────────────────────
// 10 companies · 20 branches · 50 agents · 50+ tenants
// 4 techs · 50 jobs (4/tech/day Mon–Wed 16–18 Mar 2026)
// 100 inventory items · 4 admin users · quotes · invoices

// ─── FIELD STAFF (4 technicians) ──────────────────────────────────────────
export const DEFAULT_FIELD_STAFF = [
  {id:"fs1",name:"Jake Rivera",    role:"Lead Technician",  phone:"0411 100 200",email:"jake@fieldpro.com",  trades:["Plumbing","HVAC"],    status:"Active",zone:null},
  {id:"fs2",name:"Tom Yuen",       role:"Electrician",       phone:"0411 200 300",email:"tom@fieldpro.com",   trades:["Electrical"],          status:"Active",zone:null},
  {id:"fs3",name:"Maria Flores",   role:"HVAC Specialist",   phone:"0411 300 400",email:"maria@fieldpro.com", trades:["HVAC"],                status:"Active",zone:null},
  {id:"fs4",name:"Anita Shaw",     role:"Plumber",           phone:"0411 400 500",email:"anita@fieldpro.com", trades:["Plumbing"],            status:"Active",zone:null},
];

// ─── USERS (topboss + 4 admin + 4 tech) ───────────────────────────────────
const ALL_PERMS  = {dispatch:true,history:true,customers:true,quotes:true,invoices:true,inventory:true,reports:true,settings:true, techView:true,userMgmt:true};
const ADMIN_PERMS= {dispatch:true,history:true,customers:true,quotes:true,invoices:true,inventory:true,reports:true,settings:false,techView:true,userMgmt:false};
const TECH_PERMS = {dispatch:false,history:false,customers:false,quotes:false,invoices:false,inventory:false,reports:false,settings:false,techView:true,userMgmt:false};

export const SEED_USERS = [
  {id:"u1",name:"James Dunlop",   initials:"JD",role:"topboss",email:"james@fieldpro.com",   active:true, permissions:ALL_PERMS},
  {id:"u2",name:"Sarah Mitchell", initials:"SM",role:"admin",  email:"sarah@fieldpro.com",   active:true, permissions:ADMIN_PERMS},
  {id:"u3",name:"Kevin O'Brien",  initials:"KO",role:"admin",  email:"kevin@fieldpro.com",   active:true, permissions:ADMIN_PERMS},
  {id:"u4",name:"Priya Sharma",   initials:"PS",role:"admin",  email:"priya@fieldpro.com",   active:true, permissions:ADMIN_PERMS},
  {id:"u5",name:"Daniel Nguyen",  initials:"DN",role:"admin",  email:"daniel@fieldpro.com",  active:true, permissions:ADMIN_PERMS},
  {id:"u6",name:"Jake Rivera",    initials:"JR",role:"tech",   email:"jake@fieldpro.com",    active:true, staffId:"fs1", permissions:TECH_PERMS},
  {id:"u7",name:"Tom Yuen",       initials:"TY",role:"tech",   email:"tom@fieldpro.com",     active:true, staffId:"fs2", permissions:TECH_PERMS},
  {id:"u8",name:"Maria Flores",   initials:"MF",role:"tech",   email:"maria@fieldpro.com",   active:true, staffId:"fs3", permissions:TECH_PERMS},
  {id:"u9",name:"Anita Shaw",     initials:"AS",role:"tech",   email:"anita@fieldpro.com",   active:true, staffId:"fs4", permissions:TECH_PERMS},
];

// ─── HELPERS (local to seed) ───────────────────────────────────────────────
let _id = 9000;
const uid = () => `s${++_id}`;

// ─── JOB BUILDER ──────────────────────────────────────────────────────────
// Weekdays: Mon 16, Tue 17, Wed 18 Mar 2026
// 4 slots per day per tech: 08:00 · 10:00 · 13:00 · 15:30
const SLOTS = ["08:00","10:00","13:00","15:30"];
const DAYS  = ["2026-03-16","2026-03-17","2026-03-18"];

// NSW suburbs with lat/lng
const SUBURBS = [
  {suburb:"Parramatta NSW",   lat:-33.8138,lng:150.9985},
  {suburb:"Blacktown NSW",    lat:-33.7690,lng:150.9054},
  {suburb:"Penrith NSW",      lat:-33.7510,lng:150.6942},
  {suburb:"Campbelltown NSW", lat:-34.0651,lng:150.8141},
  {suburb:"Liverpool NSW",    lat:-33.9200,lng:150.9232},
  {suburb:"Ryde NSW",         lat:-33.8169,lng:151.1004},
  {suburb:"Chatswood NSW",    lat:-33.7967,lng:151.1816},
  {suburb:"Hurstville NSW",   lat:-33.9664,lng:151.1008},
  {suburb:"Castle Hill NSW",  lat:-33.7300,lng:151.0000},
  {suburb:"Hornsby NSW",      lat:-33.7025,lng:151.0998},
  {suburb:"Ashfield NSW",     lat:-33.8881,lng:151.1249},
  {suburb:"Bankstown NSW",    lat:-33.9189,lng:151.0345},
  {suburb:"Cronulla NSW",     lat:-34.0581,lng:151.1527},
  {suburb:"Manly NSW",        lat:-33.7969,lng:151.2850},
  {suburb:"Mosman NSW",       lat:-33.8269,lng:151.2396},
  {suburb:"Strathfield NSW",  lat:-33.8765,lng:151.0826},
  {suburb:"Auburn NSW",       lat:-33.8510,lng:151.0355},
  {suburb:"Merrylands NSW",   lat:-33.8380,lng:150.9880},
  {suburb:"Epping NSW",       lat:-33.7722,lng:151.0815},
  {suburb:"Baulkham Hills NSW",lat:-33.7590,lng:150.9800},
];

const STREETS = [
  "Oak St","Church St","Victoria Rd","Main St","George St","King St","Queen St",
  "Pennant Hills Rd","Windsor Rd","Mulgoa Rd","Great Western Hwy","Railway Pde",
  "Woodville Rd","Merrylands Rd","Castle Hill Rd","Pacific Hwy","Anzac Pde",
  "Parramatta Rd","Old Windsor Rd","Marsden St","Rose Ave","Lemon Grove",
  "Flushcombe Rd","High St","Station St","Bridge Rd","Darcy St","Bent St",
];

const JOB_DESCRIPTIONS = {
  Plumbing:[
    "Leaking tap – kitchen & bathroom","Blocked drain – bathroom","Burst pipe under sink",
    "Hot water system replacement","Leaking toilet cistern","Shower regrouting",
    "Water pressure issue","Kitchen mixer tap replacement","Flexi hose replacement",
    "Storm water drain blocked","Hot water system flush & service","Bathroom rough-in",
    "Leaking roof gutter","Outdoor tap installation","Gas leak investigation",
  ],
  Electrical:[
    "Switchboard upgrade","Power point replacement x3","Safety switch trip",
    "Smoke alarm replacement x4","Ceiling fan installation x2","LED downlight upgrade",
    "No power to kitchen","Security light installation","Outdoor power point",
    "EV charger installation","Circuit overload investigation","Meter box upgrade",
    "Exit light replacement","Emergency lighting test","Power outage investigation",
  ],
  HVAC:[
    "Split system install – bedroom","Ducted AC – not heating","Split system filter clean",
    "Evaporative cooler service","Ducted heating annual service","AC not cooling",
    "Split system refrigerant recharge","Ducted zone controller fault","New split system supply & install",
    "Commercial split system service","AC condensate drain blocked","Heat pump service",
    "Thermostat replacement","AC remote programming","Ducted system balancing",
  ],
};

const KEY_METHODS = ["tenant","office","other","tenant","tenant","office"];
const KEY_NOTES = {
  tenant:["Call 30 mins prior","Text before arrival","Ring doorbell","Tenant works from home","Early start OK",""],
  office:["Ask for reception","Collect from property manager","Key at front desk","Agent to meet on site",""],
  other:["Lockbox code 4421","Key with neighbour","Caretaker on site","Combination lock – 1234",""],
};

const APPLIANCE_POOL = [
  {appType:"Dishwasher",  brand:"Bosch",       model:"SMS46KI01A",   condition:"Leaking from door seal"},
  {appType:"Washing Machine",brand:"Samsung",  model:"WW80T504DAW",  condition:"Not spinning"},
  {appType:"Oven",        brand:"Westinghouse",model:"WVE636S",      condition:"Fan not working"},
  {appType:"Cooktop – Gas",brand:"Smeg",       model:"SR264GH",      condition:"One burner igniter faulty"},
  {appType:"Dryer",       brand:"Fisher & Paykel",model:"DE7060P1",  condition:"Not heating"},
  {appType:"Fridge",      brand:"LG",          model:"GF-L500PL",    condition:"Not cooling top shelf"},
  {appType:"Microwave",   brand:"Panasonic",   model:"NN-ST785S",    condition:"Turntable not rotating"},
  {appType:"Dishwasher",  brand:"Miele",       model:"G6620SC",      condition:"Not draining"},
];

const FIRST_NAMES = ["James","Sofia","Mia","David","Rachel","Karen","James","Emma","Liam","Olivia","Noah","Ava","Oliver","Elijah","Charlotte","Amelia","Mason","Harper","Lucas","Evelyn","Logan","Abigail","Ethan","Emily","Aiden","Ella","Henry","Elizabeth","Jackson","Camila","Sebastian","Luna","Jack","Sofia","Amir","Priya","Wei","Yuki","Carlos","Fatima","Mohammed","Li","Anna","Stefan","Maria","Paulo","Akira","Keiko","Nguyen","Chen"];
const LAST_NAMES  = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Wilson","Taylor","Anderson","Thomas","Jackson","White","Harris","Martin","Thompson","Moore","Young","Allen","King","Wright","Scott","Torres","Nguyen","Hill","Green","Adams","Baker","Nelson","Carter","Mitchell","Perez","Roberts","Evans","Turner","Phillips","Campbell","Parker","Edwards","Collins","Stewart","Flores","Morris","Rogers","Reed","Cook","Morgan","Bell","Murphy"];

let _tId = 100;
const makeTenant = () => {
  const fn = FIRST_NAMES[Math.floor(Math.random()*FIRST_NAMES.length)];
  const ln = LAST_NAMES[Math.floor(Math.random()*LAST_NAMES.length)];
  const n = ++_tId;
  return {id:`t${n}`,name:`${fn} ${ln}`,email:`${fn.toLowerCase()}.${ln.toLowerCase()}@gmail.com`,phone:`04${String(n).padStart(2,"0")} ${String(Math.floor(Math.random()*900)+100)} ${String(Math.floor(Math.random()*900)+100)}`};
};

let _jNum = 1050;
const makeJob = (tech, date, slot, type, agentName, companyName) => {
  const sub = SUBURBS[_jNum % SUBURBS.length];
  const street = STREETS[_jNum % STREETS.length];
  const num = 2 + (_jNum % 98);
  const km = KEY_METHODS[_jNum % KEY_METHODS.length];
  const kn = KEY_NOTES[km][_jNum % KEY_NOTES[km].length];
  const desc = JOB_DESCRIPTIONS[type][_jNum % JOB_DESCRIPTIONS[type].length];
  const hasAppliance = _jNum % 3 === 0;
  const ap = hasAppliance ? [{id:uid(),...APPLIANCE_POOL[_jNum % APPLIANCE_POOL.length]}] : [];
  const ref = String(++_jNum);
  return {
    id:uid(), ref, type,
    address:`${num} ${street}, ${sub.suburb}`,
    scheduledTime:slot, durationHrs:slot==="08:00"?1.5:slot==="10:00"?2:slot==="13:00"?1.5:1,
    lat:sub.lat + (Math.random()-0.5)*0.04,
    lng:sub.lng + (Math.random()-0.5)*0.04,
    description:desc, tech,
    keyMethod:km, keyNotes:kn,
    createdDate:new Date(new Date(date).getTime()-86400000*3).toISOString().slice(0,10),
    status:"Open", stage:"Scheduled", subStage:"",
    closedDate:null,
    tenants:[makeTenant()],
    appliances:ap,
    additionalWorks:[], diary:[], reports:[], visits:[],
    agentName, companyName,
  };
};

// Historical jobs (already closed)
const makeHistJob = (tech, type, daysAgo, agentName, companyName) => {
  const sub = SUBURBS[_jNum % SUBURBS.length];
  const street = STREETS[_jNum % STREETS.length];
  const num = 2 + (_jNum % 98);
  const km = KEY_METHODS[_jNum % KEY_METHODS.length];
  const kn = KEY_NOTES[km][_jNum % KEY_NOTES[km].length];
  const desc = JOB_DESCRIPTIONS[type][_jNum % JOB_DESCRIPTIONS[type].length];
  const created = new Date();
  created.setDate(created.getDate()-daysAgo-3);
  const closed = new Date();
  closed.setDate(closed.getDate()-daysAgo);
  const ref = String(++_jNum);
  return {
    id:uid(), ref, type,
    address:`${num} ${street}, ${sub.suburb}`,
    description:desc, tech,
    keyMethod:km, keyNotes:kn,
    createdDate:created.toISOString().slice(0,10),
    status:"Closed", stage:"Completed", subStage:"",
    closedDate:closed.toISOString().slice(0,10),
    tenants:[makeTenant()],
    appliances:[], additionalWorks:[], diary:[], reports:[], visits:[],
    agentName, companyName,
  };
};

// ─── 10 COMPANIES · 20 BRANCHES · 50 AGENTS ───────────────────────────────
// Each company has 2 branches. Agents spread: first branch gets 3, second gets 2.
// Jobs are attached to agents.

const CO_DATA = [
  {id:"c1", name:"Ray White Group",        abn:"42 000 001 478",phone:"(02) 9299 0000",email:"accounts@raywhite.com",       website:"raywhite.com",
   branches:[
     {name:"Ray White Parramatta",  addr:"10 Darcy St, Parramatta NSW 2150",       ph:"(02) 9633 3300",em:"parramatta@raywhite.com",    bill:{name:"Karen Lim",     email:"klim@raywhite.com",    phone:"(02) 9633 3301"}},
     {name:"Ray White Blacktown",   addr:"1 Flushcombe Rd, Blacktown NSW 2148",    ph:"(02) 9622 4400",em:"blacktown@raywhite.com",     bill:{name:"Tom Nguyen",    email:"tnguyen@raywhite.com", phone:"(02) 9622 4401"}},
   ]},
  {id:"c2", name:"LJ Hooker Corporate",    abn:"31 000 007 922",phone:"(02) 8244 4444",email:"accounts@ljhooker.com.au",     website:"ljhooker.com.au",
   branches:[
     {name:"LJ Hooker Penrith",     addr:"345 High St, Penrith NSW 2750",          ph:"(02) 4732 1100",em:"penrith@ljhooker.com.au",    bill:{name:"Rachel Park",   email:"rpark@ljhooker.com.au",phone:"(02) 4732 1101"}},
     {name:"LJ Hooker Campbelltown",addr:"200 Queen St, Campbelltown NSW 2560",    ph:"(02) 4625 1100",em:"campbelltown@ljhooker.com.au",bill:{name:"Alex Greer",    email:"agreer@ljhooker.com.au",phone:"(02) 4625 1101"}},
   ]},
  {id:"c3", name:"PRD Realty",             abn:"55 002 123 456",phone:"(02) 9410 5000",email:"accounts@prd.com.au",          website:"prd.com.au",
   branches:[
     {name:"PRD Ryde",              addr:"880 Victoria Rd, Ryde NSW 2112",         ph:"(02) 9807 5500",em:"ryde@prd.com.au",           bill:{name:"Jenny Walsh",   email:"jwalsh@prd.com.au",    phone:"(02) 9807 5501"}},
     {name:"PRD Hornsby",           addr:"4/2 George St, Hornsby NSW 2077",        ph:"(02) 9477 4433",em:"hornsby@prd.com.au",        bill:{name:"Mark Cooper",   email:"mcooper@prd.com.au",   phone:"(02) 9477 4434"}},
   ]},
  {id:"c4", name:"Harcourts Australia",    abn:"77 003 234 567",phone:"(02) 9388 6000",email:"accounts@harcourts.com.au",    website:"harcourts.com.au",
   branches:[
     {name:"Harcourts Chatswood",   addr:"12 Help St, Chatswood NSW 2067",         ph:"(02) 9412 5000",em:"chatswood@harcourts.com.au",bill:{name:"Lisa Chen",     email:"lchen@harcourts.com.au",phone:"(02) 9412 5001"}},
     {name:"Harcourts Hurstville",  addr:"2/180 Forest Rd, Hurstville NSW 2220",   ph:"(02) 9580 9200",em:"hurstville@harcourts.com.au",bill:{name:"David Park",   email:"dpark@harcourts.com.au",phone:"(02) 9580 9201"}},
   ]},
  {id:"c5", name:"McGrath Estate Agents",  abn:"88 004 345 678",phone:"(02) 9362 0700",email:"accounts@mcgrath.com.au",      website:"mcgrath.com.au",
   branches:[
     {name:"McGrath Manly",         addr:"42 East Esplanade, Manly NSW 2095",      ph:"(02) 9977 8100",em:"manly@mcgrath.com.au",      bill:{name:"Sandra Lee",    email:"slee@mcgrath.com.au",  phone:"(02) 9977 8101"}},
     {name:"McGrath Mosman",        addr:"771 Military Rd, Mosman NSW 2088",       ph:"(02) 9960 7770",em:"mosman@mcgrath.com.au",     bill:{name:"Andrew Hill",   email:"ahill@mcgrath.com.au", phone:"(02) 9960 7771"}},
   ]},
  {id:"c6", name:"Raine & Horne",          abn:"99 005 456 789",phone:"(02) 9258 5400",email:"accounts@raineandhorne.com.au", website:"raineandhorne.com.au",
   branches:[
     {name:"Raine & Horne Strathfield",addr:"1/7 The Boulevarde, Strathfield NSW 2135",ph:"(02) 9746 3000",em:"strathfield@raineandhorne.com.au",bill:{name:"Patricia Wu",email:"pwu@rah.com.au",phone:"(02) 9746 3001"}},
     {name:"Raine & Horne Auburn",  addr:"88 Auburn Rd, Auburn NSW 2144",          ph:"(02) 9646 2555",em:"auburn@raineandhorne.com.au",bill:{name:"Michael Tran", email:"mtran@rah.com.au",     phone:"(02) 9646 2556"}},
   ]},
  {id:"c7", name:"Century 21 Australia",   abn:"11 006 567 890",phone:"(02) 9261 2100",email:"accounts@century21.com.au",    website:"century21.com.au",
   branches:[
     {name:"Century 21 Epping",     addr:"12 Carlingford Rd, Epping NSW 2121",     ph:"(02) 9869 5555",em:"epping@century21.com.au",   bill:{name:"Grace Kim",     email:"gkim@c21.com.au",      phone:"(02) 9869 5556"}},
     {name:"Century 21 Bankstown",  addr:"2/36 The Mall, Bankstown NSW 2200",      ph:"(02) 9790 7400",em:"bankstown@century21.com.au", bill:{name:"Sam El-Amin",   email:"selamin@c21.com.au",   phone:"(02) 9790 7401"}},
   ]},
  {id:"c8", name:"First National Real Estate",abn:"22 007 678 901",phone:"(02) 9899 3000",email:"accounts@firstnational.com.au",website:"firstnational.com.au",
   branches:[
     {name:"First National Castle Hill",addr:"308 Old Northern Rd, Castle Hill NSW 2154",ph:"(02) 9634 8000",em:"castlehill@firstnational.com.au",bill:{name:"Peter Nguyen",email:"pnguyen@fn.com.au",phone:"(02) 9634 8001"}},
     {name:"First National Baulkham Hills",addr:"12 Windsor Rd, Baulkham Hills NSW 2153",ph:"(02) 9686 3333",em:"baulkhamhills@firstnational.com.au",bill:{name:"Lucy Morris", email:"lmorris@fn.com.au",phone:"(02) 9686 3334"}},
   ]},
  {id:"c9", name:"Barry Plant",             abn:"33 008 789 012",phone:"(03) 9843 9000",email:"accounts@barryplant.com.au",   website:"barryplant.com.au",
   branches:[
     {name:"Barry Plant Liverpool",  addr:"236 Macquarie St, Liverpool NSW 2170",  ph:"(02) 9601 2333",em:"liverpool@barryplant.com.au",bill:{name:"Chris Adams",   email:"cadams@bp.com.au",     phone:"(02) 9601 2334"}},
     {name:"Barry Plant Cronulla",   addr:"12 Surf Rd, Cronulla NSW 2230",         ph:"(02) 9527 6666",em:"cronulla@barryplant.com.au", bill:{name:"Diane Scott",   email:"dscott@bp.com.au",     phone:"(02) 9527 6667"}},
   ]},
  {id:"c10",name:"Elders Real Estate",      abn:"44 009 890 123",phone:"(02) 9334 1200",email:"accounts@eldersrealestate.com.au",website:"eldersrealestate.com.au",
   branches:[
     {name:"Elders Ashfield",        addr:"260 Liverpool Rd, Ashfield NSW 2131",   ph:"(02) 9798 1200",em:"ashfield@elders.com.au",    bill:{name:"Ryan Brooks",   email:"rbrooks@elders.com.au",phone:"(02) 9798 1201"}},
     {name:"Elders Merrylands",      addr:"5 McFarlane St, Merrylands NSW 2160",   ph:"(02) 9637 2200",em:"merrylands@elders.com.au",  bill:{name:"Tanya Reed",    email:"treed@elders.com.au",  phone:"(02) 9637 2201"}},
   ]},
];

// Agent name pool (50 agents)
const AGENT_FIRST = ["James","Sofia","Mia","David","Rachel","Karen","Emma","Liam","Oliver","Ava","Noah","Charlotte","Amelia","Mason","Harper","Logan","Abigail","Ethan","Emily","Aiden","Ella","Henry","Elizabeth","Jackson","Camila","Sebastian","Luna","Jack","Sophia","Amir","Priya","Wei","Carlos","Fatima","Mohammed","Li","Anna","Stefan","Maria","Paulo","Keiko","Nguyen","Chen","Yuki","Akira","Bruno","Chloe","Derek","Elena","Felix"];
const AGENT_LAST  = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Wilson","Taylor","Anderson","Thomas","Jackson","White","Harris","Martin","Thompson","Moore","Young","Allen","King","Wright","Scott","Torres","Nguyen","Hill","Green","Adams","Baker","Nelson","Carter","Mitchell","Perez","Roberts","Evans","Turner","Phillips","Campbell","Parker","Edwards","Collins","Stewart","Flores","Morris","Rogers","Reed","Cook","Morgan","Bell","Murphy"];

// Assign jobs: 4 techs × 3 days × 4 slots = 48 scheduled jobs
// Plus 2 historical per tech = 8 historical = ~56 total
const TECH_TYPES = {
  fs1:{name:"Jake Rivera",  types:["Plumbing","Plumbing","HVAC","Plumbing"]},
  fs2:{name:"Tom Yuen",     types:["Electrical","Electrical","Electrical","Electrical"]},
  fs3:{name:"Maria Flores", types:["HVAC","HVAC","Plumbing","HVAC"]},
  fs4:{name:"Anita Shaw",   types:["Plumbing","Plumbing","Plumbing","HVAC"]},
};

let agentIdx = 0;
export const SEED_COMPANIES = CO_DATA.map((co, coIdx) => {
  const branches = co.branches.map((br, brIdx) => {
    // 2-3 agents per branch
    const agentCount = brIdx === 0 ? 3 : 2;
    const agents = [];
    for(let a = 0; a < agentCount; a++) {
      const fn = AGENT_FIRST[agentIdx % AGENT_FIRST.length];
      const ln = AGENT_LAST[agentIdx % AGENT_LAST.length];
      const aId = `a${agentIdx + 1}`;
      agentIdx++;

      // Each agent gets a spread of jobs across techs and days
      const jobs = [];
      // 2 scheduled jobs per agent from the schedule
      const techKeys = Object.keys(TECH_TYPES);
      const techKey = techKeys[(agentIdx) % techKeys.length];
      const tech = TECH_TYPES[techKey];
      const day = DAYS[(agentIdx) % DAYS.length];
      const slot = SLOTS[(agentIdx) % SLOTS.length];
      const type = tech.types[(agentIdx) % tech.types.length];
      jobs.push(makeJob(tech.name, day, slot, type, `${fn} ${ln}`, co.name));

      const techKey2 = techKeys[(agentIdx + 1) % techKeys.length];
      const tech2 = TECH_TYPES[techKey2];
      const day2 = DAYS[(agentIdx + 1) % DAYS.length];
      const slot2 = SLOTS[(agentIdx + 1) % SLOTS.length];
      const type2 = tech2.types[(agentIdx + 1) % tech2.types.length];
      jobs.push(makeJob(tech2.name, day2, slot2, type2, `${fn} ${ln}`, co.name));

      // 1 historical closed job per agent
      const techKey3 = techKeys[(agentIdx + 2) % techKeys.length];
      const tech3 = TECH_TYPES[techKey3];
      const type3 = tech3.types[(agentIdx + 2) % tech3.types.length];
      jobs.push(makeHistJob(tech3.name, type3, 5 + (agentIdx % 20), `${fn} ${ln}`, co.name));

      agents.push({
        id: aId,
        name: `${fn} ${ln}`,
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}@${co.website.replace("www.","")}`,
        phone: `04${String(10+agentIdx).padStart(2,"0")} ${String(100+agentIdx).padStart(3,"0")} ${String(200+agentIdx).padStart(3,"0")}`,
        properties: 5 + (agentIdx % 12),
        jobs,
      });
    }
    return {
      id: `b${coIdx * 2 + brIdx + 1}`,
      name: br.name,
      address: br.addr,
      phone: br.ph,
      email: br.em,
      billing: br.bill,
      agents,
    };
  });
  return { id: co.id, name: co.name, abn: co.abn, phone: co.phone, email: co.email, website: co.website, status: "Active", branches };
});

// ─── VENDORS ───────────────────────────────────────────────────────────────
export const SEED_VENDORS = [
  {id:"v1",name:"The Good Guys",abn:"28 006 937 123",phone:"1300 942 765",email:"trade@thegoodguys.com.au",website:"thegoodguys.com.au",rank:1,status:"Active",
   contacts:[{name:"Brad Hollis",role:"Trade Account Manager",phone:"0411 200 300",email:"bhollis@tgg.com.au"},{name:"Kim Rees",role:"Accounts Payable",phone:"0411 200 301",email:"krees@tgg.com.au"}],
   catalogue:[{sku:"BSH-DW60",name:"Bosch 60cm Dishwasher",price:1199,unit:"each"},{sku:"FIS-AC35",name:"Fisher & Paykel 3.5kW Split",price:899,unit:"each"},{sku:"RIN-HW25",name:"Rinnai 25L HWS",price:1450,unit:"each"}],
   history:[{date:"2026-03-01",ref:"PO-4401",item:"Bosch Dishwasher x2",amount:2398,status:"Paid"},{date:"2026-03-08",ref:"PO-4412",item:"Fisher & Paykel Split x3",amount:2697,status:"Owing"}]},
  {id:"v2",name:"Harvey Norman Commercial",abn:"54 003 237 545",phone:"1300 464 278",email:"commercial@harveynorman.com.au",website:"harveynorman.com.au",rank:2,status:"Active",
   contacts:[{name:"Paul Sims",role:"Commercial Sales",phone:"0422 100 200",email:"psims@hn.com.au"}],
   catalogue:[{sku:"BSH-DW60",name:"Bosch 60cm Dishwasher",price:1249,unit:"each"},{sku:"LG-AC25",name:"LG 2.5kW Split",price:799,unit:"each"}],
   history:[{date:"2026-02-20",ref:"PO-4395",item:"LG Split x2",amount:1598,status:"Paid"},{date:"2026-03-05",ref:"PO-4408",item:"Bosch Dishwasher x1",amount:1249,status:"Owing"}]},
  {id:"v3",name:"Reece Plumbing Supplies",abn:"19 004 089 444",phone:"13 12 00",email:"trade@reece.com.au",website:"reece.com.au",rank:1,status:"Active",
   contacts:[{name:"Steve March",role:"Trade Account",phone:"0433 300 400",email:"smarch@reece.com.au"}],
   catalogue:[{sku:"GRO-MIX1",name:"Grohe Eurosmart Mixer",price:320,unit:"each"},{sku:"CAE-HW50",name:"Caroma 50L HWS",price:1100,unit:"each"},{sku:"PVC-90EL",name:"PVC 90° Elbow",price:8.50,unit:"each"}],
   history:[{date:"2026-03-03",ref:"PO-4405",item:"Grohe Mixer x5",amount:1600,status:"Paid"}]},
  {id:"v4",name:"Tradelink Plumbing",abn:"55 123 456 789",phone:"13 23 53",email:"orders@tradelink.com.au",website:"tradelink.com.au",rank:2,status:"Active",
   contacts:[{name:"Tony Ricci",role:"Trade Sales",phone:"0444 500 600",email:"tricci@tradelink.com.au"}],
   catalogue:[{sku:"FLX-HOSE",name:"Flexi Hose 300mm",price:12,unit:"each"},{sku:"PVC-90EL",name:"PVC 90° Elbow",price:8.10,unit:"each"},{sku:"WAX-RING",name:"Toilet Wax Ring",price:15,unit:"each"}],
   history:[{date:"2026-02-15",ref:"PO-4390",item:"Flexi Hose x50",amount:600,status:"Paid"}]},
  {id:"v5",name:"Clipsal / Schneider Electric",abn:"66 234 567 890",phone:"1300 202 525",email:"trade@clipsal.com.au",website:"clipsal.com.au",rank:1,status:"Active",
   contacts:[{name:"Ben Fraser",role:"Electrical Trade",phone:"0455 600 700",email:"bfraser@clipsal.com.au"}],
   catalogue:[{sku:"CLP-GPO",name:"Clipsal Double GPO",price:18,unit:"each"},{sku:"CLP-SS",name:"Clipsal Safety Switch 25A",price:85,unit:"each"},{sku:"CLP-LED",name:"LED Downlight 10W",price:22,unit:"each"}],
   history:[{date:"2026-03-10",ref:"PO-4415",item:"GPO x100",amount:1800,status:"Owing"}]},
];

// ─── INVENTORY SUPPLIERS ──────────────────────────────────────────────────
export const SEED_SUPPLIERS = [
  {id:"sup1",name:"Reece Plumbing",          contact:"sales@reece.com.au",       phone:"1300 555 000",terms:"Net 30",leadDays:3, abn:"12 345 678 901"},
  {id:"sup2",name:"Harvey Norman Commercial",contact:"commercial@harveynorman.com.au",phone:"1300 464 278",terms:"Net 14",leadDays:5, abn:"98 765 432 100"},
  {id:"sup3",name:"Tradelink",               contact:"orders@tradelink.com.au",  phone:"13 23 53",    terms:"Net 30",leadDays:2, abn:"55 123 456 789"},
  {id:"sup4",name:"Online / Ad Hoc",         contact:"",                         phone:"",            terms:"Prepay", leadDays:7, abn:""},
  {id:"sup5",name:"Clipsal / Schneider",     contact:"trade@clipsal.com.au",     phone:"1300 202 525",terms:"Net 30",leadDays:4, abn:"66 234 567 890"},
  {id:"sup6",name:"Rinnai Australia",        contact:"trade@rinnai.com.au",      phone:"1300 555 545",terms:"Net 30",leadDays:5, abn:"77 345 678 902"},
  {id:"sup7",name:"Daikin Australia",        contact:"trade@daikin.com.au",      phone:"1300 780 893",terms:"Net 30",leadDays:7, abn:"88 456 789 012"},
  {id:"sup8",name:"Caroma / Fowler",         contact:"trade@caroma.com.au",      phone:"1800 227 662",terms:"Net 14",leadDays:3, abn:"33 567 890 123"},
];

// ─── 100 INVENTORY ITEMS ──────────────────────────────────────────────────
export const SEED_INV_ITEMS = [
  // HOT WATER (12 items)
  {id:"in1", code:"RIN-HW25", barcode:"9312345001001",name:"Rinnai 25L Hot Water System",    description:"Rinnai B26 continuous flow gas HWS 25L/min",         category:"Hot Water", supplierId:"sup1",supplierCode:"RIN-B26",  purchasePrice:1450,sellPrice:2100,markup:44.8,clientMarkups:[],qtyOnHand:{warehouse:5,van_fs1:1,van_fs2:0,van_fs3:0,van_fs4:1},reorderPoint:2,reorderQty:5,  priceHistory:[{date:"2026-01-15",price:1450,supplierId:"sup1",note:"Current price"}],status:"active"},
  {id:"in2", code:"RIN-HW16", barcode:"9312345001002",name:"Rinnai 16L Hot Water System",    description:"Rinnai continuous flow gas HWS 16L/min compact",      category:"Hot Water", supplierId:"sup1",supplierCode:"RIN-B16",  purchasePrice:980, sellPrice:1450,markup:48.0,clientMarkups:[],qtyOnHand:{warehouse:4,van_fs1:0,van_fs2:0,van_fs3:0,van_fs4:1},reorderPoint:2,reorderQty:4,  priceHistory:[{date:"2026-01-15",price:980,supplierId:"sup1",note:"Current price"}], status:"active"},
  {id:"in3", code:"CAE-HW50", barcode:"9312345001003",name:"Caroma 50L Storage HWS Electric",description:"Caroma 50L electric storage hot water system",         category:"Hot Water", supplierId:"sup1",supplierCode:"CAE-HW50E",purchasePrice:1100,sellPrice:1750,markup:59.1,clientMarkups:[],qtyOnHand:{warehouse:3,van_fs1:0,van_fs2:0,van_fs3:0,van_fs4:0},reorderPoint:2,reorderQty:4,  priceHistory:[{date:"2026-01-01",price:1100,supplierId:"sup1",note:"New stock"}],    status:"active"},
  {id:"in4", code:"CAE-HW80", barcode:"9312345001004",name:"Caroma 80L Storage HWS Electric",description:"Caroma 80L electric storage hot water system",         category:"Hot Water", supplierId:"sup1",supplierCode:"CAE-HW80E",purchasePrice:1280,sellPrice:1980,markup:54.7,clientMarkups:[],qtyOnHand:{warehouse:2,van_fs1:0,van_fs2:0,van_fs3:0,van_fs4:0},reorderPoint:1,reorderQty:3,  priceHistory:[{date:"2026-01-01",price:1280,supplierId:"sup1",note:""}],             status:"active"},
  {id:"in5", code:"DUX-HW25", barcode:"9312345001005",name:"Dux 25L Tempering Valve Kit",    description:"Dux tempering valve for HWS compliance",               category:"Hot Water", supplierId:"sup3",supplierCode:"DUX-TV25", purchasePrice:85,  sellPrice:145, markup:70.6,clientMarkups:[],qtyOnHand:{warehouse:12,van_fs1:2,van_fs2:0,van_fs3:0,van_fs4:2},reorderPoint:5,reorderQty:10, priceHistory:[{date:"2026-02-01",price:85,supplierId:"sup3",note:""}],              status:"active"},
  {id:"in6", code:"RIN-FLUE", barcode:"9312345001006",name:"Rinnai HWS Flue Kit 100mm",      description:"Concentric flue kit for Rinnai B26 units",             category:"Hot Water", supplierId:"sup1",supplierCode:"RIN-FK100",purchasePrice:120, sellPrice:200, markup:66.7,clientMarkups:[],qtyOnHand:{warehouse:8,van_fs1:1,van_fs2:0,van_fs3:0,van_fs4:1},reorderPoint:3,reorderQty:6,  priceHistory:[{date:"2026-01-10",price:120,supplierId:"sup1",note:""}],             status:"active"},
  {id:"in7", code:"CAE-ANOD", barcode:"9312345001007",name:"Sacrificial Anode Rod 750mm",    description:"Magnesium anode rod for electric HWS",                 category:"Hot Water", supplierId:"sup8",supplierCode:"CAE-SA75", purchasePrice:45,  sellPrice:85,  markup:88.9,clientMarkups:[],qtyOnHand:{warehouse:20,van_fs1:4,van_fs2:0,van_fs3:0,van_fs4:4},reorderPoint:8,reorderQty:15, priceHistory:[{date:"2026-02-01",price:45,supplierId:"sup8",note:""}],              status:"active"},
  {id:"in8", code:"RIN-CTRL", barcode:"9312345001008",name:"Rinnai MC-91-2 Controller",      description:"Rinnai temperature controller for HWS",                category:"Hot Water", supplierId:"sup1",supplierCode:"RIN-MC91", purchasePrice:95,  sellPrice:165, markup:73.7,clientMarkups:[],qtyOnHand:{warehouse:6,van_fs1:0,van_fs2:0,van_fs3:0,van_fs4:0},reorderPoint:2,reorderQty:5,  priceHistory:[{date:"2026-01-20",price:95,supplierId:"sup1",note:""}],              status:"active"},
  {id:"in9", code:"GAS-COCK", barcode:"9312345001009",name:"Gas Cock 15mm Ball Valve",       description:"LPG/NG isolation ball valve 15mm",                     category:"Hot Water", supplierId:"sup3",supplierCode:"GC-15BV",  purchasePrice:28,  sellPrice:55,  markup:96.4,clientMarkups:[],qtyOnHand:{warehouse:25,van_fs1:4,van_fs2:0,van_fs3:0,van_fs4:4},reorderPoint:10,reorderQty:20,priceHistory:[{date:"2026-01-01",price:28,supplierId:"sup3",note:""}],              status:"active"},
  {id:"in10",code:"HWS-PTRAP",barcode:"9312345001010",name:"HWS P-Trap Drain Assembly",      description:"Pressure relief valve p-trap drain for HWS",           category:"Hot Water", supplierId:"sup3",supplierCode:"HWS-PT",   purchasePrice:22,  sellPrice:45,  markup:104.5,clientMarkups:[],qtyOnHand:{warehouse:18,van_fs1:2,van_fs2:0,van_fs3:0,van_fs4:2},reorderPoint:6,reorderQty:12, priceHistory:[{date:"2026-01-01",price:22,supplierId:"sup3",note:""}],              status:"active"},
  {id:"in11",code:"RIN-PRV",  barcode:"9312345001011",name:"Pressure Reducing Valve 15mm",   description:"Watts pressure reducing valve for HWS installation",   category:"Hot Water", supplierId:"sup3",supplierCode:"PRV-15W",  purchasePrice:65,  sellPrice:120, markup:84.6,clientMarkups:[],qtyOnHand:{warehouse:10,van_fs1:1,van_fs2:0,van_fs3:0,van_fs4:1},reorderPoint:4,reorderQty:8,  priceHistory:[{date:"2026-02-15",price:65,supplierId:"sup3",note:""}],              status:"active"},
  {id:"in12",code:"EXP-TANK", barcode:"9312345001012",name:"Expansion Control Valve",        description:"Pressure/temperature relief valve for HWS 100kPa",     category:"Hot Water", supplierId:"sup3",supplierCode:"ECV-100",  purchasePrice:48,  sellPrice:90,  markup:87.5,clientMarkups:[],qtyOnHand:{warehouse:14,van_fs1:2,van_fs2:0,van_fs3:0,van_fs4:2},reorderPoint:5,reorderQty:10, priceHistory:[{date:"2026-01-01",price:48,supplierId:"sup3",note:""}],              status:"active"},

  // HVAC/SPLIT SYSTEMS (15 items)
  {id:"in13",code:"DAI-AC25", barcode:"9312345002001",name:"Daikin 2.5kW Split System",      description:"Daikin FTXM25UVMA reverse cycle split system",         category:"HVAC",     supplierId:"sup7",supplierCode:"DAI-FTXM25",purchasePrice:850, sellPrice:1450,markup:70.6,clientMarkups:[],qtyOnHand:{warehouse:3,van_fs1:0,van_fs2:0,van_fs3:1,van_fs4:0},reorderPoint:1,reorderQty:3,  priceHistory:[{date:"2026-02-01",price:850,supplierId:"sup7",note:"New season stock"}],status:"active"},
  {id:"in14",code:"DAI-AC35", barcode:"9312345002002",name:"Daikin 3.5kW Split System",      description:"Daikin FTXM35UVMA reverse cycle split system",         category:"HVAC",     supplierId:"sup7",supplierCode:"DAI-FTXM35",purchasePrice:980, sellPrice:1650,markup:68.4,clientMarkups:[],qtyOnHand:{warehouse:2,van_fs1:0,van_fs2:0,van_fs3:1,van_fs4:0},reorderPoint:1,reorderQty:3,  priceHistory:[{date:"2026-02-01",price:980,supplierId:"sup7",note:""}],             status:"active"},
  {id:"in15",code:"LG-AC25",  barcode:"9312345002003",name:"LG 2.5kW Split System",          description:"LG Artcool 2.5kW reverse cycle inverter split",        category:"HVAC",     supplierId:"sup2",supplierCode:"LG-S09ET",  purchasePrice:799, sellPrice:1350,markup:69.0,clientMarkups:[],qtyOnHand:{warehouse:2,van_fs1:0,van_fs2:0,van_fs3:1,van_fs4:0},reorderPoint:1,reorderQty:3,  priceHistory:[{date:"2026-02-15",price:799,supplierId:"sup2",note:"Model update"}],  status:"active"},
  {id:"in16",code:"DAI-GAS",  barcode:"9312345002004",name:"Daikin R32 Refrigerant 2kg",     description:"R32 refrigerant gas cylinder 2kg",                     category:"HVAC",     supplierId:"sup7",supplierCode:"DAI-R32-2",  purchasePrice:120, sellPrice:220, markup:83.3,clientMarkups:[],qtyOnHand:{warehouse:8,van_fs1:0,van_fs2:0,van_fs3:2,van_fs4:0},reorderPoint:3,reorderQty:6,  priceHistory:[{date:"2026-01-15",price:120,supplierId:"sup7",note:""}],             status:"active"},
  {id:"in17",code:"HVAC-PIPE",barcode:"9312345002005",name:"Copper Pipe Insulation 12mm",    description:"Split system pipe insulation 12mm × 2m",               category:"HVAC",     supplierId:"sup3",supplierCode:"INS-12",    purchasePrice:8,   sellPrice:18,  markup:125.0,clientMarkups:[],qtyOnHand:{warehouse:40,van_fs1:0,van_fs2:0,van_fs3:8,van_fs4:0},reorderPoint:15,reorderQty:30,priceHistory:[{date:"2026-01-01",price:8,supplierId:"sup3",note:""}],               status:"active"},
  {id:"in18",code:"HVAC-MTB", barcode:"9312345002006",name:"Split System Wall Mounting Bracket",description:"Heavy duty wall bracket for split system indoor unit",category:"HVAC",   supplierId:"sup4",supplierCode:"MTB-SS",    purchasePrice:45,  sellPrice:90,  markup:100.0,clientMarkups:[],qtyOnHand:{warehouse:12,van_fs1:0,van_fs2:0,van_fs3:3,van_fs4:0},reorderPoint:4,reorderQty:8,  priceHistory:[{date:"2026-01-01",price:45,supplierId:"sup4",note:""}],              status:"active"},
  {id:"in19",code:"HVAC-COND",barcode:"9312345002007",name:"Condensate Drain Hose Kit 16mm", description:"Flexible drain hose 3m with fittings",                 category:"HVAC",     supplierId:"sup3",supplierCode:"CDH-16",    purchasePrice:18,  sellPrice:38,  markup:111.1,clientMarkups:[],qtyOnHand:{warehouse:20,van_fs1:0,van_fs2:0,van_fs3:5,van_fs4:0},reorderPoint:8,reorderQty:15, priceHistory:[{date:"2026-01-01",price:18,supplierId:"sup3",note:""}],              status:"active"},
  {id:"in20",code:"HVAC-FILT",barcode:"9312345002008",name:"Split System Filter (universal)", description:"Washable polyester filter 400mm × 300mm",             category:"HVAC",     supplierId:"sup4",supplierCode:"FILT-SS",   purchasePrice:12,  sellPrice:28,  markup:133.3,clientMarkups:[],qtyOnHand:{warehouse:25,van_fs1:0,van_fs2:0,van_fs3:5,van_fs4:0},reorderPoint:10,reorderQty:20,priceHistory:[{date:"2026-01-01",price:12,supplierId:"sup4",note:""}],              status:"active"},
  {id:"in21",code:"HVAC-TSTAT",barcode:"9312345002009",name:"Digital Thermostat Replacement",description:"7-day programmable thermostat 240V",                   category:"HVAC",     supplierId:"sup5",supplierCode:"TSTAT-7D",  purchasePrice:65,  sellPrice:130, markup:100.0,clientMarkups:[],qtyOnHand:{warehouse:8,van_fs1:0,van_fs2:0,van_fs3:2,van_fs4:0},reorderPoint:3,reorderQty:6,  priceHistory:[{date:"2026-01-10",price:65,supplierId:"sup5",note:""}],              status:"active"},
  {id:"in22",code:"DAI-REMOTE",barcode:"9312345002010",name:"Daikin BRC1H52W Remote",        description:"Replacement remote control for Daikin split systems",  category:"HVAC",     supplierId:"sup7",supplierCode:"DAI-REM52", purchasePrice:55,  sellPrice:110, markup:100.0,clientMarkups:[],qtyOnHand:{warehouse:10,van_fs1:0,van_fs2:0,van_fs3:2,van_fs4:0},reorderPoint:3,reorderQty:6,  priceHistory:[{date:"2026-01-01",price:55,supplierId:"sup7",note:""}],              status:"active"},
  {id:"in23",code:"HVAC-LEAK", barcode:"9312345002011",name:"Leak Detection Dye – HVAC",     description:"UV fluorescent dye for refrigerant leak detection 30ml",category:"HVAC",    supplierId:"sup4",supplierCode:"LEAK-UV",   purchasePrice:25,  sellPrice:55,  markup:120.0,clientMarkups:[],qtyOnHand:{warehouse:15,van_fs1:0,van_fs2:0,van_fs3:4,van_fs4:0},reorderPoint:5,reorderQty:10, priceHistory:[{date:"2026-01-01",price:25,supplierId:"sup4",note:""}],              status:"active"},
  {id:"in24",code:"HVAC-COPER",barcode:"9312345002012",name:"Copper Pipe 9.52mm × 5m",       description:"Annealed copper pipe for HVAC refrigerant lines",      category:"HVAC",     supplierId:"sup3",supplierCode:"CU-952-5",  purchasePrice:35,  sellPrice:70,  markup:100.0,clientMarkups:[],qtyOnHand:{warehouse:20,van_fs1:0,van_fs2:0,van_fs3:5,van_fs4:0},reorderPoint:8,reorderQty:15, priceHistory:[{date:"2026-01-01",price:35,supplierId:"sup3",note:""}],              status:"active"},
  {id:"in25",code:"HVAC-VACU", barcode:"9312345002013",name:"Vacuum Pump Oil 500ml",          description:"Replacement oil for HVAC vacuum pump",                 category:"HVAC",     supplierId:"sup4",supplierCode:"VP-OIL",    purchasePrice:22,  sellPrice:45,  markup:104.5,clientMarkups:[],qtyOnHand:{warehouse:10,van_fs1:0,van_fs2:0,van_fs3:2,van_fs4:0},reorderPoint:4,reorderQty:8,  priceHistory:[{date:"2026-01-01",price:22,supplierId:"sup4",note:""}],              status:"active"},
  {id:"in26",code:"HVAC-CLAMP",barcode:"9312345002014",name:"Hose Clamp 32mm Stainless",     description:"Stainless hose clamp for HVAC condensate fittings",    category:"HVAC",     supplierId:"sup4",supplierCode:"HC-32SS",   purchasePrice:3,   sellPrice:8,   markup:166.7,clientMarkups:[],qtyOnHand:{warehouse:60,van_fs1:0,van_fs2:0,van_fs3:15,van_fs4:0},reorderPoint:20,reorderQty:40,priceHistory:[{date:"2026-01-01",price:3,supplierId:"sup4",note:""}],               status:"active"},
  {id:"in27",code:"HVAC-PAD",  barcode:"9312345002015",name:"Outdoor Unit Mounting Pad",     description:"Rubber anti-vibration pad 450×450×50mm",               category:"HVAC",     supplierId:"sup4",supplierCode:"PAD-45",    purchasePrice:28,  sellPrice:58,  markup:107.1,clientMarkups:[],qtyOnHand:{warehouse:10,van_fs1:0,van_fs2:0,van_fs3:2,van_fs4:0},reorderPoint:3,reorderQty:6,  priceHistory:[{date:"2026-01-01",price:28,supplierId:"sup4",note:""}],              status:"active"},

  // TAPWARE & PLUMBING FIXTURES (15 items)
  {id:"in28",code:"GRO-MIX1",  barcode:"9312345003001",name:"Grohe Eurosmart Mixer Tap",      description:"Grohe Eurosmart single-lever basin mixer chrome",       category:"Tapware",  supplierId:"sup1",supplierCode:"GRO-33265",purchasePrice:320,sellPrice:520,markup:62.5,clientMarkups:[],qtyOnHand:{warehouse:8,van_fs1:3,van_fs2:0,van_fs3:0,van_fs4:3},reorderPoint:5,reorderQty:10, priceHistory:[{date:"2026-02-01",price:320,supplierId:"sup1",note:""}],             status:"active"},
  {id:"in29",code:"GRO-KTCH",  barcode:"9312345003002",name:"Grohe Minta Kitchen Mixer",      description:"Grohe Minta pull-out kitchen mixer chrome",             category:"Tapware",  supplierId:"sup1",supplierCode:"GRO-32168",purchasePrice:380,sellPrice:620,markup:63.2,clientMarkups:[],qtyOnHand:{warehouse:5,van_fs1:2,van_fs2:0,van_fs3:0,van_fs4:2},reorderPoint:3,reorderQty:6,  priceHistory:[{date:"2026-02-01",price:380,supplierId:"sup1",note:""}],             status:"active"},
  {id:"in30",code:"CAR-CISRP", barcode:"9312345003003",name:"Caroma Cistern Repair Kit",      description:"Caroma complete cistern inlet & outlet repair kit",     category:"Tapware",  supplierId:"sup8",supplierCode:"CAR-CISRK",purchasePrice:35, sellPrice:75,  markup:114.3,clientMarkups:[],qtyOnHand:{warehouse:15,van_fs1:3,van_fs2:0,van_fs3:0,van_fs4:3},reorderPoint:6,reorderQty:12, priceHistory:[{date:"2026-01-01",price:35,supplierId:"sup8",note:""}],              status:"active"},
  {id:"in31",code:"CAR-SEAT",  barcode:"9312345003004",name:"Caroma Toilet Seat S45",         description:"Caroma soft close toilet seat white",                  category:"Tapware",  supplierId:"sup8",supplierCode:"CAR-S45SC",purchasePrice:55, sellPrice:110, markup:100.0,clientMarkups:[],qtyOnHand:{warehouse:10,van_fs1:2,van_fs2:0,van_fs3:0,van_fs4:2},reorderPoint:4,reorderQty:8,  priceHistory:[{date:"2026-01-01",price:55,supplierId:"sup8",note:""}],              status:"active"},
  {id:"in32",code:"FLX-HOSE",  barcode:"9312345003005",name:"Flexible Hose 300mm 15mm",       description:"Stainless braided flexible hose 300mm 15mm BSP",       category:"Tapware",  supplierId:"sup3",supplierCode:"FLX-300",  purchasePrice:12, sellPrice:28,  markup:133.3,clientMarkups:[],qtyOnHand:{warehouse:60,van_fs1:10,van_fs2:0,van_fs3:0,van_fs4:10},reorderPoint:30,reorderQty:50,priceHistory:[{date:"2026-01-01",price:12,supplierId:"sup3",note:""}],              status:"active"},
  {id:"in33",code:"FLX-450",   barcode:"9312345003006",name:"Flexible Hose 450mm 15mm",       description:"Stainless braided flexible hose 450mm 15mm BSP",       category:"Tapware",  supplierId:"sup3",supplierCode:"FLX-450",  purchasePrice:14, sellPrice:32,  markup:128.6,clientMarkups:[],qtyOnHand:{warehouse:40,van_fs1:8,van_fs2:0,van_fs3:0,van_fs4:8},reorderPoint:20,reorderQty:40,priceHistory:[{date:"2026-01-01",price:14,supplierId:"sup3",note:""}],              status:"active"},
  {id:"in34",code:"PTRAP-50",  barcode:"9312345003007",name:"P-Trap 50mm PVC",               description:"PVC P-trap 50mm with adjustment tube",                 category:"Tapware",  supplierId:"sup3",supplierCode:"PT-50PVC", purchasePrice:8,  sellPrice:18,  markup:125.0,clientMarkups:[],qtyOnHand:{warehouse:25,van_fs1:5,van_fs2:0,van_fs3:0,van_fs4:5},reorderPoint:10,reorderQty:20, priceHistory:[{date:"2026-01-01",price:8,supplierId:"sup3",note:""}],               status:"active"},
  {id:"in35",code:"WSMECH",    barcode:"9312345003008",name:"Toilet Suite Inlet Valve",       description:"Float valve replacement for cistern refill",           category:"Tapware",  supplierId:"sup8",supplierCode:"IV-STD",   purchasePrice:22, sellPrice:48,  markup:118.2,clientMarkups:[],qtyOnHand:{warehouse:20,van_fs1:4,van_fs2:0,van_fs3:0,van_fs4:4},reorderPoint:8,reorderQty:15, priceHistory:[{date:"2026-01-01",price:22,supplierId:"sup8",note:""}],              status:"active"},
  {id:"in36",code:"SHWR-SET",  barcode:"9312345003009",name:"Shower Rose & Arm Set Chrome",   description:"Chrome shower head 200mm with 400mm arm",              category:"Tapware",  supplierId:"sup1",supplierCode:"SHR-200",  purchasePrice:95, sellPrice:180, markup:89.5,clientMarkups:[],qtyOnHand:{warehouse:10,van_fs1:2,van_fs2:0,van_fs3:0,van_fs4:2},reorderPoint:4,reorderQty:8,  priceHistory:[{date:"2026-01-15",price:95,supplierId:"sup1",note:""}],              status:"active"},
  {id:"in37",code:"WTR-STOP",  barcode:"9312345003010",name:"Water Stop Tap 15mm",            description:"Isolation tap 15mm for tap replacement",               category:"Tapware",  supplierId:"sup3",supplierCode:"WST-15",   purchasePrice:18, sellPrice:38,  markup:111.1,clientMarkups:[],qtyOnHand:{warehouse:30,van_fs1:6,van_fs2:0,van_fs3:0,van_fs4:6},reorderPoint:12,reorderQty:20, priceHistory:[{date:"2026-01-01",price:18,supplierId:"sup3",note:""}],              status:"active"},
  {id:"in38",code:"SINK-PLUG", barcode:"9312345003011",name:"Sink Waste Plug 40mm",           description:"PVC plug and waste assembly 40mm chrome",             category:"Tapware",  supplierId:"sup8",supplierCode:"SWP-40",   purchasePrice:12, sellPrice:28,  markup:133.3,clientMarkups:[],qtyOnHand:{warehouse:20,van_fs1:4,van_fs2:0,van_fs3:0,van_fs4:4},reorderPoint:8,reorderQty:15, priceHistory:[{date:"2026-01-01",price:12,supplierId:"sup8",note:""}],              status:"active"},
  {id:"in39",code:"BATH-SEAL", barcode:"9312345003012",name:"Silicone Sealant Bath White",    description:"Mold-resistant white silicone sealant 300ml",          category:"Tapware",  supplierId:"sup4",supplierCode:"SIL-WH",   purchasePrice:9,  sellPrice:22,  markup:144.4,clientMarkups:[],qtyOnHand:{warehouse:30,van_fs1:6,van_fs2:0,van_fs3:0,van_fs4:6},reorderPoint:10,reorderQty:20, priceHistory:[{date:"2026-01-01",price:9,supplierId:"sup4",note:""}],               status:"active"},
  {id:"in40",code:"TEFLN-T",   barcode:"9312345003013",name:"PTFE Teflon Tape 12mm",          description:"Thread seal tape 12mm × 12m roll",                    category:"Tapware",  supplierId:"sup4",supplierCode:"PTFE-12",  purchasePrice:1.5,sellPrice:4,   markup:166.7,clientMarkups:[],qtyOnHand:{warehouse:80,van_fs1:15,van_fs2:0,van_fs3:0,van_fs4:15},reorderPoint:30,reorderQty:60,priceHistory:[{date:"2026-01-01",price:1.5,supplierId:"sup4",note:""}],             status:"active"},
  {id:"in41",code:"GLUE-PVC",  barcode:"9312345003014",name:"PVC Solvent Cement 250ml",       description:"Medium body PVC cement for pressure systems",          category:"Tapware",  supplierId:"sup4",supplierCode:"PVC-SC",   purchasePrice:12, sellPrice:28,  markup:133.3,clientMarkups:[],qtyOnHand:{warehouse:15,van_fs1:3,van_fs2:0,van_fs3:0,van_fs4:3},reorderPoint:6,reorderQty:12, priceHistory:[{date:"2026-01-01",price:12,supplierId:"sup4",note:""}],              status:"active"},
  {id:"in42",code:"MIXER-CART",barcode:"9312345003015",name:"Mixer Tap Ceramic Cartridge",    description:"35mm ceramic disc cartridge hot/cold",                category:"Tapware",  supplierId:"sup4",supplierCode:"CART-35",  purchasePrice:18, sellPrice:40,  markup:122.2,clientMarkups:[],qtyOnHand:{warehouse:20,van_fs1:4,van_fs2:0,van_fs3:0,van_fs4:4},reorderPoint:8,reorderQty:15, priceHistory:[{date:"2026-01-01",price:18,supplierId:"sup4",note:""}],              status:"active"},

  // PIPE FITTINGS (15 items)
  {id:"in43",code:"PVC-90EL",  barcode:"9312345004001",name:"PVC 90° Elbow 100mm",            description:"PVC pressure 90° elbow 100mm BSP",                     category:"Fittings", supplierId:"sup3",supplierCode:"PVC-9010", purchasePrice:8.5,sellPrice:18,  markup:111.8,clientMarkups:[],qtyOnHand:{warehouse:45,van_fs1:12,van_fs2:0,van_fs3:0,van_fs4:8},reorderPoint:20,reorderQty:50, priceHistory:[{date:"2026-01-01",price:8.5,supplierId:"sup3",note:""}],             status:"active"},
  {id:"in44",code:"PVC-45EL",  barcode:"9312345004002",name:"PVC 45° Elbow 100mm",            description:"PVC pressure 45° elbow 100mm BSP",                     category:"Fittings", supplierId:"sup3",supplierCode:"PVC-4510", purchasePrice:9,  sellPrice:19,  markup:111.1,clientMarkups:[],qtyOnHand:{warehouse:30,van_fs1:8,van_fs2:0,van_fs3:0,van_fs4:6},reorderPoint:15,reorderQty:30, priceHistory:[{date:"2026-01-01",price:9,supplierId:"sup3",note:""}],               status:"active"},
  {id:"in45",code:"PVC-TEE",   barcode:"9312345004003",name:"PVC Tee 100mm",                  description:"PVC equal tee 100mm socket",                           category:"Fittings", supplierId:"sup3",supplierCode:"PVC-T10",  purchasePrice:11, sellPrice:24,  markup:118.2,clientMarkups:[],qtyOnHand:{warehouse:25,van_fs1:6,van_fs2:0,van_fs3:0,van_fs4:5},reorderPoint:10,reorderQty:25, priceHistory:[{date:"2026-01-01",price:11,supplierId:"sup3",note:""}],              status:"active"},
  {id:"in46",code:"PVC-COUP",  barcode:"9312345004004",name:"PVC Coupling 100mm",             description:"PVC pressure coupling 100mm socket",                   category:"Fittings", supplierId:"sup3",supplierCode:"PVC-C10",  purchasePrice:7,  sellPrice:15,  markup:114.3,clientMarkups:[],qtyOnHand:{warehouse:35,van_fs1:8,van_fs2:0,van_fs3:0,van_fs4:6},reorderPoint:15,reorderQty:30, priceHistory:[{date:"2026-01-01",price:7,supplierId:"sup3",note:""}],               status:"active"},
  {id:"in47",code:"CU-COUP15", barcode:"9312345004005",name:"Copper Coupling 15mm",           description:"End feed copper coupling 15mm solder",                 category:"Fittings", supplierId:"sup3",supplierCode:"CU-EC15",  purchasePrice:2.5,sellPrice:6,   markup:140.0,clientMarkups:[],qtyOnHand:{warehouse:80,van_fs1:20,van_fs2:0,van_fs3:0,van_fs4:15},reorderPoint:30,reorderQty:60,priceHistory:[{date:"2026-01-01",price:2.5,supplierId:"sup3",note:""}],             status:"active"},
  {id:"in48",code:"CU-ELB15",  barcode:"9312345004006",name:"Copper Elbow 15mm",              description:"End feed copper 90° elbow 15mm solder",                category:"Fittings", supplierId:"sup3",supplierCode:"CU-EE15",  purchasePrice:2.8,sellPrice:7,   markup:150.0,clientMarkups:[],qtyOnHand:{warehouse:70,van_fs1:18,van_fs2:0,van_fs3:0,van_fs4:12},reorderPoint:25,reorderQty:50,priceHistory:[{date:"2026-01-01",price:2.8,supplierId:"sup3",note:""}],             status:"active"},
  {id:"in49",code:"SOLDER",    barcode:"9312345004007",name:"Solder Wire 400g Lead-Free",     description:"Lead-free plumbing solder 400g reel",                  category:"Fittings", supplierId:"sup4",supplierCode:"SOL-LF400",purchasePrice:22, sellPrice:48,  markup:118.2,clientMarkups:[],qtyOnHand:{warehouse:12,van_fs1:2,van_fs2:0,van_fs3:0,van_fs4:2},reorderPoint:4,reorderQty:8,  priceHistory:[{date:"2026-01-01",price:22,supplierId:"sup4",note:""}],              status:"active"},
  {id:"in50",code:"FLUX-PAST", barcode:"9312345004008",name:"Plumbing Flux Paste 125g",       description:"Lead-free soldering flux for copper fittings",         category:"Fittings", supplierId:"sup4",supplierCode:"FLX-PB",   purchasePrice:8,  sellPrice:18,  markup:125.0,clientMarkups:[],qtyOnHand:{warehouse:20,van_fs1:4,van_fs2:0,van_fs3:0,van_fs4:4},reorderPoint:8,reorderQty:15, priceHistory:[{date:"2026-01-01",price:8,supplierId:"sup4",note:""}],               status:"active"},
  {id:"in51",code:"BSP-NIPPLE",barcode:"9312345004009",name:"BSP Nipple 15mm × 100mm",        description:"Hex nipple 15mm BSP × 100mm zinc plated",              category:"Fittings", supplierId:"sup3",supplierCode:"HN-15-100",purchasePrice:5,  sellPrice:12,  markup:140.0,clientMarkups:[],qtyOnHand:{warehouse:40,van_fs1:8,van_fs2:0,van_fs3:0,van_fs4:6},reorderPoint:15,reorderQty:30, priceHistory:[{date:"2026-01-01",price:5,supplierId:"sup3",note:""}],               status:"active"},
  {id:"in52",code:"GATE-VALVE",barcode:"9312345004010",name:"Gate Valve 20mm Bronze",         description:"Bronze gate valve 20mm for water supply",              category:"Fittings", supplierId:"sup3",supplierCode:"GV-20BZ",  purchasePrice:28, sellPrice:58,  markup:107.1,clientMarkups:[],qtyOnHand:{warehouse:15,van_fs1:3,van_fs2:0,van_fs3:0,van_fs4:3},reorderPoint:5,reorderQty:10, priceHistory:[{date:"2026-01-15",price:28,supplierId:"sup3",note:""}],              status:"active"},
  {id:"in53",code:"CHECK-VLV", barcode:"9312345004011",name:"Check Valve 15mm Bronze",        description:"Dual check valve 15mm for backflow prevention",        category:"Fittings", supplierId:"sup3",supplierCode:"CV-15BZ",  purchasePrice:22, sellPrice:48,  markup:118.2,clientMarkups:[],qtyOnHand:{warehouse:18,van_fs1:4,van_fs2:0,van_fs3:0,van_fs4:4},reorderPoint:6,reorderQty:12, priceHistory:[{date:"2026-01-01",price:22,supplierId:"sup3",note:""}],              status:"active"},
  {id:"in54",code:"PIPE-CLIP", barcode:"9312345004012",name:"Copper Pipe Clip 15mm",          description:"Munsen ring clip for 15mm copper pipe",                category:"Fittings", supplierId:"sup4",supplierCode:"PC-15M",   purchasePrice:1.2,sellPrice:3,   markup:150.0,clientMarkups:[],qtyOnHand:{warehouse:120,van_fs1:30,van_fs2:0,van_fs3:0,van_fs4:25},reorderPoint:50,reorderQty:100,priceHistory:[{date:"2026-01-01",price:1.2,supplierId:"sup4",note:""}],             status:"active"},
  {id:"in55",code:"PUSHFIT-15",barcode:"9312345004013",name:"Push-Fit Coupler 15mm",          description:"John Guest Speedfit coupler 15mm plastic",             category:"Fittings", supplierId:"sup3",supplierCode:"JG-C15",   purchasePrice:3.5,sellPrice:8,   markup:128.6,clientMarkups:[],qtyOnHand:{warehouse:60,van_fs1:15,van_fs2:0,van_fs3:0,van_fs4:12},reorderPoint:25,reorderQty:50, priceHistory:[{date:"2026-01-01",price:3.5,supplierId:"sup3",note:""}],             status:"active"},
  {id:"in56",code:"PUSHFIT-22",barcode:"9312345004014",name:"Push-Fit Coupler 22mm",          description:"John Guest Speedfit coupler 22mm plastic",             category:"Fittings", supplierId:"sup3",supplierCode:"JG-C22",   purchasePrice:4.5,sellPrice:10,  markup:122.2,clientMarkups:[],qtyOnHand:{warehouse:40,van_fs1:10,van_fs2:0,van_fs3:0,van_fs4:8},reorderPoint:15,reorderQty:30, priceHistory:[{date:"2026-01-01",price:4.5,supplierId:"sup3",note:""}],             status:"active"},
  {id:"in57",code:"DRAIN-SLV", barcode:"9312345004015",name:"Drain Cleaning Solvent 1L",      description:"Enzymatic drain cleaner safe for PVC pipes",           category:"Fittings", supplierId:"sup4",supplierCode:"DC-ENZ",   purchasePrice:14, sellPrice:32,  markup:128.6,clientMarkups:[],qtyOnHand:{warehouse:20,van_fs1:4,van_fs2:0,van_fs3:0,van_fs4:4},reorderPoint:8,reorderQty:15, priceHistory:[{date:"2026-01-01",price:14,supplierId:"sup4",note:""}],              status:"active"},

  // ELECTRICAL (20 items)
  {id:"in58",code:"SMK-AL9V",  barcode:"9312345005001",name:"Smoke Alarm 9V Hardwired",       description:"240V hardwired smoke alarm with 9V battery backup",    category:"Electrical",supplierId:"sup2",supplierCode:"SMK-HW9", purchasePrice:85, sellPrice:145, markup:70.6,clientMarkups:[{clientId:"c1",markupPct:12}],qtyOnHand:{warehouse:12,van_fs1:0,van_fs2:4,van_fs3:0,van_fs4:0},reorderPoint:10,reorderQty:20, priceHistory:[{date:"2026-01-10",price:85,supplierId:"sup2",note:"Supplier increase"}],status:"active"},
  {id:"in59",code:"SMK-INTL",  barcode:"9312345005002",name:"Interconnectable Smoke Alarm",   description:"Interlinked wireless smoke alarm 240V",                category:"Electrical",supplierId:"sup2",supplierCode:"SMK-IWL", purchasePrice:110,sellPrice:190, markup:72.7,clientMarkups:[],qtyOnHand:{warehouse:8, van_fs1:0,van_fs2:3,van_fs3:0,van_fs4:0},reorderPoint:4, reorderQty:12, priceHistory:[{date:"2026-01-15",price:110,supplierId:"sup2",note:""}],             status:"active"},
  {id:"in60",code:"CLP-GPO",   barcode:"9312345005003",name:"Clipsal Double GPO 10A",         description:"Clipsal 2000 series double powerpoint 10A",            category:"Electrical",supplierId:"sup5",supplierCode:"CLP-2025",purchasePrice:18, sellPrice:40,  markup:122.2,clientMarkups:[],qtyOnHand:{warehouse:50,van_fs1:0,van_fs2:15,van_fs3:0,van_fs4:0},reorderPoint:20,reorderQty:40, priceHistory:[{date:"2026-01-01",price:18,supplierId:"sup5",note:""}],              status:"active"},
  {id:"in61",code:"CLP-SS",    barcode:"9312345005004",name:"Clipsal Safety Switch 25A",      description:"Clipsal 25A RCD safety switch for switchboard",        category:"Electrical",supplierId:"sup5",supplierCode:"CLP-RCD25",purchasePrice:85,sellPrice:150, markup:76.5,clientMarkups:[],qtyOnHand:{warehouse:15,van_fs1:0,van_fs2:5,van_fs3:0,van_fs4:0},reorderPoint:5, reorderQty:10, priceHistory:[{date:"2026-01-01",price:85,supplierId:"sup5",note:""}],              status:"active"},
  {id:"in62",code:"CLP-LED",   barcode:"9312345005005",name:"LED Downlight 10W Warm White",   description:"Dimmable LED downlight 10W 3000K 90mm cutout",         category:"Electrical",supplierId:"sup5",supplierCode:"CLP-LED10",purchasePrice:22,sellPrice:48,  markup:118.2,clientMarkups:[],qtyOnHand:{warehouse:40,van_fs1:0,van_fs2:12,van_fs3:0,van_fs4:0},reorderPoint:15,reorderQty:30, priceHistory:[{date:"2026-01-01",price:22,supplierId:"sup5",note:""}],              status:"active"},
  {id:"in63",code:"CLP-LEDC",  barcode:"9312345005006",name:"LED Downlight 10W Cool White",   description:"Dimmable LED downlight 10W 4000K 90mm cutout",         category:"Electrical",supplierId:"sup5",supplierCode:"CLP-LED10C",purchasePrice:22,sellPrice:48, markup:118.2,clientMarkups:[],qtyOnHand:{warehouse:35,van_fs1:0,van_fs2:10,van_fs3:0,van_fs4:0},reorderPoint:15,reorderQty:30, priceHistory:[{date:"2026-01-01",price:22,supplierId:"sup5",note:""}],              status:"active"},
  {id:"in64",code:"FAN-KIT",   barcode:"9312345005007",name:"Exhaust Fan Kit 225mm",          description:"White exhaust fan 225mm ceiling mount with timer",     category:"Electrical",supplierId:"sup2",supplierCode:"EXF-225W", purchasePrice:65, sellPrice:125, markup:92.3,clientMarkups:[],qtyOnHand:{warehouse:10,van_fs1:0,van_fs2:3,van_fs3:0,van_fs4:0},reorderPoint:4, reorderQty:8,  priceHistory:[{date:"2026-01-15",price:65,supplierId:"sup2",note:""}],              status:"active"},
  {id:"in65",code:"FAN-150",   barcode:"9312345005008",name:"Ceiling Fan 52\" Matte Black",   description:"3-blade 52-inch ceiling fan with remote control",       category:"Electrical",supplierId:"sup2",supplierCode:"CF-52MB",  purchasePrice:220,sellPrice:385, markup:75.0,clientMarkups:[],qtyOnHand:{warehouse:6, van_fs1:0,van_fs2:2,van_fs3:0,van_fs4:0},reorderPoint:2, reorderQty:4,  priceHistory:[{date:"2026-02-01",price:220,supplierId:"sup2",note:"New model"}],    status:"active"},
  {id:"in66",code:"MCB-20A",   barcode:"9312345005009",name:"MCB Circuit Breaker 20A",        description:"Single pole MCB 20A for switchboard",                  category:"Electrical",supplierId:"sup5",supplierCode:"MCB-1P20",  purchasePrice:18, sellPrice:38,  markup:111.1,clientMarkups:[],qtyOnHand:{warehouse:20,van_fs1:0,van_fs2:6,van_fs3:0,van_fs4:0},reorderPoint:8, reorderQty:15, priceHistory:[{date:"2026-01-01",price:18,supplierId:"sup5",note:""}],              status:"active"},
  {id:"in67",code:"MCB-32A",   barcode:"9312345005010",name:"MCB Circuit Breaker 32A",        description:"Single pole MCB 32A for stove circuit",                category:"Electrical",supplierId:"sup5",supplierCode:"MCB-1P32",  purchasePrice:22, sellPrice:45,  markup:104.5,clientMarkups:[],qtyOnHand:{warehouse:15,van_fs1:0,van_fs2:5,van_fs3:0,van_fs4:0},reorderPoint:5, reorderQty:10, priceHistory:[{date:"2026-01-01",price:22,supplierId:"sup5",note:""}],              status:"active"},
  {id:"in68",code:"FLEX-TPS",  barcode:"9312345005011",name:"TPS Cable 2.5mm 10m Coil",       description:"Twin and earth cable 2.5mm² 10m coil",                 category:"Electrical",supplierId:"sup5",supplierCode:"TPS-25-10", purchasePrice:32, sellPrice:65,  markup:103.1,clientMarkups:[],qtyOnHand:{warehouse:20,van_fs1:0,van_fs2:6,van_fs3:0,van_fs4:0},reorderPoint:8, reorderQty:15, priceHistory:[{date:"2026-01-01",price:32,supplierId:"sup5",note:""}],              status:"active"},
  {id:"in69",code:"FLEX-1.5",  barcode:"9312345005012",name:"TPS Cable 1.5mm 10m Coil",       description:"Twin and earth cable 1.5mm² 10m coil",                 category:"Electrical",supplierId:"sup5",supplierCode:"TPS-15-10", purchasePrice:22, sellPrice:45,  markup:104.5,clientMarkups:[],qtyOnHand:{warehouse:18,van_fs1:0,van_fs2:5,van_fs3:0,van_fs4:0},reorderPoint:6, reorderQty:12, priceHistory:[{date:"2026-01-01",price:22,supplierId:"sup5",note:""}],              status:"active"},
  {id:"in70",code:"EARTH-CLM", barcode:"9312345005013",name:"Earth Clamp Copper 25mm",        description:"Copper earth clamp for main earth conductor",          category:"Electrical",supplierId:"sup5",supplierCode:"EC-25CU",   purchasePrice:8,  sellPrice:18,  markup:125.0,clientMarkups:[],qtyOnHand:{warehouse:25,van_fs1:0,van_fs2:8,van_fs3:0,van_fs4:0},reorderPoint:10,reorderQty:20, priceHistory:[{date:"2026-01-01",price:8,supplierId:"sup5",note:""}],               status:"active"},
  {id:"in71",code:"JBOX-IP56", barcode:"9312345005014",name:"Junction Box IP56 100×100",      description:"Weatherproof junction box 100×100×70mm",              category:"Electrical",supplierId:"sup5",supplierCode:"JB-IP56",   purchasePrice:12, sellPrice:28,  markup:133.3,clientMarkups:[],qtyOnHand:{warehouse:20,van_fs1:0,van_fs2:6,van_fs3:0,van_fs4:0},reorderPoint:8, reorderQty:15, priceHistory:[{date:"2026-01-01",price:12,supplierId:"sup5",note:""}],              status:"active"},
  {id:"in72",code:"CONDUIT-20",barcode:"9312345005015",name:"PVC Conduit 20mm × 3m",          description:"PVC rigid conduit 20mm × 3m for cable protection",     category:"Electrical",supplierId:"sup5",supplierCode:"PVC-CD20",  purchasePrice:6,  sellPrice:14,  markup:133.3,clientMarkups:[],qtyOnHand:{warehouse:30,van_fs1:0,van_fs2:8,van_fs3:0,van_fs4:0},reorderPoint:10,reorderQty:20, priceHistory:[{date:"2026-01-01",price:6,supplierId:"sup5",note:""}],               status:"active"},
  {id:"in73",code:"WAGO-221",  barcode:"9312345005016",name:"WAGO 221 Lever Connector 5-way", description:"WAGO 221-415 5-conductor lever nut connector",          category:"Electrical",supplierId:"sup5",supplierCode:"WG-221-5",  purchasePrice:3,  sellPrice:7,   markup:133.3,clientMarkups:[],qtyOnHand:{warehouse:100,van_fs1:0,van_fs2:30,van_fs3:0,van_fs4:0},reorderPoint:40,reorderQty:80,priceHistory:[{date:"2026-01-01",price:3,supplierId:"sup5",note:""}],               status:"active"},
  {id:"in74",code:"GLAND-PG16",barcode:"9312345005017",name:"Cable Gland PG16 Nylon",         description:"Nylon PG16 cable gland for 10-14mm cable",             category:"Electrical",supplierId:"sup5",supplierCode:"CG-PG16",   purchasePrice:2.5,sellPrice:6,   markup:140.0,clientMarkups:[],qtyOnHand:{warehouse:60,van_fs1:0,van_fs2:15,van_fs3:0,van_fs4:0},reorderPoint:20,reorderQty:40, priceHistory:[{date:"2026-01-01",price:2.5,supplierId:"sup5",note:""}],             status:"active"},
  {id:"in75",code:"ELBOW-20",  barcode:"9312345005018",name:"Conduit Elbow 20mm 90°",         description:"PVC conduit 90° elbow 20mm",                           category:"Electrical",supplierId:"sup5",supplierCode:"PVC-EL20",  purchasePrice:2,  sellPrice:5,   markup:150.0,clientMarkups:[],qtyOnHand:{warehouse:50,van_fs1:0,van_fs2:12,van_fs3:0,van_fs4:0},reorderPoint:20,reorderQty:40, priceHistory:[{date:"2026-01-01",price:2,supplierId:"sup5",note:""}],               status:"active"},
  {id:"in76",code:"DIMMER-250",barcode:"9312345005019",name:"LED Dimmer Switch 250W",         description:"Single pole LED compatible dimmer 250W",               category:"Electrical",supplierId:"sup5",supplierCode:"DIM-LED250", purchasePrice:38, sellPrice:75,  markup:97.4,clientMarkups:[],qtyOnHand:{warehouse:12,van_fs1:0,van_fs2:4,van_fs3:0,van_fs4:0},reorderPoint:4, reorderQty:8,  priceHistory:[{date:"2026-01-01",price:38,supplierId:"sup5",note:""}],              status:"active"},
  {id:"in77",code:"USB-GPO",   barcode:"9312345005020",name:"USB Powerpoint Double + 2×USB",  description:"Double GPO with 2 USB-A outlets 2.4A",                 category:"Electrical",supplierId:"sup5",supplierCode:"CLP-USB2A",  purchasePrice:45, sellPrice:88,  markup:95.6,clientMarkups:[],qtyOnHand:{warehouse:15,van_fs1:0,van_fs2:4,van_fs3:0,van_fs4:0},reorderPoint:5, reorderQty:10, priceHistory:[{date:"2026-02-01",price:45,supplierId:"sup5",note:"New line"}],     status:"active"},

  // SAFETY & COMPLIANCE (10 items)
  {id:"in78",code:"CO-DET",    barcode:"9312345006001",name:"Carbon Monoxide Detector 240V",  description:"Hardwired CO detector with battery backup",            category:"Safety",   supplierId:"sup2",supplierCode:"COD-240V", purchasePrice:95, sellPrice:165, markup:73.7,clientMarkups:[],qtyOnHand:{warehouse:8, van_fs1:0,van_fs2:2,van_fs3:0,van_fs4:0},reorderPoint:3, reorderQty:6,  priceHistory:[{date:"2026-01-10",price:95,supplierId:"sup2",note:""}],              status:"active"},
  {id:"in79",code:"GAS-DET",   barcode:"9312345006002",name:"Natural Gas Detector Plug-In",   description:"Mains powered natural gas and LPG detector",           category:"Safety",   supplierId:"sup2",supplierCode:"GD-LPG",   purchasePrice:75, sellPrice:135, markup:80.0,clientMarkups:[],qtyOnHand:{warehouse:6, van_fs1:0,van_fs2:0,van_fs3:0,van_fs4:0},reorderPoint:2, reorderQty:4,  priceHistory:[{date:"2026-01-10",price:75,supplierId:"sup2",note:""}],              status:"active"},
  {id:"in80",code:"FIRE-EXT",  barcode:"9312345006003",name:"Fire Extinguisher ABE 2.5kg",    description:"Dry powder ABE extinguisher 2.5kg with bracket",       category:"Safety",   supplierId:"sup4",supplierCode:"FE-ABE25", purchasePrice:55, sellPrice:110, markup:100.0,clientMarkups:[],qtyOnHand:{warehouse:5, van_fs1:0,van_fs2:0,van_fs3:0,van_fs4:0},reorderPoint:2, reorderQty:4,  priceHistory:[{date:"2026-01-01",price:55,supplierId:"sup4",note:""}],              status:"active"},
  {id:"in81",code:"EMG-LIGHT", barcode:"9312345006004",name:"Emergency Exit Light LED",       description:"Combined exit/emergency light LED self-test",          category:"Safety",   supplierId:"sup5",supplierCode:"EXL-LED",  purchasePrice:85, sellPrice:155, markup:82.4,clientMarkups:[],qtyOnHand:{warehouse:6, van_fs1:0,van_fs2:2,van_fs3:0,van_fs4:0},reorderPoint:2, reorderQty:4,  priceHistory:[{date:"2026-01-01",price:85,supplierId:"sup5",note:""}],              status:"active"},
  {id:"in82",code:"PP-SAF",    barcode:"9312345006005",name:"Pool Pump Safety Cover",         description:"Pool pump junction box safety cover IP66",             category:"Safety",   supplierId:"sup5",supplierCode:"PP-SC66",  purchasePrice:32, sellPrice:65,  markup:103.1,clientMarkups:[],qtyOnHand:{warehouse:8, van_fs1:0,van_fs2:2,van_fs3:0,van_fs4:0},reorderPoint:3, reorderQty:6,  priceHistory:[{date:"2026-01-01",price:32,supplierId:"sup5",note:""}],              status:"active"},
  {id:"in83",code:"CAUTION-T", barcode:"9312345006006",name:"Caution Tape 75mm × 100m",      description:"Yellow/black caution barrier tape",                    category:"Safety",   supplierId:"sup4",supplierCode:"CAU-T75",  purchasePrice:8,  sellPrice:18,  markup:125.0,clientMarkups:[],qtyOnHand:{warehouse:20,van_fs1:2,van_fs2:2,van_fs3:2,van_fs4:2},reorderPoint:8, reorderQty:15, priceHistory:[{date:"2026-01-01",price:8,supplierId:"sup4",note:""}],               status:"active"},
  {id:"in84",code:"LOCKOUT",   barcode:"9312345006007",name:"Lockout/Tagout Kit 10pc",        description:"Safety lockout kit with hasp, tags and padlock",       category:"Safety",   supplierId:"sup4",supplierCode:"LOTO-10",  purchasePrice:48, sellPrice:95,  markup:97.9,clientMarkups:[],qtyOnHand:{warehouse:5, van_fs1:1,van_fs2:1,van_fs3:1,van_fs4:1},reorderPoint:2, reorderQty:4,  priceHistory:[{date:"2026-01-01",price:48,supplierId:"sup4",note:""}],              status:"active"},
  {id:"in85",code:"GLOVES-XL", barcode:"9312345006008",name:"Electrical Insulating Gloves L", description:"Class 00 insulating gloves 500V AC rated",             category:"Safety",   supplierId:"sup4",supplierCode:"EIG-L",    purchasePrice:65, sellPrice:120, markup:84.6,clientMarkups:[],qtyOnHand:{warehouse:8, van_fs1:0,van_fs2:2,van_fs3:0,van_fs4:0},reorderPoint:3, reorderQty:6,  priceHistory:[{date:"2026-01-01",price:65,supplierId:"sup4",note:""}],              status:"active"},
  {id:"in86",code:"EYE-WASH",  barcode:"9312345006009",name:"Eye Wash Station 500ml",         description:"Portable eye wash station with saline solution 500ml",category:"Safety",   supplierId:"sup4",supplierCode:"EWS-500",  purchasePrice:22, sellPrice:48,  markup:118.2,clientMarkups:[],qtyOnHand:{warehouse:10,van_fs1:1,van_fs2:1,van_fs3:1,van_fs4:1},reorderPoint:4, reorderQty:8,  priceHistory:[{date:"2026-01-01",price:22,supplierId:"sup4",note:""}],              status:"active"},
  {id:"in87",code:"FIRST-AID", barcode:"9312345006010",name:"First Aid Kit Medium Vehicle",   description:"Vehicle first aid kit AS2675 compliant",               category:"Safety",   supplierId:"sup4",supplierCode:"FAK-VH",   purchasePrice:45, sellPrice:90,  markup:100.0,clientMarkups:[],qtyOnHand:{warehouse:6, van_fs1:1,van_fs2:1,van_fs3:1,van_fs4:1},reorderPoint:2, reorderQty:4,  priceHistory:[{date:"2026-01-01",price:45,supplierId:"sup4",note:""}],              status:"active"},

  // CONSUMABLES & TOOLS (13 items)
  {id:"in88",code:"DRILL-BIT", barcode:"9312345007001",name:"Masonry Drill Bit Set 5pc",      description:"SDS+ masonry drill bits 6/8/10/12/16mm",              category:"Consumables",supplierId:"sup4",supplierCode:"SDS-5PC",  purchasePrice:35, sellPrice:70,  markup:100.0,clientMarkups:[],qtyOnHand:{warehouse:8, van_fs1:1,van_fs2:1,van_fs3:1,van_fs4:1},reorderPoint:3, reorderQty:6,  priceHistory:[{date:"2026-01-01",price:35,supplierId:"sup4",note:""}],              status:"active"},
  {id:"in89",code:"HOLE-SAW",  barcode:"9312345007002",name:"Hole Saw 76mm Bi-metal",         description:"Bi-metal hole saw 76mm for downlight cutouts",         category:"Consumables",supplierId:"sup4",supplierCode:"HS-76BM",  purchasePrice:28, sellPrice:55,  markup:96.4,clientMarkups:[],qtyOnHand:{warehouse:6, van_fs1:0,van_fs2:2,van_fs3:0,van_fs4:0},reorderPoint:2, reorderQty:4,  priceHistory:[{date:"2026-01-01",price:28,supplierId:"sup4",note:""}],              status:"active"},
  {id:"in90",code:"WIRENUTS",  barcode:"9312345007003",name:"Wire Nuts Assorted Pack 100pc",  description:"Twist-on wire connectors assorted colours 100pc",      category:"Consumables",supplierId:"sup5",supplierCode:"WN-ASS100",purchasePrice:12, sellPrice:25,  markup:108.3,clientMarkups:[],qtyOnHand:{warehouse:15,van_fs1:0,van_fs2:5,van_fs3:0,van_fs4:0},reorderPoint:5, reorderQty:10, priceHistory:[{date:"2026-01-01",price:12,supplierId:"sup5",note:""}],              status:"active"},
  {id:"in91",code:"CABLE-TIE", barcode:"9312345007004",name:"Cable Ties 200mm Black 100pc",   description:"UV stabilised nylon cable ties 200mm × 4.6mm 100pc",  category:"Consumables",supplierId:"sup4",supplierCode:"CT-200-100",purchasePrice:6,  sellPrice:14,  markup:133.3,clientMarkups:[],qtyOnHand:{warehouse:30,van_fs1:5,van_fs2:5,van_fs3:5,van_fs4:5},reorderPoint:10,reorderQty:20, priceHistory:[{date:"2026-01-01",price:6,supplierId:"sup4",note:""}],               status:"active"},
  {id:"in92",code:"SELF-SCRW", barcode:"9312345007005",name:"Self Tapping Screws M4 100pc",   description:"Countersunk self-tapping screws M4×20mm zinc 100pc",  category:"Consumables",supplierId:"sup4",supplierCode:"ST-M4-100",purchasePrice:5,  sellPrice:12,  markup:140.0,clientMarkups:[],qtyOnHand:{warehouse:40,van_fs1:8,van_fs2:8,van_fs3:8,van_fs4:8},reorderPoint:15,reorderQty:30, priceHistory:[{date:"2026-01-01",price:5,supplierId:"sup4",note:""}],               status:"active"},
  {id:"in93",code:"LIQUID-TFE",barcode:"9312345007006",name:"Leak Detection Fluid 250ml",     description:"Gas leak detection spray for pipe joints",             category:"Consumables",supplierId:"sup4",supplierCode:"LDF-250",  purchasePrice:12, sellPrice:26,  markup:116.7,clientMarkups:[],qtyOnHand:{warehouse:15,van_fs1:3,van_fs2:0,van_fs3:0,van_fs4:3},reorderPoint:5, reorderQty:10, priceHistory:[{date:"2026-01-01",price:12,supplierId:"sup4",note:""}],              status:"active"},
  {id:"in94",code:"GREASE-MET",barcode:"9312345007007",name:"Copper Grease Anti-Seize 500g",  description:"Anti-seize copper grease for threaded connections",     category:"Consumables",supplierId:"sup4",supplierCode:"CG-500",   purchasePrice:18, sellPrice:38,  markup:111.1,clientMarkups:[],qtyOnHand:{warehouse:10,van_fs1:2,van_fs2:0,van_fs3:2,van_fs4:2},reorderPoint:4, reorderQty:8,  priceHistory:[{date:"2026-01-01",price:18,supplierId:"sup4",note:""}],              status:"active"},
  {id:"in95",code:"CLOTH-BLUE",barcode:"9312345007008",name:"Blue Roll Cleaning Cloths 2pk",  description:"Disposable blue cleaning cloths 2-roll pack",          category:"Consumables",supplierId:"sup4",supplierCode:"BC-BLUE2", purchasePrice:8,  sellPrice:18,  markup:125.0,clientMarkups:[],qtyOnHand:{warehouse:20,van_fs1:2,van_fs2:2,van_fs3:2,van_fs4:2},reorderPoint:8, reorderQty:15, priceHistory:[{date:"2026-01-01",price:8,supplierId:"sup4",note:""}],               status:"active"},
  {id:"in96",code:"FOAM-SEAL", barcode:"9312345007009",name:"Expanding Foam Sealant 500ml",   description:"Polyurethane expanding foam gap filler 500ml",         category:"Consumables",supplierId:"sup4",supplierCode:"EXF-500",  purchasePrice:14, sellPrice:30,  markup:114.3,clientMarkups:[],qtyOnHand:{warehouse:15,van_fs1:2,van_fs2:2,van_fs3:2,van_fs4:2},reorderPoint:5, reorderQty:10, priceHistory:[{date:"2026-01-01",price:14,supplierId:"sup4",note:""}],              status:"active"},
  {id:"in97",code:"BRUSH-SET", barcode:"9312345007010",name:"Paint Brush Set 5pc",            description:"Mixed bristle brush set for touch-up work",           category:"Consumables",supplierId:"sup4",supplierCode:"PB-5PC",   purchasePrice:12, sellPrice:26,  markup:116.7,clientMarkups:[],qtyOnHand:{warehouse:10,van_fs1:1,van_fs2:1,van_fs3:1,van_fs4:1},reorderPoint:4, reorderQty:8,  priceHistory:[{date:"2026-01-01",price:12,supplierId:"sup4",note:""}],              status:"active"},
  {id:"in98",code:"DROP-SHEET",barcode:"9312345007011",name:"Canvas Drop Sheet 3.6×2.7m",     description:"Heavy canvas drop sheet for floor protection",         category:"Consumables",supplierId:"sup4",supplierCode:"DS-36",    purchasePrice:22, sellPrice:45,  markup:104.5,clientMarkups:[],qtyOnHand:{warehouse:8, van_fs1:1,van_fs2:1,van_fs3:1,van_fs4:1},reorderPoint:3, reorderQty:6,  priceHistory:[{date:"2026-01-01",price:22,supplierId:"sup4",note:""}],              status:"active"},
  {id:"in99",code:"HOSE-ELBOW",barcode:"9312345007012",name:"Garden Hose Tap Elbow",          description:"Brass elbow fitting for outdoor tap connection",       category:"Consumables",supplierId:"sup3",supplierCode:"HE-BRASS", purchasePrice:8,  sellPrice:18,  markup:125.0,clientMarkups:[],qtyOnHand:{warehouse:20,van_fs1:4,van_fs2:0,van_fs3:0,van_fs4:4},reorderPoint:8, reorderQty:15, priceHistory:[{date:"2026-01-01",price:8,supplierId:"sup3",note:""}],              status:"active"},
  {id:"in100",code:"SCREWDRV", barcode:"9312345007013",name:"Screwdriver Set 8pc Insulated",  description:"VDE 1000V insulated screwdriver set 8 pieces",         category:"Consumables",supplierId:"sup4",supplierCode:"VDE-8PC",  purchasePrice:55, sellPrice:110, markup:100.0,clientMarkups:[],qtyOnHand:{warehouse:4, van_fs1:0,van_fs2:1,van_fs3:0,van_fs4:0},reorderPoint:2, reorderQty:4,  priceHistory:[{date:"2026-02-01",price:55,supplierId:"sup4",note:"New stock"}],     status:"active"},
];

// ─── QUOTES ────────────────────────────────────────────────────────────────
export const SEED_QUOTES = [
  {id:"q1",ref:"QUO-001",jobRef:"1004",client:"Ray White Parramatta",contact:"Karen Lim",date:"2026-03-01",expiry:"2026-03-31",status:"Sent",total:2850,items:[
    {desc:"Replace kitchen mixer tap",qty:1,unit:"each",rate:320,amount:320,itemId:"in28"},
    {desc:"Labour – tap replacement",qty:2,unit:"hr",rate:120,amount:240},
    {desc:"Rinnai 25L Hot Water System",qty:1,unit:"each",rate:1450,amount:1450,itemId:"in1"},
    {desc:"Labour – HWS install",qty:7,unit:"hr",rate:120,amount:840},
  ]},
  {id:"q2",ref:"QUO-002",jobRef:"1021",client:"LJ Hooker Penrith",contact:"Rachel Park",date:"2026-03-05",expiry:"2026-04-05",status:"Draft",total:1560,items:[
    {desc:"Split system supply & install – Daikin 2.5kW",qty:1,unit:"each",rate:850,amount:850,itemId:"in13"},
    {desc:"Labour – HVAC install",qty:4,unit:"hr",rate:120,amount:480},
    {desc:"Refrigerant R32 recharge",qty:1,unit:"each",rate:230,amount:230,itemId:"in16"},
  ]},
  {id:"q3",ref:"QUO-003",jobRef:null,client:"Ray White Blacktown",contact:"Tom Nguyen",date:"2026-02-20",expiry:"2026-03-20",status:"Accepted",total:980,items:[
    {desc:"Smoke alarm x4 supply – hardwired",qty:4,unit:"each",rate:145,amount:580,itemId:"in58"},
    {desc:"Labour – installation",qty:2,unit:"hr",rate:120,amount:240},
    {desc:"Compliance certificate",qty:1,unit:"each",rate:160,amount:160},
  ]},
  {id:"q4",ref:"QUO-004",jobRef:null,client:"PRD Ryde",contact:"Jenny Walsh",date:"2026-03-10",expiry:"2026-04-10",status:"Draft",total:3200,items:[
    {desc:"LED downlight upgrade x12",qty:12,unit:"each",rate:48,amount:576,itemId:"in62"},
    {desc:"Safety switch replacement",qty:2,unit:"each",rate:150,amount:300,itemId:"in61"},
    {desc:"Labour – electrical",qty:8,unit:"hr",rate:120,amount:960},
    {desc:"Materials & consumables",qty:1,unit:"lot",rate:1364,amount:1364},
  ]},
  {id:"q5",ref:"QUO-005",jobRef:null,client:"Harcourts Chatswood",contact:"Lisa Chen",date:"2026-03-12",expiry:"2026-04-12",status:"Sent",total:1880,items:[
    {desc:"Daikin 3.5kW split system supply & install",qty:1,unit:"each",rate:1650,amount:1650,itemId:"in14"},
    {desc:"Labour – HVAC",qty:1.5,unit:"hr",rate:120,amount:180},
    {desc:"Disposal – old unit",qty:1,unit:"each",rate:50,amount:50},
  ]},
];

// ─── INVOICES ──────────────────────────────────────────────────────────────
export const SEED_INVOICES = [
  {id:"i1",ref:"INV-0041",client:"Ray White Parramatta",  contact:"Karen Lim",  jobRef:"1002",date:"2026-02-21",due:"2026-03-21",status:"Paid",   paidDate:"2026-03-10",total:1380,items:[{desc:"Power point replacement x3",qty:3,unit:"each",rate:220,amount:660},{desc:"Labour – electrical",qty:3,unit:"hr",rate:120,amount:360},{desc:"Cable replacement",qty:1,unit:"each",rate:360,amount:360}]},
  {id:"i2",ref:"INV-0042",client:"Ray White Parramatta",  contact:"Karen Lim",  jobRef:"1003",date:"2026-03-01",due:"2026-03-31",status:"Overdue",paidDate:null,        total:2240,items:[{desc:"HVAC full service",qty:1,unit:"each",rate:480,amount:480},{desc:"Gas cooktop service",qty:1,unit:"each",rate:320,amount:320},{desc:"Labour – HVAC",qty:6,unit:"hr",rate:120,amount:720},{desc:"Parts",qty:1,unit:"each",rate:720,amount:720}]},
  {id:"i3",ref:"INV-0043",client:"LJ Hooker Penrith",     contact:"Rachel Park",jobRef:"1006",date:"2026-03-09",due:"2026-04-09",status:"Sent",   paidDate:null,        total:1379,items:[{desc:"Washing machine service",qty:1,unit:"each",rate:299,amount:299},{desc:"Split system supply",qty:1,unit:"each",rate:899,amount:899},{desc:"Labour",qty:1.5,unit:"hr",rate:120,amount:181}]},
  {id:"i4",ref:"INV-0044",client:"PRD Ryde",              contact:"Jenny Walsh",jobRef:null,  date:"2026-02-28",due:"2026-03-28",status:"Paid",   paidDate:"2026-03-15",total:890, items:[{desc:"Smoke alarm compliance x3",qty:3,unit:"each",rate:145,amount:435},{desc:"Labour",qty:2.5,unit:"hr",rate:120,amount:300},{desc:"Cert",qty:1,unit:"each",rate:155,amount:155}]},
  {id:"i5",ref:"INV-0045",client:"Harcourts Chatswood",   contact:"Lisa Chen",  jobRef:null,  date:"2026-03-05",due:"2026-04-05",status:"Sent",   paidDate:null,        total:3450,items:[{desc:"Bathroom renovation – labour",qty:12,unit:"hr",rate:120,amount:1440},{desc:"Tapware – mixer taps x2",qty:2,unit:"each",rate:520,amount:1040},{desc:"Materials",qty:1,unit:"lot",rate:970,amount:970}]},
  {id:"i6",ref:"INV-0046",client:"McGrath Manly",         contact:"Sandra Lee", jobRef:null,  date:"2026-03-08",due:"2026-04-08",status:"Overdue",paidDate:null,        total:1650,items:[{desc:"Daikin split system",qty:1,unit:"each",rate:1450,amount:1450},{desc:"Installation labour",qty:1.5,unit:"hr",rate:120,amount:180},{desc:"Consumables",qty:1,unit:"lot",rate:20,amount:20}]},
  {id:"i7",ref:"INV-0047",client:"Raine & Horne Strathfield",contact:"Patricia Wu",jobRef:null,date:"2026-02-15",due:"2026-03-15",status:"Paid",paidDate:"2026-03-01",total:480, items:[{desc:"Exhaust fan replacement",qty:1,unit:"each",rate:125,amount:125},{desc:"Labour",qty:2,unit:"hr",rate:120,amount:240},{desc:"GPO replacement x2",qty:2,unit:"each",rate:40,amount:80},{desc:"Parts",qty:1,unit:"lot",rate:35,amount:35}]},
  {id:"i8",ref:"INV-0048",client:"Century 21 Epping",     contact:"Grace Kim",  jobRef:null,  date:"2026-03-11",due:"2026-04-11",status:"Draft",  paidDate:null,        total:2100,items:[{desc:"HWS replacement – Rinnai 25L",qty:1,unit:"each",rate:2100,amount:2100}]},
];

// ─── PURCHASE ORDERS ──────────────────────────────────────────────────────
export const SEED_PURCHASE_ORDERS = [
  {id:"po1",ref:"PO-001",supplierId:"sup1",supplierName:"Reece Plumbing",date:"2026-03-01",status:"received",jobId:null,lines:[{itemId:"in1",itemCode:"RIN-HW25",itemName:"Rinnai 25L Hot Water System",qtyOrdered:5,qtyReceived:5,unitCost:1450},{itemId:"in28",itemCode:"GRO-MIX1",itemName:"Grohe Eurosmart Mixer",qtyOrdered:10,qtyReceived:10,unitCost:320}],notes:"Monthly restock",receivedDate:"2026-03-05"},
  {id:"po2",ref:"PO-002",supplierId:"sup2",supplierName:"Harvey Norman Commercial",date:"2026-03-10",status:"sent",jobId:null,lines:[{itemId:"in13",itemCode:"DAI-AC25",itemName:"Daikin 2.5kW Split",qtyOrdered:3,qtyReceived:0,unitCost:850},{itemId:"in58",itemCode:"SMK-AL9V",itemName:"Smoke Alarm 9V",qtyOrdered:20,qtyReceived:0,unitCost:85}],notes:"Urgent – stock low",receivedDate:null},
  {id:"po3",ref:"PO-003",supplierId:"sup3",supplierName:"Tradelink",date:"2026-03-12",status:"draft",jobId:null,lines:[{itemId:"in43",itemCode:"PVC-90EL",itemName:"PVC 90° Elbow 100mm",qtyOrdered:50,qtyReceived:0,unitCost:8.5},{itemId:"in32",itemCode:"FLX-HOSE",itemName:"Flexible Hose 300mm",qtyOrdered:40,qtyReceived:0,unitCost:12}],notes:"Fittings restock",receivedDate:null},
  {id:"po4",ref:"PO-004",supplierId:"sup5",supplierName:"Clipsal / Schneider",date:"2026-02-20",status:"received",jobId:null,lines:[{itemId:"in60",itemCode:"CLP-GPO",itemName:"Clipsal Double GPO",qtyOrdered:50,qtyReceived:50,unitCost:18},{itemId:"in61",itemCode:"CLP-SS",itemName:"Safety Switch 25A",qtyOrdered:10,qtyReceived:10,unitCost:85}],notes:"Electrical restock",receivedDate:"2026-02-24"},
  {id:"po5",ref:"PO-005",supplierId:"sup1",supplierName:"Reece Plumbing",date:"2026-02-10",status:"received",jobId:null,lines:[{itemId:"in2",itemCode:"RIN-HW16",itemName:"Rinnai 16L HWS",qtyOrdered:4,qtyReceived:4,unitCost:980},{itemId:"in3",itemCode:"CAE-HW50",itemName:"Caroma 50L HWS",qtyOrdered:3,qtyReceived:3,unitCost:1100}],notes:"HWS stock-up",receivedDate:"2026-02-13"},
];

// ─── STOCK MOVEMENTS ──────────────────────────────────────────────────────
export const SEED_MOVEMENTS = [
  {id:"mv1",type:"receive",itemId:"in1",qty:5,fromLocation:null,toLocation:"warehouse",jobId:null,techId:null,poId:"po1",batchId:"bt1",date:"2026-03-05",note:"PO-001 received"},
  {id:"mv2",type:"collect",itemId:"in1",qty:1,fromLocation:"warehouse",toLocation:"van_fs4",jobId:null,techId:"fs4",poId:null,batchId:"bt1",date:"2026-03-06",note:"Anita van restock"},
  {id:"mv3",type:"receive",itemId:"in28",qty:10,fromLocation:null,toLocation:"warehouse",jobId:null,techId:null,poId:"po1",batchId:"bt3",date:"2026-03-05",note:"PO-001 received"},
  {id:"mv4",type:"collect",itemId:"in28",qty:3,fromLocation:"warehouse",toLocation:"van_fs1",jobId:null,techId:"fs1",poId:null,batchId:"bt3",date:"2026-03-06",note:"Jake van restock"},
  {id:"mv5",type:"transfer",itemId:"in43",qty:12,fromLocation:"warehouse",toLocation:"van_fs1",jobId:null,techId:"fs1",poId:null,batchId:"bt2",date:"2026-03-07",note:"Van restock for Jake"},
];

// ─── STOCK BATCHES ────────────────────────────────────────────────────────
export const SEED_BATCHES = [
  {id:"bt1",itemId:"in1", batchRef:"PO-001-1",receivedDate:"2026-03-05",supplierId:"sup1",supplierName:"Reece Plumbing",  unitCost:1450,qtyOriginal:5,qtyRemaining:4,location:"warehouse",poId:"po1",invoiceRef:""},
  {id:"bt2",itemId:"in43",batchRef:"PO-001-2",receivedDate:"2026-03-05",supplierId:"sup1",supplierName:"Reece Plumbing",  unitCost:8.50,qtyOriginal:50,qtyRemaining:45,location:"warehouse",poId:"po1",invoiceRef:""},
  {id:"bt3",itemId:"in28",batchRef:"PO-001-3",receivedDate:"2026-03-05",supplierId:"sup1",supplierName:"Reece Plumbing",  unitCost:320, qtyOriginal:10,qtyRemaining:7, location:"warehouse",poId:"po1",invoiceRef:""},
  {id:"bt4",itemId:"in58",batchRef:"ADHOC-001",receivedDate:"2026-02-10",supplierId:"sup2",supplierName:"Harvey Norman",  unitCost:85,  qtyOriginal:20,qtyRemaining:12,location:"warehouse",poId:null,invoiceRef:"INV-7710"},
  {id:"bt5",itemId:"in13",batchRef:"PO-005-1",receivedDate:"2026-02-13",supplierId:"sup7",supplierName:"Daikin Australia",unitCost:850, qtyOriginal:3, qtyRemaining:3, location:"warehouse",poId:"po5",invoiceRef:""},
  {id:"bt6",itemId:"in28",batchRef:"VAN-FS1-001",receivedDate:"2026-03-06",supplierId:"sup1",supplierName:"Reece Plumbing",unitCost:320,qtyOriginal:3,qtyRemaining:3,location:"van_fs1",poId:"po1",invoiceRef:""},
  {id:"bt7",itemId:"in1", batchRef:"VAN-FS4-001",receivedDate:"2026-03-06",supplierId:"sup1",supplierName:"Reece Plumbing",unitCost:1450,qtyOriginal:1,qtyRemaining:1,location:"van_fs4",poId:"po1",invoiceRef:""},
];
