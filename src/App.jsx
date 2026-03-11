import { useState } from "react";

const C = {
  bg:      "#f4f6f9",
  surface: "#ffffff",
  card:    "#ffffff",
  raised:  "#f8fafc",
  border:  "#e2e8f0",
  sidebar: "#1e293b",
  accent:  "#0ea5e9",
  orange:  "#f97316",
  green:   "#16a34a",
  red:     "#dc2626",
  yellow:  "#d97706",
  purple:  "#7c3aed",
  text:    "#0f172a",
  sub:     "#64748b",
  muted:   "#94a3b8",
};

const COMPANIES = [
  {
    id: "c1", name: "Ray White Group", abn: "42 000 001 478", phone: "(02) 9299 0000",
    email: "accounts@raywhite.com", website: "raywhite.com", status: "Active",
    branches: [
      {
        id: "b1", name: "Ray White Parramatta", address: "10 Darcy St, Parramatta NSW 2150",
        phone: "(02) 9633 3300", email: "parramatta@raywhite.com",
        billing: { name: "Karen Lim", email: "klim@raywhite.com", phone: "(02) 9633 3301" },
        agents: [
          { id: "a1", name: "James Okafor", email: "jokafor@raywhite.com", phone: "0412 111 222", properties: 12,
            tenants: [
              { id: "t1", name: "Wei & Fang Liu", email: "wliu@gmail.com", phone: "0400 111 333", property: "22 Oak St, Parramatta", status: "Current" },
              { id: "t2", name: "Priya Menon", email: "pmenon@hotmail.com", phone: "0400 222 444", property: "7/15 Church St, Parramatta", status: "Current" },
            ]},
          { id: "a2", name: "Sofia Reyes", email: "sreyes@raywhite.com", phone: "0413 333 444", properties: 8,
            tenants: [
              { id: "t3", name: "Ahmed & Sara Hassan", email: "ahassan@gmail.com", phone: "0400 333 555", property: "3 Rose Ave, Parramatta", status: "Current" },
              { id: "t2", name: "Priya Menon", email: "pmenon@hotmail.com", phone: "0400 222 444", property: "7/15 Church St, Parramatta", status: "Current" },
            ]},
        ]
      },
      {
        id: "b2", name: "Ray White Blacktown", address: "1 Flushcombe Rd, Blacktown NSW 2148",
        phone: "(02) 9622 4400", email: "blacktown@raywhite.com",
        billing: { name: "Tom Nguyen", email: "tnguyen@raywhite.com", phone: "(02) 9622 4401" },
        agents: [
          { id: "a3", name: "Mia Chang", email: "mchang@raywhite.com", phone: "0414 555 666", properties: 15,
            tenants: [
              { id: "t4", name: "Carlos Fernandez", email: "cfernandez@gmail.com", phone: "0400 444 666", property: "12 Main St, Blacktown", status: "Current" },
            ]},
        ]
      },
    ]
  },
  {
    id: "c2", name: "LJ Hooker Corporate", abn: "31 000 007 922", phone: "(02) 8244 4444",
    email: "accounts@ljhooker.com.au", website: "ljhooker.com.au", status: "Active",
    branches: [
      {
        id: "b3", name: "LJ Hooker Penrith", address: "345 High St, Penrith NSW 2750",
        phone: "(02) 4732 1100", email: "penrith@ljhooker.com.au",
        billing: { name: "Rachel Park", email: "rpark@ljhooker.com.au", phone: "(02) 4732 1101" },
        agents: [
          { id: "a4", name: "David Tran", email: "dtran@ljhooker.com.au", phone: "0415 777 888", properties: 10,
            tenants: [
              { id: "t5", name: "Maya & Luke Patel", email: "mpatel@gmail.com", phone: "0400 555 777", property: "88 Woodriff St, Penrith", status: "Current" },
            ]},
        ]
      },
    ]
  },
];

