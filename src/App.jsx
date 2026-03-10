import { useState } from "react";

const C = {
  bg:      "#080c14",
  surface: "#0e1420",
  card:    "#111827",
  raised:  "#161e2e",
  border:  "#1e2d45",
  accent:  "#0ea5e9",
  accentD: "#0284c7",
  orange:  "#f97316",
  green:   "#10b981",
  red:     "#f43f5e",
  yellow:  "#f59e0b",
  purple:  "#a855f7",
  text:    "#f0f4f8",
  sub:     "#94a3b8",
  muted:   "#4a5568",
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
    email: "trade@thegoodguys.com.au", website: "thegoodguys.com.au",
    rank: 1, status: "Active",
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
    email: "commercial@harveynorman.com.au", website: "harveynorman.com.au",
    rank: 2, status: "Active",
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
    email: "trade@reece.com.au", website: "reece.com.au",
    rank: 1, status: "Active",
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
    green:  { bg: "#052e16", text: "#4ade80" },
    blue:   { bg: "#0c1a2e", text: "#38bdf8" },
    orange: { bg: "#431407", text: "#fb923c" },
    red:    { bg: "#4c0519", text: "#fb7185" },
    purple: { bg: "#2e1065", text: "#c084fc" },
    gray:   { bg: "#1e293b", text: "#94a3b8" },
  };
  const s = map[color] || map.gray;
  return <span style={{ background: s.bg, color: s.text, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 0.4 }}>{label}</span>;
};

const Avatar = ({ name, size = 36, color = C.accent }) => {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: size * 0.33, flexShrink: 0 }}>
      {initials}
    </div>
  );
};

const Pill = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ padding: "7px 18px", borderRadius: 99, border: `1px solid ${active ? C.accent : C.border}`, background: active ? `${C.accent}22` : "transparent", color: active ? C.accent : C.sub, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
    {label}
  </button>
);

const Field = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
    <span style={{ color: C.muted, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</span>
    <span style={{ color: C.text, fontSize: 13, fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>{value}</span>
  </div>
);

const SectionHead = ({ title, count, action }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ color: C.text, fontWeight: 800, fontSize: 14, fontFamily: "'Syne', sans-serif" }}>{title}</span>
      {count !== undefined && <span style={{ background: C.raised, color: C.sub, borderRadius: 99, padding: "2px 9px", fontSize: 11, fontWeight: 700 }}>{count}</span>}
    </div>
    {action && <button onClick={action.fn} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 7, padding: "6px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{action.label}</button>}
  </div>
);

const InfoCard = ({ title, children, action }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22, marginBottom: 14 }}>
    <SectionHead title={title} action={action} />
    {children}
  </div>
);

const Breadcrumb = ({ items }) => (
  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
    {items.map((item, i) => (
      <span key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {i < items.length - 1
          ? <button onClick={item.fn} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit", padding: 0 }}>{item.label}</button>
          : <span style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>{item.label}</span>
        }
        {i < items.length - 1 && <span style={{ color: C.muted }}>›</span>}
      </span>
    ))}
  </div>
);

