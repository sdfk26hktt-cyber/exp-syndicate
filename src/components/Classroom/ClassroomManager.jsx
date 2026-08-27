import React, { useState } from 'react';
import { 
  GraduationCap, 
  Save, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Video, 
  X,
  ExternalLink,
  Eye,
  EyeOff,
  Sparkles,
  Play
} from 'lucide-react';
import { useAgent } from '../../context/AgentContext';
import LevelBadge from '../Gamification/LevelBadge';
import { parseEmbedMedia, extractIframeSrc } from '../../utils/mediaEmbed';

const ClassroomManager = () => {
  const { courses, updateGlobalCourses, gamificationSettings } = useAgent();
  const [localCourses, setLocalCourses] = useState(courses || []);
  const [selectedCourseIndex, setSelectedCourseIndex] = useState(0);
  const [expandedModuleIndex, setExpandedModuleIndex] = useState(0);
  const [previewLessonId, setPreviewLessonId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const activeCourse = localCourses[selectedCourseIndex] || localCourses[0];

  const handleSave = async () => {
    setIsSaving(true);
    await updateGlobalCourses(localCourses);
    setIsSaving(false);
    setToastMessage('✅ Classroom Courses Published Successfully!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Course Actions
  const handleAddCourse = () => {
    const newCourse = {
      id: `course-${Date.now()}`,
      title: 'New Training Course',
      description: 'Course description and learning objectives.',
      category: 'General Training',
      coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
      unlockLevel: 1,
      estimatedHours: '2.0 Hours',
      modules: [
        {
          id: `mod-${Date.now()}-1`,
          title: 'Module 1: Orientation & Foundations',
          description: 'Foundations and overview.',
          lessons: [
            {
              id: `les-${Date.now()}-1-1`,
              title: 'Lesson 1: Introduction & Overview',
              videoUrl: '',
              xp: 25,
              duration: '10 min',
              description: 'Lesson instructions and training notes.',
              steps: [
                { title: 'First Action Item', instruction: 'Review the provided materials and take action.' }
              ],
              resources: []
            }
          ]
        }
      ]
    };
    const updated = [...localCourses, newCourse];
    setLocalCourses(updated);
    setSelectedCourseIndex(updated.length - 1);
  };

  const handleDeleteCourse = (idx) => {
    if (window.confirm(`Are you sure you want to delete "${localCourses[idx].title}"?`)) {
      const updated = localCourses.filter((_, i) => i !== idx);
      setLocalCourses(updated);
      setSelectedCourseIndex(Math.max(0, idx - 1));
    }
  };

  const updateCourseField = (field, value) => {
    const updated = [...localCourses];
    updated[selectedCourseIndex] = {
      ...updated[selectedCourseIndex],
      [field]: value
    };
    setLocalCourses(updated);
  };

  // Module Actions
  const handleAddModule = () => {
    const updated = [...localCourses];
    const newMod = {
      id: `mod-${Date.now()}`,
      title: `Module ${(activeCourse.modules || []).length + 1}: New Section`,
      description: 'Module description.',
      lessons: []
    };
    updated[selectedCourseIndex].modules = [...(activeCourse.modules || []), newMod];
    setLocalCourses(updated);
    setExpandedModuleIndex((activeCourse.modules || []).length);
  };

  const handleDeleteModule = (mIdx) => {
    if (window.confirm('Are you sure you want to delete this module and all its lessons?')) {
      const updated = [...localCourses];
      updated[selectedCourseIndex].modules.splice(mIdx, 1);
      setLocalCourses(updated);
    }
  };

  const updateModuleField = (mIdx, field, value) => {
    const updated = [...localCourses];
    updated[selectedCourseIndex].modules[mIdx][field] = value;
    setLocalCourses(updated);
  };

  // Lesson Actions
  const handleAddLesson = (mIdx) => {
    const updated = [...localCourses];
    const newLesson = {
      id: `les-${Date.now()}`,
      title: `Lesson ${(activeCourse.modules[mIdx].lessons || []).length + 1}: New Lesson`,
      videoUrl: '',
      xp: 25,
      duration: '15 min',
      description: 'Step-by-step training breakdown and instructions.',
      steps: [
        { title: 'Step 1', instruction: 'Step instructions.' }
      ],
      resources: []
    };
    updated[selectedCourseIndex].modules[mIdx].lessons.push(newLesson);
    setLocalCourses(updated);
  };

  const handleDeleteLesson = (mIdx, lIdx) => {
    if (window.confirm('Are you sure you want to delete this lesson?')) {
      const updated = [...localCourses];
      updated[selectedCourseIndex].modules[mIdx].lessons.splice(lIdx, 1);
      setLocalCourses(updated);
    }
  };

  const updateLessonField = (mIdx, lIdx, field, value) => {
    const updated = [...localCourses];
    updated[selectedCourseIndex].modules[mIdx].lessons[lIdx][field] = value;
    setLocalCourses(updated);
  };

  // Step Actions inside Lesson
  const handleAddStep = (mIdx, lIdx) => {
    const updated = [...localCourses];
    const lesson = updated[selectedCourseIndex].modules[mIdx].lessons[lIdx];
    if (!lesson.steps) lesson.steps = [];
    lesson.steps.push({
      title: 'New Action Step',
      instruction: 'Instructions for this action step.',
      link: ''
    });
    setLocalCourses(updated);
  };

  const handleDeleteStep = (mIdx, lIdx, sIdx) => {
    const updated = [...localCourses];
    updated[selectedCourseIndex].modules[mIdx].lessons[lIdx].steps.splice(sIdx, 1);
    setLocalCourses(updated);
  };

  const updateStepField = (mIdx, lIdx, sIdx, field, value) => {
    const updated = [...localCourses];
    updated[selectedCourseIndex].modules[mIdx].lessons[lIdx].steps[sIdx][field] = value;
    setLocalCourses(updated);
  };

  // Resource Actions inside Lesson
  const handleAddResource = (mIdx, lIdx) => {
    const updated = [...localCourses];
    const lesson = updated[selectedCourseIndex].modules[mIdx].lessons[lIdx];
    if (!lesson.resources) lesson.resources = [];
    lesson.resources.push({
      name: 'Resource Name',
      url: 'https://',
      type: 'pdf'
    });
    setLocalCourses(updated);
  };

  const handleDeleteResource = (mIdx, lIdx, rIdx) => {
    const updated = [...localCourses];
    updated[selectedCourseIndex].modules[mIdx].lessons[lIdx].resources.splice(rIdx, 1);
    setLocalCourses(updated);
  };

  const updateResourceField = (mIdx, lIdx, rIdx, field, value) => {
    const updated = [...localCourses];
    updated[selectedCourseIndex].modules[mIdx].lessons[lIdx].resources[rIdx][field] = value;
    setLocalCourses(updated);
  };

  return (
    <div className="animate-fade-in" style={styles.container}>
      {/* Toast */}
      {toastMessage && (
        <div style={styles.toast}>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div style={styles.headerBar}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <GraduationCap size={24} color="var(--color-primary)" />
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>Classroom & Course Builder</h2>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0 }}>
            Create and organize step-by-step training courses, video masterclasses, action items, and level requirements.
          </p>
        </div>

        <button 
          onClick={handleSave} 
          disabled={isSaving}
          style={styles.saveBtn}
        >
          <Save size={18} />
          <span>{isSaving ? 'Publishing...' : 'Publish Classroom Changes'}</span>
        </button>
      </div>

      {/* Main Builder Grid: Course Selector Tabs & Active Course Editor */}
      <div style={styles.builderGrid}>
        {/* Left Column: Course Selector Tabs */}
        <div style={styles.courseSidebar}>
          <div style={styles.courseSidebarHeader}>
            <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>COURSES ({localCourses.length})</span>
            <button onClick={handleAddCourse} style={styles.addCourseBtn}>
              <Plus size={14} /> New Course
            </button>
          </div>

          <div style={styles.courseTabsList}>
            {localCourses.map((c, idx) => (
              <div 
                key={c.id || idx}
                onClick={() => {
                  setSelectedCourseIndex(idx);
                  setExpandedModuleIndex(0);
                }}
                style={{
                  ...styles.courseTabItem,
                  backgroundColor: selectedCourseIndex === idx ? 'white' : 'transparent',
                  borderColor: selectedCourseIndex === idx ? 'var(--color-primary)' : 'transparent',
                  boxShadow: selectedCourseIndex === idx ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>
                      {(c.modules || []).length} Modules
                    </span>
                    <LevelBadge level={c.unlockLevel || 1} size="xs" />
                  </div>
                </div>

                {localCourses.length > 1 && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCourse(idx);
                    }}
                    style={styles.deleteTabBtn}
                    title="Delete Course"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Active Course Details & Module/Lesson Hierarchy */}
        {activeCourse && (
          <div style={styles.editorArea}>
            {/* Course Settings Card */}
            <div style={styles.editorCard}>
              <h3 style={styles.cardSectionTitle}>Course Details</h3>

              <div style={styles.formGrid}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={styles.label}>Course Title</label>
                  <input
                    type="text"
                    value={activeCourse.title}
                    onChange={(e) => updateCourseField('title', e.target.value)}
                    style={styles.input}
                    placeholder="e.g. Follow Up Boss & Lead Conversion Machine"
                  />
                </div>

                <div>
                  <label style={styles.label}>Category</label>
                  <input
                    type="text"
                    value={activeCourse.category || ''}
                    onChange={(e) => updateCourseField('category', e.target.value)}
                    style={styles.input}
                    placeholder="e.g. Lead Gen & Conversion"
                  />
                </div>

                <div>
                  <label style={styles.label}>Required Unlock Level (1 - 9)</label>
                  <select
                    value={activeCourse.unlockLevel || 1}
                    onChange={(e) => updateCourseField('unlockLevel', parseInt(e.target.value))}
                    style={styles.select}
                  >
                    {(gamificationSettings?.levelThresholds || []).map(t => (
                      <option key={t.level} value={t.level}>
                        Level {t.level}: {t.title} ({t.minXp} XP)
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={styles.label}>Course Description</label>
                  <textarea
                    value={activeCourse.description || ''}
                    onChange={(e) => updateCourseField('description', e.target.value)}
                    style={{ ...styles.input, minHeight: '60px' }}
                    placeholder="What will agents learn in this course?"
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={styles.label}>Cover Image URL</label>
                  <input
                    type="text"
                    value={activeCourse.coverImage || ''}
                    onChange={(e) => updateCourseField('coverImage', e.target.value)}
                    style={styles.input}
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
              </div>
            </div>

            {/* Modules & Lessons Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.5rem 0 1rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: 'var(--color-text-primary)' }}>
                Curriculum Modules & Lessons
              </h3>
              <button onClick={handleAddModule} style={styles.addModuleBtn}>
                <Plus size={16} /> Add Module
              </button>
            </div>

            {/* Modules List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {(activeCourse.modules || []).map((module, mIdx) => {
                const isExpanded = expandedModuleIndex === mIdx;

                return (
                  <div key={module.id || mIdx} style={styles.moduleCard}>
                    {/* Module Header */}
                    <div 
                      style={styles.moduleCardHeader}
                      onClick={() => setExpandedModuleIndex(isExpanded ? null : mIdx)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                        <span style={styles.moduleIndexTag}>M{mIdx + 1}</span>
                        {isExpanded ? (
                          <input
                            type="text"
                            value={module.title}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateModuleField(mIdx, 'title', e.target.value)}
                            style={{ ...styles.input, fontWeight: '700', padding: '0.35rem 0.65rem' }}
                          />
                        ) : (
                          <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                            {module.title}
                          </span>
                        )}
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>
                          ({(module.lessons || []).length} lessons)
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteModule(mIdx);
                          }}
                          style={{ color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer' }}
                          title="Delete Module"
                        >
                          <Trash2 size={16} />
                        </button>
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>

                    {/* Module Lessons Editor */}
                    {isExpanded && (
                      <div style={styles.moduleBody}>
                        <div style={{ marginBottom: '1.25rem' }}>
                          <label style={styles.label}>Module Description</label>
                          <input
                            type="text"
                            value={module.description || ''}
                            onChange={(e) => updateModuleField(mIdx, 'description', e.target.value)}
                            style={styles.input}
                            placeholder="Brief description of this module's focus..."
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                            LESSONS IN THIS MODULE
                          </span>
                          <button onClick={() => handleAddLesson(mIdx)} style={styles.addLessonBtn}>
                            <Plus size={14} /> Add Lesson
                          </button>
                        </div>

                        {/* Lessons List inside Module */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {(module.lessons || []).map((lesson, lIdx) => (
                            <div key={lesson.id || lIdx} style={styles.lessonEditorCard}>
                              {/* Lesson Header Fields */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{ flex: '1 1 300px' }}>
                                  <label style={styles.label}>Lesson Title</label>
                                  <input
                                    type="text"
                                    value={lesson.title}
                                    onChange={(e) => updateLessonField(mIdx, lIdx, 'title', e.target.value)}
                                    style={{ ...styles.input, fontWeight: '700' }}
                                  />
                                </div>

                                <div style={{ width: '100px' }}>
                                  <label style={styles.label}>XP Award</label>
                                  <input
                                    type="number"
                                    value={lesson.xp || 25}
                                    onChange={(e) => updateLessonField(mIdx, lIdx, 'xp', parseInt(e.target.value) || 0)}
                                    style={styles.input}
                                  />
                                </div>

                                <div style={{ width: '100px' }}>
                                  <label style={styles.label}>Duration</label>
                                  <input
                                    type="text"
                                    value={lesson.duration || '15 min'}
                                    onChange={(e) => updateLessonField(mIdx, lIdx, 'duration', e.target.value)}
                                    style={styles.input}
                                  />
                                </div>

                                <button 
                                  onClick={() => handleDeleteLesson(mIdx, lIdx)}
                                  style={{ color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer', marginTop: '1.5rem' }}
                                  title="Delete Lesson"
                                >
                                  <X size={18} />
                                </button>
                              </div>

                              {/* Lesson Media / Presentation / Walkthrough URL */}
                              <div style={{ marginBottom: '1.25rem', backgroundColor: '#f8fafc', padding: '0.875rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                  <label style={{ ...styles.label, marginBottom: 0, fontWeight: 700, color: 'var(--color-dark-navy)' }}>
                                    Media, Presentation, or Walkthrough URL
                                  </label>
                                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.7rem', backgroundColor: '#ede9fe', color: '#6d28d9', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>Canva 🎨</span>
                                    <span style={{ fontSize: '0.7rem', backgroundColor: '#fce7f3', color: '#be185d', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>Tango.ai 🪄</span>
                                    <span style={{ fontSize: '0.7rem', backgroundColor: '#fee2e2', color: '#b91c1c', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>YouTube ▶️</span>
                                    <span style={{ fontSize: '0.7rem', backgroundColor: '#e0e7ff', color: '#3730a3', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>Loom 🎥</span>
                                    <span style={{ fontSize: '0.7rem', backgroundColor: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>Slides 📊</span>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <Video size={16} color="var(--color-text-muted)" />
                                  <input
                                    type="text"
                                    value={lesson.videoUrl || ''}
                                    onChange={(e) => {
                                      const clean = extractIframeSrc(e.target.value);
                                      updateLessonField(mIdx, lIdx, 'videoUrl', clean);
                                    }}
                                    style={{ ...styles.input, backgroundColor: 'white' }}
                                    placeholder="Paste Canva presentation link, Tango.ai walkthrough, YouTube, Loom, Google Slides, or <iframe> code..."
                                  />
                                </div>

                                {/* Media Detection & Interactive Live Preview */}
                                {(() => {
                                  const mediaInfo = parseEmbedMedia(lesson.videoUrl);
                                  if (!lesson.videoUrl || mediaInfo.type === 'empty') {
                                    return (
                                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
                                        💡 Supports Canva view/present links, Tango.ai workflow guides, YouTube, Loom, Vimeo, Slides, and direct video files.
                                      </div>
                                    );
                                  }

                                  const isPreviewing = previewLessonId === lesson.id;

                                  return (
                                    <div style={{ marginTop: '0.5rem' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '4px', backgroundColor: `${mediaInfo.badgeColor}15`, color: mediaInfo.badgeColor }}>
                                          <span>{mediaInfo.badgeLabel || 'Detected Media'}</span>
                                          {mediaInfo.embedUrl && <span style={{ opacity: 0.8, fontSize: '0.7rem' }}>• Player Ready</span>}
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                          <button
                                            type="button"
                                            onClick={() => setPreviewLessonId(isPreviewing ? null : lesson.id)}
                                            style={{
                                              fontSize: '0.75rem',
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '0.3rem',
                                              backgroundColor: isPreviewing ? '#0f172a' : 'white',
                                              color: isPreviewing ? 'white' : 'var(--color-primary)',
                                              border: '1px solid var(--color-border)',
                                              borderRadius: '5px',
                                              padding: '0.25rem 0.55rem',
                                              cursor: 'pointer',
                                              fontWeight: 600
                                            }}
                                          >
                                            {isPreviewing ? <EyeOff size={12} /> : <Eye size={12} />}
                                            {isPreviewing ? 'Close Preview' : 'Live Preview'}
                                          </button>

                                          <a
                                            href={mediaInfo.rawUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                              fontSize: '0.75rem',
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '0.25rem',
                                              color: 'var(--color-text-muted)',
                                              textDecoration: 'none'
                                            }}
                                          >
                                            Test Link <ExternalLink size={11} />
                                          </a>
                                        </div>
                                      </div>

                                      {/* Expanded Live Player Preview Drawer */}
                                      {isPreviewing && mediaInfo.embedUrl && (
                                        <div style={{ marginTop: '0.65rem', backgroundColor: '#0f172a', borderRadius: '8px', overflow: 'hidden', border: '1px solid #334155', padding: '0.5rem' }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0.5rem', marginBottom: '0.4rem', borderBottom: '1px solid #1e293b' }}>
                                            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
                                              Previewing {mediaInfo.badgeLabel}:
                                            </span>
                                            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                                              {mediaInfo.aspectRatio || '16:9'}
                                            </span>
                                          </div>
                                          <div style={{
                                            position: 'relative',
                                            width: '100%',
                                            height: mediaInfo.type === 'tango' ? '500px' : '340px',
                                            borderRadius: '6px',
                                            overflow: 'hidden'
                                          }}>
                                            {mediaInfo.isDirectVideo ? (
                                              <video src={mediaInfo.embedUrl} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                            ) : (
                                              <iframe
                                                src={mediaInfo.embedUrl}
                                                title="Media Preview"
                                                style={{ width: '100%', height: '100%', border: 0 }}
                                                allow="fullscreen; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                allowFullScreen
                                              />
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Lesson Notes */}
                              <div style={{ marginBottom: '1rem' }}>
                                <label style={styles.label}>Lesson Guide / Study Notes</label>
                                <textarea
                                  value={lesson.description || ''}
                                  onChange={(e) => updateLessonField(mIdx, lIdx, 'description', e.target.value)}
                                  style={{ ...styles.input, minHeight: '60px' }}
                                  placeholder="Training notes, scripts, explanations..."
                                />
                              </div>

                              {/* Step-by-Step Action Items Builder */}
                              <div style={styles.subItemsBox}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                  <span style={{ fontWeight: '700', fontSize: '0.8rem', color: 'var(--color-primary)' }}>
                                    ✓ Step-by-Step Action Checklist ({(lesson.steps || []).length})
                                  </span>
                                  <button onClick={() => handleAddStep(mIdx, lIdx)} style={styles.subAddBtn}>
                                    <Plus size={12} /> Add Step
                                  </button>
                                </div>

                                {(lesson.steps || []).map((step, sIdx) => (
                                  <div key={sIdx} style={styles.subItemRow}>
                                    <span style={{ fontWeight: '700', color: 'var(--color-primary)', paddingTop: '0.25rem' }}>{sIdx + 1}.</span>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                      <input
                                        type="text"
                                        value={step.title}
                                        placeholder="Action Title (e.g. Export Contacts)"
                                        onChange={(e) => updateStepField(mIdx, lIdx, sIdx, 'title', e.target.value)}
                                        style={{ ...styles.input, fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                                      />
                                      <input
                                        type="text"
                                        value={step.instruction}
                                        placeholder="Detailed instruction..."
                                        onChange={(e) => updateStepField(mIdx, lIdx, sIdx, 'instruction', e.target.value)}
                                        style={{ ...styles.input, fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                                      />
                                      <input
                                        type="text"
                                        value={step.link || ''}
                                        placeholder="Optional Action Link (e.g. https://...)"
                                        onChange={(e) => updateStepField(mIdx, lIdx, sIdx, 'link', e.target.value)}
                                        style={{ ...styles.input, fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                                      />
                                    </div>
                                    <button 
                                      onClick={() => handleDeleteStep(mIdx, lIdx, sIdx)}
                                      style={{ color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer' }}
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>

                              {/* Downloadable Resources Builder */}
                              <div style={{ ...styles.subItemsBox, marginTop: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                  <span style={{ fontWeight: '700', fontSize: '0.8rem', color: '#10b981' }}>
                                    📥 Downloadable Templates & Attachments ({(lesson.resources || []).length})
                                  </span>
                                  <button onClick={() => handleAddResource(mIdx, lIdx)} style={{ ...styles.subAddBtn, color: '#10b981' }}>
                                    <Plus size={12} /> Add Resource
                                  </button>
                                </div>

                                {(lesson.resources || []).map((res, rIdx) => (
                                  <div key={rIdx} style={styles.subItemRow}>
                                    <div style={{ flex: 2 }}>
                                      <input
                                        type="text"
                                        value={res.name}
                                        placeholder="Resource Name (e.g. Script PDF)"
                                        onChange={(e) => updateResourceField(mIdx, lIdx, rIdx, 'name', e.target.value)}
                                        style={{ ...styles.input, fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                                      />
                                    </div>
                                    <div style={{ flex: 2 }}>
                                      <input
                                        type="text"
                                        value={res.url}
                                        placeholder="Resource URL (https://...)"
                                        onChange={(e) => updateResourceField(mIdx, lIdx, rIdx, 'url', e.target.value)}
                                        style={{ ...styles.input, fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                                      />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <select
                                        value={res.type || 'pdf'}
                                        onChange={(e) => updateResourceField(mIdx, lIdx, rIdx, 'type', e.target.value)}
                                        style={{ ...styles.select, fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                                      >
                                        <option value="pdf">PDF</option>
                                        <option value="sheet">Sheet</option>
                                        <option value="doc">Document</option>
                                        <option value="slides">Slides</option>
                                        <option value="canva">Canva</option>
                                        <option value="tango">Tango.ai</option>
                                        <option value="video">Video</option>
                                        <option value="link">Link</option>
                                      </select>
                                    </div>
                                    <button 
                                      onClick={() => handleDeleteResource(mIdx, lIdx, rIdx)}
                                      style={{ color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer' }}
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ))}
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
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '1.5rem',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  toast: {
    position: 'fixed',
    top: '24px',
    right: '24px',
    backgroundColor: '#059669',
    color: 'white',
    padding: '0.875rem 1.5rem',
    borderRadius: '10px',
    boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
    fontWeight: '700',
    zIndex: 1000
  },
  headerBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
    paddingBottom: '1.25rem',
    borderBottom: '1px solid var(--color-border)'
  },
  saveBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'var(--color-success)',
    color: 'white',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    border: 'none',
    fontWeight: '700',
    fontSize: '0.95rem',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
  },
  builderGrid: {
    display: 'grid',
    gridTemplateColumns: '300px 1fr',
    gap: '2rem',
    alignItems: 'start'
  },
  courseSidebar: {
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid var(--color-border)',
    padding: '1rem'
  },
  courseSidebarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid var(--color-border)'
  },
  addCourseBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    border: 'none',
    padding: '0.35rem 0.65rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '700',
    cursor: 'pointer'
  },
  courseTabsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  courseTabItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  deleteTabBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-danger)',
    cursor: 'pointer',
    padding: '4px',
    opacity: 0.6
  },
  editorArea: {
    display: 'flex',
    flexDirection: 'column'
  },
  editorCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '1px solid var(--color-border)',
    padding: '1.5rem',
    boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
  },
  cardSectionTitle: {
    fontSize: '1.15rem',
    fontWeight: '800',
    color: 'var(--color-text-primary)',
    marginBottom: '1.25rem'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem'
  },
  label: {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: '700',
    color: 'var(--color-text-secondary)',
    marginBottom: '0.35rem'
  },
  input: {
    width: '100%',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid var(--color-border)',
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid var(--color-border)',
    fontSize: '0.875rem',
    backgroundColor: 'white',
    outline: 'none',
    boxSizing: 'border-box'
  },
  addModuleBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    backgroundColor: 'white',
    color: 'var(--color-primary)',
    border: '1px solid var(--color-primary)',
    padding: '0.45rem 0.85rem',
    borderRadius: '6px',
    fontWeight: '700',
    fontSize: '0.8rem',
    cursor: 'pointer'
  },
  moduleCard: {
    backgroundColor: 'white',
    borderRadius: '10px',
    border: '1px solid var(--color-border)',
    overflow: 'hidden'
  },
  moduleCardHeader: {
    padding: '1rem 1.25rem',
    backgroundColor: '#f8fafc',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    borderBottom: '1px solid var(--color-border)'
  },
  moduleIndexTag: {
    fontSize: '0.7rem',
    fontWeight: '800',
    backgroundColor: 'var(--color-dark-navy)',
    color: 'white',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px'
  },
  moduleBody: {
    padding: '1.25rem'
  },
  addLessonBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    backgroundColor: 'transparent',
    color: 'var(--color-primary)',
    border: 'none',
    fontSize: '0.8rem',
    fontWeight: '700',
    cursor: 'pointer'
  },
  lessonEditorCard: {
    backgroundColor: '#fafafa',
    padding: '1.25rem',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  subItemsBox: {
    backgroundColor: 'white',
    padding: '0.875rem',
    borderRadius: '6px',
    border: '1px solid var(--color-border)'
  },
  subAddBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    backgroundColor: 'none',
    border: 'none',
    color: 'var(--color-primary)',
    fontSize: '0.75rem',
    fontWeight: '700',
    cursor: 'pointer',
    background: 'none'
  },
  subItemRow: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'flex-start',
    marginBottom: '0.5rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px dashed #f1f5f9'
  }
};

export default ClassroomManager;
