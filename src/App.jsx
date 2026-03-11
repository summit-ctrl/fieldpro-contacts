import { useState, useEffect } from "react";

const C = {
  bg:"#f4f6f9", surface:"#ffffff", card:"#ffffff", raised:"#f8fafc",
  border:"#e2e8f0", sidebar:"#1e293b", accent:"#0ea5e9", orange:"#f97316",
  green:"#16a34a", red:"#dc2626", purple:"#7c3aed", text:"#0f172a",
  sub:"#64748b", muted:"#94a3b8",
};

/* ─── DEFAULT LISTS (editable at runtime) ─── */
const DEFAULT_APPLIANCE_TYPES = [
  "Oven","Dishwasher","Cooktop – Gas","Cooktop – Electric","Upright Cooker",
  "Washing Machine","Dryer","Fridge","Microwave","Other",
];
const DEFAULT_WORK_PRESETS = [
  "Add power point","Close off gas (gas shutdown)","Replace cables",
  "Update circuit breaker","Modify cabinets","Cut benchtop",
  "Install rangehood","Replace hot water system","Install exhaust fan","Smoke alarm replacement",
];
const DEFAULT_JOB_TYPES = ["HVAC","Plumbing","Electrical"];
const DEFAULT_TECHNICIANS = ["Jake Rivera","Tom Yuen","Maria Flores","Anita Shaw"];

/* ─── HELPERS ─── */
const daysDiff = d => Math.floor((new Date() - new Date(d)) / 86400000);
const jobStatus = job => {
  if (job.status === "Open") return "Open";
  return daysDiff(job.closedDate) <= 30 ? "Recently Closed" : "Old";
};
const statusColor = s => s==="Open"?"blue":s==="Recently Closed"?"orange":"gray";
let _id = 3000;
const uid = () => `id-${++_id}`;

const appIcon = t => ({"Oven":"🍳","Dishwasher":"🍽️","Cooktop – Gas":"🔥","Cooktop – Electric":"⚡","Upright Cooker":"🍲","Washing Machine":"🫧","Dryer":"💨","Fridge":"🧊","Microwave":"📡"}[t]||"🔧");
const workIcon = d => {
  const dl = d.toLowerCase();
  if (dl.includes("gas")) return "⛽";
  if (dl.includes("power point")||dl.includes("circuit")||dl.includes("cable")) return "⚡";
  if (dl.includes("cabinet")||dl.includes("benchtop")) return "🪚";
  if (dl.includes("alarm")) return "🔔";
  if (dl.includes("water")) return "💧";
  return "🔧";
};

/* ─── SEED DATA ─── */
const SEED_COMPANIES = [
  {
    id:"c1", name:"Ray White Group", abn:"42 000 001 478", phone:"(02) 9299 0000",
    email:"accounts@raywhite.com", website:"raywhite.com", status:"Active",
    branches:[
      {
        id:"b1", name:"Ray White Parramatta", address:"10 Darcy St, Parramatta NSW 2150",
        phone:"(02) 9633 3300", email:"parramatta@raywhite.com",
        billing:{name:"Karen Lim",email:"klim@raywhite.com",phone:"(02) 9633 3301"},
        agents:[
          {
            id:"a1", name:"James Okafor", email:"jokafor@raywhite.com", phone:"0412 111 222", properties:12,
            jobs:[
              {id:"j1",ref:"JOB-1001",type:"Plumbing",address:"22 Oak St, Parramatta NSW",description:"Leaking tap in kitchen and bathroom",tech:"Jake Rivera",keyPickup:"Key in lockbox – code 4421",createdDate:"2026-03-01",status:"Open",closedDate:null,
                tenants:[{id:"t1",name:"Wei & Fang Liu",email:"wliu@gmail.com",phone:"0400 111 333"}],
                appliances:[{id:"ap1",appType:"Dishwasher",brand:"Bosch",model:"SMS46KI01A",serial:"BSH2024-001",condition:"Leaking from door seal"}],
                additionalWorks:[{id:"aw1",description:"Add power point",custom:false,notes:"Behind dishwasher cavity"}]},
              {id:"j2",ref:"JOB-1002",type:"Electrical",address:"7/15 Church St, Parramatta NSW",description:"Power point replacement x3",tech:"Tom Yuen",keyPickup:"Key at reception – ask for Maria",createdDate:"2026-02-10",status:"Closed",closedDate:"2026-02-20",
                tenants:[{id:"t2",name:"Priya Menon",email:"pmenon@hotmail.com",phone:"0400 222 444"}],
                appliances:[],
                additionalWorks:[{id:"aw2",description:"Replace cables",custom:false,notes:"3x double GPO"},{id:"aw3",description:"Update circuit breaker",custom:false,notes:""}]},
              {id:"j3",ref:"JOB-1003",type:"HVAC",address:"22 Oak St, Parramatta NSW",description:"AC unit not cooling – full service",tech:"Maria Flores",keyPickup:"Tenant home – call 30 mins prior",createdDate:"2025-11-15",status:"Closed",closedDate:"2025-11-20",
                tenants:[{id:"t1",name:"Wei & Fang Liu",email:"wliu@gmail.com",phone:"0400 111 333"},{id:"t2",name:"Priya Menon",email:"pmenon@hotmail.com",phone:"0400 222 444"}],
                appliances:[{id:"ap2",appType:"Cooktop – Gas",brand:"Smeg",model:"SR264GH",serial:"SMG2022-887",condition:"One burner igniter faulty"},{id:"ap3",appType:"Oven",brand:"Smeg",model:"SF6341GVX",serial:"SMG2022-888",condition:"Good – general service"}],
                additionalWorks:[]},
            ]
          },
          {
            id:"a2", name:"Sofia Reyes", email:"sreyes@raywhite.com", phone:"0413 333 444", properties:8,
            jobs:[
              {id:"j4",ref:"JOB-1004",type:"Plumbing",address:"3 Rose Ave, Parramatta NSW",description:"Hot water system replacement",tech:"Anita Shaw",keyPickup:"Key in agent office",createdDate:"2026-03-05",status:"Open",closedDate:null,
                tenants:[{id:"t3",name:"Ahmed & Sara Hassan",email:"ahassan@gmail.com",phone:"0400 333 555"}],
                appliances:[],
                additionalWorks:[{id:"aw4",description:"Close off gas (gas shutdown)",custom:false,notes:"Old HWS – gas line to be capped"}]},
            ]
          },
        ]
      },
      {
        id:"b2", name:"Ray White Blacktown", address:"1 Flushcombe Rd, Blacktown NSW 2148",
        phone:"(02) 9622 4400", email:"blacktown@raywhite.com",
        billing:{name:"Tom Nguyen",email:"tnguyen@raywhite.com",phone:"(02) 9622 4401"},
        agents:[{id:"a3",name:"Mia Chang",email:"mchang@raywhite.com",phone:"0414 555 666",properties:15,jobs:[]}]
      },
    ]
  },
  {
    id:"c2", name:"LJ Hooker Corporate", abn:"31 000 007 922", phone:"(02) 8244 4444",
    email:"accounts@ljhooker.com.au", website:"ljhooker.com.au", status:"Active",
    branches:[
      {
        id:"b3", name:"LJ Hooker Penrith", address:"345 High St, Penrith NSW 2750",
        phone:"(02) 4732 1100", email:"penrith@ljhooker.com.au",
        billing:{name:"Rachel Park",email:"rpark@ljhooker.com.au",phone:"(02) 4732 1101"},
        agents:[{id:"a4",name:"David Tran",email:"dtran@ljhooker.com.au",phone:"0415 777 888",properties:10,jobs:[]}]
      },
    ]
  },
];

