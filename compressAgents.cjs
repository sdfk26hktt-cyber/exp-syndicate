const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'AdminDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove KanbanBoard import and usage
content = content.replace(/import KanbanBoard from '\.\/KanbanBoard';\n/, '');
content = content.replace(/<div className="card mb-6">\n\s*<div style=\{styles\.tableHeader\}>\n\s*<div>\n\s*<h2 className="text-lg m-0">Agent Progress Board<\/h2>\n\s*<p className="text-muted text-sm" style=\{\{margin: 0\}\}>Track onboarding playbook progress\.<\/p>\n\s*<\/div>\n\s*<div>\n\s*<input type="text" placeholder="Search agents\.\.\." style=\{styles\.searchInput\} \/>\n\s*<\/div>\n\s*<\/div>\n\s*<KanbanBoard \/>\n\s*<\/div>/, '');

// 2. Add expandedGroups state
content = content.replace(
  /const \[eventFilterYear, setEventFilterYear\] = useState\(new Date\(\)\.getFullYear\(\)\.toString\(\)\);/,
  `const [eventFilterYear, setEventFilterYear] = useState(new Date().getFullYear().toString());
  
  const [expandedAgentGroups, setExpandedAgentGroups] = useState({
    onboarding: true,
    flex_agent: false,
    team_agent: false
  });
  
  const toggleAgentGroup = (group) => {
    setExpandedAgentGroups(prev => ({...prev, [group]: !prev[group]}));
  };`
);

// 3. Replace Agent Directory Table Body
const agentRowRenderer = `
                  {agents.map(a => (
                    <tr key={a.id} style={styles.roleTr}>
                      <td style={styles.roleTd}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                          <div style={{width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold'}}>
                            {(a.name || '?').charAt(0)}
                          </div>
                          {a.name || 'Unknown Agent'}
                        </div>
                      </td>
                      <td style={styles.roleTd}>{a.id}</td>
                      <td style={styles.roleTd}>
                        <select 
                          value={a.status || 'onboarding'} 
                          onChange={(e) => updateAgentStatus(a.id, e.target.value)}
                          style={styles.roleSelect}
                        >
                          <option value="onboarding">Onboarding</option>
                          <option value="flex_agent">Flex Agent</option>
                          <option value="team_agent">Team Agent</option>
                        </select>
                      </td>
                      <td style={styles.roleTd}>{a.xp}</td>
                      <td style={styles.roleTd}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            onClick={() => {
                              setEditingAgent(a);
                              setEditAgentName(a.name || '');
                              setEditAgentPhone(a.profile?.phone || '');
                              setEditAgentLicense(a.profile?.licenseNumber || '');
                            }}
                            className="btn-secondary"
                            style={{ padding: '0.4rem', fontSize: '0.8rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
                          >
                            <Edit2 size={14} /> Edit
                          </button>
                          <button 
                            onClick={() => emulateUser(a)}
                            className="btn-secondary"
                            style={{ padding: '0.4rem', fontSize: '0.8rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
                          >
                            <LogIn size={14} /> Log In As
                          </button>
                          <button 
                            onClick={() => {
                              if (window.confirm(\`Are you sure you want to delete \${a.name}? This action cannot be undone.\`)) {
                                deleteAgent(a.id);
                              }
                            }}
                            className="btn-secondary"
                            style={{ padding: '0.4rem', fontSize: '0.8rem', display: 'flex', gap: '0.25rem', alignItems: 'center', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
`;

const newTableBody = `
                  {['onboarding', 'flex_agent', 'team_agent'].map(groupKey => {
                    const groupTitle = groupKey === 'onboarding' ? 'Onboarding' : groupKey === 'flex_agent' ? 'Flex Agents' : 'Team Agents';
                    const groupAgents = agents.filter(a => (a.status || 'onboarding') === groupKey);
                    
                    return (
                      <React.Fragment key={groupKey}>
                        <tr 
                          onClick={() => toggleAgentGroup(groupKey)}
                          style={{ cursor: 'pointer', backgroundColor: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}
                        >
                          <td colSpan="5" style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: 'var(--color-dark-navy)' }}>
                            {expandedAgentGroups[groupKey] ? '▼' : '▶'} {groupTitle} ({groupAgents.length})
                          </td>
                        </tr>
                        {expandedAgentGroups[groupKey] && groupAgents.length === 0 && (
                          <tr>
                            <td colSpan="5" style={{...styles.roleTd, textAlign: 'center', color: 'var(--color-text-muted)'}}>No agents in this group.</td>
                          </tr>
                        )}
                        {expandedAgentGroups[groupKey] && groupAgents.map(a => (
                          <tr key={a.id} style={styles.roleTr}>
                            <td style={styles.roleTd}>
                              <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                                <div style={{width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold'}}>
                                  {(a.name || '?').charAt(0)}
                                </div>
                                {a.name || 'Unknown Agent'}
                              </div>
                            </td>
                            <td style={styles.roleTd}>{a.id}</td>
                            <td style={styles.roleTd}>
                              <select 
                                value={a.status || 'onboarding'} 
                                onChange={(e) => updateAgentStatus(a.id, e.target.value)}
                                style={styles.roleSelect}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <option value="onboarding">Onboarding</option>
                                <option value="flex_agent">Flex Agent</option>
                                <option value="team_agent">Team Agent</option>
                              </select>
                            </td>
                            <td style={styles.roleTd}>{a.xp || 0}</td>
                            <td style={styles.roleTd}>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingAgent(a);
                                    setEditAgentName(a.name || '');
                                    setEditAgentPhone(a.profile?.phone || '');
                                    setEditAgentLicense(a.profile?.licenseNumber || '');
                                  }}
                                  className="btn-secondary"
                                  style={{ padding: '0.4rem', fontSize: '0.8rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
                                >
                                  <Edit2 size={14} /> Edit
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); emulateUser(a); }}
                                  className="btn-secondary"
                                  style={{ padding: '0.4rem', fontSize: '0.8rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
                                >
                                  <LogIn size={14} /> Log In As
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm(\`Are you sure you want to delete \${a.name}? This action cannot be undone.\`)) {
                                      deleteAgent(a.id);
                                    }
                                  }}
                                  className="btn-secondary"
                                  style={{ padding: '0.4rem', fontSize: '0.8rem', display: 'flex', gap: '0.25rem', alignItems: 'center', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                                >
                                  <Trash2 size={14} /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                  {agents.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{...styles.roleTd, textAlign: 'center', color: 'var(--color-text-muted)'}}>No agents found. Invite one above!</td>
                    </tr>
                  )}
`;

content = content.replace(
  /<tbody>[\s\S]*?\{agents\.length === 0 && \([\s\S]*?<\/tr>\n\s*\)\}\n\s*<\/tbody>/,
  `<tbody>\n${newTableBody}\n                </tbody>`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Agents list compressed successfully.');
