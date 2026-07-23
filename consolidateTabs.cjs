const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'AdminDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add newUserRole state
content = content.replace(
  "const [newAgentEmail, setNewAgentEmail] = useState('');\n  const [newAgentName, setNewAgentName] = useState('');",
  "const [newAgentEmail, setNewAgentEmail] = useState('');\n  const [newAgentName, setNewAgentName] = useState('');\n  const [newUserRole, setNewUserRole] = useState('agent');"
);

// Update handleAddAgent
content = content.replace(
  /const handleAddAgent = \(e\) => \{[\s\S]*?addAgent\(newAgentEmail, newAgentName, sponsorData, coSponsorData\);[\s\S]*?setShowAddForm\(false\);\n    \}\n  \};/,
  `const handleAddAgent = async (e) => {
    e.preventDefault();
    if (newAgentEmail && newAgentName) {
      if (newUserRole === 'admin') {
        try {
          const { error } = await supabase.from('admins').insert([{ email: newAgentEmail }]);
          if (error) throw error;
          fetchAdmins();
          alert('Admin added successfully!');
        } catch (err) {
          alert('Error adding admin: ' + err.message);
          return;
        }
      } else {
        const sponsorData = { name: sponsorName, phone: sponsorPhone, email: sponsorEmail };
        let coSponsorData = null;
        if (coSponsorName) {
          coSponsorData = { name: coSponsorName, phone: coSponsorPhone, email: coSponsorEmail };
        }
        addAgent(newAgentEmail, newAgentName, sponsorData, coSponsorData);
      }
      
      setNewAgentEmail('');
      setNewAgentName('');
      setCoSponsorName('');
      setCoSponsorPhone('');
      setCoSponsorEmail('');
      setNewUserRole('agent');
      setShowAddForm(false);
    }
  };`
);

// Update Tabs UI
content = content.replace(
  /<div style=\{\{ \.\.\.styles\.tabsContainer, overflowX: 'auto', whiteSpace: 'nowrap' \}\}>[\s\S]*?<\/div>/,
  `<div style={{ ...styles.tabsContainer, overflowX: 'auto', whiteSpace: 'nowrap' }}>
        <button 
          style={{...styles.tabBtn, ...(activeTab === 'pipeline' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('pipeline')}
        >
          Agent Pipeline & Admins
        </button>
        <button 
          style={{...styles.tabBtn, ...(activeTab === 'community' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('community')}
        >
          Community Manager
        </button>
        <button 
          style={{...styles.tabBtn, ...(activeTab === 'calendar' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('calendar')}
        >
          Calendar
        </button>
        <button 
          style={{...styles.tabBtn, ...(activeTab === 'resources' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('resources')}
        >
          Resources & Playbooks
        </button>
        <button 
          style={{...styles.tabBtn, ...(activeTab === 'inbox' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('inbox')}
        >
          Inbox
        </button>
      </div>`
);

// Add Role Selector to Add Agent Form
content = content.replace(
  /<h3 className="text-lg mb-4 font-semibold text-dark-navy">Add New Agent<\/h3>\n\s*<form onSubmit=\{handleAddAgent\} style=\{styles\.addForm\}>\n\s*<div style=\{styles\.formSection\}>\n\s*<h4 className="text-sm font-semibold mb-2 text-dark-navy">Agent Details<\/h4>\n\s*<div style=\{styles\.formGrid\}>/,
  `<h3 className="text-lg mb-4 font-semibold text-dark-navy">Add New User</h3>
              <form onSubmit={handleAddAgent} style={styles.addForm}>
                <div style={styles.formSection}>
                  <h4 className="text-sm font-semibold mb-2 text-dark-navy">User Details</h4>
                  <div style={{...styles.formGrid, gridTemplateColumns: '1fr 1fr 1fr'}}>
                    <select style={styles.input} value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)}>
                      <option value="agent">Agent</option>
                      <option value="admin">Administrator</option>
                    </select>`
);

