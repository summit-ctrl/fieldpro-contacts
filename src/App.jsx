import { useState, useEffect, Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = {error:null}; }
  static getDerivedStateFromError(e) { return {error:e}; }
  render() {
    if(this.state.error) return (
      <div style={{padding:40,fontFamily:"monospace",background:"#fef2f2",minHeight:"100vh"}}>
        <div style={{fontSize:18,fontWeight:800,color:"#dc2626",marginBottom:12}}>⚠️ App Error</div>
        <pre style={{fontSize:12,color:"#7f1d1d",whiteSpace:"pre-wrap"}}>{this.state.error.toString()}\n\n{this.state.error.stack}</pre>
        <button onClick={()=>this.setState({error:null})} style={{marginTop:16,padding:"8px 16px",background:"#dc2626",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontFamily:"inherit"}}>Try Again</button>
      </div>
    );
    return this.props.children;
  }
}

const C = {
  bg:"#f4f6f9", card:"#ffffff", raised:"#f8fafc",
  border:"#e2e8f0", sidebar:"#1e293b", accent:"#0ea5e9", orange:"#f97316",
  green:"#16a34a", red:"#dc2626", purple:"#7c3aed", yellow:"#d97706",
  text:"#0f172a", sub:"#64748b", muted:"#94a3b8",
};

/* ─── DEFAULTS ─── */
const DEFAULT_APPLIANCE_TYPES = ["Oven","Dishwasher","Cooktop – Gas","Cooktop – Electric","Upright Cooker","Washing Machine","Dryer","Fridge","Microwave","Other"];
const DEFAULT_WORK_PRESETS = ["Add power point","Close off gas (gas shutdown)","Replace cables","Update circuit breaker","Modify cabinets","Cut benchtop","Install rangehood","Replace hot water system","Install exhaust fan","Smoke alarm replacement"];
const DEFAULT_JOB_TYPES = ["HVAC","Plumbing","Electrical"];
const DEFAULT_TECHNICIANS = ["Jake Rivera","Tom Yuen","Maria Flores","Anita Shaw"];
const DEFAULT_JOB_STAGES = ["New","Scheduled","In Progress","On Hold","Completed","Invoiced"];

/* ─── DEFAULT REPORT TEMPLATES ─── */
const DEFAULT_REPORT_TEMPLATES = [
  {
    id:"rt1", name:"Appliance Fault Report", icon:"🔧",
    appliesTo:[], // empty = all job types
    fields:[
      {id:"f1",type:"yesno",   label:"Visual signs of damage?",    required:true},
      {id:"f2",type:"yesno",   label:"Appliance functional on arrival?", required:true},
      {id:"f3",type:"multi",   label:"Fault category", options:["Electrical","Mechanical","Gas","Cosmetic","User Error","Unknown"], required:true},
      {id:"f4",type:"text",    label:"Fault description", multiline:true, required:true},
      {id:"f5",type:"text",    label:"Model number / Serial", required:false},
      {id:"f6",type:"multi",   label:"Parts required?", options:["None","Parts on hand","Parts ordered","Parts to be quoted"], required:true},
      {id:"f7",type:"text",    label:"Parts detail (SKU / description)", multiline:false, required:false},
      {id:"f8",type:"photo",   label:"Compliance plate photo", tag:"compliance_plate", required:false},
      {id:"f9",type:"photo",   label:"Fault / damage photos", tag:"fault_photo", required:false},
      {id:"f10",type:"yesno",  label:"Safe to use?", required:true},
      {id:"f11",type:"text",   label:"Additional notes", multiline:true, required:false},
    ]
  },
  {
    id:"rt2", name:"Gas Safety Inspection", icon:"⛽",
    appliesTo:["Plumbing"],
    fields:[
      {id:"g1",type:"yesno",  label:"Gas smell detected on arrival?", required:true},
      {id:"g2",type:"yesno",  label:"All appliances tested?", required:true},
      {id:"g3",type:"multi",  label:"Inspection outcome", options:["Pass","Fail","Conditional Pass","Further Inspection Required"], required:true},
      {id:"g4",type:"text",   label:"Appliances tested (list)", multiline:true, required:true},
      {id:"g5",type:"yesno",  label:"Isolation valve operational?", required:true},
      {id:"g6",type:"text",   label:"Readings / pressure notes", multiline:false, required:false},
      {id:"g7",type:"photo",  label:"Inspection photos", tag:"inspection_photo", required:false},
      {id:"g8",type:"text",   label:"Certifier notes", multiline:true, required:false},
    ]
  }
];
const DEFAULT_JOB_SUBSTAGES = ["Waiting on tenant","Parts ordered","Awaiting approval","Pending inspection","Follow-up required","On hold – weather","Subcontractor booked","Materials delivered"];
const DEFAULT_FIELD_STAFF = [
  {id:"fs1",name:"Jake Rivera",role:"Lead Technician",phone:"0411 100 200",email:"jake@fieldpro.com",trades:["Plumbing","HVAC"],status:"Active"},
  {id:"fs2",name:"Tom Yuen",role:"Electrician",phone:"0411 200 300",email:"tom@fieldpro.com",trades:["Electrical"],status:"Active"},
  {id:"fs3",name:"Maria Flores",role:"HVAC Specialist",phone:"0411 300 400",email:"maria@fieldpro.com",trades:["HVAC"],status:"Active"},
  {id:"fs4",name:"Anita Shaw",role:"Plumber",phone:"0411 400 500",email:"anita@fieldpro.com",trades:["Plumbing"],status:"Active"},
];

/* ─── HELPERS ─── */
const daysDiff = d => Math.floor((new Date() - new Date(d)) / 86400000);
const jobStatus = job => { if (job.status==="Open") return "Open"; return daysDiff(job.closedDate)<=30?"Recently Closed":"Old"; };
const statusColor = s => s==="Open"?"blue":s==="Recently Closed"?"orange":"gray";
const fmtDate = d => d ? new Date(d).toLocaleDateString("en-AU",{day:"2-digit",month:"short",year:"numeric"}) : "—";
const fmtMoney = n => "$"+Number(n||0).toLocaleString("en-AU",{minimumFractionDigits:2,maximumFractionDigits:2});
const fileSizeFmt = b => b > 1048576 ? `${(b/1048576).toFixed(1)} MB` : `${Math.round(b/1024)} KB`;
const fmtTs = ts => { const d = new Date(ts); return d.toLocaleDateString("en-AU",{day:"2-digit",month:"short",year:"numeric"}) + " " + d.toLocaleTimeString("en-AU",{hour:"2-digit",minute:"2-digit"}); };
let _id=3000; const uid=()=>`id-${++_id}`;
// Global auto-incrementing job number — starts after seed data (1006)
let _jobNum=1006; const nextJobRef=()=>`${++_jobNum}`;
const appIcon = t=>({"Oven":"🍳","Dishwasher":"🍽️","Cooktop – Gas":"🔥","Cooktop – Electric":"⚡","Upright Cooker":"🍲","Washing Machine":"🫧","Dryer":"💨","Fridge":"🧊","Microwave":"📡"}[t]||"🔧");
const workIcon = d=>{const l=d.toLowerCase();if(l.includes("gas"))return"⛽";if(l.includes("power point")||l.includes("circuit")||l.includes("cable"))return"⚡";if(l.includes("cabinet")||l.includes("benchtop"))return"🪚";if(l.includes("alarm"))return"🔔";if(l.includes("water"))return"💧";return"🔧";};
const stageColor = s => {
  const m={"New":"gray","Scheduled":"blue","In Progress":"orange","On Hold":"yellow","Completed":"green","Invoiced":"purple"};
  return m[s]||"gray";
};

/* ─── SEED DATA ─── */
const SEED_COMPANIES = [
  {id:"c1",name:"Ray White Group",abn:"42 000 001 478",phone:"(02) 9299 0000",email:"accounts@raywhite.com",website:"raywhite.com",status:"Active",
    branches:[
      {id:"b1",name:"Ray White Parramatta",address:"10 Darcy St, Parramatta NSW 2150",phone:"(02) 9633 3300",email:"parramatta@raywhite.com",
        billing:{name:"Karen Lim",email:"klim@raywhite.com",phone:"(02) 9633 3301"},
        agents:[
          {id:"a1",name:"James Okafor",email:"jokafor@raywhite.com",phone:"0412 111 222",properties:12,
            jobs:[
              {id:"j1",ref:"1001",type:"Plumbing",address:"22 Oak St, Parramatta NSW",description:"Leaking tap in kitchen and bathroom",tech:"Jake Rivera",keyMethod:"other",keyNotes:"Key in lockbox – code 4421",createdDate:"2026-03-01",status:"Open",stage:"In Progress",subStage:"Waiting on tenant",closedDate:null,tenants:[{id:"t1",name:"Wei & Fang Liu",email:"wliu@gmail.com",phone:"0400 111 333"}],appliances:[{id:"ap1",appType:"Dishwasher",brand:"Bosch",model:"SMS46KI01A",serial:"BSH2024-001",condition:"Leaking from door seal"}],additionalWorks:[{id:"aw1",description:"Add power point",custom:false,notes:"Behind dishwasher cavity"}]},
              {id:"j2",ref:"1002",type:"Electrical",address:"7/15 Church St, Parramatta NSW",description:"Power point replacement x3",tech:"Tom Yuen",keyMethod:"office",keyNotes:"Ask for Maria at reception",createdDate:"2026-02-10",status:"Closed",stage:"Invoiced",subStage:"",closedDate:"2026-02-20",tenants:[{id:"t2",name:"Priya Menon",email:"pmenon@hotmail.com",phone:"0400 222 444"}],appliances:[],additionalWorks:[{id:"aw2",description:"Replace cables",custom:false,notes:"3x double GPO"},{id:"aw3",description:"Update circuit breaker",custom:false,notes:""}]},
              {id:"j3",ref:"1003",type:"HVAC",address:"22 Oak St, Parramatta NSW",description:"AC unit not cooling – full service",tech:"Maria Flores",keyMethod:"tenant",keyNotes:"Call 30 mins prior",createdDate:"2025-11-15",status:"Closed",stage:"Completed",subStage:"Follow-up required",closedDate:"2025-11-20",tenants:[{id:"t1",name:"Wei & Fang Liu",email:"wliu@gmail.com",phone:"0400 111 333"},{id:"t2",name:"Priya Menon",email:"pmenon@hotmail.com",phone:"0400 222 444"}],appliances:[{id:"ap2",appType:"Cooktop – Gas",brand:"Smeg",model:"SR264GH",serial:"SMG2022-887",condition:"One burner igniter faulty"},{id:"ap3",appType:"Oven",brand:"Smeg",model:"SF6341GVX",serial:"SMG2022-888",condition:"Good – general service"}],additionalWorks:[]},
            ]},
          {id:"a2",name:"Sofia Reyes",email:"sreyes@raywhite.com",phone:"0413 333 444",properties:8,
            jobs:[{id:"j4",ref:"1004",type:"Plumbing",address:"3 Rose Ave, Parramatta NSW",description:"Hot water system replacement",tech:"Anita Shaw",keyMethod:"office",keyNotes:"",createdDate:"2026-03-05",status:"Open",stage:"Scheduled",subStage:"",closedDate:null,tenants:[{id:"t3",name:"Ahmed & Sara Hassan",email:"ahassan@gmail.com",phone:"0400 333 555"}],appliances:[],additionalWorks:[{id:"aw4",description:"Close off gas (gas shutdown)",custom:false,notes:"Old HWS – gas line to be capped"}]}]},
        ]},
      {id:"b2",name:"Ray White Blacktown",address:"1 Flushcombe Rd, Blacktown NSW 2148",phone:"(02) 9622 4400",email:"blacktown@raywhite.com",billing:{name:"Tom Nguyen",email:"tnguyen@raywhite.com",phone:"(02) 9622 4401"},agents:[{id:"a3",name:"Mia Chang",email:"mchang@raywhite.com",phone:"0414 555 666",properties:15,jobs:[{id:"j5",ref:"1005",type:"Electrical",address:"12 Main St, Blacktown NSW",description:"Smoke alarm replacement x4",tech:"Tom Yuen",keyMethod:"tenant",keyNotes:"Tenant works from home",createdDate:"2026-03-09",status:"Open",stage:"New",subStage:"",closedDate:null,tenants:[{id:"t4",name:"Carlos Fernandez",email:"cfernandez@gmail.com",phone:"0400 444 666"}],appliances:[],additionalWorks:[{id:"aw5",description:"Smoke alarm replacement",custom:false,notes:"4x units throughout"}]}]}]},
    ]},
  {id:"c2",name:"LJ Hooker Corporate",abn:"31 000 007 922",phone:"(02) 8244 4444",email:"accounts@ljhooker.com.au",website:"ljhooker.com.au",status:"Active",
    branches:[{id:"b3",name:"LJ Hooker Penrith",address:"345 High St, Penrith NSW 2750",phone:"(02) 4732 1100",email:"penrith@ljhooker.com.au",billing:{name:"Rachel Park",email:"rpark@ljhooker.com.au",phone:"(02) 4732 1101"},agents:[{id:"a4",name:"David Tran",email:"dtran@ljhooker.com.au",phone:"0415 777 888",properties:10,jobs:[{id:"j6",ref:"1006",type:"HVAC",address:"88 Woodriff St, Penrith NSW",description:"Split system install – bedroom",tech:"Maria Flores",keyMethod:"tenant",keyNotes:"Call Maya on 0400 555 777",createdDate:"2026-03-08",status:"Open",stage:"On Hold",subStage:"Parts ordered",closedDate:null,tenants:[{id:"t5",name:"Maya & Luke Patel",email:"mpatel@gmail.com",phone:"0400 555 777"}],appliances:[{id:"ap4",appType:"Washing Machine",brand:"Samsung",model:"WW80T504DAW",serial:"SAM2023-441",condition:"Not spinning – needs service"}],additionalWorks:[]}]}]}]},
];

const SEED_VENDORS = [
  {id:"v1",name:"The Good Guys",abn:"28 006 937 123",phone:"1300 942 765",email:"trade@thegoodguys.com.au",website:"thegoodguys.com.au",rank:1,status:"Active",contacts:[{name:"Brad Hollis",role:"Trade Account Manager",phone:"0411 200 300",email:"bhollis@tgg.com.au"},{name:"Kim Rees",role:"Accounts Payable",phone:"0411 200 301",email:"krees@tgg.com.au"}],catalogue:[{sku:"BSH-DW60",name:"Bosch 60cm Dishwasher Serie 6",price:1199,unit:"each"},{sku:"FIS-AC35",name:"Fisher & Paykel 3.5kW Split System",price:899,unit:"each"},{sku:"RIN-HW25",name:"Rinnai 25L Hot Water System",price:1450,unit:"each"}],history:[{date:"2026-03-01",ref:"PO-4401",item:"Bosch 60cm Dishwasher x2",amount:2398,status:"Paid"},{date:"2026-02-14",ref:"PO-4388",item:"Rinnai Hot Water x1",amount:1450,status:"Paid"},{date:"2026-03-08",ref:"PO-4412",item:"Fisher & Paykel Split x3",amount:2697,status:"Owing"}]},
  {id:"v2",name:"Harvey Norman Commercial",abn:"54 003 237 545",phone:"1300 464 278",email:"commercial@harveynorman.com.au",website:"harveynorman.com.au",rank:2,status:"Active",contacts:[{name:"Paul Sims",role:"Commercial Sales",phone:"0422 100 200",email:"psims@hn.com.au"}],catalogue:[{sku:"BSH-DW60",name:"Bosch 60cm Dishwasher Serie 6",price:1249,unit:"each"},{sku:"LG-AC25",name:"LG 2.5kW Reverse Cycle Split",price:799,unit:"each"}],history:[{date:"2026-02-20",ref:"PO-4395",item:"LG Split System x2",amount:1598,status:"Paid"},{date:"2026-03-05",ref:"PO-4408",item:"Bosch Dishwasher x1",amount:1249,status:"Owing"}]},
  {id:"v3",name:"Reece Plumbing Supplies",abn:"19 004 089 444",phone:"13 12 00",email:"trade@reece.com.au",website:"reece.com.au",rank:1,status:"Active",contacts:[{name:"Steve March",role:"Trade Account",phone:"0433 300 400",email:"smarch@reece.com.au"}],catalogue:[{sku:"GRO-MIX1",name:"Grohe Eurosmart Mixer Tap",price:320,unit:"each"},{sku:"CAE-HW50",name:"Caroma 50L Storage HWS",price:1100,unit:"each"},{sku:"PVC-90EL",name:"PVC 90° Elbow 100mm",price:8.50,unit:"each"}],history:[{date:"2026-03-03",ref:"PO-4405",item:"Grohe Mixer x5",amount:1600,status:"Paid"}]},
];

const allJobs = (companies) => (companies||SEED_COMPANIES).flatMap(co=>co.branches.flatMap(b=>b.agents.flatMap(a=>(a.jobs||[]).map(j=>({...j,agentName:a.name,branchName:b.name,companyName:co.name})))));

const SEED_QUOTES = [
  {id:"q1",ref:"QUO-001",client:"Ray White Parramatta",contact:"Karen Lim",date:"2026-03-01",expiry:"2026-03-31",status:"Sent",total:2850,items:[{desc:"Replace kitchen mixer tap",qty:1,unit:"each",rate:320,amount:320},{desc:"Labour – tap replacement",qty:2,unit:"hr",rate:120,amount:240},{desc:"Rinnai 25L Hot Water System",qty:1,unit:"each",rate:1450,amount:1450},{desc:"Labour – HWS install",qty:7,unit:"hr",rate:120,amount:840}]},
  {id:"q2",ref:"QUO-002",client:"LJ Hooker Penrith",contact:"Rachel Park",date:"2026-03-05",expiry:"2026-04-05",status:"Draft",total:1560,items:[{desc:"Split system supply & install",qty:1,unit:"each",rate:899,amount:899},{desc:"Labour – HVAC install",qty:4,unit:"hr",rate:120,amount:480},{desc:"Electrical connection",qty:1,unit:"each",rate:181,amount:181}]},
  {id:"q3",ref:"QUO-003",client:"Ray White Blacktown",contact:"Tom Nguyen",date:"2026-02-20",expiry:"2026-03-20",status:"Accepted",total:980,items:[{desc:"Smoke alarm x4 supply",qty:4,unit:"each",rate:85,amount:340},{desc:"Labour – installation",qty:4,unit:"hr",rate:120,amount:480},{desc:"Compliance certificate",qty:1,unit:"each",rate:160,amount:160}]},
];
const SEED_INVOICES = [
  {id:"i1",ref:"INV-0041",client:"Ray White Parramatta",contact:"Karen Lim",jobRef:"1002",date:"2026-02-21",due:"2026-03-21",status:"Paid",paidDate:"2026-03-10",total:1380,items:[{desc:"Power point replacement x3",qty:3,unit:"each",rate:220,amount:660},{desc:"Labour – electrical",qty:3,unit:"hr",rate:120,amount:360},{desc:"Cable replacement",qty:1,unit:"each",rate:360,amount:360}]},
  {id:"i2",ref:"INV-0042",client:"Ray White Parramatta",contact:"Karen Lim",jobRef:"1003",date:"2026-03-01",due:"2026-03-31",status:"Overdue",paidDate:null,total:2240,items:[{desc:"HVAC full service – split system",qty:1,unit:"each",rate:480,amount:480},{desc:"Gas cooktop service",qty:1,unit:"each",rate:320,amount:320},{desc:"Labour – HVAC",qty:6,unit:"hr",rate:120,amount:720},{desc:"Parts & consumables",qty:1,unit:"each",rate:720,amount:720}]},
  {id:"i3",ref:"INV-0043",client:"LJ Hooker Penrith",contact:"Rachel Park",jobRef:"1006",date:"2026-03-09",due:"2026-04-09",status:"Sent",paidDate:null,total:1379,items:[{desc:"Samsung washing machine service",qty:1,unit:"each",rate:299,amount:299},{desc:"Split system supply",qty:1,unit:"each",rate:899,amount:899},{desc:"Labour",qty:1.5,unit:"hr",rate:120,amount:181}]},
];
const SEED_INVENTORY = [
  {id:"in1",sku:"RIN-HW25",name:"Rinnai 25L Hot Water System",category:"Plumbing",qty:3,minQty:2,unitCost:1450,location:"Warehouse A",supplier:"The Good Guys"},
  {id:"in2",sku:"BSH-DW60",name:"Bosch 60cm Dishwasher Serie 6",category:"Appliances",qty:1,minQty:2,unitCost:1199,location:"Warehouse A",supplier:"The Good Guys"},
  {id:"in3",sku:"GRO-MIX1",name:"Grohe Eurosmart Mixer Tap",category:"Plumbing",qty:8,minQty:3,unitCost:320,location:"Van – Jake Rivera",supplier:"Reece Plumbing"},
  {id:"in4",sku:"PVC-90EL",name:"PVC 90° Elbow 100mm",category:"Plumbing",qty:45,minQty:20,unitCost:8.50,location:"Warehouse A",supplier:"Reece Plumbing"},
  {id:"in5",sku:"SMK-AL9V",name:"Smoke Alarm 9V Hardwired",category:"Electrical",qty:12,minQty:10,unitCost:85,location:"Van – Tom Yuen",supplier:"Harvey Norman"},
  {id:"in6",sku:"LG-AC25",name:"LG 2.5kW Reverse Cycle Split",category:"HVAC",qty:0,minQty:1,unitCost:799,location:"Warehouse A",supplier:"Harvey Norman"},
  {id:"in7",sku:"CAE-HW50",name:"Caroma 50L Storage HWS",category:"Plumbing",qty:2,minQty:2,unitCost:1100,location:"Warehouse A",supplier:"Reece Plumbing"},
];