const SEED_VENDORS = [
  {id:"v1",name:"The Good Guys",abn:"28 006 937 123",phone:"1300 942 765",email:"trade@thegoodguys.com.au",website:"thegoodguys.com.au",rank:1,status:"Active",
    contacts:[{name:"Brad Hollis",role:"Trade Account Manager",phone:"0411 200 300",email:"bhollis@tgg.com.au"},{name:"Kim Rees",role:"Accounts Payable",phone:"0411 200 301",email:"krees@tgg.com.au"}],
    catalogue:[{sku:"BSH-DW60",name:"Bosch 60cm Dishwasher Serie 6",price:1199,unit:"each"},{sku:"FIS-AC35",name:"Fisher & Paykel 3.5kW Split System",price:899,unit:"each"},{sku:"RIN-HW25",name:"Rinnai 25L Hot Water System",price:1450,unit:"each"}],
    history:[{date:"2026-03-01",ref:"PO-4401",item:"Bosch 60cm Dishwasher x2",amount:2398,status:"Paid"},{date:"2026-02-14",ref:"PO-4388",item:"Rinnai Hot Water x1",amount:1450,status:"Paid"},{date:"2026-03-08",ref:"PO-4412",item:"Fisher & Paykel Split x3",amount:2697,status:"Owing"}]},
  {id:"v2",name:"Harvey Norman Commercial",abn:"54 003 237 545",phone:"1300 464 278",email:"commercial@harveynorman.com.au",website:"harveynorman.com.au",rank:2,status:"Active",
    contacts:[{name:"Paul Sims",role:"Commercial Sales",phone:"0422 100 200",email:"psims@hn.com.au"}],
    catalogue:[{sku:"BSH-DW60",name:"Bosch 60cm Dishwasher Serie 6",price:1249,unit:"each"},{sku:"LG-AC25",name:"LG 2.5kW Reverse Cycle Split",price:799,unit:"each"}],
    history:[{date:"2026-02-20",ref:"PO-4395",item:"LG Split System x2",amount:1598,status:"Paid"},{date:"2026-03-05",ref:"PO-4408",item:"Bosch Dishwasher x1",amount:1249,status:"Owing"}]},
  {id:"v3",name:"Reece Plumbing Supplies",abn:"19 004 089 444",phone:"13 12 00",email:"trade@reece.com.au",website:"reece.com.au",rank:1,status:"Active",
    contacts:[{name:"Steve March",role:"Trade Account",phone:"0433 300 400",email:"smarch@reece.com.au"}],
    catalogue:[{sku:"GRO-MIX1",name:"Grohe Eurosmart Mixer Tap",price:320,unit:"each"},{sku:"CAE-HW50",name:"Caroma 50L Storage HWS",price:1100,unit:"each"},{sku:"PVC-90EL",name:"PVC 90° Elbow 100mm",price:8.50,unit:"each"}],
    history:[{date:"2026-03-03",ref:"PO-4405",item:"Grohe Mixer x5",amount:1600,status:"Paid"}]},
];

