import { useState, useEffect, useRef, Component } from "react";
import {
  DEFAULT_FIELD_STAFF, SEED_USERS, SEED_COMPANIES, SEED_VENDORS,
  SEED_QUOTES, SEED_INVOICES, SEED_SUPPLIERS, SEED_INV_ITEMS,
  SEED_PURCHASE_ORDERS, SEED_MOVEMENTS, SEED_BATCHES,
} from "./seed.js";

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

let C = {
  bg:"#f8f9fa", card:"#ffffff", raised:"#f8fafc",
  border:"#e9ecef", sidebar:"#ffffff", accent:"#f2a09a", orange:"#f97316",
  green:"#16a34a", red:"#dc2626", purple:"#7c3aed", yellow:"#d97706",
  text:"#1a1f2e", sub:"#64748b", muted:"#9ca3af",
};

/* ─── DEFAULTS ─── */
const DEFAULT_APPLIANCE_TYPES = ["Oven","Dishwasher","Cooktop – Gas","Cooktop – Electric","Upright Cooker","Washing Machine","Dryer","Fridge","Microwave","Other"];
const DEFAULT_WORK_PRESETS = ["Add power point","Close off gas (gas shutdown)","Replace cables","Update circuit breaker","Modify cabinets","Cut benchtop","Install rangehood","Replace hot water system","Install exhaust fan","Smoke alarm replacement"];
const DEFAULT_JOB_TYPES = ["HVAC","Plumbing","Electrical"];
const DEFAULT_JOB_STAGES = ["New","Scheduled","In Progress","Waiting on Parts","Parts Received","On Hold","Completed","Invoiced"];

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

const ROLE_LABELS = {topboss:"Top Boss",admin:"Admin",tech:"Technician"};
const ROLE_COLORS = {topboss:"#7c3aed",admin:"#2563eb",tech:"#16a34a"};

const allJobs = (companies) => (companies||SEED_COMPANIES).flatMap(co=>co.branches.flatMap(b=>b.agents.flatMap(a=>(a.jobs||[]).map(j=>({...j,agentName:a.name,branchName:b.name,companyName:co.name})))));

/* ─── COUNTERS (start after seed data) ─── */
let _id=20000; const uid=()=>`id-${++_id}`;
let _jobNum=1300; const nextJobRef=()=>`${++_jobNum}`;
let _quoNum=5;    const nextQuoRef=()=>`QUO-${String(++_quoNum).padStart(3,"0")}`;
let _poNum=8;     const nextPORef=()=>`PO-${String(++_poNum).padStart(3,"0")}`;
let _mvNum=10;    const nextMvId=()=>`mv${++_mvNum}`;
let _btNum=10;    const nextBtId=()=>`bt${++_btNum}`;

/* ─── HELPERS ─── */
const daysDiff = d => Math.floor((new Date() - new Date(d)) / 86400000);
const jobStatus = job => { if (job.status==="Open") return "Open"; return daysDiff(job.closedDate)<=30?"Recently Closed":"Old"; };
const statusColor = s => s==="Open"?"blue":s==="Recently Closed"?"orange":"gray";
const fmtDate = d => d ? new Date(d).toLocaleDateString("en-AU",{day:"2-digit",month:"short",year:"numeric"}) : "—";
const fmtMoney = n => "$"+Number(n||0).toLocaleString("en-AU",{minimumFractionDigits:2,maximumFractionDigits:2});
const fileSizeFmt = b => b > 1048576 ? `${(b/1048576).toFixed(1)} MB` : `${Math.round(b/1024)} KB`;
const fmtTs = ts => { const d = new Date(ts); return d.toLocaleDateString("en-AU",{day:"2-digit",month:"short",year:"numeric"}) + " " + d.toLocaleTimeString("en-AU",{hour:"2-digit",minute:"2-digit"}); };
const appIcon = t=>({"Oven":"🍳","Dishwasher":"🍽️","Cooktop – Gas":"🔥","Cooktop – Electric":"⚡","Upright Cooker":"🍲","Washing Machine":"🫧","Dryer":"💨","Fridge":"🧊","Microwave":"📡"}[t]||"🔧");
const workIcon = d=>{const l=d.toLowerCase();if(l.includes("gas"))return"⛽";if(l.includes("power point")||l.includes("circuit")||l.includes("cable"))return"⚡";if(l.includes("cabinet")||l.includes("benchtop"))return"🪚";if(l.includes("alarm"))return"🔔";if(l.includes("water"))return"💧";return"🔧";};
const stageColor = s => {
  const m={"New":"gray","Scheduled":"blue","In Progress":"orange","On Hold":"yellow","Completed":"green","Invoiced":"purple"};
  return m[s]||"gray";
};

/* ─── INVENTORY AVAILABILITY HELPER ───
 * onHand      = total physical stock across all locations
 * onOrder     = qty on open POs (sent or partial) not yet received
 * committed   = qty on approved quotes (Sent or Accepted) not yet invoiced
 * available   = onHand − committed  (what you can sell right now)
 * toOrder     = max(0, committed − onHand − onOrder)  (shortfall to cover all demand)
 */
const calcAvailability = (itemId, invItems, quotes=[], purchaseOrders=[]) => {
  const item = invItems.find(i=>i.id===itemId);
  if(!item) return {onHand:0, onOrder:0, committed:0, available:0, toOrder:0};

  const onHand = Object.values(item.qtyOnHand||{}).reduce((s,v)=>s+(v||0),0);

  // On order: open POs (sent or partial) — lines not yet received
  const onOrder = purchaseOrders
    .filter(po=>po.status==="sent"||po.status==="partial")
    .reduce((s,po)=>{
      const line = po.lines.find(l=>l.itemId===itemId);
      if(!line) return s;
      return s + Math.max(0, line.qtyOrdered - (line.qtyReceived||0));
    }, 0);

  // Committed: qty on Sent or Accepted quotes that have an itemId link
  const committed = quotes
    .filter(q=>q.status==="Sent"||q.status==="Accepted")
    .reduce((s,q)=>{
      return s + q.items.filter(l=>l.itemId===itemId).reduce((qs,l)=>qs+(l.qty||0),0);
    }, 0);

  const available = onHand - committed;
  const toOrder = Math.max(0, committed - onHand - onOrder);

  return {onHand, onOrder, committed, available, toOrder};
};

/* ─── LEAD TIME HELPER ───
 * Returns per-supplier and per-item avg days from PO raised → received,
 * based on all received POs in history.
 *
 * Returns:
 *   bySupplier: { [supplierId]: { name, avg, min, max, count } }
 *   byItem:     { [itemId]:     { name, avg, min, max, count, bySupplier: {...} } }
 *   overall:    { avg, min, max, count }
 */
const calcLeadTimes = (purchaseOrders=[]) => {
  const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

  const bySupplier = {};
  const byItem = {};
  const overallDays = [];

  purchaseOrders
    .filter(po => po.status === "received" && po.date && po.receivedDate)
    .forEach(po => {
      const days = daysBetween(po.date, po.receivedDate);
      if(days < 0) return; // data error guard

      overallDays.push(days);

      // Per supplier
      if(!bySupplier[po.supplierId]) bySupplier[po.supplierId] = {name:po.supplierName, days:[]};
      bySupplier[po.supplierId].days.push(days);

      // Per item (each line in this PO)
      po.lines.forEach(line => {
        if(!byItem[line.itemId]) byItem[line.itemId] = {name:line.itemName, days:[], bySupplier:{}};
        byItem[line.itemId].days.push(days);
        if(!byItem[line.itemId].bySupplier[po.supplierId])
          byItem[line.itemId].bySupplier[po.supplierId] = {name:po.supplierName, days:[]};
        byItem[line.itemId].bySupplier[po.supplierId].days.push(days);
      });
    });

  const summarise = days => ({
    avg: days.length ? Math.round(days.reduce((s,d)=>s+d,0)/days.length) : null,
    min: days.length ? Math.min(...days) : null,
    max: days.length ? Math.max(...days) : null,
    count: days.length,
  });

  const supplierOut = {};
  Object.entries(bySupplier).forEach(([id,{name,days}]) => {
    supplierOut[id] = {name, ...summarise(days)};
  });

  const itemOut = {};
  Object.entries(byItem).forEach(([id,{name,days,bySupplier:bySup}]) => {
    const supOut = {};
    Object.entries(bySup).forEach(([sid,{name:sname,days:sddays}]) => {
      supOut[sid] = {name:sname, ...summarise(sddays)};
    });
    itemOut[id] = {name, ...summarise(days), bySupplier:supOut};
  });

  return {
    bySupplier: supplierOut,
    byItem: itemOut,
    overall: summarise(overallDays),
  };
};

