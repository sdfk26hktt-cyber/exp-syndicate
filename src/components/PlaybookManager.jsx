import React, { useState, useEffect } from 'react';
import { useAgent } from '../context/AgentContext';
import { 
  Save, Plus, Trash2, ChevronDown, ChevronUp, X, 
  Copy, BookOpen, Users, CheckCircle2, AlertCircle, Sparkles, Layers
} from 'lucide-react';

const PlaybookManager = () => {
  const { 
    playbookCatalog, 
    createPlaybook, 
    updatePlaybook, 
    deletePlaybook, 
    duplicatePlaybook, 
    batchAssignPlaybookToRole,
    agents 
  } = useAgent();

  const [selectedPlaybookId, setSelectedPlaybookId] = useState(() => {
    return playbookCatalog[0]?.id || 'pb-onboarding-default';
  });

  const [activePlaybook, setActivePlaybook] = useState(() => {
    return playbookCatalog.find(p => p.id === selectedPlaybookId) || playbookCatalog[0] || null;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [expandedPhase, setExpandedPhase] = useState(0);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newPlaybookForm, setNewPlaybookForm] = useState({
    title: '',
    description: '',
    targetRole: 'onboarding',
    templateId: 'pb-onboarding-default'
  });

  useEffect(() => {
    const current = playbookCatalog.find(p => p.id === selectedPlaybookId) || playbookCatalog[0];
    if (current) {
      setSelectedPlaybookId(current.id);
      setActivePlaybook(JSON.parse(JSON.stringify(current)));
    }
  }, [selectedPlaybookId, playbookCatalog]);

  const handleSelectPlaybook = (id) => {
    setSelectedPlaybookId(id);
    const pb = playbookCatalog.find(p => p.id === id);
    if (pb) {
      setActivePlaybook(JSON.parse(JSON.stringify(pb)));
      setExpandedPhase(0);
    }
  };

  const handleSaveCurrentPlaybook = async () => {
    if (!activePlaybook) return;
    setIsSaving(true);
    await updatePlaybook(activePlaybook.id, {
      title: activePlaybook.title,
      description: activePlaybook.description,
      targetRole: activePlaybook.targetRole,
      phases: activePlaybook.phases
    });
    setIsSaving(false);
    setSaveSuccessMsg(`✅ "${activePlaybook.title}" saved successfully and pushed to all assigned agents!`);
    setTimeout(() => setSaveSuccessMsg(''), 5000);
  };

  const handleCreatePlaybook = async (e) => {
    e.preventDefault();
    if (!newPlaybookForm.title.trim()) return;

    const template = playbookCatalog.find(p => p.id === newPlaybookForm.templateId) || playbookCatalog[0];
    const created = await createPlaybook({
      title: newPlaybookForm.title,
      description: newPlaybookForm.description,
      targetRole: newPlaybookForm.targetRole,
      phases: template ? JSON.parse(JSON.stringify(template.phases)) : []
    });

    setShowNewModal(false);
    setNewPlaybookForm({
      title: '',
      description: '',
      targetRole: 'onboarding',
      templateId: 'pb-onboarding-default'
    });
    setSelectedPlaybookId(created.id);
    setSaveSuccessMsg(`🎉 Created new playbook: "${created.title}"`);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  const handleDuplicate = async () => {
    if (!activePlaybook) return;
    const clonedTitle = prompt("Enter title for the duplicated playbook:", `${activePlaybook.title} (Copy)`);
    if (!clonedTitle) return;

    const cloned = await duplicatePlaybook(activePlaybook.id, clonedTitle);
    setSelectedPlaybookId(cloned.id);
    setSaveSuccessMsg(`📋 Playbook duplicated: "${cloned.title}"`);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  const handleDelete = async () => {
    if (!activePlaybook) return;
    if (playbookCatalog.length <= 1) {
      alert("You must keep at least one playbook in the catalog.");
      return;
    }
    if (window.confirm(`Are you sure you want to permanently delete "${activePlaybook.title}"?`)) {
      const deletedId = activePlaybook.id;
      await deletePlaybook(deletedId);
      const remaining = playbookCatalog.filter(p => p.id !== deletedId);
      if (remaining.length > 0) {
        setSelectedPlaybookId(remaining[0].id);
      }
      setSaveSuccessMsg(`🗑️ Playbook deleted.`);
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    }
  };

  const handleBatchAssign = async () => {
    if (!activePlaybook) return;
    const roleToAssign = activePlaybook.targetRole || 'onboarding';
    const confirmMsg = `Apply "${activePlaybook.title}" to ALL agents matching role "${roleToAssign.replace('_', ' ').toUpperCase()}"?`;
    if (window.confirm(confirmMsg)) {
      const count = await batchAssignPlaybookToRole(roleToAssign, activePlaybook.id);
      setSaveSuccessMsg(`👥 Successfully assigned "${activePlaybook.title}" to ${count} agent(s).`);
      setTimeout(() => setSaveSuccessMsg(''), 5000);
    }
  };

  // Phase & Task mutators on activePlaybook
  const addPhase = () => {
    if (!activePlaybook) return;
    const newPhases = [...(activePlaybook.phases || [])];
    const newPhaseNum = newPhases.length + 1;
    newPhases.push({
      id: `phase-${Date.now()}`,
      title: `Phase ${newPhaseNum}: New Milestone`,
      description: 'Phase objectives and key achievements.',
      items: []
    });
    setActivePlaybook({ ...activePlaybook, phases: newPhases });
    setExpandedPhase(newPhases.length - 1);
  };

  const deletePhase = (index) => {
    if (!activePlaybook) return;
    if (window.confirm("Are you sure you want to delete this phase?")) {
      const newPhases = [...activePlaybook.phases];
      newPhases.splice(index, 1);
      setActivePlaybook({ ...activePlaybook, phases: newPhases });
    }
  };

  const updatePhase = (index, field, value) => {
    if (!activePlaybook) return;
    const newPhases = [...activePlaybook.phases];
    newPhases[index][field] = value;
    setActivePlaybook({ ...activePlaybook, phases: newPhases });
  };

  const movePhase = (index, direction) => {
    if (!activePlaybook) return;
    const phases = [...activePlaybook.phases];
    if ((direction === -1 && index === 0) || (direction === 1 && index === phases.length - 1)) return;
    const temp = phases[index];
    phases[index] = phases[index + direction];
    phases[index + direction] = temp;
    setActivePlaybook({ ...activePlaybook, phases });
    setExpandedPhase(index + direction);
  };

  const addItem = (phaseIndex) => {
    if (!activePlaybook) return;
    const newPhases = [...activePlaybook.phases];
    newPhases[phaseIndex].items.push({
      id: `item-${Date.now()}`,
      text: 'New Checklist Task',
      completed: false,
      xp: 25,
      details: 'Provide comprehensive task instructions or notes here.',
      currentStepIndex: 0,
      steps: []
    });
    setActivePlaybook({ ...activePlaybook, phases: newPhases });
  };

  const deleteItem = (phaseIndex, itemIndex) => {
    if (!activePlaybook) return;
    if (window.confirm("Are you sure you want to delete this task?")) {
      const newPhases = [...activePlaybook.phases];
      newPhases[phaseIndex].items.splice(itemIndex, 1);
      setActivePlaybook({ ...activePlaybook, phases: newPhases });
    }
  };

  const updateItem = (phaseIndex, itemIndex, field, value) => {
    if (!activePlaybook) return;
    const newPhases = [...activePlaybook.phases];
    newPhases[phaseIndex].items[itemIndex][field] = value;
    setActivePlaybook({ ...activePlaybook, phases: newPhases });
  };

  const addStep = (phaseIndex, itemIndex) => {
    if (!activePlaybook) return;
    const newPhases = [...activePlaybook.phases];
    if (!newPhases[phaseIndex].items[itemIndex].steps) {
      newPhases[phaseIndex].items[itemIndex].steps = [];
    }
    newPhases[phaseIndex].items[itemIndex].steps.push({
      title: 'Step Title',
      instruction: 'Step-by-step guidance for the agent.',
      link: ''
    });
    setActivePlaybook({ ...activePlaybook, phases: newPhases });
  };

  const deleteStep = (phaseIndex, itemIndex, stepIndex) => {
    if (!activePlaybook) return;
    const newPhases = [...activePlaybook.phases];
    newPhases[phaseIndex].items[itemIndex].steps.splice(stepIndex, 1);
    setActivePlaybook({ ...activePlaybook, phases: newPhases });
  };

  const updateStep = (phaseIndex, itemIndex, stepIndex, field, value) => {
    if (!activePlaybook) return;
    const newPhases = [...activePlaybook.phases];
    newPhases[phaseIndex].items[itemIndex].steps[stepIndex][field] = value;
    setActivePlaybook({ ...activePlaybook, phases: newPhases });
  };

  // Count assigned agents
  const assignedAgentCount = agents.filter(a => {
    const aid = a.profile?.playbook_id;
    if (aid) return aid === activePlaybook?.id;
    // Smart match if unassigned
    if (activePlaybook?.id === 'pb-showing-partner' && a.profile?.team_subrole === 'showing_partner') return true;
    if (activePlaybook?.id === 'pb-flex-production' && (a.status === 'flex_agent' || a.profile?.team_subrole === 'flex_agent')) return true;
    if (activePlaybook?.id === 'pb-team-fast-track' && (a.status === 'team_agent' || a.profile?.team_subrole === 'team_agent')) return true;
    if (activePlaybook?.id === 'pb-onboarding-default' && (a.status === 'onboarding' || a.status === 'pending')) return true;
    return false;
  }).length;

  return (
    <div className="animate-fade-in" style={{ padding: '0.5rem 0', maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* Success Notification */}
      {saveSuccessMsg && (
        <div style={{
          backgroundColor: '#ecfdf5',
          color: '#065f46',
          border: '1px solid #a7f3d0',
          padding: '1rem 1.25rem',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <CheckCircle2 size={20} color="#059669" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '14px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Layers size={22} color="var(--color-primary)" />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Playbook Catalog & Assignment Engine</h2>
            </div>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              Create and customize specialized onboarding and production playbooks, then assign them to specific agents.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowNewModal(true)}
              className="btn-secondary"
              style={{ padding: '0.55rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            >
              <Plus size={16} /> New Playbook
            </button>
            <button
              onClick={handleDuplicate}
              className="btn-secondary"
              style={{ padding: '0.55rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
              title="Duplicate current playbook as a starting template"
            >
              <Copy size={16} /> Duplicate
            </button>
            <button
              onClick={handleSaveCurrentPlaybook}
              disabled={isSaving}
              className="btn-primary"
              style={{ padding: '0.55rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save & Publish Changes'}
            </button>
          </div>
        </div>

        {/* Playbook Selection Strip */}
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {playbookCatalog.map(pb => {
            const isSelected = pb.id === selectedPlaybookId;
            return (
              <button
                key={pb.id}
                onClick={() => handleSelectPlaybook(pb.id)}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.05)' : 'var(--color-background)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  minWidth: '220px',
                  flexShrink: 0,
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '999px',
                    backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                    color: isSelected ? '#ffffff' : 'var(--color-text-muted)'
                  }}>
                    {pb.targetRole ? pb.targetRole.replace('_', ' ') : 'General'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    {pb.phases?.length || 0} Phases
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isSelected ? 'var(--color-primary)' : 'var(--color-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {pb.title}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Playbook Settings & Phase Editor */}
      {activePlaybook && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Active Playbook Meta Header */}
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '14px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ flex: 1, minWidth: '280px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                  Playbook Title
                </label>
                <input
                  type="text"
                  value={activePlaybook.title || ''}
                  onChange={(e) => setActivePlaybook({ ...activePlaybook, title: e.target.value })}
                  style={{
                    width: '100%',
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-background)'
                  }}
                />
              </div>

              <div style={{ width: '220px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                  Target Agent Track
                </label>
                <select
                  value={activePlaybook.targetRole || 'onboarding'}
                  onChange={(e) => setActivePlaybook({ ...activePlaybook, targetRole: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-background)',
                    fontWeight: 600
                  }}
                >
                  <option value="onboarding">Onboarding (New Agents)</option>
                  <option value="team_agent">Team Agent (Full Production)</option>
                  <option value="flex_agent">Flex Agent (Independent)</option>
                  <option value="showing_partner">Showing Partner</option>
                  <option value="all">All Agents / General Track</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                Playbook Description & Learning Outcomes
              </label>
              <textarea
                value={activePlaybook.description || ''}
                onChange={(e) => setActivePlaybook({ ...activePlaybook, description: e.target.value })}
                rows={2}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-background)',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            {/* Quick Assignment Status */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--color-background)',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <Users size={16} color="var(--color-primary)" />
                <span>Currently active for <strong>{assignedAgentCount} agent(s)</strong></span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handleBatchAssign}
                  className="btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  title="Assign this playbook to all agents matching the target track"
                >
                  <Users size={14} /> Batch Assign to {activePlaybook.targetRole?.replace('_', ' ').toUpperCase() || 'ROLE'}
                </button>
                {playbookCatalog.length > 1 && (
                  <button
                    onClick={handleDelete}
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      backgroundColor: 'transparent',
                      color: 'var(--color-danger)',
                      border: '1px solid var(--color-danger)',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Phase List Accordion */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {(activePlaybook.phases || []).map((phase, pIdx) => {
              const isExpanded = expandedPhase === pIdx;
              const totalXp = (phase.items || []).reduce((sum, item) => sum + (Number(item.xp) || 0), 0);

              return (
                <div 
                  key={phase.id || pIdx} 
                  style={{ 
                    border: '1px solid var(--color-border)', 
                    borderRadius: '12px', 
                    backgroundColor: 'var(--color-surface)', 
                    overflow: 'hidden',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.02)'
                  }}
                >
                  {/* Phase Header */}
                  <div 
                    style={{ 
                      padding: '1rem 1.25rem', 
                      backgroundColor: isExpanded ? 'rgba(37, 99, 235, 0.03)' : 'var(--color-surface)', 
                      borderBottom: isExpanded ? '1px solid var(--color-border)' : 'none', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      cursor: 'pointer' 
                    }}
                    onClick={() => setExpandedPhase(isExpanded ? null : pIdx)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); movePhase(pIdx, -1); }} 
                          disabled={pIdx === 0} 
                          style={{ border: 'none', background: 'none', cursor: pIdx === 0 ? 'default' : 'pointer', opacity: pIdx === 0 ? 0.2 : 0.8, padding: 0 }}
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); movePhase(pIdx, 1); }} 
                          disabled={pIdx === (activePlaybook.phases || []).length - 1} 
                          style={{ border: 'none', background: 'none', cursor: pIdx === (activePlaybook.phases || []).length - 1 ? 'default' : 'pointer', opacity: pIdx === (activePlaybook.phases || []).length - 1 ? 0.2 : 0.8, padding: 0 }}
                        >
                          <ChevronDown size={16} />
                        </button>
                      </div>

                      <div style={{ flex: 1 }}>
                        {isExpanded ? (
                          <input 
                            type="text" 
                            value={phase.title || ''} 
                            onChange={(e) => updatePhase(pIdx, 'title', e.target.value)} 
                            onClick={(e) => e.stopPropagation()}
                            style={{ 
                              fontSize: '1.05rem', 
                              fontWeight: 700, 
                              border: '1px solid var(--color-border)', 
                              borderRadius: '6px', 
                              padding: '0.35rem 0.6rem', 
                              width: '100%',
                              maxWidth: '450px'
                            }}
                          />
                        ) : (
                          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-text-main)' }}>
                            {phase.title}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                        {phase.items?.length || 0} Tasks • {totalXp} XP
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deletePhase(pIdx); }} 
                        style={{ color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                        title="Delete Phase"
                      >
                        <Trash2 size={18} />
                      </button>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>

                  {/* Phase Content */}
                  {isExpanded && (
                    <div style={{ padding: '1.25rem' }}>
                      <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                          Phase Objective / Subtitle
                        </label>
                        <input 
                          type="text" 
                          value={phase.description || ''} 
                          onChange={(e) => updatePhase(pIdx, 'description', e.target.value)}
                          placeholder="Brief summary of milestone deliverables..."
                          style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '0.875rem' }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                          Checklist Tasks in this Phase
                        </h4>
                        <button 
                          onClick={() => addItem(pIdx)} 
                          className="btn-secondary" 
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <Plus size={14} /> Add Task
                        </button>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {(phase.items || []).map((item, iIdx) => (
                          <div 
                            key={item.id || iIdx} 
                            style={{ 
                              border: '1px solid var(--color-border)', 
                              borderRadius: '8px', 
                              padding: '1rem', 
                              backgroundColor: 'var(--color-background)' 
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 100px', gap: '0.75rem' }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>
                                    Task Name
                                  </label>
                                  <input 
                                    type="text" 
                                    value={item.text || ''} 
                                    onChange={(e) => updateItem(pIdx, iIdx, 'text', e.target.value)}
                                    placeholder="e.g., Set up Follow Up Boss Smart Lists"
                                    style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600 }}
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>
                                    XP Reward
                                  </label>
                                  <input 
                                    type="number" 
                                    value={item.xp || 0} 
                                    onChange={(e) => updateItem(pIdx, iIdx, 'xp', parseInt(e.target.value, 10) || 0)}
                                    style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 700 }}
                                  />
                                </div>
                              </div>
                              <button 
                                onClick={() => deleteItem(pIdx, iIdx)} 
                                style={{ color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', marginTop: '1.25rem' }}
                                title="Delete task"
                              >
                                <X size={18} />
                              </button>
                            </div>
                            
                            <div style={{ marginBottom: '0.75rem' }}>
                              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>
                                Task Guidance & Context
                              </label>
                              <textarea 
                                value={item.details || ''} 
                                onChange={(e) => updateItem(pIdx, iIdx, 'details', e.target.value)}
                                placeholder="Explain why this task is crucial and where the agent should start..."
                                rows={2}
                                style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '0.825rem' }}
                              />
                            </div>

                            {/* Interactive Step-by-Step Popouts */}
                            <div style={{ borderTop: '1px dashed var(--color-border)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                                  Step-by-Step Interactive Modal Instructions ({(item.steps || []).length})
                                </label>
                                <button 
                                  onClick={() => addStep(pIdx, iIdx)} 
                                  style={{ fontSize: '0.75rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600 }}
                                >
                                  <Plus size={13} /> Add Step
                                </button>
                              </div>

                              {(item.steps || []).length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                  {(item.steps || []).map((step, sIdx) => (
                                    <div key={sIdx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', backgroundColor: 'var(--color-surface)', padding: '0.6rem', border: '1px solid var(--color-border)', borderRadius: '6px' }}>
                                      <div style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '0.85rem', paddingTop: '0.35rem', minWidth: '18px' }}>
                                        {sIdx + 1}.
                                      </div>
                                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                        <input 
                                          type="text" 
                                          placeholder="Step Title (e.g. Log into portal)"
                                          value={step.title || ''} 
                                          onChange={(e) => updateStep(pIdx, iIdx, sIdx, 'title', e.target.value)}
                                          style={{ padding: '0.3rem 0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}
                                        />
                                        <textarea 
                                          placeholder="Specific instructions for this exact step..."
                                          value={step.instruction || ''} 
                                          onChange={(e) => updateStep(pIdx, iIdx, sIdx, 'instruction', e.target.value)}
                                          rows={2}
                                          style={{ padding: '0.3rem 0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.8rem' }}
                                        />
                                        <input 
                                          type="text" 
                                          placeholder="Action Link URL (Optional e.g. https://crm.followupboss.com)"
                                          value={step.link || ''} 
                                          onChange={(e) => updateStep(pIdx, iIdx, sIdx, 'link', e.target.value)}
                                          style={{ padding: '0.25rem 0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.75rem' }}
                                        />
                                      </div>
                                      <button 
                                        onClick={() => deleteStep(pIdx, iIdx, sIdx)} 
                                        style={{ color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem' }}
                                        title="Remove step"
                                      >
                                        <X size={15} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button 
            onClick={addPhase} 
            className="btn-secondary" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              width: '100%', 
              justifyContent: 'center', 
              padding: '0.85rem',
              borderRadius: '10px',
              fontWeight: 700
            }}
          >
            <Plus size={18} /> Add New Phase to "{activePlaybook.title}"
          </button>
        </div>
      )}

      {/* New Playbook Modal */}
      {showNewModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '14px',
            padding: '1.75rem',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} color="var(--color-primary)" />
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Create New Playbook</h3>
              </div>
              <button onClick={() => setShowNewModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePlaybook} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Playbook Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Commercial Transition Track"
                  value={newPlaybookForm.title}
                  onChange={(e) => setNewPlaybookForm({ ...newPlaybookForm, title: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Target Agent Track / Role
                </label>
                <select
                  value={newPlaybookForm.targetRole}
                  onChange={(e) => setNewPlaybookForm({ ...newPlaybookForm, targetRole: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                >
                  <option value="onboarding">Onboarding</option>
                  <option value="team_agent">Team Agent</option>
                  <option value="flex_agent">Flex Agent</option>
                  <option value="showing_partner">Showing Partner</option>
                  <option value="all">All Roles</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Starting Template
                </label>
                <select
                  value={newPlaybookForm.templateId}
                  onChange={(e) => setNewPlaybookForm({ ...newPlaybookForm, templateId: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                >
                  {playbookCatalog.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe who should use this playbook..."
                  value={newPlaybookForm.description}
                  onChange={(e) => setNewPlaybookForm({ ...newPlaybookForm, description: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="btn-secondary"
                  style={{ padding: '0.55rem 1rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '0.55rem 1.25rem' }}
                >
                  Create Playbook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PlaybookManager;

