import React, { useState } from 'react';
import { useAgent } from '../context/AgentContext';
import { Save, Plus, Edit, Trash2, ChevronDown, ChevronUp, GripVertical, X } from 'lucide-react';

const PlaybookManager = () => {
  const { globalPlaybooks, updateGlobalPlaybooks } = useAgent();
  const [playbooks, setPlaybooks] = useState(globalPlaybooks);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedPhase, setExpandedPhase] = useState(null);

  const handleSave = async () => {
    setIsSaving(true);
    await updateGlobalPlaybooks(playbooks);
    setIsSaving(false);
    alert('Global Playbook Updated Successfully!');
  };

  const addPhase = () => {
    const newId = `phase-${Date.now()}`;
    setPlaybooks([...playbooks, {
      id: newId,
      title: 'New Phase',
      description: 'Phase Description',
      items: []
    }]);
  };

  const deletePhase = (index) => {
    if (window.confirm("Are you sure you want to delete this phase?")) {
      const newPlaybooks = [...playbooks];
      newPlaybooks.splice(index, 1);
      setPlaybooks(newPlaybooks);
    }
  };

  const updatePhase = (index, field, value) => {
    const newPlaybooks = [...playbooks];
    newPlaybooks[index][field] = value;
    setPlaybooks(newPlaybooks);
  };

  const addItem = (phaseIndex) => {
    const newPlaybooks = [...playbooks];
    newPlaybooks[phaseIndex].items.push({
      id: `item-${Date.now()}`,
      text: 'New Task',
      completed: false,
      xp: 10,
      details: 'Task details here.',
      currentStepIndex: 0,
      steps: []
    });
    setPlaybooks(newPlaybooks);
  };

  const deleteItem = (phaseIndex, itemIndex) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      const newPlaybooks = [...playbooks];
      newPlaybooks[phaseIndex].items.splice(itemIndex, 1);
      setPlaybooks(newPlaybooks);
    }
  };

  const updateItem = (phaseIndex, itemIndex, field, value) => {
    const newPlaybooks = [...playbooks];
    newPlaybooks[phaseIndex].items[itemIndex][field] = value;
    setPlaybooks(newPlaybooks);
  };

  const addStep = (phaseIndex, itemIndex) => {
    const newPlaybooks = [...playbooks];
    if (!newPlaybooks[phaseIndex].items[itemIndex].steps) {
      newPlaybooks[phaseIndex].items[itemIndex].steps = [];
    }
    newPlaybooks[phaseIndex].items[itemIndex].steps.push({
      title: 'New Step',
      instruction: 'Step instruction'
    });
    setPlaybooks(newPlaybooks);
  };

  const deleteStep = (phaseIndex, itemIndex, stepIndex) => {
    const newPlaybooks = [...playbooks];
    newPlaybooks[phaseIndex].items[itemIndex].steps.splice(stepIndex, 1);
    setPlaybooks(newPlaybooks);
  };

  const updateStep = (phaseIndex, itemIndex, stepIndex, field, value) => {
    const newPlaybooks = [...playbooks];
    newPlaybooks[phaseIndex].items[itemIndex].steps[stepIndex][field] = value;
    setPlaybooks(newPlaybooks);
  };

  const movePhase = (index, direction) => {
    if ((direction === -1 && index === 0) || (direction === 1 && index === playbooks.length - 1)) return;
    const newPlaybooks = [...playbooks];
    const temp = newPlaybooks[index];
    newPlaybooks[index] = newPlaybooks[index + direction];
    newPlaybooks[index + direction] = temp;
    setPlaybooks(newPlaybooks);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 className="text-2xl font-bold">Global Playbook Manager</h2>
          <p className="text-muted">Changes saved here will instantly push to all agents.</p>
        </div>
        <button className="btn-primary" onClick={handleSave} disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--color-success)' }}>
          <Save size={20} />
          {isSaving ? 'Saving...' : 'Publish Global Playbook'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {playbooks.map((phase, pIdx) => {
          const isExpanded = expandedPhase === pIdx;
          return (
            <div key={phase.id} style={{ border: '1px solid var(--color-border)', borderRadius: '8px', backgroundColor: 'white', overflow: 'hidden' }}>
              
              {/* Phase Header */}
              <div 
                style={{ padding: '1rem 1.5rem', backgroundColor: 'rgba(0,0,0,0.02)', borderBottom: isExpanded ? '1px solid var(--color-border)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setExpandedPhase(isExpanded ? null : pIdx)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <button onClick={(e) => { e.stopPropagation(); movePhase(pIdx, -1); }} disabled={pIdx === 0} style={{ border: 'none', background: 'none', cursor: pIdx === 0 ? 'default' : 'pointer', opacity: pIdx === 0 ? 0.2 : 1 }}><ChevronUp size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); movePhase(pIdx, 1); }} disabled={pIdx === playbooks.length - 1} style={{ border: 'none', background: 'none', cursor: pIdx === playbooks.length - 1 ? 'default' : 'pointer', opacity: pIdx === playbooks.length - 1 ? 0.2 : 1 }}><ChevronDown size={16} /></button>
                  </div>
                  {isExpanded ? (
                    <input 
                      type="text" 
                      value={phase.title} 
                      onChange={(e) => updatePhase(pIdx, 'title', e.target.value)} 
                      onClick={(e) => e.stopPropagation()}
                      style={{ fontSize: '1.25rem', fontWeight: 'bold', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '0.25rem 0.5rem', width: '300px' }}
                    />
                  ) : (
                    <h3 className="text-xl font-bold">{phase.title}</h3>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button onClick={(e) => { e.stopPropagation(); deletePhase(pIdx); }} style={{ color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={20} /></button>
                  {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </div>
              </div>

              {/* Phase Content */}
              {isExpanded && (
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>Phase Description</label>
                    <input 
                      type="text" 
                      value={phase.description} 
                      onChange={(e) => updatePhase(pIdx, 'description', e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                    />
                  </div>

                  <h4 className="font-bold mb-4" style={{ color: 'var(--color-slate-blue)' }}>Tasks in this Phase</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {phase.items.map((item, iIdx) => (
                      <div key={item.id} style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1rem', backgroundColor: '#f9fafb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                          <div style={{ flex: 1, display: 'flex', gap: '1rem' }}>
                            <div style={{ flex: 2 }}>
                              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold' }}>Task Name</label>
                              <input 
                                type="text" 
                                value={item.text} 
                                onChange={(e) => updateItem(pIdx, iIdx, 'text', e.target.value)}
                                style={{ width: '100%', padding: '0.25rem 0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                              />
                            </div>
                            <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold' }}>XP Reward</label>
                              <input 
                                type="number" 
                                value={item.xp} 
                                onChange={(e) => updateItem(pIdx, iIdx, 'xp', parseInt(e.target.value))}
                                style={{ width: '80px', padding: '0.25rem 0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                              />
                            </div>
                          </div>
                          <button onClick={() => deleteItem(pIdx, iIdx)} style={{ color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        
                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold' }}>Task Details (Simple view)</label>
                          <textarea 
                            value={item.details} 
                            onChange={(e) => updateItem(pIdx, iIdx, 'details', e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px', minHeight: '60px' }}
                          />
                        </div>

                        {/* Interactive Steps */}
                        <div style={{ borderTop: '1px dashed var(--color-border)', paddingTop: '1rem' }}>
                          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Interactive Pop-out Steps</label>
                          {(item.steps || []).length === 0 ? (
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>No interactive steps. This task will just show the Task Details.</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                              {(item.steps || []).map((step, sIdx) => (
                                <div key={sIdx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', backgroundColor: 'white', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
                                  <div style={{ fontWeight: 'bold', color: 'var(--color-primary)', paddingTop: '0.25rem' }}>{sIdx + 1}.</div>
                                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <input 
                                      type="text" 
                                      placeholder="Step Title"
                                      value={step.title} 
                                      onChange={(e) => updateStep(pIdx, iIdx, sIdx, 'title', e.target.value)}
                                      style={{ padding: '0.25rem 0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                                    />
                                    <textarea 
                                      placeholder="Step Instructions"
                                      value={step.instruction} 
                                      onChange={(e) => updateStep(pIdx, iIdx, sIdx, 'instruction', e.target.value)}
                                      style={{ padding: '0.25rem 0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px', minHeight: '40px' }}
                                    />
                                    <input 
                                      type="text" 
                                      placeholder="Action Link (Optional URL)"
                                      value={step.link || ''} 
                                      onChange={(e) => updateStep(pIdx, iIdx, sIdx, 'link', e.target.value)}
                                      style={{ padding: '0.25rem 0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.75rem' }}
                                    />
                                  </div>
                                  <button onClick={() => deleteStep(pIdx, iIdx, sIdx)} style={{ color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
                                </div>
                              ))}
                            </div>
                          )}
                          <button onClick={() => addStep(pIdx, iIdx)} style={{ fontSize: '0.875rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Plus size={16} /> Add Step
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button onClick={() => addItem(pIdx)} className="btn-secondary" style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={20} /> Add New Task
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={addPhase} className="btn-secondary" style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center', padding: '1rem' }}>
        <Plus size={24} /> Add New Phase
      </button>

    </div>
  );
};

export default PlaybookManager;