/* ─── SHARED UI ─── */
const Badge = ({label,color}) => {const map={green:{bg:"#dcfce7",text:"#15803d"},blue:{bg:"#dbeafe",text:"#1d4ed8"},orange:{bg:"#ffedd5",text:"#c2410c"},red:{bg:"#fee2e2",text:"#b91c1c"},purple:{bg:"#ede9fe",text:"#6d28d9"},gray:{bg:"#f1f5f9",text:"#475569"},yellow:{bg:"#fef9c3",text:"#854d0e"}};const s=map[color]||map.gray;return <span style={{background:s.bg,color:s.text,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,letterSpacing:0.3,whiteSpace:"nowrap"}}>{label}</span>;};
const Avatar = ({name,size=36,bg="#dbeafe",fg="#1d4ed8"}) => {const i=name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();return <div style={{width:size,height:size,borderRadius:"50%",background:bg,color:fg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:size*0.33,flexShrink:0}}>{i}</div>;};
const Field = ({label,value}) => (<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"10px 0",borderBottom:`1px solid ${C.border}`,gap:12}}><span style={{color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,flexShrink:0}}>{label}</span><span style={{color:C.text,fontSize:13,fontWeight:600,textAlign:"right"}}>{value}</span></div>);
const Card = ({children,style={}}) => (<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,boxShadow:"0 1px 3px rgba(0,0,0,0.04)",...style}}>{children}</div>);
const SectionHead = ({title,count,action}) => (<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{color:C.text,fontWeight:700,fontSize:14}}>{title}</span>{count!==undefined&&<span style={{background:C.raised,border:`1px solid ${C.border}`,color:C.sub,borderRadius:99,padding:"1px 8px",fontSize:11,fontWeight:700}}>{count}</span>}</div>{action&&<button onClick={action.fn} style={{background:action.color||C.accent,color:"#fff",border:"none",borderRadius:7,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{action.label}</button>}</div>);
const Breadcrumb = ({items}) => (<div style={{display:"flex",gap:6,alignItems:"center",marginBottom:16,flexWrap:"wrap"}}>{items.map((item,i)=>(<span key={i} style={{display:"flex",gap:6,alignItems:"center"}}>{i<items.length-1?<button onClick={item.fn} style={{background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit",padding:0}}>{item.label}</button>:<span style={{color:C.text,fontSize:13,fontWeight:700}}>{item.label}</span>}{i<items.length-1&&<span style={{color:C.muted,fontSize:12}}>›</span>}</span>))}</div>);
const Pill = ({label,active,onClick}) => (<button onClick={onClick} style={{padding:"6px 14px",borderRadius:99,border:`1px solid ${active?C.accent:C.border}`,background:active?C.accent:"#fff",color:active?"#fff":C.sub,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>{label}</button>);
const Btn = ({label,onClick,color=C.accent,small=false,outline=false}) => (<button onClick={onClick} style={{background:outline?"transparent":color,color:outline?color:"#fff",border:outline?`1.5px solid ${color}`:"none",borderRadius:8,padding:small?"6px 12px":"8px 16px",fontWeight:700,fontSize:small?12:13,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>{label}</button>);
const RowCard = ({onClick,children,style={}}) => (<div onClick={onClick} onMouseEnter={onClick?e=>e.currentTarget.style.borderColor=C.accent:null} onMouseLeave={onClick?e=>e.currentTarget.style.borderColor=C.border:null} style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px",cursor:onClick?"pointer":"default",boxShadow:"0 1px 3px rgba(0,0,0,0.04)",marginBottom:10,...style}}>{children}</div>);
const Modal = ({title,onClose,onSave,children,wide=false,noFooter=false}) => (<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}><div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:wide?680:480,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}><div style={{padding:"18px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"#fff",zIndex:1}}><span style={{fontWeight:800,fontSize:16,color:C.text}}>{title}</span><button onClick={onClose} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:C.muted,lineHeight:1}}>×</button></div><div style={{padding:20}}>{children}</div>{!noFooter&&<div style={{padding:"14px 20px",borderTop:`1px solid ${C.border}`,display:"flex",gap:10,justifyContent:"flex-end",position:"sticky",bottom:0,background:"#fff"}}><button onClick={onClose} style={{background:C.raised,border:`1px solid ${C.border}`,color:C.sub,borderRadius:8,padding:"8px 16px",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button><Btn label="Save" onClick={onSave}/></div>}</div></div>);
const FF = ({label,value,onChange,type="text",placeholder="",required=false}) => (<div style={{marginBottom:14}}><label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>{label}{required&&<span style={{color:C.red}}> *</span>}</label>{type==="textarea"?<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={3} style={{width:"100%",background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit",resize:"vertical",boxSizing:"border-box"}}/>:<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{width:"100%",background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}/>}</div>);
const StatCard = ({label,value,sub,color=C.accent,icon}) => (<div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 18px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><div style={{color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>{label}</div><div style={{color,fontSize:26,fontWeight:900,marginTop:4}}>{value}</div>{sub&&<div style={{color:C.muted,fontSize:12,marginTop:2}}>{sub}</div>}</div><span style={{fontSize:28}}>{icon}</span></div></div>);

/* ─── SETTINGS CONTEXT ─── */
const useSettings = () => {
  const [jobStages, setJobStages] = useState(DEFAULT_JOB_STAGES);
  const [jobSubStages, setJobSubStages] = useState(DEFAULT_JOB_SUBSTAGES);
  const [fieldStaff, setFieldStaff] = useState(DEFAULT_FIELD_STAFF);
  const [jobTypes, setJobTypes] = useState(DEFAULT_JOB_TYPES);
  const [reportTemplates, setReportTemplates] = useState(DEFAULT_REPORT_TEMPLATES);
  return { jobStages, setJobStages, jobSubStages, setJobSubStages, fieldStaff, setFieldStaff, jobTypes, setJobTypes, reportTemplates, setReportTemplates };
};

/* ─── LIST MANAGER ─── */
function ListManager({label,items,onChange}) {
  const [open,setOpen]=useState(false);
  const [newItem,setNewItem]=useState("");
  const add=()=>{const v=newItem.trim();if(!v||items.includes(v))return;onChange([...items,v]);setNewItem("");};
  const remove=item=>onChange(items.filter(i=>i!==item));
  const moveUp=idx=>{if(idx===0)return;const a=[...items];[a[idx-1],a[idx]]=[a[idx],a[idx-1]];onChange(a);};
  const moveDown=idx=>{if(idx===items.length-1)return;const a=[...items];[a[idx],a[idx+1]]=[a[idx+1],a[idx]];onChange(a);};
  return(<div style={{marginBottom:14}}><button onClick={()=>setOpen(!open)} style={{background:"none",border:`1px dashed ${open?C.accent:C.border}`,color:open?C.accent:C.sub,borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}><span>⚙️</span>{open?"Hide":"Manage"} {label} list <span style={{fontSize:10,color:C.muted}}>({items.length})</span></button>{open&&(<div style={{background:C.raised,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px",marginTop:8}}><div style={{fontSize:11,color:C.sub,fontWeight:600,marginBottom:10,textTransform:"uppercase",letterSpacing:0.4}}>Changes apply immediately</div><div style={{display:"flex",gap:8,marginBottom:10}}><input value={newItem} onChange={e=>setNewItem(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder={`Add new ${label.toLowerCase()}…`} style={{flex:1,background:"#fff",border:`1px solid ${C.border}`,borderRadius:7,padding:"7px 10px",fontSize:13,color:C.text,fontFamily:"inherit"}}/><button onClick={add} style={{background:C.accent,color:"#fff",border:"none",borderRadius:7,padding:"7px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>+ Add</button></div><div style={{display:"flex",flexDirection:"column",gap:5,maxHeight:200,overflowY:"auto"}}>{items.map((item,i)=>(<div key={item} style={{display:"flex",alignItems:"center",gap:6,background:"#fff",border:`1px solid ${C.border}`,borderRadius:7,padding:"6px 10px"}}><span style={{flex:1,fontSize:13,color:C.text}}>{item}</span><button onClick={()=>moveUp(i)} disabled={i===0} style={{background:"none",border:"none",color:i===0?C.muted:C.sub,cursor:i===0?"default":"pointer",fontSize:12,padding:"0 4px"}}>▲</button><button onClick={()=>moveDown(i)} disabled={i===items.length-1} style={{background:"none",border:"none",color:i===items.length-1?C.muted:C.sub,cursor:i===items.length-1?"default":"pointer",fontSize:12,padding:"0 4px"}}>▼</button><button onClick={()=>remove(item)} style={{background:"none",border:"none",color:"#fca5a5",fontSize:14,cursor:"pointer",padding:"0 2px"}}>✕</button></div>))}</div></div>)}</div>);
}

/* ─── STAGE SELECTOR (inline on job card) ─── */
function StageSelector({job, onUpdate, jobStages, jobSubStages}) {
  const [open, setOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  return(
    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
      {/* Main Stage */}
      <div style={{position:"relative"}}>
        <button onClick={e=>{e.stopPropagation();setOpen(!open);setSubOpen(false);}}
          style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:8,border:`1.5px solid ${C.border}`,background:"#fff",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,color:C.text}}>
          <span style={{width:8,height:8,borderRadius:"50%",background:{"New":"#94a3b8","Scheduled":"#3b82f6","In Progress":"#f97316","On Hold":"#d97706","Completed":"#16a34a","Invoiced":"#7c3aed"}[job.stage]||"#94a3b8",flexShrink:0,display:"inline-block"}}/>
          {job.stage||"Set Stage"} <span style={{fontSize:9,color:C.muted}}>▼</span>
        </button>
        {open&&(
          <div style={{position:"absolute",top:"100%",left:0,zIndex:200,background:"#fff",border:`1px solid ${C.border}`,borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,0.12)",minWidth:160,marginTop:4,overflow:"hidden"}}>
            <div style={{padding:"8px 12px",borderBottom:`1px solid ${C.border}`,fontSize:11,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:0.5}}>Set Stage</div>
            {jobStages.map(s=>(
              <button key={s} onClick={e=>{e.stopPropagation();onUpdate({...job,stage:s});setOpen(false);}}
                style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"9px 12px",border:"none",background:job.stage===s?"#f0f9ff":"#fff",color:C.text,fontWeight:job.stage===s?700:500,fontSize:13,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:{"New":"#94a3b8","Scheduled":"#3b82f6","In Progress":"#f97316","On Hold":"#d97706","Completed":"#16a34a","Invoiced":"#7c3aed"}[s]||"#94a3b8",flexShrink:0}}/>
                {s}{job.stage===s&&<span style={{marginLeft:"auto",color:C.accent}}>✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>
      {/* Sub-Stage */}
      <div style={{position:"relative"}}>
        <button onClick={e=>{e.stopPropagation();setSubOpen(!subOpen);setOpen(false);}}
          style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:8,border:`1.5px dashed ${job.subStage?C.purple:C.border}`,background:job.subStage?"#f5f3ff":"#fff",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:job.subStage?700:500,color:job.subStage?C.purple:C.muted}}>
          {job.subStage||"+ Sub-stage"} <span style={{fontSize:9,color:C.muted}}>▼</span>
        </button>
        {subOpen&&(
          <div style={{position:"absolute",top:"100%",left:0,zIndex:200,background:"#fff",border:`1px solid ${C.border}`,borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,0.12)",minWidth:200,marginTop:4,overflow:"hidden"}}>
            <div style={{padding:"8px 12px",borderBottom:`1px solid ${C.border}`,fontSize:11,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:0.5}}>Set Sub-stage</div>
            <button onClick={e=>{e.stopPropagation();onUpdate({...job,subStage:""});setSubOpen(false);}}
              style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"9px 12px",border:"none",background:!job.subStage?"#f0f9ff":"#fff",color:C.muted,fontWeight:500,fontSize:13,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
              — None
            </button>
            {jobSubStages.map(s=>(
              <button key={s} onClick={e=>{e.stopPropagation();onUpdate({...job,subStage:s});setSubOpen(false);}}
                style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"9px 12px",border:"none",background:job.subStage===s?"#f5f3ff":"#fff",color:job.subStage===s?C.purple:C.text,fontWeight:job.subStage===s?700:500,fontSize:13,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
                {s}{job.subStage===s&&<span style={{marginLeft:"auto",color:C.purple}}>✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── APPLIANCES SECTION ─── */
function AppliancesSection({appliances,onChange,applianceTypes,onTypesChange}) {
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({appType:"",brand:"",model:"",serial:"",condition:""});
  const openAdd=()=>{setForm({appType:applianceTypes[0]||"",brand:"",model:"",serial:"",condition:""});setShowAdd(true);};
  const save=()=>{if(!form.brand)return;onChange([...appliances,{...form,id:uid()}]);setShowAdd(false);};
  const remove=id=>onChange(appliances.filter(a=>a.id!==id));
  return(<div><SectionHead title="🏠 Appliances" count={appliances.length} action={{label:"+ Add",fn:openAdd}}/>{appliances.length===0&&<p style={{color:C.muted,fontSize:13,paddingBottom:8}}>No appliances logged.</p>}{appliances.map(ap=>(<div key={ap.id} style={{background:C.raised,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px",marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div style={{display:"flex",gap:10,alignItems:"flex-start",flex:1,minWidth:0}}><span style={{fontSize:22,flexShrink:0}}>{appIcon(ap.appType)}</span><div style={{minWidth:0}}><div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}><span style={{color:C.text,fontWeight:700,fontSize:13}}>{ap.brand} {ap.model}</span><Badge label={ap.appType} color="blue"/></div>{ap.serial&&<div style={{color:C.sub,fontSize:12,marginTop:2}}>S/N: {ap.serial}</div>}{ap.condition&&<div style={{color:C.orange,fontSize:12,marginTop:3}}>📋 {ap.condition}</div>}</div></div><button onClick={()=>remove(ap.id)} style={{background:"none",border:"none",color:C.muted,fontSize:16,cursor:"pointer",flexShrink:0,marginLeft:8}}>✕</button></div></div>))}{showAdd&&(<Modal title="Add Appliance" onClose={()=>setShowAdd(false)} onSave={save}><ListManager label="Appliance Type" items={applianceTypes} onChange={onTypesChange}/><div style={{marginBottom:14}}><label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Appliance Type <span style={{color:C.red}}>*</span></label><select value={form.appType} onChange={e=>setForm({...form,appType:e.target.value})} style={{width:"100%",background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}>{applianceTypes.map(t=><option key={t}>{t}</option>)}</select></div><FF label="Make / Brand" value={form.brand} onChange={v=>setForm({...form,brand:v})} placeholder="e.g. Bosch, Smeg" required/><FF label="Model Number" value={form.model} onChange={v=>setForm({...form,model:v})} placeholder="e.g. SMS46KI01A"/><FF label="Serial Number" value={form.serial} onChange={v=>setForm({...form,serial:v})} placeholder="e.g. BSH2024-001"/><FF label="Condition / Notes" value={form.condition} onChange={v=>setForm({...form,condition:v})} placeholder="e.g. Leaking from door seal..." type="textarea"/></Modal>)}</div>);
}

/* ─── ADDITIONAL WORKS SECTION ─── */
function AdditionalWorksSection({works,onChange,workPresets,onPresetsChange}) {
  const [showAdd,setShowAdd]=useState(false);
  const [selected,setSelected]=useState("");
  const [custom,setCustom]=useState("");
  const [notes,setNotes]=useState("");
  const [isCustom,setIsCustom]=useState(false);
  const openAdd=()=>{setSelected(workPresets[0]||"");setCustom("");setNotes("");setIsCustom(false);setShowAdd(true);};
  const save=()=>{const desc=isCustom?custom.trim():selected;if(!desc)return;onChange([...works,{id:uid(),description:desc,custom:isCustom,notes}]);setShowAdd(false);};
  const remove=id=>onChange(works.filter(w=>w.id!==id));
  return(<div><SectionHead title="🛠️ Additional Works" count={works.length} action={{label:"+ Add",fn:openAdd}}/>{works.length===0&&<p style={{color:C.muted,fontSize:13,paddingBottom:8}}>No additional works logged.</p>}{works.map(w=>(<div key={w.id} style={{background:C.raised,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px",marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div style={{display:"flex",gap:10,alignItems:"flex-start",flex:1,minWidth:0}}><span style={{fontSize:20,flexShrink:0}}>{workIcon(w.description)}</span><div style={{minWidth:0}}><div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}><span style={{color:C.text,fontWeight:700,fontSize:13}}>{w.description}</span>{w.custom&&<Badge label="Custom" color="purple"/>}</div>{w.notes&&<div style={{color:C.sub,fontSize:12,marginTop:3}}>📝 {w.notes}</div>}</div></div><button onClick={()=>remove(w.id)} style={{background:"none",border:"none",color:C.muted,fontSize:16,cursor:"pointer",flexShrink:0,marginLeft:8}}>✕</button></div></div>))}{showAdd&&(<Modal title="Add Additional Work" onClose={()=>setShowAdd(false)} onSave={save}><div style={{display:"flex",gap:8,marginBottom:14}}><button onClick={()=>setIsCustom(false)} style={{flex:1,padding:"9px",borderRadius:8,border:`2px solid ${!isCustom?C.accent:C.border}`,background:!isCustom?"#eff6ff":"#fff",color:!isCustom?C.accent:C.sub,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Pick from list</button><button onClick={()=>setIsCustom(true)} style={{flex:1,padding:"9px",borderRadius:8,border:`2px solid ${isCustom?C.purple:C.border}`,background:isCustom?"#f5f3ff":"#fff",color:isCustom?C.purple:C.sub,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Custom entry</button></div>{!isCustom?(<><ListManager label="Works Preset" items={workPresets} onChange={onPresetsChange}/><div style={{marginBottom:14}}><label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Select Work Type <span style={{color:C.red}}>*</span></label><div style={{display:"flex",flexDirection:"column",gap:5,maxHeight:220,overflowY:"auto",padding:"2px 0"}}>{workPresets.map(p=>(<label key={p} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,border:`1.5px solid ${selected===p?C.accent:C.border}`,background:selected===p?"#eff6ff":"#fff",cursor:"pointer"}}><input type="radio" name="work" checked={selected===p} onChange={()=>setSelected(p)} style={{accentColor:C.accent}}/><span style={{fontSize:13,fontWeight:selected===p?700:500,color:C.text}}>{workIcon(p)} {p}</span></label>))}</div></div></>):(<FF label="Describe the Work" value={custom} onChange={setCustom} placeholder="e.g. Install rangehood vent to exterior..." required/>)}<FF label="Notes (optional)" value={notes} onChange={setNotes} placeholder="Location, spec, or extra details..." type="textarea"/></Modal>)}</div>);
}


/* ═══════════════════════════════════════════
   JOB DIARY
═══════════════════════════════════════════ */
const DIARY_TYPES = [
  {id:"email",    label:"Email",      icon:"📧", color:"#0ea5e9"},
  {id:"phone",    label:"Phone Call", icon:"📞", color:"#16a34a"},
  {id:"sms",      label:"SMS",        icon:"💬", color:"#f97316"},
  {id:"whatsapp", label:"WhatsApp",   icon:"💚", color:"#25d366"},
  {id:"photo",    label:"Photo",      icon:"📷", color:"#7c3aed"},
  {id:"pdf",      label:"PDF",        icon:"📄", color:"#dc2626"},
  {id:"video",    label:"Video",      icon:"🎥", color:"#d97706"},
  {id:"visit",    label:"Site Visit", icon:"🔧", color:"#0891b2"},
];

function JobDiary({job, onUpdate, onOpenAttachment}){
  const diary = job.diary || [];
  const [filter, setFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [entryType, setEntryType] = useState("email");
  const [direction, setDirection] = useState("outbound");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");
  const [subject, setSubject] = useState("");
  const [duration, setDuration] = useState("");
  const [files, setFiles] = useState([]); // [{name,type,data,mime}]
  const [lightbox, setLightbox] = useState(null);
  const fileRef = useState(null);

  const isMedia = id => ["photo","pdf","video"].includes(id);
  const isComms = id => ["email","phone","sms","whatsapp"].includes(id);

  const handleFiles = e => {
    const chosen = Array.from(e.target.files);
    chosen.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        setFiles(prev => [...prev, {
          id: uid(),
          name: file.name,
          mime: file.type,
          size: file.size,
          data: ev.target.result, // base64 data URL
        }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeFile = id => setFiles(files.filter(f => f.id !== id));

  const resetForm = () => {
    setEntryType("email"); setDirection("outbound"); setContact("");
    setNotes(""); setSubject(""); setDuration(""); setFiles([]);
  };

  const saveEntry = () => {
    if(isComms(entryType) && !notes && files.length === 0) return;
    if(isMedia(entryType) && files.length === 0) return;
    const entry = {
      id: uid(),
      type: entryType,
      direction,
      contact,
      subject,
      notes,
      duration,
      files,
      ts: new Date().toISOString(),
    };
    onUpdate({...job, diary: [entry, ...diary]});
    resetForm();
    setShowAdd(false);
  };

  const filtered = filter === "All" ? diary : diary.filter(e => e.type === filter);
  const typeInfo = id => DIARY_TYPES.find(t => t.id === id) || DIARY_TYPES[0];

  return(
    <Card style={{marginBottom:14}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontWeight:700,fontSize:14,color:C.text}}>📒 Job Diary</span>
          <span style={{background:C.raised,border:`1px solid ${C.border}`,color:C.sub,borderRadius:99,padding:"1px 8px",fontSize:11,fontWeight:700}}>{diary.length}</span>
        </div>
        <Btn label="+ Log Entry" onClick={()=>{resetForm();setShowAdd(true);}} small/>
      </div>

      {/* Type filter pills */}
      <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:4,flexWrap:"nowrap"}}>
        <Pill label="All" active={filter==="All"} onClick={()=>setFilter("All")}/>
        {DIARY_TYPES.map(t=>(
          <Pill key={t.id} label={`${t.icon} ${t.label}`} active={filter===t.id} onClick={()=>setFilter(t.id)}/>
        ))}
      </div>

      {/* Diary feed */}
      {filtered.length===0 && (
        <div style={{textAlign:"center",padding:"28px 0",color:C.muted}}>
          <div style={{fontSize:28,marginBottom:6}}>📒</div>
          <div style={{fontSize:13,fontWeight:600}}>{filter==="All"?"No entries yet — log the first one":"No entries of this type"}</div>
        </div>
      )}

      {filtered.map(entry => {
        const ti = typeInfo(entry.type);
        const isOut = entry.direction === "outbound";
        return(
          <div key={entry.id} style={{borderLeft:`3px solid ${ti.color}`,background:C.raised,borderRadius:"0 10px 10px 0",padding:"12px 14px",marginBottom:10}}>
            {/* Top row */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:6}}>
              <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                <span style={{fontSize:16}}>{ti.icon}</span>
                <span style={{fontWeight:700,fontSize:13,color:C.text}}>{ti.label}</span>
                {isComms(entry.type) && (
                  <span style={{background:isOut?"#eff6ff":"#f0fdf4",color:isOut?C.accent:C.green,border:`1px solid ${isOut?"#bae6fd":"#bbf7d0"}`,borderRadius:99,padding:"1px 8px",fontSize:11,fontWeight:700}}>
                    {isOut?"↑ Outbound":"↓ Inbound"}
                  </span>
                )}
                {entry.duration && <span style={{color:C.sub,fontSize:12}}>⏱ {entry.duration}</span>}
                {entry.source==="field_app" && <span style={{background:"#f0fdf4",color:"#15803d",border:"1px solid #bbf7d0",borderRadius:99,padding:"1px 7px",fontSize:10,fontWeight:700}}>📱 Field App</span>}
              </div>
              <span style={{color:C.muted,fontSize:11,whiteSpace:"nowrap",flexShrink:0}}>{fmtTs(entry.ts)}</span>
            </div>

            {/* Contact */}
            {entry.contact && (
              <div style={{color:C.sub,fontSize:12,marginBottom:4}}>
                👤 {entry.contact}
              </div>
            )}

            {/* Subject — visits show outcome, emails show Re: */}
            {entry.subject && (
              <div style={{color:C.text,fontSize:13,fontWeight:600,marginBottom:4}}>
                {entry.type==="visit" ? entry.subject : `Re: ${entry.subject}`}
              </div>
            )}

            {/* Notes/body */}
            {entry.notes && (
              <div style={{color:C.text,fontSize:13,lineHeight:1.5,whiteSpace:"pre-wrap",marginBottom:entry.files?.length?8:0}}>
                {entry.notes}
              </div>
            )}

            {/* Attached files */}
            {entry.files?.length > 0 && (
              <div style={{marginTop:8}}>
                {/* Photos inline */}
                {entry.files.filter(f=>f.mime?.startsWith("image/")).length > 0 && (
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
                    {entry.files.filter(f=>f.mime?.startsWith("image/")).map(f=>(
                      <div key={f.id} onClick={()=>{ const imgs=entry.files.filter(x=>x.mime?.startsWith("image/")); onOpenAttachment?onOpenAttachment(f,entry,imgs):setLightbox(f); }}
                        style={{cursor:"zoom-in",borderRadius:8,overflow:"hidden",border:`2px solid ${C.border}`,width:80,height:80,flexShrink:0,transition:"border-color 0.15s"}}
                        onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent}
                        onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                        <img src={f.data} alt={f.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                      </div>
                    ))}
                  </div>
                )}
                {/* PDFs, videos, other files */}
                {entry.files.filter(f=>!f.mime?.startsWith("image/")).map(f=>{
                  const isPdf = f.mime==="application/pdf";
                  const isVid = f.mime?.startsWith("video/");
                  return(
                    <div key={f.id} onClick={()=>onOpenAttachment?onOpenAttachment(f,entry):null}
                      style={{display:"flex",alignItems:"center",gap:10,background:"#fff",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",marginBottom:6,cursor:onOpenAttachment?"pointer":"default",transition:"border-color 0.15s"}}
                      onMouseEnter={e=>{if(onOpenAttachment)e.currentTarget.style.borderColor=C.accent}}
                      onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                      <span style={{fontSize:20}}>{isPdf?"📄":isVid?"🎥":"📎"}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{color:C.text,fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</div>
                        <div style={{color:C.muted,fontSize:11}}>{fileSizeFmt(f.size)}{onOpenAttachment?" · click to open":""}</div>
                      </div>
                      {!onOpenAttachment && isVid && (
                        <video controls style={{height:60,borderRadius:6,maxWidth:120}}>
                          <source src={f.data} type={f.mime}/>
                        </video>
                      )}
                      {!onOpenAttachment && isPdf && (
                        <a href={f.data} download={f.name} style={{color:C.accent,fontSize:11,fontWeight:700,textDecoration:"none",border:`1px solid ${C.accent}`,borderRadius:6,padding:"4px 8px"}}>Download</a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Add entry modal */}
      {showAdd && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:560,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
            <div style={{padding:"18px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"#fff",zIndex:1}}>
              <span style={{fontWeight:800,fontSize:16,color:C.text}}>Log Diary Entry</span>
              <button onClick={()=>{resetForm();setShowAdd(false);}} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:C.muted}}>×</button>
            </div>
            <div style={{padding:"18px 20px"}}>

              {/* Type selector */}
              <div style={{marginBottom:16}}>
                <label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>Entry Type</label>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {DIARY_TYPES.filter(t=>t.id!=="visit").map(t=>(
                    <button key={t.id} onClick={()=>setEntryType(t.id)}
                      style={{display:"flex",alignItems:"center",gap:5,padding:"7px 13px",borderRadius:99,border:`2px solid ${entryType===t.id?t.color:C.border}`,background:entryType===t.id?t.color+"15":"#fff",color:entryType===t.id?t.color:C.sub,fontWeight:entryType===t.id?700:500,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
                      <span>{t.icon}</span>{t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Direction (comms only) */}
              {isComms(entryType) && (
                <div style={{marginBottom:14}}>
                  <label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Direction</label>
                  <div style={{display:"flex",gap:8}}>
                    {["outbound","inbound"].map(d=>(
                      <button key={d} onClick={()=>setDirection(d)}
                        style={{flex:1,padding:"9px",borderRadius:8,border:`2px solid ${direction===d?C.accent:C.border}`,background:direction===d?"#eff6ff":"#fff",color:direction===d?C.accent:C.sub,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
                        {d==="outbound"?"↑ Outbound":"↓ Inbound"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact */}
              <div style={{marginBottom:14}}>
                <label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Contact / Person</label>
                <input value={contact} onChange={e=>setContact(e.target.value)} placeholder="e.g. Karen Lim, tenant Wei Liu…"
                  style={{width:"100%",background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}/>
              </div>

              {/* Subject (email only) */}
              {entryType==="email" && (
                <div style={{marginBottom:14}}>
                  <label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Subject</label>
                  <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="e.g. Quote approval for JOB-1007"
                    style={{width:"100%",background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}/>
                </div>
              )}

              {/* Duration (phone/call) */}
              {(entryType==="phone"||entryType==="whatsapp") && (
                <div style={{marginBottom:14}}>
                  <label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Duration</label>
                  <input value={duration} onChange={e=>setDuration(e.target.value)} placeholder="e.g. 5 mins"
                    style={{width:"100%",background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}/>
                </div>
              )}

              {/* Notes */}
              {(isComms(entryType)||entryType==="photo"||entryType==="pdf"||entryType==="video") && (
                <div style={{marginBottom:14}}>
                  <label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>
                    {entryType==="email"?"Email Body":entryType==="phone"||entryType==="whatsapp"?"Call Notes":"Notes / Caption"}
                  </label>
                  <textarea value={notes} onChange={e=>setNotes(e.target.value)}
                    placeholder={entryType==="email"?"Paste email body or summarise…":entryType==="phone"?"What was discussed…":entryType==="sms"||entryType==="whatsapp"?"Message content…":"Caption or description…"}
                    rows={4} style={{width:"100%",background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit",resize:"vertical",boxSizing:"border-box"}}/>
                </div>
              )}

              {/* File upload */}
              <div style={{marginBottom:14}}>
                <label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>
                  {entryType==="photo"?"Attach Photos":entryType==="pdf"?"Attach PDFs":entryType==="video"?"Attach Videos":"Attach Files (optional)"}
                </label>
                <label style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"16px",border:`2px dashed ${C.border}`,borderRadius:10,cursor:"pointer",background:C.raised,color:C.sub,fontSize:13,fontWeight:600}}>
                  <span style={{fontSize:20}}>
                    {entryType==="photo"?"📷":entryType==="pdf"?"📄":entryType==="video"?"🎥":"📎"}
                  </span>
                  Click to attach {entryType==="photo"?"photos":entryType==="pdf"?"PDFs":entryType==="video"?"videos":"files"}
                  <input type="file" multiple
                    accept={entryType==="photo"?"image/*":entryType==="pdf"?"application/pdf":entryType==="video"?"video/*":"*"}
                    onChange={handleFiles} style={{display:"none"}}/>
                </label>
                {/* File previews */}
                {files.length > 0 && (
                  <div style={{marginTop:10,display:"flex",flexWrap:"wrap",gap:8}}>
                    {files.map(f=>(
                      <div key={f.id} style={{position:"relative"}}>
                        {f.mime?.startsWith("image/") ? (
                          <div style={{width:72,height:72,borderRadius:8,overflow:"hidden",border:`1px solid ${C.border}`}}>
                            <img src={f.data} alt={f.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                          </div>
                        ):(
                          <div style={{display:"flex",alignItems:"center",gap:6,background:"#fff",border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 10px",maxWidth:180}}>
                            <span style={{fontSize:16}}>{f.mime==="application/pdf"?"📄":f.mime?.startsWith("video/")?"🎥":"📎"}</span>
                            <span style={{fontSize:11,color:C.sub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</span>
                          </div>
                        )}
                        <button onClick={()=>removeFile(f.id)} style={{position:"absolute",top:-6,right:-6,width:18,height:18,borderRadius:"50%",background:C.red,border:"none",color:"#fff",fontSize:10,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
            <div style={{padding:"14px 20px",borderTop:`1px solid ${C.border}`,display:"flex",gap:10,justifyContent:"flex-end",position:"sticky",bottom:0,background:"#fff"}}>
              <button onClick={()=>{resetForm();setShowAdd(false);}} style={{background:C.raised,border:`1px solid ${C.border}`,color:C.sub,borderRadius:8,padding:"8px 16px",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
              <Btn label="Save Entry" onClick={saveEntry}/>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ─── JOBS SECTION ─── */
function JobsSection({agent,onUpdate,settings}) {
  const {jobStages,jobSubStages,fieldStaff,jobTypes,setJobTypes} = settings;
  const [filter,setFilter]=useState("All");
  const [showJob,setShowJob]=useState(null);
  const [showAddJob,setShowAddJob]=useState(false);
  const [showAddTenant,setShowAddTenant]=useState(false);
  const [newJob,setNewJob]=useState({ref:"",type:"",address:"",description:"",tech:"",keyMethod:"",keyNotes:"",status:"Open",stage:"New",subStage:""});
  const [newTenant,setNewTenant]=useState({name:"",email:"",phone:""});
  const [applianceTypes,setApplianceTypes]=useState(DEFAULT_APPLIANCE_TYPES);
  const [workPresets,setWorkPresets]=useState(DEFAULT_WORK_PRESETS);
  const jobs=agent.jobs||[];
  const updateJob=updated=>{onUpdate({...agent,jobs:jobs.map(j=>j.id===updated.id?updated:j)});setShowJob(updated);};
  // Recall: find existing recalls for base number, append next letter (a, b, c...)
  const createRecall=(baseJob)=>{
    const baseNum=baseJob.ref.replace(/[a-z]+$/,""); // strip any existing suffix
    const existing=jobs.filter(j=>j.ref===baseNum||j.ref.startsWith(baseNum+"a")||j.ref.match(new RegExp(`^${baseNum}[a-z]$`)));
    const suffixes=existing.map(j=>{const s=j.ref.replace(baseNum,"");return s||"";}).filter(s=>s);
    const nextChar=suffixes.length===0?"a":String.fromCharCode(97+suffixes.length);
    const recall={...baseJob,id:uid(),ref:`${baseNum}${nextChar}`,status:"Open",closedDate:null,createdDate:new Date().toISOString().split("T")[0],stage:"New",subStage:"",tenants:[...baseJob.tenants],appliances:[...baseJob.appliances],additionalWorks:[],diary:[]};
    onUpdate({...agent,jobs:[...jobs,recall]});
    setShowJob(null);
  };
  const saveJob=()=>{
    if(!newJob.address)return;
    const type=newJob.type||jobTypes[0]||"";
    const j={...newJob,ref:nextJobRef(),type,id:uid(),createdDate:new Date().toISOString().split("T")[0],closedDate:newJob.status==="Closed"?new Date().toISOString().split("T")[0]:null,tenants:[],appliances:[],additionalWorks:[],diary:[]};
    onUpdate({...agent,jobs:[...jobs,j]});
    setNewJob({ref:"",type:"",address:"",description:"",tech:"",keyMethod:"",keyNotes:"",status:"Open",stage:"New",subStage:""});
    setShowAddJob(false);
  };
  const saveTenant=()=>{if(!newTenant.name)return;const t={...newTenant,id:uid()};updateJob({...showJob,tenants:[...showJob.tenants,t]});setNewTenant({name:"",email:"",phone:""});setShowAddTenant(false);};
  const filtered=filter==="All"?jobs:jobs.filter(j=>j.stage===filter);
  const techNames = fieldStaff.map(f=>f.name);

  if(showJob){
    return(<div>
      <button onClick={()=>setShowJob(null)} style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:8,padding:"6px 14px",fontSize:13,cursor:"pointer",marginBottom:16,fontFamily:"inherit"}}>← Back to Jobs</button>
      <Card style={{marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12,flexWrap:"wrap",gap:8}}>
          <div><div style={{color:C.accent,fontWeight:800,fontSize:13}}>{showJob.ref}</div><div style={{color:C.text,fontWeight:800,fontSize:16,marginTop:2}}>{showJob.address}</div></div>
        </div>
        {/* Stage + SubStage inline */}
        <div style={{marginBottom:14,paddingBottom:14,borderBottom:`1px solid ${C.border}`}}>
          <div style={{color:C.sub,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>Stage</div>
          <StageSelector job={showJob} onUpdate={updateJob} jobStages={jobStages} jobSubStages={jobSubStages}/>
        </div>
        <Field label="Type" value={showJob.type}/>
        <Field label="Description" value={showJob.description||"—"}/>
        <Field label="Technician" value={showJob.tech||"Unassigned"}/>
        <Field label="Key Access" value={showJob.keyMethod==="tenant"?"🧑 Tenant to give access":showJob.keyMethod==="office"?"🏢 Collect from office":showJob.keyMethod==="other"?"🔑 Other":"—"}/>
        {showJob.keyNotes&&<Field label="Key Notes" value={showJob.keyNotes}/>}
        <Field label="Created" value={showJob.createdDate}/>
        {showJob.closedDate&&<Field label="Closed" value={showJob.closedDate}/>}
        <div style={{display:"flex",gap:8,marginTop:14,flexWrap:"wrap"}}>
          {showJob.status==="Open"&&<Btn label="✓ Mark as Closed" onClick={()=>updateJob({...showJob,status:"Closed",closedDate:new Date().toISOString().split("T")[0]})} color={C.orange} small/>}
          <Btn label="🔁 Create Recall" onClick={()=>createRecall(showJob)} color={C.purple} small outline/>
        </div>
      </Card>
      <Card style={{marginBottom:14}}><SectionHead title="👥 Tenants" count={showJob.tenants.length} action={{label:"+ Add Tenant",fn:()=>setShowAddTenant(true)}}/>{showJob.tenants.length===0&&<p style={{color:C.muted,fontSize:13}}>No tenants linked yet.</p>}{showJob.tenants.map(t=>(<div key={t.id} style={{display:"flex",gap:12,alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}><Avatar name={t.name} size={36} bg="#dcfce7" fg="#15803d"/><div><div style={{color:C.text,fontWeight:700,fontSize:13}}>{t.name}</div>{t.email&&<div style={{color:C.sub,fontSize:12}}>{t.email}</div>}{t.phone&&<div style={{color:C.sub,fontSize:12}}>{t.phone}</div>}</div></div>))}</Card>
      <Card style={{marginBottom:14}}><AppliancesSection appliances={showJob.appliances||[]} onChange={ap=>updateJob({...showJob,appliances:ap})} applianceTypes={applianceTypes} onTypesChange={setApplianceTypes}/></Card>
      <Card style={{marginBottom:14}}><AdditionalWorksSection works={showJob.additionalWorks||[]} onChange={ws=>updateJob({...showJob,additionalWorks:ws})} workPresets={workPresets} onPresetsChange={setWorkPresets}/></Card>
      <JobDiary job={showJob} onUpdate={updateJob}/>
      {showAddTenant&&(<Modal title="Add Tenant to Job" onClose={()=>setShowAddTenant(false)} onSave={saveTenant}><FF label="Full Name" value={newTenant.name} onChange={v=>setNewTenant({...newTenant,name:v})} placeholder="e.g. John Smith" required/><FF label="Email" value={newTenant.email} onChange={v=>setNewTenant({...newTenant,email:v})} placeholder="john@email.com" type="email"/><FF label="Phone" value={newTenant.phone} onChange={v=>setNewTenant({...newTenant,phone:v})} placeholder="0400 000 000"/></Modal>)}
    </div>);
  }

  return(<div>
    <SectionHead title="Jobs" count={jobs.length} action={{label:"+ New Job",fn:()=>{setNewJob({ref:"",type:jobTypes[0]||"",address:"",description:"",tech:"",keyMethod:"",keyNotes:"",status:"Open",stage:"New",subStage:""});setShowAddJob(true);}}}/>
    <div style={{display:"flex",gap:8,marginBottom:14,overflowX:"auto",paddingBottom:4}}>
      <Pill label="All" active={filter==="All"} onClick={()=>setFilter("All")}/>
      {jobStages.map(s=><Pill key={s} label={s} active={filter===s} onClick={()=>setFilter(s)}/>)}
    </div>
    {filtered.length===0&&<p style={{color:C.muted,fontSize:13,padding:"8px 0"}}>No jobs found.</p>}
    {filtered.map(job=>{
      const apCount=(job.appliances||[]).length,wkCount=(job.additionalWorks||[]).length;
      return(<RowCard key={job.id} onClick={()=>setShowJob(job)}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{flex:1,minWidth:0,marginRight:10}}>
            <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
              <span style={{color:C.accent,fontWeight:800,fontSize:13}}>{job.ref}</span>
              <Badge label={job.type} color={job.type==="HVAC"?"blue":job.type==="Plumbing"?"purple":"orange"}/>
              {job.stage&&<Badge label={job.stage} color={stageColor(job.stage)}/>}
              {job.subStage&&<Badge label={job.subStage} color="purple"/>}
            </div>
            <div style={{color:C.text,fontSize:13,fontWeight:600,marginTop:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{job.address}</div>
            <div style={{color:C.sub,fontSize:12,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{job.description}</div>
            <div style={{display:"flex",gap:10,marginTop:6,fontSize:12,color:C.sub,flexWrap:"wrap"}}>
              <span>👷 {job.tech||"Unassigned"}</span>
              <span>👥 {job.tenants.length}</span>
              {apCount>0&&<span>🏠 {apCount} appliance{apCount!==1?"s":""}</span>}
              {wkCount>0&&<span>🛠️ {wkCount} work{wkCount!==1?"s":""}</span>}
            </div>
          </div>
        </div>
      </RowCard>);
    })}
    {showAddJob&&(
      <Modal title="New Job" onClose={()=>setShowAddJob(false)} onSave={saveJob}>
        <div style={{background:"#eff6ff",border:`1px solid ${C.accent}`,borderRadius:8,padding:"8px 12px",marginBottom:14,fontSize:12,color:C.accent,fontWeight:600}}>🔢 Number assigned automatically (e.g. 1007, 1007a for recalls)</div>
        <ListManager label="Job Type" items={jobTypes} onChange={setJobTypes}/>
        <div style={{marginBottom:14}}><label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Job Type</label><select value={newJob.type||jobTypes[0]} onChange={e=>setNewJob({...newJob,type:e.target.value})} style={{width:"100%",background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}>{jobTypes.map(t=><option key={t}>{t}</option>)}</select></div>
        <FF label="Property Address" value={newJob.address} onChange={v=>setNewJob({...newJob,address:v})} placeholder="e.g. 22 Oak St, Parramatta NSW" required/>
        <FF label="Description" value={newJob.description} onChange={v=>setNewJob({...newJob,description:v})} placeholder="Describe the work needed..." type="textarea"/>
        {/* Stage */}
        <div style={{marginBottom:14}}><label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Stage</label><select value={newJob.stage} onChange={e=>setNewJob({...newJob,stage:e.target.value})} style={{width:"100%",background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}>{jobStages.map(s=><option key={s}>{s}</option>)}</select></div>
        {/* Sub-Stage */}
        <div style={{marginBottom:14}}><label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Sub-stage (optional)</label><select value={newJob.subStage} onChange={e=>setNewJob({...newJob,subStage:e.target.value})} style={{width:"100%",background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}><option value="">— None —</option>{jobSubStages.map(s=><option key={s}>{s}</option>)}</select></div>
        {/* Technician from field staff */}
        <div style={{marginBottom:14}}><label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Assigned Field Staff</label><select value={newJob.tech} onChange={e=>setNewJob({...newJob,tech:e.target.value})} style={{width:"100%",background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}><option value="">— Unassigned —</option>{fieldStaff.filter(f=>f.status==="Active").map(f=><option key={f.id} value={f.name}>{f.name} – {f.role}</option>)}</select></div>
        <div style={{marginBottom:14}}><label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Key Access</label><div style={{display:"flex",flexDirection:"column",gap:6}}>{[{val:"tenant",label:"🧑 Tenant to give access"},{val:"office",label:"🏢 Collect from office"},{val:"other",label:"🔑 Other"}].map(opt=>(<label key={opt.val} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:8,border:`1.5px solid ${newJob.keyMethod===opt.val?C.accent:C.border}`,background:newJob.keyMethod===opt.val?"#eff6ff":"#fff",cursor:"pointer"}}><input type="radio" name="keyMethod" checked={newJob.keyMethod===opt.val} onChange={()=>setNewJob({...newJob,keyMethod:opt.val})} style={{accentColor:C.accent}}/><span style={{fontSize:13,fontWeight:newJob.keyMethod===opt.val?700:500,color:C.text}}>{opt.label}</span></label>))}</div>{newJob.keyMethod&&<textarea value={newJob.keyNotes||""} onChange={e=>setNewJob({...newJob,keyNotes:e.target.value})} placeholder={newJob.keyMethod==="tenant"?"e.g. Call 30 mins prior…":newJob.keyMethod==="office"?"e.g. Ask for Maria at front desk…":"e.g. Lockbox code 4421…"} rows={2} style={{width:"100%",marginTop:8,background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit",resize:"vertical",boxSizing:"border-box"}}/>}</div>
        <div style={{marginBottom:14}}><label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Status</label><select value={newJob.status} onChange={e=>setNewJob({...newJob,status:e.target.value})} style={{width:"100%",background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}><option>Open</option><option>Closed</option></select></div>
      </Modal>
    )}
  </div>);
}

/* ═══════════════════════════════════════════
   SETTINGS TAB
═══════════════════════════════════════════ */
function SettingsTab({settings}) {
  const {jobStages,setJobStages,jobSubStages,setJobSubStages,fieldStaff,setFieldStaff,jobTypes,setJobTypes,reportTemplates,setReportTemplates} = settings;
  const [section,setSection]=useState("stages");
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState({});

  const saveStaff=()=>{
    if(!form.name)return;
    setFieldStaff([...fieldStaff,{id:uid(),name:form.name,role:form.role||"",phone:form.phone||"",email:form.email||"",trades:(form.trades||"").split(",").map(s=>s.trim()).filter(Boolean),status:"Active"}]);
    setModal(null);setForm({});
  };
  const toggleStaffStatus=id=>setFieldStaff(fieldStaff.map(f=>f.id===id?{...f,status:f.status==="Active"?"Inactive":"Active"}:f));
  const removeStaff=id=>setFieldStaff(fieldStaff.filter(f=>f.id!==id));

  const sections=[{id:"stages",icon:"🎯",label:"Job Stages"},{id:"substages",icon:"🏷️",label:"Sub-stages"},{id:"staff",icon:"👷",label:"Field Staff"},{id:"jobtypes",icon:"🔧",label:"Job Types"},{id:"reports",icon:"📋",label:"Report Templates"}];

  return(<div>
    <div style={{marginBottom:20}}><h2 style={{fontSize:18,fontWeight:800,color:C.text}}>Settings</h2><p style={{color:C.sub,fontSize:12,marginTop:2}}>Manage lists, field staff, and job configuration</p></div>
    <div style={{display:"flex",gap:8,marginBottom:20,overflowX:"auto",paddingBottom:4}}>
      {sections.map(s=>(
        <button key={s.id} onClick={()=>setSection(s.id)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:99,border:`1.5px solid ${section===s.id?C.accent:C.border}`,background:section===s.id?"#eff6ff":"#fff",color:section===s.id?C.accent:C.sub,fontWeight:section===s.id?700:600,fontSize:13,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
          <span>{s.icon}</span>{s.label}
        </button>
      ))}
    </div>

    {section==="stages"&&(
      <Card>
        <SectionHead title="🎯 Job Stages"/>
        <p style={{color:C.sub,fontSize:13,marginBottom:14}}>These stages appear on all jobs. Drag to reorder. Changes take effect across the whole app immediately.</p>
        <ListManager label="Job Stage" items={jobStages} onChange={setJobStages}/>
        <div style={{marginTop:8}}>
          <div style={{color:C.sub,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:10}}>Current Stages</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {jobStages.map((s,i)=>(
              <div key={s} style={{display:"flex",alignItems:"center",gap:8,background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px"}}>
                <span style={{color:C.muted,fontSize:11,fontWeight:700}}>#{i+1}</span>
                <span style={{width:8,height:8,borderRadius:"50%",background:{"New":"#94a3b8","Scheduled":"#3b82f6","In Progress":"#f97316","On Hold":"#d97706","Completed":"#16a34a","Invoiced":"#7c3aed"}[s]||"#94a3b8",display:"inline-block"}}/>
                <span style={{fontSize:13,fontWeight:700,color:C.text}}>{s}</span>
                <Badge label={stageColor(s)} color={stageColor(s)}/>
              </div>
            ))}
          </div>
        </div>
      </Card>
    )}

    {section==="substages"&&(
      <Card>
        <SectionHead title="🏷️ Sub-stages"/>
        <p style={{color:C.sub,fontSize:13,marginBottom:14}}>Sub-stages are a shared pool that can be applied to any job regardless of its main stage. Use them to track more granular status like "Parts ordered" or "Waiting on tenant".</p>
        <ListManager label="Sub-stage" items={jobSubStages} onChange={setJobSubStages}/>
        <div style={{marginTop:8}}>
          <div style={{color:C.sub,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:10}}>Current Sub-stages</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {jobSubStages.map(s=>(
              <span key={s} style={{background:"#f5f3ff",border:"1px solid #ede9fe",color:C.purple,borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:700}}>{s}</span>
            ))}
            {jobSubStages.length===0&&<span style={{color:C.muted,fontSize:13}}>No sub-stages yet. Add some above.</span>}
          </div>
        </div>
      </Card>
    )}

    {section==="staff"&&(
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div><span style={{color:C.text,fontWeight:700,fontSize:14}}>👷 Field Staff</span><span style={{color:C.sub,fontSize:12,marginLeft:8}}>{fieldStaff.filter(f=>f.status==="Active").length} active</span></div>
          <Btn label="+ Add Staff" onClick={()=>{setModal("staff");setForm({});}}/>
        </div>
        {fieldStaff.map(f=>(
          <div key={f.id} style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px",marginBottom:10,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
            <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
              <Avatar name={f.name} size={42} bg={f.status==="Active"?"#dbeafe":"#f1f5f9"} fg={f.status==="Active"?"#1d4ed8":"#94a3b8"}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:6}}>
                  <div>
                    <div style={{color:C.text,fontWeight:700,fontSize:14}}>{f.name}</div>
                    <div style={{color:C.sub,fontSize:12,marginTop:1}}>{f.role}</div>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <Badge label={f.status} color={f.status==="Active"?"green":"gray"}/>
                  </div>
                </div>
                <div style={{display:"flex",gap:12,marginTop:8,fontSize:12,color:C.sub,flexWrap:"wrap"}}>
                  {f.phone&&<span>📞 {f.phone}</span>}
                  {f.email&&<span>✉️ {f.email}</span>}
                </div>
                {f.trades.length>0&&(
                  <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
                    {f.trades.map(t=><Badge key={t} label={t} color={t==="HVAC"?"blue":t==="Plumbing"?"purple":"orange"}/>)}
                  </div>
                )}
                <div style={{display:"flex",gap:8,marginTop:12}}>
                  <button onClick={()=>toggleStaffStatus(f.id)} style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:7,padding:"5px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>
                    {f.status==="Active"?"Set Inactive":"Set Active"}
                  </button>
                  <button onClick={()=>removeStaff(f.id)} style={{background:"none",border:`1px solid #fecaca`,color:C.red,borderRadius:7,padding:"5px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>Remove</button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {modal==="staff"&&(
          <Modal title="Add Field Staff" onClose={()=>setModal(null)} onSave={saveStaff}>
            <FF label="Full Name" value={form.name||""} onChange={v=>setForm({...form,name:v})} placeholder="e.g. Sam Torres" required/>
            <FF label="Role / Trade Title" value={form.role||""} onChange={v=>setForm({...form,role:v})} placeholder="e.g. Plumber, Electrician, HVAC Technician"/>
            <FF label="Phone" value={form.phone||""} onChange={v=>setForm({...form,phone:v})} placeholder="0400 000 000"/>
            <FF label="Email" value={form.email||""} onChange={v=>setForm({...form,email:v})} placeholder="staff@fieldpro.com" type="email"/>
            <FF label="Trades (comma separated)" value={form.trades||""} onChange={v=>setForm({...form,trades:v})} placeholder="e.g. Plumbing, HVAC"/>
          </Modal>
        )}
      </div>
    )}

    {section==="jobtypes"&&(
      <Card>
        <SectionHead title="🔧 Job Types"/>
        <p style={{color:C.sub,fontSize:13,marginBottom:14}}>Job types appear in all job forms and filters across the app.</p>
        <ListManager label="Job Type" items={jobTypes} onChange={setJobTypes}/>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:8}}>
          {jobTypes.map(t=><Badge key={t} label={t} color={t==="HVAC"?"blue":t==="Plumbing"?"purple":"orange"}/>)}
        </div>
      </Card>
    )}

    {section==="reports"&&(
      <Card>
        <SectionHead title="📋 Report Templates"/>
        <p style={{color:C.sub,fontSize:13,marginBottom:16}}>Build report formats for technicians to fill on-site. Each template can have custom fields — Yes/No, multiple choice, text, and photo capture.</p>
        <ReportTemplateEditor reportTemplates={reportTemplates} setReportTemplates={setReportTemplates} jobTypes={jobTypes}/>
      </Card>
    )}
  </div>);
}

/* ═══════════════════════════════════════════
   CONTACTS TAB
═══════════════════════════════════════════ */
function CustomersTab({settings, companies, setCompanies}) {
  const [view,setView]=useState("list");
  const [company,setCompany]=useState(null);
  const [branch,setBranch]=useState(null);
  const [agent,setAgent]=useState(null);
  const [search,setSearch]=useState("");
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState({});
  const filtered=companies.filter(c=>c.name.toLowerCase().includes(search.toLowerCase()));
  const sync=newCs=>{setCompanies(newCs);if(company){const nc=newCs.find(c=>c.id===company.id);if(nc)setCompany(nc);}if(branch&&company){const nc=newCs.find(c=>c.id===company.id);if(nc){const nb=nc.branches.find(b=>b.id===branch.id);if(nb)setBranch(nb);}}if(agent&&branch&&company){const nc=newCs.find(c=>c.id===company.id);const nb=nc?.branches.find(b=>b.id===branch.id);if(nb){const na=nb.agents.find(a=>a.id===agent.id);if(na)setAgent(na);}}};
  const saveCo=()=>{if(!form.name)return;sync([...companies,{id:uid(),name:form.name,abn:form.abn||"",phone:form.phone||"",email:form.email||"",website:form.website||"",status:"Active",branches:[]}]);setModal(null);};
  const saveBranch=()=>{if(!form.name)return;const b={id:uid(),name:form.name,address:form.address||"",phone:form.phone||"",email:form.email||"",billing:{name:form.billingName||"",email:form.billingEmail||"",phone:form.billingPhone||""},agents:[]};sync(companies.map(c=>c.id===company.id?{...c,branches:[...c.branches,b]}:c));setModal(null);};
  const saveAgent=()=>{if(!form.name)return;const a={id:uid(),name:form.name,email:form.email||"",phone:form.phone||"",properties:0,jobs:[]};sync(companies.map(c=>c.id===company.id?{...c,branches:c.branches.map(b=>b.id===branch.id?{...b,agents:[...b.agents,a]}:b)}:c));setModal(null);};
  const updateAgent=ua=>{sync(companies.map(c=>c.id===company.id?{...c,branches:c.branches.map(b=>b.id===branch.id?{...b,agents:b.agents.map(a=>a.id===ua.id?ua:a)}:b)}:c));setAgent(ua);};

  if(view==="list")return(<div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div><h2 style={{fontSize:18,fontWeight:800,color:C.text}}>Companies</h2><p style={{color:C.sub,fontSize:12,marginTop:2}}>{companies.length} companies registered</p></div><Btn label="+ Add Company" onClick={()=>{setModal("co");setForm({});}}/></div><input placeholder="Search companies…" value={search} onChange={e=>setSearch(e.target.value)} style={{width:"100%",background:"#fff",border:`1px solid ${C.border}`,borderRadius:9,padding:"10px 14px",color:C.text,fontSize:14,marginBottom:14,fontFamily:"inherit",boxSizing:"border-box"}}/>{filtered.map(co=>(<RowCard key={co.id} onClick={()=>{setCompany(co);setBranch(null);setAgent(null);setView("company");}}><div style={{display:"flex",gap:12,alignItems:"center"}}><Avatar name={co.name} size={42} bg="#dbeafe" fg="#1d4ed8"/><div style={{flex:1,minWidth:0}}><div style={{color:C.text,fontWeight:700,fontSize:14}}>{co.name}</div><div style={{color:C.sub,fontSize:12,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{co.email||co.abn}</div><div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}><Badge label={`${co.branches.length} Branches`} color="blue"/><Badge label={co.status} color="green"/></div></div><span style={{color:C.muted,fontSize:18}}>›</span></div></RowCard>))}{modal==="co"&&<Modal title="Add Company" onClose={()=>setModal(null)} onSave={saveCo}><FF label="Company Name" value={form.name||""} onChange={v=>setForm({...form,name:v})} placeholder="e.g. Ray White Group" required/><FF label="ABN" value={form.abn||""} onChange={v=>setForm({...form,abn:v})} placeholder="00 000 000 000"/><FF label="Phone" value={form.phone||""} onChange={v=>setForm({...form,phone:v})} placeholder="(02) 9000 0000"/><FF label="Email" value={form.email||""} onChange={v=>setForm({...form,email:v})} placeholder="accounts@company.com" type="email"/><FF label="Website" value={form.website||""} onChange={v=>setForm({...form,website:v})} placeholder="company.com.au"/></Modal>}</div>);

  if(view==="company"&&company)return(<div><Breadcrumb items={[{label:"Companies",fn:()=>setView("list")},{label:company.name}]}/><Card style={{marginBottom:16}}><div style={{display:"flex",gap:12,alignItems:"center",marginBottom:14}}><Avatar name={company.name} size={44} bg="#dbeafe" fg="#1d4ed8"/><div><div style={{color:C.text,fontWeight:800,fontSize:16}}>{company.name}</div><div style={{marginTop:4}}><Badge label={company.status} color="green"/></div></div></div>{company.abn&&<Field label="ABN" value={company.abn}/>}{company.phone&&<Field label="Phone" value={company.phone}/>}{company.email&&<Field label="Email" value={company.email}/>}{company.website&&<Field label="Website" value={company.website}/>}</Card><SectionHead title="Branches" count={company.branches.length} action={{label:"+ Add Branch",fn:()=>{setModal("branch");setForm({});}}}/>{company.branches.map(b=>{const tc=b.agents.reduce((s,a)=>s+(a.jobs||[]).reduce((ss,j)=>ss+j.tenants.length,0),0);return(<RowCard key={b.id} onClick={()=>{setBranch(b);setAgent(null);setView("branch");}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div style={{flex:1,minWidth:0}}><div style={{color:C.text,fontWeight:700,fontSize:14}}>{b.name}</div><div style={{color:C.sub,fontSize:12,marginTop:2}}>{b.address}</div><div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}><Badge label={`${b.agents.length} Agents`} color="purple"/><Badge label={`${tc} Tenants`} color="blue"/></div></div><span style={{color:C.muted,fontSize:18,marginLeft:10}}>›</span></div>{b.billing.name&&<div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${C.border}`,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}><span style={{color:C.sub,fontSize:11,fontWeight:600}}>BILLING</span><span style={{color:C.text,fontSize:12,fontWeight:600}}>{b.billing.name}</span>{b.billing.email&&<span style={{color:C.sub,fontSize:12}}>{b.billing.email}</span>}</div>}</RowCard>);})}{modal==="branch"&&<Modal title="Add Branch" onClose={()=>setModal(null)} onSave={saveBranch}><FF label="Branch Name" value={form.name||""} onChange={v=>setForm({...form,name:v})} placeholder="e.g. Ray White Parramatta" required/><FF label="Address" value={form.address||""} onChange={v=>setForm({...form,address:v})} placeholder="10 Main St, Suburb NSW 2000"/><FF label="Phone" value={form.phone||""} onChange={v=>setForm({...form,phone:v})} placeholder="(02) 9000 0000"/><FF label="Email" value={form.email||""} onChange={v=>setForm({...form,email:v})} placeholder="branch@company.com" type="email"/><div style={{background:C.raised,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px",marginBottom:14}}><div style={{color:C.text,fontSize:13,fontWeight:700,marginBottom:10}}>💳 Billing Contact</div><FF label="Name" value={form.billingName||""} onChange={v=>setForm({...form,billingName:v})} placeholder="Contact name"/><FF label="Email" value={form.billingEmail||""} onChange={v=>setForm({...form,billingEmail:v})} placeholder="billing@company.com" type="email"/><FF label="Phone" value={form.billingPhone||""} onChange={v=>setForm({...form,billingPhone:v})} placeholder="(02) 9000 0001"/></div></Modal>}</div>);

  if(view==="branch"&&branch)return(<div><Breadcrumb items={[{label:"Companies",fn:()=>setView("list")},{label:company.name,fn:()=>setView("company")},{label:branch.name}]}/><Card style={{marginBottom:12}}><div style={{color:C.text,fontWeight:800,fontSize:15,marginBottom:12}}>{branch.name}</div>{branch.address&&<Field label="Address" value={branch.address}/>}{branch.phone&&<Field label="Phone" value={branch.phone}/>}{branch.email&&<Field label="Email" value={branch.email}/>}</Card>{branch.billing.name&&<Card style={{marginBottom:16}}><div style={{color:C.sub,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:0.6,marginBottom:10}}>💳 Billing Contact</div><div style={{display:"flex",gap:12,alignItems:"center"}}><Avatar name={branch.billing.name} size={38} bg="#ffedd5" fg="#c2410c"/><div><div style={{color:C.text,fontWeight:700,fontSize:13}}>{branch.billing.name}</div>{branch.billing.email&&<div style={{color:C.sub,fontSize:12}}>{branch.billing.email}</div>}{branch.billing.phone&&<div style={{color:C.sub,fontSize:12}}>{branch.billing.phone}</div>}</div></div></Card>}<SectionHead title="Property Agents" count={branch.agents.length} action={{label:"+ Add Agent",fn:()=>{setModal("agent");setForm({});}}}/>{branch.agents.map(a=>{const openJobs=(a.jobs||[]).filter(j=>j.status==="Open").length;return(<RowCard key={a.id} onClick={()=>{setAgent(a);setView("agent");}}><div style={{display:"flex",gap:12,alignItems:"center"}}><Avatar name={a.name} size={40} bg="#ede9fe" fg="#6d28d9"/><div style={{flex:1,minWidth:0}}><div style={{color:C.text,fontWeight:700,fontSize:14}}>{a.name}</div><div style={{color:C.sub,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.email}</div><div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}><Badge label={`${(a.jobs||[]).length} Jobs`} color="blue"/>{openJobs>0&&<Badge label={`${openJobs} Open`} color="green"/>}</div></div><span style={{color:C.muted,fontSize:18}}>›</span></div></RowCard>);})}{modal==="agent"&&<Modal title="Add Agent" onClose={()=>setModal(null)} onSave={saveAgent}><FF label="Full Name" value={form.name||""} onChange={v=>setForm({...form,name:v})} placeholder="e.g. James Okafor" required/><FF label="Email" value={form.email||""} onChange={v=>setForm({...form,email:v})} placeholder="agent@company.com" type="email"/><FF label="Phone" value={form.phone||""} onChange={v=>setForm({...form,phone:v})} placeholder="0400 000 000"/></Modal>}</div>);

  if(view==="agent"&&agent)return(<div><Breadcrumb items={[{label:"Companies",fn:()=>setView("list")},{label:company.name,fn:()=>setView("company")},{label:branch.name,fn:()=>setView("branch")},{label:agent.name}]}/><Card style={{marginBottom:16}}><div style={{display:"flex",gap:12,alignItems:"center",marginBottom:14}}><Avatar name={agent.name} size={44} bg="#ede9fe" fg="#6d28d9"/><div><div style={{color:C.text,fontWeight:800,fontSize:16}}>{agent.name}</div><div style={{marginTop:4}}><Badge label="Property Agent" color="purple"/></div></div></div>{agent.email&&<Field label="Email" value={agent.email}/>}{agent.phone&&<Field label="Phone" value={agent.phone}/>}<Field label="Branch" value={branch.name}/><Field label="Company" value={company.name}/></Card><JobsSection agent={agent} onUpdate={updateAgent} settings={settings}/></div>);
  return null;
}

/* ═══════════════════════════════════════════
   VENDORS TAB
═══════════════════════════════════════════ */
function VendorsTab({vendors, setVendors}) {
  const [sel,setSel]=useState(null);
  const [vTab,setVTab]=useState("overview");
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState({});
  const saveVendor=()=>{if(!form.name)return;setVendors([...vendors,{id:uid(),name:form.name,abn:form.abn||"",phone:form.phone||"",email:form.email||"",website:form.website||"",rank:parseInt(form.rank)||1,status:"Active",contacts:[],catalogue:[],history:[]}]);setModal(null);};
  const saveContact=()=>{if(!form.name)return;const u=vendors.map(v=>v.id===sel.id?{...v,contacts:[...v.contacts,{name:form.name,role:form.role||"",phone:form.phone||"",email:form.email||""}]}:v);setVendors(u);setSel(u.find(v=>v.id===sel.id));setModal(null);};
  const saveProduct=()=>{if(!form.name)return;const p={sku:form.sku||uid().slice(0,8).toUpperCase(),name:form.name,price:parseFloat(form.price)||0,unit:form.unit||"each"};const u=vendors.map(v=>v.id===sel.id?{...v,catalogue:[...v.catalogue,p]}:v);setVendors(u);setSel(u.find(v=>v.id===sel.id));setModal(null);};
  if(!sel)return(<div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div><h2 style={{fontSize:18,fontWeight:800,color:C.text}}>Vendors & Suppliers</h2><p style={{color:C.sub,fontSize:12,marginTop:2}}>{vendors.length} vendors on record</p></div><Btn label="+ Add Vendor" color={C.orange} onClick={()=>{setModal("vendor");setForm({rank:"1"});}}/></div>{vendors.map(v=>{const owing=v.history.filter(h=>h.status==="Owing").reduce((s,h)=>s+h.amount,0);return(<RowCard key={v.id} onClick={()=>{setSel(v);setVTab("overview");}}><div style={{display:"flex",gap:12,alignItems:"center"}}><Avatar name={v.name} size={42} bg="#ffedd5" fg="#c2410c"/><div style={{flex:1,minWidth:0}}><div style={{display:"flex",gap:6,alignItems:"center"}}><div style={{color:C.text,fontWeight:700,fontSize:14}}>{v.name}</div><span style={{color:"#f59e0b",fontSize:11}}>{[...Array(v.rank)].map(()=>"★").join("")}</span></div><div style={{color:C.sub,fontSize:12,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.email}</div><div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}><Badge label={`${v.catalogue.length} Products`} color="orange"/><Badge label={`${v.contacts.length} Contacts`} color="blue"/>{owing>0&&<Badge label={`$${owing.toLocaleString()} Owing`} color="red"/>}</div></div><span style={{color:C.muted,fontSize:18,flexShrink:0}}>›</span></div></RowCard>);})}{modal==="vendor"&&<Modal title="Add Vendor" onClose={()=>setModal(null)} onSave={saveVendor}><FF label="Vendor Name" value={form.name||""} onChange={v=>setForm({...form,name:v})} placeholder="e.g. The Good Guys" required/><FF label="ABN" value={form.abn||""} onChange={v=>setForm({...form,abn:v})} placeholder="00 000 000 000"/><FF label="Phone" value={form.phone||""} onChange={v=>setForm({...form,phone:v})} placeholder="1300 000 000"/><FF label="Email" value={form.email||""} onChange={v=>setForm({...form,email:v})} placeholder="trade@vendor.com.au" type="email"/><FF label="Website" value={form.website||""} onChange={v=>setForm({...form,website:v})} placeholder="vendor.com.au"/><div style={{marginBottom:14}}><label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Preferred Rank</label><select value={form.rank||"1"} onChange={e=>setForm({...form,rank:e.target.value})} style={{width:"100%",background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}><option value="1">★ Rank 1 (Preferred)</option><option value="2">★★ Rank 2</option><option value="3">★★★ Rank 3</option></select></div></Modal>}</div>);
  const owing=sel.history.filter(h=>h.status==="Owing").reduce((s,h)=>s+h.amount,0);
  return(<div><Breadcrumb items={[{label:"Vendors",fn:()=>setSel(null)},{label:sel.name}]}/><Card style={{marginBottom:12}}><div style={{display:"flex",gap:12,alignItems:"center",marginBottom:14}}><Avatar name={sel.name} size={44} bg="#ffedd5" fg="#c2410c"/><div><div style={{color:C.text,fontWeight:800,fontSize:16}}>{sel.name}</div><div style={{display:"flex",gap:6,marginTop:4,alignItems:"center"}}><Badge label={sel.status} color="green"/><span style={{color:"#f59e0b"}}>{[...Array(sel.rank)].map(()=>"★").join("")}</span></div></div></div>{sel.abn&&<Field label="ABN" value={sel.abn}/>}{sel.phone&&<Field label="Phone" value={sel.phone}/>}{sel.email&&<Field label="Email" value={sel.email}/>}{sel.website&&<Field label="Website" value={sel.website}/>}</Card><div style={{background:owing>0?"#fef2f2":"#f0fdf4",border:`1px solid ${owing>0?"#fecaca":"#bbf7d0"}`,borderRadius:12,padding:"14px 16px",marginBottom:16}}><div style={{color:C.sub,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Account Balance</div><div style={{color:owing>0?C.red:C.green,fontSize:24,fontWeight:900}}>${owing>0?owing.toLocaleString():"0"}</div><div style={{color:C.sub,fontSize:12,marginTop:2}}>{owing>0?"Currently owing":"Account clear"}</div></div><div style={{display:"flex",gap:8,marginBottom:16,overflowX:"auto",paddingBottom:4}}>{["overview","contacts","catalogue","history"].map(t=><Pill key={t} label={t.charAt(0).toUpperCase()+t.slice(1)} active={vTab===t} onClick={()=>setVTab(t)}/>)}</div>{vTab==="overview"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{[["Products",sel.catalogue.length],["Contacts",sel.contacts.length],["Orders",sel.history.length],["Rank",`#${sel.rank}`]].map(([k,val])=><div key={k} style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px"}}><div style={{color:C.sub,fontSize:11,fontWeight:600}}>{k}</div><div style={{color:C.text,fontWeight:800,fontSize:22,marginTop:4}}>{val}</div></div>)}</div>}{vTab==="contacts"&&<Card><SectionHead title="Contacts" count={sel.contacts.length} action={{label:"+ Add",fn:()=>{setModal("contact");setForm({});}}}/>{sel.contacts.length===0&&<p style={{color:C.muted,fontSize:13}}>No contacts yet.</p>}{sel.contacts.map((ct,i)=><div key={i} style={{display:"flex",gap:12,alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${C.border}`}}><Avatar name={ct.name} size={38} bg="#dbeafe" fg="#1d4ed8"/><div style={{flex:1,minWidth:0}}><div style={{color:C.text,fontWeight:700,fontSize:13}}>{ct.name}</div><div style={{color:C.sub,fontSize:12}}>{ct.role}</div><div style={{color:C.sub,fontSize:12}}>{ct.phone}</div><div style={{color:C.sub,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ct.email}</div></div></div>)}</Card>}{vTab==="catalogue"&&<Card><SectionHead title="Catalogue" count={sel.catalogue.length} action={{label:"+ Add",fn:()=>{setModal("product");setForm({unit:"each"});}}}/>{sel.catalogue.length===0&&<p style={{color:C.muted,fontSize:13}}>No products yet.</p>}{sel.catalogue.map((p,i)=><div key={i} style={{padding:"12px 0",borderBottom:`1px solid ${C.border}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div style={{flex:1,minWidth:0,marginRight:10}}><div style={{color:C.accent,fontWeight:700,fontSize:11}}>{p.sku}</div><div style={{color:C.text,fontSize:13,fontWeight:600,marginTop:2}}>{p.name}</div></div><div style={{textAlign:"right",flexShrink:0}}><div style={{color:C.green,fontWeight:800,fontSize:15}}>${p.price.toLocaleString()}</div><div style={{marginTop:4}}><Badge label={p.unit} color="gray"/></div></div></div></div>)}</Card>}{vTab==="history"&&<Card><SectionHead title="Purchase History"/>{sel.history.length===0&&<p style={{color:C.muted,fontSize:13}}>No history yet.</p>}{sel.history.map((h,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"12px 0",borderBottom:`1px solid ${C.border}`}}><div style={{flex:1,minWidth:0,marginRight:10}}><div style={{color:C.accent,fontWeight:700,fontSize:13}}>{h.ref}</div><div style={{color:C.text,fontSize:13,marginTop:2}}>{h.item}</div><div style={{color:C.sub,fontSize:11,marginTop:2}}>{h.date}</div></div><div style={{textAlign:"right",flexShrink:0}}><div style={{color:C.text,fontWeight:800,fontSize:15}}>${h.amount.toLocaleString()}</div><div style={{marginTop:6}}><Badge label={h.status} color={h.status==="Paid"?"green":"red"}/></div></div></div>)}</Card>}{modal==="contact"&&<Modal title="Add Contact" onClose={()=>setModal(null)} onSave={saveContact}><FF label="Full Name" value={form.name||""} onChange={v=>setForm({...form,name:v})} placeholder="e.g. Brad Hollis" required/><FF label="Role" value={form.role||""} onChange={v=>setForm({...form,role:v})} placeholder="e.g. Trade Account Manager"/><FF label="Phone" value={form.phone||""} onChange={v=>setForm({...form,phone:v})} placeholder="0400 000 000"/><FF label="Email" value={form.email||""} onChange={v=>setForm({...form,email:v})} placeholder="contact@vendor.com" type="email"/></Modal>}{modal==="product"&&<Modal title="Add Product" onClose={()=>setModal(null)} onSave={saveProduct}><FF label="SKU" value={form.sku||""} onChange={v=>setForm({...form,sku:v})} placeholder="e.g. BSH-DW60"/><FF label="Product Name" value={form.name||""} onChange={v=>setForm({...form,name:v})} placeholder="e.g. Bosch 60cm Dishwasher" required/><FF label="Unit Price ($)" value={form.price||""} onChange={v=>setForm({...form,price:v})} placeholder="0.00" type="number"/><div style={{marginBottom:14}}><label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Unit</label><select value={form.unit||"each"} onChange={e=>setForm({...form,unit:e.target.value})} style={{width:"100%",background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}><option>each</option><option>m</option><option>m²</option><option>box</option><option>roll</option><option>set</option></select></div></Modal>}</div>);
}

/* ═══════════════════════════════════════════
   PRODUCTS TAB
═══════════════════════════════════════════ */
function ProductsTab() {
  const allSkus={};
  SEED_VENDORS.forEach(v=>v.catalogue.forEach(p=>{if(!allSkus[p.sku])allSkus[p.sku]={sku:p.sku,name:p.name,suppliers:[]};allSkus[p.sku].suppliers.push({vendor:v.name,price:p.price,rank:v.rank});}));
  return(<div><div style={{marginBottom:16}}><h2 style={{fontSize:18,fontWeight:800,color:C.text}}>Product Catalogue</h2><p style={{color:C.sub,fontSize:12,marginTop:2}}>Cross-supplier pricing comparison</p></div>{Object.values(allSkus).map(p=>{const sorted=[...p.suppliers].sort((a,b)=>a.price-b.price);const cheapest=sorted[0];return(<div key={p.sku} style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px",marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}><div style={{flex:1,minWidth:0,marginRight:10}}><div style={{color:C.accent,fontWeight:700,fontSize:11}}>{p.sku}</div><div style={{color:C.text,fontWeight:700,fontSize:14,marginTop:2}}>{p.name}</div></div><Badge label={`${p.suppliers.length} Supplier${p.suppliers.length>1?"s":""}`} color={p.suppliers.length>1?"blue":"gray"}/></div><div style={{display:"flex",flexDirection:"column",gap:8}}>{sorted.map((s,i)=><div key={s.vendor} style={{background:i===0?"#f0fdf4":C.raised,border:`1px solid ${i===0?"#bbf7d0":C.border}`,borderRadius:10,padding:"10px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{color:C.sub,fontSize:12,fontWeight:600}}>{s.vendor}</div><div style={{color:C.sub,fontSize:11,marginTop:2}}>Rank #{s.rank}</div>{i>0&&<div style={{color:C.red,fontSize:11,marginTop:2}}>+${(s.price-cheapest.price).toLocaleString()} vs best</div>}</div><div style={{textAlign:"right"}}><div style={{color:i===0?C.green:C.text,fontWeight:900,fontSize:18}}>${s.price.toLocaleString()}</div>{i===0&&<div style={{marginTop:4}}><Badge label="Best Price" color="green"/></div>}</div></div>)}</div></div>);})}</div>);
}

/* ═══════════════════════════════════════════
   DISPATCH BOARD
═══════════════════════════════════════════ */
function DispatchTab({settings}) {
  const jobs = allJobs();
  const open = jobs.filter(j=>j.status==="Open");
  const techs = [...new Set(open.map(j=>j.tech||"Unassigned"))];
  const [filter,setFilter]=useState("All");
  const [stageFilter,setStageFilter]=useState("All");
  const [search,setSearch]=useState("");
  const {jobStages} = settings;

  const filtered = open.filter(j=>{
    const matchTech = filter==="All" || (j.tech||"Unassigned")===filter;
    const matchStage = stageFilter==="All" || j.stage===stageFilter;
    const matchSearch = !search || j.ref.toLowerCase().includes(search.toLowerCase()) || j.address.toLowerCase().includes(search.toLowerCase()) || (j.tech||"").toLowerCase().includes(search.toLowerCase());
    return matchTech && matchStage && matchSearch;
  });

  return(<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <div><h2 style={{fontSize:18,fontWeight:800,color:C.text}}>Dispatch Board</h2><p style={{color:C.sub,fontSize:12,marginTop:2}}>{open.length} open jobs across {techs.length} technicians</p></div>
    </div>
    <input placeholder="Search jobs, address, technician…" value={search} onChange={e=>setSearch(e.target.value)} style={{width:"100%",background:"#fff",border:`1px solid ${C.border}`,borderRadius:9,padding:"10px 14px",color:C.text,fontSize:14,marginBottom:12,fontFamily:"inherit",boxSizing:"border-box"}}/>
    <div style={{marginBottom:8}}><div style={{color:C.sub,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Filter by Technician</div><div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4}}><Pill label="All" active={filter==="All"} onClick={()=>setFilter("All")}/>{techs.map(t=><Pill key={t} label={t} active={filter===t} onClick={()=>setFilter(t)}/>)}</div></div>
    <div style={{marginBottom:16}}><div style={{color:C.sub,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Filter by Stage</div><div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4}}><Pill label="All" active={stageFilter==="All"} onClick={()=>setStageFilter("All")}/>{jobStages.map(s=><Pill key={s} label={s} active={stageFilter===s} onClick={()=>setStageFilter(s)}/>)}</div></div>
    {filter==="All" && stageFilter==="All" ? (
      techs.map(tech=>{
        const techJobs=filtered.filter(j=>(j.tech||"Unassigned")===tech);
        if(techJobs.length===0)return null;
        return(<div key={tech} style={{marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <Avatar name={tech} size={32} bg="#dbeafe" fg="#1d4ed8"/>
            <span style={{color:C.text,fontWeight:700,fontSize:14}}>{tech}</span>
            <span style={{background:C.raised,border:`1px solid ${C.border}`,color:C.sub,borderRadius:99,padding:"1px 8px",fontSize:11,fontWeight:700}}>{techJobs.length}</span>
          </div>
          {techJobs.map(job=>(<DispatchCard key={job.id} job={job}/>))}
        </div>);
      })
    ):(
      filtered.map(job=><DispatchCard key={job.id} job={job}/>)
    )}
    {filtered.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:C.muted}}><div style={{fontSize:32,marginBottom:8}}>📋</div><div style={{fontSize:14,fontWeight:600}}>No open jobs found</div></div>}
  </div>);
}

function DispatchCard({job}) {
  const keyLabel = job.keyMethod==="tenant"?"🧑 Tenant":job.keyMethod==="office"?"🏢 Office":"🔑 Other";
  return(
    <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px",marginBottom:10,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{color:C.accent,fontWeight:800,fontSize:13}}>{job.ref}</span>
          <Badge label={job.type} color={job.type==="HVAC"?"blue":job.type==="Plumbing"?"purple":"orange"}/>
          {job.stage&&<Badge label={job.stage} color={stageColor(job.stage)}/>}
          {job.subStage&&<Badge label={job.subStage} color="purple"/>}
        </div>
      </div>
      <div style={{color:C.text,fontWeight:700,fontSize:14,marginBottom:2}}>{job.address}</div>
      <div style={{color:C.sub,fontSize:12,marginBottom:8}}>{job.description}</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",paddingTop:8,borderTop:`1px solid ${C.border}`}}>
        <span style={{fontSize:12,color:C.sub}}>🏢 {job.companyName}</span>
        <span style={{fontSize:12,color:C.sub}}>👤 {job.agentName}</span>
        <span style={{fontSize:12,color:C.sub}}>👥 {job.tenants.length} tenant{job.tenants.length!==1?"s":""}</span>
        {job.keyMethod&&<span style={{fontSize:12,color:C.sub}}>{keyLabel}</span>}
        <span style={{fontSize:12,color:C.sub}}>📅 {job.createdDate}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   QUICK ASSIGN PICKER (Company → Branch → Agent with Add New)
═══════════════════════════════════════════ */
function QuickAssignPicker({companies,setCompanies,selCo,setSelCo,selBr,setSelBr,selAg,setSelAg}){
  const [miniModal,setMiniModal]=useState(null); // "company"|"branch"|"agent"
  const [mf,setMf]=useState({});

  const selCompany=companies.find(c=>c.id===selCo);
  const selBranch=selCompany?.branches.find(b=>b.id===selBr);
  const selAgent=selBranch?.agents.find(a=>a.id===selAg);

  const handleCoChange=e=>{
    if(e.target.value==="__new__"){setMf({});setMiniModal("company");}
    else setSelCo(e.target.value);
  };
  const handleBrChange=e=>{
    if(e.target.value==="__new__"){setMf({});setMiniModal("branch");}
    else setSelBr(e.target.value);
  };
  const handleAgChange=e=>{
    if(e.target.value==="__new__"){setMf({});setMiniModal("agent");}
    else setSelAg(e.target.value);
  };

  const saveCo=()=>{
    if(!mf.name)return;
    const co={id:uid(),name:mf.name,abn:mf.abn||"",phone:mf.phone||"",email:mf.email||"",website:"",status:"Active",branches:[]};
    const newCos=[...companies,co];
    setCompanies(newCos);
    setSelCo(co.id);
    setMiniModal(null);
  };
  const saveBr=()=>{
    if(!mf.name||!selCo)return;
    const br={id:uid(),name:mf.name,address:mf.address||"",phone:mf.phone||"",email:mf.email||"",billing:{name:"",email:"",phone:""},agents:[]};
    setCompanies(companies.map(c=>c.id===selCo?{...c,branches:[...c.branches,br]}:c));
    setSelBr(br.id);
    setMiniModal(null);
  };
  const saveAg=()=>{
    if(!mf.name||!selCo||!selBr)return;
    const ag={id:uid(),name:mf.name,email:mf.email||"",phone:mf.phone||"",properties:0,jobs:[]};
    setCompanies(companies.map(c=>c.id===selCo?{...c,branches:c.branches.map(b=>b.id===selBr?{...b,agents:[...b.agents,ag]}:b)}:c));
    setSelAg(ag.id);
    setMiniModal(null);
  };

  const sel={width:"100%",background:"#fff",border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"};
  const lbl={display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5};

  return(<>
    <div style={{background:C.raised,border:`1px solid ${C.border}`,borderRadius:10,padding:"14px",marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:13,color:C.text,marginBottom:12}}>📍 Assign to Agent</div>

      {/* Company */}
      <div style={{marginBottom:10}}>
        <label style={lbl}>Company <span style={{color:C.red}}>*</span></label>
        <select value={selCo} onChange={handleCoChange} style={sel}>
          <option value="">— Select Company —</option>
          {companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          <option value="__new__">➕ Add New Company…</option>
        </select>
      </div>

      {/* Branch — only show once company selected */}
      {selCompany&&(
        <div style={{marginBottom:10}}>
          <label style={lbl}>Branch <span style={{color:C.red}}>*</span></label>
          <select value={selBr} onChange={handleBrChange} style={sel}>
            <option value="">— Select Branch —</option>
            {selCompany.branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
            <option value="__new__">➕ Add New Branch…</option>
          </select>
        </div>
      )}

      {/* Agent — only show once branch selected */}
      {selBranch&&(
        <div>
          <label style={lbl}>Agent <span style={{color:C.red}}>*</span></label>
          <select value={selAg} onChange={handleAgChange} style={sel}>
            <option value="">— Select Agent —</option>
            {selBranch.agents.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
            <option value="__new__">➕ Add New Agent…</option>
          </select>
        </div>
      )}

      {/* Confirmation chip */}
      {selAgent&&(
        <div style={{marginTop:10,padding:"8px 12px",background:"#dcfce7",borderRadius:7,fontSize:12,color:"#15803d",fontWeight:600}}>
          ✓ {selAgent.name} · {selBranch.name} · {selCompany.name}
        </div>
      )}
    </div>

    {/* Mini modal — Add Company */}
    {miniModal==="company"&&(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
        <div style={{background:"#fff",borderRadius:14,width:"100%",maxWidth:400,boxShadow:"0 20px 60px rgba(0,0,0,0.25)"}}>
          <div style={{padding:"16px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontWeight:800,fontSize:15,color:C.text}}>New Company</span>
            <button onClick={()=>setMiniModal(null)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:C.muted}}>×</button>
          </div>
          <div style={{padding:"16px 18px"}}>
            <FF label="Company Name" value={mf.name||""} onChange={v=>setMf({...mf,name:v})} placeholder="e.g. Ray White Group" required/>
            <FF label="ABN" value={mf.abn||""} onChange={v=>setMf({...mf,abn:v})} placeholder="00 000 000 000"/>
            <FF label="Phone" value={mf.phone||""} onChange={v=>setMf({...mf,phone:v})} placeholder="(02) 9000 0000"/>
            <FF label="Email" value={mf.email||""} onChange={v=>setMf({...mf,email:v})} placeholder="accounts@company.com"/>
          </div>
          <div style={{padding:"12px 18px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button onClick={()=>setMiniModal(null)} style={{background:C.raised,border:`1px solid ${C.border}`,color:C.sub,borderRadius:8,padding:"8px 14px",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
            <Btn label="Create & Select" onClick={saveCo}/>
          </div>
        </div>
      </div>
    )}

    {/* Mini modal — Add Branch */}
    {miniModal==="branch"&&(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
        <div style={{background:"#fff",borderRadius:14,width:"100%",maxWidth:400,boxShadow:"0 20px 60px rgba(0,0,0,0.25)"}}>
          <div style={{padding:"16px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><span style={{fontWeight:800,fontSize:15,color:C.text}}>New Branch</span><div style={{fontSize:12,color:C.sub,marginTop:2}}>for {selCompany?.name}</div></div>
            <button onClick={()=>setMiniModal(null)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:C.muted}}>×</button>
          </div>
          <div style={{padding:"16px 18px"}}>
            <FF label="Branch Name" value={mf.name||""} onChange={v=>setMf({...mf,name:v})} placeholder="e.g. Ray White Parramatta" required/>
            <FF label="Address" value={mf.address||""} onChange={v=>setMf({...mf,address:v})} placeholder="10 Main St, Suburb NSW 2000"/>
            <FF label="Phone" value={mf.phone||""} onChange={v=>setMf({...mf,phone:v})} placeholder="(02) 9000 0000"/>
            <FF label="Email" value={mf.email||""} onChange={v=>setMf({...mf,email:v})} placeholder="branch@company.com"/>
          </div>
          <div style={{padding:"12px 18px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button onClick={()=>setMiniModal(null)} style={{background:C.raised,border:`1px solid ${C.border}`,color:C.sub,borderRadius:8,padding:"8px 14px",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
            <Btn label="Create & Select" onClick={saveBr}/>
          </div>
        </div>
      </div>
    )}

    {/* Mini modal — Add Agent */}
    {miniModal==="agent"&&(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
        <div style={{background:"#fff",borderRadius:14,width:"100%",maxWidth:400,boxShadow:"0 20px 60px rgba(0,0,0,0.25)"}}>
          <div style={{padding:"16px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><span style={{fontWeight:800,fontSize:15,color:C.text}}>New Agent</span><div style={{fontSize:12,color:C.sub,marginTop:2}}>for {selBranch?.name}</div></div>
            <button onClick={()=>setMiniModal(null)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:C.muted}}>×</button>
          </div>
          <div style={{padding:"16px 18px"}}>
            <FF label="Agent Name" value={mf.name||""} onChange={v=>setMf({...mf,name:v})} placeholder="e.g. James Okafor" required/>
            <FF label="Email" value={mf.email||""} onChange={v=>setMf({...mf,email:v})} placeholder="agent@company.com"/>
            <FF label="Phone" value={mf.phone||""} onChange={v=>setMf({...mf,phone:v})} placeholder="0400 000 000"/>
          </div>
          <div style={{padding:"12px 18px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button onClick={()=>setMiniModal(null)} style={{background:C.raised,border:`1px solid ${C.border}`,color:C.sub,borderRadius:8,padding:"8px 14px",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
            <Btn label="Create & Select" onClick={saveAg}/>
          </div>
        </div>
      </div>
    )}
  </>);
}

/* ═══════════════════════════════════════════
   VISITS SECTION
   Tracks up to 5 site visits per job — who went, when, outcome.
   KPI foundation: longest-running jobs, who fixes whose work.
═══════════════════════════════════════════ */
const VISIT_OUTCOMES = ["Completed","Parts Needed","Recall Required","No Access","Quote Required","Other"];

function VisitsSection({job, onUpdate, fieldStaff}) {
  const visits = job.visits || [];
  const [adding, setAdding] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [form, setForm] = useState({tech:"", date:"", outcome:"", notes:""});

  const maxVisits = 5;
  const visitLabels = ["1st Visit","2nd Visit","3rd Visit","4th Visit","5th Visit"];
  const outcomeColor = o => o==="Completed"?"green":o==="Parts Needed"?"orange":o==="Recall Required"?"red":o==="No Access"?"red":o==="Quote Required"?"blue":"gray";

  const openAdd = () => {
    setForm({tech:"", date:new Date().toISOString().split("T")[0], outcome:"", notes:""});
    setEditIdx(null);
    setAdding(true);
  };
  const openEdit = (i) => {
    setForm({...visits[i]});
    setEditIdx(i);
    setAdding(true);
  };
  const save = () => {
    if(!form.tech || !form.date) return;
    const visitId = uid();
    let updatedVisits;
    if(editIdx !== null) {
      updatedVisits = visits.map((v,i) => i===editIdx ? {...form, id:v.id} : v);
    } else {
      updatedVisits = [...visits, {...form, id:visitId}];
    }

    // Auto-log diary entry for new visits (not edits)
    // TODO: Field Service App integration — when a tech submits a site report,
    // call ingestVisitFromFieldApp(jobId, visitData) which runs this same logic
    // to create the visit record + diary entry from the app's form submission.
    let updatedDiary = job.diary || [];
    if(editIdx === null) {
      const label = visitLabels[visits.length] || `Visit ${visits.length+1}`;
      const diaryEntry = {
        id: uid(),
        type: "visit",
        ts: new Date(`${form.date}T09:00:00`).toISOString(),
        contact: form.tech,
        subject: `${label} — ${form.outcome||"Logged"}`,
        notes: form.notes || "",
        direction: "outbound",
        files: [],
        visitId, // link back to visit record
        source: "manual", // will be "field_app" when synced from mobile
      };
      updatedDiary = [diaryEntry, ...updatedDiary];
    }

    onUpdate({...job, visits: updatedVisits, diary: updatedDiary});
    setAdding(false);
  };
  const remove = i => onUpdate({...job, visits: visits.filter((_,vi)=>vi!==i)});

  const iSel = {width:"100%",background:"#fff",border:`1px solid ${C.border}`,borderRadius:7,padding:"7px 10px",color:C.text,fontSize:12,fontFamily:"inherit",boxSizing:"border-box"};

  return (
    <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 14px",marginBottom:10}}>
      <SectionHead title="🔧 Site Visits" count={visits.length}
        action={visits.length < maxVisits ? {label:"+ Add Visit", fn:openAdd} : null}/>

      {visits.length === 0 && !adding && (
        <p style={{color:C.muted,fontSize:12,margin:"4px 0 8px"}}>No visits recorded yet.</p>
      )}

      {/* Visit list */}
      {visits.map((v,i) => (
        <div key={v.id} style={{padding:"8px 0",borderBottom:`1px solid ${C.border}`,display:"flex",gap:10,alignItems:"flex-start"}}>
          {/* Visit number badge */}
          <div style={{background:"#eff6ff",color:C.accent,borderRadius:6,padding:"3px 8px",fontSize:10,fontWeight:800,whiteSpace:"nowrap",flexShrink:0,marginTop:2}}>
            {visitLabels[i]||`Visit ${i+1}`}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
              <span style={{color:C.text,fontWeight:700,fontSize:12}}>{v.tech}</span>
              <span style={{color:C.muted,fontSize:11}}>·</span>
              <span style={{color:C.sub,fontSize:11}}>{fmtDate(v.date)}</span>
              {v.outcome && <Badge label={v.outcome} color={outcomeColor(v.outcome)}/>}
            </div>
            {v.notes && <div style={{color:C.sub,fontSize:11,marginTop:3,lineHeight:1.4}}>{v.notes}</div>}
          </div>
          <button onClick={()=>openEdit(i)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:13,padding:"2px 4px",fontFamily:"inherit"}}>✎</button>
          <button onClick={()=>remove(i)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:13,padding:"2px 4px",fontFamily:"inherit"}}>×</button>
        </div>
      ))}

      {/* Add/edit form */}
      {adding && (
        <div style={{background:C.raised,borderRadius:10,padding:"12px",marginTop:10,border:`1px solid ${C.border}`}}>
          <div style={{fontWeight:700,fontSize:12,color:C.text,marginBottom:10}}>
            {editIdx!==null ? `Edit ${visitLabels[editIdx]||"Visit"}` : `Log ${visitLabels[visits.length]||"Visit"}`}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
            <div>
              <label style={{display:"block",color:C.sub,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Technician *</label>
              <select value={form.tech} onChange={e=>setForm({...form,tech:e.target.value})} style={iSel}>
                <option value="">— Select —</option>
                {fieldStaff.filter(f=>f.status==="Active").map(f=><option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{display:"block",color:C.sub,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Date *</label>
              <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} style={iSel}/>
            </div>
          </div>
          <div style={{marginBottom:8}}>
            <label style={{display:"block",color:C.sub,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Outcome</label>
            <select value={form.outcome} onChange={e=>setForm({...form,outcome:e.target.value})} style={iSel}>
              <option value="">— Select outcome —</option>
              {VISIT_OUTCOMES.map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
          <div style={{marginBottom:10}}>
            <label style={{display:"block",color:C.sub,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Notes</label>
            <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={2} placeholder="What was done, parts used, issues found…"
              style={{...iSel,resize:"vertical"}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn label="Save Visit" onClick={save} small/>
            <button onClick={()=>setAdding(false)} style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:7,padding:"5px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
          </div>
        </div>
      )}

      {visits.length >= maxVisits && !adding && (
        <div style={{color:C.muted,fontSize:11,marginTop:8,textAlign:"center"}}>Max 5 visits reached · consider creating a recall job</div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   REPORT TEMPLATE EDITOR (Settings)
   Admin/office staff build report formats here.
═══════════════════════════════════════════ */
const FIELD_TYPES = [
  {id:"yesno",  icon:"✅", label:"Yes / No"},
  {id:"multi",  icon:"☑️", label:"Multiple Choice"},
  {id:"text",   icon:"📝", label:"Text / Alphanumeric"},
  {id:"photo",  icon:"📷", label:"Photo Attachment"},
];

function ReportTemplateEditor({reportTemplates, setReportTemplates, jobTypes}) {
  const [sel, setSel] = useState(null); // selected template id
  const [editingTemplate, setEditingTemplate] = useState(null); // {name, icon, appliesTo}
  const [editingField, setEditingField] = useState(null); // field being added/edited
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [newTpl, setNewTpl] = useState({name:"", icon:"📋"});

  const tpl = reportTemplates.find(t=>t.id===sel);

  const addTemplate = () => {
    if(!newTpl.name.trim()) return;
    const t = {id:uid(), name:newTpl.name.trim(), icon:newTpl.icon||"📋", appliesTo:[], fields:[]};
    setReportTemplates([...reportTemplates, t]);
    setSel(t.id);
    setShowNewTemplate(false);
    setNewTpl({name:"", icon:"📋"});
  };

  const deleteTemplate = id => { setReportTemplates(reportTemplates.filter(t=>t.id!==id)); if(sel===id) setSel(null); };

  const updateFields = fields => setReportTemplates(reportTemplates.map(t=>t.id===sel?{...t,fields}:t));

  const addField = () => {
    if(!editingField||!editingField.label.trim()) return;
    const field = {
      id: uid(),
      type: editingField.type||"text",
      label: editingField.label.trim(),
      required: !!editingField.required,
      multiline: !!editingField.multiline,
      options: editingField.type==="multi" ? (editingField.optionsStr||"").split("\n").map(s=>s.trim()).filter(Boolean) : [],
      tag: editingField.tag||"",
    };
    updateFields([...(tpl.fields||[]), field]);
    setEditingField(null);
  };

  const removeField = fid => updateFields((tpl.fields||[]).filter(f=>f.id!==fid));
  const moveField = (idx, dir) => {
    const fs = [...(tpl.fields||[])];
    const ni = idx+dir;
    if(ni<0||ni>=fs.length) return;
    [fs[idx],fs[ni]]=[fs[ni],fs[idx]];
    updateFields(fs);
  };

  const iSel = {width:"100%",background:"#fff",border:`1px solid ${C.border}`,borderRadius:7,padding:"7px 10px",color:C.text,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"};
  const iText = {...iSel};

  return (
    <div style={{display:"flex",gap:16,alignItems:"flex-start"}}>
      {/* Template list */}
      <div style={{width:220,flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <span style={{fontWeight:700,fontSize:13,color:C.text}}>Templates</span>
          <button onClick={()=>setShowNewTemplate(true)} style={{background:C.accent,color:"#fff",border:"none",borderRadius:6,padding:"4px 10px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ New</button>
        </div>
        {showNewTemplate && (
          <div style={{background:C.raised,border:`1px solid ${C.border}`,borderRadius:10,padding:12,marginBottom:10}}>
            <div style={{display:"flex",gap:6,marginBottom:8}}>
              <input value={newTpl.icon} onChange={e=>setNewTpl({...newTpl,icon:e.target.value})} style={{...iText,width:48,textAlign:"center",fontSize:18,padding:"4px"}} maxLength={2}/>
              <input value={newTpl.name} onChange={e=>setNewTpl({...newTpl,name:e.target.value})} placeholder="Template name…" style={{...iText,flex:1}}
                onKeyDown={e=>e.key==="Enter"&&addTemplate()}/>
            </div>
            <div style={{display:"flex",gap:6}}>
              <button onClick={addTemplate} style={{background:C.accent,color:"#fff",border:"none",borderRadius:6,padding:"5px 12px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Create</button>
              <button onClick={()=>setShowNewTemplate(false)} style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:6,padding:"5px 10px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
            </div>
          </div>
        )}
        {reportTemplates.map(t=>(
          <div key={t.id} onClick={()=>setSel(t.id)}
            style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:10,marginBottom:6,cursor:"pointer",
              background:sel===t.id?"#eff6ff":"#fff",border:`1.5px solid ${sel===t.id?C.accent:C.border}`}}>
            <span style={{fontSize:18}}>{t.icon}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700,color:sel===t.id?C.accent:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.name}</div>
              <div style={{fontSize:11,color:C.muted}}>{(t.fields||[]).length} fields</div>
            </div>
            <button onClick={e=>{e.stopPropagation();deleteTemplate(t.id);}}
              style={{background:"none",border:"none",color:"#fca5a5",cursor:"pointer",fontSize:14,padding:"0 2px",fontFamily:"inherit"}}>✕</button>
          </div>
        ))}
        {reportTemplates.length===0&&<p style={{color:C.muted,fontSize:12}}>No templates yet.</p>}
      </div>

      {/* Field editor */}
      {tpl ? (
        <div style={{flex:1,minWidth:0}}>
          <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px",marginBottom:12}}>
            <div style={{fontWeight:800,fontSize:15,color:C.text,marginBottom:4}}>{tpl.icon} {tpl.name}</div>
            <div style={{fontSize:12,color:C.sub,marginBottom:10}}>Applies to: {tpl.appliesTo.length===0?"All job types":tpl.appliesTo.join(", ")}</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {jobTypes.map(jt=>(
                <button key={jt} onClick={()=>{
                  const cur = tpl.appliesTo||[];
                  const next = cur.includes(jt)?cur.filter(x=>x!==jt):[...cur,jt];
                  setReportTemplates(reportTemplates.map(t=>t.id===sel?{...t,appliesTo:next}:t));
                }} style={{padding:"4px 10px",borderRadius:99,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                  border:`1.5px solid ${(tpl.appliesTo||[]).includes(jt)?C.accent:C.border}`,
                  background:(tpl.appliesTo||[]).includes(jt)?"#eff6ff":"#fff",
                  color:(tpl.appliesTo||[]).includes(jt)?C.accent:C.sub}}>
                  {jt}
                </button>
              ))}
              <span style={{color:C.muted,fontSize:11,alignSelf:"center",marginLeft:4}}>← toggle to filter by job type (none = all)</span>
            </div>
          </div>

          {/* Fields list */}
          <div style={{marginBottom:12}}>
            {(tpl.fields||[]).length===0&&<p style={{color:C.muted,fontSize:13,marginBottom:10}}>No fields yet — add some below.</p>}
            {(tpl.fields||[]).map((f,i)=>(
              <div key={f.id} style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",marginBottom:8,display:"flex",gap:10,alignItems:"center"}}>
                <span style={{fontSize:16}}>{FIELD_TYPES.find(ft=>ft.id===f.type)?.icon||"📝"}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:13,color:C.text}}>{f.label}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:2}}>
                    {FIELD_TYPES.find(ft=>ft.id===f.type)?.label}
                    {f.type==="multi"&&f.options?.length>0&&` · ${f.options.join(", ")}`}
                    {f.required&&<span style={{color:C.red,marginLeft:6,fontWeight:700}}>Required</span>}
                    {f.tag&&<span style={{color:C.accent,marginLeft:6}}>#{f.tag}</span>}
                  </div>
                </div>
                <button onClick={()=>moveField(i,-1)} disabled={i===0} style={{background:"none",border:"none",color:i===0?C.muted:C.sub,cursor:i===0?"default":"pointer",fontSize:13,fontFamily:"inherit"}}>▲</button>
                <button onClick={()=>moveField(i,1)} disabled={i===(tpl.fields||[]).length-1} style={{background:"none",border:"none",color:i===(tpl.fields||[]).length-1?C.muted:C.sub,cursor:i===(tpl.fields||[]).length-1?"default":"pointer",fontSize:13,fontFamily:"inherit"}}>▼</button>
                <button onClick={()=>removeField(f.id)} style={{background:"none",border:"none",color:"#fca5a5",cursor:"pointer",fontSize:16,fontFamily:"inherit"}}>✕</button>
              </div>
            ))}
          </div>

          {/* Add field */}
          {editingField ? (
            <div style={{background:C.raised,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px"}}>
              <div style={{fontWeight:700,fontSize:13,color:C.text,marginBottom:12}}>New Field</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
                {FIELD_TYPES.map(ft=>(
                  <button key={ft.id} onClick={()=>setEditingField({...editingField,type:ft.id})}
                    style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:99,fontSize:12,cursor:"pointer",fontFamily:"inherit",
                      border:`1.5px solid ${editingField.type===ft.id?C.accent:C.border}`,
                      background:editingField.type===ft.id?"#eff6ff":"#fff",
                      color:editingField.type===ft.id?C.accent:C.sub,fontWeight:editingField.type===ft.id?700:500}}>
                    {ft.icon} {ft.label}
                  </button>
                ))}
              </div>
              <div style={{marginBottom:10}}>
                <label style={{display:"block",fontSize:11,color:C.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Field Label *</label>
                <input value={editingField.label||""} onChange={e=>setEditingField({...editingField,label:e.target.value})} placeholder="e.g. Was the appliance functional?" style={iText}/>
              </div>
              {editingField.type==="multi"&&(
                <div style={{marginBottom:10}}>
                  <label style={{display:"block",fontSize:11,color:C.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Options (one per line)</label>
                  <textarea value={editingField.optionsStr||""} onChange={e=>setEditingField({...editingField,optionsStr:e.target.value})} rows={4} placeholder={"Option A\nOption B\nOption C"} style={{...iText,resize:"vertical"}}/>
                </div>
              )}
              {editingField.type==="text"&&(
                <label style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,cursor:"pointer",fontSize:13,color:C.text}}>
                  <input type="checkbox" checked={!!editingField.multiline} onChange={e=>setEditingField({...editingField,multiline:e.target.checked})}/> Multi-line text area
                </label>
              )}
              {editingField.type==="photo"&&(
                <div style={{marginBottom:10}}>
                  <label style={{display:"block",fontSize:11,color:C.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Photo Tag (for supplier email filtering)</label>
                  <input value={editingField.tag||""} onChange={e=>setEditingField({...editingField,tag:e.target.value})} placeholder="e.g. compliance_plate, fault_photo" style={iText}/>
                </div>
              )}
              <label style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,cursor:"pointer",fontSize:13,color:C.text}}>
                <input type="checkbox" checked={!!editingField.required} onChange={e=>setEditingField({...editingField,required:e.target.checked})}/> Required field
              </label>
              <div style={{display:"flex",gap:8}}>
                <button onClick={addField} style={{background:C.accent,color:"#fff",border:"none",borderRadius:7,padding:"7px 16px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Add Field</button>
                <button onClick={()=>setEditingField(null)} style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:7,padding:"7px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={()=>setEditingField({type:"text",label:"",required:false,multiline:false,optionsStr:"",tag:""})}
              style={{width:"100%",background:"none",border:`2px dashed ${C.border}`,borderRadius:10,padding:"12px",fontSize:13,color:C.sub,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>
              + Add Field
            </button>
          )}
        </div>
      ) : (
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontSize:13,padding:40}}>
          ← Select a template to edit its fields
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   REPORT FORM — fill a report on a job
   Captures GPS location stamp, tech, attachments,
   and triggers supplier email.
═══════════════════════════════════════════ */
function ReportForm({template, job, fieldStaff, vendors, onSave, onCancel}) {
  const [answers, setAnswers] = useState({});
  const [tech2, setTech2] = useState("");
  const [arrivalTime, setArrivalTime] = useState(new Date().toISOString().slice(0,16));
  const [locationStamp, setLocationStamp] = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [emailForm, setEmailForm] = useState({vendorIds:[], manualEmail:"", subject:"", body:"", attachTags:["compliance_plate"]});
  const [saving, setSaving] = useState(false);

  // Get GPS on mount
  useEffect(()=>{
    setLocLoading(true);
    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition(
        pos => {
          setLocationStamp({lat:pos.coords.latitude, lng:pos.coords.longitude, accuracy:Math.round(pos.coords.accuracy), ts:new Date().toISOString()});
          setLocLoading(false);
        },
        () => { setLocationStamp({error:"Location unavailable"}); setLocLoading(false); },
        {timeout:8000}
      );
    } else {
      setLocationStamp({error:"Geolocation not supported"});
      setLocLoading(false);
    }
  },[]);

  // Calculate distance from job address (simplified — in real app use geocoding API)
  const getLocationSummary = () => {
    if(!locationStamp) return "📍 Detecting location…";
    if(locationStamp.error) return `📍 ${locationStamp.error}`;
    const arrival = new Date(arrivalTime);
    const now = new Date(locationStamp.ts);
    const minsSince = Math.round((now - arrival) / 60000);
    const timeStr = minsSince < 1 ? "at arrival" : minsSince < 60 ? `${minsSince} mins after arrival` : `${Math.round(minsSince/60)}h ${minsSince%60}m after arrival`;
    return `📍 GPS captured · ±${locationStamp.accuracy}m accuracy · ${timeStr}`;
  };

  const setAnswer = (fid, val) => setAnswers(a=>({...a,[fid]:val}));

  const addPhoto = (fid, e) => {
    const files = Array.from(e.target.files);
    files.forEach(file=>{
      const reader = new FileReader();
      reader.onload = ev => {
        setAnswers(a=>({...a,[fid]:[...(a[fid]||[]),{id:uid(),name:file.name,size:file.size,mime:file.type,data:ev.target.result}]}));
      };
      reader.readAsDataURL(file);
    });
  };

  const validate = () => {
    for(const f of template.fields||[]){
      if(!f.required) continue;
      const val = answers[f.id];
      if(f.type==="yesno"&&val==null) return f.label;
      if(f.type==="multi"&&!val) return f.label;
      if(f.type==="text"&&!String(val||"").trim()) return f.label;
    }
    return null;
  };

  const buildSupplierEmail = () => {
    // Collect compliance plate / tagged photos
    const taggedPhotos = [];
    (template.fields||[]).filter(f=>f.type==="photo").forEach(f=>{
      const val = answers[f.id]||[];
      val.forEach(ph=>taggedPhotos.push({...ph, tag:f.tag}));
    });
    // Pre-fill email
    setEmailForm(ef=>({
      ...ef,
      subject:`Parts request – Job ${job.ref} – ${job.address}`,
      body:`Hi,\n\nPlease find attached compliance plate photos for the appliance at:\n${job.address}\n\nJob Ref: ${job.ref}\nReport: ${template.name}\n\nCould you please advise on parts availability and pricing?\n\nThank you.`,
      photos: taggedPhotos,
    }));
    setShowEmail(true);
  };

  const sendEmail = () => {
    const recipients = [
      ...emailForm.vendorIds.map(id=>{
        const v = (vendors||[]).find(x=>x.id===id);
        return v?.email||"";
      }).filter(Boolean),
      ...(emailForm.manualEmail?emailForm.manualEmail.split(",").map(s=>s.trim()).filter(Boolean):[])
    ];
    if(recipients.length===0) return alert("Add at least one recipient.");
    // Build mailto (in real app would use email API)
    const mailto = `mailto:${recipients.join(",")}?subject=${encodeURIComponent(emailForm.subject)}&body=${encodeURIComponent(emailForm.body)}`;
    window.open(mailto);
    setShowEmail(false);
  };

  const save = () => {
    const err = validate();
    if(err) { alert(`Required field missing: "${err}"`); return; }
    setSaving(true);
    const report = {
      id: uid(),
      templateId: template.id,
      templateName: template.name,
      templateIcon: template.icon,
      tech2,
      arrivalTime,
      locationStamp,
      locationSummary: getLocationSummary(),
      answers,
      submittedAt: new Date().toISOString(),
      source: locationStamp&&!locationStamp.error ? "gps_captured" : "no_gps",
    };
    onSave(report);
  };

  const iSel = {width:"100%",background:"#fff",border:`1px solid ${C.border}`,borderRadius:7,padding:"8px 10px",color:C.text,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"};

  if(showEmail) return (
    <div style={{padding:"0 0 20px"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <button onClick={()=>setShowEmail(false)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:7,padding:"5px 10px",cursor:"pointer",fontSize:12,color:C.sub,fontFamily:"inherit"}}>← Back</button>
        <span style={{fontWeight:800,fontSize:14,color:C.text}}>📧 Email Supplier</span>
      </div>
      <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:12,color:"#92400e"}}>
        Compliance plate and tagged photos will be referenced in the email body. Attach them manually in your email client after it opens.
      </div>

      <div style={{marginBottom:12}}>
        <label style={{display:"block",fontSize:11,color:C.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Vendors (from your supplier list)</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {(vendors||[]).filter(v=>v.email).map(v=>(
            <button key={v.id} onClick={()=>setEmailForm(ef=>({...ef,vendorIds:ef.vendorIds.includes(v.id)?ef.vendorIds.filter(x=>x!==v.id):[...ef.vendorIds,v.id]}))}
              style={{padding:"5px 12px",borderRadius:99,fontSize:12,cursor:"pointer",fontFamily:"inherit",
                border:`1.5px solid ${emailForm.vendorIds.includes(v.id)?C.accent:C.border}`,
                background:emailForm.vendorIds.includes(v.id)?"#eff6ff":"#fff",
                color:emailForm.vendorIds.includes(v.id)?C.accent:C.sub,fontWeight:emailForm.vendorIds.includes(v.id)?700:500}}>
              {v.name}
            </button>
          ))}
          {(vendors||[]).filter(v=>v.email).length===0&&<span style={{color:C.muted,fontSize:12}}>No vendors with email addresses found.</span>}
        </div>
      </div>
      <div style={{marginBottom:12}}>
        <label style={{display:"block",fontSize:11,color:C.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Additional recipients (comma separated)</label>
        <input value={emailForm.manualEmail} onChange={e=>setEmailForm({...emailForm,manualEmail:e.target.value})} placeholder="parts@supplier.com, quote@vendor.com.au" style={iSel}/>
      </div>
      <div style={{marginBottom:12}}>
        <label style={{display:"block",fontSize:11,color:C.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Subject</label>
        <input value={emailForm.subject} onChange={e=>setEmailForm({...emailForm,subject:e.target.value})} style={iSel}/>
      </div>
      <div style={{marginBottom:16}}>
        <label style={{display:"block",fontSize:11,color:C.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Body</label>
        <textarea value={emailForm.body} onChange={e=>setEmailForm({...emailForm,body:e.target.value})} rows={7} style={{...iSel,resize:"vertical"}}/>
      </div>
      {(emailForm.photos||[]).length>0&&(
        <div style={{marginBottom:14,background:C.raised,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px"}}>
          <div style={{fontSize:11,color:C.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>Tagged photos to reference ({emailForm.photos.length})</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {emailForm.photos.map(p=>(
              <div key={p.id} style={{textAlign:"center"}}>
                <img src={p.data} alt={p.name} style={{width:60,height:60,objectFit:"cover",borderRadius:6,border:`1px solid ${C.border}`}}/>
                <div style={{fontSize:10,color:C.muted,marginTop:2,maxWidth:60,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.tag}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{display:"flex",gap:8}}>
        <button onClick={sendEmail} style={{background:C.accent,color:"#fff",border:"none",borderRadius:8,padding:"9px 20px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>📤 Open in Email Client</button>
        <button onClick={()=>setShowEmail(false)} style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:8,padding:"9px 14px",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
      </div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <button onClick={onCancel} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:7,padding:"5px 10px",cursor:"pointer",fontSize:12,color:C.sub,fontFamily:"inherit"}}>← Back</button>
        <span style={{fontSize:20}}>{template.icon}</span>
        <span style={{fontWeight:800,fontSize:15,color:C.text}}>{template.name}</span>
      </div>

      {/* Location stamp */}
      <div style={{background:locationStamp&&!locationStamp.error?"#f0fdf4":"#f8fafc",border:`1px solid ${locationStamp&&!locationStamp.error?"#bbf7d0":C.border}`,borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:12,color:locationStamp&&!locationStamp.error?"#15803d":C.sub}}>
        {locLoading ? "📍 Detecting GPS location…" : getLocationSummary()}
      </div>

      {/* Arrival time */}
      <div style={{marginBottom:14}}>
        <label style={{display:"block",fontSize:11,color:C.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Arrival time at site</label>
        <input type="datetime-local" value={arrivalTime} onChange={e=>setArrivalTime(e.target.value)} style={iSel}/>
      </div>

      {/* Second technician */}
      <div style={{marginBottom:16}}>
        <label style={{display:"block",fontSize:11,color:C.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Second Technician (optional — for time tracking KPI)</label>
        <select value={tech2} onChange={e=>setTech2(e.target.value)} style={iSel}>
          <option value="">— None —</option>
          {fieldStaff.filter(f=>f.status==="Active").map(f=><option key={f.id} value={f.name}>{f.name} – {f.role}</option>)}
        </select>
      </div>

      <div style={{height:1,background:C.border,marginBottom:16}}/>

      {/* Dynamic fields */}
      {(template.fields||[]).map(f=>(
        <div key={f.id} style={{marginBottom:16}}>
          <label style={{display:"block",fontSize:12,fontWeight:700,color:C.text,marginBottom:6}}>
            {f.label}
            {f.required&&<span style={{color:C.red,marginLeft:4}}>*</span>}
          </label>

          {f.type==="yesno"&&(
            <div style={{display:"flex",gap:8}}>
              {["Yes","No"].map(opt=>(
                <button key={opt} onClick={()=>setAnswer(f.id,opt)}
                  style={{flex:1,padding:"9px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                    border:`2px solid ${answers[f.id]===opt?(opt==="Yes"?C.green:C.red):C.border}`,
                    background:answers[f.id]===opt?(opt==="Yes"?"#f0fdf4":"#fef2f2"):"#fff",
                    color:answers[f.id]===opt?(opt==="Yes"?C.green:C.red):C.sub}}>
                  {opt==="Yes"?"✅ Yes":"❌ No"}
                </button>
              ))}
            </div>
          )}

          {f.type==="multi"&&(
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {(f.options||[]).map(opt=>(
                <button key={opt} onClick={()=>setAnswer(f.id,opt)}
                  style={{padding:"6px 14px",borderRadius:99,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",
                    border:`1.5px solid ${answers[f.id]===opt?C.accent:C.border}`,
                    background:answers[f.id]===opt?"#eff6ff":"#fff",
                    color:answers[f.id]===opt?C.accent:C.sub}}>
                  {opt}
                </button>
              ))}
            </div>
          )}

          {f.type==="text"&&(
            f.multiline
              ? <textarea value={answers[f.id]||""} onChange={e=>setAnswer(f.id,e.target.value)} rows={3} style={{...iSel,resize:"vertical"}} placeholder="Enter details…"/>
              : <input value={answers[f.id]||""} onChange={e=>setAnswer(f.id,e.target.value)} style={iSel} placeholder="Enter value…"/>
          )}

          {f.type==="photo"&&(
            <div>
              <label style={{display:"inline-flex",alignItems:"center",gap:6,background:C.raised,border:`1.5px dashed ${C.border}`,borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:12,color:C.sub,fontWeight:600}}>
                📷 Add photos
                <input type="file" accept="image/*" multiple onChange={e=>addPhoto(f.id,e)} style={{display:"none"}}/>
              </label>
              {(answers[f.id]||[]).length>0&&(
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8}}>
                  {(answers[f.id]||[]).map((ph,pi)=>(
                    <div key={ph.id} style={{position:"relative"}}>
                      <img src={ph.data} alt={ph.name} style={{width:72,height:72,objectFit:"cover",borderRadius:8,border:`1px solid ${C.border}`}}/>
                      <button onClick={()=>setAnswer(f.id,(answers[f.id]||[]).filter((_,i)=>i!==pi))}
                        style={{position:"absolute",top:-6,right:-6,background:C.red,color:"#fff",border:"none",borderRadius:"50%",width:18,height:18,fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Supplier email trigger */}
      <div style={{background:"#eff6ff",border:`1px solid #bae6fd`,borderRadius:10,padding:"12px 14px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
        <div>
          <div style={{fontWeight:700,fontSize:13,color:C.accent}}>📧 Email Supplier</div>
          <div style={{fontSize:11,color:C.sub,marginTop:2}}>Send compliance plate photos & parts request to a supplier</div>
        </div>
        <button onClick={buildSupplierEmail}
          style={{background:C.accent,color:"#fff",border:"none",borderRadius:8,padding:"8px 16px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
          Compose Email
        </button>
      </div>

      {/* Submit */}
      <div style={{display:"flex",gap:8}}>
        <button onClick={save} disabled={saving}
          style={{background:C.green,color:"#fff",border:"none",borderRadius:8,padding:"10px 24px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
          ✓ Submit Report
        </button>
        <button onClick={onCancel} style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:8,padding:"10px 16px",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   REPORTS PANE — tabbed Diary | Reports
   Lives in the right pane of JobDrawer
═══════════════════════════════════════════ */
function ReportsPane({job, onUpdate, onOpenAttachment, reportTemplates, fieldStaff, vendors}) {
  const [activeTab, setActiveTab] = useState("diary");
  const [fillingTemplate, setFillingTemplate] = useState(null);
  const [viewReport, setViewReport] = useState(null);

  const reports = job.reports || [];

  const saveReport = report => {
    const newReports = [...reports, report];
    // Auto-log to diary
    const diaryEntry = {
      id: uid(),
      type: "visit",
      ts: report.submittedAt,
      contact: job.tech||"",
      subject: `${report.templateIcon} ${report.templateName} submitted`,
      notes: [
        report.tech2 ? `2nd tech: ${report.tech2}` : "",
        report.locationSummary,
        `Arrival: ${fmtTs(report.arrivalTime)}`,
      ].filter(Boolean).join("\n"),
      direction: "outbound",
      files: [],
      source: "report",
      reportId: report.id,
    };
    onUpdate({...job, reports: newReports, diary:[diaryEntry,...(job.diary||[])]});
    setFillingTemplate(null);
    setActiveTab("reports");
  };

  const outcomeColor = o => o==="Yes"?"green":o==="No"?"red":"blue";

  if(fillingTemplate) return (
    <ReportForm
      template={fillingTemplate}
      job={job}
      fieldStaff={fieldStaff}
      vendors={vendors}
      onSave={saveReport}
      onCancel={()=>setFillingTemplate(null)}
    />
  );

  if(viewReport) {
    const tpl = reportTemplates.find(t=>t.id===viewReport.templateId)||{fields:[]};
    return (
      <div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
          <button onClick={()=>setViewReport(null)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:7,padding:"5px 10px",cursor:"pointer",fontSize:12,color:C.sub,fontFamily:"inherit"}}>← Back</button>
          <span style={{fontSize:18}}>{viewReport.templateIcon}</span>
          <div>
            <div style={{fontWeight:800,fontSize:14,color:C.text}}>{viewReport.templateName}</div>
            <div style={{fontSize:11,color:C.muted}}>{fmtTs(viewReport.submittedAt)}</div>
          </div>
        </div>
        <div style={{background:viewReport.source==="gps_captured"?"#f0fdf4":"#f8fafc",border:`1px solid ${viewReport.source==="gps_captured"?"#bbf7d0":C.border}`,borderRadius:10,padding:"8px 12px",marginBottom:12,fontSize:11,color:viewReport.source==="gps_captured"?"#15803d":C.sub}}>
          {viewReport.locationSummary}
        </div>
        {viewReport.tech2&&<div style={{marginBottom:10,fontSize:12,color:C.sub}}>👤 2nd Tech: <strong>{viewReport.tech2}</strong></div>}
        {(tpl.fields||[]).map(f=>{
          const val = viewReport.answers?.[f.id];
          if(!val&&val!==0) return null;
          return(
            <div key={f.id} style={{marginBottom:12,paddingBottom:12,borderBottom:`1px solid ${C.border}`}}>
              <div style={{fontSize:11,color:C.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>{f.label}</div>
              {f.type==="yesno"&&<Badge label={val} color={val==="Yes"?"green":"red"}/>}
              {f.type==="multi"&&<Badge label={val} color="blue"/>}
              {f.type==="text"&&<div style={{fontSize:13,color:C.text,whiteSpace:"pre-wrap"}}>{val}</div>}
              {f.type==="photo"&&Array.isArray(val)&&(
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {val.map(ph=>(
                    <img key={ph.id} src={ph.data} alt={ph.name} onClick={()=>onOpenAttachment(ph,{},val)}
                      style={{width:80,height:80,objectFit:"cover",borderRadius:8,border:`1px solid ${C.border}`,cursor:"pointer"}}/>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      {/* Tab switcher */}
      <div style={{display:"flex",gap:0,marginBottom:14,background:C.raised,border:`1px solid ${C.border}`,borderRadius:10,padding:3}}>
        {[{id:"diary",icon:"📒",label:"Diary"},{id:"reports",icon:"📋",label:`Reports${reports.length>0?` (${reports.length})`:""}`}].map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)}
            style={{flex:1,padding:"7px 12px",borderRadius:8,border:"none",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
              background:activeTab===t.id?"#fff":"transparent",
              color:activeTab===t.id?C.text:C.sub,
              boxShadow:activeTab===t.id?"0 1px 3px rgba(0,0,0,0.08)":"none"}}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {activeTab==="diary"&&(
        <JobDiary job={job} onUpdate={onUpdate} onOpenAttachment={onOpenAttachment}/>
      )}

      {activeTab==="reports"&&(
        <div>
          {/* Start new report */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:12,color:C.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>Start New Report</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {reportTemplates.filter(t=>t.appliesTo.length===0||t.appliesTo.includes(job.type)).map(t=>(
                <button key={t.id} onClick={()=>setFillingTemplate(t)}
                  style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",borderRadius:10,border:`1.5px solid ${C.border}`,background:"#fff",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,color:C.text}}>
                  <span style={{fontSize:18}}>{t.icon}</span>
                  <div style={{textAlign:"left"}}>
                    <div>{t.name}</div>
                    <div style={{fontSize:10,color:C.muted,fontWeight:500}}>{t.fields.length} fields</div>
                  </div>
                </button>
              ))}
              {reportTemplates.filter(t=>t.appliesTo.length===0||t.appliesTo.includes(job.type)).length===0&&(
                <p style={{color:C.muted,fontSize:12}}>No templates match this job type. Configure templates in Settings → Report Templates.</p>
              )}
            </div>
          </div>

          <div style={{height:1,background:C.border,marginBottom:14}}/>

          {/* Past reports */}
          {reports.length===0&&<p style={{color:C.muted,fontSize:12}}>No reports submitted yet.</p>}
          {[...reports].reverse().map(r=>(
            <div key={r.id} onClick={()=>setViewReport(r)}
              style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 14px",marginBottom:8,cursor:"pointer",display:"flex",gap:12,alignItems:"center"}}>
              <span style={{fontSize:22}}>{r.templateIcon}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:13,color:C.text}}>{r.templateName}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:2}}>{fmtTs(r.submittedAt)}</div>
                {r.tech2&&<div style={{fontSize:11,color:C.sub,marginTop:1}}>+ {r.tech2}</div>}
              </div>
              <div style={{flexShrink:0}}>
                <Badge label={r.source==="gps_captured"?"📍 On-site":"⚠️ No GPS"} color={r.source==="gps_captured"?"green":"gray"}/>
              </div>
              <span style={{color:C.muted,fontSize:16}}>›</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   PDF VIEWER — converts base64 to blob URL
═══════════════════════════════════════════ */
function PdfViewer({file}) {
  const openPdf = () => {
    const base64 = file.data.split(",")[1] || file.data;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i);
    const blob = new Blob([bytes], {type:"application/pdf"});
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  return (
    <div style={{textAlign:"center",padding:40,display:"flex",flexDirection:"column",alignItems:"center",gap:20}}>
      <div style={{fontSize:72}}>📄</div>
      <div style={{color:"#f1f5f9",fontWeight:700,fontSize:16}}>{file.name}</div>
      <div style={{color:"#64748b",fontSize:13}}>{fileSizeFmt(file.size)}</div>
      <button onClick={openPdf}
        style={{background:C.accent,color:"#fff",border:"none",borderRadius:10,padding:"14px 28px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:8}}>
        <span>🔗</span> Open PDF in New Tab
      </button>
      <a href={file.data} download={file.name}
        style={{color:"#64748b",fontSize:13,textDecoration:"underline",cursor:"pointer"}}>
        or download file
      </a>
    </div>
  );
}

/* ═══════════════════════════════════════════
   JOB DRAWER — slide-in panel, expandable
═══════════════════════════════════════════ */
function JobDrawer({job, onClose, onUpdate, settings, companies, setCompanies, vendors}) {
  const [expanded, setExpanded] = useState(false);
  const {jobStages, jobSubStages, fieldStaff, jobTypes, reportTemplates=DEFAULT_REPORT_TEMPLATES} = settings;
  const [applianceTypes, setApplianceTypes] = useState(DEFAULT_APPLIANCE_TYPES);
  const [workPresets, setWorkPresets] = useState(DEFAULT_WORK_PRESETS);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [newTenant, setNewTenant] = useState({name:"",email:"",phone:""});
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({});
  const [attachment, setAttachment] = useState(null);

  const openAttachment = (file, entry, siblings) => {
    setAttachment({file, entry, siblings: siblings||[file]});
    setExpanded(true);
  };
  const closeAttachment = () => setAttachment(null);

  // Keyboard left/right arrow navigation for photos
  useEffect(() => {
    if(!attachment) return;
    const handler = e => {
      const sibs = attachment.siblings||[];
      if(sibs.length < 2) return;
      const idx = sibs.findIndex(f=>f.id===attachment.file.id);
      if(e.key==="ArrowLeft" && idx > 0)
        setAttachment(a=>({...a, file:sibs[idx-1]}));
      if(e.key==="ArrowRight" && idx < sibs.length-1)
        setAttachment(a=>({...a, file:sibs[idx+1]}));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [attachment]);

  if(!job) return null;

  const updateJob = updated => onUpdate(updated);

  const startEdit = (field, value) => { setEditing(field); setDraft({[field]: value}); };
  const commitEdit = (field) => {
    if(draft[field] !== undefined) updateJob({...job, [field]: draft[field]});
    setEditing(null);
  };
  const cancelEdit = () => setEditing(null);

  // Editable field row — click label/value to edit inline
  const EF = ({label, field, value, type="text", options=null, placeholder=""}) => {
    const isEditing = editing === field;
    const inputStyle = {width:"100%",background:"#fff",border:`1.5px solid ${C.accent}`,borderRadius:7,padding:"7px 10px",color:C.text,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"};
    return(
      <div style={{display:"flex",justifyContent:"space-between",alignItems:isEditing?"flex-start":"center",padding:"10px 0",borderBottom:`1px solid ${C.border}`,gap:12}}>
        <span style={{color:C.sub,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,flexShrink:0}}>{label}</span>
        {isEditing ? (
          <div style={{display:"flex",gap:6,alignItems:"center",flex:1,minWidth:0}}>
            {options ? (
              <select value={draft[field]||""} onChange={e=>setDraft({[field]:e.target.value})} autoFocus
                style={{...inputStyle,flex:1}}>
                {options.map(o=><option key={o.val??o} value={o.val??o}>{o.label??o}</option>)}
              </select>
            ) : type==="textarea" ? (
              <textarea value={draft[field]||""} onChange={e=>setDraft({[field]:e.target.value})} autoFocus rows={3}
                style={{...inputStyle,flex:1,resize:"vertical"}}/>
            ) : (
              <input type={type} value={draft[field]||""} onChange={e=>setDraft({[field]:e.target.value})} autoFocus
                onKeyDown={e=>{if(e.key==="Enter")commitEdit(field);if(e.key==="Escape")cancelEdit();}}
                style={{...inputStyle,flex:1}}/>
            )}
            <button onClick={()=>commitEdit(field)} style={{background:C.accent,color:"#fff",border:"none",borderRadius:6,padding:"6px 10px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>✓</button>
            <button onClick={cancelEdit} style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:6,padding:"6px 8px",fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>✕</button>
          </div>
        ) : (
          <div onClick={()=>startEdit(field, value)}
            style={{display:"flex",gap:6,alignItems:"center",cursor:"text",flex:1,justifyContent:"flex-end",minWidth:0}}>
            <span style={{color:value?C.text:C.muted,fontSize:13,fontWeight:value?500:400,textAlign:"right",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{value||<span style={{color:C.muted,fontStyle:"italic"}}>— tap to edit</span>}</span>
            <span style={{color:C.muted,fontSize:11,flexShrink:0}}>✎</span>
          </div>
        )}
      </div>
    );
  };

  const saveTenant = () => {
    if(!newTenant.name) return;
    updateJob({...job, tenants:[...(job.tenants||[]), {...newTenant, id:uid()}]});
    setNewTenant({name:"",email:"",phone:""});
    setShowAddTenant(false);
  };

  const createRecall = () => {
    const baseNum = job.ref.replace(/[a-z]+$/,"");
    const allFlat = allJobs(companies);
    const existing = allFlat.filter(j => j.ref === baseNum || j.ref.match(new RegExp(`^${baseNum}[a-z]$`)));
    const suffixes = existing.map(j => { const s=j.ref.replace(baseNum,""); return s||""; }).filter(s=>s);
    const nextChar = suffixes.length===0 ? "a" : String.fromCharCode(97+suffixes.length);
    const recall = {...job, id:uid(), ref:`${baseNum}${nextChar}`, status:"Open", closedDate:null,
      createdDate:new Date().toISOString().split("T")[0], stage:"New", subStage:"",
      tenants:[...(job.tenants||[])], appliances:[...(job.appliances||[])], additionalWorks:[], diary:[]};
    setCompanies(companies.map(co => ({...co, branches: co.branches.map(br => ({...br,
      agents: br.agents.map(ag => ({...ag,
        jobs: (ag.jobs||[]).some(j=>j.id===job.id) ? [...ag.jobs, recall] : ag.jobs
      }))
    }))})));
    onClose();
  };

  const panelW = expanded ? "100%" : "min(900px, 100%)";
  const keyLabel = job.keyMethod==="tenant"?"🧑 Tenant":job.keyMethod==="office"?"🏢 Office":job.keyMethod==="other"?"🔑 Other":"";
  const attFile = attachment?.file;
  const isImg = attFile?.mime?.startsWith("image/");
  const isPdf = attFile?.mime==="application/pdf";
  const isVid = attFile?.mime?.startsWith("video/");
  const attSibs = attachment?.siblings||[];
  const attSibIdx = attSibs.findIndex(f=>f.id===attFile?.id);
  const attHasPrev = attSibIdx > 0;
  const attHasNext = attSibIdx < attSibs.length-1;


  return (
    <>
      {!expanded && <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.25)",zIndex:400}}/>}

      <div style={{position:"fixed",top:0,right:0,bottom:0,width:panelW,background:"#fff",
        boxShadow:"-4px 0 32px rgba(0,0,0,0.15)",zIndex:401,display:"flex",flexDirection:"column",
        transition:"width 0.2s ease",borderLeft:`1px solid ${C.border}`}}>

        {/* Sticky header */}
        <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",
          justifyContent:"space-between",alignItems:"center",flexShrink:0,background:"#fff"}}>
          <div>
            <span style={{color:C.accent,fontWeight:800,fontSize:15}}>{job.ref}</span>
            <span style={{color:C.muted,fontSize:12,marginLeft:10}}>{job.companyName||""} · {job.agentName||""}</span>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {attachment && (
              <button onClick={closeAttachment}
                style={{background:"#fef2f2",border:`1px solid #fecaca`,borderRadius:7,padding:"5px 10px",cursor:"pointer",fontSize:12,color:C.red,fontWeight:700,fontFamily:"inherit"}}>
                ✕ Close Preview
              </button>
            )}
            <button onClick={()=>setExpanded(!expanded)}
              style={{background:"none",border:`1px solid ${C.border}`,borderRadius:7,padding:"5px 10px",cursor:"pointer",fontSize:13,color:C.sub,fontFamily:"inherit"}}>
              {expanded?"⇥ Collapse":"⇤ Expand"}
            </button>
            <button onClick={onClose}
              style={{background:"none",border:`1px solid ${C.border}`,borderRadius:7,padding:"5px 10px",cursor:"pointer",fontSize:18,color:C.muted,lineHeight:1,fontFamily:"inherit"}}>×</button>
          </div>
        </div>

        {/* Body — 3-column when attachment open, 2-column always: left=info, right=diary */}
        <div style={{flex:1,display:"flex",overflow:"hidden"}}>

        {/* LEFT — compact job info */}
        <div style={{flex:`0 0 ${attachment?"260px":"340px"}`,overflowY:"auto",padding:"14px 14px 40px",borderRight:`1px solid ${C.border}`,background:"#fafafa",transition:"flex-basis 0.2s"}}>

          {/* Compact header card */}
          <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"14px",marginBottom:10}}>
            {editing==="address" ? (
              <div style={{display:"flex",gap:6,marginBottom:10}}>
                <input value={draft.address||""} onChange={e=>setDraft({address:e.target.value})} autoFocus
                  onKeyDown={e=>{if(e.key==="Enter")commitEdit("address");if(e.key==="Escape")cancelEdit();}}
                  style={{flex:1,background:"#fff",border:`2px solid ${C.accent}`,borderRadius:7,padding:"7px 10px",color:C.text,fontSize:13,fontWeight:700,fontFamily:"inherit",boxSizing:"border-box"}}/>
                <button onClick={()=>commitEdit("address")} style={{background:C.accent,color:"#fff",border:"none",borderRadius:6,padding:"6px 10px",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✓</button>
                <button onClick={cancelEdit} style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:6,padding:"6px 8px",cursor:"pointer",fontFamily:"inherit"}}>✕</button>
              </div>
            ) : (
              <div onClick={()=>startEdit("address",job.address)} style={{display:"flex",alignItems:"flex-start",gap:6,marginBottom:8,cursor:"text"}}>
                <span style={{color:C.text,fontWeight:800,fontSize:13,flex:1,lineHeight:1.4}}>{job.address}</span>
                <span style={{color:C.muted,fontSize:11,flexShrink:0,marginTop:2}}>✎</span>
              </div>
            )}
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
              <Badge label={job.type} color={job.type==="HVAC"?"blue":job.type==="Plumbing"?"purple":"orange"}/>
              <Badge label={job.status==="Open"?"Open":jobStatus(job)} color={statusColor(job.status==="Open"?"Open":jobStatus(job))}/>
            </div>
            <StageSelector job={job} onUpdate={updateJob} jobStages={jobStages} jobSubStages={jobSubStages}/>
          </div>

          {/* Editable fields — compact */}
          <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"2px 14px",marginBottom:10}}>
            <EF label="Description" field="description" value={job.description} type="textarea" placeholder="Describe the work…"/>
            <EF label="Lead Tech" field="tech" value={job.tech}
              options={[{val:"",label:"— Unassigned —"},...fieldStaff.filter(f=>f.status==="Active").map(f=>({val:f.name,label:`${f.name} – ${f.role}`}))]}/>
            <EF label="Job Type" field="type" value={job.type} options={jobTypes.map(t=>({val:t,label:t}))}/>
            <EF label="Key Access" field="keyMethod" value={keyLabel}
              options={[{val:"",label:"— None —"},{val:"tenant",label:"🧑 Tenant"},{val:"office",label:"🏢 Office"},{val:"other",label:"🔑 Other"}]}/>
            <EF label="Key Notes" field="keyNotes" value={job.keyNotes} type="textarea" placeholder="Access instructions…"/>
            <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.border}`,fontSize:12}}>
              <span style={{color:C.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,fontSize:10}}>Created</span>
              <span style={{color:C.text}}>{fmtDate(job.createdDate)}</span>
            </div>
            {job.closedDate&&<div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.border}`,fontSize:12}}>
              <span style={{color:C.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,fontSize:10}}>Closed</span>
              <span style={{color:C.text}}>{fmtDate(job.closedDate)}</span>
            </div>}
            <div style={{display:"flex",gap:6,padding:"10px 0",flexWrap:"wrap"}}>
              {job.status==="Open"&&<Btn label="✓ Close Job" onClick={()=>updateJob({...job,status:"Closed",closedDate:new Date().toISOString().split("T")[0]})} color={C.orange} small/>}
              <Btn label="🔁 Recall" onClick={createRecall} color={C.purple} small outline/>
            </div>
          </div>

          {/* Tenants compact */}
          <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 14px",marginBottom:10}}>
            <SectionHead title="👥 Tenants" count={(job.tenants||[]).length} action={{label:"+ Add",fn:()=>setShowAddTenant(true)}}/>
            {(job.tenants||[]).length===0&&<p style={{color:C.muted,fontSize:12,margin:"4px 0 6px"}}>No tenants linked.</p>}
            {(job.tenants||[]).map(t=>(
              <div key={t.id} style={{display:"flex",gap:8,alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${C.border}`}}>
                <Avatar name={t.name} size={28} bg="#dcfce7" fg="#15803d"/>
                <div style={{minWidth:0}}>
                  <div style={{color:C.text,fontWeight:700,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.name}</div>
                  {t.phone&&<div style={{color:C.sub,fontSize:11}}>{t.phone}</div>}
                </div>
              </div>
            ))}
          </div>

          {/* Appliances compact */}
          <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 14px",marginBottom:10}}>
            <AppliancesSection appliances={job.appliances||[]} onChange={ap=>updateJob({...job,appliances:ap})} applianceTypes={applianceTypes} onTypesChange={setApplianceTypes}/>
          </div>

          {/* Additional works compact */}
          <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 14px",marginBottom:10}}>
            <AdditionalWorksSection works={job.additionalWorks||[]} onChange={ws=>updateJob({...job,additionalWorks:ws})} workPresets={workPresets} onPresetsChange={setWorkPresets}/>
          </div>

          {/* ══ VISITS ══ */}
          <VisitsSection job={job} onUpdate={updateJob} fieldStaff={fieldStaff}/>

        </div>{/* end left pane */}

        {/* RIGHT — diary + reports tabs */}
        <div style={{flex:attachment?"0 0 280px":"1",overflowY:"auto",padding:"14px 14px 40px",minWidth:0,borderRight:attachment?`1px solid ${C.border}`:"none",transition:"flex 0.2s"}}>
          <ReportsPane job={job} onUpdate={updateJob} onOpenAttachment={openAttachment} reportTemplates={reportTemplates} fieldStaff={fieldStaff} vendors={vendors}/>
        </div>{/* end diary pane */}

        {/* Attachment preview panel */}
        {attachment && attFile && (
          <div style={{flex:"0 0 50%",background:"#0f172a",display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.1)",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
              <div style={{minWidth:0,flex:1}}>
                <div style={{color:"#f1f5f9",fontWeight:700,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{attFile.name}</div>
                <div style={{color:"#64748b",fontSize:11,marginTop:2}}>
                  {fileSizeFmt(attFile.size)}
                  {attSibs.length>1 && <span style={{marginLeft:8,background:"rgba(255,255,255,0.1)",borderRadius:99,padding:"1px 7px",fontSize:10,fontWeight:700,color:"#94a3b8"}}>{attSibIdx+1} / {attSibs.length}</span>}
                </div>
              </div>
              <div style={{display:"flex",gap:8,flexShrink:0,marginLeft:12,alignItems:"center"}}>
                {(isPdf||isVid) && <a href={attFile.data} download={attFile.name} style={{background:"rgba(255,255,255,0.1)",color:"#94a3b8",border:"1px solid rgba(255,255,255,0.15)",borderRadius:6,padding:"5px 10px",fontSize:12,fontWeight:700,textDecoration:"none"}}>⬇</a>}
                <button onClick={closeAttachment} style={{background:"rgba(255,255,255,0.1)",color:"#94a3b8",border:"1px solid rgba(255,255,255,0.15)",borderRadius:6,padding:"5px 10px",fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>×</button>
              </div>
            </div>
            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20,overflow:"auto",position:"relative"}}>
              {attSibs.length>1 && (
                <button onClick={()=>setAttachment(a=>({...a,file:attSibs[attSibIdx-1]}))} disabled={!attHasPrev}
                  style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",zIndex:2,background:attHasPrev?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.04)",color:attHasPrev?"#f1f5f9":"#334155",border:"none",borderRadius:8,width:40,height:40,fontSize:22,cursor:attHasPrev?"pointer":"default",fontFamily:"inherit"}}>
                  ‹
                </button>
              )}
              <div style={{maxWidth:"100%",maxHeight:"100%",padding:attSibs.length>1?"0 50px":"0",display:"flex",alignItems:"center",justifyContent:"center",width:"100%",height:"100%"}}>
                {isImg && <img src={attFile.data} alt={attFile.name} style={{maxWidth:"100%",maxHeight:"100%",borderRadius:10,boxShadow:"0 8px 32px rgba(0,0,0,0.6)",objectFit:"contain"}}/>}
                {isVid && (
                  <video controls autoPlay style={{maxWidth:"100%",maxHeight:"100%",borderRadius:10,boxShadow:"0 8px 32px rgba(0,0,0,0.6)"}}>
                    <source src={attFile.data} type={attFile.mime}/>
                  </video>
                )}
                {isPdf && <PdfViewer file={attFile}/>}
              </div>
              {attSibs.length>1 && (
                <button onClick={()=>setAttachment(a=>({...a,file:attSibs[attSibIdx+1]}))} disabled={!attHasNext}
                  style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",zIndex:2,background:attHasNext?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.04)",color:attHasNext?"#f1f5f9":"#334155",border:"none",borderRadius:8,width:40,height:40,fontSize:22,cursor:attHasNext?"pointer":"default",fontFamily:"inherit"}}>
                  ›
                </button>
              )}
            </div>
            {attSibs.length>1 && (
              <div style={{display:"flex",gap:6,padding:"10px 14px",borderTop:"1px solid rgba(255,255,255,0.08)",overflowX:"auto",flexShrink:0}}>
                {attSibs.map(s=>(
                  <div key={s.id} onClick={()=>setAttachment(a=>({...a,file:s}))}
                    style={{width:48,height:48,borderRadius:6,overflow:"hidden",flexShrink:0,cursor:"pointer",border:s.id===attFile.id?"2px solid #3b82f6":"2px solid transparent",opacity:s.id===attFile.id?1:0.5}}>
                    <img src={s.data} alt={s.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        </div>{/* end body flex */}
      </div>{/* end outer panel */}

      {showAddTenant&&(
        <Modal title="Add Tenant" onClose={()=>setShowAddTenant(false)} onSave={saveTenant}>
          <FF label="Full Name" value={newTenant.name} onChange={v=>setNewTenant({...newTenant,name:v})} placeholder="e.g. John Smith" required/>
          <FF label="Email" value={newTenant.email} onChange={v=>setNewTenant({...newTenant,email:v})} placeholder="john@email.com" type="email"/>
          <FF label="Phone" value={newTenant.phone} onChange={v=>setNewTenant({...newTenant,phone:v})} placeholder="0400 000 000"/>
        </Modal>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════
   JOB HISTORY
═══════════════════════════════════════════ */
function HistoryTab({settings, companies, setCompanies, vendors}) {
  const {jobStages,jobSubStages,fieldStaff,jobTypes,setJobTypes} = settings;
  const allFlat = allJobs(companies);
  const closed = allFlat.filter(j=>j.status==="Closed");
  const [search,setSearch]=useState("");
  const [typeFilter,setTypeFilter]=useState("All");
  const [showNew,setShowNew]=useState(false);
  const [drawerJob, setDrawerJob] = useState(null);

  // New job form state
  const emptyJob={type:"",address:"",description:"",tech:"",keyMethod:"",keyNotes:"",status:"Open",stage:"New",subStage:""};
  const [nj,setNj]=useState(emptyJob);
  const [selCo,setSelCo]=useState("");
  const [selBr,setSelBr]=useState("");
  const [selAg,setSelAg]=useState("");
  const [tenants,setTenants]=useState([]);
  const [tForm,setTForm]=useState({name:"",email:"",phone:""});

  const addTenant=()=>{if(!tForm.name)return;setTenants([...tenants,{...tForm,id:uid()}]);setTForm({name:"",email:"",phone:""});};
  const removeTenant=id=>setTenants(tenants.filter(t=>t.id!==id));

  const openNew=()=>{
    setNj(emptyJob);setSelCo("");setSelBr("");setSelAg("");setTenants([]);setTForm({name:"",email:"",phone:""});
    setShowNew(true);
  };

  const saveNewJob=()=>{
    if(!nj.address||!selCo||!selBr||!selAg)return;
    const ref=nextJobRef();
    const job={...nj,ref,id:uid(),type:nj.type||jobTypes[0]||"",
      createdDate:new Date().toISOString().split("T")[0],
      closedDate:nj.status==="Closed"?new Date().toISOString().split("T")[0]:null,
      tenants,appliances:[],additionalWorks:[],diary:[]};
    setCompanies(companies.map(co=>co.id===selCo?{...co,branches:co.branches.map(br=>br.id===selBr?{...br,agents:br.agents.map(ag=>ag.id===selAg?{...ag,jobs:[...(ag.jobs||[]),job]}:ag)}:br)}:co));
    setShowNew(false);
  };

  // Update a job in place across companies
  const updateDrawerJob = updated => {
    setCompanies(companies.map(co=>({...co, branches:co.branches.map(br=>({...br,
      agents:br.agents.map(ag=>({...ag,
        jobs:(ag.jobs||[]).map(j=>j.id===updated.id?updated:j)
      }))
    }))})));
    setDrawerJob(updated);
  };

  const filtered = allJobs(companies).filter(j=>{
    const matchType=typeFilter==="All"||j.type===typeFilter;
    const matchSearch=!search||j.ref.toLowerCase().includes(search.toLowerCase())||j.address.toLowerCase().includes(search.toLowerCase())||(j.tech||"").toLowerCase().includes(search.toLowerCase());
    return matchType&&matchSearch;
  }).sort((a,b)=>new Date(b.closedDate||b.createdDate)-new Date(a.closedDate||a.createdDate));

  // Keep drawerJob in sync with latest companies state
  const liveDrawerJob = drawerJob
    ? allJobs(companies).find(j=>j.id===drawerJob.id) || drawerJob
    : null;

  return(<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <div><h2 style={{fontSize:18,fontWeight:800,color:C.text}}>Job History</h2><p style={{color:C.sub,fontSize:12,marginTop:2}}>{closed.length} completed · {allFlat.filter(j=>j.status==="Open").length} open</p></div>
      <Btn label="+ New Job" onClick={openNew}/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
      <StatCard label="Total Jobs" value={allFlat.length} icon="📋" color={C.accent}/>
      <StatCard label="Completed" value={closed.length} icon="✅" color={C.green}/>
      <StatCard label="Open" value={allFlat.filter(j=>j.status==="Open").length} icon="🔓" color={C.orange}/>
    </div>
    <input placeholder="Search jobs…" value={search} onChange={e=>setSearch(e.target.value)} style={{width:"100%",background:"#fff",border:`1px solid ${C.border}`,borderRadius:9,padding:"10px 14px",color:C.text,fontSize:14,marginBottom:12,fontFamily:"inherit",boxSizing:"border-box"}}/>
    <div style={{display:"flex",gap:8,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
      {["All","HVAC","Plumbing","Electrical"].map(t=><Pill key={t} label={t} active={typeFilter===t} onClick={()=>setTypeFilter(t)}/>)}
    </div>
    {filtered.map(job=>{
      const js=jobStatus(job);
      return(<RowCard key={job.id} onClick={()=>setDrawerJob(job)}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{flex:1,minWidth:0,marginRight:10}}>
            <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
              <span style={{color:C.accent,fontWeight:800,fontSize:13}}>{job.ref}</span>
              <Badge label={job.type} color={job.type==="HVAC"?"blue":job.type==="Plumbing"?"purple":"orange"}/>
              <Badge label={js} color={statusColor(js)}/>
              {job.stage&&<Badge label={job.stage} color={stageColor(job.stage)}/>}
              {job.subStage&&<Badge label={job.subStage} color="purple"/>}
            </div>
            <div style={{color:C.text,fontSize:13,fontWeight:600,marginTop:4}}>{job.address}</div>
            <div style={{color:C.sub,fontSize:12,marginTop:2}}>{job.description}</div>
            <div style={{display:"flex",gap:10,marginTop:6,fontSize:12,color:C.sub,flexWrap:"wrap"}}>
              <span>👷 {job.tech||"Unassigned"}</span>
              <span>🏢 {job.companyName}</span>
              <span>👤 {job.agentName}</span>
              {job.closedDate&&<span>📅 Closed {fmtDate(job.closedDate)}</span>}
              {job.tenants&&job.tenants.length>0&&<span>👥 {job.tenants.length} tenant{job.tenants.length!==1?"s":""}</span>}
            </div>
          </div>
          <span style={{color:C.muted,fontSize:16,flexShrink:0}}>›</span>
        </div>
      </RowCard>);
    })}
    {filtered.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:C.muted}}><div style={{fontSize:32,marginBottom:8}}>📂</div><div style={{fontSize:14,fontWeight:600}}>No jobs found</div></div>}

    {/* Job drawer */}
    {liveDrawerJob&&(
      <JobDrawer
        job={liveDrawerJob}
        onClose={()=>setDrawerJob(null)}
        onUpdate={updateDrawerJob}
        settings={settings}
        companies={companies}
        setCompanies={setCompanies}
        vendors={vendors}
      />
    )}

    {showNew&&(
      <Modal title="New Job" onClose={()=>setShowNew(false)} onSave={saveNewJob} wide>
        <div style={{background:"#eff6ff",border:`1px solid ${C.accent}`,borderRadius:8,padding:"8px 12px",marginBottom:16,fontSize:12,color:C.accent,fontWeight:600}}>🔢 Number assigned automatically on save</div>
        <QuickAssignPicker
          companies={companies} setCompanies={setCompanies}
          selCo={selCo} setSelCo={v=>{setSelCo(v);setSelBr("");setSelAg("");}}
          selBr={selBr} setSelBr={v=>{setSelBr(v);setSelAg("");}}
          selAg={selAg} setSelAg={setSelAg}
        />
        <FF label="Property Address" value={nj.address} onChange={v=>setNj({...nj,address:v})} placeholder="e.g. 22 Oak St, Parramatta NSW" required/>
        <FF label="Description" value={nj.description} onChange={v=>setNj({...nj,description:v})} placeholder="Describe the work needed..." type="textarea"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
          <div><label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Job Type</label><select value={nj.type||jobTypes[0]} onChange={e=>setNj({...nj,type:e.target.value})} style={{width:"100%",background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}>{jobTypes.map(t=><option key={t}>{t}</option>)}</select></div>
          <div><label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Stage</label><select value={nj.stage} onChange={e=>setNj({...nj,stage:e.target.value})} style={{width:"100%",background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}>{jobStages.map(s=><option key={s}>{s}</option>)}</select></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
          <div><label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Sub-stage</label><select value={nj.subStage} onChange={e=>setNj({...nj,subStage:e.target.value})} style={{width:"100%",background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}><option value="">— None —</option>{jobSubStages.map(s=><option key={s}>{s}</option>)}</select></div>
          <div><label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Status</label><select value={nj.status} onChange={e=>setNj({...nj,status:e.target.value})} style={{width:"100%",background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}><option>Open</option><option>Closed</option></select></div>
        </div>
        <div style={{marginBottom:14}}><label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Field Staff</label><select value={nj.tech} onChange={e=>setNj({...nj,tech:e.target.value})} style={{width:"100%",background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}><option value="">— Unassigned —</option>{fieldStaff.filter(f=>f.status==="Active").map(f=><option key={f.id} value={f.name}>{f.name} – {f.role}</option>)}</select></div>
        <div style={{background:C.raised,border:`1px solid ${C.border}`,borderRadius:10,padding:"14px",marginBottom:14}}>
          <div style={{fontWeight:700,fontSize:13,color:C.text,marginBottom:12}}>👥 Tenants</div>
          {tenants.map(t=>(
            <div key={t.id} style={{display:"flex",gap:10,alignItems:"center",padding:"8px 10px",background:"#fff",border:`1px solid ${C.border}`,borderRadius:8,marginBottom:8}}>
              <Avatar name={t.name} size={28} bg="#dcfce7" fg="#15803d"/>
              <div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:13,color:C.text}}>{t.name}</div><div style={{fontSize:12,color:C.sub}}>{t.email} {t.phone}</div></div>
              <button onClick={()=>removeTenant(t.id)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16}}>✕</button>
            </div>
          ))}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",gap:8,alignItems:"end"}}>
            <input value={tForm.name} onChange={e=>setTForm({...tForm,name:e.target.value})} placeholder="Name" style={{width:"100%",background:"#fff",border:`1px solid ${C.border}`,borderRadius:7,padding:"7px 10px",fontSize:12,color:C.text,fontFamily:"inherit",boxSizing:"border-box"}}/>
            <input value={tForm.email} onChange={e=>setTForm({...tForm,email:e.target.value})} placeholder="Email" style={{width:"100%",background:"#fff",border:`1px solid ${C.border}`,borderRadius:7,padding:"7px 10px",fontSize:12,color:C.text,fontFamily:"inherit",boxSizing:"border-box"}}/>
            <input value={tForm.phone} onChange={e=>setTForm({...tForm,phone:e.target.value})} placeholder="Phone" style={{width:"100%",background:"#fff",border:`1px solid ${C.border}`,borderRadius:7,padding:"7px 10px",fontSize:12,color:C.text,fontFamily:"inherit",boxSizing:"border-box"}}/>
            <button onClick={addTenant} style={{background:C.accent,color:"#fff",border:"none",borderRadius:7,padding:"7px 12px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ Add</button>
          </div>
        </div>
        <div style={{marginBottom:14}}><label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Key Access</label><div style={{display:"flex",flexDirection:"column",gap:6}}>{[{val:"tenant",label:"🧑 Tenant to give access"},{val:"office",label:"🏢 Collect from office"},{val:"other",label:"🔑 Other"}].map(opt=>(<label key={opt.val} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:8,border:`1.5px solid ${nj.keyMethod===opt.val?C.accent:C.border}`,background:nj.keyMethod===opt.val?"#eff6ff":"#fff",cursor:"pointer"}}><input type="radio" name="histKeyMethod" checked={nj.keyMethod===opt.val} onChange={()=>setNj({...nj,keyMethod:opt.val})} style={{accentColor:C.accent}}/><span style={{fontSize:13,fontWeight:nj.keyMethod===opt.val?700:500,color:C.text}}>{opt.label}</span></label>))}</div>{nj.keyMethod&&<textarea value={nj.keyNotes||""} onChange={e=>setNj({...nj,keyNotes:e.target.value})} placeholder="Access notes…" rows={2} style={{width:"100%",marginTop:8,background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit",resize:"vertical",boxSizing:"border-box"}}/>}</div>
      </Modal>
    )}
  </div>);
}

/* ═══════════════════════════════════════════
   QUOTES
═══════════════════════════════════════════ */
function QuotesTab() {
  const [quotes]=useState(SEED_QUOTES);
  const [sel,setSel]=useState(null);
  const [search,setSearch]=useState("");
  const [statusFilter,setStatusFilter]=useState("All");
  const filtered=quotes.filter(q=>{const ms=statusFilter==="All"||q.status===statusFilter;const mt=!search||q.ref.toLowerCase().includes(search.toLowerCase())||q.client.toLowerCase().includes(search.toLowerCase());return ms&&mt;});
  const statusCol=s=>s==="Accepted"?"green":s==="Sent"?"blue":s==="Draft"?"gray":s==="Expired"?"red":"gray";
  const totalPending=quotes.filter(q=>q.status==="Sent").reduce((s,q)=>s+q.total,0);
  const totalAccepted=quotes.filter(q=>q.status==="Accepted").reduce((s,q)=>s+q.total,0);
  if(sel)return(<div><Breadcrumb items={[{label:"Quotes",fn:()=>setSel(null)},{label:sel.ref}]}/><Card style={{marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}><div><div style={{color:C.accent,fontWeight:800,fontSize:13}}>{sel.ref}</div><div style={{color:C.text,fontWeight:800,fontSize:18,marginTop:2}}>{sel.client}</div></div><Badge label={sel.status} color={statusCol(sel.status)}/></div><Field label="Contact" value={sel.contact}/><Field label="Date" value={fmtDate(sel.date)}/><Field label="Expiry" value={fmtDate(sel.expiry)}/></Card><Card style={{marginBottom:14}}><SectionHead title="Line Items"/><div style={{borderBottom:`1px solid ${C.border}`,paddingBottom:8,marginBottom:8,display:"grid",gridTemplateColumns:"1fr auto auto auto",gap:8}}>{["Description","Qty","Rate","Amount"].map(h=><span key={h} style={{color:C.sub,fontSize:11,fontWeight:700,textTransform:"uppercase"}}>{h}</span>)}</div>{sel.items.map((item,i)=>(<div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto auto auto",gap:8,padding:"8px 0",borderBottom:`1px solid ${C.border}`}}><span style={{color:C.text,fontSize:13}}>{item.desc}</span><span style={{color:C.sub,fontSize:13,textAlign:"right"}}>{item.qty} {item.unit}</span><span style={{color:C.sub,fontSize:13,textAlign:"right"}}>{fmtMoney(item.rate)}</span><span style={{color:C.text,fontSize:13,fontWeight:700,textAlign:"right"}}>{fmtMoney(item.amount)}</span></div>))}<div style={{display:"flex",justifyContent:"flex-end",marginTop:12,paddingTop:8,borderTop:`2px solid ${C.border}`}}><div style={{textAlign:"right"}}><div style={{color:C.sub,fontSize:12,fontWeight:600}}>TOTAL</div><div style={{color:C.text,fontWeight:900,fontSize:22}}>{fmtMoney(sel.total)}</div></div></div></Card><div style={{display:"flex",gap:10}}>{sel.status==="Draft"&&<Btn label="Send Quote" color={C.accent}/>}{sel.status==="Sent"&&<Btn label="Mark Accepted" color={C.green}/>}<Btn label="Convert to Invoice" color={C.purple} outline/></div></div>);
  return(<div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div><h2 style={{fontSize:18,fontWeight:800,color:C.text}}>Quotes</h2><p style={{color:C.sub,fontSize:12,marginTop:2}}>{quotes.length} quotes total</p></div><Btn label="+ New Quote" color={C.purple}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}><StatCard label="Pending" value={fmtMoney(totalPending)} sub={`${quotes.filter(q=>q.status==="Sent").length} quotes sent`} icon="📤" color={C.accent}/><StatCard label="Accepted" value={fmtMoney(totalAccepted)} sub={`${quotes.filter(q=>q.status==="Accepted").length} quotes`} icon="✅" color={C.green}/></div><input placeholder="Search quotes…" value={search} onChange={e=>setSearch(e.target.value)} style={{width:"100%",background:"#fff",border:`1px solid ${C.border}`,borderRadius:9,padding:"10px 14px",color:C.text,fontSize:14,marginBottom:12,fontFamily:"inherit",boxSizing:"border-box"}}/><div style={{display:"flex",gap:8,marginBottom:14,overflowX:"auto",paddingBottom:4}}>{["All","Draft","Sent","Accepted","Expired"].map(s=><Pill key={s} label={s} active={statusFilter===s} onClick={()=>setStatusFilter(s)}/>)}</div>{filtered.map(q=>(<RowCard key={q.id} onClick={()=>setSel(q)}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div style={{flex:1,minWidth:0,marginRight:10}}><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}><span style={{color:C.accent,fontWeight:800,fontSize:13}}>{q.ref}</span><Badge label={q.status} color={statusCol(q.status)}/></div><div style={{color:C.text,fontWeight:700,fontSize:14,marginTop:4}}>{q.client}</div><div style={{color:C.sub,fontSize:12,marginTop:2}}>Contact: {q.contact} · Expires {fmtDate(q.expiry)}</div></div><div style={{textAlign:"right",flexShrink:0}}><div style={{color:C.text,fontWeight:900,fontSize:16}}>{fmtMoney(q.total)}</div><div style={{color:C.muted,fontSize:11,marginTop:2}}>{q.items.length} items</div></div></div></RowCard>))}</div>);
}

/* ═══════════════════════════════════════════
   INVOICES
═══════════════════════════════════════════ */
function InvoicesTab() {
  const [invoices]=useState(SEED_INVOICES);
  const [sel,setSel]=useState(null);
  const [statusFilter,setStatusFilter]=useState("All");
  const [search,setSearch]=useState("");
  const filtered=invoices.filter(i=>{const ms=statusFilter==="All"||i.status===statusFilter;const mt=!search||i.ref.toLowerCase().includes(search.toLowerCase())||i.client.toLowerCase().includes(search.toLowerCase());return ms&&mt;});
  const statusCol=s=>s==="Paid"?"green":s==="Sent"?"blue":s==="Overdue"?"red":s==="Draft"?"gray":"gray";
  const totalOwing=invoices.filter(i=>i.status!=="Paid").reduce((s,i)=>s+i.total,0);
  const totalPaid=invoices.filter(i=>i.status==="Paid").reduce((s,i)=>s+i.total,0);
  if(sel)return(<div><Breadcrumb items={[{label:"Invoices",fn:()=>setSel(null)},{label:sel.ref}]}/><Card style={{marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}><div><div style={{color:C.accent,fontWeight:800,fontSize:13}}>{sel.ref}</div><div style={{color:C.text,fontWeight:800,fontSize:18,marginTop:2}}>{sel.client}</div></div><Badge label={sel.status} color={statusCol(sel.status)}/></div><Field label="Job Ref" value={sel.jobRef}/><Field label="Contact" value={sel.contact}/><Field label="Invoice Date" value={fmtDate(sel.date)}/><Field label="Due Date" value={fmtDate(sel.due)}/>{sel.paidDate&&<Field label="Paid Date" value={fmtDate(sel.paidDate)}/>}</Card><Card style={{marginBottom:14}}><SectionHead title="Line Items"/><div style={{borderBottom:`1px solid ${C.border}`,paddingBottom:8,marginBottom:8,display:"grid",gridTemplateColumns:"1fr auto auto auto",gap:8}}>{["Description","Qty","Rate","Amount"].map(h=><span key={h} style={{color:C.sub,fontSize:11,fontWeight:700,textTransform:"uppercase"}}>{h}</span>)}</div>{sel.items.map((item,i)=>(<div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto auto auto",gap:8,padding:"8px 0",borderBottom:`1px solid ${C.border}`}}><span style={{color:C.text,fontSize:13}}>{item.desc}</span><span style={{color:C.sub,fontSize:13,textAlign:"right"}}>{item.qty} {item.unit}</span><span style={{color:C.sub,fontSize:13,textAlign:"right"}}>{fmtMoney(item.rate)}</span><span style={{color:C.text,fontSize:13,fontWeight:700,textAlign:"right"}}>{fmtMoney(item.amount)}</span></div>))}<div style={{display:"flex",justifyContent:"flex-end",marginTop:12,paddingTop:8,borderTop:`2px solid ${C.border}`}}><div style={{textAlign:"right"}}><div style={{color:C.sub,fontSize:12,fontWeight:600}}>TOTAL</div><div style={{color:C.text,fontWeight:900,fontSize:22}}>{fmtMoney(sel.total)}</div></div></div></Card>{sel.status!=="Paid"&&<Btn label="Mark as Paid" color={C.green}/>}</div>);
  return(<div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div><h2 style={{fontSize:18,fontWeight:800,color:C.text}}>Invoices</h2><p style={{color:C.sub,fontSize:12,marginTop:2}}>{invoices.length} invoices</p></div><Btn label="+ New Invoice" color={C.green}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}><StatCard label="Outstanding" value={fmtMoney(totalOwing)} sub={`${invoices.filter(i=>i.status!=="Paid").length} unpaid`} icon="⏳" color={C.red}/><StatCard label="Collected" value={fmtMoney(totalPaid)} sub={`${invoices.filter(i=>i.status==="Paid").length} paid`} icon="💰" color={C.green}/></div><input placeholder="Search invoices…" value={search} onChange={e=>setSearch(e.target.value)} style={{width:"100%",background:"#fff",border:`1px solid ${C.border}`,borderRadius:9,padding:"10px 14px",color:C.text,fontSize:14,marginBottom:12,fontFamily:"inherit",boxSizing:"border-box"}}/><div style={{display:"flex",gap:8,marginBottom:14,overflowX:"auto",paddingBottom:4}}>{["All","Draft","Sent","Overdue","Paid"].map(s=><Pill key={s} label={s} active={statusFilter===s} onClick={()=>setStatusFilter(s)}/>)}</div>{filtered.map(inv=>(<RowCard key={inv.id} onClick={()=>setSel(inv)}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div style={{flex:1,minWidth:0,marginRight:10}}><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}><span style={{color:C.accent,fontWeight:800,fontSize:13}}>{inv.ref}</span><Badge label={inv.status} color={statusCol(inv.status)}/></div><div style={{color:C.text,fontWeight:700,fontSize:14,marginTop:4}}>{inv.client}</div><div style={{color:C.sub,fontSize:12,marginTop:2}}>Job: {inv.jobRef} · Due {fmtDate(inv.due)}</div></div><div style={{textAlign:"right",flexShrink:0}}><div style={{color:inv.status==="Overdue"?C.red:C.text,fontWeight:900,fontSize:16}}>{fmtMoney(inv.total)}</div></div></div></RowCard>))}</div>);
}

/* ═══════════════════════════════════════════
   INVENTORY
═══════════════════════════════════════════ */
function InventoryTab() {
  const [inventory]=useState(SEED_INVENTORY);
  const [catFilter,setCatFilter]=useState("All");
  const [search,setSearch]=useState("");
  const cats=["All",...new Set(inventory.map(i=>i.category))];
  const filtered=inventory.filter(i=>{const mc=catFilter==="All"||i.category===catFilter;const ms=!search||i.name.toLowerCase().includes(search.toLowerCase())||i.sku.toLowerCase().includes(search.toLowerCase());return mc&&ms;});
  const lowStock=inventory.filter(i=>i.qty<=i.minQty);
  const outOfStock=inventory.filter(i=>i.qty===0);
  const stockColor=item=>item.qty===0?"red":item.qty<=item.minQty?"orange":"green";
  return(<div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div><h2 style={{fontSize:18,fontWeight:800,color:C.text}}>Inventory</h2><p style={{color:C.sub,fontSize:12,marginTop:2}}>{inventory.length} items tracked</p></div><Btn label="+ Add Item" color={C.purple}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}><StatCard label="Total Items" value={inventory.length} icon="📦" color={C.accent}/><StatCard label="Low Stock" value={lowStock.length} sub="at or below minimum" icon="⚠️" color={C.orange}/><StatCard label="Out of Stock" value={outOfStock.length} icon="🚫" color={C.red}/></div>{lowStock.length>0&&(<div style={{background:"#fef9c3",border:"1px solid #fde047",borderRadius:10,padding:"12px 14px",marginBottom:14}}><div style={{fontWeight:700,fontSize:13,color:"#854d0e",marginBottom:6}}>⚠️ Low Stock Alert</div>{lowStock.map(i=><div key={i.id} style={{fontSize:12,color:"#92400e",marginTop:3}}>• {i.name} — {i.qty} remaining (min {i.minQty})</div>)}</div>)}<input placeholder="Search inventory…" value={search} onChange={e=>setSearch(e.target.value)} style={{width:"100%",background:"#fff",border:`1px solid ${C.border}`,borderRadius:9,padding:"10px 14px",color:C.text,fontSize:14,marginBottom:12,fontFamily:"inherit",boxSizing:"border-box"}}/><div style={{display:"flex",gap:8,marginBottom:14,overflowX:"auto",paddingBottom:4}}>{cats.map(c=><Pill key={c} label={c} active={catFilter===c} onClick={()=>setCatFilter(c)}/>)}</div>{filtered.map(item=>(<RowCard key={item.id}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div style={{flex:1,minWidth:0,marginRight:10}}><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}><span style={{color:C.accent,fontWeight:700,fontSize:11}}>{item.sku}</span><Badge label={item.category} color="blue"/><Badge label={item.qty===0?"Out of Stock":item.qty<=item.minQty?"Low Stock":"In Stock"} color={stockColor(item)}/></div><div style={{color:C.text,fontWeight:700,fontSize:14,marginTop:4}}>{item.name}</div><div style={{display:"flex",gap:10,marginTop:4,fontSize:12,color:C.sub,flexWrap:"wrap"}}><span>📍 {item.location}</span><span>🏭 {item.supplier}</span><span>Min qty: {item.minQty}</span></div></div><div style={{textAlign:"right",flexShrink:0}}><div style={{color:stockColor(item)==="red"?C.red:stockColor(item)==="orange"?C.orange:C.green,fontWeight:900,fontSize:24}}>{item.qty}</div><div style={{color:C.muted,fontSize:11,marginTop:2}}>{fmtMoney(item.unitCost)} each</div></div></div></RowCard>))}</div>);
}

/* ═══════════════════════════════════════════
   REPORTS
═══════════════════════════════════════════ */
function ReportsTab() {
  const jobs=allJobs();
  const invoices=SEED_INVOICES;
  const openJobs=jobs.filter(j=>j.status==="Open");
  const closedJobs=jobs.filter(j=>j.status==="Closed");
  const revenue=invoices.filter(i=>i.status==="Paid").reduce((s,i)=>s+i.total,0);
  const outstanding=invoices.filter(i=>i.status!=="Paid").reduce((s,i)=>s+i.total,0);
  const jobsByType=DEFAULT_JOB_TYPES.map(t=>({type:t,count:jobs.filter(j=>j.type===t).length}));
  const jobsByTech=DEFAULT_TECHNICIANS.map(t=>({tech:t,open:openJobs.filter(j=>j.tech===t).length,closed:closedJobs.filter(j=>j.tech===t).length}));
  return(<div><div style={{marginBottom:16}}><h2 style={{fontSize:18,fontWeight:800,color:C.text}}>Reports</h2><p style={{color:C.sub,fontSize:12,marginTop:2}}>Business overview</p></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}><StatCard label="Total Revenue" value={fmtMoney(revenue)} sub="from paid invoices" icon="💰" color={C.green}/><StatCard label="Outstanding" value={fmtMoney(outstanding)} sub="unpaid invoices" icon="⏳" color={C.red}/><StatCard label="Open Jobs" value={openJobs.length} sub="awaiting completion" icon="🔓" color={C.orange}/><StatCard label="Jobs Completed" value={closedJobs.length} sub="all time" icon="✅" color={C.accent}/></div><Card style={{marginBottom:16}}><SectionHead title="📊 Jobs by Type"/>{jobsByType.map(jt=>(<div key={jt.type} style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:13,fontWeight:600,color:C.text}}>{jt.type}</span><span style={{fontSize:13,fontWeight:700,color:C.sub}}>{jt.count} jobs</span></div><div style={{background:C.raised,borderRadius:99,height:8,overflow:"hidden"}}><div style={{background:jt.type==="HVAC"?C.accent:jt.type==="Plumbing"?C.purple:C.orange,height:"100%",borderRadius:99,width:`${jobs.length?Math.round(jt.count/jobs.length*100):0}%`,transition:"width 0.5s"}}/></div></div>))}</Card><Card style={{marginBottom:16}}><SectionHead title="👷 Technician Workload"/>{jobsByTech.map(jt=>(<div key={jt.tech} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${C.border}`}}><Avatar name={jt.tech} size={34} bg="#dbeafe" fg="#1d4ed8"/><div style={{flex:1}}><div style={{color:C.text,fontWeight:700,fontSize:13}}>{jt.tech}</div><div style={{color:C.sub,fontSize:12}}>{jt.open} open · {jt.closed} completed</div></div><div style={{display:"flex",gap:6}}><Badge label={`${jt.open} open`} color="blue"/><Badge label={`${jt.closed} done`} color="green"/></div></div>))}</Card><Card><SectionHead title="📋 Invoice Summary"/>{[["Paid",invoices.filter(i=>i.status==="Paid"),"green"],["Overdue",invoices.filter(i=>i.status==="Overdue"),"red"],["Sent",invoices.filter(i=>i.status==="Sent"),"blue"]].map(([label,items,color])=>(<div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}><div style={{display:"flex",gap:10,alignItems:"center"}}><Badge label={label} color={color}/><span style={{fontSize:12,color:C.sub}}>{items.length} invoice{items.length!==1?"s":""}</span></div><span style={{fontWeight:700,color:C.text}}>{fmtMoney(items.reduce((s,i)=>s+i.total,0))}</span></div>))}</Card></div>);
}

/* ═══════════════════════════════════════════
   NAV + ROOT
═══════════════════════════════════════════ */
const NAV_GROUPS = [
  {group:"Contacts", items:[
    {id:"customers",icon:"🏢",label:"Companies & Tenants"},
    {id:"vendors",icon:"📦",label:"Vendors & Suppliers"},
  ]},
  {group:"Operations", items:[
    {id:"dispatch",icon:"📋",label:"Dispatch Board"},
    {id:"history",icon:"📂",label:"Job History"},
  ]},
  {group:"Finance", items:[
    {id:"quotes",icon:"📝",label:"Quotes"},
    {id:"invoices",icon:"🧾",label:"Invoices"},
    {id:"inventory",icon:"📦",label:"Inventory"},
    {id:"products",icon:"🔍",label:"Product Comparison"},
  ]},
  {group:"Reports", items:[
    {id:"reports",icon:"📊",label:"Reports"},
  ]},
];
const ALL_NAV = NAV_GROUPS.flatMap(g=>g.items);
const MOBILE_NAV = [
  {id:"customers",icon:"🏢",label:"Contacts"},
  {id:"dispatch",icon:"📋",label:"Dispatch"},
  {id:"quotes",icon:"📝",label:"Finance"},
  {id:"reports",icon:"📊",label:"Reports"},
  {id:"settings",icon:"⚙️",label:"Settings"},
];

function App() {
  const [tab,setTab]=useState("customers");
  const [isMobile,setIsMobile]=useState(window.innerWidth<768);
  const settings = useSettings();
  const [companies,setCompanies]=useState(SEED_COMPANIES);
  const [vendors,setVendors]=useState(SEED_VENDORS);
  useEffect(()=>{const h=()=>setIsMobile(window.innerWidth<768);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);

  return(
    <div style={{display:"flex",minHeight:"100vh",background:C.bg,fontFamily:"'Inter','Segoe UI',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0;}input:focus,select:focus,textarea:focus{outline:none;border-color:#0ea5e9!important;}::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:3px;}`}</style>

      {/* DESKTOP SIDEBAR */}
      {!isMobile&&(
        <div style={{width:230,background:C.sidebar,display:"flex",flexDirection:"column",flexShrink:0,minHeight:"100vh",position:"sticky",top:0,height:"100vh",overflowY:"auto"}}>
          <div style={{padding:"20px 16px 18px",borderBottom:"1px solid #334155",flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:34,height:34,borderRadius:9,background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🔥</div>
              <div><div style={{color:"#fff",fontWeight:800,fontSize:15}}>FieldPro</div><div style={{color:"#64748b",fontSize:10,letterSpacing:0.5}}>FIELD SERVICE CRM</div></div>
            </div>
          </div>
          <div style={{padding:"12px 8px",flex:1}}>
            {NAV_GROUPS.map(g=>(
              <div key={g.group} style={{marginBottom:6}}>
                <div style={{color:"#475569",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:1,padding:"8px 10px 4px"}}>{g.group}</div>
                {g.items.map(n=>(
                  <button key={n.id} onClick={()=>setTab(n.id)}
                    style={{display:"flex",alignItems:"center",gap:9,width:"100%",padding:"9px 10px",borderRadius:8,border:"none",background:tab===n.id?"#334155":"transparent",color:tab===n.id?"#fff":"#94a3b8",fontWeight:tab===n.id?700:500,fontSize:13,cursor:"pointer",fontFamily:"inherit",textAlign:"left",marginBottom:1}}>
                    <span style={{fontSize:15}}>{n.icon}</span>{n.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
          {/* Settings at bottom */}
          <div style={{padding:"8px 8px 0",borderTop:"1px solid #334155"}}>
            <button onClick={()=>setTab("settings")}
              style={{display:"flex",alignItems:"center",gap:9,width:"100%",padding:"9px 10px",borderRadius:8,border:"none",background:tab==="settings"?"#334155":"transparent",color:tab==="settings"?"#fff":"#94a3b8",fontWeight:tab==="settings"?700:500,fontSize:13,cursor:"pointer",fontFamily:"inherit",textAlign:"left",marginBottom:8}}>
              <span style={{fontSize:15}}>⚙️</span>Settings
            </button>
          </div>
          <div style={{padding:"12px 10px",flexShrink:0}}>
            <div style={{background:"#334155",borderRadius:10,padding:"10px 12px",display:"flex",gap:10,alignItems:"center"}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:11}}>AD</div>
              <div><div style={{color:"#fff",fontSize:12,fontWeight:700}}>Admin User</div><div style={{color:"#64748b",fontSize:11}}>Manager</div></div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div style={{flex:1,overflowY:"auto",padding:isMobile?"16px 14px 80px":"28px 32px",maxWidth:"100%"}}>
        {isMobile&&(
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <div style={{width:28,height:28,borderRadius:7,background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🔥</div>
            <div style={{color:C.text,fontWeight:800,fontSize:15}}>FieldPro</div>
            <div style={{color:C.sub,fontSize:12}}>/ {[...ALL_NAV,{id:"settings",label:"Settings"}].find(n=>n.id===tab)?.label}</div>
          </div>
        )}
        {tab==="customers"&&<CustomersTab settings={settings} companies={companies} setCompanies={setCompanies}/>}
        {tab==="vendors"&&<VendorsTab vendors={vendors} setVendors={setVendors}/>}
        {tab==="products"&&<ProductsTab/>}
        {tab==="dispatch"&&<DispatchTab settings={settings} companies={companies}/>}
        {tab==="history"&&<HistoryTab settings={settings} companies={companies} setCompanies={setCompanies} vendors={vendors}/>}
        {tab==="quotes"&&<QuotesTab/>}
        {tab==="invoices"&&<InvoicesTab/>}
        {tab==="inventory"&&<InventoryTab/>}
        {tab==="reports"&&<ReportsTab companies={companies}/>}
        {tab==="settings"&&<SettingsTab settings={settings}/>}
      </div>

      {/* MOBILE BOTTOM NAV */}
      {isMobile&&(
        <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#fff",borderTop:`1px solid ${C.border}`,display:"flex",zIndex:100,paddingBottom:"env(safe-area-inset-bottom)"}}>
          {MOBILE_NAV.map(n=>(
            <button key={n.id} onClick={()=>setTab(n.id)}
              style={{flex:1,padding:"10px 4px 12px",border:"none",background:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer",fontFamily:"inherit",borderTop:`2px solid ${tab===n.id?C.accent:"transparent"}`}}>
              <span style={{fontSize:20}}>{n.icon}</span>
              <span style={{fontSize:10,fontWeight:700,color:tab===n.id?C.accent:C.muted}}>{n.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AppRoot() { return <ErrorBoundary><App/></ErrorBoundary>; }