const VENDORS = [
  {
    id: "v1", name: "The Good Guys", abn: "28 006 937 123", phone: "1300 942 765",
    email: "trade@thegoodguys.com.au", website: "thegoodguys.com.au", rank: 1, status: "Active",
    contacts: [
      { name: "Brad Hollis", role: "Trade Account Manager", phone: "0411 200 300", email: "bhollis@tgg.com.au" },
      { name: "Kim Rees", role: "Accounts Payable", phone: "0411 200 301", email: "krees@tgg.com.au" },
    ],
    catalogue: [
      { sku: "BSH-DW60", name: "Bosch 60cm Dishwasher Serie 6", price: 1199, unit: "each" },
      { sku: "FIS-AC35", name: "Fisher & Paykel 3.5kW Split System", price: 899, unit: "each" },
      { sku: "RIN-HW25", name: "Rinnai 25L Hot Water System", price: 1450, unit: "each" },
    ],
    history: [
      { date: "2026-03-01", ref: "PO-4401", item: "Bosch 60cm Dishwasher x2", amount: 2398, status: "Paid" },
      { date: "2026-02-14", ref: "PO-4388", item: "Rinnai Hot Water x1", amount: 1450, status: "Paid" },
      { date: "2026-03-08", ref: "PO-4412", item: "Fisher & Paykel Split x3", amount: 2697, status: "Owing" },
    ],
  },
  {
    id: "v2", name: "Harvey Norman Commercial", abn: "54 003 237 545", phone: "1300 464 278",
    email: "commercial@harveynorman.com.au", website: "harveynorman.com.au", rank: 2, status: "Active",
    contacts: [
      { name: "Paul Sims", role: "Commercial Sales", phone: "0422 100 200", email: "psims@hn.com.au" },
    ],
    catalogue: [
      { sku: "BSH-DW60", name: "Bosch 60cm Dishwasher Serie 6", price: 1249, unit: "each" },
      { sku: "LG-AC25", name: "LG 2.5kW Reverse Cycle Split", price: 799, unit: "each" },
    ],
    history: [
      { date: "2026-02-20", ref: "PO-4395", item: "LG Split System x2", amount: 1598, status: "Paid" },
      { date: "2026-03-05", ref: "PO-4408", item: "Bosch Dishwasher x1", amount: 1249, status: "Owing" },
    ],
  },
  {
    id: "v3", name: "Reece Plumbing Supplies", abn: "19 004 089 444", phone: "13 12 00",
    email: "trade@reece.com.au", website: "reece.com.au", rank: 1, status: "Active",
    contacts: [
      { name: "Steve March", role: "Trade Account", phone: "0433 300 400", email: "smarch@reece.com.au" },
    ],
    catalogue: [
      { sku: "GRO-MIX1", name: "Grohe Eurosmart Mixer Tap", price: 320, unit: "each" },
      { sku: "CAE-HW50", name: "Caroma 50L Storage HWS", price: 1100, unit: "each" },
      { sku: "PVC-90EL", name: "PVC 90° Elbow 100mm", price: 8.50, unit: "each" },
    ],
    history: [
      { date: "2026-03-03", ref: "PO-4405", item: "Grohe Mixer x5", amount: 1600, status: "Paid" },
    ],
  },
];

const Badge = ({ label, color }) => {
  const map = {
    green:  { bg: "#dcfce7", text: "#15803d" },
    blue:   { bg: "#dbeafe", text: "#1d4ed8" },
    orange: { bg: "#ffedd5", text: "#c2410c" },
    red:    { bg: "#fee2e2", text: "#b91c1c" },
    purple: { bg: "#ede9fe", text: "#6d28d9" },
    gray:   { bg: "#f1f5f9", text: "#475569" },
  };
  const s = map[color] || map.gray;
  return <span style={{ background: s.bg, color: s.text, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 0.3, whiteSpace: "nowrap" }}>{label}</span>;
};