/* ─── SHARED UI ─── */
const Badge = ({label,color}) => {const map={green:{bg:"#dcfce7",text:"#15803d"},blue:{bg:"#dbeafe",text:"#1d4ed8"},orange:{bg:"#ffedd5",text:"#c2410c"},red:{bg:"#fee2e2",text:"#b91c1c"},purple:{bg:"#ede9fe",text:"#6d28d9"},gray:{bg:"#f1f5f9",text:"#475569"},yellow:{bg:"#fef9c3",text:"#854d0e"}};const s=map[color]||map.gray;return <span style={{background:s.bg,color:s.text,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,letterSpacing:0.3,whiteSpace:"nowrap"}}>{label}</span>;};
const Avatar = ({name,size=36,bg="#dbeafe",fg="#1d4ed8"}) => {const i=name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();return <div style={{width:size,height:size,borderRadius:"50%",background:bg,color:fg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:size*0.33,flexShrink:0}}>{i}</div>;};
const Field = ({label,value}) => (<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"10px 0",borderBottom:`1px solid ${C.border}`,gap:12}}><span style={{color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,flexShrink:0}}>{label}</span><span style={{color:C.text,fontSize:13,fontWeight:600,textAlign:"right"}}>{value}</span></div>);
const Card = ({children,style={}}) => (<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,boxShadow:"0 1px 3px rgba(0,0,0,0.04)",...style}}>{children}</div>);
const RowList = ({children,style={}}) => (<div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden",...style}}>{children}</div>);
const SectionHead = ({title,count,action}) => (<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{color:C.text,fontWeight:700,fontSize:14}}>{title}</span>{count!==undefined&&<span style={{background:C.raised,border:`1px solid ${C.border}`,color:C.sub,borderRadius:99,padding:"1px 8px",fontSize:11,fontWeight:700}}>{count}</span>}</div>{action&&<button onClick={action.fn} style={{background:action.color||C.accent,color:"#fff",border:"none",borderRadius:7,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{action.label}</button>}</div>);
const PageHeader = ({title,sub,action}) => (
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,paddingBottom:0}}>
    <div>
      <h1 style={{fontSize:22,fontWeight:800,color:C.text,letterSpacing:-0.5,margin:0}}>{title}</h1>
      {sub&&<p style={{color:C.sub,fontSize:13,marginTop:3}}>{sub}</p>}
    </div>
    {action&&<div>{action}</div>}
  </div>
);
const Breadcrumb = ({items}) => (<div style={{display:"flex",gap:6,alignItems:"center",marginBottom:16,flexWrap:"wrap"}}>{items.map((item,i)=>(<span key={i} style={{display:"flex",gap:6,alignItems:"center"}}>{i<items.length-1?<button onClick={item.fn} style={{background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit",padding:0}}>{item.label}</button>:<span style={{color:C.text,fontSize:13,fontWeight:700}}>{item.label}</span>}{i<items.length-1&&<span style={{color:C.muted,fontSize:12}}>›</span>}</span>))}</div>);
const Pill = ({label,active,onClick}) => (<button onClick={onClick} style={{padding:"6px 16px",borderRadius:99,border:`1.5px solid ${active?C.accent:C.border}`,background:active?C.accent:"#fff",color:active?"#fff":C.sub,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",transition:"all 0.15s"}}>{label}</button>);
const Btn = ({label,onClick,color=C.accent,small=false,outline=false}) => (<button onClick={onClick} style={{background:outline?"transparent":color,color:outline?color:"#fff",border:outline?`1.5px solid ${color}`:"none",borderRadius:8,padding:small?"6px 12px":"8px 16px",fontWeight:700,fontSize:small?12:13,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>{label}</button>);
const RowCard = ({onClick,children,style={}}) => (<div onClick={onClick} style={{background:"#fff",borderBottom:`1px solid ${C.border}`,padding:"16px 20px",cursor:onClick?"pointer":"default",transition:"background 0.1s",...style}} onMouseEnter={onClick?e=>e.currentTarget.style.background="#f8fafc":null} onMouseLeave={onClick?e=>e.currentTarget.style.background="#fff":null}>{children}</div>);
const Modal = ({title,onClose,onSave,children,wide=false,noFooter=false}) => (<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}><div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:wide?680:480,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}><div style={{padding:"18px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"#fff",zIndex:1}}><span style={{fontWeight:800,fontSize:16,color:C.text}}>{title}</span><button onClick={onClose} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:C.muted,lineHeight:1}}>×</button></div><div style={{padding:20}}>{children}</div>{!noFooter&&<div style={{padding:"14px 20px",borderTop:`1px solid ${C.border}`,display:"flex",gap:10,justifyContent:"flex-end",position:"sticky",bottom:0,background:"#fff"}}><button onClick={onClose} style={{background:C.raised,border:`1px solid ${C.border}`,color:C.sub,borderRadius:8,padding:"8px 16px",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button><Btn label="Save" onClick={onSave}/></div>}</div></div>);
const FF = ({label,value,onChange,type="text",placeholder="",required=false}) => (<div style={{marginBottom:14}}><label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>{label}{required&&<span style={{color:C.red}}> *</span>}</label>{type==="textarea"?<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={3} style={{width:"100%",background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit",resize:"vertical",boxSizing:"border-box"}}/>:<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{width:"100%",background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}/>}</div>);
const StatCard = ({label,value,sub,color=C.accent,icon}) => (<div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 18px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><div style={{color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>{label}</div><div style={{color,fontSize:26,fontWeight:900,marginTop:4}}>{value}</div>{sub&&<div style={{color:C.muted,fontSize:12,marginTop:2}}>{sub}</div>}</div><span style={{fontSize:28}}>{icon}</span></div></div>);

/* ─── SETTINGS CONTEXT ─── */
const DEFAULT_FIELD_FORMS = [
  { id:"ff1", name:"New Installation Form", badge:"Install", badgeRequired:"optional",
    questions:[
      {id:"fq1",text:"Did you take pictures of existing damages around the work area?",type:"multi",mandatory:true,options:["Yes, confirmed — pictures are in the diary","No, I forgot and will rely on the trust"],skipIf:""},
      {id:"fq2",text:"Job completed?",type:"yesno",mandatory:true,options:[],skipIf:""},
      {id:"fq3",text:"Explain why it took longer than expected",type:"text",mandatory:false,options:[],skipIf:""},
      {id:"fq4",text:"Appliance(s) Type / Make & Model",type:"text",mandatory:true,options:[],skipIf:""},
      {id:"fq5",text:"Appliance(s) tested?",type:"yesno",mandatory:true,options:[],skipIf:""},
      {id:"fq6",text:"Removed old appliance / rubbish out?",type:"yesno",mandatory:false,options:[],skipIf:""},
      {id:"fq7",text:"Why wasn't the job completed?",type:"text",mandatory:false,options:[],skipIf:""},
      {id:"fq8",text:"Photo of the new appliance installed",type:"photo",mandatory:true,options:[],skipIf:""},
      {id:"fq9",text:"Sticker plate / Compliance plate",type:"photo",mandatory:false,options:[],skipIf:""},
      {id:"fq10",text:"Extra pictures",type:"photo",mandatory:false,options:[],skipIf:""},
      {id:"fq11",text:"How long did you spend on this job?",type:"text",mandatory:true,options:[],skipIf:""},
      {id:"fq12",text:"Any extra relevant information about the completed installation",type:"text",mandatory:false,options:[],skipIf:""},
      {id:"fq13",text:"Did you use any stock parts?",type:"yesno",mandatory:false,options:[],skipIf:""},
    ]},
  { id:"ff2", name:"Gas Safety Inspection", badge:"Gas Check", badgeRequired:"required",
    questions:[
      {id:"gq1",text:"All gas appliances inspected?",type:"yesno",mandatory:true,options:[],skipIf:""},
      {id:"gq2",text:"Any gas leaks detected?",type:"yesno",mandatory:true,options:[],skipIf:""},
      {id:"gq3",text:"Describe the leak location and action taken",type:"text",mandatory:false,options:[],skipIf:""},
      {id:"gq4",text:"Compliance certificate issued?",type:"yesno",mandatory:true,options:[],skipIf:""},
      {id:"gq5",text:"Photo of compliance plate",type:"photo",mandatory:true,options:[],skipIf:""},
    ]},
];

const DEFAULT_EMAIL_TEMPLATES = [
  { id:"em1", name:"Booking Confirmation", icon:"📅",
    subject:"Booking confirmed — Job {{job_ref}}",
    body:"Hi {{agent_name}},\n\nThis confirms your service booking has been scheduled.\n\nJob Reference: {{job_ref}}\nJob Type: {{job_type}}\nAppliance: {{appliance_type}}\nAddress: {{address}}\nBranch: {{branch}}\nTechnician: {{tech_name}}\nDate: {{date}}\n\nPlease don't hesitate to contact us with any questions.\n\nKind regards,\n[Your Company]" },
  { id:"em2", name:"Job Completed", icon:"✅",
    subject:"Job completed — {{job_ref}}",
    body:"Hi {{agent_name}},\n\nWe're pleased to confirm the following job has been completed.\n\nJob Reference: {{job_ref}}\nAppliance: {{appliance_type}}\nAddress: {{address}}\nCompleted By: {{tech_name}}\nDate: {{date}}\n\nPlease find any attached reports in this email. Contact us if you need anything further.\n\nKind regards,\n[Your Company]" },
  { id:"em3", name:"Parts Ordered — Awaiting Delivery", icon:"📦",
    subject:"Parts ordered for {{job_ref}} — awaiting delivery",
    body:"Hi {{agent_name}},\n\nWe have ordered the required parts for your job and are awaiting delivery.\n\nJob Reference: {{job_ref}}\nAppliance: {{appliance_type}}\nAddress: {{address}}\nTechnician: {{tech_name}}\n\nWe'll be in touch to reschedule once parts have arrived.\n\nKind regards,\n[Your Company]" },
  { id:"em4", name:"No Access — Reschedule Required", icon:"🚫",
    subject:"Unable to access property — {{job_ref}}",
    body:"Hi {{agent_name}},\n\nUnfortunately our technician was unable to gain access to the property today.\n\nJob Reference: {{job_ref}}\nAddress: {{address}}\nDate: {{date}}\n\nPlease arrange access and contact us to reschedule at your earliest convenience.\n\nKind regards,\n[Your Company]" },
  { id:"em5", name:"Quote Required", icon:"📝",
    subject:"Quote required — {{job_ref}}",
    body:"Hi {{agent_name}},\n\nFollowing our technician's visit, a quote is required before works can proceed.\n\nJob Reference: {{job_ref}}\nAppliance: {{appliance_type}}\nAddress: {{address}}\nCustomer: {{customer_name}}\n\nWe will prepare the quote and send it through shortly.\n\nKind regards,\n[Your Company]" },
];

const EMAIL_MERGE_FIELDS = ["{{customer_name}}","{{agent_name}}","{{job_ref}}","{{job_type}}","{{appliance_type}}","{{address}}","{{branch}}","{{tech_name}}","{{date}}"];

const useSettings = () => {
  const [jobStages, setJobStages] = useState(DEFAULT_JOB_STAGES);
  const [jobSubStages, setJobSubStages] = useState(DEFAULT_JOB_SUBSTAGES);
  const [fieldStaff, setFieldStaff] = useState(DEFAULT_FIELD_STAFF);
  const [jobTypes, setJobTypes] = useState(DEFAULT_JOB_TYPES);
  const [reportTemplates, setReportTemplates] = useState(DEFAULT_REPORT_TEMPLATES);
  const [fieldForms, setFieldForms] = useState(DEFAULT_FIELD_FORMS);
  const [emailTemplates, setEmailTemplates] = useState(DEFAULT_EMAIL_TEMPLATES);
  const [fieldApp, setFieldApp] = useState({
    defaultTech:"", requireOutcome:true, requireNotes:false, requirePhoto:false,
    closeAction:"close", smsOnDeparture:false,
    smsTemplate:"Hi {tenant}, your technician is on the way. Job ref: {ref}.",
    customOutcomes:[],
  });
  const [invItems, setInvItems] = useState(SEED_INV_ITEMS);
  const [invSuppliers, setInvSuppliers] = useState(SEED_SUPPLIERS);
  const [purchaseOrders, setPurchaseOrders] = useState(SEED_PURCHASE_ORDERS);
  const [stockMovements, setStockMovements] = useState(SEED_MOVEMENTS);
  const [stockBatches, setStockBatches] = useState(SEED_BATCHES);
  return { jobStages,setJobStages, jobSubStages,setJobSubStages, fieldStaff,setFieldStaff,
    jobTypes,setJobTypes, reportTemplates,setReportTemplates,
    fieldForms,setFieldForms, emailTemplates,setEmailTemplates, fieldApp,setFieldApp,
    invItems, setInvItems, invSuppliers, setInvSuppliers, purchaseOrders, setPurchaseOrders,
    stockMovements, setStockMovements, stockBatches, setStockBatches };
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

function JobDiary({job, onUpdate, onOpenAttachment, emailTemplates}){
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
  const [selTemplate, setSelTemplate] = useState("");

  const applyTemplate = (tmpl, job) => {
    if(!tmpl) return;
    const today = new Date().toLocaleDateString("en-AU",{day:"2-digit",month:"short",year:"numeric"});
    const appType = (job.appliances||[]).map(a=>a.appType).join(", ") || "";
    const fill = s => (s||"")
      .replace(/\{\{customer_name\}\}/g, job.companyName||"")
      .replace(/\{\{agent_name\}\}/g, job.agentName||"")
      .replace(/\{\{job_ref\}\}/g, job.ref||"")
      .replace(/\{\{job_type\}\}/g, job.type||"")
      .replace(/\{\{appliance_type\}\}/g, appType)
      .replace(/\{\{address\}\}/g, job.address||"")
      .replace(/\{\{branch\}\}/g, job.branchName||"")
      .replace(/\{\{tech_name\}\}/g, job.tech||"")
      .replace(/\{\{date\}\}/g, today);
    setSubject(fill(tmpl.subject));
    setNotes(fill(tmpl.body));
    setSelTemplate(tmpl.id);
  };

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
                      <div key={f.id} onClick={()=>{ const allImgs=(job.diary||[]).flatMap(d=>(d.files||[]).filter(x=>x.mime?.startsWith("image/"))); onOpenAttachment?onOpenAttachment(f,entry,allImgs):setLightbox(f); }}
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

              {/* Email template picker */}
              {entryType==="email" && (emailTemplates||[]).length>0 && (
                <div style={{marginBottom:14}}>
                  <label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Use Template</label>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {(emailTemplates||[]).map(t=>(
                      <button key={t.id} onClick={()=>applyTemplate(t,job)}
                        style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,border:`1.5px solid ${selTemplate===t.id?C.accent:C.border}`,background:selTemplate===t.id?"#eff6ff":"#fff",color:selTemplate===t.id?C.accent:C.sub,fontWeight:selTemplate===t.id?700:500,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
                        <span>{t.icon}</span>{t.name}
                      </button>
                    ))}
                  </div>
                  {selTemplate&&<div style={{marginTop:6,fontSize:11,color:C.muted}}>Template applied — edit freely below</div>}
                </div>
              )}

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
        <AddressAutocomplete value={newJob.address} onChange={(addr,coords)=>setNewJob({...newJob,address:addr,...(coords||{})})} placeholder="e.g. 22 Oak St, Parramatta NSW" required/>
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
   ZONES EDITOR — Settings → Zones tab
   Draw polygon zones per technician on Google Maps.
   Uses DrawingManager to click-place vertices.
═══════════════════════════════════════════ */
function ZonesEditor({fieldStaff, setFieldStaff}) {
  const [selTechId, setSelTechId] = useState(null);
  const mapDivRef    = useRef(null);
  const gMapRef      = useRef(null);
  const dmRef        = useRef(null);  // DrawingManager
  const polyRef      = useRef(null);  // current editable polygon
  const zonesRef     = useRef([]);    // rendered zone polygons [{techId, polygon}]
  const [mapStatus, setMapStatus] = useState("idle");
  const [drawing, setDrawing] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  const selTech = fieldStaff.find(f=>f.id===selTechId);
  const activeTechs = fieldStaff.filter(f=>f.status==="Active");
  const allTechNames = activeTechs.map(f=>f.name);

  // Load maps with drawing library
  const loadMapsForZones = () => {
    if(GMAPS_KEY === "YOUR_GOOGLE_MAPS_API_KEY") { setMapStatus("nokey"); return; }
    if(window.__gmapsPromise__) { window.__gmapsPromise__.then(()=>setMapStatus("ready")).catch(()=>setMapStatus("error")); return; }
    setMapStatus("loading");
    window.__gmapsPromise__ = new Promise((resolve, reject) => {
      if(window.google && window.google.maps) { resolve(); return; }
      const cb = "__gmapsReady__";
      window[cb] = resolve;
      const s = document.createElement("script");
      s.src = `https://maps.googleapis.com/maps/api/js?key=${GMAPS_KEY}&libraries=places,drawing&callback=${cb}&loading=async`;
      s.async = true; s.defer = true;
      s.onerror = () => reject(new Error("failed"));
      document.head.appendChild(s);
      setTimeout(() => reject(new Error("timeout")), 15000);
    });
    window.__gmapsPromise__.then(()=>setMapStatus("ready")).catch(()=>setMapStatus("error"));
  };

  useEffect(()=>{ loadMapsForZones(); }, []);

  // Init map once ready
  useEffect(()=>{
    if(mapStatus !== "ready" || !mapDivRef.current || gMapRef.current) return;
    gMapRef.current = new window.google.maps.Map(mapDivRef.current, {
      center: {lat:-33.83, lng:150.95}, zoom:10,
      mapTypeId:"roadmap", streetViewControl:false, mapTypeControl:false, fullscreenControl:false,
      styles:[
        {elementType:"geometry",stylers:[{color:"#1a2744"}]},
        {elementType:"labels.text.fill",stylers:[{color:"#8ec3b9"}]},
        {elementType:"labels.text.stroke",stylers:[{color:"#1a3646"}]},
        {featureType:"road",elementType:"geometry",stylers:[{color:"#304a7d"}]},
        {featureType:"road.highway",elementType:"geometry",stylers:[{color:"#2c6675"}]},
        {featureType:"water",elementType:"geometry",stylers:[{color:"#0e1626"}]},
        {featureType:"poi",stylers:[{visibility:"off"}]},
        {featureType:"transit",stylers:[{visibility:"off"}]},
      ],
    });
    // Create DrawingManager
    dmRef.current = new window.google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false,
      polygonOptions: {
        fillOpacity: 0.15,
        strokeWeight: 2,
        editable: true,
        draggable: false,
        zIndex: 1,
      },
    });
    dmRef.current.setMap(gMapRef.current);
    window.google.maps.event.addListener(dmRef.current, "polygoncomplete", poly => {
      // Switch off drawing mode
      dmRef.current.setDrawingMode(null);
      if(polyRef.current) polyRef.current.setMap(null);
      polyRef.current = poly;
      // Style with tech colour
      const ti = allTechNames.indexOf(selTech?.name||"");
      const col = TECH_COLORS[ti%TECH_COLORS.length]||"#0ea5e9";
      poly.setOptions({strokeColor:col, fillColor:col});
      setDrawing(false);
      setHasDraft(true);
    });
    renderZones();
  }, [mapStatus]);

  // Re-render all saved zones when fieldStaff changes
  useEffect(()=>{
    if(mapStatus === "ready" && gMapRef.current) renderZones();
  }, [fieldStaff, mapStatus, selTechId]);

  const renderZones = () => {
    if(!gMapRef.current) return;
    zonesRef.current.forEach(({polygon,label})=>{ polygon.setMap(null); if(label) label.setMap(null); });
    zonesRef.current = [];
    fieldStaff.forEach((f,fi)=>{
      if(!f.zone || f.zone.length<3) return;
      const col = TECH_COLORS[allTechNames.indexOf(f.name)%TECH_COLORS.length]||"#64748b";
      const isSelected = f.id === selTechId;
      const poly = new window.google.maps.Polygon({
        paths: f.zone,
        strokeColor: col,
        strokeOpacity: isSelected ? 1 : 0.7,
        strokeWeight: isSelected ? 3 : 2,
        fillColor: col,
        fillOpacity: isSelected ? 0.2 : 0.08,
        map: gMapRef.current,
        zIndex: isSelected ? 2 : 1,
      });
      // Label at centroid
      const lats = f.zone.map(p=>p.lat);
      const lngs = f.zone.map(p=>p.lng);
      const centerLat = (Math.min(...lats)+Math.max(...lats))/2;
      const centerLng = (Math.min(...lngs)+Math.max(...lngs))/2;
      const label = new window.google.maps.Marker({
        position:{lat:centerLat,lng:centerLng},
        map:gMapRef.current,
        icon:{url:`data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="22"><rect width="80" height="22" rx="5" fill="${col}" opacity="0.85"/><text x="40" y="15" text-anchor="middle" font-size="11" fill="white" font-weight="700" font-family="Inter,Arial,sans-serif">${f.name.split(" ")[0]}</text></svg>`)}`,anchor:new window.google.maps.Point(40,11)},
        zIndex:5,
      });
      zonesRef.current.push({polygon:poly, label, techId:f.id});
    });
  };

  const startDraw = () => {
    if(!gMapRef.current || !dmRef.current) return;
    // Clear existing draft
    if(polyRef.current) { polyRef.current.setMap(null); polyRef.current=null; }
    setHasDraft(false);
    const ti = allTechNames.indexOf(selTech?.name||"");
    const col = TECH_COLORS[ti%TECH_COLORS.length]||"#0ea5e9";
    dmRef.current.setOptions({polygonOptions:{fillColor:col,strokeColor:col,fillOpacity:0.2,strokeWeight:2.5,editable:true,zIndex:10}});
    dmRef.current.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON);
    setDrawing(true);
  };

  const cancelDraw = () => {
    if(dmRef.current) dmRef.current.setDrawingMode(null);
    if(polyRef.current) { polyRef.current.setMap(null); polyRef.current=null; }
    setDrawing(false);
    setHasDraft(false);
  };

  const saveZone = () => {
    if(!polyRef.current || !selTechId) return;
    const path = polyRef.current.getPath().getArray().map(ll=>({lat:ll.lat(),lng:ll.lng()}));
    if(path.length < 3) return;
    setFieldStaff(fieldStaff.map(f=>f.id===selTechId?{...f,zone:path}:f));
    if(polyRef.current) { polyRef.current.setMap(null); polyRef.current=null; }
    setHasDraft(false);
    setDrawing(false);
  };

  const clearZone = () => {
    if(!selTechId) return;
    setFieldStaff(fieldStaff.map(f=>f.id===selTechId?{...f,zone:null}:f));
    if(polyRef.current) { polyRef.current.setMap(null); polyRef.current=null; }
    setHasDraft(false);
  };

  return (
    <div>
      <div style={{marginBottom:16}}>
        <div style={{fontWeight:800,fontSize:16,color:C.text,marginBottom:4}}>🗺️ Technician Zones</div>
        <p style={{color:C.sub,fontSize:13}}>Draw service zones for each technician. Jobs outside a tech's zone will show a warning on the Dispatch Board. Select a technician below, then draw their zone on the map.</p>
      </div>

      {/* Tech selector cards */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
        {activeTechs.map((f,i)=>{
          const col = TECH_COLORS[i%TECH_COLORS.length];
          const hasZone = f.zone && f.zone.length>=3;
          const isSelected = f.id===selTechId;
          return(
            <div key={f.id} onClick={()=>{
              if(drawing) return;
              if(polyRef.current){polyRef.current.setMap(null);polyRef.current=null;setHasDraft(false);}
              setSelTechId(isSelected?null:f.id);
            }} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,border:`2px solid ${isSelected?col:C.border}`,background:isSelected?col+"18":"#fff",cursor:drawing?"not-allowed":"pointer",transition:"all 0.15s"}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:col,flexShrink:0}}/>
              <div>
                <div style={{fontWeight:700,fontSize:13,color:isSelected?col:C.text}}>{f.name}</div>
                <div style={{fontSize:11,color:hasZone?C.green:C.muted,marginTop:1,fontWeight:600}}>
                  {hasZone?"✓ Zone defined":"No zone yet"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Map */}
      {mapStatus==="nokey"&&(
        <div style={{height:480,borderRadius:12,border:"2px dashed #cbd5e1",background:"#f8fafc",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,color:C.muted,fontSize:14}}>
          <div style={{fontSize:40}}>🗺️</div>
          <div style={{fontWeight:700,color:C.text}}>Google Maps API key required</div>
          <div style={{fontSize:12}}>Set GMAPS_KEY in App.jsx to enable zone drawing</div>
        </div>
      )}
      {mapStatus==="loading"&&(
        <div style={{height:480,borderRadius:12,border:`1px solid ${C.border}`,background:"#f8fafc",display:"flex",alignItems:"center",justifyContent:"center",gap:12,color:C.sub}}>
          <div style={{width:22,height:22,border:"3px solid #e2e8f0",borderTopColor:C.accent,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
          Loading Google Maps…
        </div>
      )}
      {mapStatus==="error"&&(
        <div style={{height:480,borderRadius:12,border:`1px solid #fecaca`,background:"#fef2f2",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8,color:C.red,fontSize:14}}>
          <div style={{fontSize:36}}>⚠️</div>Map failed to load — check API key
        </div>
      )}
      <div ref={mapDivRef} style={{width:"100%",height:480,borderRadius:12,border:`1px solid ${C.border}`,display:mapStatus==="ready"?"block":"none"}}/>

      {/* Controls below map */}
      {mapStatus==="ready"&&(
        <div style={{marginTop:12,display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          {!selTechId&&(
            <div style={{color:C.muted,fontSize:13,fontStyle:"italic"}}>← Select a technician above to start drawing their zone</div>
          )}
          {selTechId&&!drawing&&!hasDraft&&(
            <>
              <button onClick={startDraw}
                style={{background:C.accent,color:"#fff",border:"none",borderRadius:8,padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                ✏️ Draw Zone for {selTech?.name?.split(" ")[0]}
              </button>
              {selTech?.zone&&(
                <button onClick={clearZone}
                  style={{background:"none",border:`1px solid #fecaca`,color:C.red,borderRadius:8,padding:"9px 14px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                  🗑 Clear Zone
                </button>
              )}
              <span style={{color:C.muted,fontSize:12}}>
                {selTech?.zone ? "Zone saved — redraw to update" : "Click the map to place polygon vertices, close the shape to finish"}
              </span>
            </>
          )}
          {selTechId&&drawing&&(
            <>
              <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8,padding:"8px 14px",fontSize:12,fontWeight:700,color:"#92400e"}}>
                🖊️ Click to place vertices · Click the first point to close the polygon
              </div>
              <button onClick={cancelDraw}
                style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:8,padding:"8px 14px",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
                Cancel
              </button>
            </>
          )}
          {selTechId&&hasDraft&&!drawing&&(
            <>
              <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:8,padding:"8px 14px",fontSize:12,fontWeight:700,color:C.green}}>
                ✓ Polygon drawn — drag vertices to adjust, then save
              </div>
              <button onClick={saveZone}
                style={{background:C.green,color:"#fff",border:"none",borderRadius:8,padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                💾 Save Zone
              </button>
              <button onClick={cancelDraw}
                style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:8,padding:"9px 14px",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
                Discard
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   SETTINGS TAB
═══════════════════════════════════════════ */
function SettingsTab({settings}) {
  const {jobStages,setJobStages,jobSubStages,setJobSubStages,fieldStaff,setFieldStaff,jobTypes,setJobTypes,reportTemplates,setReportTemplates,fieldForms,setFieldForms,emailTemplates,setEmailTemplates,fieldApp,setFieldApp} = settings;
  const [section,setSection]=useState("stages");
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState({});
  const fa = fieldApp||{};
  const setFa = patch => setFieldApp({...fa,...patch});

  const saveStaff=()=>{
    if(!form.name)return;
    setFieldStaff([...fieldStaff,{id:uid(),name:form.name,role:form.role||"",phone:form.phone||"",email:form.email||"",trades:(form.trades||"").split(",").map(s=>s.trim()).filter(Boolean),status:"Active"}]);
    setModal(null);setForm({});
  };
  const toggleStaffStatus=id=>setFieldStaff(fieldStaff.map(f=>f.id===id?{...f,status:f.status==="Active"?"Inactive":"Active"}:f));
  const removeStaff=id=>setFieldStaff(fieldStaff.filter(f=>f.id!==id));

  const sections=[{id:"stages",icon:"🎯",label:"Job Stages"},{id:"substages",icon:"🏷️",label:"Sub-stages"},{id:"staff",icon:"👷",label:"Field Staff"},{id:"jobtypes",icon:"🔧",label:"Job Types"},{id:"reports",icon:"📋",label:"Report Templates"},{id:"forms",icon:"📱",label:"Field Forms"},{id:"email",icon:"📧",label:"Email Templates"},{id:"fieldapp",icon:"📱",label:"Field App"},{id:"zones",icon:"🗺️",label:"Zones"}];

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
    {section==="forms"&&(
      <Card>
        <SectionHead title="📱 Field Forms"/>
        <p style={{color:C.sub,fontSize:13,marginBottom:16}}>Create forms that technicians fill in during a job. Add questions, set types, and mark which are mandatory.</p>
        <FieldFormBuilder fieldForms={fieldForms} setFieldForms={setFieldForms}/>
      </Card>
    )}
    {section==="email"&&(
      <Card>
        <SectionHead title="📧 Email Templates"/>
        <p style={{color:C.sub,fontSize:13,marginBottom:16}}>Build reusable email templates for sending from the job diary. Use merge fields to auto-fill job details.</p>
        <EmailTemplateEditor emailTemplates={emailTemplates} setEmailTemplates={setEmailTemplates}/>
      </Card>
    )}
    {section==="zones"&&(
      <ZonesEditor fieldStaff={fieldStaff} setFieldStaff={setFieldStaff}/>
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
   FIELD FORM BUILDER (Settings)
═══════════════════════════════════════════ */
const FORM_Q_TYPES = [{id:"yesno",label:"Yes / No",icon:"✅"},{id:"multi",label:"Multiple Choice",icon:"☑️"},{id:"text",label:"Text Entry",icon:"📝"},{id:"number",label:"Number",icon:"🔢"},{id:"photo",label:"Photo",icon:"📷"}];

function FieldFormBuilder({fieldForms, setFieldForms}) {
  const [selForm, setSelForm] = useState(null);
  const [selQ, setSelQ] = useState(null);
  const [editingForm, setEditingForm] = useState(null); // form being edited
  const [addingForm, setAddingForm] = useState(false);
  const [newFormName, setNewFormName] = useState("");
  const [newFormBadge, setNewFormBadge] = useState("");

  const liveForm = selForm ? (editingForm || fieldForms.find(f=>f.id===selForm)) : null;
  const liveQ = selQ ? liveForm?.questions?.find(q=>q.id===selQ) : null;

  const saveForm = f => {
    setFieldForms(fieldForms.map(x=>x.id===f.id?f:x));
    setEditingForm(f);
  };

  const updateQ = patch => {
    if(!liveForm||!liveQ) return;
    const updated = {...liveForm, questions: liveForm.questions.map(q=>q.id===liveQ.id?{...q,...patch}:q)};
    saveForm(updated);
  };

  const addQ = () => {
    if(!liveForm) return;
    const nq = {id:uid(),text:"New question",type:"text",mandatory:false,options:[],skipIf:""};
    const updated = {...liveForm, questions:[...liveForm.questions, nq]};
    saveForm(updated);
    setSelQ(nq.id);
  };

  const removeQ = id => {
    if(!liveForm) return;
    const updated = {...liveForm, questions: liveForm.questions.filter(q=>q.id!==id)};
    saveForm(updated);
    if(selQ===id) setSelQ(null);
  };

  const moveQ = (id, dir) => {
    if(!liveForm) return;
    const qs = [...liveForm.questions];
    const i = qs.findIndex(q=>q.id===id);
    if(dir===-1&&i===0) return;
    if(dir===1&&i===qs.length-1) return;
    [qs[i],qs[i+dir]] = [qs[i+dir],qs[i]];
    saveForm({...liveForm, questions:qs});
  };

  const dupQ = id => {
    if(!liveForm) return;
    const src = liveForm.questions.find(q=>q.id===id);
    if(!src) return;
    const nq = {...src, id:uid(), text:src.text+" (copy)"};
    const idx = liveForm.questions.findIndex(q=>q.id===id);
    const qs = [...liveForm.questions];
    qs.splice(idx+1,0,nq);
    saveForm({...liveForm, questions:qs});
  };

  const createForm = () => {
    if(!newFormName.trim()) return;
    const nf = {id:uid(), name:newFormName.trim(), badge:newFormBadge.trim()||newFormName.trim(), badgeRequired:"optional", questions:[]};
    setFieldForms([...fieldForms, nf]);
    setSelForm(nf.id);
    setEditingForm(nf);
    setAddingForm(false);
    setNewFormName(""); setNewFormBadge("");
  };

  const deleteForm = id => {
    setFieldForms(fieldForms.filter(f=>f.id!==id));
    if(selForm===id){setSelForm(null);setEditingForm(null);setSelQ(null);}
  };

  const iSt = {width:"100%",background:"#fff",border:`1px solid ${C.border}`,borderRadius:7,padding:"8px 10px",color:C.text,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"};

  // Form list view
  if(!selForm) return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:13,color:C.sub}}>Build forms for technicians to fill on-site during a job.</div>
        <button onClick={()=>setAddingForm(true)} style={{background:C.accent,color:"#fff",border:"none",borderRadius:8,padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ New Form</button>
      </div>
      {addingForm&&(
        <div style={{background:C.raised,border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 16px",marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:10}}>New Form</div>
          <FF label="Form Name" value={newFormName} onChange={setNewFormName} placeholder="e.g. New Installation Form" required/>
          <FF label="Badge Name" value={newFormBadge} onChange={setNewFormBadge} placeholder="e.g. Install (short label)"/>
          <div style={{display:"flex",gap:8,marginTop:4}}>
            <button onClick={createForm} style={{background:C.accent,color:"#fff",border:"none",borderRadius:7,padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Create</button>
            <button onClick={()=>setAddingForm(false)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:7,padding:"8px 16px",fontSize:13,color:C.sub,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
          </div>
        </div>
      )}
      {fieldForms.map(f=>(
        <div key={f.id} style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:12,cursor:"pointer"}} onClick={()=>{setSelForm(f.id);setEditingForm(null);setSelQ(null);}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,fontSize:14,color:C.text}}>{f.name}</div>
            <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap"}}>
              <Badge label={`${f.questions.length} questions`} color="blue"/>
              <Badge label={f.badge} color="purple"/>
              <Badge label={f.badgeRequired} color={f.badgeRequired==="required"?"red":"gray"}/>
            </div>
          </div>
          <button onClick={e=>{e.stopPropagation();deleteForm(f.id);}} style={{background:"none",border:"none",color:C.muted,fontSize:16,cursor:"pointer",padding:4}}>🗑</button>
          <span style={{color:C.muted,fontSize:18}}>›</span>
        </div>
      ))}
      {fieldForms.length===0&&<p style={{color:C.muted,fontSize:13}}>No forms yet. Create your first form above.</p>}
    </div>
  );

  // Form editor (2-panel: question list + question detail)
  return (
    <div>
      <button onClick={()=>{setSelForm(null);setEditingForm(null);setSelQ(null);}} style={{background:"none",border:"none",color:C.accent,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:12,padding:0}}>← All Forms</button>

      {/* Form meta */}
      <div style={{background:C.raised,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px",marginBottom:14}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <div>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Form Name</label>
            <input style={iSt} value={liveForm?.name||""} onChange={e=>saveForm({...liveForm,name:e.target.value})}/>
          </div>
          <div>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Badge Name</label>
            <input style={iSt} value={liveForm?.badge||""} onChange={e=>saveForm({...liveForm,badge:e.target.value})}/>
          </div>
        </div>
        <div>
          <label style={{display:"block",fontSize:11,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Badge Requirement</label>
          <select style={iSt} value={liveForm?.badgeRequired||"optional"} onChange={e=>saveForm({...liveForm,badgeRequired:e.target.value})}>
            <option value="optional">Form is Optional</option>
            <option value="required">Form is Required</option>
          </select>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"240px 1fr",gap:12,alignItems:"start"}}>
        {/* Question list */}
        <div style={{border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden",background:"#fff"}}>
          <div style={{background:C.raised,borderBottom:`1px solid ${C.border}`,padding:"8px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:11,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:0.5}}>Questions</span>
            <button onClick={addQ} style={{background:C.accent,color:"#fff",border:"none",borderRadius:5,padding:"3px 9px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ New</button>
          </div>
          {(liveForm?.questions||[]).map((q,i)=>(
            <div key={q.id} onClick={()=>setSelQ(q.id)}
              style={{padding:"9px 12px",borderBottom:`1px solid ${C.border}`,background:selQ===q.id?"#eff6ff":"#fff",cursor:"pointer",display:"flex",gap:8,alignItems:"flex-start"}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:selQ===q.id?700:500,color:selQ===q.id?C.accent:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{q.text||"(no text)"}</div>
                <div style={{display:"flex",gap:4,marginTop:3,flexWrap:"wrap"}}>
                  <span style={{fontSize:10,color:C.sub}}>{FORM_Q_TYPES.find(t=>t.id===q.type)?.icon} {q.type}</span>
                  {q.mandatory&&<span style={{fontSize:10,color:C.red,fontWeight:700}}>*req</span>}
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:2,flexShrink:0}}>
                <button onClick={e=>{e.stopPropagation();moveQ(q.id,-1);}} style={{background:"none",border:"none",color:C.muted,fontSize:10,cursor:"pointer",padding:"1px 3px",lineHeight:1}}>▲</button>
                <button onClick={e=>{e.stopPropagation();moveQ(q.id,1);}} style={{background:"none",border:"none",color:C.muted,fontSize:10,cursor:"pointer",padding:"1px 3px",lineHeight:1}}>▼</button>
              </div>
            </div>
          ))}
          {(liveForm?.questions||[]).length===0&&<div style={{padding:"16px 12px",color:C.muted,fontSize:12,textAlign:"center"}}>No questions yet</div>}
        </div>

        {/* Question detail */}
        {liveQ ? (
          <div style={{border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 16px",background:"#fff"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <span style={{fontSize:13,fontWeight:700,color:C.text}}>Question Details</span>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>dupQ(liveQ.id)} style={{background:C.raised,border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:C.sub}}>Duplicate</button>
                <button onClick={()=>removeQ(liveQ.id)} style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:6,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:C.red}}>Remove</button>
              </div>
            </div>

            <div style={{marginBottom:12}}>
              <label style={{display:"block",fontSize:11,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Question</label>
              <textarea rows={2} style={{...iSt,resize:"vertical"}} value={liveQ.text} onChange={e=>updateQ({text:e.target.value})}/>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              <div>
                <label style={{display:"block",fontSize:11,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Question Type</label>
                <select style={iSt} value={liveQ.type} onChange={e=>updateQ({type:e.target.value,options:[]})}>
                  {FORM_Q_TYPES.map(t=><option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                </select>
              </div>
              <div style={{display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
                <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,fontWeight:600,color:C.text,userSelect:"none"}}>
                  <input type="checkbox" checked={!!liveQ.mandatory} onChange={e=>updateQ({mandatory:e.target.checked})} style={{accentColor:C.accent,width:15,height:15}}/>
                  Mandatory
                </label>
              </div>
            </div>

            {liveQ.type==="multi"&&(
              <div style={{marginBottom:12}}>
                <label style={{display:"block",fontSize:11,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Multiple Choice Options</label>
                {(liveQ.options||[]).map((opt,i)=>(
                  <div key={i} style={{display:"flex",gap:6,marginBottom:6,alignItems:"center"}}>
                    <span style={{fontSize:11,color:C.muted,width:18,textAlign:"right",flexShrink:0}}>{i+1}.</span>
                    <input style={{...iSt,flex:1}} value={opt} onChange={e=>{const o=[...liveQ.options];o[i]=e.target.value;updateQ({options:o});}} placeholder={`Option ${i+1}`}/>
                    <button onClick={()=>{const o=liveQ.options.filter((_,j)=>j!==i);updateQ({options:o});}} style={{background:"none",border:"none",color:C.muted,fontSize:15,cursor:"pointer",flexShrink:0}}>✕</button>
                  </div>
                ))}
                {(liveQ.options||[]).length<10&&(
                  <button onClick={()=>updateQ({options:[...(liveQ.options||[]),""]})
                  } style={{background:C.raised,border:`1px dashed ${C.border}`,borderRadius:7,padding:"6px 14px",fontSize:12,color:C.sub,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>+ Add Option</button>
                )}
              </div>
            )}

            <div>
              <label style={{display:"block",fontSize:11,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Skip Question If (optional)</label>
              <input style={iSt} value={liveQ.skipIf||""} onChange={e=>updateQ({skipIf:e.target.value})} placeholder='e.g. "Job completed?" is Yes'/>
              <div style={{fontSize:11,color:C.muted,marginTop:3}}>Describe condition in plain English — skip logic reference</div>
            </div>
          </div>
        ) : (
          <div style={{border:`1px dashed ${C.border}`,borderRadius:10,padding:"32px 16px",textAlign:"center",color:C.muted}}>
            <div style={{fontSize:28,marginBottom:8}}>☝️</div>
            <div style={{fontSize:13}}>Select a question to edit, or create a new one</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   EMAIL TEMPLATE EDITOR (Settings)
═══════════════════════════════════════════ */
function EmailTemplateEditor({emailTemplates, setEmailTemplates}) {
  const [selId, setSelId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📧");

  const sel = emailTemplates.find(t=>t.id===selId);

  const update = patch => setEmailTemplates(emailTemplates.map(t=>t.id===selId?{...t,...patch}:t));

  const create = () => {
    if(!newName.trim()) return;
    const nt = {id:uid(), name:newName.trim(), icon:newIcon, subject:"", body:""};
    setEmailTemplates([...emailTemplates, nt]);
    setSelId(nt.id);
    setAdding(false); setNewName(""); setNewIcon("📧");
  };

  const remove = id => {
    setEmailTemplates(emailTemplates.filter(t=>t.id!==id));
    if(selId===id) setSelId(null);
  };

  const insertField = field => {
    if(!sel) return;
    update({body:(sel.body||"")+" "+field});
  };

  const iSt = {width:"100%",background:"#fff",border:`1px solid ${C.border}`,borderRadius:7,padding:"8px 10px",color:C.text,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"};

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:13,color:C.sub}}>Build reusable email templates for sending from the job diary.</div>
        <button onClick={()=>setAdding(true)} style={{background:C.accent,color:"#fff",border:"none",borderRadius:8,padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ New Template</button>
      </div>

      {adding&&(
        <div style={{background:C.raised,border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 16px",marginBottom:16}}>
          <div style={{display:"flex",gap:10,marginBottom:10}}>
            <div style={{width:60}}>
              <label style={{display:"block",fontSize:11,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Icon</label>
              <input style={{...iSt,textAlign:"center",fontSize:20}} value={newIcon} onChange={e=>setNewIcon(e.target.value)} maxLength={2}/>
            </div>
            <div style={{flex:1}}>
              <label style={{display:"block",fontSize:11,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Template Name</label>
              <input style={iSt} value={newName} onChange={e=>setNewName(e.target.value)} placeholder="e.g. Booking Confirmation"/>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={create} style={{background:C.accent,color:"#fff",border:"none",borderRadius:7,padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Create</button>
            <button onClick={()=>setAdding(false)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:7,padding:"8px 16px",fontSize:13,color:C.sub,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"220px 1fr",gap:12,alignItems:"start"}}>
        {/* Template list */}
        <div style={{border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden",background:"#fff"}}>
          {emailTemplates.map(t=>(
            <div key={t.id} onClick={()=>setSelId(t.id)}
              style={{padding:"10px 12px",borderBottom:`1px solid ${C.border}`,background:selId===t.id?"#eff6ff":"#fff",cursor:"pointer",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontSize:18,flexShrink:0}}>{t.icon}</span>
              <span style={{flex:1,fontSize:13,fontWeight:selId===t.id?700:500,color:selId===t.id?C.accent:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.name}</span>
              <button onClick={e=>{e.stopPropagation();remove(t.id);}} style={{background:"none",border:"none",color:C.muted,fontSize:14,cursor:"pointer",padding:2,flexShrink:0}}>🗑</button>
            </div>
          ))}
          {emailTemplates.length===0&&<div style={{padding:"16px 12px",color:C.muted,fontSize:12,textAlign:"center"}}>No templates yet</div>}
        </div>

        {/* Template editor */}
        {sel ? (
          <div style={{border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 16px",background:"#fff"}}>
            <div style={{display:"flex",gap:10,marginBottom:12,alignItems:"flex-start"}}>
              <div style={{width:52}}>
                <label style={{display:"block",fontSize:11,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Icon</label>
                <input style={{...iSt,textAlign:"center",fontSize:20,padding:"6px"}} value={sel.icon} onChange={e=>update({icon:e.target.value})} maxLength={2}/>
              </div>
              <div style={{flex:1}}>
                <label style={{display:"block",fontSize:11,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Template Name</label>
                <input style={iSt} value={sel.name} onChange={e=>update({name:e.target.value})}/>
              </div>
            </div>

            <div style={{marginBottom:12}}>
              <label style={{display:"block",fontSize:11,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Email Subject</label>
              <input style={iSt} value={sel.subject} onChange={e=>update({subject:e.target.value})} placeholder="e.g. Booking confirmed — Job {{job_ref}}"/>
            </div>

            <div style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <label style={{display:"block",fontSize:11,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:0.5}}>Email Body</label>
              </div>
              <textarea rows={10} style={{...iSt,resize:"vertical",lineHeight:1.6}} value={sel.body} onChange={e=>update({body:e.target.value})}/>
            </div>

            <div>
              <div style={{fontSize:11,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Insert Merge Field</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {EMAIL_MERGE_FIELDS.map(f=>(
                  <button key={f} onClick={()=>insertField(f)}
                    style={{background:C.raised,border:`1px solid ${C.border}`,borderRadius:6,padding:"4px 10px",fontSize:11,fontWeight:600,color:C.accent,cursor:"pointer",fontFamily:"inherit"}}>
                    {f}
                  </button>
                ))}
              </div>
              <div style={{fontSize:11,color:C.muted,marginTop:6}}>Click a field to append it to the body. These auto-fill when composing from the job diary.</div>
            </div>
          </div>
        ) : (
          <div style={{border:`1px dashed ${C.border}`,borderRadius:10,padding:"32px 16px",textAlign:"center",color:C.muted}}>
            <div style={{fontSize:28,marginBottom:8}}>📧</div>
            <div style={{fontSize:13}}>Select a template to edit</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   FIELD MODE — fullscreen mobile tech workflow
   States: driving → arrived → in_progress → closed
═══════════════════════════════════════════ */
function FieldMode({job, fieldStaff, fieldForms, onClose, onJobUpdate}) {
  // phase: driving | arrived | in_progress | closed
  const [phase, setPhase] = useState("driving");
  const [driveStartTs, setDriveStartTs] = useState(null);
  const [arrivalTs, setArrivalTs] = useState(null);
  const [jobStartTs, setJobStartTs] = useState(null);
  const [jobEndTs, setJobEndTs] = useState(null);

  // Arrival check-in state
  const [leadTech, setLeadTech] = useState(job.tech||"");
  const [fellowTechs, setFellowTechs] = useState([]);
  const [addressOk, setAddressOk] = useState(null); // true|false|null
  const [gps, setGps] = useState(null);

  // In-progress
  const [notes, setNotes] = useState("");
  const [outcome, setOutcome] = useState("");
  const [activeFormId, setActiveFormId] = useState(null);
  const [formAnswers, setFormAnswers] = useState({}); // {formId: {qId: answer}}
  const [completedForms, setCompletedForms] = useState([]); // [formId]

  const activeTechs = fieldStaff.filter(f=>f.status==="Active");

  // Grab GPS on mount
  useEffect(()=>{
    setDriveStartTs(new Date().toISOString());
    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition(
        p=>setGps({lat:p.coords.latitude,lng:p.coords.longitude,acc:Math.round(p.coords.accuracy)}),
        ()=>setGps({error:true}),
        {timeout:10000}
      );
    }
  },[]);

  const openMaps = () => {
    const addr = encodeURIComponent(job.address);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${addr}`, "_blank");
  };

  const handleArrived = () => {
    const ts = new Date().toISOString();
    setArrivalTs(ts);
    setPhase("arrived");
  };

  const handleStartJob = () => {
    if(!leadTech) return;
    const ts = new Date().toISOString();
    setJobStartTs(ts);
    setPhase("in_progress");
  };

  const handleCloseJob = () => {
    const ts = new Date().toISOString();
    setJobEndTs(ts);
    setPhase("closed");

    // Calculate times
    const driveStart = new Date(driveStartTs);
    const arrival = new Date(arrivalTs);
    const jobStart = new Date(jobStartTs||arrivalTs);
    const jobEnd = new Date(ts);

    const driveMins = Math.round((arrival - driveStart) / 60000);
    const jobMins = Math.round((jobEnd - jobStart) / 60000);

    const toTime = d => `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
    const toDate = d => d.toISOString().split("T")[0];

    // Build tech list: lead + fellows, all with same times
    const allTechs = [leadTech, ...fellowTechs].filter(Boolean).map(name=>({
      techName: name,
      arrivalTime: toTime(jobStart),
      departureTime: toTime(jobEnd),
    }));

    // Build visit record
    const visitId = uid();
    const visit = {
      id: visitId,
      date: toDate(arrival),
      outcome: outcome||"Completed",
      notes: notes,
      techs: allTechs,
      driveMinutes: driveMins,
      jobMinutes: jobMins,
      source: "field_app",
    };

    // Build diary entry
    const techNames = allTechs.map(t=>t.techName).join(", ");
    const diaryEntry = {
      id: uid(),
      type: "visit",
      ts: jobStart.toISOString(),
      contact: techNames,
      subject: `Field Visit — ${outcome||"Completed"}`,
      notes: [`Techs: ${techNames}`, `Drive: ${fmtDuration(driveMins)}`, `On-site: ${fmtDuration(jobMins)}`, notes].filter(Boolean).join("\n"),
      direction: "outbound",
      files: [],
      visitId,
      source: "field_app",
    };

    const existingVisits = job.visits||[];
    const existingDiary = job.diary||[];
    const updatedJob = {
      ...job,
      status: "Closed",
      closedDate: toDate(jobEnd),
      stage: "Completed",
      visits: [...existingVisits, visit],
      diary: [diaryEntry, ...existingDiary],
    };
    onJobUpdate(updatedJob);
  };

  const toggleFellow = name => {
    setFellowTechs(prev => prev.includes(name) ? prev.filter(n=>n!==name) : [...prev,name]);
  };

  // Shared styles
  const S = {
    screen: {position:"fixed",inset:0,background:"#0f172a",zIndex:1000,display:"flex",flexDirection:"column",fontFamily:"'Inter','Segoe UI',sans-serif",color:"#f1f5f9",overflowY:"auto"},
    header: {padding:"16px 20px",borderBottom:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",gap:12,flexShrink:0},
    body: {flex:1,padding:"24px 20px",display:"flex",flexDirection:"column",gap:16,maxWidth:520,margin:"0 auto",width:"100%"},
    card: {background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:14,padding:"16px 18px"},
    label: {fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,color:"#64748b",marginBottom:6,display:"block"},
    bigBtn: (color="#0ea5e9") => ({width:"100%",background:color,color:"#fff",border:"none",borderRadius:14,padding:"18px",fontSize:16,fontWeight:800,cursor:"pointer",fontFamily:"inherit",marginTop:8}),
    outlineBtn: {width:"100%",background:"transparent",color:"#94a3b8",border:"1px solid rgba(255,255,255,0.15)",borderRadius:14,padding:"14px",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit"},
    chip: (sel) => ({padding:"8px 16px",borderRadius:99,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",border:`1.5px solid ${sel?"#0ea5e9":"rgba(255,255,255,0.15)"}`,background:sel?"#0ea5e9":"transparent",color:sel?"#fff":"#94a3b8",transition:"all 0.15s"}),
  };

  const elapsed = (start) => {
    if(!start) return "";
    const mins = Math.round((Date.now() - new Date(start)) / 60000);
    return fmtDuration(mins);
  };

  // ── DRIVING PHASE ──────────────────────────────
  if(phase==="driving") return (
    <div style={S.screen}>
      <div style={S.header}>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#94a3b8",fontSize:20,cursor:"pointer",fontFamily:"inherit",padding:0}}>←</button>
        <div>
          <div style={{fontWeight:800,fontSize:15}}>🚗 Driving to Job</div>
          <div style={{fontSize:12,color:"#64748b"}}>{job.ref} · {job.type}</div>
        </div>
      </div>
      <div style={S.body}>
        <div style={S.card}>
          <span style={S.label}>Job Address</span>
          <div style={{fontSize:18,fontWeight:800,lineHeight:1.3,marginBottom:12}}>{job.address}</div>
          <div style={{fontSize:13,color:"#94a3b8",marginBottom:4}}>{job.description}</div>
          {job.keyMethod&&<div style={{marginTop:10,padding:"8px 12px",background:"rgba(255,255,255,0.05)",borderRadius:8,fontSize:13,color:"#94a3b8"}}>
            🔑 Access: <span style={{color:"#f1f5f9",fontWeight:600}}>{job.keyMethod==="tenant"?"Tenant has key":job.keyMethod==="office"?"Office hold key":"Other"}</span>
            {job.keyNotes&&<div style={{marginTop:4,fontSize:12,color:"#64748b"}}>{job.keyNotes}</div>}
          </div>}
        </div>

        <button onClick={openMaps} style={{...S.outlineBtn,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
          <span style={{fontSize:20}}>🗺️</span> Open Google Maps
        </button>

        {/* Tenant info */}
        {(job.tenants||[]).length>0&&(
          <div style={S.card}>
            <span style={S.label}>Tenants to notify</span>
            {job.tenants.map(t=>(
              <div key={t.id} style={{display:"flex",gap:12,alignItems:"center",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                <Avatar name={t.name} size={32} bg="#1e3a5f" fg="#93c5fd"/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:13}}>{t.name}</div>
                  {t.phone&&<div style={{fontSize:12,color:"#64748b"}}>{t.phone}</div>}
                </div>
                {t.phone&&<a href={`tel:${t.phone}`} style={{color:"#0ea5e9",fontSize:12,fontWeight:700,textDecoration:"none"}}>Call</a>}
              </div>
            ))}
            <div style={{marginTop:10,padding:"8px 12px",background:"rgba(14,165,233,0.1)",border:"1px solid rgba(14,165,233,0.2)",borderRadius:8,fontSize:12,color:"#7dd3fc"}}>
              📱 SMS notification — coming soon
            </div>
          </div>
        )}

        <div style={{textAlign:"center",color:"#475569",fontSize:12,marginTop:4}}>Driving timer started · {elapsed(driveStartTs)} ago</div>

        <button onClick={handleArrived} style={S.bigBtn("#16a34a")}>
          ✅ I've Arrived
        </button>
        <button onClick={onClose} style={S.outlineBtn}>← Back to Jobs</button>
      </div>
    </div>
  );

  // ── ARRIVAL CHECK-IN PHASE ─────────────────────
  if(phase==="arrived") return (
    <div style={S.screen}>
      <div style={S.header}>
        <div style={{width:10,height:10,borderRadius:"50%",background:"#22c55e",flexShrink:0}}/>
        <div>
          <div style={{fontWeight:800,fontSize:15}}>📍 On Site</div>
          <div style={{fontSize:12,color:"#64748b"}}>{job.ref} · {job.address}</div>
        </div>
      </div>
      <div style={S.body}>
        {/* Drive time summary */}
        <div style={{...S.card,background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)"}}>
          <div style={{display:"flex",gap:16}}>
            <div style={{textAlign:"center",flex:1}}>
              <div style={{fontSize:22,fontWeight:900,color:"#4ade80"}}>{fmtDuration(Math.round((new Date(arrivalTs)-new Date(driveStartTs))/60000))}</div>
              <div style={{fontSize:11,color:"#64748b",marginTop:2}}>Drive time</div>
            </div>
            <div style={{width:1,background:"rgba(255,255,255,0.08)"}}/>
            <div style={{textAlign:"center",flex:1}}>
              <div style={{fontSize:22,fontWeight:900,color:"#f1f5f9"}}>{new Date(arrivalTs).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div>
              <div style={{fontSize:11,color:"#64748b",marginTop:2}}>Arrived at</div>
            </div>
          </div>
        </div>

        {/* Address confirm */}
        <div style={S.card}>
          <span style={S.label}>Confirm address is correct</span>
          <div style={{fontSize:15,fontWeight:700,marginBottom:12}}>{job.address}</div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setAddressOk(true)} style={{...S.chip(addressOk===true),flex:1}}>✓ Correct</button>
            <button onClick={()=>setAddressOk(false)} style={{...S.chip(addressOk===false),flex:1,borderColor:addressOk===false?"#ef4444":"rgba(255,255,255,0.15)",background:addressOk===false?"#ef4444":"transparent"}}>✗ Wrong</button>
          </div>
          {addressOk===false&&<div style={{marginTop:10,fontSize:12,color:"#fca5a5"}}>⚠️ Note the correct address in job notes when closing.</div>}
        </div>

        {/* Lead tech */}
        <div style={S.card}>
          <span style={S.label}>Who are you?</span>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {activeTechs.map(f=>(
              <button key={f.id} onClick={()=>setLeadTech(f.name)} style={S.chip(leadTech===f.name)}>
                {leadTech===f.name?"👤 ":""}{f.name}
              </button>
            ))}
          </div>
        </div>

        {/* Fellow techs */}
        <div style={S.card}>
          <span style={S.label}>Fellow techs on site (optional)</span>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {activeTechs.filter(f=>f.name!==leadTech).map(f=>(
              <button key={f.id} onClick={()=>toggleFellow(f.name)} style={S.chip(fellowTechs.includes(f.name))}>
                {fellowTechs.includes(f.name)?"✓ ":""}{f.name}
              </button>
            ))}
            {activeTechs.filter(f=>f.name!==leadTech).length===0&&<span style={{fontSize:13,color:"#475569"}}>No other techs assigned</span>}
          </div>
        </div>

        <button onClick={handleStartJob} disabled={!leadTech||addressOk===null}
          style={{...S.bigBtn(leadTech&&addressOk!==null?"#0ea5e9":"#334155"),cursor:leadTech&&addressOk!==null?"pointer":"not-allowed"}}>
          {!leadTech?"Select your name first":addressOk===null?"Confirm address first":"▶ Start Job"}
        </button>
      </div>
    </div>
  );

  // ── IN PROGRESS PHASE ──────────────────────────
  if(phase==="in_progress") return (
    <div style={S.screen}>
      <div style={S.header}>
        <div style={{width:10,height:10,borderRadius:"50%",background:"#f59e0b",animation:"pulse 1.5s infinite",flexShrink:0}}/>
        <div style={{flex:1}}>
          <div style={{fontWeight:800,fontSize:15}}>🔧 Job in Progress</div>
          <div style={{fontSize:12,color:"#64748b"}}>{job.ref} · {[leadTech,...fellowTechs].join(", ")}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:18,fontWeight:900,color:"#fbbf24"}}>{elapsed(jobStartTs)}</div>
          <div style={{fontSize:10,color:"#64748b"}}>on site</div>
        </div>
      </div>
      <div style={S.body}>
        {/* Job info */}
        <div style={S.card}>
          <div style={{fontSize:16,fontWeight:800,marginBottom:6}}>{job.address}</div>
          <div style={{fontSize:13,color:"#94a3b8"}}>{job.description}</div>
          {(job.tenants||[]).length>0&&(
            <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.08)"}}>
              {job.tenants.map(t=>(
                <div key={t.id} style={{display:"flex",gap:8,alignItems:"center",marginBottom:4}}>
                  <span style={{fontSize:13,color:"#94a3b8"}}>👤 {t.name}</span>
                  {t.phone&&<a href={`tel:${t.phone}`} style={{color:"#0ea5e9",fontSize:12,fontWeight:700,textDecoration:"none",marginLeft:"auto"}}>Call</a>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Appliances */}
        {(job.appliances||[]).length>0&&(
          <div style={S.card}>
            <span style={S.label}>Appliances</span>
            {job.appliances.map((a,i)=>(
              <div key={i} style={{fontSize:13,color:"#cbd5e1",padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>{a.make} {a.model} — {a.type}</div>
            ))}
          </div>
        )}

        {/* Field Forms */}
        {(fieldForms||[]).length>0&&(
          <div style={S.card}>
            <span style={S.label}>Job Forms</span>
            {(fieldForms||[]).map(f=>{
              const done = completedForms.includes(f.id);
              return(
                <div key={f.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:done?"#4ade80":"#f1f5f9"}}>{done?"✓ ":""}{f.name}</div>
                    <div style={{fontSize:11,color:"#64748b",marginTop:2}}>{f.badge} · {f.questions.length} questions{f.badgeRequired==="required"?" · Required":""}</div>
                  </div>
                  <button onClick={()=>setActiveFormId(f.id)}
                    style={{background:done?"rgba(34,197,94,0.15)":"rgba(14,165,233,0.2)",border:`1px solid ${done?"rgba(34,197,94,0.3)":"rgba(14,165,233,0.3)"}`,borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:700,color:done?"#4ade80":"#7dd3fc",cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
                    {done?"Review":"Fill In"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Inline form filler */}
        {activeFormId&&(
          <FieldFormFiller
            form={(fieldForms||[]).find(f=>f.id===activeFormId)||null}
            jobRef={job.ref}
            answers={formAnswers[activeFormId]||{}}
            onAnswer={(qId,val)=>setFormAnswers(prev=>({...prev,[activeFormId]:{...(prev[activeFormId]||{}),[qId]:val}}))}
            onSubmit={()=>{setCompletedForms(prev=>[...prev.filter(x=>x!==activeFormId),activeFormId]);setActiveFormId(null);}}
            onBack={()=>setActiveFormId(null)}
          />
        )}

        {/* Outcome */}
        <div style={S.card}>
          <span style={S.label}>Job outcome</span>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {VISIT_OUTCOMES.map(o=>(
              <button key={o} onClick={()=>setOutcome(o)} style={S.chip(outcome===o)}>{o}</button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div style={S.card}>
          <span style={S.label}>Job notes</span>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={4}
            placeholder="What was done, parts used, issues found…"
            style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"10px 12px",color:"#f1f5f9",fontSize:13,fontFamily:"inherit",resize:"vertical",boxSizing:"border-box"}}/>
        </div>

        <button onClick={handleCloseJob} disabled={!outcome}
          style={{...S.bigBtn(outcome?"#dc2626":"#334155"),cursor:outcome?"pointer":"not-allowed"}}>
          {!outcome?"Select an outcome first":"✓ Close Job"}
        </button>
        <div style={{textAlign:"center",fontSize:11,color:"#475569",marginTop:-8}}>This will record drive time + job time automatically</div>
      </div>
    </div>
  );

  // ── CLOSED PHASE ───────────────────────────────
  if(phase==="closed") {
    const driveMins = driveStartTs&&arrivalTs ? Math.round((new Date(arrivalTs)-new Date(driveStartTs))/60000) : 0;
    const jobMins = jobStartTs&&jobEndTs ? Math.round((new Date(jobEndTs)-new Date(jobStartTs))/60000) : 0;
    const allTechNames = [leadTech,...fellowTechs].filter(Boolean);
    return (
      <div style={S.screen}>
        <div style={S.header}>
          <div style={{width:10,height:10,borderRadius:"50%",background:"#22c55e",flexShrink:0}}/>
          <div><div style={{fontWeight:800,fontSize:15}}>✅ Job Closed</div><div style={{fontSize:12,color:"#64748b"}}>{job.ref}</div></div>
        </div>
        <div style={S.body}>
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{fontSize:48,marginBottom:8}}>✅</div>
            <div style={{fontSize:20,fontWeight:900,marginBottom:4}}>Job Complete</div>
            <div style={{fontSize:13,color:"#64748b"}}>{job.address}</div>
          </div>

          <div style={{...S.card,display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,textAlign:"center"}}>
            <div>
              <div style={{fontSize:28,fontWeight:900,color:"#60a5fa"}}>{fmtDuration(driveMins)}</div>
              <div style={{fontSize:11,color:"#64748b",marginTop:2}}>🚗 Drive time</div>
            </div>
            <div>
              <div style={{fontSize:28,fontWeight:900,color:"#4ade80"}}>{fmtDuration(jobMins)}</div>
              <div style={{fontSize:11,color:"#64748b",marginTop:2}}>🔧 Job time</div>
            </div>
          </div>

          <div style={S.card}>
            <span style={S.label}>Technicians</span>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {allTechNames.map(n=>(
                <span key={n} style={{background:"rgba(14,165,233,0.15)",border:"1px solid rgba(14,165,233,0.3)",borderRadius:99,padding:"4px 12px",fontSize:13,fontWeight:700,color:"#7dd3fc"}}>{n}</span>
              ))}
            </div>
          </div>

          <div style={S.card}>
            <span style={S.label}>Outcome</span>
            <div style={{fontSize:15,fontWeight:700}}>{outcome}</div>
            {notes&&<div style={{fontSize:13,color:"#94a3b8",marginTop:6,lineHeight:1.5}}>{notes}</div>}
          </div>

          <div style={{padding:"12px 16px",background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.15)",borderRadius:10,fontSize:12,color:"#86efac"}}>
            ✓ Visit record saved · drive + job time auto-filled · diary updated
          </div>

          <button onClick={onClose} style={S.bigBtn()}>← Back to Jobs</button>
        </div>
      </div>
    );
  }
  return null;
}

/* ═══════════════════════════════════════════
   FIELD FORM FILLER (extracted from FieldMode to avoid IIFE)
═══════════════════════════════════════════ */
function FieldFormFiller({form, jobRef, answers, onAnswer, onSubmit, onBack}) {
  if(!form) return null;
  const mandatoryDone = form.questions.filter(q=>q.mandatory).every(q=>answers[q.id]);
  return(
    <div style={{position:"fixed",inset:0,background:"#0f172a",zIndex:1100,overflowY:"auto",fontFamily:"'Inter','Segoe UI',sans-serif",color:"#f1f5f9"}}>
      <div style={{padding:"16px 20px",borderBottom:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,background:"#0f172a",zIndex:1}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"#94a3b8",fontSize:20,cursor:"pointer",fontFamily:"inherit",padding:0}}>←</button>
        <div style={{flex:1}}>
          <div style={{fontWeight:800,fontSize:15}}>{form.name}</div>
          <div style={{fontSize:11,color:"#64748b"}}>{jobRef} · {form.questions.length} questions</div>
        </div>
      </div>
      <div style={{padding:"20px",maxWidth:520,margin:"0 auto",display:"flex",flexDirection:"column",gap:16}}>
        {form.questions.map((q,qi)=>{
          const val = answers[q.id];
          return(
            <div key={q.id} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:14,padding:"16px 18px"}}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:4,lineHeight:1.4}}>
                {qi+1}. {q.text}
                {q.mandatory&&<span style={{color:"#f87171",marginLeft:4}}>*</span>}
              </div>
              <div style={{fontSize:10,color:"#475569",marginBottom:10,textTransform:"uppercase",letterSpacing:0.5}}>{FORM_Q_TYPES.find(t=>t.id===q.type)?.icon} {q.type}</div>
              {q.type==="yesno"&&(
                <div style={{display:"flex",gap:8}}>
                  {["Yes","No"].map(opt=>(
                    <button key={opt} onClick={()=>onAnswer(q.id,opt)}
                      style={{flex:1,padding:"10px",borderRadius:10,border:`2px solid ${val===opt?(opt==="Yes"?"#22c55e":"#ef4444"):"rgba(255,255,255,0.15)"}`,background:val===opt?(opt==="Yes"?"rgba(34,197,94,0.15)":"rgba(239,68,68,0.15)"):"transparent",color:val===opt?(opt==="Yes"?"#4ade80":"#fca5a5"):"#94a3b8",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>
                      {opt==="Yes"?"✓ Yes":"✗ No"}
                    </button>
                  ))}
                </div>
              )}
              {q.type==="multi"&&(
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {(q.options||[]).map(opt=>(
                    <button key={opt} onClick={()=>onAnswer(q.id,opt)}
                      style={{textAlign:"left",padding:"10px 14px",borderRadius:10,border:`2px solid ${val===opt?"#0ea5e9":"rgba(255,255,255,0.1)"}`,background:val===opt?"rgba(14,165,233,0.15)":"transparent",color:val===opt?"#7dd3fc":"#94a3b8",fontSize:13,fontWeight:val===opt?700:400,cursor:"pointer",fontFamily:"inherit"}}>
                      {val===opt?"✓ ":""}{opt}
                    </button>
                  ))}
                </div>
              )}
              {(q.type==="text"||q.type==="number")&&(
                q.type==="text"
                  ? <textarea rows={3} value={val||""} onChange={e=>onAnswer(q.id,e.target.value)} placeholder="Type your answer…"
                      style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"10px 12px",color:"#f1f5f9",fontSize:13,fontFamily:"inherit",resize:"vertical",boxSizing:"border-box"}}/>
                  : <input type="number" value={val||""} onChange={e=>onAnswer(q.id,e.target.value)} placeholder="Enter number…"
                      style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"10px 12px",color:"#f1f5f9",fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}/>
              )}
              {q.type==="photo"&&(
                <div>
                  <label style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(14,165,233,0.15)",border:"1px solid rgba(14,165,233,0.3)",borderRadius:10,padding:"10px 16px",cursor:"pointer",fontSize:13,fontWeight:700,color:"#7dd3fc"}}>
                    📷 {val?"Photo captured ✓":"Take Photo"}
                    <input type="file" accept="image/*" capture="environment" style={{display:"none"}}
                      onChange={e=>{if(e.target.files[0]){const r=new FileReader();r.onload=ev=>onAnswer(q.id,ev.target.result);r.readAsDataURL(e.target.files[0]);}}}/>
                  </label>
                  {val&&<img src={val} alt="captured" style={{marginTop:10,width:"100%",borderRadius:8,maxHeight:200,objectFit:"cover"}}/>}
                </div>
              )}
            </div>
          );
        })}
        <button onClick={onSubmit} disabled={!mandatoryDone}
          style={{background:mandatoryDone?"#0ea5e9":"#334155",color:"#fff",border:"none",borderRadius:14,padding:"16px",fontSize:15,fontWeight:800,cursor:mandatoryDone?"pointer":"not-allowed",fontFamily:"inherit",marginTop:8}}>
          {mandatoryDone?"✓ Submit Form":"Complete required questions first"}
        </button>
        <div style={{height:40}}/>
      </div>
    </div>
  );
}

/* Map tooltip SVG element (extracted to avoid IIFE in JSX) */
function MapJobTooltip({job, project, allTechNames, mapW, mapH}) {
  const p = project(job.coords);
  const ti = allTechNames.indexOf(job.tech);
  const col = TECH_COLORS[ti%TECH_COLORS.length]||"#64748b";
  const tx = Math.min(p.x, mapW-180);
  const ty = p.y>mapH/2 ? p.y-75 : p.y+18;
  const addrShort = (job.address||"").length>26 ? (job.address||"").slice(0,26)+"…" : (job.address||"");
  return(
    <g>
      <rect x={tx} y={ty} width={175} height={65} rx={8} fill="#0f172a" stroke={col} strokeWidth={1.5}/>
      <text x={tx+10} y={ty+18} fontSize={11} fill={col} fontWeight="bold" fontFamily="sans-serif">{job.ref} · {job.scheduledTime||"Unscheduled"}</text>
      <text x={tx+10} y={ty+32} fontSize={10} fill="#94a3b8" fontFamily="sans-serif">{addrShort}</text>
      <text x={tx+10} y={ty+46} fontSize={10} fill="#64748b" fontFamily="sans-serif">{job.tech}</text>
      <text x={tx+10} y={ty+58} fontSize={9} fill="#475569" fontFamily="sans-serif">Click to open</text>
    </g>
  );
}

function MapPinTooltip({job, project, allTechNames}) {
  const coords = jobCoords(job);
  const p = project(coords);
  const ti = allTechNames.indexOf(job.tech);
  const col = TECH_COLORS[ti%TECH_COLORS.length]||"#64748b";
  const tx = Math.min(p.x+18, 860-170);
  const ty = Math.max(10, p.y-45);
  const suburb = (job.address||"").split(",").slice(-2,-1)[0]?.trim()||(job.address||"").split(",")[0];
  return(
    <g>
      <rect x={tx-4} y={ty-14} width={168} height={62} rx={8} ry={8}
        fill="#0f172a" stroke={col} strokeWidth={1.5} opacity={0.97}/>
      <text x={tx+2} y={ty+2} fontSize={11} fill={col} fontWeight="800" fontFamily="'Inter',sans-serif">{job.ref} — {job.scheduledTime||"TBD"}</text>
      <text x={tx+2} y={ty+16} fontSize={10} fill="#e2e8f0" fontFamily="'Inter',sans-serif">{(job.address||"").split(",")[0]}</text>
      <text x={tx+2} y={ty+29} fontSize={9} fill="#94a3b8" fontFamily="'Inter',sans-serif">{suburb?.toUpperCase()} · {job.tech}</text>
      <text x={tx+2} y={ty+42} fontSize={9} fill="#64748b" fontFamily="'Inter',sans-serif">{(job.description||"").slice(0,36)}</text>
    </g>
  );
}

/* ═══════════════════════════════════════════
   DISPATCH BOARD — Board / Calendar / Map views
═══════════════════════════════════════════ */

// Colour palette per tech (cycles)
// Tech route colours — never green (completed) or red (visited/incomplete), those are reserved for job status
const TECH_COLORS = ["#3b82f6","#f97316","#8b5cf6","#ec4899","#14b8a6","#f59e0b","#6366f1","#0ea5e9"];

// Pin colour for a job on the map — reflects job status, not tech
// 🟢 green  = Completed or Invoiced
// 🔴 red    = visited (has visits logged) but not yet complete
// tech colour = everything else (scheduled, new, on hold, in progress with no visits)
const JOB_PIN_COMPLETE  = "#16a34a"; // green
const JOB_PIN_VISITED   = "#dc2626"; // red
function jobPinColor(job, techColor) {
  if(job.stage === "Completed" || job.stage === "Invoiced") return JOB_PIN_COMPLETE;
  if((job.visits||[]).length > 0) return JOB_PIN_VISITED;
  return techColor;
}

// 🔑 Google Maps API Key — paste yours here, enable Maps JS API + Places API
// 🔑 Set your Google Maps API key below — enables map view + address autocomplete
const GMAPS_KEY = "AIzaSyD_JdutSUbztewIWTqP1Xihy3KmQ2alXmY";
const techColor = (techName, allTechs) => {
  const idx = allTechs.indexOf(techName);
  return TECH_COLORS[idx % TECH_COLORS.length] || "#64748b";
};

// Approx Sydney suburb coords for jobs without lat/lng
const SUBURB_COORDS = {
  "parramatta":    {lat:-33.8150, lng:151.0011},
  "blacktown":     {lat:-33.7690, lng:150.9054},
  "penrith":       {lat:-33.7510, lng:150.6942},
  "sydney":        {lat:-33.8688, lng:151.2093},
  "chatswood":     {lat:-33.7969, lng:151.1808},
  "hornsby":       {lat:-33.7028, lng:151.0988},
  "liverpool":     {lat:-33.9200, lng:150.9231},
  "campbelltown":  {lat:-34.0651, lng:150.8141},
  "carlingford":   {lat:-33.7810, lng:151.0460},
  "rydalmere":     {lat:-33.8100, lng:151.0200},
  "merrylands":    {lat:-33.8380, lng:150.9880},
  "guildford":     {lat:-33.8510, lng:150.9800},
  "auburn":        {lat:-33.8490, lng:151.0340},
  "seven hills":   {lat:-33.7745, lng:150.9360},
  "baulkham hills":{lat:-33.7590, lng:150.9800},
  "castle hill":   {lat:-33.7300, lng:151.0000},
  "kingswood":     {lat:-33.7630, lng:150.7240},
  "jamisontown":   {lat:-33.7670, lng:150.6750},
  "narellan":      {lat:-34.0200, lng:150.7380},
};

const jobCoords = (job) => {
  if(job.lat && job.lng) return {lat:job.lat, lng:job.lng};
  const addr = (job.address||"").toLowerCase();
  for(const [suburb, coords] of Object.entries(SUBURB_COORDS)){
    if(addr.includes(suburb)) return coords;
  }
  // Deterministic fallback based on job id hash
  const h = (job.id||"x").split("").reduce((a,c)=>a+c.charCodeAt(0),0);
  return {lat:-33.8688 + ((h%20)-10)*0.008, lng:151.2093 + ((h%15)-7)*0.008};
};

// Calendar helpers
const timeToMinutes = t => { if(!t) return null; const [h,m]=(t||"").split(":").map(Number); return h*60+(m||0); };
const minutesToTime = m => { const h=Math.floor(m/60); const min=m%60; return `${String(h).padStart(2,"0")}:${String(min).padStart(2,"0")}`; };
const CAL_START = 7*60; // 7am
const CAL_END   = 19*60; // 7pm
const CAL_SPAN  = CAL_END - CAL_START;

function DispatchTab({settings, companies, setCompanies, vendors, fieldMode, setFieldMode, quotes=[], setQuotes}) {
  const jobs = allJobs(companies);
  const open = jobs.filter(j=>j.status==="Open");
  const allTechNames = [...new Set(open.map(j=>j.tech).filter(Boolean))].sort();
  const [dispView, setDispView] = useState("board"); // "board"|"calendar"|"map"
  const [filter,setFilter]=useState("All");
  const [search,setSearch]=useState("");
  const [drawerJob, setDrawerJob] = useState(null);
  const {jobStages, fieldStaff} = settings;

  const updateJob = (updated) => {
    setCompanies(prev => prev.map(co=>({...co, branches:co.branches.map(b=>({...b, agents:b.agents.map(a=>({...a, jobs:(a.jobs||[]).map(j=>j.id===updated.id?updated:j)}))}))})));
    setDrawerJob(updated);
  };

  const liveDrawerJob = drawerJob ? allJobs(companies).find(j=>j.id===drawerJob.id)||drawerJob : null;

  const filtered = open.filter(j=>{
    const matchTech = filter==="All" || (j.tech||"Unassigned")===filter;
    const matchSearch = !search || j.ref.toLowerCase().includes(search.toLowerCase()) || (j.address||"").toLowerCase().includes(search.toLowerCase()) || (j.tech||"").toLowerCase().includes(search.toLowerCase());
    return matchTech && matchSearch;
  });

  return(
    <div>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10}}>
        <div>
          <h2 style={{fontSize:18,fontWeight:800,color:C.text}}>Dispatch Board</h2>
          <p style={{color:C.sub,fontSize:12,marginTop:2}}>{open.length} open jobs · {allTechNames.length} techs scheduled today</p>
        </div>
        <div style={{display:"flex",gap:6}}>
          {[["board","📋","Board"],["calendar","📅","Calendar"],["map","🗺️","Map"]].map(([id,icon,label])=>(
            <button key={id} onClick={()=>setDispView(id)}
              style={{display:"flex",alignItems:"center",gap:5,padding:"7px 14px",borderRadius:8,border:`1.5px solid ${dispView===id?C.accent:C.border}`,background:dispView===id?"#eff6ff":"#fff",color:dispView===id?C.accent:C.sub,fontWeight:dispView===id?700:500,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
              <span>{icon}</span>{label}
            </button>
          ))}
        </div>
      </div>

      {/* Search + tech filter (board/map only) */}
      {dispView!=="calendar"&&(
        <div style={{marginBottom:12}}>
          <input placeholder="Search jobs, address, technician…" value={search} onChange={e=>setSearch(e.target.value)}
            style={{width:"100%",background:"#fff",border:`1px solid ${C.border}`,borderRadius:9,padding:"10px 14px",color:C.text,fontSize:14,marginBottom:10,fontFamily:"inherit",boxSizing:"border-box"}}/>
          <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4}}>
            <Pill label="All Techs" active={filter==="All"} onClick={()=>setFilter("All")}/>
            {allTechNames.map(t=>(
              <button key={t} onClick={()=>setFilter(t)}
                style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:99,border:`2px solid ${filter===t?techColor(t,allTechNames):C.border}`,background:filter===t?techColor(t,allTechNames)+"22":"#fff",color:filter===t?techColor(t,allTechNames):C.sub,fontWeight:filter===t?700:500,fontSize:12,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:techColor(t,allTechNames),display:"inline-block",flexShrink:0}}/>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* BOARD VIEW */}
      {dispView==="board"&&(
        <div>
          {filter==="All" ? (
            allTechNames.map(tech=>{
              const techJobs=filtered.filter(j=>j.tech===tech);
              if(techJobs.length===0)return null;
              const col = techColor(tech, allTechNames);
              return(
                <div key={tech} style={{marginBottom:20}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,padding:"10px 14px",background:`${col}11`,borderRadius:10,border:`1.5px solid ${col}33`}}>
                    <div style={{width:32,height:32,borderRadius:"50%",background:col,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:13,flexShrink:0}}>
                      {tech.split(" ").map(w=>w[0]).join("").slice(0,2)}
                    </div>
                    <span style={{color:C.text,fontWeight:700,fontSize:14,flex:1}}>{tech}</span>
                    <span style={{background:col,color:"#fff",borderRadius:99,padding:"2px 10px",fontSize:11,fontWeight:700}}>{techJobs.length} job{techJobs.length!==1?"s":""}</span>
                  </div>
                  {techJobs.map(job=>(<DispatchCard key={job.id} job={job} techCol={col} onOpen={()=>setDrawerJob(job)} onStartDriving={()=>setFieldMode(job)}/>))}
                </div>
              );
            })
          ):(
            filtered.map(job=><DispatchCard key={job.id} job={job} techCol={techColor(job.tech,allTechNames)} onOpen={()=>setDrawerJob(job)} onStartDriving={()=>setFieldMode(job)}/>)
          )}
          {filtered.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:C.muted}}><div style={{fontSize:32,marginBottom:8}}>📋</div><div style={{fontSize:14,fontWeight:600}}>No open jobs found</div></div>}
        </div>
      )}

      {/* CALENDAR VIEW */}
      {dispView==="calendar"&&(
        <DispatchCalendar jobs={open} allTechNames={allTechNames} onOpen={setDrawerJob} onStartDriving={setFieldMode}/>
      )}

      {/* MAP VIEW */}
      {dispView==="map"&&(
        <DispatchMap jobs={open} allTechNames={allTechNames} onOpen={setDrawerJob} fieldStaff={fieldStaff}/>
      )}

      {/* Job Drawer */}
      {liveDrawerJob&&(
        <JobDrawer
          job={liveDrawerJob}
          onClose={()=>setDrawerJob(null)}
          onUpdate={updateJob}
          settings={settings}
          companies={companies}
          setCompanies={setCompanies}
          vendors={vendors}
          quotes={quotes}
          setQuotes={setQuotes}
        />
      )}
    </div>
  );
}

function DispatchCard({job, techCol, onOpen, onStartDriving}) {
  const [hovered, setHovered] = useState(false);
  const [cardPos, setCardPos] = useState(null);
  const keyLabel = job.keyMethod==="tenant"?"🧑 Tenant":job.keyMethod==="office"?"🏢 Office":"🔑 Other";
  const col = techCol||C.accent;

  const handleMouseEnter = e => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCardPos(rect);
    setHovered(true);
  };
  const handleMouseLeave = () => setHovered(false);

  // Preview panel positioning — right of viewport, vertically centered on card
  const previewTop = cardPos ? Math.min(
    Math.max(cardPos.top - 40, 80),
    window.innerHeight - 320
  ) : 200;

  return(
    <>
      <div onClick={onOpen}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,
          padding:"14px 16px",marginBottom:10,
          boxShadow:hovered?"0 4px 16px rgba(0,0,0,0.1)":"0 1px 3px rgba(0,0,0,0.04)",
          cursor:"pointer",transition:"box-shadow 0.15s",
          borderLeft:`4px solid ${col}`,
          maxWidth:680}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            <span style={{color:col,fontWeight:800,fontSize:13}}>{job.ref}</span>
            <Badge label={job.type} color={job.type==="HVAC"?"blue":job.type==="Plumbing"?"purple":"orange"}/>
            {job.stage&&<Badge label={job.stage} color={stageColor(job.stage)}/>}
          </div>
          <button onClick={e=>{e.stopPropagation();onStartDriving(job);}}
            style={{background:col,color:"#fff",border:"none",borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",marginLeft:8,flexShrink:0}}>
            🚗 Start
          </button>
        </div>
        <div style={{color:C.text,fontWeight:700,fontSize:14,marginBottom:2}}>{job.address}</div>
        <div style={{color:C.sub,fontSize:12,marginBottom:8}}>{job.description}</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",paddingTop:8,borderTop:`1px solid ${C.border}`,alignItems:"center"}}>
          {job.scheduledTime&&<span style={{fontSize:12,color:col,fontWeight:700}}>🕐 {job.scheduledTime}{job.durationHrs?` (${job.durationHrs}hr)`:""}</span>}
          <span style={{fontSize:12,color:C.sub}}>🏢 {job.companyName}</span>
          <span style={{fontSize:12,color:C.sub}}>👥 {(job.tenants||[]).length} tenant{(job.tenants||[]).length!==1?"s":""}</span>
          {job.keyMethod&&<span style={{fontSize:12,color:C.sub}}>{keyLabel}</span>}
          <span style={{fontSize:11,color:C.muted,marginLeft:"auto"}}>Click to open ›</span>
        </div>
      </div>

      {/* Hover preview panel — fills right column */}
      {hovered&&cardPos&&(
        <div onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
          style={{position:"fixed",left:972,right:16,top:82,bottom:16,
            background:"#fff",borderRadius:14,
            boxShadow:"0 8px 32px rgba(0,0,0,0.14)",
            border:`1px solid ${C.border}`,
            zIndex:999,overflow:"hidden",display:"flex",flexDirection:"column",
            animation:"fadeSlideIn 0.15s ease"}}>
          <style>{`@keyframes fadeSlideIn{from{opacity:0;transform:translateX(8px)}to{opacity:1;transform:translateX(0)}}`}</style>

          {/* Colour bar */}
          <div style={{height:5,background:col,flexShrink:0}}/>

          <div style={{flex:1,overflowY:"auto",padding:"20px 24px",display:"flex",flexDirection:"column",gap:0}}>
            {/* Header */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,paddingBottom:16,borderBottom:`1px solid ${C.border}`}}>
              <div>
                <span style={{color:col,fontWeight:800,fontSize:13,letterSpacing:0.3}}>{job.ref}</span>
                <div style={{color:C.text,fontWeight:800,fontSize:20,marginTop:4,lineHeight:1.3}}>{job.address}</div>
                {job.description&&<div style={{color:C.sub,fontSize:13,marginTop:6,lineHeight:1.5}}>{job.description}</div>}
              </div>
              <Badge label={job.stage||"New"} color={stageColor(job.stage||"New")}/>
            </div>

            {/* Key details grid */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
              {[
                {icon:"🕐",label:"Scheduled",value:job.scheduledTime?(job.scheduledTime+(job.durationHrs?` (${job.durationHrs}hr)`:"")):"Not scheduled",accent:!!job.scheduledTime},
                {icon:"👷",label:"Technician",value:job.tech||"Unassigned"},
                {icon:"🏢",label:"Company",value:job.companyName||"—"},
                {icon:"🔑",label:"Key Access",value:job.keyMethod?keyLabel:"Not set"},
              ].map(item=>(
                <div key={item.label} style={{background:C.bg,borderRadius:10,padding:"12px 14px",border:`1px solid ${C.border}`}}>
                  <div style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>{item.icon} {item.label}</div>
                  <div style={{color:item.accent?col:C.text,fontWeight:700,fontSize:13}}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Tenants */}
            {(job.tenants||[]).length>0&&(
              <div style={{marginBottom:20}}>
                <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:10}}>👥 Tenants</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {(job.tenants||[]).map(t=>(
                    <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#fff",border:`1px solid ${C.border}`,borderRadius:10}}>
                      <div style={{width:32,height:32,borderRadius:"50%",background:"#dcfce7",display:"flex",alignItems:"center",justifyContent:"center",color:"#15803d",fontWeight:800,fontSize:11,flexShrink:0}}>
                        {t.name.split(" ").map(w=>w[0]).join("").slice(0,2)}
                      </div>
                      <div>
                        <div style={{fontWeight:700,fontSize:13,color:C.text}}>{t.name}</div>
                        {t.phone&&<div style={{fontSize:11,color:C.sub,marginTop:1}}>{t.phone}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key notes */}
            {job.keyNotes&&(
              <div style={{background:"#fefce8",border:"1px solid #fde047",borderRadius:10,padding:"12px 14px",marginBottom:20}}>
                <div style={{fontSize:10,color:"#854d0e",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>🔑 Access Notes</div>
                <div style={{fontSize:13,color:"#713f12",lineHeight:1.5}}>{job.keyNotes}</div>
              </div>
            )}

            {/* Appliances */}
            {(job.appliances||[]).length>0&&(
              <div style={{marginBottom:20}}>
                <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:10}}>🔧 Appliances ({job.appliances.length})</div>
                {job.appliances.map(a=>(
                  <div key={a.id} style={{display:"flex",gap:10,alignItems:"center",padding:"8px 12px",background:"#fff",border:`1px solid ${C.border}`,borderRadius:9,marginBottom:6}}>
                    <span style={{fontSize:20}}>{appIcon(a.appType)}</span>
                    <div>
                      <div style={{fontWeight:700,fontSize:12,color:C.text}}>{a.brand} {a.model}</div>
                      {a.condition&&<div style={{fontSize:11,color:C.orange,marginTop:1}}>⚠️ {a.condition}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sticky CTA */}
          <div style={{padding:"14px 24px",borderTop:`1px solid ${C.border}`,flexShrink:0,background:"#fff"}}>
            <button onClick={e=>{e.stopPropagation();onOpen();}}
              style={{width:"100%",padding:"12px",background:col,
                color:"#fff",border:"none",borderRadius:10,
                fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                boxShadow:`0 2px 8px ${col}44`}}>
              Open Full Job →
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── CALENDAR VIEW ──────────────────────────────────── */
const calBlockBg = stage => {
  if(stage==="Completed"||stage==="Invoiced") return "#22c55e";
  if(stage==="In Progress") return "#f97316";
  if(stage==="On Hold") return "#f59e0b";
  if(stage==="Scheduled") return "#3b82f6";
  return "#6366f1";
};

function DispatchCalendar({jobs, allTechNames, onOpen}) {
  const SLOT_W = 120;
  const LABEL_W = 130;
  const JOB_H = 52;
  const BAND_PAD = 6;
  const START_H = 7, END_H = 19;
  const hours = [];
  for(let h=START_H;h<END_H;h++) hours.push(h);
  const totalMins = (END_H - START_H)*60;
  const fmtHour = h => h===12?"12pm":h<12?`${h}am`:`${h-12}pm`;

  const assignLanes = techJobs => {
    const sorted = [...techJobs].sort((a,b)=>
      (timeToMinutes(a.scheduledTime)||0)-(timeToMinutes(b.scheduledTime)||0));
    const lanes = [];
    const withLane = sorted.map(job=>{
      const start = timeToMinutes(job.scheduledTime)||0;
      const end = start+(job.durationHrs||1)*60;
      let lane = lanes.findIndex(e=>e<=start);
      if(lane===-1){lane=lanes.length;lanes.push(end);}
      else lanes[lane]=end;
      return {...job, _lane:lane};
    });
    const maxLane = withLane.length>0?Math.max(...withLane.map(j=>j._lane)):0;
    return withLane.map(j=>({...j, _laneCount:maxLane+1}));
  };

  const scheduled = jobs.filter(j=>j.scheduledTime);
  const unscheduled = jobs.filter(j=>!j.scheduledTime);

  const techRows = allTechNames.map((tech,ti)=>{
    const laned = assignLanes(scheduled.filter(j=>j.tech===tech));
    const laneCount = laned.length>0?Math.max(...laned.map(j=>j._laneCount)):1;
    return {tech, ti, laned, laneCount, bandH:BAND_PAD+laneCount*(JOB_H+4)+BAND_PAD, color:TECH_COLORS[ti%TECH_COLORS.length]};
  });

  return(
    <div style={{fontFamily:"'Inter','Segoe UI',sans-serif"}}>
      {unscheduled.length>0&&(
        <div style={{background:"#fef9c3",border:"1px solid #fde047",borderRadius:10,padding:"10px 14px",marginBottom:12,display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{fontWeight:700,fontSize:12,color:"#854d0e",flexShrink:0}}>⚠️ {unscheduled.length} unscheduled</span>
          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
            {unscheduled.map(j=>(
              <button key={j.id} onClick={()=>onOpen(j)}
                style={{background:"#fff",border:"1px solid #fde047",borderRadius:6,padding:"3px 9px",fontSize:11,color:"#92400e",fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                {j.ref} · {(j.address||"").split(",")[0]}
              </button>
            ))}
          </div>
        </div>
      )}
      <div style={{overflowX:"auto",background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,boxShadow:"0 2px 12px rgba(0,0,0,0.07)"}}>
        <div style={{minWidth:LABEL_W+hours.length*SLOT_W}}>
          {/* Time header */}
          <div style={{display:"flex",borderBottom:"2px solid #e2e8f0",position:"sticky",top:0,zIndex:10,background:"#f8fafc"}}>
            <div style={{width:LABEL_W,flexShrink:0,padding:"10px 14px",fontSize:11,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:0.6,borderRight:`1px solid ${C.border}`,display:"flex",alignItems:"center",position:"sticky",left:0,zIndex:11,background:"#f8fafc"}}>Staff</div>
            {hours.map(h=>(
              <div key={h} style={{width:SLOT_W,flexShrink:0,borderLeft:`1px solid ${C.border}`,padding:"10px 0 10px 6px",fontSize:11,fontWeight:600,color:C.sub}}>
                {fmtHour(h)}
              </div>
            ))}
          </div>
          {/* Tech rows */}
          {techRows.map(({tech,ti,laned,laneCount,bandH,color},rowIdx)=>(
            <div key={tech} style={{display:"flex",borderBottom:`1px solid ${C.border}`,background:rowIdx%2===0?"#fff":"#fafbfc"}}>
              <div style={{width:LABEL_W,flexShrink:0,borderRight:`1px solid ${C.border}`,padding:"10px",display:"flex",alignItems:"flex-start",gap:8,background:rowIdx%2===0?"#fff":"#f8fafc",position:"sticky",left:0,zIndex:2}}>
                <div style={{width:30,height:30,borderRadius:"50%",background:color,color:"#fff",fontWeight:800,fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>
                  {tech.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                </div>
                <div style={{minWidth:0,flex:1}}>
                  <div style={{fontSize:12,fontWeight:700,color:C.text,lineHeight:1.2}}>{tech.split(" ")[0]}</div>
                  <div style={{fontSize:10,color:C.muted,marginTop:1}}>{tech.split(" ").slice(1).join(" ")}</div>
                  <div style={{fontSize:10,color:color,fontWeight:600,marginTop:3}}>{laned.length} job{laned.length!==1?"s":""}</div>
                </div>
              </div>
              <div style={{flex:1,position:"relative",height:bandH,minWidth:hours.length*SLOT_W}}>
                {hours.map((h,hi)=>(
                  <div key={h} style={{position:"absolute",top:0,bottom:0,left:hi*SLOT_W,borderLeft:"1px solid #e2e8f0"}}/>
                ))}
                {hours.map((h,hi)=>(
                  <div key={h+"d"} style={{position:"absolute",top:0,bottom:0,left:hi*SLOT_W+SLOT_W/2,borderLeft:"1px dashed #f1f5f9"}}/>
                ))}
                {laned.map(job=>{
                  const startMins = timeToMinutes(job.scheduledTime)||0;
                  const durMins = (job.durationHrs||1)*60;
                  const leftPct = ((startMins-START_H*60)/totalMins*100).toFixed(3)+"%";
                  const widthPct = (durMins/totalMins*100).toFixed(3)+"%";
                  const top = BAND_PAD+job._lane*(JOB_H+4);
                  const bg = calBlockBg(job.stage);
                  const isDone = job.stage==="Completed"||job.stage==="Invoiced";
                  const suburb = (job.address||"").split(",").slice(-2,-1)[0]?.trim()||(job.address||"").split(",")[0];
                  return(
                    <div key={job.id} onClick={()=>onOpen(job)}
                      style={{position:"absolute",left:leftPct,width:`calc(${widthPct} - 3px)`,top,height:JOB_H,background:bg,borderRadius:5,cursor:"pointer",overflow:"hidden",boxSizing:"border-box",padding:"4px 7px",boxShadow:"0 1px 4px rgba(0,0,0,0.18)",transition:"filter 0.12s",display:"flex",flexDirection:"column",justifyContent:"flex-start",borderLeft:"3px solid rgba(0,0,0,0.18)"}}
                      onMouseEnter={e=>{e.currentTarget.style.filter="brightness(1.1)";e.currentTarget.style.zIndex=5;}}
                      onMouseLeave={e=>{e.currentTarget.style.filter="";e.currentTarget.style.zIndex=1;}}>
                      <div style={{display:"flex",alignItems:"center",gap:3,marginBottom:1}}>
                        {isDone&&<span style={{fontSize:9,color:"rgba(255,255,255,0.95)",fontWeight:900}}>✓</span>}
                        <span style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.95)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                          {job.scheduledTime} — {minutesToTime(startMins+durMins)}
                        </span>
                      </div>
                      <div style={{fontSize:11,fontWeight:700,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:1.2}}>
                        {job.companyName||job.ref}
                      </div>
                      <div style={{fontSize:10,color:"rgba(255,255,255,0.82)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:1,textTransform:"uppercase",letterSpacing:0.4,fontWeight:600}}>
                        {suburb}
                      </div>
                    </div>
                  );
                })}
                {laned.length===0&&(
                  <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",paddingLeft:12}}>
                    <span style={{fontSize:11,color:"#cbd5e1",fontStyle:"italic"}}>No jobs scheduled</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {allTechNames.length===0&&(
            <div style={{padding:"60px 0",textAlign:"center",color:C.muted}}>
              <div style={{fontSize:40,marginBottom:10}}>📅</div>
              <div style={{fontSize:15,fontWeight:600}}>No technicians with open jobs</div>
            </div>
          )}
        </div>
      </div>
      <div style={{display:"flex",gap:14,marginTop:10,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:11,color:C.muted,fontWeight:600}}>Stage colours:</span>
        {[["Scheduled","#3b82f6"],["In Progress","#f97316"],["On Hold","#f59e0b"],["Completed","#22c55e"],["New","#6366f1"]].map(([s,bg])=>(
          <div key={s} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:C.sub}}>
            <span style={{width:10,height:10,borderRadius:2,background:bg,display:"inline-block"}}/>
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── MAP VIEW ───────────────────────────────────────── */
/* ═══════════════════════════════════════════
   ADDRESS AUTOCOMPLETE
   Uses Google Places if API key is set, otherwise plain text input
   Props: value, onChange(address, {lat,lng}), placeholder, required
═══════════════════════════════════════════ */

/* ═══════════════════════════════════════════
   GOOGLE MAPS LOADER — simple script tag, no async IIFE
═══════════════════════════════════════════ */
function loadGoogleMaps() {
  if(GMAPS_KEY === "YOUR_GOOGLE_MAPS_API_KEY") return Promise.reject("no-key");
  if(window.__gmapsPromise__) return window.__gmapsPromise__;

  window.__gmapsPromise__ = new Promise((resolve, reject) => {
    if(window.google && window.google.maps) { resolve(); return; }

    const callbackName = "__gmapsReady__";
    window[callbackName] = resolve;

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GMAPS_KEY}&libraries=places&callback=${callbackName}&loading=async`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(script);

    setTimeout(() => reject(new Error("timeout")), 15000);
  });

  return window.__gmapsPromise__;
}


/* ═══════════════════════════════════════════
   ADDRESS AUTOCOMPLETE
   Drop-in replacement for the address <FF> field.
   When Google Places is available: shows predictive AU address suggestions.
   When no API key: works as a plain text input — no errors.
   
   Props:
     value       string
     onChange    (address: string, coords: {lat,lng}|null) => void
     placeholder string
     required    bool
═══════════════════════════════════════════ */
function AddressAutocomplete({value, onChange, placeholder, required}) {
  const inputRef = useRef(null);
  const acRef    = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if(cancelled || !inputRef.current || acRef.current) return;
        acRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: {country: "au"},
          fields: ["formatted_address", "address_components", "geometry"],
          types: ["address"],
        });
        acRef.current.addListener("place_changed", () => {
          const place = acRef.current.getPlace();
          if(!place.formatted_address) return;
          let streetNum = "", route = "", suburb = "", state = "", postcode = "";
          for(const c of (place.address_components || [])) {
            const t = c.types[0];
            if(t === "street_number") streetNum = c.long_name;
            if(t === "route")         route     = c.short_name;
            if(t === "locality")      suburb    = c.long_name;
            if(t === "administrative_area_level_1") state = c.short_name;
            if(t === "postal_code")   postcode  = c.long_name;
          }
          const addr = [
            [streetNum, route].filter(Boolean).join(" "),
            suburb, state, postcode
          ].filter(Boolean).join(", ");
          const lat = place.geometry?.location?.lat();
          const lng = place.geometry?.location?.lng();
          onChange(addr || place.formatted_address, lat && lng ? {lat, lng} : null);
        });
        if(!cancelled) setReady(true);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{marginBottom:14}}>
      <label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>
        Property Address
        {required && <span style={{color:"#ef4444",marginLeft:2}}>*</span>}
        {ready && <span style={{marginLeft:8,fontSize:10,color:"#22c55e",fontWeight:500,textTransform:"none"}}>📍 autocomplete on</span>}
      </label>
      <input
        ref={inputRef}
        value={value}
        onChange={e => onChange(e.target.value, null)}
        placeholder={placeholder || "e.g. 22 Oak St, Parramatta NSW"}
        autoComplete="new-password"
        style={{
          width:"100%", background:C.raised, border:`1px solid ${C.border}`,
          borderRadius:8, padding:"9px 12px", color:C.text, fontSize:13,
          fontFamily:"inherit", boxSizing:"border-box", outline:"none",
        }}
      />
    </div>
  );
}


/* ═══════════════════════════════════════════
   DISPATCH MAP
   Google Maps when key is set, friendly placeholder when not.
═══════════════════════════════════════════ */
function DispatchMap({jobs, allTechNames, onOpen, fieldStaff=[]}) {
  const mapDivRef    = useRef(null);
  const gMapRef      = useRef(null);
  const markersRef   = useRef([]);
  const polylinesRef = useRef([]);
  const infoWinRef   = useRef(null);
  const markerMapRef = useRef({}); // jobId -> {marker, color, job, stopIndex}
  const zonesLayerRef= useRef([]); // [{polygon, label}]
  const [status, setStatus] = useState("idle");
  const [hovJob,  setHovJob]  = useState(null); // hovered job id
  const [hovTech, setHovTech] = useState(null); // hovered tech name
  const [showZones, setShowZones] = useState(false);

  const openJobs = jobs.filter(j => j.status === "Open");

  const techRoutes = allTechNames.map((tech, ti) => ({
    tech,
    color: TECH_COLORS[ti % TECH_COLORS.length],
    stops: openJobs
      .filter(j => j.tech === tech)
      .sort((a,b) => (timeToMinutes(a.scheduledTime)||9999)-(timeToMinutes(b.scheduledTime)||9999))
      .map(j => ({...j, coords: jobCoords(j)})),
  })).filter(r => r.stops.length > 0);

  // Load Google Maps
  useEffect(() => {
    if(GMAPS_KEY === "YOUR_GOOGLE_MAPS_API_KEY") { setStatus("nokey"); return; }
    setStatus("loading");
    loadGoogleMaps()
      .then(() => setStatus("ready"))
      .catch(() => setStatus("error"));
  }, []);

  // Init map once status=ready and div is mounted
  useEffect(() => {
    if(status !== "ready" || !mapDivRef.current || gMapRef.current) return;
    gMapRef.current = new window.google.maps.Map(mapDivRef.current, {
      center: {lat: -33.83, lng: 150.95},
      zoom: 10,
      mapTypeId: "roadmap",
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: true,
      styles: [
        {elementType:"geometry",        stylers:[{color:"#1a2744"}]},
        {elementType:"labels.text.fill",stylers:[{color:"#8ec3b9"}]},
        {elementType:"labels.text.stroke",stylers:[{color:"#1a3646"}]},
        {featureType:"road",elementType:"geometry",stylers:[{color:"#304a7d"}]},
        {featureType:"road.highway",elementType:"geometry",stylers:[{color:"#2c6675"}]},
        {featureType:"water",elementType:"geometry",stylers:[{color:"#0e1626"}]},
        {featureType:"poi",stylers:[{visibility:"off"}]},
        {featureType:"transit",stylers:[{visibility:"off"}]},
      ],
    });
    infoWinRef.current = new window.google.maps.InfoWindow();
  }, [status]);

  // Draw/redraw markers and polylines whenever routes change
  useEffect(() => {
    if(!gMapRef.current || status !== "ready") return;
    const routeKey = techRoutes.map(r => r.tech + r.stops.length).join(",");
    // Small delay to ensure map is initialised
    const t = setTimeout(() => drawMarkers(routeKey), 200);
    return () => clearTimeout(t);
  }, [status, techRoutes.map(r => r.tech + r.stops.length).join(",")]);

  // Show/hide technician zones overlay
  useEffect(() => {
    if(!gMapRef.current || status !== "ready") return;
    // Clear existing zone polygons
    zonesLayerRef.current.forEach(({polygon, label}) => {
      polygon.setMap(null);
      if(label) label.setMap(null);
    });
    zonesLayerRef.current = [];
    if(!showZones) return;
    // Draw each tech's zone
    fieldStaff.forEach((f, fi) => {
      if(!f.zone || f.zone.length < 3) return;
      const col = TECH_COLORS[allTechNames.indexOf(f.name) % TECH_COLORS.length] || "#64748b";
      const poly = new window.google.maps.Polygon({
        paths: f.zone,
        strokeColor: col, strokeOpacity: 0.8, strokeWeight: 2,
        fillColor: col, fillOpacity: 0.12,
        map: gMapRef.current, zIndex: 1,
      });
      // Centroid label
      const lats = f.zone.map(p=>p.lat);
      const lngs = f.zone.map(p=>p.lng);
      const cLat = (Math.min(...lats)+Math.max(...lats))/2;
      const cLng = (Math.min(...lngs)+Math.max(...lngs))/2;
      const label = new window.google.maps.Marker({
        position:{lat:cLat, lng:cLng},
        map: gMapRef.current,
        icon:{url:`data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="22"><rect width="80" height="22" rx="5" fill="${col}" opacity="0.85"/><text x="40" y="15" text-anchor="middle" font-size="11" fill="white" font-weight="700" font-family="Inter,Arial,sans-serif">${f.name.split(" ")[0]}</text></svg>`)}`,anchor:new window.google.maps.Point(40,11)},
        zIndex: 5,
      });
      zonesLayerRef.current.push({polygon: poly, label, techId: f.id});
    });
  }, [showZones, status, fieldStaff]);

  // Helper: is job coords inside a tech's zone polygon?
  function isInsideZone(lat, lng, zone) {
    if(!zone || zone.length < 3) return true; // no zone = no warning
    const poly = new window.google.maps.Polygon({paths: zone});
    return window.google.maps.geometry && window.google.maps.geometry.poly
      ? window.google.maps.geometry.poly.containsLocation(new window.google.maps.LatLng(lat, lng), poly)
      : true; // geometry lib not loaded — skip check
  };

  // Build SVG marker icon — larger + glow ring when highlighted
  function makeIcon(color, ref, stopNum, highlighted) {
    const r = highlighted ? 22 : 18;
    const size = highlighted ? 50 : 40;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      ${highlighted ? `<circle cx="${size/2}" cy="${size/2}" r="${r+4}" fill="${color}" opacity="0.25"/>` : ""}
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="${color}" stroke="white" stroke-width="2.5"/>
      <text x="${size/2}" y="${size/2-3}" text-anchor="middle" font-size="${highlighted?10:9}" fill="white" font-weight="900" font-family="Inter,Arial,sans-serif">${ref}</text>
      <text x="${size/2}" y="${size/2+9}" text-anchor="middle" font-size="${highlighted?11:10}" fill="white" font-weight="700" font-family="Inter,Arial,sans-serif">${stopNum}</text>
    </svg>`;
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      anchor: new window.google.maps.Point(size/2, size/2),
    };
  }

  // Apply highlight to markers/polylines when hovJob or hovTech changes
  useEffect(() => {
    if(status !== "ready") return;
    const gm = window.google.maps;
    Object.values(markerMapRef.current).forEach(({marker, color, techColor, job, stopIndex}) => {
      const isJobHov  = hovJob  === job.id;
      const isTechHov = hovTech === job.tech;
      const highlighted = isJobHov || isTechHov;
      const faded = (hovJob && !isJobHov) || (hovTech && !isTechHov);
      marker.setIcon(makeIcon(color, job.ref, stopIndex + 1, highlighted));
      marker.setZIndex(highlighted ? 999 : 10 + stopIndex);
      marker.setOpacity(faded ? 0.25 : 1);
      if(isJobHov) marker.setAnimation(gm.Animation.BOUNCE);
      else         marker.setAnimation(null);
    });
    // Dim/highlight polylines by tech
    polylinesRef.current.forEach(line => {
      const tech = line.__tech__;
      if(!tech) return;
      const isTechHov = hovTech === tech;
      const faded = hovTech && !isTechHov;
      line.setOptions({strokeOpacity: faded ? 0.1 : 0.9, strokeWeight: isTechHov ? 6 : 4});
    });
  }, [hovJob, hovTech, status]);

  function drawMarkers() {
    if(!gMapRef.current) return;
    const gm = window.google.maps;

    markersRef.current.forEach(m => m.setMap(null));
    polylinesRef.current.forEach(p => p.setMap(null));
    markersRef.current = [];
    polylinesRef.current = [];
    markerMapRef.current = {};

    const bounds = new gm.LatLngBounds();

    techRoutes.forEach(({tech, color, stops}) => {
      if(stops.length > 1) {
        const line = new gm.Polyline({
          path: stops.map(s => ({lat: s.coords.lat, lng: s.coords.lng})),
          strokeColor: color,
          strokeOpacity: 0.9,
          strokeWeight: 4,
          map: gMapRef.current,
          icons: [{
            icon: {
              path: gm.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 3,
              fillColor: color, fillOpacity: 1,
              strokeColor: color,
            },
            offset: "50%", repeat: "100px",
          }],
        });
        line.__tech__ = tech; // tag for hover
        polylinesRef.current.push(line);
      }

      stops.forEach((job, i) => {
        const pos = {lat: job.coords.lat, lng: job.coords.lng};
        bounds.extend(pos);
        const pinCol = jobPinColor(job, color);

        const marker = new gm.Marker({
          position: pos,
          map: gMapRef.current,
          icon: makeIcon(pinCol, job.ref, i + 1, false),
          title: `${job.ref} — ${(job.address||"").split(",")[0]}`,
          zIndex: 10 + i,
        });

        // Store for hover lookup — store both pinCol and techColor
        markerMapRef.current[job.id] = {marker, color: pinCol, techColor: color, job, stopIndex: i};

        marker.addListener("click", () => {
          infoWinRef.current.setContent(`
            <div style="font-family:'Inter',Arial,sans-serif;padding:4px;min-width:190px">
              <div style="font-weight:800;font-size:13px;color:${pinCol};margin-bottom:6px">${job.ref} · Stop ${i+1}</div>
              <div style="font-size:12px;color:#1e293b;font-weight:600;margin-bottom:3px">${(job.address||"").split(",")[0]}</div>
              <div style="font-size:11px;color:#64748b;margin-bottom:2px">🕐 ${job.scheduledTime||"TBD"} &nbsp;·&nbsp; ${job.durationHrs||1}hr</div>
              <div style="font-size:11px;color:#64748b;margin-bottom:2px">👷 ${job.tech}</div>
              <div style="font-size:11px;color:#64748b;margin-bottom:8px">📋 ${job.stage}</div>
              <button onclick="window.__fpOpen('${job.id}')"
                style="background:${pinCol};color:#fff;border:none;border-radius:6px;padding:6px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;width:100%">
                Open Job ›
              </button>
            </div>
          `);
          infoWinRef.current.open(gMapRef.current, marker);
        });

        markersRef.current.push(marker);
      });
    });

    window.__fpOpen = (jobId) => {
      const j = openJobs.find(x => x.id === jobId);
      if(j) { onOpen(j); infoWinRef.current?.close(); }
    };

    if(!bounds.isEmpty()) {
      gMapRef.current.fitBounds(bounds, {top:50, right:50, bottom:50, left:50});
    }
  }

  return (
    <div style={{display:"flex", gap:12, alignItems:"flex-start"}}>

      {/* Map panel */}
      <div style={{flex:1, minWidth:0}}>

        {status === "nokey" && (
          <div style={{height:520,borderRadius:12,border:"2px dashed #cbd5e1",background:"#f8fafc",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,padding:32}}>
            <div style={{fontSize:52}}>🗺️</div>
            <div style={{fontSize:18,fontWeight:800,color:"#0f172a"}}>Google Maps Ready to Connect</div>
            <div style={{fontSize:13,color:"#64748b",textAlign:"center",maxWidth:380,lineHeight:1.7}}>
              Set your API key in <code style={{background:"#e2e8f0",padding:"2px 6px",borderRadius:4,fontSize:12}}>App.jsx</code> to enable live maps with real routes, satellite view, and address autocomplete on new jobs.
            </div>
            <div style={{background:"#0f172a",borderRadius:8,padding:"12px 20px",fontSize:12,color:"#94a3b8",fontFamily:"monospace"}}>
              const GMAPS_KEY = "<span style={{color:"#fbbf24"}}>YOUR_KEY_HERE</span>";
            </div>
            <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer"
              style={{background:"#2563eb",color:"#fff",borderRadius:8,padding:"10px 24px",fontSize:13,fontWeight:700,textDecoration:"none"}}>
              Get API Key →
            </a>
            <div style={{fontSize:11,color:"#94a3b8",textAlign:"center"}}>
              Enable: <strong>Maps JavaScript API</strong> and <strong>Places API</strong>
            </div>
          </div>
        )}

        {status === "loading" && (
          <div style={{height:520,borderRadius:12,border:"1px solid #e2e8f0",background:"#f8fafc",display:"flex",alignItems:"center",justifyContent:"center",gap:12,color:"#64748b",fontSize:14}}>
            <div style={{width:22,height:22,border:"3px solid #e2e8f0",borderTopColor:"#2563eb",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
            Loading Google Maps…
          </div>
        )}

        {status === "error" && (
          <div style={{height:520,borderRadius:12,border:"1px solid #fecaca",background:"#fef2f2",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10}}>
            <div style={{fontSize:36}}>⚠️</div>
            <div style={{fontSize:14,fontWeight:700,color:"#dc2626"}}>Map failed to load</div>
            <div style={{fontSize:12,color:"#ef4444",textAlign:"center",maxWidth:300}}>Check your API key is valid and Maps JavaScript API + Places API are enabled in Google Cloud Console.</div>
          </div>
        )}

        {/* The map div — always rendered once ready so the ref is stable */}
        <div ref={mapDivRef} style={{
          width:"100%", height:520,
          borderRadius:12, border:"1px solid #e2e8f0",
          display: status === "ready" ? "block" : "none",
        }}/>
      </div>

      {/* Side panel */}
      <div style={{width:200,flexShrink:0,display:"flex",flexDirection:"column",gap:8,maxHeight:520,overflowY:"auto"}}>
        <div style={{fontSize:10,fontWeight:800,color:"#64748b",textTransform:"uppercase",letterSpacing:1}}>Today's Routes</div>

        {/* Show Zones toggle */}
        <button onClick={()=>setShowZones(z=>!z)}
          style={{background:showZones?"#0ea5e9":"#f1f5f9",color:showZones?"#fff":"#64748b",border:"none",borderRadius:7,padding:"6px 10px",fontSize:11,fontWeight:700,cursor:"pointer",textAlign:"left",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6,transition:"all 0.15s"}}>
          <span>🗺️</span> {showZones?"Zones ON":"Show Zones"}
        </button>

        {techRoutes.map(({tech, color, stops}) => (
          <div key={tech}
            style={{background: hovTech===tech ? "#fff" : "#f8fafc", border:`2px solid ${hovTech===tech ? color : color+"33"}`, borderRadius:10, padding:"10px 11px", transition:"border-color 0.15s, background 0.15s", boxShadow: hovTech===tech ? `0 2px 12px ${color}44` : "none"}}
            onMouseEnter={()=>setHovTech(tech)} onMouseLeave={()=>setHovTech(null)}>
            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:7}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:color,flexShrink:0,boxShadow:`0 0 6px ${color}`}}/>
              <span style={{fontWeight:700,fontSize:12,color:"#0f172a",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tech.split(" ")[0]}</span>
              <span style={{background:color,color:"#fff",borderRadius:99,fontSize:10,fontWeight:800,padding:"1px 7px"}}>{stops.length}</span>
            </div>
            {stops.map((j,i) => {
              const techStaff = fieldStaff.find(f=>f.name===tech);
              const coords = j.coords;
              const outOfZone = showZones && techStaff?.zone && coords && status==="ready"
                ? (() => {
                    try {
                      const poly = new window.google.maps.Polygon({paths: techStaff.zone});
                      return window.google.maps.geometry?.poly
                        ? !window.google.maps.geometry.poly.containsLocation(new window.google.maps.LatLng(coords.lat,coords.lng), poly)
                        : false;
                    } catch { return false; }
                  })()
                : false;
              return (
              <div key={j.id}
                style={{display:"flex",gap:6,alignItems:"flex-start",padding:"5px 4px",borderTop:i>0?"1px solid #e2e8f0":"none",cursor:"pointer",borderRadius:6,background: outOfZone ? "#fff7ed" : hovJob===j.id ? color+"18" : "transparent",transition:"background 0.1s", border: outOfZone ? "1px solid #fed7aa" : "none"}}
                onMouseEnter={()=>setHovJob(j.id)} onMouseLeave={()=>setHovJob(null)}
                onClick={()=>onOpen(j)}>
                <div style={{width:16,height:16,borderRadius:"50%",background:color,color:"#fff",fontSize:8,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>{i+1}</div>
                <div style={{minWidth:0,flex:1}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{(j.address||"").split(",")[0]}</div>
                  <div style={{fontSize:9,color:"#94a3b8"}}>{j.scheduledTime||"TBD"} · {j.durationHrs||1}h · {j.ref}</div>
                </div>
                {outOfZone && <span title="Outside assigned zone" style={{fontSize:13,flexShrink:0}}>⚠️</span>}
              </div>
            );})}
          </div>
        ))}

        {techRoutes.length === 0 && <div style={{color:"#94a3b8",fontSize:12,padding:12}}>No open jobs</div>}

        <div style={{padding:"10px 11px",background:"#f8fafc",borderRadius:10,border:"1px solid #e2e8f0",flexShrink:0}}>
          <div style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Technicians</div>
          {allTechNames.map((t,i) => (
            <div key={t} style={{display:"flex",alignItems:"center",gap:7,marginBottom:4,fontSize:11,color:"#64748b"}}>
              <span style={{width:9,height:9,borderRadius:"50%",background:TECH_COLORS[i%TECH_COLORS.length],display:"inline-block",flexShrink:0}}/>
              {t}
            </div>
          ))}
        </div>
        <div style={{padding:"10px 11px",background:"#f8fafc",borderRadius:10,border:"1px solid #e2e8f0",flexShrink:0}}>
          <div style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Pin Colours</div>
          {[
            {color:JOB_PIN_COMPLETE, label:"Completed / Invoiced"},
            {color:JOB_PIN_VISITED,  label:"Visited, not complete"},
            {color:"#94a3b8",        label:"Not yet visited"},
          ].map(({color,label}) => (
            <div key={label} style={{display:"flex",alignItems:"center",gap:7,marginBottom:5,fontSize:11,color:"#64748b"}}>
              <span style={{width:9,height:9,borderRadius:"50%",background:color,display:"inline-block",flexShrink:0}}/>
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


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

const calcMins = (date, arrivalTime, departureTime) => {
  if(!date || !arrivalTime || !departureTime) return null;
  const arr = new Date(`${date}T${arrivalTime}`);
  const dep = new Date(`${date}T${departureTime}`);
  const diff = dep - arr;
  return diff > 0 ? Math.round(diff / 60000) : null;
};
const fmtDuration = mins => {
  if(!mins) return null;
  if(mins < 60) return `${mins}m`;
  return `${Math.floor(mins/60)}h ${mins%60>0?mins%60+"m":""}`.trim();
};

function VisitsSection({job, onUpdate, fieldStaff}) {
  const visits = job.visits || [];
  const [adding, setAdding] = useState(false);
  const [editIdx, setEditIdx] = useState(null);

  const today = new Date().toISOString().split("T")[0];

  const emptyForm = () => ({
    date: today,
    outcome: "",
    notes: "",
    techs: [], // [{techName, arrival, departure}]
  });
  const [form, setForm] = useState(emptyForm());

  const maxVisits = 5;
  const visitLabels = ["1st","2nd","3rd","4th","5th"];
  const outcomeColor = o => o==="Completed"?"green":o==="Parts Needed"?"orange":o==="Recall Required"?"red":o==="No Access"?"red":o==="Quote Required"?"blue":"gray";

  const activeTechs = fieldStaff.filter(f=>f.status==="Active");

  const nowTime = () => { const d=new Date(); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; };

  const toggleTech = name => {
    const exists = form.techs.find(t=>t.techName===name);
    if(exists) {
      setForm({...form, techs: form.techs.filter(t=>t.techName!==name)});
    } else {
      // Auto clock-in with current time
      setForm({...form, techs: [...form.techs, {techName:name, arrivalTime:nowTime(), departureTime:"", durationHrs:""}]});
    }
  };

  const clockOut = name => {
    const t = nowTime();
    setForm({...form, techs: form.techs.map(r => r.techName===name ? {...r, departureTime:t, durationHrs:""} : r)});
  };

  const setDuration = (name, hrs) => {
    // departure = arrival + hrs
    setForm({...form, techs: form.techs.map(r => {
      if(r.techName!==name) return r;
      const dep = (() => {
        if(!r.arrivalTime || !hrs) return "";
        const [h,m] = r.arrivalTime.split(":").map(Number);
        const totalMins = h*60 + m + Math.round(parseFloat(hrs)*60);
        return `${String(Math.floor(totalMins/60)%24).padStart(2,"0")}:${String(totalMins%60).padStart(2,"0")}`;
      })();
      return {...r, durationHrs:hrs, departureTime:dep};
    })});
  };

  const updateTechTime = (name, field, val) => {
    setForm({...form, techs: form.techs.map(t=>t.techName===name ? {...t, [field]:val} : t)});
  };

  const openAdd = () => { setForm(emptyForm()); setEditIdx(null); setAdding(true); };
  const openEdit = i => { setForm({...visits[i], techs: visits[i].techs||[]}); setEditIdx(i); setAdding(true); };

  const save = () => {
    if(!form.date || form.techs.length===0) return;
    const visitId = uid();
    const entry = {...form, id: editIdx!==null ? visits[editIdx].id : visitId};
    let updatedVisits = editIdx!==null
      ? visits.map((v,i)=>i===editIdx?entry:v)
      : [...visits, entry];

    // Auto-log diary entry for new visits only
    let updatedDiary = job.diary || [];
    if(editIdx === null) {
      const label = `${visitLabels[visits.length]||""}  Visit`;
      const techSummary = form.techs.map(t=>{
        const mins = calcMins(form.date, t.arrivalTime, t.departureTime);
        return `${t.techName}${mins?` (${fmtDuration(mins)})` : ""}`;
      }).join(", ");
      const diaryEntry = {
        id: uid(), type:"visit",
        ts: new Date(`${form.date}T09:00:00`).toISOString(),
        contact: form.techs.map(t=>t.techName).join(", "),
        subject: `${label} — ${form.outcome||"Logged"}`,
        notes: [techSummary, form.notes].filter(Boolean).join("\n"),
        direction:"outbound", files:[], visitId, source:"manual",
      };
      updatedDiary = [diaryEntry, ...updatedDiary];
    }
    onUpdate({...job, visits:updatedVisits, diary:updatedDiary});
    setAdding(false);
  };

  const remove = i => onUpdate({...job, visits:visits.filter((_,vi)=>vi!==i)});

  const iSel = {width:"100%",background:"#fff",border:`1px solid ${C.border}`,borderRadius:7,padding:"6px 10px",color:C.text,fontSize:12,fontFamily:"inherit",boxSizing:"border-box"};

  // Total hours per tech across all visits — for KPI summary
  const techTotals = {};
  visits.forEach(v=>(v.techs||[]).forEach(t=>{
    const mins = calcMins(v.date, t.arrivalTime, t.departureTime);
    if(mins) techTotals[t.techName] = (techTotals[t.techName]||0) + mins;
  }));

  return (
    <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 14px",marginBottom:10}}>
      <SectionHead title="🔧 Site Visits" count={visits.length}
        action={visits.length < maxVisits ? {label:"+ Add Visit", fn:openAdd} : null}/>

      {/* KPI summary bar */}
      {Object.keys(techTotals).length>0 && (
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10,padding:"8px 10px",background:"#f8fafc",borderRadius:8,border:`1px solid ${C.border}`}}>
          <span style={{fontSize:10,color:C.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,alignSelf:"center"}}>Total Hours:</span>
          {Object.entries(techTotals).map(([name,mins])=>(
            <div key={name} style={{background:"#eff6ff",border:`1px solid #bae6fd`,borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700,color:C.accent}}>
              {name.split(" ")[0]}: {fmtDuration(mins)}
            </div>
          ))}
        </div>
      )}

      {visits.length===0&&!adding&&<p style={{color:C.muted,fontSize:12,margin:"4px 0 8px"}}>No visits recorded yet.</p>}

      {/* Visit list */}
      {visits.map((v,i)=>(
        <div key={v.id} style={{padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
            <div style={{background:"#eff6ff",color:C.accent,borderRadius:6,padding:"3px 8px",fontSize:10,fontWeight:800,whiteSpace:"nowrap",flexShrink:0,marginTop:2}}>
              {visitLabels[i]||`#${i+1}`} Visit
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:4}}>
                <span style={{color:C.sub,fontSize:11}}>{fmtDate(v.date)}</span>
                {v.outcome&&<Badge label={v.outcome} color={outcomeColor(v.outcome)}/>}
              </div>
              {/* Per-tech time rows */}
              {(v.techs||[]).map(t=>{
                const mins = calcMins(v.date, t.arrivalTime, t.departureTime);
                return(
                  <div key={t.techName} style={{display:"flex",gap:8,alignItems:"center",marginBottom:3,flexWrap:"wrap"}}>
                    <span style={{fontSize:12,fontWeight:700,color:C.text,minWidth:90}}>{t.techName}</span>
                    <span style={{fontSize:11,color:C.sub}}>{t.arrivalTime||""} → {t.departureTime||""}</span>
                    {mins&&<span style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:99,padding:"1px 7px",fontSize:11,fontWeight:700,color:C.green}}>{fmtDuration(mins)}</span>}
                  </div>
                );
              })}
              {v.notes&&<div style={{color:C.sub,fontSize:11,marginTop:3,lineHeight:1.4}}>{v.notes}</div>}
            </div>
            <button onClick={()=>openEdit(i)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:13,padding:"2px 4px",fontFamily:"inherit"}}>✎</button>
            <button onClick={()=>remove(i)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:14,padding:"2px 4px",fontFamily:"inherit"}}>×</button>
          </div>
        </div>
      ))}

      {/* Add/edit form */}
      {adding&&(
        <div style={{background:C.raised,borderRadius:10,padding:"12px",marginTop:10,border:`1px solid ${C.border}`}}>
          <div style={{fontWeight:700,fontSize:12,color:C.text,marginBottom:10}}>
            {editIdx!==null?`Edit ${visitLabels[editIdx]||""} Visit`:`Log ${visitLabels[visits.length]||""} Visit`}
          </div>

          {/* Date + Outcome */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
            <div>
              <label style={{display:"block",color:C.sub,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Date *</label>
              <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} style={iSel}/>
            </div>
            <div>
              <label style={{display:"block",color:C.sub,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Outcome</label>
              <select value={form.outcome} onChange={e=>setForm({...form,outcome:e.target.value})} style={iSel}>
                <option value="">— Select —</option>
                {VISIT_OUTCOMES.map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* Tech selector */}
          <div style={{marginBottom:10}}>
            <label style={{display:"block",color:C.sub,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Technicians * (select all who attended)</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
              {activeTechs.map(f=>{
                const selected = form.techs.find(t=>t.techName===f.name);
                return(
                  <button key={f.id} onClick={()=>toggleTech(f.name)}
                    style={{padding:"5px 12px",borderRadius:99,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                      border:`1.5px solid ${selected?C.accent:C.border}`,
                      background:selected?"#eff6ff":"#fff",
                      color:selected?C.accent:C.sub}}>
                    {selected?"✓ ":""}{f.name}
                  </button>
                );
              })}
            </div>

            {/* Per-tech clock-in/out */}
            {form.techs.length>0&&(
              <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:8,overflow:"hidden"}}>
                {form.techs.map((t,i)=>{
                  const mins = calcMins(form.date, t.arrivalTime, t.departureTime);
                  return(
                    <div key={t.techName} style={{padding:"10px 12px",borderBottom:i<form.techs.length-1?`1px solid ${C.border}`:"none"}}>
                      {/* Tech name + duration badge */}
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                        <span style={{fontSize:13,fontWeight:700,color:C.text}}>{t.techName}</span>
                        {mins
                          ? <span style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:99,padding:"2px 10px",fontSize:12,fontWeight:800,color:C.green}}>{fmtDuration(mins)}</span>
                          : <span style={{color:C.muted,fontSize:11}}>—</span>}
                      </div>
                      {/* Clock in row */}
                      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}>
                        <span style={{fontSize:11,color:C.sub,width:60,flexShrink:0}}>Clocked in</span>
                        <input type="time" value={t.arrivalTime||""} onChange={e=>updateTechTime(t.techName,"arrivalTime",e.target.value)}
                          style={{flex:1,background:C.raised,border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 8px",color:C.text,fontSize:12,fontFamily:"inherit"}}/>
                        <button onClick={()=>updateTechTime(t.techName,"arrivalTime", (() => { const d=new Date(); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; })())}
                          style={{background:C.accent,color:"#fff",border:"none",borderRadius:6,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
                          ⏱ Now
                        </button>
                      </div>
                      {/* Clock out OR duration */}
                      <div style={{display:"flex",gap:8,alignItems:"center"}}>
                        <span style={{fontSize:11,color:C.sub,width:60,flexShrink:0}}>Duration</span>
                        <input type="number" min="0.5" max="24" step="0.5"
                          value={t.durationHrs||""} onChange={e=>setDuration(t.techName,e.target.value)}
                          placeholder="hrs e.g. 2.5"
                          style={{flex:1,background:C.raised,border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 8px",color:C.text,fontSize:12,fontFamily:"inherit"}}/>
                        <button onClick={()=>clockOut(t.techName)}
                          style={{background:"#dc2626",color:"#fff",border:"none",borderRadius:6,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
                          🔴 Clock Out
                        </button>
                      </div>
                      {t.departureTime&&<div style={{marginTop:4,fontSize:11,color:C.sub}}>Out: {t.departureTime}</div>}
                    </div>
                  );
                })}
              </div>
            )}
            {form.techs.length===0&&<p style={{color:C.muted,fontSize:11,margin:"4px 0"}}>Select at least one technician above.</p>}
          </div>

          {/* Notes */}
          <div style={{marginBottom:10}}>
            <label style={{display:"block",color:C.sub,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Notes</label>
            <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={2}
              placeholder="Parts used, issues found, access notes…" style={{...iSel,resize:"vertical"}}/>
          </div>

          <div style={{display:"flex",gap:8}}>
            <Btn label="Save Visit" onClick={save} small/>
            <button onClick={()=>setAdding(false)} style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:7,padding:"5px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
          </div>
        </div>
      )}

      {visits.length>=maxVisits&&!adding&&(
        <div style={{color:C.muted,fontSize:11,marginTop:8,textAlign:"center"}}>Max 5 visits · consider a recall job</div>
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
/* ═══════════════════════════════════════════
   JOB QUOTES SECTION — tab inside JobDrawer
═══════════════════════════════════════════ */
function JobQuotesSection({job, quotes, setQuotes}) {
  const [view, setView] = useState("list"); // "list" | "new" | "detail"
  const [sel, setSel] = useState(null);
  const [form, setForm] = useState(null);
  const {invItems=[]} = job.__invItems || {};

  const jobQuotes = quotes.filter(q => q.jobRef === job.ref);
  const statusCol = s => s==="Accepted"?"green":s==="Sent"?"blue":s==="Draft"?"gray":s==="Declined"?"red":"gray";

  const emptyForm = () => ({
    ref: nextQuoRef(),
    jobRef: job.ref,
    client: job.companyName || "",
    contact: job.agentName || "",
    date: new Date().toISOString().slice(0,10),
    expiry: new Date(Date.now()+30*86400000).toISOString().slice(0,10),
    status: "Draft",
    items: [],
    total: 0,
  });

  const openNew = () => { setForm(emptyForm()); setView("new"); };
  const openDetail = q => { setSel(q); setView("detail"); };
  const backToList = () => { setView("list"); setSel(null); setForm(null); };

  // ── Line item helpers ──
  const addLine = () => setForm(f => ({...f, items:[...f.items, {desc:"",qty:1,unit:"each",rate:0,amount:0}]}));
  const updateLine = (i, field, val) => setForm(f => {
    const items = f.items.map((ln,idx) => {
      if(idx!==i) return ln;
      const updated = {...ln, [field]: field==="qty"||field==="rate" ? Number(val)||0 : val};
      updated.amount = Math.round(updated.qty * updated.rate * 100) / 100;
      return updated;
    });
    return {...f, items, total: Math.round(items.reduce((s,l)=>s+l.amount,0)*100)/100};
  });
  const removeLine = i => setForm(f => {
    const items = f.items.filter((_,idx)=>idx!==i);
    return {...f, items, total: Math.round(items.reduce((s,l)=>s+l.amount,0)*100)/100};
  });

  const saveQuote = () => {
    if(!form.items.length) return;
    setQuotes(prev => {
      const exists = prev.find(q=>q.ref===form.ref);
      return exists ? prev.map(q=>q.ref===form.ref?form:q) : [...prev, {...form, id:`q${Date.now()}`}];
    });
    backToList();
  };

  const updateStatus = (q, newStatus) => {
    setQuotes(prev => prev.map(x => x.id===q.id ? {...x, status:newStatus} : x));
    setSel(s => s?.id===q.id ? {...s, status:newStatus} : s);
  };

  const inputStyle = {width:"100%",background:"#fff",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 10px",color:C.text,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"};

  // ── DETAIL VIEW ──
  if(view==="detail" && sel) {
    const live = quotes.find(q=>q.id===sel.id) || sel;
    return (
      <div>
        <button onClick={backToList} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:7,padding:"5px 10px",cursor:"pointer",fontSize:12,color:C.sub,fontFamily:"inherit",marginBottom:14}}>← Back</button>
        <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"14px",marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
            <div>
              <div style={{color:C.accent,fontWeight:800,fontSize:13}}>{live.ref}</div>
              <div style={{color:C.text,fontWeight:800,fontSize:16,marginTop:2}}>{live.client}</div>
              <div style={{color:C.sub,fontSize:12,marginTop:2}}>Contact: {live.contact}</div>
            </div>
            <Badge label={live.status} color={statusCol(live.status)}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:12}}>
            <div><span style={{color:C.sub,fontWeight:700,textTransform:"uppercase",fontSize:10,letterSpacing:0.5}}>Date</span><div style={{color:C.text,marginTop:2}}>{fmtDate(live.date)}</div></div>
            <div><span style={{color:C.sub,fontWeight:700,textTransform:"uppercase",fontSize:10,letterSpacing:0.5}}>Expires</span><div style={{color:C.text,marginTop:2}}>{fmtDate(live.expiry)}</div></div>
          </div>
        </div>

        {/* Line items */}
        <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"14px",marginBottom:12}}>
          <div style={{fontWeight:700,fontSize:12,color:C.sub,textTransform:"uppercase",letterSpacing:0.5,marginBottom:10}}>Line Items</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr auto auto auto",gap:6,marginBottom:6}}>
            {["Description","Qty","Rate","Amount"].map(h=><span key={h} style={{color:C.muted,fontSize:10,fontWeight:700,textTransform:"uppercase"}}>{h}</span>)}
          </div>
          {live.items.map((item,i)=>(
            <div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto auto auto",gap:6,padding:"7px 0",borderTop:`1px solid ${C.border}`}}>
              <span style={{color:C.text,fontSize:13}}>{item.desc}</span>
              <span style={{color:C.sub,fontSize:13,textAlign:"right"}}>{item.qty} {item.unit}</span>
              <span style={{color:C.sub,fontSize:13,textAlign:"right"}}>{fmtMoney(item.rate)}</span>
              <span style={{color:C.text,fontSize:13,fontWeight:700,textAlign:"right"}}>{fmtMoney(item.amount)}</span>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"flex-end",marginTop:12,paddingTop:10,borderTop:`2px solid ${C.border}`}}>
            <div style={{textAlign:"right"}}>
              <div style={{color:C.sub,fontSize:11,fontWeight:700,textTransform:"uppercase"}}>Total</div>
              <div style={{color:C.text,fontWeight:900,fontSize:20}}>{fmtMoney(live.total)}</div>
            </div>
          </div>
        </div>

        {/* Status actions */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {live.status==="Draft"&&(
            <button onClick={()=>updateStatus(live,"Sent")} style={{background:C.accent,color:"#fff",border:"none",borderRadius:8,padding:"8px 14px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>📤 Mark Sent</button>
          )}
          {live.status==="Sent"&&(<>
            <button onClick={()=>updateStatus(live,"Accepted")} style={{background:C.green,color:"#fff",border:"none",borderRadius:8,padding:"8px 14px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>✅ Approve</button>
            <button onClick={()=>updateStatus(live,"Declined")} style={{background:C.red,color:"#fff",border:"none",borderRadius:8,padding:"8px 14px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>✕ Decline</button>
          </>)}
          {live.status==="Accepted"&&(
            <div style={{background:"#f0fdf4",border:`1px solid #bbf7d0`,borderRadius:8,padding:"8px 14px",fontSize:12,color:"#15803d",fontWeight:700}}>✅ Approved — inventory reserved</div>
          )}
          {live.status==="Declined"&&(
            <button onClick={()=>updateStatus(live,"Draft")} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 14px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",color:C.sub}}>↩ Reopen as Draft</button>
          )}
        </div>
      </div>
    );
  }

  // ── NEW QUOTE FORM ──
  if(view==="new" && form) {
    return (
      <div>
        <button onClick={backToList} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:7,padding:"5px 10px",cursor:"pointer",fontSize:12,color:C.sub,fontFamily:"inherit",marginBottom:14}}>← Cancel</button>
        <div style={{fontWeight:800,fontSize:14,color:C.text,marginBottom:14}}>New Quote · {form.ref}</div>

        <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"14px",marginBottom:12}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div>
              <label style={{display:"block",color:C.sub,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Client</label>
              <input value={form.client} onChange={e=>setForm(f=>({...f,client:e.target.value}))} style={inputStyle} placeholder="Client name"/>
            </div>
            <div>
              <label style={{display:"block",color:C.sub,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Contact</label>
              <input value={form.contact} onChange={e=>setForm(f=>({...f,contact:e.target.value}))} style={inputStyle} placeholder="Contact person"/>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>
              <label style={{display:"block",color:C.sub,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Quote Date</label>
              <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={inputStyle}/>
            </div>
            <div>
              <label style={{display:"block",color:C.sub,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Expiry Date</label>
              <input type="date" value={form.expiry} onChange={e=>setForm(f=>({...f,expiry:e.target.value}))} style={inputStyle}/>
            </div>
          </div>
        </div>

        {/* Line items */}
        <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"14px",marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontWeight:700,fontSize:12,color:C.sub,textTransform:"uppercase",letterSpacing:0.5}}>Line Items</div>
            <button onClick={addLine} style={{background:C.accent,color:"#fff",border:"none",borderRadius:7,padding:"5px 12px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ Add Line</button>
          </div>
          {form.items.length===0&&<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"16px 0"}}>No items yet — add a line</div>}
          {form.items.map((ln,i)=>(
            <div key={i} style={{background:C.raised,borderRadius:10,padding:"10px",marginBottom:8,border:`1px solid ${C.border}`}}>
              <div style={{display:"flex",gap:6,marginBottom:8,alignItems:"flex-start"}}>
                <input value={ln.desc} onChange={e=>updateLine(i,"desc",e.target.value)} placeholder="Description" style={{...inputStyle,flex:1}}/>
                <button onClick={()=>removeLine(i)} style={{background:"none",border:"none",color:C.muted,fontSize:16,cursor:"pointer",flexShrink:0,paddingTop:6}}>✕</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"auto 1fr 1fr auto",gap:6,alignItems:"center"}}>
                <select value={ln.unit} onChange={e=>updateLine(i,"unit",e.target.value)} style={{...inputStyle,width:"auto"}}>
                  {["each","hr","m","m²","set","lot"].map(u=><option key={u}>{u}</option>)}
                </select>
                <div>
                  <label style={{display:"block",color:C.muted,fontSize:10,marginBottom:2}}>Qty</label>
                  <input type="number" min="0" step="0.5" value={ln.qty} onChange={e=>updateLine(i,"qty",e.target.value)} style={inputStyle}/>
                </div>
                <div>
                  <label style={{display:"block",color:C.muted,fontSize:10,marginBottom:2}}>Rate ($)</label>
                  <input type="number" min="0" step="0.01" value={ln.rate} onChange={e=>updateLine(i,"rate",e.target.value)} style={inputStyle}/>
                </div>
                <div style={{textAlign:"right",paddingTop:14}}>
                  <div style={{color:C.text,fontWeight:700,fontSize:13}}>{fmtMoney(ln.amount)}</div>
                </div>
              </div>
            </div>
          ))}
          {form.items.length>0&&(
            <div style={{display:"flex",justifyContent:"flex-end",paddingTop:10,borderTop:`2px solid ${C.border}`,marginTop:4}}>
              <div style={{textAlign:"right"}}>
                <div style={{color:C.sub,fontSize:11,fontWeight:700,textTransform:"uppercase"}}>Total</div>
                <div style={{color:C.text,fontWeight:900,fontSize:20}}>{fmtMoney(form.total)}</div>
              </div>
            </div>
          )}
        </div>

        <button onClick={saveQuote} disabled={!form.items.length}
          style={{width:"100%",background:form.items.length?C.purple:"#e2e8f0",color:form.items.length?"#fff":C.muted,border:"none",borderRadius:10,padding:"12px",fontWeight:800,fontSize:14,cursor:form.items.length?"pointer":"default",fontFamily:"inherit"}}>
          💾 Save Quote
        </button>
      </div>
    );
  }

  // ── LIST VIEW ──
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{color:C.sub,fontSize:12}}>{jobQuotes.length} quote{jobQuotes.length!==1?"s":""} for this job</div>
        <button onClick={openNew} style={{background:C.purple,color:"#fff",border:"none",borderRadius:8,padding:"7px 14px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>+ New Quote</button>
      </div>

      {jobQuotes.length===0&&(
        <div style={{textAlign:"center",padding:"32px 0",color:C.muted}}>
          <div style={{fontSize:32,marginBottom:8}}>📝</div>
          <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>No quotes yet</div>
          <div style={{fontSize:12}}>Create a quote to reserve inventory and send to the client</div>
        </div>
      )}

      {jobQuotes.map(q=>(
        <div key={q.id} onClick={()=>openDetail(q)}
          style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 14px",marginBottom:8,cursor:"pointer",transition:"border-color 0.15s"}}
          onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent}
          onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <span style={{color:C.accent,fontWeight:800,fontSize:12}}>{q.ref}</span>
              <Badge label={q.status} color={statusCol(q.status)}/>
            </div>
            <span style={{color:C.text,fontWeight:900,fontSize:15}}>{fmtMoney(q.total)}</span>
          </div>
          <div style={{color:C.sub,fontSize:12}}>Expires {fmtDate(q.expiry)} · {q.items.length} item{q.items.length!==1?"s":""}</div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   REPORTS PANE — tabbed Diary | Quotes | Reports
   Lives in the right pane of JobDrawer
═══════════════════════════════════════════ */
function ReportsPane({job, onUpdate, onOpenAttachment, reportTemplates, fieldStaff, vendors, emailTemplates, quotes=[], setQuotes}) {
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
                    <img key={ph.id} src={ph.data} alt={ph.name} onClick={()=>{ const allImgs=(job.diary||[]).flatMap(d=>(d.files||[]).filter(x=>x.mime?.startsWith("image/"))); const combined=[...new Map([...allImgs,...(val||[])].map(x=>[x.id,x])).values()]; onOpenAttachment(ph,{},combined); }}
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

  const jobQuotes = quotes.filter(q => q.jobRef === job.ref);

  return (
    <div>
      {/* Tab switcher */}
      <div style={{display:"flex",gap:0,marginBottom:14,background:C.raised,border:`1px solid ${C.border}`,borderRadius:10,padding:3}}>
        {[{id:"diary",icon:"📒",label:"Diary"},{id:"quotes",icon:"📝",label:`Quotes${jobQuotes.length>0?` (${jobQuotes.length})`:""}`},{id:"reports",icon:"📋",label:`Reports${reports.length>0?` (${reports.length})`:""}`}].map(t=>(
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
        <JobDiary job={job} onUpdate={onUpdate} onOpenAttachment={onOpenAttachment} emailTemplates={emailTemplates}/>
      )}

      {activeTab==="quotes"&&(
        <JobQuotesSection job={job} quotes={quotes} setQuotes={setQuotes}/>
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
function JobDrawer({job, onClose, onUpdate, settings, companies, setCompanies, vendors, quotes=[], setQuotes}) {
  const [expanded, setExpanded] = useState(false);
  const {jobStages, jobSubStages, fieldStaff, jobTypes, reportTemplates=DEFAULT_REPORT_TEMPLATES, emailTemplates=DEFAULT_EMAIL_TEMPLATES, fieldForms=DEFAULT_FIELD_FORMS} = settings;
  const [applianceTypes, setApplianceTypes] = useState(DEFAULT_APPLIANCE_TYPES);
  const [workPresets, setWorkPresets] = useState(DEFAULT_WORK_PRESETS);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [newTenant, setNewTenant] = useState({name:"",email:"",phone:""});
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({});
  const [attachment, setAttachment] = useState(null);

  const openAttachment = (file, entry, siblings) => {
    // For images: always browse ALL photos from every diary entry in this job
    const allJobPhotos = (job.diary||[])
      .flatMap(d=>(d.files||[]).filter(f=>f.mime?.startsWith("image/")));
    const sibs = file.mime?.startsWith("image/")
      ? (allJobPhotos.length > 0 ? allJobPhotos : siblings||[file])
      : (siblings||[file]);
    // Ensure the clicked file is in the siblings list
    const sibsWithFile = sibs.find(f=>f.id===file.id) ? sibs : [file,...sibs];
    setAttachment({file, entry, siblings: sibsWithFile});
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
          <ReportsPane job={job} onUpdate={updateJob} onOpenAttachment={openAttachment} reportTemplates={reportTemplates} fieldStaff={fieldStaff} vendors={vendors} emailTemplates={emailTemplates} quotes={quotes} setQuotes={setQuotes}/>
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

function HistoryJobRow({job, js, onOpen}) {
  const [hovered, setHovered] = useState(false);
  const [cardPos, setCardPos] = useState(null);

  const handleMouseEnter = e => { setCardPos(e.currentTarget.getBoundingClientRect()); setHovered(true); };
  const handleMouseLeave = () => setHovered(false);

  const previewTop = cardPos ? Math.min(Math.max(cardPos.top - 30, 80), window.innerHeight - 380) : 200;

  const diary = job.diary || [];
  const visits = job.visits || [];
  const works = job.additionalWorks || [];
  const lastEntry = diary[0];
  const daysOpen = job.closedDate && job.createdDate
    ? Math.round((new Date(job.closedDate) - new Date(job.createdDate)) / 86400000)
    : null;

  return (
    <>
      <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onClick={onOpen}
        style={{background:"#fff",borderBottom:`1px solid ${C.border}`,padding:"14px 20px",
          cursor:"pointer",transition:"background 0.1s",
          background:hovered?"#f8fafc":"#fff"}}>
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
      </div>

      {hovered&&cardPos&&(
        <div onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
          style={{position:"fixed",left:972,right:16,top:82,bottom:16,
            background:"#fff",borderRadius:14,
            boxShadow:"0 8px 32px rgba(0,0,0,0.14)",
            border:`1px solid ${C.border}`,zIndex:999,
            overflow:"hidden",display:"flex",flexDirection:"column",
            animation:"fadeSlideIn 0.15s ease"}}>

          {/* Status bar */}
          <div style={{height:5,background:js==="Open"?"#3b82f6":js==="Recently Closed"?C.green:C.muted,flexShrink:0}}/>

          <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>
            {/* Header */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,paddingBottom:16,borderBottom:`1px solid ${C.border}`}}>
              <div>
                <span style={{color:C.accent,fontWeight:800,fontSize:13,letterSpacing:0.3}}>{job.ref}</span>
                <div style={{color:C.text,fontWeight:800,fontSize:20,marginTop:4,lineHeight:1.3}}>{job.address}</div>
                {job.description&&<div style={{color:C.sub,fontSize:13,marginTop:6,lineHeight:1.5}}>{job.description}</div>}
              </div>
              <Badge label={js} color={statusColor(js)}/>
            </div>

            {/* Key stats */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
              {[
                {icon:"📒",label:"Diary",value:diary.length},
                {icon:"🔧",label:"Visits",value:visits.length},
                {icon:"⚙️",label:"Works",value:works.length},
              ].map(s=>(
                <div key={s.label} style={{background:C.bg,borderRadius:10,padding:"14px",textAlign:"center",border:`1px solid ${C.border}`}}>
                  <div style={{fontSize:22,marginBottom:4}}>{s.icon}</div>
                  <div style={{fontSize:22,fontWeight:800,color:C.text}}>{s.value}</div>
                  <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:0.5,marginTop:2}}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Detail grid */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
              {[
                {icon:"👷",label:"Technician",value:job.tech||"Unassigned"},
                {icon:"🏢",label:"Company",value:job.companyName||"—"},
                {icon:"👤",label:"Agent",value:job.agentName||"—"},
                {icon:"⏱️",label:"Duration",value:daysOpen!==null?`${daysOpen} day${daysOpen!==1?"s":""}`:job.createdDate?`Created ${fmtDate(job.createdDate)}`:"—"},
                {icon:"📅",label:"Created",value:fmtDate(job.createdDate)||"—"},
                {icon:"✅",label:"Closed",value:job.closedDate?fmtDate(job.closedDate):"Still open"},
              ].map(item=>(
                <div key={item.label} style={{background:C.bg,borderRadius:10,padding:"12px 14px",border:`1px solid ${C.border}`}}>
                  <div style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>{item.icon} {item.label}</div>
                  <div style={{color:C.text,fontWeight:700,fontSize:13}}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Tenants */}
            {(job.tenants||[]).length>0&&(
              <div style={{marginBottom:20}}>
                <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:10}}>👥 Tenants</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {(job.tenants||[]).map(t=>(
                    <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#fff",border:`1px solid ${C.border}`,borderRadius:10}}>
                      <div style={{width:32,height:32,borderRadius:"50%",background:"#dcfce7",display:"flex",alignItems:"center",justifyContent:"center",color:"#15803d",fontWeight:800,fontSize:11,flexShrink:0}}>
                        {t.name.split(" ").map(w=>w[0]).join("").slice(0,2)}
                      </div>
                      <div>
                        <div style={{fontWeight:700,fontSize:13,color:C.text}}>{t.name}</div>
                        {t.phone&&<div style={{fontSize:11,color:C.sub,marginTop:1}}>{t.phone}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Last diary entry */}
            {lastEntry&&(
              <div style={{marginBottom:20}}>
                <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:10}}>📒 Last Diary Entry</div>
                <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:10,padding:"14px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                    <div style={{color:C.text,fontSize:13,fontWeight:700}}>{lastEntry.subject||lastEntry.type}</div>
                    <div style={{color:C.muted,fontSize:11,flexShrink:0,marginLeft:8}}>{fmtTs(lastEntry.ts)}</div>
                  </div>
                  {lastEntry.notes&&<div style={{color:C.sub,fontSize:12,lineHeight:1.5}}>{lastEntry.notes}</div>}
                </div>
              </div>
            )}

            {/* Additional works */}
            {works.length>0&&(
              <div>
                <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:10}}>⚙️ Additional Works</div>
                {works.map(w=>(
                  <div key={w.id} style={{display:"flex",gap:10,alignItems:"center",padding:"9px 12px",background:"#fff",border:`1px solid ${C.border}`,borderRadius:9,marginBottom:6}}>
                    <span style={{fontSize:18}}>{workIcon(w.description)}</span>
                    <div style={{fontWeight:600,fontSize:13,color:C.text}}>{w.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sticky CTA */}
          <div style={{padding:"14px 24px",borderTop:`1px solid ${C.border}`,flexShrink:0,background:"#fff"}}>
            <button onClick={e=>{e.stopPropagation();onOpen();}}
              style={{width:"100%",padding:"12px",background:C.accent,
                color:"#fff",border:"none",borderRadius:10,
                fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                boxShadow:`0 2px 8px ${C.accent}44`}}>
              Open Full Job →
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════
   JOB HISTORY
═══════════════════════════════════════════ */
function HistoryTab({settings, companies, setCompanies, vendors, quotes=[], setQuotes}) {
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
      return <HistoryJobRow key={job.id} job={job} js={js} onOpen={()=>setDrawerJob(job)}/>;
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
        quotes={quotes}
        setQuotes={setQuotes}
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
        <AddressAutocomplete value={nj.address} onChange={(addr,coords)=>setNj({...nj,address:addr,...(coords||{})})} placeholder="e.g. 22 Oak St, Parramatta NSW" required/>
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
function QuotesTab({quotes, setQuotes}) {
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
   INVENTORY — Full WMS
═══════════════════════════════════════════ */

/* ── Barcode SVG renderer (Code 128 simplified — alternating bars) ── */
function BarcodeDisplay({value, width=200, height=50}) {
  if(!value) return null;
  // Simple visual barcode from char codes — decorative but scannable with real lib in future
  const bars = value.split("").flatMap(ch => {
    const n = ch.charCodeAt(0) % 16;
    return [1,0,1,0,1,0,1,0].map((b,i)=> b ? ((n>>i&1)?3:1) : ((n>>i&1)?2:1));
  });
  const total = bars.reduce((s,b)=>s+b,0);
  const scale = width / total;
  let x = 0;
  const rects = bars.map((w,i) => {
    const rx = x; x += w*scale;
    return i%2===0 ? <rect key={i} x={rx} y={0} width={w*scale-0.5} height={height-14} fill="#000"/> : null;
  }).filter(Boolean);
  return (
    <svg width={width} height={height} xmlns="http://www.w3.org/2000/svg">
      <rect width={width} height={height} fill="white"/>
      {rects}
      <text x={width/2} y={height-2} textAnchor="middle" fontSize={9} fontFamily="monospace" fill="#000">{value}</text>
    </svg>
  );
}

/* ── Item Add/Edit Modal ── */
function ItemModal({item, suppliers, onSave, onClose}) {
  const isNew = !item?.id;
  const [f, setF] = useState(item || {
    code:"", barcode:"", name:"", description:"", category:"",
    supplierId:"", supplierCode:"", purchasePrice:"", sellPrice:"", markup:"",
    clientMarkups:[], reorderPoint:"", reorderQty:"", status:"active",
    qtyOnHand:{warehouse:0}, priceHistory:[],
  });
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  const calcMarkup = (pp,sp) => pp&&sp ? (((sp-pp)/pp)*100).toFixed(1) : "";
  const calcSell = (pp,mu) => pp&&mu ? (Number(pp)*(1+Number(mu)/100)).toFixed(2) : "";

  return (
    <Modal title={isNew?"Add Stock Item":"Edit Item"} onClose={onClose} wide
      onSave={()=>{
        const id = item?.id || "in"+Date.now();
        const priceH = [...(f.priceHistory||[])];
        if(!isNew && Number(f.purchasePrice) !== item.purchasePrice) {
          priceH.push({date:new Date().toISOString().slice(0,10), price:Number(f.purchasePrice), supplierId:f.supplierId, note:"Updated"});
        }
        if(isNew && f.purchasePrice) priceH.push({date:new Date().toISOString().slice(0,10), price:Number(f.purchasePrice), supplierId:f.supplierId, note:"Initial"});
        onSave({...f, id, purchasePrice:Number(f.purchasePrice), sellPrice:Number(f.sellPrice),
          markup:Number(f.markup), reorderPoint:Number(f.reorderPoint), reorderQty:Number(f.reorderQty),
          priceHistory:priceH,
          qtyOnHand: f.qtyOnHand||{warehouse:0}});
      }}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
        <FF label="Item Code / SKU *" value={f.code} onChange={v=>set("code",v)} placeholder="e.g. RIN-HW25"/>
        <FF label="Barcode" value={f.barcode} onChange={v=>set("barcode",v)} placeholder="e.g. 9312345001001"/>
        <div style={{gridColumn:"1/-1"}}><FF label="Name *" value={f.name} onChange={v=>set("name",v)}/></div>
        <div style={{gridColumn:"1/-1"}}><FF label="Description" value={f.description} onChange={v=>set("description",v)} type="textarea"/></div>
        <FF label="Category" value={f.category} onChange={v=>set("category",v)} placeholder="e.g. Hot Water, HVAC"/>
        <div style={{marginBottom:14}}>
          <label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Supplier</label>
          <select value={f.supplierId} onChange={e=>set("supplierId",e.target.value)}
            style={{width:"100%",background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit"}}>
            <option value="">— Select supplier —</option>
            {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <FF label="Supplier Code" value={f.supplierCode} onChange={v=>set("supplierCode",v)}/>
        <div/>
        <FF label="Purchase Price ($)" value={f.purchasePrice} onChange={v=>{set("purchasePrice",v);set("markup",calcMarkup(v,f.sellPrice));}} type="number" placeholder="0.00"/>
        <FF label="Sell Price ($)" value={f.sellPrice} onChange={v=>{set("sellPrice",v);set("markup",calcMarkup(f.purchasePrice,v));}} type="number" placeholder="0.00"/>
        <div style={{marginBottom:14,gridColumn:"1/-1"}}>
          <label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Markup %</label>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <input type="number" value={f.markup} onChange={e=>{set("markup",e.target.value);set("sellPrice",calcSell(f.purchasePrice,e.target.value));}}
              style={{width:100,background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit"}}/>
            <span style={{fontSize:12,color:C.muted}}>Sell = {fmtMoney(calcSell(f.purchasePrice,f.markup)||0)}</span>
          </div>
        </div>
        <FF label="Reorder Point" value={f.reorderPoint} onChange={v=>set("reorderPoint",v)} type="number" placeholder="e.g. 5"/>
        <FF label="Reorder Qty" value={f.reorderQty} onChange={v=>set("reorderQty",v)} type="number" placeholder="e.g. 20"/>
      </div>
      {f.barcode && <div style={{marginTop:8,padding:12,background:C.raised,borderRadius:10,display:"inline-block"}}><BarcodeDisplay value={f.barcode}/></div>}
    </Modal>
  );
}

/* ── Purchase Order Modal ── */
function POModal({po, items, suppliers, jobs, onSave, onClose}) {
  const isNew = !po?.id;
  const [f, setF] = useState(po || {
    ref: nextPORef(), supplierId:"", supplierName:"", date: new Date().toISOString().slice(0,10),
    status:"draft", jobId:"", lines:[], notes:"",
  });
  const [lineItemId, setLineItemId] = useState("");
  const [lineQty, setLineQty] = useState(1);
  const [lineCost, setLineCost] = useState("");

  const addLine = () => {
    const item = items.find(i=>i.id===lineItemId);
    if(!item) return;
    setF(p=>({...p, lines:[...p.lines, {itemId:item.id,itemCode:item.code,itemName:item.name,qtyOrdered:Number(lineQty),qtyReceived:0,unitCost:Number(lineCost)||item.purchasePrice}]}));
    setLineItemId(""); setLineQty(1); setLineCost("");
  };
  const removeLine = idx => setF(p=>({...p,lines:p.lines.filter((_,i)=>i!==idx)}));
  const total = f.lines.reduce((s,l)=>s+l.qtyOrdered*l.unitCost,0);

  return (
    <Modal title={isNew?"New Purchase Order":"Edit PO"} onClose={onClose} wide
      onSave={()=>{
        const sup = suppliers.find(s=>s.id===f.supplierId);
        onSave({...f, supplierName:sup?.name||f.supplierName||"Unknown", id:po?.id||"po"+Date.now()});
      }}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
        <FF label="PO Reference" value={f.ref} onChange={v=>setF(p=>({...p,ref:v}))}/>
        <FF label="Date" value={f.date} onChange={v=>setF(p=>({...p,date:v}))} type="date"/>
        <div style={{marginBottom:14}}>
          <label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Supplier *</label>
          <select value={f.supplierId} onChange={e=>setF(p=>({...p,supplierId:e.target.value}))}
            style={{width:"100%",background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit"}}>
            <option value="">— Select supplier —</option>
            {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div style={{marginBottom:14}}>
          <label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Linked Job</label>
          <select value={f.jobId} onChange={e=>setF(p=>({...p,jobId:e.target.value}))}
            style={{width:"100%",background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit"}}>
            <option value="">— No job —</option>
            {jobs.map(j=><option key={j.id} value={j.ref}>{j.ref} — {(j.address||"").split(",")[0]}</option>)}
          </select>
        </div>
        <div style={{gridColumn:"1/-1"}}><FF label="Notes" value={f.notes} onChange={v=>setF(p=>({...p,notes:v}))} type="textarea"/></div>
      </div>

      {/* Line items */}
      <div style={{marginTop:4,marginBottom:12}}>
        <div style={{fontWeight:700,fontSize:13,color:C.text,marginBottom:10}}>Line Items</div>
        {f.lines.length>0&&(
          <div style={{marginBottom:10}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr auto auto auto",gap:8,padding:"6px 0",borderBottom:`1px solid ${C.border}`}}>
              {["Item","Qty","Unit Cost",""].map(h=><span key={h} style={{fontSize:11,fontWeight:700,color:C.sub,textTransform:"uppercase"}}>{h}</span>)}
            </div>
            {f.lines.map((l,i)=>(
              <div key={i} style={{display:"grid",gridTemplateColumns:"1fr auto auto auto",gap:8,padding:"8px 0",borderBottom:`1px solid ${C.border}`,alignItems:"center"}}>
                <span style={{fontSize:13,color:C.text}}>{l.itemName} <span style={{color:C.muted,fontSize:11}}>({l.itemCode})</span></span>
                <span style={{fontSize:13,color:C.sub,textAlign:"right"}}>{l.qtyOrdered}</span>
                <span style={{fontSize:13,color:C.sub,textAlign:"right"}}>{fmtMoney(l.unitCost)}</span>
                <button onClick={()=>removeLine(i)} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:16,fontFamily:"inherit"}}>×</button>
              </div>
            ))}
            <div style={{textAlign:"right",marginTop:8,fontWeight:800,color:C.text}}>Total: {fmtMoney(total)}</div>
          </div>
        )}
        {/* Add line row */}
        <div style={{display:"flex",gap:8,alignItems:"flex-end",flexWrap:"wrap",padding:12,background:C.raised,borderRadius:10,border:`1px solid ${C.border}`}}>
          <div style={{flex:2,minWidth:140}}>
            <label style={{display:"block",color:C.sub,fontSize:11,fontWeight:700,marginBottom:4}}>ITEM</label>
            <select value={lineItemId} onChange={e=>{ setLineItemId(e.target.value); const it=items.find(i=>i.id===e.target.value); if(it) setLineCost(it.purchasePrice); }}
              style={{width:"100%",background:"#fff",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 10px",color:C.text,fontSize:13,fontFamily:"inherit"}}>
              <option value="">— Select item —</option>
              {items.map(i=><option key={i.id} value={i.id}>{i.name} ({i.code})</option>)}
            </select>
          </div>
          <div style={{width:70}}>
            <label style={{display:"block",color:C.sub,fontSize:11,fontWeight:700,marginBottom:4}}>QTY</label>
            <input type="number" value={lineQty} onChange={e=>setLineQty(e.target.value)} min={1}
              style={{width:"100%",background:"#fff",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 10px",color:C.text,fontSize:13,fontFamily:"inherit"}}/>
          </div>
          <div style={{width:100}}>
            <label style={{display:"block",color:C.sub,fontSize:11,fontWeight:700,marginBottom:4}}>UNIT COST</label>
            <input type="number" value={lineCost} onChange={e=>setLineCost(e.target.value)}
              style={{width:"100%",background:"#fff",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 10px",color:C.text,fontSize:13,fontFamily:"inherit"}}/>
          </div>
          <Btn label="+ Add" onClick={addLine} small/>
        </div>
      </div>
    </Modal>
  );
}

/* ── Receive Stock Modal ── */
function ReceiveModal({po, onSave, onClose}) {
  const [lines, setLines] = useState(po.lines.map(l=>({...l, receiving: l.qtyOrdered-l.qtyReceived})));
  const updateQty = (i,v) => setLines(ls=>ls.map((l,li)=>li===i?{...l,receiving:Number(v)}:l));
  return (
    <Modal title={`Receive Stock — ${po.ref}`} onClose={onClose}
      onSave={()=>onSave(lines)}>
      <p style={{color:C.sub,fontSize:13,marginBottom:16}}>Enter quantities received for each line. Stock will be added to warehouse and linked jobs updated.</p>
      {lines.map((l,i)=>(
        <div key={i} style={{display:"flex",gap:12,alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:13,color:C.text}}>{l.itemName}</div>
            <div style={{fontSize:11,color:C.muted}}>Ordered: {l.qtyOrdered} · Previously received: {l.qtyReceived}</div>
          </div>
          <div style={{width:90}}>
            <label style={{display:"block",color:C.sub,fontSize:11,fontWeight:700,marginBottom:4}}>RECEIVE NOW</label>
            <input type="number" value={l.receiving} min={0} max={l.qtyOrdered-l.qtyReceived}
              onChange={e=>updateQty(i,e.target.value)}
              style={{width:"100%",background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 10px",fontSize:13,fontFamily:"inherit",color:C.text}}/>
          </div>
        </div>
      ))}
    </Modal>
  );
}

/* ── Ad-Hoc Receive Modal — no PO required ── */
/* ── Item Search Combobox with inline quick-add ── */
function ItemSearchSelect({items, onSelect, onNewItem, placeholder="Search items…"}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({code:"",name:"",category:"",purchasePrice:"",sellPrice:"",barcode:""});
  const wrapRef = useRef(null);

  const filtered = query.length < 1 ? items : items.filter(i=>
    i.name.toLowerCase().includes(query.toLowerCase()) ||
    i.code.toLowerCase().includes(query.toLowerCase()) ||
    (i.barcode||"").includes(query)
  );

  // Close on outside click
  useEffect(()=>{
    const handler = e => { if(wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return ()=>document.removeEventListener("mousedown", handler);
  },[]);

  const pick = (item) => {
    setQuery("");
    setOpen(false);
    setShowNew(false);
    onSelect(item);
  };

  const saveNew = () => {
    if(!newForm.name){ return; }
    const newItem = {
      id: "in"+Date.now(),
      code: newForm.code||"MISC-"+Date.now().toString().slice(-4),
      barcode: newForm.barcode||"",
      name: newForm.name,
      description: "",
      category: newForm.category||"Other",
      supplierId: "", supplierCode: "",
      purchasePrice: Number(newForm.purchasePrice)||0,
      sellPrice: Number(newForm.sellPrice)||0,
      markup: newForm.purchasePrice&&newForm.sellPrice ? (((newForm.sellPrice-newForm.purchasePrice)/newForm.purchasePrice)*100).toFixed(1) : 0,
      clientMarkups: [],
      qtyOnHand: {warehouse:0},
      reorderPoint: 0, reorderQty: 0,
      priceHistory: newForm.purchasePrice ? [{date:new Date().toISOString().slice(0,10),price:Number(newForm.purchasePrice),supplierId:"",note:"Created on receive"}] : [],
      status: "active",
    };
    onNewItem(newItem);
    pick(newItem);
    setNewForm({code:"",name:"",category:"",purchasePrice:"",sellPrice:"",barcode:""});
  };

  return (
    <div ref={wrapRef} style={{position:"relative"}}>
      <input
        value={query}
        onChange={e=>{ setQuery(e.target.value); setOpen(true); setShowNew(false); }}
        onFocus={()=>setOpen(true)}
        placeholder={placeholder}
        style={{width:"100%",background:"#fff",border:`1.5px solid ${open?C.accent:C.border}`,borderRadius:8,padding:"8px 10px",color:C.text,fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none"}}
      />
      {open&&(
        <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:200,background:"#fff",border:`1px solid ${C.border}`,borderRadius:10,boxShadow:"0 8px 30px rgba(0,0,0,0.14)",marginTop:3,maxHeight:240,overflowY:"auto"}}>
          {filtered.length===0&&!showNew&&(
            <div style={{padding:"10px 14px",color:C.muted,fontSize:13}}>No items match "{query}"</div>
          )}
          {filtered.map(item=>(
            <div key={item.id} onMouseDown={()=>pick(item)}
              style={{padding:"9px 14px",cursor:"pointer",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}
              onMouseEnter={e=>e.currentTarget.style.background=C.raised}
              onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
              <div>
                <div style={{fontWeight:600,fontSize:13,color:C.text}}>{item.name}</div>
                <div style={{fontSize:11,color:C.muted,fontFamily:"monospace"}}>{item.code}{item.barcode?" · "+item.barcode:""}</div>
              </div>
              <div style={{fontSize:12,color:C.sub,textAlign:"right",flexShrink:0}}>
                <div>{item.category}</div>
                <div style={{fontWeight:700}}>{fmtMoney(item.purchasePrice)}</div>
              </div>
            </div>
          ))}
          {/* Add new item option */}
          {!showNew&&(
            <div onMouseDown={()=>{ setShowNew(true); }}
              style={{padding:"10px 14px",cursor:"pointer",color:C.accent,fontWeight:700,fontSize:13,display:"flex",alignItems:"center",gap:6,borderTop:filtered.length?`1px solid ${C.border}`:"none"}}
              onMouseEnter={e=>e.currentTarget.style.background=C.raised}
              onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
              + Add "{query||"new item"}" to catalogue
            </div>
          )}
          {/* Inline quick-create form */}
          {showNew&&(
            <div style={{padding:14,borderTop:`1px solid ${C.border}`}} onMouseDown={e=>e.stopPropagation()}>
              <div style={{fontWeight:700,fontSize:12,color:C.accent,marginBottom:10,textTransform:"uppercase",letterSpacing:0.5}}>Quick Add New Item</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 10px"}}>
                <div style={{marginBottom:8}}>
                  <label style={{display:"block",fontSize:10,fontWeight:700,color:C.sub,textTransform:"uppercase",marginBottom:3}}>Name *</label>
                  <input value={newForm.name} onChange={e=>setNewForm(p=>({...p,name:e.target.value}))}
                    placeholder={query||"Item name"}
                    style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:6,padding:"6px 8px",fontSize:12,fontFamily:"inherit",color:C.text,boxSizing:"border-box"}}/>
                </div>
                <div style={{marginBottom:8}}>
                  <label style={{display:"block",fontSize:10,fontWeight:700,color:C.sub,textTransform:"uppercase",marginBottom:3}}>Item Code</label>
                  <input value={newForm.code} onChange={e=>setNewForm(p=>({...p,code:e.target.value}))}
                    placeholder="e.g. RIN-HW25"
                    style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:6,padding:"6px 8px",fontSize:12,fontFamily:"inherit",color:C.text,boxSizing:"border-box"}}/>
                </div>
                <div style={{marginBottom:8}}>
                  <label style={{display:"block",fontSize:10,fontWeight:700,color:C.sub,textTransform:"uppercase",marginBottom:3}}>Category</label>
                  <input value={newForm.category} onChange={e=>setNewForm(p=>({...p,category:e.target.value}))}
                    placeholder="e.g. Hot Water"
                    style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:6,padding:"6px 8px",fontSize:12,fontFamily:"inherit",color:C.text,boxSizing:"border-box"}}/>
                </div>
                <div style={{marginBottom:8}}>
                  <label style={{display:"block",fontSize:10,fontWeight:700,color:C.sub,textTransform:"uppercase",marginBottom:3}}>Barcode</label>
                  <input value={newForm.barcode} onChange={e=>setNewForm(p=>({...p,barcode:e.target.value}))}
                    placeholder="optional"
                    style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:6,padding:"6px 8px",fontSize:12,fontFamily:"inherit",color:C.text,boxSizing:"border-box"}}/>
                </div>
                <div style={{marginBottom:8}}>
                  <label style={{display:"block",fontSize:10,fontWeight:700,color:C.sub,textTransform:"uppercase",marginBottom:3}}>Purchase Price ($)</label>
                  <input type="number" value={newForm.purchasePrice} onChange={e=>setNewForm(p=>({...p,purchasePrice:e.target.value}))}
                    placeholder="0.00"
                    style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:6,padding:"6px 8px",fontSize:12,fontFamily:"inherit",color:C.text,boxSizing:"border-box"}}/>
                </div>
                <div style={{marginBottom:8}}>
                  <label style={{display:"block",fontSize:10,fontWeight:700,color:C.sub,textTransform:"uppercase",marginBottom:3}}>Sell Price ($)</label>
                  <input type="number" value={newForm.sellPrice} onChange={e=>setNewForm(p=>({...p,sellPrice:e.target.value}))}
                    placeholder="0.00"
                    style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:6,padding:"6px 8px",fontSize:12,fontFamily:"inherit",color:C.text,boxSizing:"border-box"}}/>
                </div>
              </div>
              <div style={{display:"flex",gap:8,marginTop:4}}>
                <button onMouseDown={saveNew}
                  style={{background:C.accent,color:"#fff",border:"none",borderRadius:7,padding:"7px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                  ✓ Add to Catalogue &amp; Select
                </button>
                <button onMouseDown={()=>setShowNew(false)}
                  style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:7,padding:"7px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AdHocReceiveModal({items, suppliers, onSave, onClose}) {
  const [supplierId, setSupplierId] = useState("");
  const [supplierFree, setSupplierFree] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [refNote, setRefNote] = useState("");
  const [lines, setLines] = useState([]);
  const [selItem, setSelItem] = useState(null);
  const [selQty, setSelQty] = useState(1);
  const [selPrice, setSelPrice] = useState("");
  const [err, setErr] = useState("");
  const [localItems, setLocalItems] = useState(items); // includes any quick-added items

  // Invoice scan state
  const [scanState, setScanState] = useState("idle"); // idle | scanning | done | error
  const [invoiceImg, setInvoiceImg] = useState(null); // base64 data URL
  const [rawExtracted, setRawExtracted] = useState(null); // parsed JSON from Claude
  const [scanErr, setScanErr] = useState("");
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const selSupplier = suppliers.find(s=>s.id===supplierId);
  const isAdHoc = supplierId === "adhoc";

  /* ── Invoice OCR via Claude vision ── */
  const scanInvoice = async (file) => {
    if(!file) return;
    setScanState("scanning");
    setScanErr("");
    setInvoiceImg(null);

    // Read file as base64
    const base64 = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result.split(",")[1]);
      r.onerror = () => rej(new Error("Read failed"));
      r.readAsDataURL(file);
    });

    // Show preview
    setInvoiceImg("data:image/jpeg;base64," + base64);

    const mediaType = file.type || "image/jpeg";

    // Build item catalogue string for context
    const catalogue = items.map(i=>`${i.code} | ${i.name} | usual cost $${i.purchasePrice}`).join("\n");

    const prompt = `You are an invoice data extractor for a field service management system.

Extract data from this supplier invoice/delivery docket image and return ONLY valid JSON, no markdown, no explanation.

Our stock catalogue (for matching):
${catalogue}

Return this exact JSON structure:
{
  "supplierName": "string or null",
  "invoiceRef": "string or null",
  "invoiceDate": "YYYY-MM-DD or null",
  "lines": [
    {
      "rawDescription": "exact text from invoice",
      "matchedItemCode": "our item code if confident match, else null",
      "matchedItemName": "our item name if matched, else use raw description",
      "qty": number,
      "unitPrice": number or null,
      "lineTotal": number or null
    }
  ]
}

Rules:
- Match invoice line items to our catalogue by description/code similarity. Only set matchedItemCode if confident (>80%).
- qty must always be a positive number. If unclear, use 1.
- unitPrice: extract from invoice. If only line total shown, divide by qty.
- If invoice date found, format as YYYY-MM-DD.
- Return empty lines array if no line items found.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
              { type: "text", text: prompt }
            ]
          }]
        })
      });
      const data = await res.json();
      const text = data.content?.find(b=>b.type==="text")?.text || "";
      const clean = text.replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(clean);
      setRawExtracted(parsed);
      applyExtracted(parsed);
      setScanState("done");
    } catch(e) {
      setScanErr("Could not extract invoice data. Please fill in manually.");
      setScanState("error");
    }
  };

  const applyExtracted = (parsed) => {
    if(!parsed) return;
    if(parsed.supplierName && !supplierId) {
      const matched = suppliers.find(s=>s.name.toLowerCase().includes(parsed.supplierName.toLowerCase())||parsed.supplierName.toLowerCase().includes(s.name.toLowerCase().split(" ")[0]));
      if(matched) setSupplierId(matched.id);
      else { setSupplierId("adhoc"); setSupplierFree(parsed.supplierName); }
    }
    if(parsed.invoiceRef) setRefNote(parsed.invoiceRef);
    if(parsed.invoiceDate) setDate(parsed.invoiceDate);
    if(parsed.lines?.length) {
      const newLines = parsed.lines.map(l => {
        const matchedItem = l.matchedItemCode ? localItems.find(i=>i.code===l.matchedItemCode) : null;
        return {
          itemId: matchedItem?.id || null,
          itemCode: matchedItem?.code || "",
          itemName: matchedItem?.name || l.matchedItemName || l.rawDescription,
          rawDescription: l.rawDescription,
          qty: Number(l.qty)||1,
          unitCost: Number(l.unitPrice)||Number(l.lineTotal/l.qty)||0,
          unmatched: !matchedItem,
        };
      });
      setLines(newLines);
    }
  };

  // Called when user quick-adds a new item via ItemSearchSelect
  const handleNewItem = (newItem) => {
    setLocalItems(prev=>[...prev, newItem]);
    // Also bubble up to parent inventory state via onSave chain — we'll include new items in save
  };

  const addLine = () => {
    if(!selItem){ setErr("Select an item first."); return; }
    if(!selQty||selQty<1){ setErr("Quantity must be at least 1."); return; }
    setErr("");
    setLines(prev=>{
      const ex = prev.findIndex(l=>l.itemId===selItem.id);
      if(ex>=0) return prev.map((l,i)=>i===ex?{...l,qty:l.qty+Number(selQty),unitCost:Number(selPrice)||l.unitCost}:l);
      return [...prev,{itemId:selItem.id,itemCode:selItem.code,itemName:selItem.name,qty:Number(selQty),unitCost:Number(selPrice)||selItem.purchasePrice,unmatched:false}];
    });
    setSelItem(null); setSelQty(1); setSelPrice("");
  };

  const matchLine = (idx, itemId) => {
    const item = localItems.find(i=>i.id===itemId);
    if(!item) return;
    setLines(prev=>prev.map((l,i)=>i===idx?{...l,itemId:item.id,itemCode:item.code,itemName:item.name,unmatched:false}:l));
  };

  const removeLine = idx => setLines(prev=>prev.filter((_,i)=>i!==idx));
  const updateLine = (idx,key,val) => setLines(prev=>prev.map((l,i)=>i===idx?{...l,[key]:key==="qty"||key==="unitCost"?Number(val):val}:l));
  const total = lines.reduce((s,l)=>s+l.qty*l.unitCost,0);

  const handleSave = () => {
    if(!supplierId){ setErr("Please select a supplier."); return; }
    const validLines = lines.filter(l=>l.itemId&&l.qty>0);
    if(validLines.length===0){ setErr("Add at least one matched item."); return; }
    const supplierName = isAdHoc ? (supplierFree||"Online / Ad Hoc") : selSupplier?.name||"";
    // Pass new items back so inventory state gets updated
    const newItems = localItems.filter(li=>!items.find(i=>i.id===li.id));
    onSave({supplierId: isAdHoc?"sup4":supplierId, supplierName, date, refNote, lines:validLines, newItems});
  };

  return (
    <Modal title="📥 Receive Stock" onClose={onClose} wide onSave={handleSave}>

      {/* ── Invoice Scan Banner ── */}
      <div style={{background:"linear-gradient(135deg,#0f172a,#1e3a5f)",borderRadius:12,padding:16,marginBottom:18}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
          <div>
            <div style={{fontWeight:800,fontSize:14,color:"#e2e8f0",marginBottom:4}}>📸 Scan Invoice</div>
            <div style={{fontSize:12,color:"#94a3b8"}}>Take a photo of the delivery invoice — AI will extract items, quantities and prices automatically</div>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {/* Camera capture — mobile */}
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{display:"none"}}
              onChange={e=>e.target.files[0]&&scanInvoice(e.target.files[0])}/>
            <button onClick={()=>cameraInputRef.current?.click()}
              style={{background:"#0ea5e9",color:"#fff",border:"none",borderRadius:8,padding:"9px 16px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>
              📷 Camera
            </button>
            {/* File upload — desktop */}
            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" style={{display:"none"}}
              onChange={e=>e.target.files[0]&&scanInvoice(e.target.files[0])}/>
            <button onClick={()=>fileInputRef.current?.click()}
              style={{background:"rgba(255,255,255,0.12)",color:"#e2e8f0",border:"1px solid rgba(255,255,255,0.2)",borderRadius:8,padding:"9px 16px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>
              📁 Upload Photo
            </button>
          </div>
        </div>

        {/* Scan states */}
        {scanState==="scanning"&&(
          <div style={{marginTop:14,display:"flex",alignItems:"center",gap:10,color:"#94a3b8",fontSize:13}}>
            <div style={{width:18,height:18,border:"2px solid #334155",borderTopColor:"#0ea5e9",borderRadius:"50%",animation:"spin 0.8s linear infinite",flexShrink:0}}/>
            Analysing invoice with AI — extracting items and prices…
          </div>
        )}
        {scanState==="done"&&(
          <div style={{marginTop:12,display:"flex",gap:10,alignItems:"flex-start"}}>
            {invoiceImg&&<img src={invoiceImg} alt="invoice" style={{width:64,height:64,objectFit:"cover",borderRadius:8,border:"2px solid #22c55e",flexShrink:0}}/>}
            <div>
              <div style={{color:"#22c55e",fontWeight:700,fontSize:13}}>✓ Invoice scanned — {lines.length} line{lines.length!==1?"s":""} extracted</div>
              <div style={{color:"#94a3b8",fontSize:12,marginTop:2}}>Review the items below. Unmatched lines are highlighted — link them to a stock item or remove.</div>
              <button onClick={()=>{ setScanState("idle"); setInvoiceImg(null); setRawExtracted(null); }}
                style={{marginTop:6,background:"none",border:"none",color:"#64748b",fontSize:11,cursor:"pointer",fontFamily:"inherit",textDecoration:"underline",padding:0}}>Rescan</button>
            </div>
          </div>
        )}
        {scanState==="error"&&(
          <div style={{marginTop:12,color:"#f87171",fontSize:13,fontWeight:600}}>⚠️ {scanErr}</div>
        )}
      </div>

      {/* Supplier + date */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
        <div style={{marginBottom:14}}>
          <label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Supplier *</label>
          <select value={supplierId} onChange={e=>setSupplierId(e.target.value)}
            style={{width:"100%",background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit"}}>
            <option value="">— Select supplier —</option>
            {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            <option value="adhoc">Online / Ad Hoc (other)</option>
          </select>
        </div>
        <FF label="Date Received" value={date} onChange={setDate} type="date"/>
      </div>
      {isAdHoc&&<FF label="Supplier / Source Name" value={supplierFree} onChange={setSupplierFree} placeholder="e.g. Amazon, eBay seller, local hardware…"/>}
      <FF label="Reference / Invoice #" value={refNote} onChange={setRefNote} placeholder="e.g. INV-8821, delivery docket #…"/>

      {/* ── Lines table (from scan or manual) ── */}
      {lines.length>0&&(
        <div style={{marginBottom:16}}>
          <div style={{fontWeight:700,fontSize:13,color:C.text,marginBottom:8}}>
            Items to Receive
            {lines.some(l=>l.unmatched)&&<span style={{marginLeft:8,background:"#fef3c7",color:"#92400e",borderRadius:99,fontSize:11,fontWeight:700,padding:"2px 8px"}}>⚠️ {lines.filter(l=>l.unmatched).length} unmatched</span>}
          </div>
          <div style={{border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 70px 100px 80px 32px",gap:0,background:C.raised,padding:"8px 12px",borderBottom:`1px solid ${C.border}`}}>
              {["Item","Qty","Unit Price","Total",""].map(h=><span key={h} style={{fontSize:11,fontWeight:700,color:C.sub,textTransform:"uppercase"}}>{h}</span>)}
            </div>
            {lines.map((l,i)=>(
              <div key={i} style={{borderBottom:i<lines.length-1?`1px solid ${C.border}`:"none",background:l.unmatched?"#fffbeb":"#fff"}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 70px 100px 80px 32px",gap:0,padding:"10px 12px",alignItems:"center"}}>
                  <div style={{minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:13,color:l.unmatched?C.orange:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {l.unmatched?"⚠️ ":""}{l.itemName}
                    </div>
                    {l.rawDescription&&l.unmatched&&<div style={{fontSize:10,color:C.muted,marginTop:1}}>Invoice: "{l.rawDescription}"</div>}
                    {l.itemCode&&!l.unmatched&&<div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>{l.itemCode}</div>}
                  </div>
                  <input type="number" min={1} value={l.qty} onChange={e=>updateLine(i,"qty",e.target.value)}
                    style={{width:56,background:C.raised,border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 7px",fontSize:13,fontFamily:"inherit",color:C.text}}/>
                  <input type="number" min={0} step={0.01} value={l.unitCost} onChange={e=>updateLine(i,"unitCost",e.target.value)}
                    style={{width:82,background:C.raised,border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 7px",fontSize:13,fontFamily:"inherit",color:C.text}}/>
                  <span style={{fontWeight:700,fontSize:13,color:C.text}}>{fmtMoney(l.qty*l.unitCost)}</span>
                  <button onClick={()=>removeLine(i)}
                    style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:18,fontFamily:"inherit",lineHeight:1}}>×</button>
                </div>
                {/* Unmatched — show item picker to link */}
                {l.unmatched&&(
                  <div style={{padding:"0 12px 10px",display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{fontSize:11,color:C.orange,fontWeight:700,flexShrink:0}}>Link to stock item:</span>
                    <div style={{flex:1}}>
                      <ItemSearchSelect items={localItems} placeholder="Type to search or add new…"
                        onSelect={item=>matchLine(i,item.id)}
                        onNewItem={newItem=>{ handleNewItem(newItem); matchLine(i,newItem.id); }}/>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"flex-end",padding:"10px 12px",background:C.raised,borderTop:`2px solid ${C.border}`}}>
              <span style={{fontWeight:800,fontSize:14,color:C.text}}>Total: {fmtMoney(total)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Manual add item row ── */}
      <div style={{background:C.raised,border:`1px solid ${C.border}`,borderRadius:10,padding:14,marginBottom:8}}>
        <div style={{fontWeight:700,fontSize:12,color:C.sub,textTransform:"uppercase",letterSpacing:0.5,marginBottom:10}}>Add Item Manually</div>
        <div style={{display:"flex",gap:8,alignItems:"flex-end",flexWrap:"wrap"}}>
          <div style={{flex:2,minWidth:180}}>
            <label style={{display:"block",color:C.sub,fontSize:11,fontWeight:700,marginBottom:4}}>ITEM</label>
            {selItem
              ? <div style={{display:"flex",gap:8,alignItems:"center",background:"#fff",border:`1.5px solid ${C.accent}`,borderRadius:8,padding:"7px 10px"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:13,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{selItem.name}</div>
                    <div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>{selItem.code}</div>
                  </div>
                  <button onClick={()=>{ setSelItem(null); setSelPrice(""); }}
                    style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16,lineHeight:1,flexShrink:0}}>×</button>
                </div>
              : <ItemSearchSelect items={localItems} placeholder="Type to search or add new item…"
                  onSelect={item=>{ setSelItem(item); setSelPrice(item.purchasePrice); }}
                  onNewItem={handleNewItem}/>
            }
          </div>
          <div style={{width:80}}>
            <label style={{display:"block",color:C.sub,fontSize:11,fontWeight:700,marginBottom:4}}>QTY</label>
            <input type="number" min={1} value={selQty} onChange={e=>setSelQty(e.target.value)}
              style={{width:"100%",background:"#fff",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 10px",fontSize:13,fontFamily:"inherit",color:C.text}}/>
          </div>
          <div style={{width:110}}>
            <label style={{display:"block",color:C.sub,fontSize:11,fontWeight:700,marginBottom:4}}>UNIT PRICE ($)</label>
            <input type="number" min={0} step={0.01} value={selPrice} onChange={e=>setSelPrice(e.target.value)} placeholder="0.00"
              style={{width:"100%",background:"#fff",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 10px",fontSize:13,fontFamily:"inherit",color:C.text}}/>
          </div>
          <Btn label="+ Add" onClick={addLine} small/>
        </div>
        {err&&<div style={{color:C.red,fontSize:12,marginTop:8,fontWeight:600}}>⚠️ {err}</div>}
      </div>

      {lines.length===0&&scanState==="idle"&&(
        <div style={{textAlign:"center",padding:"16px 0",color:C.muted,fontSize:13}}>Scan an invoice above or add items manually</div>
      )}
    </Modal>
  );
}

/* ── Transfer Modal ── */
/* shared mini row style for multi-item operation modals */
function OpLineRow({children}) {
  return <div style={{display:"flex",gap:8,alignItems:"flex-end",flexWrap:"wrap",padding:"10px 0",borderBottom:`1px solid #f1f5f9`}}>{children}</div>;
}

function TransferModal({items, fieldStaff, batches, onSave, onClose}) {
  const [lines, setLines] = useState([{selItem:null, batchId:"", qty:1, from:"warehouse", to:""}]);
  const locs = ["warehouse",...fieldStaff.filter(f=>f.status==="Active").map(f=>"van_"+f.id)];
  const locName = l => l==="warehouse" ? "🏠 Warehouse" : "🚐 "+(fieldStaff.find(f=>"van_"+f.id===l)?.name||l);

  const addLine = () => setLines(p=>[...p,{selItem:null,batchId:"",qty:1,from:"warehouse",to:""}]);
  const removeLine = i => setLines(p=>p.filter((_,xi)=>xi!==i));
  const upd = (i,k,v) => setLines(p=>p.map((l,xi)=>xi===i?{...l,[k]:v}:l));

  const batchesFor = (itemId, loc) => batches.filter(b=>b.itemId===itemId&&b.location===loc&&b.qtyRemaining>0);

  return (
    <Modal title="↔ Transfer Stock" onClose={onClose} wide
      onSave={()=>{
        const valid = lines.filter(l=>l.selItem&&l.to&&l.from!==l.to&&l.qty>0);
        if(!valid.length) return;
        valid.forEach(l => onSave({itemId:l.selItem.id, qty:Number(l.qty), from:l.from, to:l.to, batchId:l.batchId||null}));
      }}>
      <p style={{color:C.sub,fontSize:13,marginBottom:14}}>Move stock between locations. Add multiple lines to transfer several items at once.</p>
      {lines.map((l,i)=>(
        <div key={i} style={{background:C.raised,borderRadius:10,padding:12,marginBottom:10,border:`1px solid ${C.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:12,fontWeight:700,color:C.sub}}>LINE {i+1}</span>
            {lines.length>1&&<button onClick={()=>removeLine(i)} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:16,fontFamily:"inherit"}}>× Remove</button>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
            <div style={{marginBottom:10,gridColumn:"1/-1"}}>
              <label style={{display:"block",color:C.sub,fontSize:11,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>Item</label>
              {l.selItem
                ? <div style={{display:"flex",gap:8,alignItems:"center",background:"#fff",border:`1.5px solid ${C.accent}`,borderRadius:8,padding:"7px 10px"}}>
                    <div style={{flex:1}}><div style={{fontWeight:600,fontSize:13}}>{l.selItem.name}</div><div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>{l.selItem.code}</div></div>
                    <button onClick={()=>upd(i,"selItem",null)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16}}>×</button>
                  </div>
                : <ItemSearchSelect items={items} placeholder="Search item…" onSelect={item=>upd(i,"selItem",item)} onNewItem={()=>{}}/>
              }
            </div>
            <div style={{marginBottom:10}}>
              <label style={{display:"block",color:C.sub,fontSize:11,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>From</label>
              <select value={l.from} onChange={e=>{upd(i,"from",e.target.value);upd(i,"batchId","");}}
                style={{width:"100%",background:"#fff",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 10px",fontSize:13,fontFamily:"inherit",color:C.text}}>
                {locs.map(loc=><option key={loc} value={loc}>{locName(loc)}</option>)}
              </select>
              {l.selItem&&<div style={{fontSize:11,color:C.green,marginTop:3,fontWeight:600}}>Available: {l.selItem.qtyOnHand?.[l.from]||0}</div>}
            </div>
            <div style={{marginBottom:10}}>
              <label style={{display:"block",color:C.sub,fontSize:11,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>To</label>
              <select value={l.to} onChange={e=>upd(i,"to",e.target.value)}
                style={{width:"100%",background:"#fff",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 10px",fontSize:13,fontFamily:"inherit",color:C.text}}>
                <option value="">— Select —</option>
                {locs.filter(loc=>loc!==l.from).map(loc=><option key={loc} value={loc}>{locName(loc)}</option>)}
              </select>
            </div>
            {l.selItem&&batchesFor(l.selItem.id,l.from).length>0&&(
              <div style={{marginBottom:10,gridColumn:"1/-1"}}>
                <label style={{display:"block",color:C.sub,fontSize:11,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>Batch (optional — leave blank for FIFO)</label>
                <select value={l.batchId} onChange={e=>upd(i,"batchId",e.target.value)}
                  style={{width:"100%",background:"#fff",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 10px",fontSize:13,fontFamily:"inherit",color:C.text}}>
                  <option value="">Auto (FIFO)</option>
                  {batchesFor(l.selItem.id,l.from).map(b=><option key={b.id} value={b.id}>{b.batchRef} — {b.qtyRemaining} avail @ {fmtMoney(b.unitCost)} · {fmtDate(b.receivedDate)}</option>)}
                </select>
              </div>
            )}
            <div>
              <label style={{display:"block",color:C.sub,fontSize:11,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>Qty</label>
              <input type="number" min={1} value={l.qty} onChange={e=>upd(i,"qty",e.target.value)}
                style={{width:"100%",background:"#fff",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 10px",fontSize:13,fontFamily:"inherit",color:C.text}}/>
            </div>
          </div>
        </div>
      ))}
      <button onClick={addLine} style={{background:"none",border:`1.5px dashed ${C.border}`,borderRadius:10,padding:"10px 0",width:"100%",color:C.sub,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",marginBottom:8}}>
        + Add Another Item
      </button>
    </Modal>
  );
}

/* ── Collect / Scan Modal ── */
function CollectModal({items, batches, fieldStaff, jobs, onSave, onClose}) {
  const [scan, setScan] = useState("");
  const [techId, setTechId] = useState("");
  const [jobRef, setJobRef] = useState("");
  const [collected, setCollected] = useState([]);
  const [err, setErr] = useState("");
  const inputRef = useRef(null);

  const loc = techId ? "van_"+techId : "warehouse";

  const handleScan = (e) => {
    if(e.key !== "Enter") return;
    const code = scan.trim();
    const item = items.find(i=>i.barcode===code||i.code===code);
    if(!item){ setErr("Item not found: "+code); setScan(""); return; }
    const avail = item.qtyOnHand[loc]||0;
    if(avail < 1){ setErr(`${item.name} — none available at ${loc==="warehouse"?"Warehouse":"this van"}`); setScan(""); return; }
    setCollected(c=>{const ex=c.find(x=>x.item.id===item.id); return ex ? c.map(x=>x.item.id===item.id?{...x,qty:x.qty+1}:x) : [...c,{item,qty:1,batchId:""}];});
    setErr(""); setScan("");
    inputRef.current?.focus();
  };

  const addManual = (item) => {
    if(!item) return;
    setCollected(c=>{const ex=c.find(x=>x.item.id===item.id); return ex?c:[ ...c,{item,qty:1,batchId:""}];});
  };

  const batchesFor = (itemId) => batches.filter(b=>b.itemId===itemId&&b.location===loc&&b.qtyRemaining>0);

  return (
    <Modal title="📦 Collect Items" onClose={onClose} wide
      onSave={()=>{ if(collected.length===0) return; onSave({collected, techId, jobRef}); }}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px",marginBottom:12}}>
        <div>
          <label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Technician *</label>
          <select value={techId} onChange={e=>setTechId(e.target.value)}
            style={{width:"100%",background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit"}}>
            <option value="">— Select tech —</option>
            {fieldStaff.filter(f=>f.status==="Active").map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Linked Job</label>
          <select value={jobRef} onChange={e=>setJobRef(e.target.value)}
            style={{width:"100%",background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit"}}>
            <option value="">— Optional —</option>
            {jobs.map(j=><option key={j.id} value={j.ref}>{j.ref}</option>)}
          </select>
        </div>
      </div>

      <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:10,padding:12,marginBottom:12}}>
        <div style={{fontWeight:700,fontSize:12,color:C.green,marginBottom:6}}>🔍 Scan barcode/SKU — press Enter</div>
        <input ref={inputRef} autoFocus value={scan} onChange={e=>setScan(e.target.value)} onKeyDown={handleScan}
          placeholder="Scan barcode or type item code…"
          style={{width:"100%",background:"#fff",border:`2px solid ${C.green}`,borderRadius:8,padding:"10px 14px",color:C.text,fontSize:14,fontFamily:"inherit",boxSizing:"border-box"}}/>
        {err&&<div style={{color:C.red,fontSize:12,marginTop:6,fontWeight:600}}>⚠️ {err}</div>}
      </div>

      <div style={{marginBottom:12}}>
        <label style={{display:"block",color:C.sub,fontSize:11,fontWeight:700,textTransform:"uppercase",marginBottom:5}}>Or search and add manually</label>
        <ItemSearchSelect items={items} placeholder="Search item to add…" onSelect={addManual} onNewItem={()=>{}}/>
      </div>

      {collected.length>0&&(
        <div>
          <div style={{fontWeight:700,fontSize:13,color:C.text,marginBottom:8}}>Items to collect ({collected.length})</div>
          {collected.map((c,i)=>(
            <div key={i} style={{padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:batchesFor(c.item.id).length>0?8:0}}>
                <div>
                  <div style={{fontWeight:600,fontSize:13,color:C.text}}>{c.item.name}</div>
                  <div style={{fontSize:11,color:C.muted}}>{c.item.code} · {c.item.qtyOnHand?.[loc]||0} available</div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <button onClick={()=>setCollected(cl=>cl.map((x,xi)=>xi===i?{...x,qty:Math.max(1,x.qty-1)}:x))}
                    style={{width:26,height:26,borderRadius:6,border:`1px solid ${C.border}`,background:C.raised,cursor:"pointer",fontFamily:"inherit",fontSize:16}}>−</button>
                  <span style={{fontWeight:800,fontSize:15,minWidth:24,textAlign:"center"}}>{c.qty}</span>
                  <button onClick={()=>setCollected(cl=>cl.map((x,xi)=>xi===i?{...x,qty:x.qty+1}:x))}
                    style={{width:26,height:26,borderRadius:6,border:`1px solid ${C.border}`,background:C.raised,cursor:"pointer",fontFamily:"inherit",fontSize:16}}>+</button>
                  <button onClick={()=>setCollected(cl=>cl.filter((_,xi)=>xi!==i))}
                    style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:18,fontFamily:"inherit"}}>×</button>
                </div>
              </div>
              {batchesFor(c.item.id).length>0&&(
                <div>
                  <label style={{display:"block",fontSize:10,fontWeight:700,color:C.sub,textTransform:"uppercase",marginBottom:3}}>Batch (leave blank for FIFO)</label>
                  <select value={c.batchId||""} onChange={e=>setCollected(cl=>cl.map((x,xi)=>xi===i?{...x,batchId:e.target.value}:x))}
                    style={{width:"100%",background:C.raised,border:`1px solid ${C.border}`,borderRadius:6,padding:"6px 10px",fontSize:12,fontFamily:"inherit",color:C.text}}>
                    <option value="">Auto (FIFO)</option>
                    {batchesFor(c.item.id).map(b=><option key={b.id} value={b.id}>{b.batchRef} — {b.qtyRemaining} avail · {fmtMoney(b.unitCost)} · {fmtDate(b.receivedDate)}</option>)}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

/* ── Return Modal ── */
function ReturnModal({items, batches, fieldStaff, jobs, onSave, onClose}) {
  const [lines, setLines] = useState([{selItem:null,batchId:"",qty:1,from:"",jobRef:"",note:""}]);
  const locs = ["warehouse",...fieldStaff.filter(f=>f.status==="Active").map(f=>"van_"+f.id)];
  const locName = l => l==="warehouse" ? "🏠 Warehouse" : "🚐 "+(fieldStaff.find(f=>"van_"+f.id===l)?.name||l);

  const addLine = () => setLines(p=>[...p,{selItem:null,batchId:"",qty:1,from:"",jobRef:"",note:""}]);
  const removeLine = i => setLines(p=>p.filter((_,xi)=>xi!==i));
  const upd = (i,k,v) => setLines(p=>p.map((l,xi)=>xi===i?{...l,[k]:v}:l));

  const batchesFor = (itemId, loc) => batches.filter(b=>b.itemId===itemId&&b.location===loc&&b.qtyRemaining>0);

  return (
    <Modal title="↩ Return Stock to Warehouse" onClose={onClose} wide
      onSave={()=>{
        const valid = lines.filter(l=>l.selItem&&l.from&&l.qty>0);
        if(!valid.length) return;
        valid.forEach(l=>onSave({itemId:l.selItem.id, qty:Number(l.qty), from:l.from, jobRef:l.jobRef, note:l.note, batchId:l.batchId||null}));
      }}>
      <p style={{color:C.sub,fontSize:13,marginBottom:14}}>Return unused items to warehouse. Add multiple lines to return several items at once.</p>
      {lines.map((l,i)=>(
        <div key={i} style={{background:C.raised,borderRadius:10,padding:12,marginBottom:10,border:`1px solid ${C.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:12,fontWeight:700,color:C.sub}}>LINE {i+1}</span>
            {lines.length>1&&<button onClick={()=>removeLine(i)} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:16,fontFamily:"inherit"}}>× Remove</button>}
          </div>
          <div style={{marginBottom:10}}>
            <label style={{display:"block",color:C.sub,fontSize:11,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>Item</label>
            {l.selItem
              ? <div style={{display:"flex",gap:8,alignItems:"center",background:"#fff",border:`1.5px solid ${C.accent}`,borderRadius:8,padding:"7px 10px"}}>
                  <div style={{flex:1}}><div style={{fontWeight:600,fontSize:13}}>{l.selItem.name}</div><div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>{l.selItem.code}</div></div>
                  <button onClick={()=>upd(i,"selItem",null)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16}}>×</button>
                </div>
              : <ItemSearchSelect items={items} placeholder="Search item…" onSelect={item=>upd(i,"selItem",item)} onNewItem={()=>{}}/>
            }
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
            <div style={{marginBottom:10}}>
              <label style={{display:"block",color:C.sub,fontSize:11,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>Return From</label>
              <select value={l.from} onChange={e=>{upd(i,"from",e.target.value);upd(i,"batchId","");}}
                style={{width:"100%",background:"#fff",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 10px",fontSize:13,fontFamily:"inherit",color:C.text}}>
                <option value="">— Select source —</option>
                {locs.map(loc=><option key={loc} value={loc}>{locName(loc)}</option>)}
              </select>
            </div>
            <div style={{marginBottom:10}}>
              <label style={{display:"block",color:C.sub,fontSize:11,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>Qty</label>
              <input type="number" min={1} value={l.qty} onChange={e=>upd(i,"qty",e.target.value)}
                style={{width:"100%",background:"#fff",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 10px",fontSize:13,fontFamily:"inherit",color:C.text}}/>
            </div>
          </div>
          {l.selItem&&l.from&&batchesFor(l.selItem.id,l.from).length>0&&(
            <div style={{marginBottom:10}}>
              <label style={{display:"block",color:C.sub,fontSize:11,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>Batch (optional — leave blank for FIFO)</label>
              <select value={l.batchId||""} onChange={e=>upd(i,"batchId",e.target.value)}
                style={{width:"100%",background:"#fff",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 10px",fontSize:13,fontFamily:"inherit",color:C.text}}>
                <option value="">Auto (FIFO)</option>
                {batchesFor(l.selItem.id,l.from).map(b=><option key={b.id} value={b.id}>{b.batchRef} — {b.qtyRemaining} avail · received {fmtDate(b.receivedDate)}</option>)}
              </select>
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
            <div style={{marginBottom:10}}>
              <label style={{display:"block",color:C.sub,fontSize:11,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>Linked Job</label>
              <select value={l.jobRef} onChange={e=>upd(i,"jobRef",e.target.value)}
                style={{width:"100%",background:"#fff",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 10px",fontSize:13,fontFamily:"inherit",color:C.text}}>
                <option value="">— Optional —</option>
                {jobs.map(j=><option key={j.id} value={j.ref}>{j.ref}</option>)}
              </select>
            </div>
            <div style={{marginBottom:10}}>
              <label style={{display:"block",color:C.sub,fontSize:11,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>Note</label>
              <input value={l.note} onChange={e=>upd(i,"note",e.target.value)} placeholder="Reason…"
                style={{width:"100%",background:"#fff",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 10px",fontSize:13,fontFamily:"inherit",color:C.text}}/>
            </div>
          </div>
        </div>
      ))}
      <button onClick={addLine} style={{background:"none",border:`1.5px dashed ${C.border}`,borderRadius:10,padding:"10px 0",width:"100%",color:C.sub,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
        + Return Another Item
      </button>
    </Modal>
  );
}

/* ── Item Detail View ── */
function ItemDetail({item, suppliers, fieldStaff, invItems, quotes=[], purchaseOrders=[], onBack, onEdit}) {
  const sup = suppliers.find(s=>s.id===item.supplierId);
  const totalQty = Object.values(item.qtyOnHand||{}).reduce((s,v)=>s+(v||0),0);
  const stockStatus = totalQty===0?"red":totalQty<=item.reorderPoint?"orange":"green";
  const locs = [["warehouse","🏠 Warehouse"],...fieldStaff.filter(f=>f.status==="Active").map(f=>["van_"+f.id,"🚐 "+f.name])];
  const av = calcAvailability(item.id, invItems, quotes, purchaseOrders);
  const committedQuotes = quotes.filter(q=>(q.status==="Sent"||q.status==="Accepted")&&q.items.some(l=>l.itemId===item.id));
  return (
    <div>
      <Breadcrumb items={[{label:"Inventory",fn:onBack},{label:item.name}]}/>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:16}}>
        <div style={{flex:2,minWidth:260}}>
          <Card style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div>
                <div style={{color:C.accent,fontWeight:800,fontSize:12,marginBottom:2}}>{item.code}</div>
                <div style={{color:C.text,fontWeight:800,fontSize:18}}>{item.name}</div>
                <div style={{color:C.muted,fontSize:13,marginTop:2}}>{item.description}</div>
              </div>
              <div style={{display:"flex",gap:8,flexShrink:0}}>
                <Badge label={item.category} color="blue"/>
                <Badge label={totalQty===0?"Out of Stock":totalQty<=item.reorderPoint?"Low Stock":"In Stock"} color={stockStatus}/>
              </div>
            </div>
            <Field label="Supplier" value={sup?.name||"—"}/>
            <Field label="Supplier Code" value={item.supplierCode||"—"}/>
            <Field label="Purchase Price" value={fmtMoney(item.purchasePrice)}/>
            <Field label="Sell Price" value={fmtMoney(item.sellPrice)}/>
            <Field label="Markup" value={item.markup+"%"}/>
            <Field label="Reorder Point" value={item.reorderPoint}/>
            <Field label="Reorder Qty" value={item.reorderQty}/>
            <div style={{marginTop:12}}>
              <Btn label="✏️ Edit Item" onClick={onEdit} small outline/>
            </div>
          </Card>

          {/* Price history */}
          {item.priceHistory?.length>0&&(
            <Card style={{marginBottom:12}}>
              <SectionHead title="📈 Price History"/>
              {[...item.priceHistory].reverse().map((h,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<item.priceHistory.length-1?`1px solid ${C.border}`:"none"}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:13,color:C.text}}>{fmtMoney(h.price)}</div>
                    <div style={{fontSize:11,color:C.muted}}>{h.note||"—"}</div>
                  </div>
                  <div style={{fontSize:12,color:C.sub}}>{fmtDate(h.date)}</div>
                </div>
              ))}
            </Card>
          )}

          {/* Client markups */}
          <Card>
            <SectionHead title="💼 Commission Markups"/>
            <p style={{color:C.muted,fontSize:12,marginBottom:10}}>Extra % charged to clients who invoice you a commission</p>
            {item.clientMarkups?.length===0&&<div style={{color:C.muted,fontSize:13}}>No client-specific markups set</div>}
            {item.clientMarkups?.map((cm,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.border}`}}>
                <span style={{fontSize:13,color:C.text}}>{cm.clientId||"All clients"}</span>
                <Badge label={"+"+cm.markupPct+"%"} color="orange"/>
              </div>
            ))}
          </Card>
        </div>

        <div style={{flex:1,minWidth:220}}>
          {/* Availability panel */}
          <Card style={{marginBottom:12}}>
            <SectionHead title="📊 Availability"/>
            {/* Four-number breakdown */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:1,background:C.border,borderRadius:10,overflow:"hidden",marginBottom:12}}>
              {[
                {label:"On Hand", value:av.onHand, color:av.onHand===0?C.red:av.onHand<=item.reorderPoint?C.orange:C.text, tip:"Physical stock across all locations"},
                {label:"On Order", value:av.onOrder, color:av.onOrder>0?C.accent:C.muted, tip:"Open POs not yet received"},
                {label:"Committed", value:av.committed, color:av.committed>0?"#7c3aed":C.muted, tip:"Qty on approved quotes"},
                {label:"Available", value:av.available, color:av.available<0?C.red:av.available===0?C.orange:C.green, tip:"On Hand minus Committed"},
              ].map(({label,value,color,tip})=>(
                <div key={label} style={{background:C.card,padding:"12px 10px",textAlign:"center"}}>
                  <div style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>{label}</div>
                  <div style={{fontSize:32,fontWeight:900,color,lineHeight:1}}>{value}</div>
                  <div style={{fontSize:10,color:C.muted,marginTop:4}}>{tip}</div>
                </div>
              ))}
            </div>

            {/* To Order alert */}
            {av.toOrder>0&&(
              <div style={{background:"#ede9fe",border:"1px solid #c4b5fd",borderRadius:8,padding:"10px 12px",marginBottom:10}}>
                <div style={{fontWeight:800,fontSize:13,color:"#5b21b6",marginBottom:2}}>🛒 Order {av.toOrder} more</div>
                <div style={{fontSize:12,color:"#6d28d9"}}>
                  {av.committed} committed − {av.onHand} on hand − {av.onOrder} on order = {av.toOrder} shortfall
                </div>
              </div>
            )}

            {/* Formula explanation */}
            <div style={{background:C.raised,borderRadius:8,padding:"8px 10px",fontSize:11,color:C.muted,lineHeight:1.6}}>
              <strong style={{color:C.sub}}>Available</strong> = On Hand − Committed<br/>
              <strong style={{color:C.sub}}>To Order</strong> = max(0, Committed − On Hand − On Order)
            </div>
          </Card>

          {/* Lead time for this item */}
          {(()=>{
            const lt = calcLeadTimes(purchaseOrders).byItem[item.id];
            if(!lt||lt.count===0) return null;
            return (
              <Card style={{marginBottom:12}}>
                <SectionHead title="⏱ Avg Lead Time"/>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:1,background:C.border,borderRadius:8,overflow:"hidden",marginBottom:10}}>
                  {[
                    {label:"Average", value:lt.avg+"d", color:lt.avg<=3?C.green:lt.avg<=7?C.orange:C.red},
                    {label:"Fastest", value:lt.min+"d", color:C.green},
                    {label:"Slowest", value:lt.max+"d", color:C.orange},
                  ].map(({label,value,color})=>(
                    <div key={label} style={{background:C.card,padding:"10px 6px",textAlign:"center"}}>
                      <div style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:0.4,marginBottom:3}}>{label}</div>
                      <div style={{fontSize:22,fontWeight:900,color}}>{value}</div>
                    </div>
                  ))}
                </div>
                <div style={{fontSize:11,color:C.muted,marginBottom:6}}>Across {lt.count} received PO{lt.count!==1?"s":""}</div>
                {/* Per-supplier breakdown */}
                {Object.entries(lt.bySupplier).map(([sid,slt])=>(
                  <div key={sid} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderTop:`1px solid ${C.border}`}}>
                    <span style={{fontSize:12,color:C.sub}}>{slt.name}</span>
                    <span style={{fontSize:12,fontWeight:800,color:slt.avg<=3?C.green:slt.avg<=7?C.orange:C.red}}>{slt.avg}d avg ({slt.count} PO{slt.count!==1?"s":""})</span>
                  </div>
                ))}
              </Card>
            );
          })()}

          {/* Stock by location */}
          <Card style={{marginBottom:12}}>
            <SectionHead title="📦 Stock by Location"/>
            {locs.map(([loc,label])=>(
              <div key={loc} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderTop:`1px solid ${C.border}`}}>
                <span style={{fontSize:13,color:C.sub}}>{label}</span>
                <span style={{fontWeight:800,fontSize:16,color:C.text}}>{item.qtyOnHand?.[loc]||0}</span>
              </div>
            ))}
          </Card>

          {/* Committed quotes breakdown */}
          {committedQuotes.length>0&&(
            <Card style={{marginBottom:12}}>
              <SectionHead title="📋 Committed on Quotes"/>
              {committedQuotes.map(q=>{
                const qtyOnQuote = q.items.filter(l=>l.itemId===item.id).reduce((s,l)=>s+(l.qty||0),0);
                return (
                  <div key={q.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:12,color:C.accent}}>{q.ref}</div>
                      <div style={{fontSize:11,color:C.muted}}>{q.client} · <Badge label={q.status} color={q.status==="Accepted"?"green":"blue"}/></div>
                    </div>
                    <span style={{fontWeight:800,fontSize:15,color:"#7c3aed"}}>×{qtyOnQuote}</span>
                  </div>
                );
              })}
            </Card>
          )}

          {/* Barcode */}
          {item.barcode&&(
            <Card>
              <SectionHead title="🔍 Barcode"/>
              <div style={{padding:8,background:C.raised,borderRadius:8,display:"flex",justifyContent:"center"}}>
                <BarcodeDisplay value={item.barcode} width={170} height={55}/>
              </div>
              <div style={{textAlign:"center",marginTop:6,fontSize:11,color:C.muted,fontFamily:"monospace"}}>{item.barcode}</div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main InventoryTab ── */
function InventoryTab({settings, companies, quotes=[]}) {
  const {invItems, setInvItems, invSuppliers, setInvSuppliers, purchaseOrders, setPurchaseOrders, stockMovements, setStockMovements, stockBatches, setStockBatches, fieldStaff} = settings;
  const [invTab, setInvTab] = useState("items");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [selItem, setSelItem] = useState(null);
  const [modal, setModal] = useState(null); // "addItem"|"editItem"|"addPO"|"editPO"|"receive"|"transfer"|"collect"|"return"
  const [modalData, setModalData] = useState(null);

  const jobs = allJobs ? allJobs(companies) : [];
  const openJobs = jobs.filter(j=>j.status==="Open");

  /* ── Helpers ── */
  const totalQty = item => Object.values(item.qtyOnHand||{}).reduce((s,v)=>s+(v||0),0);
  const stockStatus = item => { const t=totalQty(item); return t===0?"red":t<=item.reorderPoint?"orange":"green"; };
  const locName = l => l==="warehouse" ? "Warehouse" : "Van — "+fieldStaff?.find(f=>"van_"+f.id===l)?.name||l;
  const avail = item => calcAvailability(item.id, invItems, quotes, purchaseOrders);

  const cats = ["All",...new Set(invItems.map(i=>i.category))];
  const filtered = invItems.filter(i=>{
    const mc = catFilter==="All"||i.category===catFilter;
    const ms = !search||i.name.toLowerCase().includes(search.toLowerCase())||i.code.toLowerCase().includes(search.toLowerCase())||i.barcode?.includes(search);
    return mc&&ms&&i.status!=="discontinued";
  });

  const lowStock = invItems.filter(i=>totalQty(i)<=i.reorderPoint&&totalQty(i)>0);
  const outOfStock = invItems.filter(i=>totalQty(i)===0);
  const needsOrder = invItems.map(i=>({item:i,...calcAvailability(i.id,invItems,quotes,purchaseOrders)})).filter(x=>x.toOrder>0);
  const totalValue = invItems.reduce((s,i)=>s+totalQty(i)*i.purchasePrice,0);

  /* ── PO status colours ── */
  const poStatusCol = s => s==="received"?"green":s==="sent"?"blue":s==="partial"?"orange":"gray";

  /* ── Save item ── */
  const saveItem = item => {
    setInvItems(prev=> prev.find(i=>i.id===item.id) ? prev.map(i=>i.id===item.id?item:i) : [...prev,item]);
    setModal(null);
    if(selItem?.id===item.id) setSelItem(item);
  };

  /* ── Save PO ── */
  const savePO = po => {
    setPurchaseOrders(prev=> prev.find(p=>p.id===po.id) ? prev.map(p=>p.id===po.id?po:p) : [...prev,po]);
    setModal(null);
  };

  /* ── Receive stock ── */
  /* ── Helpers ── */
  // Deduct qty from batches FIFO for a given item+location, return updated batches + batchIds used
  const deductBatchesFIFO = (batches, itemId, location, qty) => {
    let remaining = qty;
    const usedBatchIds = [];
    const updated = batches.map(b => {
      if(b.itemId !== itemId || b.location !== location || b.qtyRemaining <= 0 || remaining <= 0) return b;
      const take = Math.min(b.qtyRemaining, remaining);
      remaining -= take;
      usedBatchIds.push(b.id);
      return {...b, qtyRemaining: b.qtyRemaining - take};
    });
    return {updated, usedBatchIds};
  };

  const receiveStock = (po, receivedLines) => {
    const now = new Date().toISOString().slice(0,10);
    const newMovements = [];
    const newBatches = [];
    const updatedItems = [...invItems];

    receivedLines.forEach(l => {
      if(!l.receiving||l.receiving<1) return;
      const idx = updatedItems.findIndex(i=>i.id===l.itemId);
      if(idx>=0) {
        updatedItems[idx] = {...updatedItems[idx], qtyOnHand:{...updatedItems[idx].qtyOnHand, warehouse:(updatedItems[idx].qtyOnHand?.warehouse||0)+l.receiving}};
      }
      const btId = nextBtId();
      newBatches.push({id:btId, itemId:l.itemId, batchRef:`${po.ref}-B${newBatches.length+1}`,
        receivedDate:now, supplierId:po.supplierId, supplierName:po.supplierName,
        unitCost:l.unitCost, qtyOriginal:l.receiving, qtyRemaining:l.receiving,
        location:"warehouse", poId:po.id, invoiceRef:""});
      newMovements.push({id:nextMvId(),type:"receive",itemId:l.itemId,qty:l.receiving,fromLocation:null,toLocation:"warehouse",jobId:po.jobId||null,techId:null,poId:po.id,batchId:btId,date:now,note:`${po.ref} received`});
    });

    const allReceived = receivedLines.every(l=>(l.qtyReceived+(l.receiving||0))>=l.qtyOrdered);
    const updatedPO = {...po, status:allReceived?"received":"partial", receivedDate:now,
      lines:po.lines.map(l=>{ const rl=receivedLines.find(r=>r.itemId===l.itemId); return rl?{...l,qtyReceived:l.qtyReceived+(rl.receiving||0)}:l; })};

    setInvItems(updatedItems);
    setStockBatches(prev=>[...prev,...newBatches]);
    setStockMovements(prev=>[...prev,...newMovements]);
    setPurchaseOrders(prev=>prev.map(p=>p.id===po.id?updatedPO:p));
    if(po.jobId && allReceived) alert(`✅ Stock received for PO ${po.ref}. Job ${po.jobId} should now be moved to "Parts Received".`);
    setModal(null);
  };

  /* ── Transfer ── */
  const doTransfer = ({itemId, qty, from, to, batchId}) => {
    const now = new Date().toISOString().slice(0,10);
    let batchIds = [];
    if(batchId) {
      // Specific batch transfer — move batch location
      setStockBatches(prev=>prev.map(b=>{
        if(b.id!==batchId) return b;
        batchIds.push(b.id);
        return {...b, location:to};
      }));
    } else {
      // FIFO across all batches at source location
      const {updated, usedBatchIds} = deductBatchesFIFO(stockBatches, itemId, from, qty);
      batchIds = usedBatchIds;
      // Create new batch at destination
      const btId = nextBtId();
      const srcBatch = stockBatches.find(b=>b.itemId===itemId&&b.location===from&&b.qtyRemaining>0);
      setStockBatches([...updated, {id:btId, itemId, batchRef:`TRF-${now}-${itemId.slice(-3)}`,
        receivedDate:now, supplierId:srcBatch?.supplierId||"", supplierName:srcBatch?.supplierName||"",
        unitCost:srcBatch?.unitCost||0, qtyOriginal:qty, qtyRemaining:qty,
        location:to, poId:null, invoiceRef:""}]);
      batchIds.push(btId);
    }
    setInvItems(prev=>prev.map(i=>{
      if(i.id!==itemId) return i;
      const oh={...i.qtyOnHand};
      oh[from]=Math.max(0,(oh[from]||0)-qty);
      oh[to]=(oh[to]||0)+qty;
      return {...i,qtyOnHand:oh};
    }));
    setStockMovements(prev=>[...prev,{id:nextMvId(),type:"transfer",itemId,qty,fromLocation:from,toLocation:to,jobId:null,techId:null,poId:null,batchId:batchIds[0]||null,date:now,note:"Transfer"}]);
    setModal(null);
  };

  /* ── Collect ── */
  const doCollect = ({collected, techId, jobRef}) => {
    const loc = techId ? "van_"+techId : "warehouse";
    const now = new Date().toISOString().slice(0,10);
    let updatedBatches = [...stockBatches];
    const newMovements = [];

    collected.forEach(c => {
      let batchId = c.batchId || null;
      if(batchId) {
        updatedBatches = updatedBatches.map(b=>b.id===batchId?{...b,qtyRemaining:Math.max(0,b.qtyRemaining-c.qty)}:b);
      } else {
        const {updated, usedBatchIds} = deductBatchesFIFO(updatedBatches, c.item.id, loc, c.qty);
        updatedBatches = updated;
        batchId = usedBatchIds[0]||null;
      }
      newMovements.push({id:nextMvId(),type:"collect",itemId:c.item.id,qty:c.qty,fromLocation:loc,toLocation:null,jobId:jobRef||null,techId:techId||null,poId:null,batchId,date:now,note:"Collected"+(jobRef?" for job "+jobRef:"")});
    });

    setStockBatches(updatedBatches);
    setInvItems(prev=>prev.map(i=>{
      const c=collected.find(x=>x.item.id===i.id); if(!c) return i;
      const oh={...i.qtyOnHand};
      oh[loc]=Math.max(0,(oh[loc]||0)-c.qty);
      return {...i,qtyOnHand:oh};
    }));
    setStockMovements(prev=>[...prev,...newMovements]);
    setModal(null);
  };

  /* ── Return ── */
  const doReturn = ({itemId, qty, from, jobRef, note, batchId}) => {
    const now = new Date().toISOString().slice(0,10);
    let usedBatchId = batchId || null;
    if(batchId) {
      // Return to original batch — restore qty
      setStockBatches(prev=>prev.map(b=>b.id===batchId?{...b,qtyRemaining:b.qtyRemaining+qty,location:"warehouse"}:b));
    } else {
      // Create a return batch
      const btId = nextBtId();
      usedBatchId = btId;
      const srcBatch = stockBatches.find(b=>b.itemId===itemId&&b.location===from&&b.qtyRemaining>0);
      setStockBatches(prev=>[...prev,{id:btId,itemId,batchRef:`RTN-${now}`,receivedDate:now,
        supplierId:srcBatch?.supplierId||"",supplierName:srcBatch?.supplierName||"",
        unitCost:srcBatch?.unitCost||0,qtyOriginal:qty,qtyRemaining:qty,
        location:"warehouse",poId:null,invoiceRef:""}]);
    }
    setInvItems(prev=>prev.map(i=>{
      if(i.id!==itemId) return i;
      const oh={...i.qtyOnHand};
      oh[from]=Math.max(0,(oh[from]||0)-qty);
      oh["warehouse"]=(oh["warehouse"]||0)+qty;
      return {...i,qtyOnHand:oh};
    }));
    setStockMovements(prev=>[...prev,{id:nextMvId(),type:"return",itemId,qty,fromLocation:from,toLocation:"warehouse",jobId:jobRef||null,techId:null,poId:null,batchId:usedBatchId,date:now,note:note||"Return to warehouse"}]);
    setModal(null);
  };

  const doAdHocReceive = ({supplierId, supplierName, date, refNote, lines, newItems=[]}) => {
    const now = date||new Date().toISOString().slice(0,10);
    const newBatches = [];
    const newMovements = [];
    if(newItems.length>0) setInvItems(prev=>[...prev,...newItems]);
    setInvItems(prev=>prev.map(i=>{
      const l=lines.find(l=>l.itemId===i.id); if(!l) return i;
      const oh={...i.qtyOnHand};
      oh["warehouse"]=(oh["warehouse"]||0)+l.qty;
      const priceH=[...(i.priceHistory||[])];
      if(l.unitCost&&l.unitCost!==i.purchasePrice) priceH.push({date:now,price:l.unitCost,supplierId,note:refNote||"Ad-hoc receive"});
      return {...i,qtyOnHand:oh,priceHistory:priceH};
    }));
    lines.forEach((l,li) => {
      const btId = nextBtId();
      newBatches.push({id:btId, itemId:l.itemId,
        batchRef:`RCV-${now.replace(/-/g,"")}-${String(li+1).padStart(2,"0")}`,
        receivedDate:now, supplierId, supplierName,
        unitCost:l.unitCost, qtyOriginal:l.qty, qtyRemaining:l.qty,
        location:"warehouse", poId:null, invoiceRef:refNote||""});
      newMovements.push({id:nextMvId(),type:"receive",itemId:l.itemId,qty:l.qty,
        fromLocation:null,toLocation:"warehouse",jobId:null,techId:null,poId:null,batchId:btId,
        date:now,note:[supplierName,refNote].filter(Boolean).join(" · ")||"Ad-hoc receive"});
    });
    setStockBatches(prev=>[...prev,...newBatches]);
    setStockMovements(prev=>[...prev,...newMovements]);
    setModal(null);
  };

  /* ── Tab sub-nav ── */
  const leadTimes = calcLeadTimes(purchaseOrders);
  const tabs = [{id:"items",label:"📦 Items"},{id:"purchase-orders",label:"🛒 Purchase Orders"},{id:"movements",label:"📋 Movements"},{id:"suppliers",label:"🏭 Suppliers"}];

  if(selItem) return (
    <ItemDetail item={selItem} suppliers={invSuppliers} fieldStaff={fieldStaff||[]}
      invItems={invItems} quotes={quotes} purchaseOrders={purchaseOrders}
      onBack={()=>setSelItem(null)} onEdit={()=>setModal("editItem")}/>
  );

  return (
    <div>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,flexWrap:"wrap",gap:10}}>
        <div>
          <h2 style={{fontSize:18,fontWeight:800,color:C.text}}>Inventory</h2>
          <p style={{color:C.sub,fontSize:12,marginTop:2}}>{invItems.length} items · {fmtMoney(totalValue)} stock value</p>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <Btn label="📥 Receive Stock" onClick={()=>setModal("adhocReceive")} color={C.accent} small/>
          <Btn label="📦 Collect" onClick={()=>setModal("collect")} color={C.green} small/>
          <Btn label="↔ Transfer" onClick={()=>setModal("transfer")} color={C.purple} small/>
          <Btn label="↩ Return" onClick={()=>setModal("return")} color={C.orange} small/>
          <Btn label="+ Add Item" onClick={()=>{setModalData(null);setModal("addItem");}} small/>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
        <StatCard label="Total Items" value={invItems.length} icon="📦" color={C.accent}/>
        <StatCard label="Low Stock" value={lowStock.length} sub="near reorder point" icon="⚠️" color={C.orange}/>
        <StatCard label="Out of Stock" value={outOfStock.length} icon="🚫" color={C.red}/>
        <StatCard label="Needs Ordering" value={needsOrder.length} sub="demand exceeds supply" icon="🛒" color={needsOrder.length>0?C.purple:C.green}/>
      </div>

      {/* Alerts banner */}
      {(lowStock.length>0||outOfStock.length>0||needsOrder.length>0)&&(
        <div style={{background:"#fef9c3",border:"1px solid #fde047",borderRadius:10,padding:"12px 14px",marginBottom:14}}>
          <div style={{fontWeight:700,fontSize:13,color:"#854d0e",marginBottom:6}}>⚠️ Stock Alerts</div>
          {outOfStock.map(i=><div key={i.id} style={{fontSize:12,color:C.red,marginTop:2,fontWeight:600}}>🚫 {i.name} — Out of stock</div>)}
          {lowStock.map(i=><div key={i.id} style={{fontSize:12,color:"#92400e",marginTop:2}}>• {i.name} — {totalQty(i)} on hand (reorder at {i.reorderPoint})</div>)}
          {needsOrder.map(({item,toOrder,committed,onHand,onOrder})=>(
            <div key={item.id} style={{fontSize:12,color:"#5b21b6",marginTop:2,fontWeight:600}}>
              🛒 {item.name} — need to order {toOrder} more ({committed} committed, {onHand} on hand, {onOrder} on order)
            </div>
          ))}
        </div>
      )}

      {/* Sub-tabs */}
      <div style={{display:"flex",gap:8,marginBottom:16,borderBottom:`2px solid ${C.border}`,paddingBottom:0}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setInvTab(t.id)}
            style={{background:"none",border:"none",borderBottom:`3px solid ${invTab===t.id?C.accent:"transparent"}`,padding:"8px 14px",fontWeight:700,fontSize:13,color:invTab===t.id?C.accent:C.sub,cursor:"pointer",fontFamily:"inherit",marginBottom:-2}}>
            {t.label}
            {t.id==="purchase-orders"&&<span style={{marginLeft:6,background:purchaseOrders.filter(p=>p.status!=="received").length?C.orange:"#e2e8f0",color:purchaseOrders.filter(p=>p.status!=="received").length?"#fff":C.muted,borderRadius:99,fontSize:10,fontWeight:800,padding:"1px 6px"}}>{purchaseOrders.filter(p=>p.status!=="received").length}</span>}
          </button>
        ))}
      </div>

      {/* ── ITEMS TAB ── */}
      {invTab==="items"&&(
        <div>
          <div style={{display:"flex",gap:10,marginBottom:12,flexWrap:"wrap"}}>
            <input placeholder="Search by name, code or barcode…" value={search} onChange={e=>setSearch(e.target.value)}
              style={{flex:1,minWidth:200,background:"#fff",border:`1px solid ${C.border}`,borderRadius:9,padding:"10px 14px",color:C.text,fontSize:14,fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:14,overflowX:"auto",paddingBottom:4}}>
            {cats.map(c=><Pill key={c} label={c} active={catFilter===c} onClick={()=>setCatFilter(c)}/>)}
          </div>
          {filtered.map(item=>{
            const av = avail(item);
            return (
            <RowCard key={item.id} onClick={()=>setSelItem(item)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1,minWidth:0,marginRight:12}}>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:4}}>
                    <span style={{color:C.accent,fontWeight:800,fontSize:11,fontFamily:"monospace"}}>{item.code}</span>
                    <Badge label={item.category} color="blue"/>
                    <Badge label={totalQty(item)===0?"Out of Stock":totalQty(item)<=item.reorderPoint?"Low Stock":"In Stock"} color={stockStatus(item)}/>
                    {av.toOrder>0&&<Badge label={`Order ${av.toOrder} more`} color="purple"/>}
                  </div>
                  <div style={{color:C.text,fontWeight:700,fontSize:14}}>{item.name}</div>
                  <div style={{color:C.muted,fontSize:12,marginTop:2}}>{item.description}</div>
                  <div style={{display:"flex",gap:12,marginTop:6,fontSize:12,color:C.sub,flexWrap:"wrap"}}>
                    <span>Cost: {fmtMoney(item.purchasePrice)}</span>
                    <span>Sell: {fmtMoney(item.sellPrice)}</span>
                    <span>Markup: {item.markup}%</span>
                  </div>
                </div>
                {/* Availability breakdown */}
                <div style={{flexShrink:0,display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 16px",textAlign:"right",minWidth:160}}>
                  <div>
                    <div style={{fontSize:11,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:0.3}}>On Hand</div>
                    <div style={{fontSize:20,fontWeight:900,color:av.onHand===0?C.red:av.onHand<=item.reorderPoint?C.orange:C.text}}>{av.onHand}</div>
                  </div>
                  <div>
                    <div style={{fontSize:11,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:0.3}}>On Order</div>
                    <div style={{fontSize:20,fontWeight:900,color:av.onOrder>0?C.accent:C.muted}}>{av.onOrder}</div>
                  </div>
                  <div>
                    <div style={{fontSize:11,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:0.3}}>Committed</div>
                    <div style={{fontSize:20,fontWeight:900,color:av.committed>0?"#7c3aed":C.muted}}>{av.committed}</div>
                  </div>
                  <div>
                    <div style={{fontSize:11,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:0.3}}>Available</div>
                    <div style={{fontSize:20,fontWeight:900,color:av.available<0?C.red:av.available===0?C.orange:C.green}}>{av.available}</div>
                  </div>
                  {av.toOrder>0&&(
                    <div style={{gridColumn:"1/-1",background:"#ede9fe",borderRadius:6,padding:"3px 8px",marginTop:2}}>
                      <span style={{fontSize:11,color:"#5b21b6",fontWeight:800}}>🛒 Order {av.toOrder} to cover demand</span>
                    </div>
                  )}
                  <div style={{gridColumn:"1/-1",display:"flex",gap:4,marginTop:4,justifyContent:"flex-end",flexWrap:"wrap"}}>
                    {Object.entries(item.qtyOnHand||{}).filter(([,v])=>v>0).map(([loc,v])=>(
                      <span key={loc} style={{background:C.raised,border:`1px solid ${C.border}`,borderRadius:6,padding:"2px 7px",fontSize:10,fontWeight:700,color:C.sub}}>{locName(loc)}: {v}</span>
                    ))}
                  </div>
                </div>
              </div>
            </RowCard>
            );
          })}
          {filtered.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:C.muted}}><div style={{fontSize:36,marginBottom:8}}>📦</div>No items found</div>}
        </div>
      )}

      {/* ── PURCHASE ORDERS TAB ── */}
      {invTab==="purchase-orders"&&(
        <div>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}>
            <Btn label="+ New Purchase Order" onClick={()=>{setModalData(null);setModal("addPO");}}/>
          </div>
          {purchaseOrders.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:C.muted}}><div style={{fontSize:36,marginBottom:8}}>🛒</div>No purchase orders yet</div>}
          {[...purchaseOrders].sort((a,b)=>b.date.localeCompare(a.date)).map(po=>(
            <RowCard key={po.id}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:4}}>
                    <span style={{color:C.accent,fontWeight:800,fontSize:14}}>{po.ref}</span>
                    <Badge label={po.status.charAt(0).toUpperCase()+po.status.slice(1)} color={poStatusCol(po.status)}/>
                    {po.jobId&&<Badge label={"Job "+po.jobId} color="purple"/>}
                  </div>
                  <div style={{fontWeight:700,fontSize:14,color:C.text}}>{po.supplierName}</div>
                  <div style={{fontSize:12,color:C.sub,marginTop:2}}>
                    {po.lines.length} line{po.lines.length!==1?"s":""} · Ordered {fmtDate(po.date)}
                    {po.receivedDate&&" · Received "+fmtDate(po.receivedDate)}
                    {po.receivedDate&&po.date&&(()=>{const d=Math.round((new Date(po.receivedDate)-new Date(po.date))/86400000);return <span style={{marginLeft:6,background:d<=3?"#dcfce7":d<=7?"#ffedd5":"#fee2e2",color:d<=3?C.green:d<=7?C.orange:C.red,borderRadius:99,fontSize:10,fontWeight:800,padding:"1px 7px"}}>{d}d lead time</span>;})()}
                  </div>
                  <div style={{fontSize:12,color:C.muted,marginTop:4}}>{po.notes}</div>
                  <div style={{marginTop:8}}>
                    {po.lines.map((l,i)=>(
                      <div key={i} style={{fontSize:12,color:C.sub,marginTop:2}}>
                        • {l.itemName} — {l.qtyReceived}/{l.qtyOrdered} received @ {fmtMoney(l.unitCost)}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8,flexShrink:0,marginLeft:12}}>
                  <div style={{textAlign:"right",fontWeight:900,fontSize:15,color:C.text}}>
                    {fmtMoney(po.lines.reduce((s,l)=>s+l.qtyOrdered*l.unitCost,0))}
                  </div>
                  {po.status!=="received"&&(
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"flex-end"}}>
                      <Btn label="✏️ Edit" onClick={()=>{setModalData(po);setModal("editPO");}} small outline/>
                      <Btn label="📥 Receive" onClick={()=>{setModalData(po);setModal("receive");}} color={C.green} small/>
                    </div>
                  )}
                </div>
              </div>
            </RowCard>
          ))}
        </div>
      )}

      {/* ── MOVEMENTS TAB ── */}
      {invTab==="movements"&&(
        <div>
          <div style={{fontWeight:700,fontSize:14,color:C.text,marginBottom:12}}>Stock Movement Log</div>
          {[...stockMovements].sort((a,b)=>b.date.localeCompare(a.date)).map(mv=>{
            const item=invItems.find(i=>i.id===mv.itemId);
            const typeIcon={receive:"📥",transfer:"↔️",collect:"📤",return:"↩️",adjustment:"⚙️"}[mv.type]||"📋";
            const typeCol={receive:C.green,transfer:C.accent,collect:C.orange,return:C.purple,adjustment:C.muted}[mv.type]||C.muted;
            return(
              <div key={mv.id} style={{display:"flex",gap:12,alignItems:"flex-start",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                <div style={{fontSize:22,lineHeight:1,flexShrink:0,marginTop:2}}>{typeIcon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                    <span style={{fontWeight:700,fontSize:13,color:C.text}}>{item?.name||mv.itemId}</span>
                    <span style={{background:typeCol+"22",color:typeCol,borderRadius:99,fontSize:10,fontWeight:800,padding:"2px 8px",textTransform:"uppercase"}}>{mv.type}</span>
                    <span style={{fontWeight:800,fontSize:13,color:mv.type==="receive"||mv.type==="return"?C.green:C.orange}}>{mv.type==="receive"||mv.type==="return"?"+":"-"}{mv.qty}</span>
                  </div>
                  <div style={{fontSize:12,color:C.sub,marginTop:3}}>
                    {mv.fromLocation&&locName(mv.fromLocation)}{mv.fromLocation&&mv.toLocation?" → ":""}{mv.toLocation&&locName(mv.toLocation)}
                    {mv.jobId&&" · Job "+mv.jobId}
                    {mv.poId&&" · "+mv.poId}
                  </div>
                  {mv.note&&<div style={{fontSize:12,color:C.muted,marginTop:2}}>{mv.note}</div>}
                </div>
                <div style={{fontSize:12,color:C.muted,flexShrink:0}}>{fmtDate(mv.date)}</div>
              </div>
            );
          })}
          {stockMovements.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:C.muted}}>No movements recorded</div>}
        </div>
      )}

      {/* ── SUPPLIERS TAB ── */}
      {invTab==="suppliers"&&(
        <div>
          {/* Overall summary */}
          {leadTimes.overall.count>0&&(
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:18}}>
              <StatCard label="Avg Lead Time" value={leadTimes.overall.avg+" days"} sub={`across ${leadTimes.overall.count} POs`} icon="📅" color={C.accent}/>
              <StatCard label="Fastest" value={leadTimes.overall.min+" days"} sub="best received PO" icon="🚀" color={C.green}/>
              <StatCard label="Slowest" value={leadTimes.overall.max+" days"} sub="worst received PO" icon="🐢" color={C.orange}/>
            </div>
          )}

          {/* Per-supplier cards */}
          <div style={{fontWeight:700,fontSize:14,color:C.text,marginBottom:12}}>Lead Time by Supplier</div>
          {invSuppliers.map(sup=>{
            const lt = leadTimes.bySupplier[sup.id];
            const receivedPOs = purchaseOrders.filter(po=>po.supplierId===sup.id&&po.status==="received");
            const openPOs = purchaseOrders.filter(po=>po.supplierId===sup.id&&(po.status==="sent"||po.status==="partial"));
            return (
              <div key={sup.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                  <div>
                    <div style={{fontWeight:800,fontSize:15,color:C.text}}>{sup.name}</div>
                    <div style={{fontSize:12,color:C.muted,marginTop:2}}>{sup.contact||"—"} {sup.phone?"· "+sup.phone:""}</div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <Badge label={`${receivedPOs.length} received`} color="green"/>
                    {openPOs.length>0&&<Badge label={`${openPOs.length} open`} color="orange"/>}
                  </div>
                </div>

                {/* Lead time bar */}
                {lt&&lt.count>0 ? (
                  <div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:12}}>
                      {[
                        {label:"Avg Lead Time", value:lt.avg+" days", color:lt.avg<=3?C.green:lt.avg<=7?C.orange:C.red},
                        {label:"Fastest",        value:lt.min+" days", color:C.green},
                        {label:"Slowest",        value:lt.max+" days", color:C.orange},
                        {label:"POs Measured",   value:lt.count,       color:C.accent},
                      ].map(({label,value,color})=>(
                        <div key={label} style={{background:C.raised,borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                          <div style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:0.4,marginBottom:3}}>{label}</div>
                          <div style={{fontSize:18,fontWeight:900,color}}>{value}</div>
                        </div>
                      ))}
                    </div>
                    {/* Visual bar — avg vs stated lead days */}
                    <div style={{marginBottom:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted,marginBottom:4}}>
                        <span>Actual avg: <strong style={{color:C.text}}>{lt.avg}d</strong></span>
                        <span>Stated lead time: <strong style={{color:C.text}}>{sup.leadDays}d</strong></span>
                      </div>
                      <div style={{background:C.raised,borderRadius:99,height:8,position:"relative",overflow:"hidden"}}>
                        <div style={{
                          position:"absolute",left:0,top:0,height:"100%",borderRadius:99,
                          width:`${Math.min(100,(lt.avg/(Math.max(lt.avg,sup.leadDays)*1.2))*100)}%`,
                          background:lt.avg<=sup.leadDays?C.green:C.orange,
                          transition:"width 0.4s"
                        }}/>
                        {/* Marker for stated lead time */}
                        <div style={{
                          position:"absolute",top:0,height:"100%",width:2,
                          background:C.accent,opacity:0.7,
                          left:`${Math.min(98,(sup.leadDays/(Math.max(lt.avg,sup.leadDays)*1.2))*100)}%`
                        }}/>
                      </div>
                      <div style={{fontSize:10,color:lt.avg<=sup.leadDays?C.green:C.orange,fontWeight:700,marginTop:4}}>
                        {lt.avg<=sup.leadDays
                          ? `✓ Delivering ${sup.leadDays-lt.avg}d faster than stated`
                          : `⚠ Running ${lt.avg-sup.leadDays}d slower than stated`}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{color:C.muted,fontSize:13,fontStyle:"italic"}}>No received POs yet — lead time not available</div>
                )}

                {/* Items ordered from this supplier */}
                <div style={{borderTop:`1px solid ${C.border}`,paddingTop:10,marginTop:10}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:0.4,marginBottom:6}}>Items &amp; Lead Times</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {invItems.filter(i=>i.supplierId===sup.id).map(item=>{
                      const ilt = leadTimes.byItem[item.id]?.bySupplier?.[sup.id];
                      return (
                        <div key={item.id} style={{background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 10px",fontSize:12}}>
                          <span style={{color:C.text,fontWeight:600}}>{item.name}</span>
                          {ilt&&ilt.count>0
                            ? <span style={{color:C.accent,fontWeight:800,marginLeft:8}}>{ilt.avg}d avg</span>
                            : <span style={{color:C.muted,marginLeft:8}}>no data</span>
                          }
                        </div>
                      );
                    })}
                    {invItems.filter(i=>i.supplierId===sup.id).length===0&&(
                      <span style={{color:C.muted,fontSize:12}}>No items linked to this supplier</span>
                    )}
                  </div>
                </div>

                <div style={{marginTop:10,display:"flex",gap:12,fontSize:12,color:C.muted}}>
                  {sup.terms&&<span>Terms: <strong style={{color:C.sub}}>{sup.terms}</strong></span>}
                  {sup.abn&&<span>ABN: <strong style={{color:C.sub}}>{sup.abn}</strong></span>}
                </div>
              </div>
            );
          })}

          {/* Per-item lead time table */}
          <div style={{fontWeight:700,fontSize:14,color:C.text,margin:"20px 0 12px"}}>Lead Time by Item</div>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
            <div style={{display:"grid",gridTemplateColumns:"2fr repeat(4,1fr)",gap:0,background:C.raised,padding:"8px 14px",borderBottom:`1px solid ${C.border}`}}>
              {["Item","Avg Days","Fastest","Slowest","POs"].map(h=>(
                <div key={h} style={{fontSize:11,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:0.4,textAlign:h==="Item"?"left":"center"}}>{h}</div>
              ))}
            </div>
            {invItems.map((item,idx)=>{
              const lt = leadTimes.byItem[item.id];
              return (
                <div key={item.id} style={{display:"grid",gridTemplateColumns:"2fr repeat(4,1fr)",gap:0,padding:"10px 14px",borderBottom:idx<invItems.length-1?`1px solid ${C.border}`:"none",alignItems:"center"}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:13,color:C.text}}>{item.name}</div>
                    <div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>{item.code}</div>
                  </div>
                  <div style={{textAlign:"center",fontWeight:900,fontSize:16,color:lt?.avg!=null?(lt.avg<=3?C.green:lt.avg<=7?C.orange:C.red):C.muted}}>
                    {lt?.avg!=null ? lt.avg+"d" : "—"}
                  </div>
                  <div style={{textAlign:"center",fontWeight:700,fontSize:14,color:C.green}}>{lt?.min!=null?lt.min+"d":"—"}</div>
                  <div style={{textAlign:"center",fontWeight:700,fontSize:14,color:C.orange}}>{lt?.max!=null?lt.max+"d":"—"}</div>
                  <div style={{textAlign:"center",fontSize:13,color:C.muted}}>{lt?.count||0}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MODALS ── */}
      {modal==="adhocReceive"&&(
        <AdHocReceiveModal items={invItems} suppliers={invSuppliers} onSave={doAdHocReceive} onClose={()=>setModal(null)}/>
      )}
      {(modal==="addItem"||modal==="editItem")&&(
        <ItemModal item={modal==="editItem"?selItem:null} suppliers={invSuppliers} onSave={saveItem} onClose={()=>setModal(null)}/>
      )}
      {(modal==="addPO"||modal==="editPO")&&(
        <POModal po={modal==="editPO"?modalData:null} items={invItems} suppliers={invSuppliers} jobs={openJobs} onSave={savePO} onClose={()=>setModal(null)}/>
      )}
      {modal==="receive"&&modalData&&(
        <ReceiveModal po={modalData} onSave={lines=>receiveStock(modalData,lines)} onClose={()=>setModal(null)}/>
      )}
      {modal==="transfer"&&(
        <TransferModal items={invItems} batches={stockBatches} fieldStaff={fieldStaff||[]} onSave={doTransfer} onClose={()=>setModal(null)}/>
      )}
      {modal==="collect"&&(
        <CollectModal items={invItems} batches={stockBatches} fieldStaff={fieldStaff||[]} jobs={openJobs} onSave={doCollect} onClose={()=>setModal(null)}/>
      )}
      {modal==="return"&&(
        <ReturnModal items={invItems} batches={stockBatches} fieldStaff={fieldStaff||[]} jobs={openJobs} onSave={doReturn} onClose={()=>setModal(null)}/>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   REPORTS
═══════════════════════════════════════════ */
function ReportsTab({companies}) {
  const jobs=allJobs(companies);
  const invoices=SEED_INVOICES;
  const openJobs=jobs.filter(j=>j.status==="Open");
  const closedJobs=jobs.filter(j=>j.status==="Closed");
  const revenue=invoices.filter(i=>i.status==="Paid").reduce((s,i)=>s+i.total,0);
  const outstanding=invoices.filter(i=>i.status!=="Paid").reduce((s,i)=>s+i.total,0);
  const jobsByType=DEFAULT_JOB_TYPES.map(t=>({type:t,count:jobs.filter(j=>j.type===t).length}));
  const techs=[...new Set(jobs.map(j=>j.tech).filter(Boolean))];const jobsByTech=techs.map(t=>({tech:t,open:openJobs.filter(j=>j.tech===t).length,closed:closedJobs.filter(j=>j.tech===t).length}));
  return(<div><div style={{marginBottom:16}}><h2 style={{fontSize:18,fontWeight:800,color:C.text}}>Reports</h2><p style={{color:C.sub,fontSize:12,marginTop:2}}>Business overview</p></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}><StatCard label="Total Revenue" value={fmtMoney(revenue)} sub="from paid invoices" icon="💰" color={C.green}/><StatCard label="Outstanding" value={fmtMoney(outstanding)} sub="unpaid invoices" icon="⏳" color={C.red}/><StatCard label="Open Jobs" value={openJobs.length} sub="awaiting completion" icon="🔓" color={C.orange}/><StatCard label="Jobs Completed" value={closedJobs.length} sub="all time" icon="✅" color={C.accent}/></div><Card style={{marginBottom:16}}><SectionHead title="📊 Jobs by Type"/>{jobsByType.map(jt=>(<div key={jt.type} style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:13,fontWeight:600,color:C.text}}>{jt.type}</span><span style={{fontSize:13,fontWeight:700,color:C.sub}}>{jt.count} jobs</span></div><div style={{background:C.raised,borderRadius:99,height:8,overflow:"hidden"}}><div style={{background:jt.type==="HVAC"?C.accent:jt.type==="Plumbing"?C.purple:C.orange,height:"100%",borderRadius:99,width:`${jobs.length?Math.round(jt.count/jobs.length*100):0}%`,transition:"width 0.5s"}}/></div></div>))}</Card><Card style={{marginBottom:16}}><SectionHead title="👷 Technician Workload"/>{jobsByTech.map(jt=>(<div key={jt.tech} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${C.border}`}}><Avatar name={jt.tech} size={34} bg="#dbeafe" fg="#1d4ed8"/><div style={{flex:1}}><div style={{color:C.text,fontWeight:700,fontSize:13}}>{jt.tech}</div><div style={{color:C.sub,fontSize:12}}>{jt.open} open · {jt.closed} completed</div></div><div style={{display:"flex",gap:6}}><Badge label={`${jt.open} open`} color="blue"/><Badge label={`${jt.closed} done`} color="green"/></div></div>))}</Card><Card><SectionHead title="📋 Invoice Summary"/>{[["Paid",invoices.filter(i=>i.status==="Paid"),"green"],["Overdue",invoices.filter(i=>i.status==="Overdue"),"red"],["Sent",invoices.filter(i=>i.status==="Sent"),"blue"]].map(([label,items,color])=>(<div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}><div style={{display:"flex",gap:10,alignItems:"center"}}><Badge label={label} color={color}/><span style={{fontSize:12,color:C.sub}}>{items.length} invoice{items.length!==1?"s":""}</span></div><span style={{fontWeight:700,color:C.text}}>{fmtMoney(items.reduce((s,i)=>s+i.total,0))}</span></div>))}</Card></div>);
}

/* ═══════════════════════════════════════════
   NAV + ROOT
═══════════════════════════════════════════ */
/* ─── NAV ICONS (inline SVG paths, Lucide-style) ─── */
/* ═══════════════════════════════════════════
   TECHNICIAN VIEW — mobile phone frame
═══════════════════════════════════════════ */
function TechnicianView({settings, companies, currentUser}) {
  const {fieldStaff=[],invItems=[],stockBatches=[],setStockBatches,setStockMovements,stockMovements=[]} = settings;
  const activeTechs = fieldStaff.filter(f=>f.status==="Active");

  // Admin/topboss can pick any tech; tech sees own
  const defaultTech = currentUser.role==="tech"
    ? (activeTechs.find(f=>f.id===currentUser.staffId)||activeTechs[0])
    : activeTechs[0];
  const [selectedTech, setSelectedTech] = useState(defaultTech?.id||"");
  const [invTab, setInvTab] = useState("jobs"); // jobs | collect | transfer | return
  const [modal, setModal] = useState(null);

  const tech = activeTechs.find(f=>f.id===selectedTech)||activeTechs[0];
  const allJobsList = allJobs(companies);
  const techJobs = allJobsList.filter(j=>j.tech===tech?.name && j.status==="Open")
    .sort((a,b)=>{
      const toMin = t=>{if(!t)return 9999;const[h,m]=(t||"0:0").split(":").map(Number);return h*60+m;};
      return toMin(a.scheduledTime)-toMin(b.scheduledTime);
    });

  // Van items for this tech
  const vanKey = `van_${tech?.id||""}`;
  const vanItems = (invItems||[]).map(item=>{
    const qty = item.qtyOnHand?.[vanKey]||0;
    const batches = (stockBatches||[]).filter(b=>b.itemId===item.id&&b.location===vanKey&&b.qtyRemaining>0);
    return {...item, vanQty:qty, batches};
  }).filter(i=>i.vanQty>0);

  const stageColor2 = s=>s==="In Progress"?"#f97316":s==="Scheduled"?"#3b82f6":s==="Completed"?"#16a34a":s==="New"?"#6366f1":"#94a3b8";

  // Quick collect from van for a job
  const [collectJob, setCollectJob] = useState(null);
  const [collectItems, setCollectItems] = useState([]);

  const submitCollect = () => {
    if(!collectJob||!collectItems.length) return;
    const now = new Date().toISOString().slice(0,10);
    let newBatches = [...(stockBatches||[])];
    const newMovements = [...(stockMovements||[])];
    collectItems.forEach(({itemId,qty,batchId})=>{
      newBatches = newBatches.map(b=>{
        if(b.id===batchId) return {...b, qtyRemaining:Math.max(0,b.qtyRemaining-qty)};
        return b;
      });
      newMovements.push({id:`mv${Date.now()}_${itemId}`,type:"collect",itemId,qty,fromLocation:vanKey,toLocation:"job",jobId:collectJob.id,techId:tech.id,poId:null,batchId,date:now,note:`Collected for job ${collectJob.ref}`});
    });
    if(settings.setStockBatches) settings.setStockBatches(newBatches);
    if(settings.setStockMovements) settings.setStockMovements(newMovements);
    setCollectJob(null); setCollectItems([]); setInvTab("jobs");
  };

  const phoneW = 390;

  return (
    <div style={{display:"flex",gap:32,alignItems:"flex-start"}}>
      {/* Left: controls */}
      <div style={{width:280,flexShrink:0}}>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>Viewing as</div>
          {currentUser.role==="tech" ? (
            <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px",display:"flex",gap:10,alignItems:"center"}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:C.accent,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13}}>{tech?.name?.split(" ").map(w=>w[0]).join("").slice(0,2)}</div>
              <div><div style={{fontWeight:700,fontSize:14,color:C.text}}>{tech?.name}</div><div style={{fontSize:12,color:C.sub}}>{tech?.role}</div></div>
            </div>
          ):(
            <select value={selectedTech} onChange={e=>setSelectedTech(e.target.value)}
              style={{width:"100%",background:"#fff",border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.text,fontSize:14,fontFamily:"inherit",fontWeight:600}}>
              {activeTechs.map(f=><option key={f.id} value={f.id}>{f.name} — {f.role}</option>)}
            </select>
          )}
        </div>

        {/* Tab switcher */}
        <div style={{background:C.bg,borderRadius:12,padding:3,marginBottom:16,display:"flex",gap:0}}>
          {[{id:"jobs",label:"📋 Jobs"},{id:"collect",label:"📤 Collect"},{id:"transfer",label:"↔️ Transfer"},{id:"return",label:"↩️ Return"}].map(t=>(
            <button key={t.id} onClick={()=>setInvTab(t.id)}
              style={{flex:1,padding:"7px 4px",borderRadius:9,border:"none",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                background:invTab===t.id?"#fff":"transparent",
                color:invTab===t.id?C.text:C.sub,
                boxShadow:invTab===t.id?"0 1px 3px rgba(0,0,0,0.08)":"none"}}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
          {[
            {label:"Today's Jobs",value:techJobs.length,icon:"📋",color:C.accent},
            {label:"Van Items",value:vanItems.length,icon:"📦",color:C.purple},
          ].map(s=>(
            <div key={s.label} style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"14px",textAlign:"center"}}>
              <div style={{fontSize:22,marginBottom:4}}>{s.icon}</div>
              <div style={{fontSize:22,fontWeight:800,color:s.color}}>{s.value}</div>
              <div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:0.4}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Van inventory quick view */}
        {vanItems.length>0&&(
          <div>
            <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>📦 Van Inventory</div>
            <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
              {vanItems.slice(0,5).map((item,i)=>(
                <div key={item.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",borderBottom:i<Math.min(vanItems.length,5)-1?`1px solid ${C.border}`:""}} >
                  <div style={{fontSize:13,color:C.text,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:160}}>{item.name}</div>
                  <div style={{background:`${C.accent}15`,color:C.accent,borderRadius:99,padding:"2px 10px",fontSize:12,fontWeight:800,flexShrink:0}}>{item.vanQty}</div>
                </div>
              ))}
              {vanItems.length>5&&<div style={{padding:"8px 14px",fontSize:12,color:C.muted,textAlign:"center"}}>+{vanItems.length-5} more items</div>}
            </div>
          </div>
        )}
      </div>

      {/* Phone frame */}
      <div style={{flexShrink:0,width:phoneW,background:"#1a1a2e",borderRadius:44,padding:"12px 10px",boxShadow:"0 24px 60px rgba(0,0,0,0.35)",position:"relative"}}>
        {/* Notch */}
        <div style={{width:120,height:30,background:"#1a1a2e",borderRadius:"0 0 20px 20px",margin:"0 auto 4px",zIndex:10,position:"relative",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          <div style={{width:10,height:10,borderRadius:"50%",background:"#2a2a3e",border:"1px solid #333"}}/>
          <div style={{width:50,height:6,borderRadius:3,background:"#2a2a3e"}}/>
        </div>

        {/* Screen */}
        <div style={{background:"#f8f9fa",borderRadius:32,overflow:"hidden",height:700,display:"flex",flexDirection:"column"}}>

          {/* App header */}
          <div style={{background:"#fff",padding:"14px 18px 10px",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:C.accent,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:800,color:C.text}}>FieldPro</div>
                  <div style={{fontSize:10,color:C.sub}}>Technician · {tech?.name}</div>
                </div>
              </div>
              <div style={{width:32,height:32,borderRadius:"50%",background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:12}}>
                {tech?.name?.split(" ").map(w=>w[0]).join("").slice(0,2)}
              </div>
            </div>
          </div>

          {/* Screen content */}
          <div style={{flex:1,overflowY:"auto",padding:"16px 14px"}}>

            {invTab==="jobs"&&(
              <div>
                <div style={{fontWeight:800,fontSize:16,color:C.text,marginBottom:2}}>Today's Jobs</div>
                <div style={{fontSize:12,color:C.sub,marginBottom:14}}>{techJobs.length} job{techJobs.length!==1?"s":""} assigned</div>
                {techJobs.length===0&&(
                  <div style={{textAlign:"center",padding:"40px 0",color:C.muted}}>
                    <div style={{fontSize:32,marginBottom:8}}>☀️</div>
                    <div style={{fontWeight:700,fontSize:14}}>No jobs today</div>
                  </div>
                )}
                {techJobs.map(job=>(
                  <div key={job.id} style={{background:"#fff",borderRadius:14,padding:"14px",marginBottom:10,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                      <div>
                        <span style={{color:C.accent,fontWeight:800,fontSize:12}}>#{job.ref}</span>
                        <span style={{marginLeft:8,background:stageColor2(job.stage)+"22",color:stageColor2(job.stage),borderRadius:99,padding:"2px 8px",fontSize:11,fontWeight:700}}>{job.stage||"New"}</span>
                      </div>
                    </div>
                    <div style={{fontWeight:700,fontSize:14,color:C.text,marginBottom:4}}>{job.description||job.address}</div>
                    <div style={{fontSize:12,color:C.sub,marginBottom:8}}>{job.companyName} · {job.agentName}</div>
                    <div style={{display:"flex",gap:8,fontSize:11,color:C.sub,flexWrap:"wrap",marginBottom:10}}>
                      <span>📍 {job.address?.split(",")[0]}</span>
                      {job.scheduledTime&&<span>🕐 {job.scheduledTime}{job.durationHrs?` (${job.durationHrs}hr)`:""}</span>}
                      {(job.appliances||[]).length>0&&<span>🔧 {job.appliances.length} appliance{job.appliances.length!==1?"s":""}</span>}
                    </div>
                    {/* Quick collect button */}
                    {vanItems.length>0&&(
                      <button onClick={()=>{setCollectJob(job);setCollectItems([]);setInvTab("collect");}}
                        style={{width:"100%",padding:"9px",background:`${C.accent}12`,color:C.accent,border:`1.5px solid ${C.accent}30`,borderRadius:9,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                        📤 Collect Parts for this Job
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {invTab==="collect"&&(
              <div>
                <div style={{fontWeight:800,fontSize:16,color:C.text,marginBottom:2}}>Collect Parts</div>
                <div style={{fontSize:12,color:C.sub,marginBottom:14}}>Record items used from your van</div>
                {collectJob&&(
                  <div style={{background:`${C.accent}12`,border:`1.5px solid ${C.accent}30`,borderRadius:12,padding:"10px 14px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><div style={{fontSize:11,color:C.accent,fontWeight:700}}>FOR JOB</div><div style={{fontWeight:700,color:C.text,fontSize:13}}>{collectJob.ref} · {collectJob.address?.split(",")[0]}</div></div>
                    <button onClick={()=>setCollectJob(null)} style={{background:"none",border:"none",color:C.muted,fontSize:16,cursor:"pointer"}}>✕</button>
                  </div>
                )}
                {!collectJob&&(
                  <div style={{marginBottom:14}}>
                    <div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:6}}>SELECT JOB</div>
                    <select value={collectJob?.id||""} onChange={e=>setCollectJob(techJobs.find(j=>j.id===e.target.value)||null)}
                      style={{width:"100%",background:"#fff",border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",fontSize:13,color:C.text,fontFamily:"inherit"}}>
                      <option value="">— Pick a job —</option>
                      {techJobs.map(j=><option key={j.id} value={j.id}>{j.ref} · {j.address?.split(",")[0]}</option>)}
                    </select>
                  </div>
                )}
                {vanItems.length===0&&<div style={{textAlign:"center",padding:"30px 0",color:C.muted,fontSize:13}}>No items in your van</div>}
                {vanItems.map(item=>{
                  const ci = collectItems.find(c=>c.itemId===item.id);
                  return(
                    <div key={item.id} style={{background:"#fff",borderRadius:12,padding:"12px",marginBottom:8,boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:ci?8:0}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:700,fontSize:13,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                          <div style={{fontSize:11,color:C.sub}}>{item.vanQty} in van · {item.code}</div>
                        </div>
                        <button onClick={()=>setCollectItems(prev=>ci?prev.filter(c=>c.itemId!==item.id):[...prev,{itemId:item.id,qty:1,batchId:item.batches[0]?.id}])}
                          style={{background:ci?C.accent:"none",color:ci?"#fff":C.muted,border:`1.5px solid ${ci?C.accent:C.border}`,borderRadius:8,padding:"5px 10px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",flexShrink:0,marginLeft:8}}>
                          {ci?"✓ Added":"+ Add"}
                        </button>
                      </div>
                      {ci&&(
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:12,color:C.sub,flex:1}}>Qty:</span>
                          <button onClick={()=>setCollectItems(prev=>prev.map(c=>c.itemId===item.id?{...c,qty:Math.max(1,c.qty-1)}:c))} style={{width:28,height:28,borderRadius:6,border:`1px solid ${C.border}`,background:"#fff",cursor:"pointer",fontSize:14}}>−</button>
                          <span style={{fontWeight:800,fontSize:14,color:C.text,minWidth:24,textAlign:"center"}}>{ci.qty}</span>
                          <button onClick={()=>setCollectItems(prev=>prev.map(c=>c.itemId===item.id?{...c,qty:Math.min(item.vanQty,c.qty+1)}:c))} style={{width:28,height:28,borderRadius:6,border:`1px solid ${C.border}`,background:"#fff",cursor:"pointer",fontSize:14}}>+</button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {collectItems.length>0&&collectJob&&(
                  <button onClick={submitCollect} style={{width:"100%",marginTop:8,padding:"13px",background:C.green,color:"#fff",border:"none",borderRadius:12,fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>
                    ✅ Confirm Collection ({collectItems.length} item{collectItems.length!==1?"s":""})
                  </button>
                )}
              </div>
            )}

            {invTab==="transfer"&&(
              <div>
                <div style={{fontWeight:800,fontSize:16,color:C.text,marginBottom:2}}>Transfer Stock</div>
                <div style={{fontSize:12,color:C.sub,marginBottom:16}}>Move items between vans or warehouse</div>
                {vanItems.length===0?(
                  <div style={{textAlign:"center",padding:"30px 0",color:C.muted,fontSize:13}}>No items to transfer</div>
                ):(
                  <div style={{background:"#fff",borderRadius:14,padding:"16px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
                    <div style={{fontSize:12,color:C.sub,marginBottom:12}}>Select an item to transfer from your van to another location:</div>
                    {vanItems.slice(0,5).map(item=>(
                      <div key={item.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                        <div>
                          <div style={{fontWeight:600,fontSize:13,color:C.text}}>{item.name}</div>
                          <div style={{fontSize:11,color:C.sub}}>{item.vanQty} available</div>
                        </div>
                        <button style={{background:C.accent,color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Transfer →</button>
                      </div>
                    ))}
                    <div style={{marginTop:14,padding:"12px",background:"#eff6ff",borderRadius:10,fontSize:12,color:"#1d4ed8"}}>
                      💡 Full transfer controls available in the Inventory module
                    </div>
                  </div>
                )}
              </div>
            )}

            {invTab==="return"&&(
              <div>
                <div style={{fontWeight:800,fontSize:16,color:C.text,marginBottom:2}}>Return to Warehouse</div>
                <div style={{fontSize:12,color:C.sub,marginBottom:16}}>Send unused items back</div>
                {vanItems.length===0?(
                  <div style={{textAlign:"center",padding:"30px 0",color:C.muted,fontSize:13}}>Nothing to return</div>
                ):(
                  <div style={{background:"#fff",borderRadius:14,padding:"16px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
                    {vanItems.slice(0,5).map(item=>(
                      <div key={item.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                        <div>
                          <div style={{fontWeight:600,fontSize:13,color:C.text}}>{item.name}</div>
                          <div style={{fontSize:11,color:C.sub}}>{item.vanQty} in van</div>
                        </div>
                        <button style={{background:"#f0fdf4",color:C.green,border:`1px solid #bbf7d0`,borderRadius:8,padding:"6px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>↩ Return</button>
                      </div>
                    ))}
                    <div style={{marginTop:14,padding:"12px",background:"#f0fdf4",borderRadius:10,fontSize:12,color:C.green}}>
                      💡 Full return controls available in the Inventory module
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Bottom nav bar */}
          <div style={{background:"#fff",borderTop:`1px solid ${C.border}`,padding:"8px 0 12px",display:"flex",flexShrink:0}}>
            {[
              {id:"jobs",icon:"📋",label:"Jobs"},
              {id:"collect",icon:"📤",label:"Collect"},
              {id:"transfer",icon:"↔️",label:"Transfer"},
              {id:"return",icon:"↩️",label:"Return"},
            ].map(n=>(
              <button key={n.id} onClick={()=>setInvTab(n.id)}
                style={{flex:1,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",
                  display:"flex",flexDirection:"column",alignItems:"center",gap:3,
                  borderTop:`2px solid ${invTab===n.id?C.accent:"transparent"}`,paddingTop:4}}>
                <span style={{fontSize:18}}>{n.icon}</span>
                <span style={{fontSize:10,fontWeight:700,color:invTab===n.id?C.accent:C.muted}}>{n.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Home bar */}
        <div style={{height:4,width:100,background:"rgba(255,255,255,0.3)",borderRadius:2,margin:"10px auto 2px"}}/>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   USER MANAGEMENT — topboss only
═══════════════════════════════════════════ */
function UserManagement({users, setUsers, fieldStaff, currentUser}) {
  const [editUser, setEditUser] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({});

  const PERMS = [
    {key:"dispatch",label:"Dispatch Board"},
    {key:"history",label:"Job History"},
    {key:"customers",label:"Companies"},
    {key:"quotes",label:"Quotes"},
    {key:"invoices",label:"Invoices"},
    {key:"inventory",label:"Inventory"},
    {key:"reports",label:"Reports"},
    {key:"settings",label:"Settings"},
    {key:"techView",label:"Technician View"},
    {key:"userMgmt",label:"User Management"},
  ];

  const saveEdit = () => {
    setUsers(prev=>prev.map(u=>u.id===editUser.id?editUser:u));
    setEditUser(null);
  };

  const addUser = () => {
    if(!form.name||!form.role) return;
    const allPerms = PERMS.reduce((acc,p)=>({...acc,[p.key]:form.role==="admin"}),{});
    if(form.role==="topboss") PERMS.forEach(p=>allPerms[p.key]=true);
    setUsers(prev=>[...prev,{id:`u${Date.now()}`,name:form.name,initials:(form.name.split(" ").map(w=>w[0]).join("").slice(0,2)).toUpperCase(),role:form.role,email:form.email||"",active:true,staffId:form.staffId||null,permissions:allPerms}]);
    setForm({}); setShowAdd(false);
  };

  return(
    <div style={{maxWidth:800}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:800,color:C.text,margin:0}}>User Management</h2>
          <p style={{color:C.sub,fontSize:13,marginTop:3}}>{users.length} users · manage roles and permissions</p>
        </div>
        <button onClick={()=>setShowAdd(true)} style={{background:C.accent,color:"#fff",border:"none",borderRadius:9,padding:"9px 18px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>+ Add User</button>
      </div>

      {showAdd&&(
        <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,padding:"20px",marginBottom:20}}>
          <div style={{fontWeight:700,fontSize:15,color:C.text,marginBottom:16}}>New User</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            <div>
              <label style={{display:"block",fontSize:11,color:C.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Full Name *</label>
              <input value={form.name||""} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",fontSize:13,color:C.text,fontFamily:"inherit",boxSizing:"border-box"}} placeholder="e.g. Sarah Connor"/>
            </div>
            <div>
              <label style={{display:"block",fontSize:11,color:C.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Email</label>
              <input value={form.email||""} onChange={e=>setForm(f=>({...f,email:e.target.value}))} style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",fontSize:13,color:C.text,fontFamily:"inherit",boxSizing:"border-box"}} placeholder="sarah@fieldpro.com"/>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            <div>
              <label style={{display:"block",fontSize:11,color:C.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Role *</label>
              <select value={form.role||""} onChange={e=>setForm(f=>({...f,role:e.target.value}))} style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",fontSize:13,color:C.text,fontFamily:"inherit",boxSizing:"border-box"}}>
                <option value="">— Select role —</option>
                <option value="topboss">Top Boss</option>
                <option value="admin">Admin</option>
                <option value="tech">Technician</option>
              </select>
            </div>
            {form.role==="tech"&&(
              <div>
                <label style={{display:"block",fontSize:11,color:C.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Link to Field Staff</label>
                <select value={form.staffId||""} onChange={e=>setForm(f=>({...f,staffId:e.target.value}))} style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",fontSize:13,color:C.text,fontFamily:"inherit",boxSizing:"border-box"}}>
                  <option value="">— Not linked —</option>
                  {fieldStaff.filter(f=>f.status==="Active").map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={addUser} style={{background:C.accent,color:"#fff",border:"none",borderRadius:9,padding:"9px 20px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Create User</button>
            <button onClick={()=>{setShowAdd(false);setForm({});}} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 20px",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit",color:C.sub}}>Cancel</button>
          </div>
        </div>
      )}

      {/* User list */}
      <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
        {users.map((user,i)=>(
          <div key={user.id} style={{padding:"16px 20px",borderBottom:i<users.length-1?`1px solid ${C.border}`:"",display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:40,height:40,borderRadius:"50%",background:ROLE_COLORS[user.role]+"22",display:"flex",alignItems:"center",justifyContent:"center",color:ROLE_COLORS[user.role],fontWeight:800,fontSize:13,flexShrink:0}}>
              {user.initials}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                <span style={{fontWeight:700,fontSize:14,color:C.text}}>{user.name}</span>
                <span style={{background:ROLE_COLORS[user.role]+"22",color:ROLE_COLORS[user.role],borderRadius:99,padding:"2px 9px",fontSize:11,fontWeight:700}}>{ROLE_LABELS[user.role]}</span>
                {!user.active&&<span style={{background:"#fee2e2",color:"#b91c1c",borderRadius:99,padding:"2px 9px",fontSize:11,fontWeight:700}}>Inactive</span>}
              </div>
              <div style={{fontSize:12,color:C.sub}}>{user.email}</div>
            </div>
            {currentUser.role==="topboss"&&user.id!==currentUser.id&&(
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setEditUser({...user})}
                  style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:C.text}}>
                  Edit
                </button>
                <button onClick={()=>setUsers(prev=>prev.map(u=>u.id===user.id?{...u,active:!u.active}:u))}
                  style={{background:user.active?"#fff7f7":"#f0fdf4",border:`1px solid ${user.active?"#fecaca":"#bbf7d0"}`,borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:user.active?C.red:C.green}}>
                  {user.active?"Deactivate":"Activate"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit permissions modal */}
      {editUser&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setEditUser(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:16,padding:"24px",width:480,maxHeight:"80vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
            <div style={{fontWeight:800,fontSize:17,color:C.text,marginBottom:4}}>{editUser.name}</div>
            <div style={{fontSize:13,color:C.sub,marginBottom:20}}>Edit role and permissions</div>

            <div style={{marginBottom:16}}>
              <label style={{display:"block",fontSize:11,color:C.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Role</label>
              <select value={editUser.role} onChange={e=>setEditUser(u=>({...u,role:e.target.value}))} style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",fontSize:13,color:C.text,fontFamily:"inherit"}}>
                <option value="topboss">Top Boss</option>
                <option value="admin">Admin</option>
                <option value="tech">Technician</option>
              </select>
            </div>

            <div style={{marginBottom:20}}>
              <div style={{fontSize:11,color:C.sub,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:10}}>Module Access</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {PERMS.map(p=>(
                  <label key={p.key} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:editUser.permissions[p.key]?`${C.accent}08`:C.bg,border:`1.5px solid ${editUser.permissions[p.key]?C.accent:C.border}`,borderRadius:9,cursor:"pointer"}}>
                    <input type="checkbox" checked={!!editUser.permissions[p.key]} onChange={e=>setEditUser(u=>({...u,permissions:{...u.permissions,[p.key]:e.target.checked}}))} style={{accentColor:C.accent,width:15,height:15,flexShrink:0}}/>
                    <span style={{fontSize:12,fontWeight:editUser.permissions[p.key]?700:500,color:C.text}}>{p.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{display:"flex",gap:10}}>
              <button onClick={saveEdit} style={{flex:1,background:C.accent,color:"#fff",border:"none",borderRadius:9,padding:"11px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Save Changes</button>
              <button onClick={()=>setEditUser(null)} style={{flex:1,background:"none",border:`1px solid ${C.border}`,borderRadius:9,padding:"11px",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit",color:C.sub}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── NAV ICONS — exact Lucide SVG inner HTML ─── */
const NAV_ICONS = {
  customers: `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>`,
  vendors:   `<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path><path d="M15 18H9"></path><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"></path><circle cx="17" cy="18" r="2"></circle><circle cx="7" cy="18" r="2"></circle>`,
  dispatch:  `<rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="M12 11h4"></path><path d="M12 16h4"></path><path d="M8 11h.01"></path><path d="M8 16h.01"></path>`,
  history:   `<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>`,
  quotes:    `<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path>`,
  invoices:  `<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="m9 15 2 2 4-4"></path>`,
  inventory: `<path d="M16.5 9.4l-9-5.19"></path><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>`,
  products:  `<polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline>`,
  reports:   `<line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line>`,
  technician:`<rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect><path d="M12 18h.01"></path><path d="M8 6h8"></path><path d="M8 10h8"></path><path d="M8 14h4"></path>`,
  users:     `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line>`,
  settings:  `<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle>`,
};
const NavIcon = ({id, size=18, color="currentColor"}) => {
  const inner = NAV_ICONS[id];
  if(!inner) return <span style={{width:size,height:size,display:"inline-block"}}/>;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}} dangerouslySetInnerHTML={{__html:inner}}/>
  );
};

const NAV_GROUPS = [
  {group:"Contacts", items:[
    {id:"customers",label:"Companies"},
    {id:"vendors",label:"Vendors"},
  ]},
  {group:"Operations", items:[
    {id:"dispatch",label:"Dispatch Board"},
    {id:"history",label:"Job History"},
  ]},
  {group:"Finance", items:[
    {id:"quotes",label:"Quotes"},
    {id:"invoices",label:"Invoices"},
    {id:"inventory",label:"Inventory"},
    {id:"products",label:"Products"},
  ]},
  {group:"Reports", items:[
    {id:"reports",label:"Reports"},
  ]},
  {group:"Field", items:[
    {id:"technician",label:"Technician View"},
    {id:"users",label:"Users"},
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
  const [quotes,setQuotes]=useState(SEED_QUOTES);
  const [fieldMode,setFieldMode]=useState(null);
  const [users,setUsers]=useState(SEED_USERS);
  const [currentUser,setCurrentUser]=useState(SEED_USERS[0]); // default: topboss JD
  const [accentColor,setAccentColor]=useState(()=>localStorage.getItem("fp_accent")||"#f2a09a");
  const [showColorPicker,setShowColorPicker]=useState(false);
  C.accent = accentColor;
  const setAccent = col => { setAccentColor(col); localStorage.setItem("fp_accent",col); };
  useEffect(()=>{const h=()=>setIsMobile(window.innerWidth<768);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);

  const handleFieldJobUpdate = updatedJob => {
    setCompanies(companies.map(co=>({...co,branches:co.branches.map(br=>({...br,
      agents:br.agents.map(ag=>({...ag,
        jobs:(ag.jobs||[]).map(j=>j.id===updatedJob.id?updatedJob:j)
      }))
    }))})));
  };

  return(
    <div style={{display:"flex",minHeight:"100vh",background:C.bg,fontFamily:"'Inter','Segoe UI',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0;}input:focus,select:focus,textarea:focus{outline:none;border-color:#0ea5e9!important;}::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:3px;}`}</style>

      {/* DESKTOP SIDEBAR */}
      {!isMobile&&(
        <div style={{width:240,background:"#fff",display:"flex",flexDirection:"column",flexShrink:0,minHeight:"100vh",position:"sticky",top:0,height:"100vh",overflowY:"auto",borderRight:`1px solid ${C.border}`}}>

          {/* Logo */}
          <div style={{padding:"20px 20px 16px",flexShrink:0,borderBottom:`1px solid ${C.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:38,height:38,borderRadius:12,background:accentColor,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:`0 2px 8px ${accentColor}44`}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
              </div>
              <div>
                <div style={{color:C.text,fontWeight:800,fontSize:15,letterSpacing:-0.3}}>FieldPro</div>
                <div style={{color:C.muted,fontSize:10,letterSpacing:0.5,textTransform:"uppercase"}}>Service CRM</div>
              </div>
            </div>
          </div>

          {/* Nav groups */}
          <div style={{padding:"12px 12px",flex:1,overflowY:"auto"}}>
            {NAV_GROUPS.map(g=>(
              <div key={g.group} style={{marginBottom:2}}>
                <div style={{color:C.muted,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:1,padding:"10px 8px 6px"}}>{g.group}</div>
                {g.items.map(n=>{
                  const active=tab===n.id;
                  return(
                    <button key={n.id} onClick={()=>setTab(n.id)}
                      style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 12px",borderRadius:10,border:"none",
                        background:active?"#fef4f3":"transparent",
                        color:active?accentColor:"#64748b",
                        fontWeight:active?700:500,fontSize:13,cursor:"pointer",fontFamily:"inherit",textAlign:"left",marginBottom:2,transition:"all 0.15s"}}>
                      <NavIcon id={n.id} size={17} color={active?accentColor:"#94a3b8"}/>
                      <span style={{flex:1}}>{n.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Settings */}
          <div style={{padding:"8px 12px 0",borderTop:`1px solid ${C.border}`}}>
            {(()=>{const active=tab==="settings";return(
              <button onClick={()=>setTab("settings")}
                style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 12px",borderRadius:10,border:"none",
                  background:active?"#fef4f3":"transparent",
                  color:active?accentColor:"#64748b",
                  fontWeight:active?700:500,fontSize:13,cursor:"pointer",fontFamily:"inherit",textAlign:"left",marginBottom:4,transition:"all 0.15s"}}>
                <NavIcon id="settings" size={17} color={active?accentColor:"#94a3b8"}/>
                <span style={{flex:1}}>Settings</span>
              </button>
            );})()}
          </div>

          {/* Colour picker panel */}
          {showColorPicker&&(
            <div style={{margin:"0 12px 8px",background:C.bg,borderRadius:12,padding:"12px",border:`1px solid ${C.border}`}}>
              <div style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:10}}>Theme Colour</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginBottom:10}}>
                {["#f2a09a","#0ea5e9","#7c3aed","#16a34a","#f97316","#0d9488","#db2777","#4f46e5","#d97706","#64748b"].map(col=>(
                  <button key={col} onClick={()=>setAccent(col)}
                    style={{width:"100%",aspectRatio:"1",borderRadius:7,border:accentColor===col?`2.5px solid ${C.text}`:"2.5px solid transparent",
                      background:col,cursor:"pointer",transition:"transform 0.1s",transform:accentColor===col?"scale(1.15)":"scale(1)"}}>
                  </button>
                ))}
              </div>
              <input type="color" value={accentColor} onChange={e=>setAccent(e.target.value)}
                style={{width:"100%",height:30,borderRadius:7,border:`1px solid ${C.border}`,cursor:"pointer",padding:"2px 4px",background:"#fff"}}/>
            </div>
          )}

          {/* User card */}
          <div style={{padding:"8px 12px 16px"}}>
            <div style={{background:C.bg,borderRadius:11,padding:"10px 12px",border:`1px solid ${C.border}`}}>
              <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:8}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:ROLE_COLORS[currentUser.role]||accentColor,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:12,flexShrink:0}}>{currentUser.initials}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{color:C.text,fontSize:12,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{currentUser.name}</div>
                  <div style={{color:ROLE_COLORS[currentUser.role]||C.muted,fontSize:10,fontWeight:700}}>{ROLE_LABELS[currentUser.role]}</div>
                </div>
                <button onClick={()=>setShowColorPicker(p=>!p)} title="Change theme colour"
                  style={{background:"none",border:"none",cursor:"pointer",fontSize:15,padding:"2px",borderRadius:6,opacity:showColorPicker?1:0.5}}>🎨</button>
              </div>
              {/* Switch user (demo) */}
              <select value={currentUser.id} onChange={e=>setCurrentUser(users.find(u=>u.id===e.target.value)||currentUser)}
                style={{width:"100%",background:"#fff",border:`1px solid ${C.border}`,borderRadius:7,padding:"5px 8px",fontSize:11,color:C.sub,fontFamily:"inherit",cursor:"pointer"}}>
                {users.filter(u=>u.active).map(u=><option key={u.id} value={u.id}>{u.name} ({ROLE_LABELS[u.role]})</option>)}
              </select>
            </div>
          </div>

        </div>
      )}

      {/* MAIN CONTENT */}
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,overflowY:"auto"}}>

        {/* TOP HEADER BAR */}
        {!isMobile&&(
          <div style={{background:"#fff",borderBottom:`1px solid ${C.border}`,padding:"0 32px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,position:"sticky",top:0,zIndex:50}}>
            <div>
              <div style={{fontWeight:800,fontSize:20,color:C.text,letterSpacing:-0.5}}>
                {[...NAV_GROUPS.flatMap(g=>g.items),{id:"settings",label:"Settings"}].find(n=>n.id===tab)?.label||"FieldPro"}
              </div>
              <div style={{fontSize:12,color:C.muted,marginTop:1}}>
                {tab==="dispatch"?"Dispatch Board — manage today's jobs":
                 tab==="history"?"All jobs across your client base":
                 tab==="customers"?"Client companies and tenant records":
                 tab==="quotes"?"Quotes and estimates":
                 tab==="invoices"?"Invoicing and payments":
                 tab==="inventory"?"Stock, parts and inventory":
                 tab==="reports"?"Business overview and analytics":
                 tab==="technician"?`Field mobile view — ${currentUser.role==="tech"?"your jobs":"select a technician"}`:
                 tab==="users"?"User accounts, roles and permissions":
                 tab==="settings"?"Configure FieldPro to your workflow":
                 "FieldPro Field Service CRM"}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{display:"flex",alignItems:"center",gap:8,background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:"8px 14px",width:220}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <span style={{color:C.muted,fontSize:13}}>Search jobs, clients…</span>
              </div>
              <div style={{position:"relative"}}>
                <div style={{width:36,height:36,borderRadius:10,background:C.bg,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                </div>
                <span style={{position:"absolute",top:-3,right:-3,width:8,height:8,borderRadius:"50%",background:accentColor,border:"2px solid #fff"}}/>
              </div>
              <div style={{width:36,height:36,borderRadius:"50%",background:ROLE_COLORS[currentUser.role]||accentColor,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:13,cursor:"pointer",flexShrink:0}}>{currentUser.initials}</div>
            </div>
          </div>
        )}

        {/* PAGE CONTENT */}
        <div style={{flex:1,padding:isMobile?"16px 14px 80px":"28px 32px",maxWidth:"100%"}}>
        {isMobile&&(
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <div style={{width:28,height:28,borderRadius:7,background:accentColor,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            </div>
            <div style={{color:C.text,fontWeight:800,fontSize:15}}>FieldPro</div>
            <div style={{color:C.sub,fontSize:12}}>/ {[...NAV_GROUPS.flatMap(g=>g.items),{id:"settings",label:"Settings"}].find(n=>n.id===tab)?.label}</div>
          </div>
        )}
        {tab==="customers"&&<CustomersTab settings={settings} companies={companies} setCompanies={setCompanies}/>}
        {tab==="vendors"&&<VendorsTab vendors={vendors} setVendors={setVendors}/>}
        {tab==="products"&&<ProductsTab/>}
        {tab==="dispatch"&&<DispatchTab settings={settings} companies={companies} setCompanies={setCompanies} vendors={vendors} fieldMode={fieldMode} setFieldMode={setFieldMode} quotes={quotes} setQuotes={setQuotes}/>}
        {tab==="history"&&<HistoryTab settings={settings} companies={companies} setCompanies={setCompanies} vendors={vendors} quotes={quotes} setQuotes={setQuotes}/>}
        {tab==="quotes"&&<QuotesTab quotes={quotes} setQuotes={setQuotes}/>}
        {tab==="invoices"&&<InvoicesTab/>}
        {tab==="inventory"&&<InventoryTab settings={settings} companies={companies} setCompanies={setCompanies} quotes={quotes}/>}
        {tab==="reports"&&<ReportsTab companies={companies}/>}
        {tab==="technician"&&<TechnicianView settings={settings} companies={companies} currentUser={currentUser}/>}
        {tab==="users"&&(currentUser.role==="topboss"
          ? <UserManagement users={users} setUsers={setUsers} fieldStaff={settings.fieldStaff||[]} currentUser={currentUser}/>
          : <div style={{textAlign:"center",padding:"60px 0",color:C.muted}}><div style={{fontSize:40,marginBottom:12}}>🔒</div><div style={{fontWeight:700,fontSize:16,color:C.text}}>Access Restricted</div><div style={{fontSize:13,marginTop:6}}>Only Top Boss can manage users</div></div>
        )}
        {tab==="settings"&&<SettingsTab settings={settings}/>}
        </div>{/* end page content */}
      </div>{/* end main flex column */}

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

      {/* FIELD MODE FULLSCREEN OVERLAY */}
      {fieldMode&&(
        <FieldMode
          job={fieldMode}
          fieldStaff={settings.fieldStaff||[]}
          fieldForms={settings.fieldForms||[]}
          onClose={()=>setFieldMode(null)}
          onJobUpdate={updatedJob=>{ handleFieldJobUpdate(updatedJob); setFieldMode(null); }}
        />
      )}
    </div>
  );
}

export default function AppRoot() { return <ErrorBoundary><App/></ErrorBoundary>; }