function CustomersTab() {
  const [view, setView]       = useState("list");
  const [company, setCompany] = useState(null);
  const [branch, setBranch]   = useState(null);
  const [agent, setAgent]     = useState(null);
  const [search, setSearch]   = useState("");

  const goCompany = (c) => { setCompany(c); setBranch(null); setAgent(null); setView("company"); };
  const goBranch  = (b) => { setBranch(b); setAgent(null); setView("branch"); };
  const goAgent   = (a) => { setAgent(a); setView("agent"); };

  const filtered = COMPANIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  if (view === "list") return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Syne', sans-serif" }}>Companies</h2>
        <button style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 9, padding: "9px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>+ Add Company</button>
      </div>
      <input placeholder="Search companies…" value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: "100%", background: C.raised, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 16px", color: C.text, fontSize: 13, marginBottom: 16, fontFamily: "inherit", boxSizing: "border-box" }} />
      <div style={{ display: "grid", gap: 12 }}>
        {filtered.map(co => (
          <div key={co.id} onClick={() => goCompany(co)}
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 24px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <Avatar name={co.name} size={46} color="#1e3a5f" />
              <div>
                <div style={{ color: C.text, fontWeight: 800, fontSize: 15, fontFamily: "'Syne', sans-serif" }}>{co.name}</div>
                <div style={{ color: C.sub, fontSize: 12, marginTop: 3 }}>{co.email} · ABN {co.abn}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <Badge label={`${co.branches.length} Branches`} color="blue" />
                  <Badge label={co.status} color="green" />
                </div>
              </div>
            </div>
            <div style={{ color: C.muted, fontSize: 20 }}>›</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (view === "company" && company) return (
    <div>
      <Breadcrumb items={[{ label: "Companies", fn: () => setView("list") }, { label: company.name }]} />
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, marginTop: 20 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24 }}>
          <Avatar name={company.name} size={52} color="#1e3a5f" />
          <div style={{ color: C.text, fontWeight: 800, fontSize: 18, fontFamily: "'Syne', sans-serif", marginTop: 14 }}>{company.name}</div>
          <div style={{ marginTop: 8, marginBottom: 20 }}><Badge label={company.status} color="green" /></div>
          <Field label="ABN" value={company.abn} />
          <Field label="Phone" value={company.phone} />
          <Field label="Email" value={company.email} />
          <Field label="Website" value={company.website} />
          <Field label="Branches" value={company.branches.length} />
        </div>
        <div>
          <SectionHead title="Branches" count={company.branches.length} action={{ label: "+ Add Branch", fn: () => {} }} />
          <div style={{ display: "grid", gap: 10 }}>
            {company.branches.map(b => {
              const tenantCount = b.agents.reduce((s, a) => s + a.tenants.length, 0);
              return (
                <div key={b.id} onClick={() => goBranch(b)}
                  style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: "18px 22px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                  <div>
                    <div style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{b.name}</div>
                    <div style={{ color: C.sub, fontSize: 12, marginTop: 3 }}>{b.address}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <Badge label={`${b.agents.length} Agents`} color="purple" />
                      <Badge label={`${tenantCount} Tenants`} color="blue" />
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: C.sub, fontSize: 12, marginBottom: 4 }}>Billing</div>
                    <div style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{b.billing.name}</div>
                    <div style={{ color: C.sub, fontSize: 11 }}>{b.billing.email}</div>
                  </div>
                  <div style={{ color: C.muted, fontSize: 20 }}>›</div>
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
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20, marginTop: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22 }}>
            <div style={{ color: C.sub, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>Branch Info</div>
            <div style={{ color: C.text, fontWeight: 800, fontSize: 16, fontFamily: "'Syne', sans-serif", marginBottom: 14 }}>{branch.name}</div>
            <Field label="Address" value={branch.address} />
            <Field label="Phone" value={branch.phone} />
            <Field label="Email" value={branch.email} />
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22 }}>
            <div style={{ color: C.sub, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>💳 Billing Contact</div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Avatar name={branch.billing.name} size={38} color={C.orange} />
              <div>
                <div style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{branch.billing.name}</div>
                <div style={{ color: C.sub, fontSize: 11 }}>{branch.billing.email}</div>
                <div style={{ color: C.sub, fontSize: 11 }}>{branch.billing.phone}</div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <SectionHead title="Property Agents" count={branch.agents.length} action={{ label: "+ Add Agent", fn: () => {} }} />
          <div style={{ display: "grid", gap: 10 }}>
            {branch.agents.map(a => (
              <div key={a.id} onClick={() => goAgent(a)}
                style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: "18px 22px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.purple}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <Avatar name={a.name} size={40} color={C.purple} />
                  <div>
                    <div style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{a.name}</div>
                    <div style={{ color: C.sub, fontSize: 12 }}>{a.email}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <Badge label={`${a.properties} Properties`} color="purple" />
                      <Badge label={`${a.tenants.length} Tenants`} color="blue" />
                    </div>
                  </div>
                </div>
                <div style={{ color: C.muted, fontSize: 20 }}>›</div>
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
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20, marginTop: 20 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24 }}>
          <Avatar name={agent.name} size={52} color={C.purple} />
          <div style={{ color: C.text, fontWeight: 800, fontSize: 18, fontFamily: "'Syne', sans-serif", marginTop: 14 }}>{agent.name}</div>
          <div style={{ marginTop: 8, marginBottom: 20 }}><Badge label="Property Agent" color="purple" /></div>
          <Field label="Email" value={agent.email} />
          <Field label="Phone" value={agent.phone} />
          <Field label="Properties" value={agent.properties} />
          <Field label="Active Tenants" value={agent.tenants.length} />
          <Field label="Branch" value={branch.name} />
          <Field label="Company" value={company.name} />
        </div>
        <div>
          <SectionHead title="Tenants" count={agent.tenants.length} action={{ label: "+ Add Tenant", fn: () => {} }} />
          <div style={{ display: "grid", gap: 10 }}>
            {agent.tenants.map(t => (
              <div key={t.id + agent.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: "18px 22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <Avatar name={t.name} size={40} color={C.green} />
                    <div>
                      <div style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                      <div style={{ color: C.sub, fontSize: 12 }}>{t.email} · {t.phone}</div>
                      <div style={{ color: C.sub, fontSize: 12, marginTop: 4 }}>🏠 {t.property}</div>
                    </div>
                  </div>
                  <Badge label={t.status} color="green" />
                </div>
                {t.id === "t2" && (
                  <div style={{ marginTop: 12, padding: "8px 12px", background: C.raised, borderRadius: 8, fontSize: 11, color: C.sub }}>
                    ⚠️ Also managed by <strong style={{ color: C.text }}>Sofia Reyes</strong>
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
  const [vendorTab, setVendorTab] = useState("overview");

  if (!selected) return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Syne', sans-serif" }}>Vendors & Suppliers</h2>
        <button style={{ background: C.orange, color: "#fff", border: "none", borderRadius: 9, padding: "9px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>+ Add Vendor</button>
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {VENDORS.map(v => {
          const owing = v.history.filter(h => h.status === "Owing").reduce((s, h) => s + h.amount, 0);
          return (
            <div key={v.id} onClick={() => { setSelected(v); setVendorTab("overview"); }}
              style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 24px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.orange}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <Avatar name={v.name} size={46} color="#431407" />
                <div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ color: C.text, fontWeight: 800, fontSize: 15, fontFamily: "'Syne', sans-serif" }}>{v.name}</div>
                    {[...Array(v.rank)].map((_, i) => <span key={i} style={{ color: C.yellow, fontSize: 12 }}>★</span>)}
                  </div>
                  <div style={{ color: C.sub, fontSize: 12, marginTop: 3 }}>{v.email} · ABN {v.abn}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <Badge label={`${v.catalogue.length} Products`} color="orange" />
                    <Badge label={`${v.contacts.length} Contacts`} color="blue" />
                    {owing > 0 && <Badge label={`$${owing.toLocaleString()} Owing`} color="red" />}
                  </div>
                </div>
              </div>
              <div style={{ color: C.muted, fontSize: 20 }}>›</div>
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
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, marginTop: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22 }}>
            <Avatar name={v.name} size={50} color="#431407" />
            <div style={{ color: C.text, fontWeight: 800, fontSize: 17, fontFamily: "'Syne', sans-serif", marginTop: 14 }}>{v.name}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 8, marginBottom: 18 }}>
              <Badge label={v.status} color="green" />
              <div style={{ display: "flex", gap: 2 }}>{[...Array(v.rank)].map((_, i) => <span key={i} style={{ color: C.yellow, fontSize: 13 }}>★</span>)}</div>
            </div>
            <Field label="ABN" value={v.abn} />
            <Field label="Phone" value={v.phone} />
            <Field label="Email" value={v.email} />
            <Field label="Website" value={v.website} />
          </div>
          <div style={{ background: owing > 0 ? "#1a0a0a" : C.card, border: `1px solid ${owing > 0 ? C.red : C.border}`, borderRadius: 14, padding: 22 }}>
            <div style={{ color: C.sub, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Account Balance</div>
            <div style={{ color: owing > 0 ? C.red : C.green, fontSize: 28, fontWeight: 900, fontFamily: "'Syne', sans-serif" }}>${owing > 0 ? owing.toLocaleString() : "0"}</div>
            <div style={{ color: C.sub, fontSize: 12, marginTop: 4 }}>{owing > 0 ? "Currently owing" : "Account clear"}</div>
          </div>
        </div>
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {["overview", "contacts", "catalogue", "history"].map(t => (
              <Pill key={t} label={t.charAt(0).toUpperCase() + t.slice(1)} active={vendorTab === t} onClick={() => setVendorTab(t)} />
            ))}
          </div>

          {vendorTab === "overview" && (
            <div style={{ display: "grid", gap: 14 }}>
              <InfoCard title="Quick Stats">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[["Products supplied", v.catalogue.length], ["Contact people", v.contacts.length], ["Purchase orders", v.history.length], ["Preferred rank", `#${v.rank}`]].map(([k, val]) => (
                    <div key={k} style={{ background: C.raised, borderRadius: 10, padding: "14px 16px" }}>
                      <div style={{ color: C.sub, fontSize: 11 }}>{k}</div>
                      <div style={{ color: C.text, fontWeight: 800, fontSize: 20, fontFamily: "'Syne', sans-serif", marginTop: 4 }}>{val}</div>
                    </div>
                  ))}
                </div>
              </InfoCard>
              <InfoCard title="Recent Purchase Orders">
                {v.history.slice(0, 2).map(h => (
                  <div key={h.ref} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                    <div>
                      <div style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{h.ref} · {h.item}</div>
                      <div style={{ color: C.sub, fontSize: 11, marginTop: 2 }}>{h.date}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: C.text, fontWeight: 800 }}>${h.amount.toLocaleString()}</div>
                      <Badge label={h.status} color={h.status === "Paid" ? "green" : "red"} />
                    </div>
                  </div>
                ))}
              </InfoCard>
            </div>
          )}

          {vendorTab === "contacts" && (
            <InfoCard title="Contact People" action={{ label: "+ Add Contact", fn: () => {} }}>
              {v.contacts.map((ct, i) => (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "center", padding: "14px 0", borderBottom: `1px solid ${C.border}` }}>
                  <Avatar name={ct.name} size={40} color={C.accentD} />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{ct.name}</div>
                    <div style={{ color: C.sub, fontSize: 12 }}>{ct.role}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: C.sub, fontSize: 12 }}>{ct.phone}</div>
                    <div style={{ color: C.sub, fontSize: 12 }}>{ct.email}</div>
                  </div>
                </div>
              ))}
            </InfoCard>
          )}

          {vendorTab === "catalogue" && (
            <InfoCard title="Product Catalogue" action={{ label: "+ Add Product", fn: () => {} }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["SKU", "Product", "Unit Price", "Unit"].map(h => (
                      <th key={h} style={{ padding: "8px 0", textAlign: "left", color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, borderBottom: `1px solid ${C.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {v.catalogue.map(p => (
                    <tr key={p.sku} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: "12px 0", color: C.accent, fontWeight: 700, fontSize: 12 }}>{p.sku}</td>
                      <td style={{ padding: "12px 8px", color: C.text, fontSize: 13 }}>{p.name}</td>
                      <td style={{ padding: "12px 8px", color: C.green, fontWeight: 800, fontSize: 14 }}>${p.price.toLocaleString()}</td>
                      <td style={{ padding: "12px 0" }}><Badge label={p.unit} color="gray" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </InfoCard>
          )}

          {vendorTab === "history" && (
            <InfoCard title="Purchase History">
              {v.history.map(h => (
                <div key={h.ref} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div>
                    <div style={{ color: C.accent, fontWeight: 700, fontSize: 13 }}>{h.ref}</div>
                    <div style={{ color: C.text, fontSize: 13, marginTop: 2 }}>{h.item}</div>
                    <div style={{ color: C.sub, fontSize: 11, marginTop: 2 }}>{h.date}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: C.text, fontWeight: 800, fontSize: 16 }}>${h.amount.toLocaleString()}</div>
                    <div style={{ marginTop: 6 }}><Badge label={h.status} color={h.status === "Paid" ? "green" : "red"} /></div>
                  </div>
                </div>
              ))}
            </InfoCard>
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Syne', sans-serif" }}>Product Catalogue</h2>
        <span style={{ color: C.sub, fontSize: 13 }}>Cross-supplier pricing comparison</span>
      </div>
      <div style={{ display: "grid", gap: 14 }}>
        {products.map(p => {
          const sorted = [...p.suppliers].sort((a, b) => a.price - b.price);
          const cheapest = sorted[0];
          return (
            <div key={p.sku} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ color: C.accent, fontWeight: 700, fontSize: 12 }}>{p.sku}</div>
                  <div style={{ color: C.text, fontWeight: 800, fontSize: 16, fontFamily: "'Syne', sans-serif", marginTop: 4 }}>{p.name}</div>
                </div>
                <Badge label={`${p.suppliers.length} Supplier${p.suppliers.length > 1 ? "s" : ""}`} color={p.suppliers.length > 1 ? "blue" : "gray"} />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                {sorted.map((s, i) => (
                  <div key={s.vendor} style={{ flex: 1, background: i === 0 ? "#0c2010" : C.raised, border: `1px solid ${i === 0 ? C.green : C.border}`, borderRadius: 10, padding: "12px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ color: C.sub, fontSize: 12, fontWeight: 600 }}>{s.vendor}</div>
                      {i === 0 && <Badge label="Best Price" color="green" />}
                    </div>
                    <div style={{ color: i === 0 ? C.green : C.text, fontWeight: 900, fontSize: 22, fontFamily: "'Syne', sans-serif", marginTop: 8 }}>${s.price.toLocaleString()}</div>
                    <div style={{ color: C.sub, fontSize: 11, marginTop: 4 }}>Rank #{s.rank} supplier</div>
                    {i > 0 && <div style={{ color: C.red, fontSize: 11, marginTop: 4 }}>+${(s.price - cheapest.price).toLocaleString()} vs best</div>}
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

const TABS = [
  { id: "customers", label: "🏢 Companies & Tenants" },
  { id: "vendors",   label: "📦 Vendors & Suppliers" },
  { id: "products",  label: "🔍 Product Comparison" },
];

export default function App() {
  const [tab, setTab] = useState("customers");
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus { outline: none; border-color: #0ea5e9 !important; }
      `}</style>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 40px", display: "flex", alignItems: "center", height: 58 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 40 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🔥</div>
          <span style={{ color: C.text, fontWeight: 800, fontSize: 15, fontFamily: "'Syne', sans-serif", letterSpacing: 0.3 }}>FIELDPRO</span>
          <span style={{ color: C.muted, fontSize: 12, marginLeft: 4 }}>/ Contacts</span>
        </div>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ height: "100%", padding: "0 20px", background: "none", border: "none", borderBottom: `2px solid ${tab === t.id ? C.accent : "transparent"}`, color: tab === t.id ? C.accent : C.sub, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 40px" }}>
        {tab === "customers" && <CustomersTab />}
        {tab === "vendors"   && <VendorsTab />}
        {tab === "products"  && <ProductsTab />}
      </div>
    </div>
  );
}