const Avatar = ({ name, size = 36, bg = "#dbeafe", fg = "#1d4ed8" }) => {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, color: fg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: size * 0.33, flexShrink: 0 }}>
      {initials}
    </div>
  );
};

const Field = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: `1px solid ${C.border}`, gap: 12 }}>
    <span style={{ color: C.sub, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, flexShrink: 0 }}>{label}</span>
    <span style={{ color: C.text, fontSize: 13, fontWeight: 600, textAlign: "right" }}>{value}</span>
  </div>
);

const Card = ({ children, style = {} }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", ...style }}>{children}</div>
);

const SectionHead = ({ title, count, action }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{title}</span>
      {count !== undefined && <span style={{ background: C.raised, border: `1px solid ${C.border}`, color: C.sub, borderRadius: 99, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>{count}</span>}
    </div>
    {action && <button onClick={action.fn} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 7, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{action.label}</button>}
  </div>
);

const Breadcrumb = ({ items }) => (
  <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 20 }}>
    {items.map((item, i) => (
      <span key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {i < items.length - 1
          ? <button onClick={item.fn} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit", padding: 0 }}>{item.label}</button>
          : <span style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>{item.label}</span>
        }
        {i < items.length - 1 && <span style={{ color: C.muted, fontSize: 12 }}>›</span>}
      </span>
    ))}
  </div>
);

const Pill = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ padding: "6px 16px", borderRadius: 99, border: `1px solid ${active ? C.accent : C.border}`, background: active ? C.accent : "#fff", color: active ? "#fff" : C.sub, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
    {label}
  </button>
);