content = content.replace(
  /<input type="text" placeholder="Agent Name" style=\{styles\.input\} value=\{newAgentName\}/,
  `<input type="text" placeholder="Full Name" style={styles.input} value={newAgentName}`
);

content = content.replace(
  /<input type="email" placeholder="Agent Email Address" style=\{styles\.input\} value=\{newAgentEmail\}/,
  `<input type="email" placeholder="Email Address" style={styles.input} value={newAgentEmail}`
);


// Conditionally show sponsor inputs based on role
content = content.replace(
  /<div style=\{styles\.formSection\}>\n\s*<h4 className="text-sm font-semibold mb-2 text-dark-navy">Primary Sponsor<\/h4>/g,
  `{newUserRole === 'agent' && (
                <div style={styles.formSection}>
                  <h4 className="text-sm font-semibold mb-2 text-dark-navy">Primary Sponsor</h4>`
);

content = content.replace(
  /<div style=\{styles\.formSection\}>\n\s*<h4 className="text-sm font-semibold mb-2 text-dark-navy">Co-Sponsor \(Optional\)<\/h4>/g,
  `<div style={styles.formSection}>
                  <h4 className="text-sm font-semibold mb-2 text-dark-navy">Co-Sponsor (Optional)</h4>`
);

content = content.replace(
  /setCoSponsorEmail\(e\.target\.value\)\} \/>\n\s*<\/div>\n\s*<\/div>/,
  `setCoSponsorEmail(e.target.value)} />
                  </div>
                </div>
              )}`
);

// Render Feed Preview inside Community Manager
content = content.replace(
  /\{activeTab === 'community' && \([\s\S]*?className="btn-primary">Post Content<\/button>\n\s*<\/div>\n\s*<\/form>\n\s*<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*\)/,
  match => match.replace(
    /<\/div>\n\s*\)$/,
    `</div>\n
          <div className="card mt-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Video size={20} className="text-primary" />
              Live Feed Preview
            </h2>
            <div style={{ maxWidth: '600px', margin: '0 auto', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'var(--color-bg-secondary)' }}>
              <CommunityFeed />
            </div>
          </div>\n        </div>\n      )`
  )
);

// Render Playbooks inside Resources
content = content.replace(
  /\{activeTab === 'resources' && \([\s\S]*?<\/div>\n\s*\)/,
  match => match.replace(
    /<\/div>\n\s*\)$/,
    `</div>\n
          <div className="mt-8">
            <PlaybookManager />
          </div>\n        </div>\n      )`
  )
);

// Render Admin List inside Pipeline Tab (Bottom)
content = content.replace(
  /\{agents\.length === 0 && \([\s\S]*?<\/table>\n\s*<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*\)/,
  match => match.replace(
    /<\/div>\n\s*\)$/,
    `</div>\n
          <div className="card mt-8">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Shield size={20} className="text-primary"/> Administrator List</h3>
            {loadingAdmins ? (
              <p>Loading...</p>
            ) : (
              <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                    <tr>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem' }}>Email</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.875rem' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>brian@brianburds.com (Master)</td>
                      <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', textAlign: 'right' }}>--</td>
                    </tr>
                    {adminsList.map((admin, idx) => {
                      if (admin.email === 'brian@brianburds.com') return null;
                      return (
                        <tr key={idx}>
                          <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>{admin.email}</td>
                          <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', textAlign: 'right' }}>
                            <button 
                              onClick={() => handleRemoveAdmin(admin.email)}
                              style={{ color: 'var(--color-danger)', fontSize: '0.875rem' }}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>\n        </div>\n      )`
  )
);

// Remove Feed Preview standalone tab
content = content.replace(/\{activeTab === 'feed-preview' && \([\s\S]*?<\/div>\n\s*\)/, '');

// Remove Playbooks standalone tab
content = content.replace(/\{activeTab === 'playbooks' && \([\s\S]*?<\/div>\n\s*\)/, '');

// Remove Admins standalone tab
content = content.replace(/\{activeTab === 'admins' && \([\s\S]*?<\/div>\n\s*\)/, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Tabs consolidated successfully.');