/* ─── SHARED UI ─── */
const Badge = ({label,color}) => {
  const map={green:{bg:"#dcfce7",text:"#15803d"},blue:{bg:"#dbeafe",text:"#1d4ed8"},orange:{bg:"#ffedd5",text:"#c2410c"},red:{bg:"#fee2e2",text:"#b91c1c"},purple:{bg:"#ede9fe",text:"#6d28d9"},gray:{bg:"#f1f5f9",text:"#475569"}};
  const s=map[color]||map.gray;
  return <span style={{background:s.bg,color:s.text,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,letterSpacing:0.3,whiteSpace:"nowrap"}}>{label}</span>;
};
const Avatar = ({name,size=36,bg="#dbeafe",fg="#1d4ed8"}) => {
  const i=name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
  return <div style={{width:size,height:size,borderRadius:"50%",background:bg,color:fg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:size*0.33,flexShrink:0}}>{i}</div>;
};
const Field = ({label,value}) => (
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"10px 0",borderBottom:`1px solid ${C.border}`,gap:12}}>
    <span style={{color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,flexShrink:0}}>{label}</span>
    <span style={{color:C.text,fontSize:13,fontWeight:600,textAlign:"right"}}>{value}</span>
  </div>
);
const Card = ({children,style={}}) => (
  <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,boxShadow:"0 1px 3px rgba(0,0,0,0.04)",...style}}>{children}</div>
);
const SectionHead = ({title,count,action}) => (
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <span style={{color:C.text,fontWeight:700,fontSize:14}}>{title}</span>
      {count!==undefined&&<span style={{background:C.raised,border:`1px solid ${C.border}`,color:C.sub,borderRadius:99,padding:"1px 8px",fontSize:11,fontWeight:700}}>{count}</span>}
    </div>
    {action&&<button onClick={action.fn} style={{background:action.color||C.accent,color:"#fff",border:"none",borderRadius:7,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{action.label}</button>}
  </div>
);
const Breadcrumb = ({items}) => (
  <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:16,flexWrap:"wrap"}}>
    {items.map((item,i)=>(
      <span key={i} style={{display:"flex",gap:6,alignItems:"center"}}>
        {i<items.length-1?<button onClick={item.fn} style={{background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit",padding:0}}>{item.label}</button>:<span style={{color:C.text,fontSize:13,fontWeight:700}}>{item.label}</span>}
        {i<items.length-1&&<span style={{color:C.muted,fontSize:12}}>›</span>}
      </span>
    ))}
  </div>
);
const Pill = ({label,active,onClick}) => (
  <button onClick={onClick} style={{padding:"6px 14px",borderRadius:99,border:`1px solid ${active?C.accent:C.border}`,background:active?C.accent:"#fff",color:active?"#fff":C.sub,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>{label}</button>
);
const Btn = ({label,onClick,color=C.accent,small=false}) => (
  <button onClick={onClick} style={{background:color,color:"#fff",border:"none",borderRadius:8,padding:small?"6px 12px":"8px 16px",fontWeight:700,fontSize:small?12:13,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>{label}</button>
);
const RowCard = ({onClick,children}) => (
  <div onClick={onClick}
    onMouseEnter={onClick?e=>e.currentTarget.style.borderColor=C.accent:null}
    onMouseLeave={onClick?e=>e.currentTarget.style.borderColor=C.border:null}
    style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px",cursor:onClick?"pointer":"default",boxShadow:"0 1px 3px rgba(0,0,0,0.04)",marginBottom:10}}>
    {children}
  </div>
);
const Modal = ({title,onClose,onSave,children,wide=false}) => (
  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:wide?600:480,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
      <div style={{padding:"18px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"#fff",zIndex:1}}>
        <span style={{fontWeight:800,fontSize:16,color:C.text}}>{title}</span>
        <button onClick={onClose} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:C.muted,lineHeight:1}}>×</button>
      </div>
      <div style={{padding:20}}>{children}</div>
      <div style={{padding:"14px 20px",borderTop:`1px solid ${C.border}`,display:"flex",gap:10,justifyContent:"flex-end",position:"sticky",bottom:0,background:"#fff"}}>
        <button onClick={onClose} style={{background:C.raised,border:`1px solid ${C.border}`,color:C.sub,borderRadius:8,padding:"8px 16px",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
        <Btn label="Save" onClick={onSave}/>
      </div>
    </div>
  </div>
);
const FF = ({label,value,onChange,type="text",placeholder="",required=false}) => (
  <div style={{marginBottom:14}}>
    <label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>{label}{required&&<span style={{color:C.red}}> *</span>}</label>
    {type==="textarea"
      ?<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={3} style={{width:"100%",background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit",resize:"vertical",boxSizing:"border-box"}}/>
      :<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{width:"100%",background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}/>}
  </div>
);

/* ─── INLINE LIST MANAGER ─── */
// Shows as a collapsible panel inline within a modal — "⚙ Manage list"
function ListManager({label, items, onChange}) {
  const [open, setOpen] = useState(false);
  const [newItem, setNewItem] = useState("");

  const add = () => {
    const v = newItem.trim();
    if (!v || items.includes(v)) return;
    onChange([...items, v]);
    setNewItem("");
  };
  const remove = item => onChange(items.filter(i => i !== item));
  const moveUp = idx => { if(idx===0) return; const a=[...items]; [a[idx-1],a[idx]]=[a[idx],a[idx-1]]; onChange(a); };
  const moveDown = idx => { if(idx===items.length-1) return; const a=[...items]; [a[idx],a[idx+1]]=[a[idx+1],a[idx]]; onChange(a); };

  return (
    <div style={{marginBottom:14}}>
      <button onClick={()=>setOpen(!open)}
        style={{background:"none",border:`1px dashed ${open?C.accent:C.border}`,color:open?C.accent:C.sub,borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>
        <span style={{fontSize:13}}>⚙️</span> {open?"Hide":"Manage"} {label} list
        <span style={{fontSize:10,color:C.muted}}>({items.length} items)</span>
      </button>
      {open&&(
        <div style={{background:C.raised,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px",marginTop:8}}>
          <div style={{fontSize:12,color:C.sub,fontWeight:600,marginBottom:10,textTransform:"uppercase",letterSpacing:0.4}}>
            Edit list — changes apply immediately to the dropdown above
          </div>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <input value={newItem} onChange={e=>setNewItem(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&add()}
              placeholder={`Add new ${label.toLowerCase()}…`}
              style={{flex:1,background:"#fff",border:`1px solid ${C.border}`,borderRadius:7,padding:"7px 10px",fontSize:13,color:C.text,fontFamily:"inherit"}}/>
            <button onClick={add} style={{background:C.accent,color:"#fff",border:"none",borderRadius:7,padding:"7px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>+ Add</button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:5,maxHeight:200,overflowY:"auto"}}>
            {items.map((item,i)=>(
              <div key={item} style={{display:"flex",alignItems:"center",gap:6,background:"#fff",border:`1px solid ${C.border}`,borderRadius:7,padding:"6px 10px"}}>
                <span style={{flex:1,fontSize:13,color:C.text}}>{appIcon(item)||workIcon(item)} {item}</span>
                <button onClick={()=>moveUp(i)} disabled={i===0} style={{background:"none",border:"none",color:i===0?C.muted:C.sub,cursor:i===0?"default":"pointer",fontSize:12,padding:"0 4px",lineHeight:1}}>▲</button>
                <button onClick={()=>moveDown(i)} disabled={i===items.length-1} style={{background:"none",border:"none",color:i===items.length-1?C.muted:C.sub,cursor:i===items.length-1?"default":"pointer",fontSize:12,padding:"0 4px",lineHeight:1}}>▼</button>
                <button onClick={()=>remove(item)} style={{background:"none",border:"none",color:"#fca5a5",fontSize:14,cursor:"pointer",padding:"0 2px",lineHeight:1}}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── APPLIANCES SECTION ─── */
function AppliancesSection({appliances, onChange, applianceTypes, onTypesChange}) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({appType:"",brand:"",model:"",serial:"",condition:""});

  const openAdd = () => { setForm({appType:applianceTypes[0]||"",brand:"",model:"",serial:"",condition:""}); setShowAdd(true); };
  const save = () => {
    if (!form.brand) return;
    onChange([...appliances, {...form, id:uid()}]);
    setShowAdd(false);
  };
  const remove = id => onChange(appliances.filter(a=>a.id!==id));

  return (
    <div>
      <SectionHead title="🏠 Appliances" count={appliances.length} action={{label:"+ Add",fn:openAdd}}/>
      {appliances.length===0&&<p style={{color:C.muted,fontSize:13,paddingBottom:8}}>No appliances logged.</p>}
      {appliances.map(ap=>(
        <div key={ap.id} style={{background:C.raised,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px",marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{display:"flex",gap:10,alignItems:"flex-start",flex:1,minWidth:0}}>
              <span style={{fontSize:22,flexShrink:0}}>{appIcon(ap.appType)}</span>
              <div style={{minWidth:0}}>
                <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                  <span style={{color:C.text,fontWeight:700,fontSize:13}}>{ap.brand} {ap.model}</span>
                  <Badge label={ap.appType} color="blue"/>
                </div>
                {ap.serial&&<div style={{color:C.sub,fontSize:12,marginTop:2}}>S/N: {ap.serial}</div>}
                {ap.condition&&<div style={{color:C.orange,fontSize:12,marginTop:3}}>📋 {ap.condition}</div>}
              </div>
            </div>
            <button onClick={()=>remove(ap.id)} style={{background:"none",border:"none",color:C.muted,fontSize:16,cursor:"pointer",flexShrink:0,marginLeft:8}}>✕</button>
          </div>
        </div>
      ))}
      {showAdd&&(
        <Modal title="Add Appliance" onClose={()=>setShowAdd(false)} onSave={save}>
          {/* Inline list manager at top */}
          <ListManager label="Appliance Type" items={applianceTypes} onChange={onTypesChange}/>
          <div style={{marginBottom:14}}>
            <label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Appliance Type <span style={{color:C.red}}>*</span></label>
            <select value={form.appType} onChange={e=>setForm({...form,appType:e.target.value})}
              style={{width:"100%",background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}>
              {applianceTypes.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <FF label="Make / Brand" value={form.brand} onChange={v=>setForm({...form,brand:v})} placeholder="e.g. Bosch, Smeg, Fisher & Paykel" required/>
          <FF label="Model Number" value={form.model} onChange={v=>setForm({...form,model:v})} placeholder="e.g. SMS46KI01A"/>
          <FF label="Serial Number" value={form.serial} onChange={v=>setForm({...form,serial:v})} placeholder="e.g. BSH2024-001"/>
          <FF label="Condition / Notes" value={form.condition} onChange={v=>setForm({...form,condition:v})} placeholder="e.g. Leaking from door seal..." type="textarea"/>
        </Modal>
      )}
    </div>
  );
}

/* ─── ADDITIONAL WORKS SECTION ─── */
function AdditionalWorksSection({works, onChange, workPresets, onPresetsChange}) {
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState("");
  const [custom, setCustom] = useState("");
  const [notes, setNotes] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  const openAdd = () => { setSelected(workPresets[0]||""); setCustom(""); setNotes(""); setIsCustom(false); setShowAdd(true); };
  const save = () => {
    const desc = isCustom ? custom.trim() : selected;
    if (!desc) return;
    onChange([...works, {id:uid(), description:desc, custom:isCustom, notes}]);
    setShowAdd(false);
  };
  const remove = id => onChange(works.filter(w=>w.id!==id));

  return (
    <div>
      <SectionHead title="🛠️ Additional Works" count={works.length} action={{label:"+ Add",fn:openAdd}}/>
      {works.length===0&&<p style={{color:C.muted,fontSize:13,paddingBottom:8}}>No additional works logged.</p>}
      {works.map(w=>(
        <div key={w.id} style={{background:C.raised,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px",marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{display:"flex",gap:10,alignItems:"flex-start",flex:1,minWidth:0}}>
              <span style={{fontSize:20,flexShrink:0}}>{workIcon(w.description)}</span>
              <div style={{minWidth:0}}>
                <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                  <span style={{color:C.text,fontWeight:700,fontSize:13}}>{w.description}</span>
                  {w.custom&&<Badge label="Custom" color="purple"/>}
                </div>
                {w.notes&&<div style={{color:C.sub,fontSize:12,marginTop:3}}>📝 {w.notes}</div>}
              </div>
            </div>
            <button onClick={()=>remove(w.id)} style={{background:"none",border:"none",color:C.muted,fontSize:16,cursor:"pointer",flexShrink:0,marginLeft:8}}>✕</button>
          </div>
        </div>
      ))}
      {showAdd&&(
        <Modal title="Add Additional Work" onClose={()=>setShowAdd(false)} onSave={save}>
          <div style={{display:"flex",gap:8,marginBottom:14}}>
            <button onClick={()=>setIsCustom(false)} style={{flex:1,padding:"9px",borderRadius:8,border:`2px solid ${!isCustom?C.accent:C.border}`,background:!isCustom?"#eff6ff":"#fff",color:!isCustom?C.accent:C.sub,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Pick from list</button>
            <button onClick={()=>setIsCustom(true)} style={{flex:1,padding:"9px",borderRadius:8,border:`2px solid ${isCustom?C.purple:C.border}`,background:isCustom?"#f5f3ff":"#fff",color:isCustom?C.purple:C.sub,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Custom entry</button>
          </div>
          {!isCustom?(
            <>
              <ListManager label="Works Preset" items={workPresets} onChange={onPresetsChange}/>
              <div style={{marginBottom:14}}>
                <label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Select Work Type <span style={{color:C.red}}>*</span></label>
                <div style={{display:"flex",flexDirection:"column",gap:5,maxHeight:220,overflowY:"auto",padding:"2px 0"}}>
                  {workPresets.map(p=>(
                    <label key={p} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,border:`1.5px solid ${selected===p?C.accent:C.border}`,background:selected===p?"#eff6ff":"#fff",cursor:"pointer"}}>
                      <input type="radio" name="work" checked={selected===p} onChange={()=>setSelected(p)} style={{accentColor:C.accent}}/>
                      <span style={{fontSize:13,fontWeight:selected===p?700:500,color:C.text}}>{workIcon(p)} {p}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          ):(
            <FF label="Describe the Work" value={custom} onChange={setCustom} placeholder="e.g. Install rangehood vent to exterior..." required/>
          )}
          <FF label="Notes (optional)" value={notes} onChange={setNotes} placeholder="Location, spec, or extra details..." type="textarea"/>
        </Modal>
      )}
    </div>
  );
}

/* ─── JOBS SECTION ─── */
function JobsSection({agent, onUpdate, jobTypes, onJobTypesChange, technicians, onTechniciansChange}) {
  const [filter, setFilter] = useState("All");
  const [showJob, setShowJob] = useState(null);
  const [showAddJob, setShowAddJob] = useState(false);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [newJob, setNewJob] = useState({ref:"",type:"",address:"",description:"",tech:"",keyPickup:"",status:"Open"});
  const [newTenant, setNewTenant] = useState({name:"",email:"",phone:""});
  const [applianceTypes, setApplianceTypes] = useState(DEFAULT_APPLIANCE_TYPES);
  const [workPresets, setWorkPresets] = useState(DEFAULT_WORK_PRESETS);
  const jobs = agent.jobs||[];

  const updateJob = updated => {
    onUpdate({...agent, jobs:jobs.map(j=>j.id===updated.id?updated:j)});
    setShowJob(updated);
  };
  const saveJob = () => {
    if (!newJob.ref||!newJob.address) return;
    const type = newJob.type||jobTypes[0]||"";
    const j={...newJob,type,id:uid(),createdDate:new Date().toISOString().split("T")[0],closedDate:newJob.status==="Closed"?new Date().toISOString().split("T")[0]:null,tenants:[],appliances:[],additionalWorks:[]};
    onUpdate({...agent,jobs:[...jobs,j]});
    setNewJob({ref:"",type:"",address:"",description:"",tech:"",keyPickup:"",status:"Open"});
    setShowAddJob(false);
  };
  const saveTenant = () => {
    if (!newTenant.name) return;
    const t={...newTenant,id:uid()};
    const updated={...showJob,tenants:[...showJob.tenants,t]};
    updateJob(updated);
    setNewTenant({name:"",email:"",phone:""});
    setShowAddTenant(false);
  };
  const closeJob = () => updateJob({...showJob,status:"Closed",closedDate:new Date().toISOString().split("T")[0]});
  const filtered = filter==="All"?jobs:jobs.filter(j=>jobStatus(j)===filter);

  if (showJob) {
    const js=jobStatus(showJob);
    return (
      <div>
        <button onClick={()=>setShowJob(null)} style={{background:"none",border:`1px solid ${C.border}`,color:C.sub,borderRadius:8,padding:"6px 14px",fontSize:13,cursor:"pointer",marginBottom:16,fontFamily:"inherit"}}>← Back to Jobs</button>
        <Card style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
            <div><div style={{color:C.accent,fontWeight:800,fontSize:13}}>{showJob.ref}</div><div style={{color:C.text,fontWeight:800,fontSize:16,marginTop:2}}>{showJob.address}</div></div>
            <Badge label={js} color={statusColor(js)}/>
          </div>
          <Field label="Type" value={showJob.type}/><Field label="Description" value={showJob.description||"—"}/>
          <Field label="Technician" value={showJob.tech||"Unassigned"}/><Field label="Key Pickup" value={showJob.keyPickup||"—"}/>
          <Field label="Created" value={showJob.createdDate}/>{showJob.closedDate&&<Field label="Closed" value={showJob.closedDate}/>}
          {showJob.status==="Open"&&<div style={{marginTop:14}}><Btn label="Mark as Closed" onClick={closeJob} color={C.orange} small/></div>}
        </Card>
        <Card style={{marginBottom:14}}>
          <SectionHead title="👥 Tenants" count={showJob.tenants.length} action={{label:"+ Add Tenant",fn:()=>setShowAddTenant(true)}}/>
          {showJob.tenants.length===0&&<p style={{color:C.muted,fontSize:13}}>No tenants linked yet.</p>}
          {showJob.tenants.map(t=>(
            <div key={t.id} style={{display:"flex",gap:12,alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
              <Avatar name={t.name} size={36} bg="#dcfce7" fg="#15803d"/>
              <div><div style={{color:C.text,fontWeight:700,fontSize:13}}>{t.name}</div>{t.email&&<div style={{color:C.sub,fontSize:12}}>{t.email}</div>}{t.phone&&<div style={{color:C.sub,fontSize:12}}>{t.phone}</div>}</div>
            </div>
          ))}
        </Card>
        <Card style={{marginBottom:14}}>
          <AppliancesSection appliances={showJob.appliances||[]} onChange={ap=>updateJob({...showJob,appliances:ap})} applianceTypes={applianceTypes} onTypesChange={setApplianceTypes}/>
        </Card>
        <Card style={{marginBottom:14}}>
          <AdditionalWorksSection works={showJob.additionalWorks||[]} onChange={ws=>updateJob({...showJob,additionalWorks:ws})} workPresets={workPresets} onPresetsChange={setWorkPresets}/>
        </Card>
        {showAddTenant&&(
          <Modal title="Add Tenant to Job" onClose={()=>setShowAddTenant(false)} onSave={saveTenant}>
            <FF label="Full Name" value={newTenant.name} onChange={v=>setNewTenant({...newTenant,name:v})} placeholder="e.g. John Smith" required/>
            <FF label="Email" value={newTenant.email} onChange={v=>setNewTenant({...newTenant,email:v})} placeholder="john@email.com" type="email"/>
            <FF label="Phone" value={newTenant.phone} onChange={v=>setNewTenant({...newTenant,phone:v})} placeholder="0400 000 000"/>
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div>
      <SectionHead title="Jobs" count={jobs.length} action={{label:"+ New Job",fn:()=>{setNewJob({ref:"",type:jobTypes[0]||"",address:"",description:"",tech:"",keyPickup:"",status:"Open"});setShowAddJob(true);}}}/>
      <div style={{display:"flex",gap:8,marginBottom:14,overflowX:"auto",paddingBottom:4}}>
        {["All","Open","Recently Closed","Old"].map(f=><Pill key={f} label={f} active={filter===f} onClick={()=>setFilter(f)}/>)}
      </div>
      {filtered.length===0&&<p style={{color:C.muted,fontSize:13,padding:"8px 0"}}>No jobs found.</p>}
      {filtered.map(job=>{
        const js=jobStatus(job);
        const apCount=(job.appliances||[]).length, wkCount=(job.additionalWorks||[]).length;
        return (
          <RowCard key={job.id} onClick={()=>setShowJob(job)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1,minWidth:0,marginRight:10}}>
                <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                  <span style={{color:C.accent,fontWeight:800,fontSize:13}}>{job.ref}</span>
                  <Badge label={job.type} color={job.type==="HVAC"?"blue":job.type==="Plumbing"?"purple":"orange"}/>
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
              <Badge label={js} color={statusColor(js)}/>
            </div>
          </RowCard>
        );
      })}
      {showAddJob&&(
        <Modal title="New Job" onClose={()=>setShowAddJob(false)} onSave={saveJob}>
          <FF label="Job Reference" value={newJob.ref} onChange={v=>setNewJob({...newJob,ref:v})} placeholder="e.g. JOB-1005" required/>
          {/* Inline job type list manager */}
          <ListManager label="Job Type" items={jobTypes} onChange={onJobTypesChange}/>
          <div style={{marginBottom:14}}>
            <label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Job Type</label>
            <select value={newJob.type||jobTypes[0]} onChange={e=>setNewJob({...newJob,type:e.target.value})}
              style={{width:"100%",background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}>
              {jobTypes.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <FF label="Property Address" value={newJob.address} onChange={v=>setNewJob({...newJob,address:v})} placeholder="e.g. 22 Oak St, Parramatta NSW" required/>
          <FF label="Description" value={newJob.description} onChange={v=>setNewJob({...newJob,description:v})} placeholder="Describe the work needed..." type="textarea"/>
          {/* Inline technician list manager */}
          <ListManager label="Technician" items={technicians} onChange={onTechniciansChange}/>
          <div style={{marginBottom:14}}>
            <label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Assigned Technician</label>
            <select value={newJob.tech} onChange={e=>setNewJob({...newJob,tech:e.target.value})}
              style={{width:"100%",background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}>
              <option value="">— Unassigned —</option>
              {technicians.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <FF label="Key Pickup Details" value={newJob.keyPickup} onChange={v=>setNewJob({...newJob,keyPickup:v})} placeholder="e.g. Key in lockbox – code 4421"/>
          <div style={{marginBottom:14}}>
            <label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Status</label>
            <select value={newJob.status} onChange={e=>setNewJob({...newJob,status:e.target.value})}
              style={{width:"100%",background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}>
              <option>Open</option><option>Closed</option>
            </select>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ─── CUSTOMERS TAB ─── */
function CustomersTab({isMobile}) {
  const [companies,setCompanies]=useState(SEED_COMPANIES);
  const [view,setView]=useState("list");
  const [company,setCompany]=useState(null);
  const [branch,setBranch]=useState(null);
  const [agent,setAgent]=useState(null);
  const [search,setSearch]=useState("");
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState({});
  const [jobTypes,setJobTypes]=useState(DEFAULT_JOB_TYPES);
  const [technicians,setTechnicians]=useState(DEFAULT_TECHNICIANS);

  const filtered=companies.filter(c=>c.name.toLowerCase().includes(search.toLowerCase()));
  const goCompany=c=>{setCompany(c);setBranch(null);setAgent(null);setView("company");};
  const goBranch=b=>{setBranch(b);setAgent(null);setView("branch");};
  const goAgent=a=>{setAgent(a);setView("agent");};
  const sync=newCs=>{
    setCompanies(newCs);
    if(company){const nc=newCs.find(c=>c.id===company.id);if(nc)setCompany(nc);}
    if(branch&&company){const nc=newCs.find(c=>c.id===company.id);if(nc){const nb=nc.branches.find(b=>b.id===branch.id);if(nb)setBranch(nb);}}
    if(agent&&branch&&company){const nc=newCs.find(c=>c.id===company.id);const nb=nc?.branches.find(b=>b.id===branch.id);if(nb){const na=nb.agents.find(a=>a.id===agent.id);if(na)setAgent(na);}}
  };
  const saveCo=()=>{if(!form.name)return;sync([...companies,{id:uid(),name:form.name,abn:form.abn||"",phone:form.phone||"",email:form.email||"",website:form.website||"",status:"Active",branches:[]}]);setModal(null);};
  const saveBranch=()=>{if(!form.name)return;const b={id:uid(),name:form.name,address:form.address||"",phone:form.phone||"",email:form.email||"",billing:{name:form.billingName||"",email:form.billingEmail||"",phone:form.billingPhone||""},agents:[]};sync(companies.map(c=>c.id===company.id?{...c,branches:[...c.branches,b]}:c));setModal(null);};
  const saveAgent=()=>{if(!form.name)return;const a={id:uid(),name:form.name,email:form.email||"",phone:form.phone||"",properties:0,jobs:[]};sync(companies.map(c=>c.id===company.id?{...c,branches:c.branches.map(b=>b.id===branch.id?{...b,agents:[...b.agents,a]}:b)}:c));setModal(null);};
  const updateAgent=ua=>{sync(companies.map(c=>c.id===company.id?{...c,branches:c.branches.map(b=>b.id===branch.id?{...b,agents:b.agents.map(a=>a.id===ua.id?ua:a)}:b)}:c));setAgent(ua);};

  if(view==="list") return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div><h2 style={{fontSize:18,fontWeight:800,color:C.text}}>Companies</h2><p style={{color:C.sub,fontSize:12,marginTop:2}}>{companies.length} companies registered</p></div>
        <Btn label="+ Add Company" onClick={()=>{setModal("co");setForm({});}}/>
      </div>
      <input placeholder="Search companies…" value={search} onChange={e=>setSearch(e.target.value)} style={{width:"100%",background:"#fff",border:`1px solid ${C.border}`,borderRadius:9,padding:"10px 14px",color:C.text,fontSize:14,marginBottom:14,fontFamily:"inherit",boxSizing:"border-box"}}/>
      {filtered.map(co=>(
        <RowCard key={co.id} onClick={()=>goCompany(co)}>
          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            <Avatar name={co.name} size={42} bg="#dbeafe" fg="#1d4ed8"/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{color:C.text,fontWeight:700,fontSize:14}}>{co.name}</div>
              <div style={{color:C.sub,fontSize:12,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{co.email||co.abn}</div>
              <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}><Badge label={`${co.branches.length} Branches`} color="blue"/><Badge label={co.status} color="green"/></div>
            </div>
            <span style={{color:C.muted,fontSize:18}}>›</span>
          </div>
        </RowCard>
      ))}
      {modal==="co"&&<Modal title="Add Company" onClose={()=>setModal(null)} onSave={saveCo}><FF label="Company Name" value={form.name||""} onChange={v=>setForm({...form,name:v})} placeholder="e.g. Ray White Group" required/><FF label="ABN" value={form.abn||""} onChange={v=>setForm({...form,abn:v})} placeholder="00 000 000 000"/><FF label="Phone" value={form.phone||""} onChange={v=>setForm({...form,phone:v})} placeholder="(02) 9000 0000"/><FF label="Email" value={form.email||""} onChange={v=>setForm({...form,email:v})} placeholder="accounts@company.com" type="email"/><FF label="Website" value={form.website||""} onChange={v=>setForm({...form,website:v})} placeholder="company.com.au"/></Modal>}
    </div>
  );

  if(view==="company"&&company) return(
    <div>
      <Breadcrumb items={[{label:"Companies",fn:()=>setView("list")},{label:company.name}]}/>
      <Card style={{marginBottom:16}}>
        <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:14}}>
          <Avatar name={company.name} size={44} bg="#dbeafe" fg="#1d4ed8"/>
          <div><div style={{color:C.text,fontWeight:800,fontSize:16}}>{company.name}</div><div style={{marginTop:4}}><Badge label={company.status} color="green"/></div></div>
        </div>
        {company.abn&&<Field label="ABN" value={company.abn}/>}{company.phone&&<Field label="Phone" value={company.phone}/>}{company.email&&<Field label="Email" value={company.email}/>}{company.website&&<Field label="Website" value={company.website}/>}
      </Card>
      <SectionHead title="Branches" count={company.branches.length} action={{label:"+ Add Branch",fn:()=>{setModal("branch");setForm({});}}}/>
      {company.branches.map(b=>{
        const tc=b.agents.reduce((s,a)=>s+(a.jobs||[]).reduce((ss,j)=>ss+j.tenants.length,0),0);
        return(
          <RowCard key={b.id} onClick={()=>goBranch(b)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1,minWidth:0}}><div style={{color:C.text,fontWeight:700,fontSize:14}}>{b.name}</div><div style={{color:C.sub,fontSize:12,marginTop:2}}>{b.address}</div><div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}><Badge label={`${b.agents.length} Agents`} color="purple"/><Badge label={`${tc} Tenants`} color="blue"/></div></div>
              <span style={{color:C.muted,fontSize:18,marginLeft:10}}>›</span>
            </div>
            {b.billing.name&&<div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${C.border}`,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}><span style={{color:C.sub,fontSize:11,fontWeight:600}}>BILLING</span><span style={{color:C.text,fontSize:12,fontWeight:600}}>{b.billing.name}</span>{b.billing.email&&<span style={{color:C.sub,fontSize:12}}>{b.billing.email}</span>}</div>}
          </RowCard>
        );
      })}
      {modal==="branch"&&<Modal title="Add Branch" onClose={()=>setModal(null)} onSave={saveBranch}><FF label="Branch Name" value={form.name||""} onChange={v=>setForm({...form,name:v})} placeholder="e.g. Ray White Parramatta" required/><FF label="Address" value={form.address||""} onChange={v=>setForm({...form,address:v})} placeholder="10 Main St, Suburb NSW 2000"/><FF label="Phone" value={form.phone||""} onChange={v=>setForm({...form,phone:v})} placeholder="(02) 9000 0000"/><FF label="Email" value={form.email||""} onChange={v=>setForm({...form,email:v})} placeholder="branch@company.com" type="email"/><div style={{background:C.raised,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px",marginBottom:14}}><div style={{color:C.text,fontSize:13,fontWeight:700,marginBottom:10}}>💳 Billing Contact</div><FF label="Name" value={form.billingName||""} onChange={v=>setForm({...form,billingName:v})} placeholder="Contact name"/><FF label="Email" value={form.billingEmail||""} onChange={v=>setForm({...form,billingEmail:v})} placeholder="billing@company.com" type="email"/><FF label="Phone" value={form.billingPhone||""} onChange={v=>setForm({...form,billingPhone:v})} placeholder="(02) 9000 0001"/></div></Modal>}
    </div>
  );

  if(view==="branch"&&branch) return(
    <div>
      <Breadcrumb items={[{label:"Companies",fn:()=>setView("list")},{label:company.name,fn:()=>setView("company")},{label:branch.name}]}/>
      <Card style={{marginBottom:12}}><div style={{color:C.text,fontWeight:800,fontSize:15,marginBottom:12}}>{branch.name}</div>{branch.address&&<Field label="Address" value={branch.address}/>}{branch.phone&&<Field label="Phone" value={branch.phone}/>}{branch.email&&<Field label="Email" value={branch.email}/>}</Card>
      {branch.billing.name&&<Card style={{marginBottom:16}}><div style={{color:C.sub,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:0.6,marginBottom:10}}>💳 Billing Contact</div><div style={{display:"flex",gap:12,alignItems:"center"}}><Avatar name={branch.billing.name} size={38} bg="#ffedd5" fg="#c2410c"/><div><div style={{color:C.text,fontWeight:700,fontSize:13}}>{branch.billing.name}</div>{branch.billing.email&&<div style={{color:C.sub,fontSize:12}}>{branch.billing.email}</div>}{branch.billing.phone&&<div style={{color:C.sub,fontSize:12}}>{branch.billing.phone}</div>}</div></div></Card>}
      <SectionHead title="Property Agents" count={branch.agents.length} action={{label:"+ Add Agent",fn:()=>{setModal("agent");setForm({});}}}/>
      {branch.agents.map(a=>{
        const openJobs=(a.jobs||[]).filter(j=>j.status==="Open").length;
        return(<RowCard key={a.id} onClick={()=>goAgent(a)}><div style={{display:"flex",gap:12,alignItems:"center"}}><Avatar name={a.name} size={40} bg="#ede9fe" fg="#6d28d9"/><div style={{flex:1,minWidth:0}}><div style={{color:C.text,fontWeight:700,fontSize:14}}>{a.name}</div><div style={{color:C.sub,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.email}</div><div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}><Badge label={`${(a.jobs||[]).length} Jobs`} color="blue"/>{openJobs>0&&<Badge label={`${openJobs} Open`} color="green"/>}</div></div><span style={{color:C.muted,fontSize:18}}>›</span></div></RowCard>);
      })}
      {modal==="agent"&&<Modal title="Add Agent" onClose={()=>setModal(null)} onSave={saveAgent}><FF label="Full Name" value={form.name||""} onChange={v=>setForm({...form,name:v})} placeholder="e.g. James Okafor" required/><FF label="Email" value={form.email||""} onChange={v=>setForm({...form,email:v})} placeholder="agent@company.com" type="email"/><FF label="Phone" value={form.phone||""} onChange={v=>setForm({...form,phone:v})} placeholder="0400 000 000"/></Modal>}
    </div>
  );

  if(view==="agent"&&agent) return(
    <div>
      <Breadcrumb items={[{label:"Companies",fn:()=>setView("list")},{label:company.name,fn:()=>setView("company")},{label:branch.name,fn:()=>setView("branch")},{label:agent.name}]}/>
      <Card style={{marginBottom:16}}>
        <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:14}}>
          <Avatar name={agent.name} size={44} bg="#ede9fe" fg="#6d28d9"/>
          <div><div style={{color:C.text,fontWeight:800,fontSize:16}}>{agent.name}</div><div style={{marginTop:4}}><Badge label="Property Agent" color="purple"/></div></div>
        </div>
        {agent.email&&<Field label="Email" value={agent.email}/>}{agent.phone&&<Field label="Phone" value={agent.phone}/>}<Field label="Branch" value={branch.name}/><Field label="Company" value={company.name}/>
      </Card>
      <JobsSection agent={agent} onUpdate={updateAgent} jobTypes={jobTypes} onJobTypesChange={setJobTypes} technicians={technicians} onTechniciansChange={setTechnicians}/>
    </div>
  );
  return null;
}

/* ─── VENDORS TAB ─── */
function VendorsTab() {
  const [vendors,setVendors]=useState(SEED_VENDORS);
  const [sel,setSel]=useState(null);
  const [vTab,setVTab]=useState("overview");
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState({});
  const saveVendor=()=>{if(!form.name)return;setVendors([...vendors,{id:uid(),name:form.name,abn:form.abn||"",phone:form.phone||"",email:form.email||"",website:form.website||"",rank:parseInt(form.rank)||1,status:"Active",contacts:[],catalogue:[],history:[]}]);setModal(null);};
  const saveContact=()=>{if(!form.name)return;const u=vendors.map(v=>v.id===sel.id?{...v,contacts:[...v.contacts,{name:form.name,role:form.role||"",phone:form.phone||"",email:form.email||""}]}:v);setVendors(u);setSel(u.find(v=>v.id===sel.id));setModal(null);};
  const saveProduct=()=>{if(!form.name)return;const p={sku:form.sku||uid().slice(0,8).toUpperCase(),name:form.name,price:parseFloat(form.price)||0,unit:form.unit||"each"};const u=vendors.map(v=>v.id===sel.id?{...v,catalogue:[...v.catalogue,p]}:v);setVendors(u);setSel(u.find(v=>v.id===sel.id));setModal(null);};
  if(!sel) return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div><h2 style={{fontSize:18,fontWeight:800,color:C.text}}>Vendors & Suppliers</h2><p style={{color:C.sub,fontSize:12,marginTop:2}}>{vendors.length} vendors on record</p></div>
        <Btn label="+ Add Vendor" color={C.orange} onClick={()=>{setModal("vendor");setForm({rank:"1"});}}/>
      </div>
      {vendors.map(v=>{const owing=v.history.filter(h=>h.status==="Owing").reduce((s,h)=>s+h.amount,0);return(
        <RowCard key={v.id} onClick={()=>{setSel(v);setVTab("overview");}}>
          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            <Avatar name={v.name} size={42} bg="#ffedd5" fg="#c2410c"/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",gap:6,alignItems:"center"}}><div style={{color:C.text,fontWeight:700,fontSize:14}}>{v.name}</div><span style={{color:"#f59e0b",fontSize:11}}>{[...Array(v.rank)].map(()=>"★").join("")}</span></div>
              <div style={{color:C.sub,fontSize:12,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.email}</div>
              <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}><Badge label={`${v.catalogue.length} Products`} color="orange"/><Badge label={`${v.contacts.length} Contacts`} color="blue"/>{owing>0&&<Badge label={`$${owing.toLocaleString()} Owing`} color="red"/>}</div>
            </div>
            <span style={{color:C.muted,fontSize:18,flexShrink:0}}>›</span>
          </div>
        </RowCard>
      );})}
      {modal==="vendor"&&<Modal title="Add Vendor" onClose={()=>setModal(null)} onSave={saveVendor}><FF label="Vendor Name" value={form.name||""} onChange={v=>setForm({...form,name:v})} placeholder="e.g. The Good Guys" required/><FF label="ABN" value={form.abn||""} onChange={v=>setForm({...form,abn:v})} placeholder="00 000 000 000"/><FF label="Phone" value={form.phone||""} onChange={v=>setForm({...form,phone:v})} placeholder="1300 000 000"/><FF label="Email" value={form.email||""} onChange={v=>setForm({...form,email:v})} placeholder="trade@vendor.com.au" type="email"/><FF label="Website" value={form.website||""} onChange={v=>setForm({...form,website:v})} placeholder="vendor.com.au"/><div style={{marginBottom:14}}><label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Preferred Rank</label><select value={form.rank||"1"} onChange={e=>setForm({...form,rank:e.target.value})} style={{width:"100%",background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}><option value="1">★ Rank 1 (Preferred)</option><option value="2">★★ Rank 2</option><option value="3">★★★ Rank 3</option></select></div></Modal>}
    </div>
  );
  const owing=sel.history.filter(h=>h.status==="Owing").reduce((s,h)=>s+h.amount,0);
  return(
    <div>
      <Breadcrumb items={[{label:"Vendors",fn:()=>setSel(null)},{label:sel.name}]}/>
      <Card style={{marginBottom:12}}>
        <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:14}}><Avatar name={sel.name} size={44} bg="#ffedd5" fg="#c2410c"/><div><div style={{color:C.text,fontWeight:800,fontSize:16}}>{sel.name}</div><div style={{display:"flex",gap:6,marginTop:4,alignItems:"center"}}><Badge label={sel.status} color="green"/><span style={{color:"#f59e0b"}}>{[...Array(sel.rank)].map(()=>"★").join("")}</span></div></div></div>
        {sel.abn&&<Field label="ABN" value={sel.abn}/>}{sel.phone&&<Field label="Phone" value={sel.phone}/>}{sel.email&&<Field label="Email" value={sel.email}/>}{sel.website&&<Field label="Website" value={sel.website}/>}
      </Card>
      <div style={{background:owing>0?"#fef2f2":"#f0fdf4",border:`1px solid ${owing>0?"#fecaca":"#bbf7d0"}`,borderRadius:12,padding:"14px 16px",marginBottom:16}}>
        <div style={{color:C.sub,fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Account Balance</div>
        <div style={{color:owing>0?C.red:C.green,fontSize:24,fontWeight:900}}>${owing>0?owing.toLocaleString():"0"}</div>
        <div style={{color:C.sub,fontSize:12,marginTop:2}}>{owing>0?"Currently owing":"Account clear"}</div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
        {["overview","contacts","catalogue","history"].map(t=><Pill key={t} label={t.charAt(0).toUpperCase()+t.slice(1)} active={vTab===t} onClick={()=>setVTab(t)}/>)}
      </div>
      {vTab==="overview"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{[["Products",sel.catalogue.length],["Contacts",sel.contacts.length],["Orders",sel.history.length],["Rank",`#${sel.rank}`]].map(([k,val])=><div key={k} style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px"}}><div style={{color:C.sub,fontSize:11,fontWeight:600}}>{k}</div><div style={{color:C.text,fontWeight:800,fontSize:22,marginTop:4}}>{val}</div></div>)}</div>}
      {vTab==="contacts"&&<Card><SectionHead title="Contacts" count={sel.contacts.length} action={{label:"+ Add",fn:()=>{setModal("contact");setForm({});}}}/>
        {sel.contacts.length===0&&<p style={{color:C.muted,fontSize:13}}>No contacts yet.</p>}
        {sel.contacts.map((ct,i)=><div key={i} style={{display:"flex",gap:12,alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${C.border}`}}><Avatar name={ct.name} size={38} bg="#dbeafe" fg="#1d4ed8"/><div style={{flex:1,minWidth:0}}><div style={{color:C.text,fontWeight:700,fontSize:13}}>{ct.name}</div><div style={{color:C.sub,fontSize:12}}>{ct.role}</div><div style={{color:C.sub,fontSize:12}}>{ct.phone}</div><div style={{color:C.sub,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ct.email}</div></div></div>)}
      </Card>}
      {vTab==="catalogue"&&<Card><SectionHead title="Catalogue" count={sel.catalogue.length} action={{label:"+ Add",fn:()=>{setModal("product");setForm({unit:"each"});}}}/>
        {sel.catalogue.length===0&&<p style={{color:C.muted,fontSize:13}}>No products yet.</p>}
        {sel.catalogue.map((p,i)=><div key={i} style={{padding:"12px 0",borderBottom:`1px solid ${C.border}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div style={{flex:1,minWidth:0,marginRight:10}}><div style={{color:C.accent,fontWeight:700,fontSize:11}}>{p.sku}</div><div style={{color:C.text,fontSize:13,fontWeight:600,marginTop:2}}>{p.name}</div></div><div style={{textAlign:"right",flexShrink:0}}><div style={{color:C.green,fontWeight:800,fontSize:15}}>${p.price.toLocaleString()}</div><div style={{marginTop:4}}><Badge label={p.unit} color="gray"/></div></div></div></div>)}
      </Card>}
      {vTab==="history"&&<Card><SectionHead title="Purchase History"/>
        {sel.history.length===0&&<p style={{color:C.muted,fontSize:13}}>No history yet.</p>}
        {sel.history.map((h,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"12px 0",borderBottom:`1px solid ${C.border}`}}><div style={{flex:1,minWidth:0,marginRight:10}}><div style={{color:C.accent,fontWeight:700,fontSize:13}}>{h.ref}</div><div style={{color:C.text,fontSize:13,marginTop:2}}>{h.item}</div><div style={{color:C.sub,fontSize:11,marginTop:2}}>{h.date}</div></div><div style={{textAlign:"right",flexShrink:0}}><div style={{color:C.text,fontWeight:800,fontSize:15}}>${h.amount.toLocaleString()}</div><div style={{marginTop:6}}><Badge label={h.status} color={h.status==="Paid"?"green":"red"}/></div></div></div>)}
      </Card>}
      {modal==="contact"&&<Modal title="Add Contact" onClose={()=>setModal(null)} onSave={saveContact}><FF label="Full Name" value={form.name||""} onChange={v=>setForm({...form,name:v})} placeholder="e.g. Brad Hollis" required/><FF label="Role" value={form.role||""} onChange={v=>setForm({...form,role:v})} placeholder="e.g. Trade Account Manager"/><FF label="Phone" value={form.phone||""} onChange={v=>setForm({...form,phone:v})} placeholder="0400 000 000"/><FF label="Email" value={form.email||""} onChange={v=>setForm({...form,email:v})} placeholder="contact@vendor.com" type="email"/></Modal>}
      {modal==="product"&&<Modal title="Add Product" onClose={()=>setModal(null)} onSave={saveProduct}><FF label="SKU" value={form.sku||""} onChange={v=>setForm({...form,sku:v})} placeholder="e.g. BSH-DW60"/><FF label="Product Name" value={form.name||""} onChange={v=>setForm({...form,name:v})} placeholder="e.g. Bosch 60cm Dishwasher" required/><FF label="Unit Price ($)" value={form.price||""} onChange={v=>setForm({...form,price:v})} placeholder="0.00" type="number"/><div style={{marginBottom:14}}><label style={{display:"block",color:C.sub,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Unit</label><select value={form.unit||"each"} onChange={e=>setForm({...form,unit:e.target.value})} style={{width:"100%",background:C.raised,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.text,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}><option>each</option><option>m</option><option>m²</option><option>box</option><option>roll</option><option>set</option></select></div></Modal>}
    </div>
  );
}

/* ─── PRODUCTS TAB ─── */
function ProductsTab() {
  const allSkus={};
  SEED_VENDORS.forEach(v=>v.catalogue.forEach(p=>{if(!allSkus[p.sku])allSkus[p.sku]={sku:p.sku,name:p.name,suppliers:[]};allSkus[p.sku].suppliers.push({vendor:v.name,price:p.price,rank:v.rank});}));
  return(
    <div>
      <div style={{marginBottom:16}}><h2 style={{fontSize:18,fontWeight:800,color:C.text}}>Product Catalogue</h2><p style={{color:C.sub,fontSize:12,marginTop:2}}>Cross-supplier pricing comparison</p></div>
      {Object.values(allSkus).map(p=>{const sorted=[...p.suppliers].sort((a,b)=>a.price-b.price);const cheapest=sorted[0];return(
        <div key={p.sku} style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px",marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}><div style={{flex:1,minWidth:0,marginRight:10}}><div style={{color:C.accent,fontWeight:700,fontSize:11}}>{p.sku}</div><div style={{color:C.text,fontWeight:700,fontSize:14,marginTop:2}}>{p.name}</div></div><Badge label={`${p.suppliers.length} Supplier${p.suppliers.length>1?"s":""}`} color={p.suppliers.length>1?"blue":"gray"}/></div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {sorted.map((s,i)=><div key={s.vendor} style={{background:i===0?"#f0fdf4":C.raised,border:`1px solid ${i===0?"#bbf7d0":C.border}`,borderRadius:10,padding:"10px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{color:C.sub,fontSize:12,fontWeight:600}}>{s.vendor}</div><div style={{color:C.sub,fontSize:11,marginTop:2}}>Rank #{s.rank}</div>{i>0&&<div style={{color:C.red,fontSize:11,marginTop:2}}>+${(s.price-cheapest.price).toLocaleString()} vs best</div>}</div><div style={{textAlign:"right"}}><div style={{color:i===0?C.green:C.text,fontWeight:900,fontSize:18}}>${s.price.toLocaleString()}</div>{i===0&&<div style={{marginTop:4}}><Badge label="Best Price" color="green"/></div>}</div></div>)}
          </div>
        </div>
      );})}
    </div>
  );
}

/* ─── ROOT ─── */
const NAV=[{id:"customers",icon:"🏢",label:"Companies"},{id:"vendors",icon:"📦",label:"Vendors"},{id:"products",icon:"🔍",label:"Products"}];
export default function App() {
  const [tab,setTab]=useState("customers");
  const [isMobile,setIsMobile]=useState(window.innerWidth<768);
  useEffect(()=>{const h=()=>setIsMobile(window.innerWidth<768);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);
  return(
    <div style={{display:"flex",minHeight:"100vh",background:C.bg,fontFamily:"'Inter','Segoe UI',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0;}input:focus,select:focus,textarea:focus{outline:none;border-color:#0ea5e9!important;}::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:3px;}`}</style>
      {!isMobile&&(
        <div style={{width:220,background:C.sidebar,display:"flex",flexDirection:"column",padding:"0 0 24px",flexShrink:0,minHeight:"100vh",position:"sticky",top:0,height:"100vh"}}>
          <div style={{padding:"20px 16px 18px",borderBottom:"1px solid #334155"}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:32,height:32,borderRadius:8,background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🔥</div><div><div style={{color:"#fff",fontWeight:800,fontSize:15}}>FieldPro</div><div style={{color:"#64748b",fontSize:10,letterSpacing:0.5}}>CONTACTS MODULE</div></div></div></div>
          <div style={{padding:"14px 8px",flex:1}}>
            <div style={{color:"#475569",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:1,padding:"0 8px",marginBottom:6}}>Contacts</div>
            {NAV.map(n=><button key={n.id} onClick={()=>setTab(n.id)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px",borderRadius:8,border:"none",background:tab===n.id?"#334155":"transparent",color:tab===n.id?"#fff":"#94a3b8",fontWeight:tab===n.id?700:500,fontSize:13,cursor:"pointer",fontFamily:"inherit",textAlign:"left",marginBottom:2}}><span style={{fontSize:16}}>{n.icon}</span>{n.id==="customers"?"Companies & Tenants":n.id==="vendors"?"Vendors & Suppliers":"Product Comparison"}</button>)}
          </div>
          <div style={{padding:"0 10px"}}><div style={{background:"#334155",borderRadius:10,padding:"10px 12px",display:"flex",gap:10,alignItems:"center"}}><div style={{width:28,height:28,borderRadius:"50%",background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:11}}>AD</div><div><div style={{color:"#fff",fontSize:12,fontWeight:700}}>Admin User</div><div style={{color:"#64748b",fontSize:11}}>Manager</div></div></div></div>
        </div>
      )}
      <div style={{flex:1,overflowY:"auto",padding:isMobile?"16px 14px 80px":"28px 32px"}}>
        {isMobile&&<div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}><div style={{width:28,height:28,borderRadius:7,background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🔥</div><div style={{color:C.text,fontWeight:800,fontSize:15}}>FieldPro</div><div style={{color:C.sub,fontSize:12}}>/ {NAV.find(n=>n.id===tab)?.label}</div></div>}
        {tab==="customers"&&<CustomersTab isMobile={isMobile}/>}
        {tab==="vendors"&&<VendorsTab/>}
        {tab==="products"&&<ProductsTab/>}
      </div>
      {isMobile&&(
        <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#fff",borderTop:`1px solid ${C.border}`,display:"flex",zIndex:100,paddingBottom:"env(safe-area-inset-bottom)"}}>
          {NAV.map(n=><button key={n.id} onClick={()=>setTab(n.id)} style={{flex:1,padding:"10px 4px 12px",border:"none",background:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer",fontFamily:"inherit",borderTop:`2px solid ${tab===n.id?C.accent:"transparent"}`}}><span style={{fontSize:20}}>{n.icon}</span><span style={{fontSize:10,fontWeight:700,color:tab===n.id?C.accent:C.muted}}>{n.label}</span></button>)}
        </div>
      )}
    </div>
  );
}