const Btn = ({ label, onClick, color = C.accent }) => (
  <button onClick={onClick} style={{ background: color, color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>{label}</button>
);

function CustomersTab() {
  const [view, setView] = useState("list");
  const [company, setCompany] = useState(null);
  const [branch, setBranch] = useState(null);
  const [agent, setAgent] = useState(null);
  const [search, setSearch] = useState("");

  const goCompany = c => { setCompany(c); setBranch(null); setAgent(null); setView("company"); };
  const goBranch  = b => { setBranch(b); setAgent(null); setView("branch"); };
  const goAgent   = a => { setAgent(a); setView("agent"); };

  const filtered = COMPANIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  if (view === "list") return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text }}>Companies</h2>
          <p style={{ color: C.sub, fontSize: 13, marginTop: 2 }}>{COMPANIES.length} companies registered</p>
        </div>
        <Btn label="+ Add Company" />
      </div>
      <input placeholder="Search companies…" value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: "100%", background: "#fff", border: `1px solid ${C.border}`, borderRadius: 9, padding: "10px 14px", color: C.text, fontSize: 13, marginBottom: 16, fontFamily: "inherit", boxSizing: "border-box" }} />
      <div style={{ display: "grid", gap: 10 }}>
        {filtered.map(co => (
          <div key={co.id} onClick={() => goCompany(co)}
            style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <Avatar name={co.name} size={44} bg="#dbeafe" fg="#1d4ed8" />
              <div>
                <div style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{co.name}</div>
                <div style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>{co.email}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <Badge label={`${co.branches.length} Branches`} color="blue" />
                  <Badge label={co.status} color="green" />
                </div>
              </div>
            </div>
            <span style={{ color: C.muted, fontSize: 18 }}>›</span>
          </div>
        ))}
      </div>
    </div>
  );

  if (view === "company" && company) return (
    <div>
      <Breadcrumb items={[{ label: "Companies", fn: () => setView("list") }, { label: company.name }]} />
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>
        <Card>
          <Avatar name={company.name} size={48} bg="#dbeafe" fg="#1d4ed8" />
          <div style={{ color: C.text, fontWeight: 800, fontSize: 16, marginTop: 12 }}>{company.name}</div>
          <div style={{ marginTop: 6, marginBottom: 16 }}><Badge label={company.status} color="green" /></div>
          <Field label="ABN" value={company.abn} />
          <Field label="Phone" value={company.phone} />
          <Field label="Email" value={company.email} />
          <Field label="Website" value={company.website} />
          <Field label="Branches" value={company.branches.length} />
        </Card>
        <div>
          <SectionHead title="Branches" count={company.branches.length} action={{ label: "+ Add Branch", fn: () => {} }} />
          <div style={{ display: "grid", gap: 10 }}>
            {company.branches.map(b => {
              const tenantCount = b.agents.reduce((s, a) => s + a.tenants.length, 0);
              return (
                <div key={b.id} onClick={() => goBranch(b)}
                  style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                  <div>
                    <div style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{b.name}</div>
                    <div style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>{b.address}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      <Badge label={`${b.agents.length} Agents`} color="purple" />
                      <Badge label={`${tenantCount} Tenants`} color="blue" />
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: C.sub, fontSize: 11, marginBottom: 3 }}>Billing contact</div>
                    <div style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{b.billing.name}</div>
                    <div style={{ color: C.sub, fontSize: 11 }}>{b.billing.email}</div>
                  </div>
                  <span style={{ color: C.muted, fontSize: 18, marginLeft: 16 }}>›</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  if (view === "branch" && branch) return (
    <div>
      <Breadcrumb items={[{ label: "Companies", fn: () => setView("list") }, { label: company.name, fn: () => setView("company") }, { label: branch.name }]} />
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card>
            <div style={{ color: C.sub, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Branch Info</div>
            <div style={{ color: C.text, fontWeight: 800, fontSize: 15, marginBottom: 14 }}>{branch.name}</div>
            <Field label="Address" value={branch.address} />
            <Field label="Phone" value={branch.phone} />
            <Field label="Email" value={branch.email} />
          </Card>
          <Card>
            <div style={{ color: C.sub, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 12 }}>💳 Billing Contact</div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Avatar name={branch.billing.name} size={38} bg="#ffedd5" fg="#c2410c" />
              <div>
                <div style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{branch.billing.name}</div>
                <div style={{ color: C.sub, fontSize: 12 }}>{branch.billing.email}</div>
                <div style={{ color: C.sub, fontSize: 12 }}>{branch.billing.phone}</div>
              </div>
            </div>
          </Card>
        </div>
        <div>
          <SectionHead title="Property Agents" count={branch.agents.length} action={{ label: "+ Add Agent", fn: () => {} }} />
          <div style={{ display: "grid", gap: 10 }}>
            {branch.agents.map(a => (
              <div key={a.id} onClick={() => goAgent(a)}
                style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.purple}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <Avatar name={a.name} size={40} bg="#ede9fe" fg="#6d28d9" />
                  <div>
                    <div style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{a.name}</div>
                    <div style={{ color: C.sub, fontSize: 12 }}>{a.email}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      <Badge label={`${a.properties} Properties`} color="purple" />
                      <Badge label={`${a.tenants.length} Tenants`} color="blue" />
                    </div>
                  </div>
                </div>
                <span style={{ color: C.muted, fontSize: 18 }}>›</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (view === "agent" && agent) return (
    <div>
      <Breadcrumb items={[{ label: "Companies", fn: () => setView("list") }, { label: company.name, fn: () => setView("company") }, { label: branch.name, fn: () => setView("branch") }, { label: agent.name }]} />
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>
        <Card>
          <Avatar name={agent.name} size={48} bg="#ede9fe" fg="#6d28d9" />
          <div style={{ color: C.text, fontWeight: 800, fontSize: 16, marginTop: 12 }}>{agent.name}</div>
          <div style={{ marginTop: 6, marginBottom: 16 }}><Badge label="Property Agent" color="purple" /></div>
          <Field label="Email" value={agent.email} />
          <Field label="Phone" value={agent.phone} />
          <Field label="Properties" value={agent.properties} />
          <Field label="Tenants" value={agent.tenants.length} />
          <Field label="Branch" value={branch.name} />
          <Field label="Company" value={company.name} />
        </Card>
        <div>
          <SectionHead title="Tenants" count={agent.tenants.length} action={{ label: "+ Add Tenant", fn: () => {} }} />
          <div style={{ display: "grid", gap: 10 }}>
            {agent.tenants.map(t => (
              <div key={t.id + agent.id} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <Avatar name={t.name} size={40} bg="#dcfce7" fg="#15803d" />
                    <div>
                      <div style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                      <div style={{ color: C.sub, fontSize: 12 }}>{t.email} · {t.phone}</div>
                      <div style={{ color: C.sub, fontSize: 12, marginTop: 3 }}>🏠 {t.property}</div>
                    </div>
                  </div>
                  <Badge label={t.status} color="green" />
                </div>
                {t.id === "t2" && (
                  <div style={{ marginTop: 12, padding: "8px 12px", background: "#fefce8", border: "1px solid #fde047", borderRadius: 8, fontSize: 12, color: "#854d0e" }}>
                    ⚠️ Also managed by <strong>Sofia Reyes</strong>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return null;
}

function VendorsTab() {
  const [selected, setSelected] = useState(null);
  const [vTab, setVTab] = useState("overview");

  if (!selected) return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text }}>Vendors & Suppliers</h2>
          <p style={{ color: C.sub, fontSize: 13, marginTop: 2 }}>{VENDORS.length} vendors on record</p>
        </div>
        <Btn label="+ Add Vendor" color={C.orange} />
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {VENDORS.map(v => {
          const owing = v.history.filter(h => h.status === "Owing").reduce((s, h) => s + h.amount, 0);
          return (
            <div key={v.id} onClick={() => { setSelected(v); setVTab("overview"); }}
              style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.orange}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <Avatar name={v.name} size={44} bg="#ffedd5" fg="#c2410c" />
                <div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{v.name}</div>
                    <span style={{ color: "#f59e0b" }}>{[...Array(v.rank)].map(() => "★").join("")}</span>
                  </div>
                  <div style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>{v.email}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    <Badge label={`${v.catalogue.length} Products`} color="orange" />
                    <Badge label={`${v.contacts.length} Contacts`} color="blue" />
                    {owing > 0 && <Badge label={`$${owing.toLocaleString()} Owing`} color="red" />}
                  </div>
                </div>
              </div>
              <span style={{ color: C.muted, fontSize: 18 }}>›</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const v = selected;
  const owing = v.history.filter(h => h.status === "Owing").reduce((s, h) => s + h.amount, 0);

  return (
    <div>
      <Breadcrumb items={[{ label: "Vendors", fn: () => setSelected(null) }, { label: v.name }]} />
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card>
            <Avatar name={v.name} size={48} bg="#ffedd5" fg="#c2410c" />
            <div style={{ color: C.text, fontWeight: 800, fontSize: 16, marginTop: 12 }}>{v.name}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 6, marginBottom: 16, alignItems: "center" }}>
              <Badge label={v.status} color="green" />
              <span style={{ color: "#f59e0b", fontSize: 13 }}>{[...Array(v.rank)].map(() => "★").join("")}</span>
            </div>
            <Field label="ABN" value={v.abn} />
            <Field label="Phone" value={v.phone} />
            <Field label="Email" value={v.email} />
            <Field label="Website" value={v.website} />
          </Card>
          <div style={{ background: owing > 0 ? "#fef2f2" : "#f0fdf4", border: `1px solid ${owing > 0 ? "#fecaca" : "#bbf7d0"}`, borderRadius: 12, padding: 18 }}>
            <div style={{ color: C.sub, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Account Balance</div>
            <div style={{ color: owing > 0 ? C.red : C.green, fontSize: 26, fontWeight: 900 }}>${owing > 0 ? owing.toLocaleString() : "0"}</div>
            <div style={{ color: C.sub, fontSize: 12, marginTop: 4 }}>{owing > 0 ? "Currently owing" : "Account clear"}</div>
          </div>
        </div>
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {["overview", "contacts", "catalogue", "history"].map(t => (
              <Pill key={t} label={t.charAt(0).toUpperCase() + t.slice(1)} active={vTab === t} onClick={() => setVTab(t)} />
            ))}
          </div>
          {vTab === "overview" && (
            <div style={{ display: "grid", gap: 14 }}>
              <Card>
                <SectionHead title="Quick Stats" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[["Products", v.catalogue.length], ["Contacts", v.contacts.length], ["Orders", v.history.length], ["Rank", `#${v.rank}`]].map(([k, val]) => (
                    <div key={k} style={{ background: C.raised, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px" }}>
                      <div style={{ color: C.sub, fontSize: 11, fontWeight: 600 }}>{k}</div>
                      <div style={{ color: C.text, fontWeight: 800, fontSize: 22, marginTop: 4 }}>{val}</div>
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <SectionHead title="Recent Orders" />
                {v.history.slice(0, 2).map(h => (
                  <div key={h.ref} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                    <div>
                      <div style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{h.ref} · {h.item}</div>
                      <div style={{ color: C.sub, fontSize: 11, marginTop: 2 }}>{h.date}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: C.text, fontWeight: 700 }}>${h.amount.toLocaleString()}</div>
                      <div style={{ marginTop: 4 }}><Badge label={h.status} color={h.status === "Paid" ? "green" : "red"} /></div>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          )}
          {vTab === "contacts" && (
            <Card>
              <SectionHead title="Contact People" action={{ label: "+ Add", fn: () => {} }} />
              {v.contacts.map((ct, i) => (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
                  <Avatar name={ct.name} size={38} bg="#dbeafe" fg="#1d4ed8" />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{ct.name}</div>
                    <div style={{ color: C.sub, fontSize: 12 }}>{ct.role}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: C.sub, fontSize: 12 }}>{ct.phone}</div>
                    <div style={{ color: C.sub, fontSize: 12 }}>{ct.email}</div>
                  </div>
                </div>
              ))}
            </Card>
          )}
          {vTab === "catalogue" && (
            <Card>
              <SectionHead title="Product Catalogue" action={{ label: "+ Add Product", fn: () => {} }} />
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {["SKU", "Product", "Price", "Unit"].map(h => (
                      <th key={h} style={{ padding: "8px 0", textAlign: "left", color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {v.catalogue.map(p => (
                    <tr key={p.sku} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: "11px 0", color: C.accent, fontWeight: 700, fontSize: 12 }}>{p.sku}</td>
                      <td style={{ padding: "11px 8px", color: C.text, fontSize: 13 }}>{p.name}</td>
                      <td style={{ padding: "11px 8px", color: C.green, fontWeight: 800, fontSize: 14 }}>${p.price.toLocaleString()}</td>
                      <td style={{ padding: "11px 0" }}><Badge label={p.unit} color="gray" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
          {vTab === "history" && (
            <Card>
              <SectionHead title="Purchase History" />
              {v.history.map(h => (
                <div key={h.ref} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div>
                    <div style={{ color: C.accent, fontWeight: 700, fontSize: 13 }}>{h.ref}</div>
                    <div style={{ color: C.text, fontSize: 13, marginTop: 2 }}>{h.item}</div>
                    <div style={{ color: C.sub, fontSize: 11, marginTop: 2 }}>{h.date}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: C.text, fontWeight: 800, fontSize: 15 }}>${h.amount.toLocaleString()}</div>
                    <div style={{ marginTop: 6 }}><Badge label={h.status} color={h.status === "Paid" ? "green" : "red"} /></div>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductsTab() {
  const allSkus = {};
  VENDORS.forEach(v => v.catalogue.forEach(p => {
    if (!allSkus[p.sku]) allSkus[p.sku] = { sku: p.sku, name: p.name, suppliers: [] };
    allSkus[p.sku].suppliers.push({ vendor: v.name, price: p.price, rank: v.rank });
  }));
  const products = Object.values(allSkus);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text }}>Product Catalogue</h2>
        <p style={{ color: C.sub, fontSize: 13, marginTop: 2 }}>Cross-supplier pricing comparison</p>
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {products.map(p => {
          const sorted = [...p.suppliers].sort((a, b) => a.price - b.price);
          const cheapest = sorted[0];
          return (
            <div key={p.sku} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <div style={{ color: C.accent, fontWeight: 700, fontSize: 11 }}>{p.sku}</div>
                  <div style={{ color: C.text, fontWeight: 700, fontSize: 15, marginTop: 2 }}>{p.name}</div>
                </div>
                <Badge label={`${p.suppliers.length} Supplier${p.suppliers.length > 1 ? "s" : ""}`} color={p.suppliers.length > 1 ? "blue" : "gray"} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {sorted.map((s, i) => (
                  <div key={s.vendor} style={{ flex: 1, background: i === 0 ? "#f0fdf4" : C.raised, border: `1px solid ${i === 0 ? "#bbf7d0" : C.border}`, borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ color: C.sub, fontSize: 12, fontWeight: 600 }}>{s.vendor}</div>
                      {i === 0 && <Badge label="Best Price" color="green" />}
                    </div>
                    <div style={{ color: i === 0 ? C.green : C.text, fontWeight: 900, fontSize: 20, marginTop: 6 }}>${s.price.toLocaleString()}</div>
                    <div style={{ color: C.sub, fontSize: 11, marginTop: 3 }}>Rank #{s.rank} supplier</div>
                    {i > 0 && <div style={{ color: C.red, fontSize: 11, marginTop: 3 }}>+${(s.price - cheapest.price).toLocaleString()} vs best</div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const NAV = [
  { id: "customers", icon: "🏢", label: "Companies & Tenants" },
  { id: "vendors",   icon: "📦", label: "Vendors & Suppliers" },
  { id: "products",  icon: "🔍", label: "Product Comparison" },
];

export default function App() {
  const [tab, setTab] = useState("customers");
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus { outline: none; border-color: #0ea5e9 !important; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
      `}</style>

      {/* Sidebar */}
      <div style={{ width: 230, background: C.sidebar, display: "flex", flexDirection: "column", padding: "0 0 24px", flexShrink: 0, minHeight: "100vh" }}>
        <div style={{ padding: "22px 20px 20px", borderBottom: "1px solid #334155" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🔥</div>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 15, letterSpacing: 0.3 }}>FieldPro</div>
              <div style={{ color: "#64748b", fontSize: 10, letterSpacing: 0.5 }}>CONTACTS MODULE</div>
            </div>
          </div>
        </div>
        <div style={{ padding: "16px 10px", flex: 1 }}>
          <div style={{ color: "#475569", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, padding: "0 10px", marginBottom: 8 }}>Contacts</div>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", background: tab === n.id ? "#334155" : "transparent", color: tab === n.id ? "#fff" : "#94a3b8", fontWeight: tab === n.id ? 700 : 500, fontSize: 13, cursor: "pointer", fontFamily: "inherit", textAlign: "left", marginBottom: 2 }}>
              <span style={{ fontSize: 15 }}>{n.icon}</span>
              {n.label}
            </button>
          ))}
        </div>
        <div style={{ padding: "0 12px" }}>
          <div style={{ background: "#334155", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 12 }}>AD</div>
            <div>
              <div style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>Admin User</div>
              <div style={{ color: "#64748b", fontSize: 11 }}>Manager</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflowY: "auto", padding: "32px 36px" }}>
        {tab === "customers" && <CustomersTab />}
        {tab === "vendors"   && <VendorsTab />}
        {tab === "products"  && <ProductsTab />}
      </div>
    </div>
  );
}
