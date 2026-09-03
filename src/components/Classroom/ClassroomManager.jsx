import React, { useState, useEffect } from 'react';
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
  Play,
  Copy,
  Megaphone,
  Search,
  FileText,
  CheckCircle2,
  Layers,
  BookOpen,
  Send,
  Share2,
  Info,
  Clock,
  CheckSquare,
  Paperclip
} from 'lucide-react';
import { useAgent } from '../../context/AgentContext';
import { useCommunity } from '../../context/CommunityContext';
import LevelBadge from '../Gamification/LevelBadge';
import { parseEmbedMedia, extractIframeSrc } from '../../utils/mediaEmbed';

const ClassroomManager = () => {
  const { courses, updateGlobalCourses, gamificationSettings } = useAgent();
  const { addPost } = useCommunity();
  const [localCourses, setLocalCourses] = useState(courses || []);
  const [selectedCourseIndex, setSelectedCourseIndex] = useState(0);
  const [expandedModuleIndex, setExpandedModuleIndex] = useState(0);
  const [previewLessonId, setPreviewLessonId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Lesson Copy / Library States
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [copyTargetModuleIdx, setCopyTargetModuleIdx] = useState(0);
  const [copySearchQuery, setCopySearchQuery] = useState('');
  const [copySelectedCourseFilter, setCopySelectedCourseFilter] = useState('all');

  // Training Feed Announcement States
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [announcementData, setAnnouncementData] = useState(null);
  const [announcementSubmitting, setAnnouncementSubmitting] = useState(false);

  // Keep localCourses in sync if courses load asynchronously from cloud
  useEffect(() => {
    if (courses && Array.isArray(courses) && courses.length > 0) {
      setLocalCourses(courses);
    }
  }, [courses]);

  const activeCourse = localCourses[selectedCourseIndex] || localCourses[0];

  const handleSave = async () => {
    setIsSaving(true);
    await updateGlobalCourses(localCourses);
    setIsSaving(false);
    setToastMessage('✅ Classroom Courses Published to Cloud & All Agents Successfully!');
    setTimeout(() => setToastMessage(null), 4000);
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

  // Duplicate Lesson In-Place
  const handleDuplicateLesson = (mIdx, lIdx) => {
    const updated = [...localCourses];
    const origLesson = updated[selectedCourseIndex].modules[mIdx].lessons[lIdx];
    const clonedLesson = {
      ...origLesson,
      id: `les-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: `${origLesson.title || 'Lesson'} (Copy)`,
      steps: (origLesson.steps || []).map(s => ({ ...s })),
      resources: (origLesson.resources || []).map(r => ({ ...r }))
    };
    updated[selectedCourseIndex].modules[mIdx].lessons.splice(lIdx + 1, 0, clonedLesson);
    setLocalCourses(updated);
    setToastMessage(`📋 Lesson duplicated: "${clonedLesson.title}"`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Open Copy Lesson From Library Modal
  const openCopyLessonModal = (mIdx) => {
    setCopyTargetModuleIdx(mIdx);
    setCopySearchQuery('');
    setCopySelectedCourseFilter('all');
    setCopyModalOpen(true);
  };

  // Handle Copy Lesson From Library
  const handleCopyFromLibrary = (sourceLesson) => {
    const updated = [...localCourses];
    const clonedLesson = {
      ...sourceLesson,
      id: `les-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: `${sourceLesson.title || 'Lesson'} (Copy)`,
      steps: (sourceLesson.steps || []).map(s => ({ ...s })),
      resources: (sourceLesson.resources || []).map(r => ({ ...r }))
    };
    if (!updated[selectedCourseIndex].modules[copyTargetModuleIdx].lessons) {
      updated[selectedCourseIndex].modules[copyTargetModuleIdx].lessons = [];
    }
    updated[selectedCourseIndex].modules[copyTargetModuleIdx].lessons.push(clonedLesson);
    setLocalCourses(updated);
    setCopyModalOpen(false);
    setToastMessage(`✅ Copied "${sourceLesson.title}" into Module ${copyTargetModuleIdx + 1}!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Open Training Feed Announcement for Course
  const handleOpenCourseAnnouncement = (course) => {
    const totalModules = (course.modules || []).length;
    let totalLessons = 0;
    let totalXp = 0;
    (course.modules || []).forEach(m => {
      (m.lessons || []).forEach(l => {
        totalLessons += 1;
        totalXp += (l.xp || 25);
      });
    });
    const unlockLvl = course.unlockLevel || 1;
    const category = course.category || 'General Training';

    const text = `### 🎓 New Classroom Course: **${course.title}**\n\n${course.description || 'A comprehensive new training series is now live in the syndicate classroom.'}\n\n**Course Curriculum Overview:**\n- 📚 **Structure**: ${totalModules} Modules • ${totalLessons} Lessons\n- ⚡ **Reward**: +${totalXp} XP upon completion\n- ⏳ **Estimated Time**: ${course.estimatedHours || '2 Hours'}\n- 🔓 **Requirement**: Level ${unlockLvl}+\n\n👉 [**Start Course in Classroom →**](/classroom/${course.id})`;

    setAnnouncementData({
      type: 'course',
      badge: 'Course Announcement',
      title: `🎓 New Course: ${course.title}`,
      text,
      media: course.coverImage || '',
      audio: '',
      presentation: '',
      tags: ['Classroom', 'New Course', category],
      attached_resources: []
    });
    setAnnouncementModalOpen(true);
  };

  // Open Training Feed Announcement for Module
  const handleOpenModuleAnnouncement = (course, module, mIdx) => {
    const lessons = module.lessons || [];
    let totalXp = 0;
    lessons.forEach(l => {
      totalXp += (l.xp || 25);
    });
    const category = course.category || 'General Training';

    const lessonListText = lessons.length > 0 
      ? lessons.map((l, i) => `${i + 1}. **${l.title}** (${l.duration || '15 min'}, +${l.xp || 25} XP)`).join('\n')
      : '*(Lessons coming soon)*';

    const text = `### 📚 New Training Module: **${module.title}**\n*Course: ${course.title} (Module ${mIdx + 1})*\n\n${module.description || 'Master key tactics and conversion workflows with this dedicated training module.'}\n\n**Included Lessons (${lessons.length} lessons • +${totalXp} XP):**\n${lessonListText}\n\n👉 [**Open Module in Classroom →**](/classroom/${course.id})`;

    setAnnouncementData({
      type: 'module',
      badge: 'Module Announcement',
      title: `📚 New Module: ${module.title}`,
      text,
      media: course.coverImage || '',
      audio: '',
      presentation: '',
      tags: ['Classroom', 'Training Module', category],
      attached_resources: []
    });
    setAnnouncementModalOpen(true);
  };

  // Open Training Feed Announcement for Lesson
  const handleOpenLessonAnnouncement = (course, module, lesson) => {
    const category = course.category || 'General Training';
    const stepsCount = (lesson.steps || []).length;
    const resourcesCount = (lesson.resources || []).length;

    const text = `### ▶️ New Training Lesson: **${lesson.title}**\n*Module: ${module.title} • Course: ${course.title}*\n\n${lesson.description || 'Actionable breakdown and training walkthrough.'}\n\n**Lesson Highlights:**\n- ⏱️ **Duration**: ${lesson.duration || '15 min'}\n- ⚡ **XP Award**: +${lesson.xp || 25} XP\n- ✅ **Action Checklist**: ${stepsCount} actionable steps\n- 📎 **Attached Materials**: ${resourcesCount} downloads/links\n\n👉 [**Start Lesson in Classroom →**](/classroom/${course.id}/${lesson.id})`;

    const attachedResources = (lesson.resources || []).map((r, idx) => ({
      id: `res-${Date.now()}-${idx}`,
      title: r.name || 'Lesson Resource',
      url: r.url || '',
      type: r.type || 'pdf',
      category: 'Classroom Resource'
    })).filter(r => r.url);

    setAnnouncementData({
      type: 'lesson',
      badge: 'Lesson Announcement',
      title: `▶️ New Lesson: ${lesson.title}`,
      text,
      media: lesson.videoUrl || course.coverImage || '',
      audio: '',
      presentation: '',
      tags: ['Classroom', 'Training Lesson', category],
      attached_resources: attachedResources
    });
    setAnnouncementModalOpen(true);
  };

  // Publish Announcement to Community Feed
  const handlePublishAnnouncement = async () => {
    if (!announcementData || !announcementData.text.trim()) return;
    setAnnouncementSubmitting(true);
    try {
      await addPost(
        announcementData.text,
        announcementData.media || '',
        announcementData.audio || '',
        announcementData.presentation || '',
        announcementData.tags || [],
        announcementData.attached_resources || []
      );
      setAnnouncementModalOpen(false);
      setToastMessage('📢 Training Announcement published to Community Feed!');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Error publishing announcement:', err);
      alert('Failed to publish announcement: ' + (err.message || err));
    } finally {
      setAnnouncementSubmitting(false);
    }
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <h3 style={{ ...styles.cardSectionTitle, marginBottom: 0 }}>Course Details</h3>
                <button
                  type="button"
                  onClick={() => handleOpenCourseAnnouncement(activeCourse)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    backgroundColor: '#f0fdf4',
                    color: '#15803d',
                    border: '1px solid #bbf7d0',
                    padding: '0.45rem 0.9rem',
                    borderRadius: '7px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title="Broadcast this Course to the Training Feed"
                >
                  <Megaphone size={15} /> Announce Course on Feed
                </button>
              </div>

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

                <div style={{ 
                  gridColumn: 'span 2', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  padding: '0.85rem 1rem', 
                  backgroundColor: activeCourse.allowGuests ? 'rgba(16, 185, 129, 0.08)' : '#f8fafc', 
                  border: activeCourse.allowGuests ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--color-border)', 
                  borderRadius: '8px',
                  transition: 'all 0.2s ease'
                }}>
                  <input
                    type="checkbox"
                    id={`allowGuests-${activeCourse.id}`}
                    checked={!!activeCourse.allowGuests}
                    onChange={(e) => updateCourseField('allowGuests', e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                  />
                  <label htmlFor={`allowGuests-${activeCourse.id}`} style={{ cursor: 'pointer', fontSize: '0.88rem', color: 'var(--color-dark-navy)', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      🎓 Allow Guest Access (Designated Training)
                      {activeCourse.allowGuests && (
                        <span style={{ fontSize: '0.75rem', backgroundColor: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '12px', fontWeight: '800' }}>
                          GUEST ACCESSIBLE
                        </span>
                      )}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      When checked, self-registered guest profiles can view and complete this course. Unchecked courses remain exclusive to full Syndicate Agents.
                    </span>
                  </label>
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

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModuleAnnouncement(activeCourse, module, mIdx);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            backgroundColor: '#f0fdf4',
                            color: '#15803d',
                            border: '1px solid #bbf7d0',
                            padding: '0.3rem 0.6rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                          title="Announce this module on Training Feed"
                        >
                          <Megaphone size={13} /> Announce Module
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteModule(mIdx);
                          }}
                          style={{ color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
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

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                            LESSONS IN THIS MODULE ({(module.lessons || []).length})
                          </span>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              type="button" 
                              onClick={() => openCopyLessonModal(mIdx)} 
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                backgroundColor: '#f8fafc',
                                color: 'var(--color-dark-navy)',
                                border: '1px solid var(--color-border)',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                              title="Copy or reuse an existing lesson from any course or module"
                            >
                              <Copy size={14} /> Copy from Library
                            </button>
                            <button onClick={() => handleAddLesson(mIdx)} style={styles.addLessonBtn}>
                              <Plus size={14} /> Add Lesson
                            </button>
                          </div>
                        </div>

                        {/* Lessons List inside Module */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {(module.lessons || []).map((lesson, lIdx) => (
                            <div key={lesson.id || lIdx} style={styles.lessonEditorCard}>
                              {/* Lesson Header Fields */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ flex: '1 1 260px' }}>
                                  <label style={styles.label}>Lesson Title</label>
                                  <input
                                    type="text"
                                    value={lesson.title}
                                    onChange={(e) => updateLessonField(mIdx, lIdx, 'title', e.target.value)}
                                    style={{ ...styles.input, fontWeight: '700' }}
                                  />
                                </div>

                                <div style={{ width: '90px' }}>
                                  <label style={styles.label}>XP Award</label>
                                  <input
                                    type="number"
                                    value={lesson.xp || 25}
                                    onChange={(e) => updateLessonField(mIdx, lIdx, 'xp', parseInt(e.target.value) || 0)}
                                    style={styles.input}
                                  />
                                </div>

                                <div style={{ width: '90px' }}>
                                  <label style={styles.label}>Duration</label>
                                  <input
                                    type="text"
                                    value={lesson.duration || '15 min'}
                                    onChange={(e) => updateLessonField(mIdx, lIdx, 'duration', e.target.value)}
                                    style={styles.input}
                                  />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '1.4rem' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleDuplicateLesson(mIdx, lIdx)}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      backgroundColor: '#f1f5f9',
                                      color: 'var(--color-dark-navy)',
                                      border: '1px solid #cbd5e1',
                                      padding: '0.35rem 0.55rem',
                                      borderRadius: '5px',
                                      fontSize: '0.75rem',
                                      fontWeight: '700',
                                      cursor: 'pointer'
                                    }}
                                    title="Duplicate this lesson in this module"
                                  >
                                    <Copy size={13} /> Duplicate
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenLessonAnnouncement(activeCourse, module, lesson)}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      backgroundColor: '#f0fdf4',
                                      color: '#15803d',
                                      border: '1px solid #bbf7d0',
                                      padding: '0.35rem 0.55rem',
                                      borderRadius: '5px',
                                      fontSize: '0.75rem',
                                      fontWeight: '700',
                                      cursor: 'pointer'
                                    }}
                                    title="Announce this lesson on the Training Feed"
                                  >
                                    <Megaphone size={13} /> Announce
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteLesson(mIdx, lIdx)}
                                    style={{ color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                                    title="Delete Lesson"
                                  >
                                    <X size={18} />
                                  </button>
                                </div>
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

      {/* Copy Lesson from Library Modal */}
      {copyModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent} className="animate-fade-in">
            {/* Modal Header */}
            <div style={styles.modalHeader}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Copy size={20} color="#38bdf8" />
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>
                    Copy Lesson from Library
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '0.825rem', color: 'rgba(255,255,255,0.7)' }}>
                  Duplicate any lesson from your curriculum catalog into <strong>{activeCourse.title}</strong> (Module {copyTargetModuleIdx + 1})
                </p>
              </div>
              <button 
                onClick={() => setCopyModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Controls / Search */}
            <div style={styles.modalControls}>
              <div style={styles.searchBox}>
                <Search size={16} color="var(--color-text-muted)" />
                <input
                  type="text"
                  value={copySearchQuery}
                  onChange={(e) => setCopySearchQuery(e.target.value)}
                  placeholder="Search lessons by title, notes, keywords..."
                  style={styles.searchInput}
                />
                {copySearchQuery && (
                  <button 
                    onClick={() => setCopySearchQuery('')} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={14} color="var(--color-text-muted)" />
                  </button>
                )}
              </div>

              <select
                value={copySelectedCourseFilter}
                onChange={(e) => setCopySelectedCourseFilter(e.target.value)}
                style={styles.courseFilterSelect}
              >
                <option value="all">All Courses ({localCourses.length})</option>
                {localCourses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            {/* Modal Lessons List */}
            <div style={styles.modalList}>
              {(() => {
                const flatLessons = [];
                localCourses.forEach(c => {
                  (c.modules || []).forEach((m, mIdx) => {
                    (m.lessons || []).forEach(l => {
                      flatLessons.push({
                        courseId: c.id,
                        courseTitle: c.title,
                        courseCategory: c.category || 'General Training',
                        moduleId: m.id,
                        moduleTitle: m.title,
                        moduleNumber: mIdx + 1,
                        lesson: l
                      });
                    });
                  });
                });

                const filtered = flatLessons.filter(item => {
                  const matchesCourse = copySelectedCourseFilter === 'all' || item.courseId === copySelectedCourseFilter;
                  const query = copySearchQuery.toLowerCase().trim();
                  const matchesSearch = !query || 
                    item.lesson.title?.toLowerCase().includes(query) ||
                    item.lesson.description?.toLowerCase().includes(query) ||
                    item.courseTitle?.toLowerCase().includes(query) ||
                    item.moduleTitle?.toLowerCase().includes(query);
                  return matchesCourse && matchesSearch;
                });

                if (filtered.length === 0) {
                  return (
                    <div style={styles.modalEmpty}>
                      <BookOpen size={40} color="#94a3b8" />
                      <h4 style={{ margin: '0.75rem 0 0.25rem', color: 'var(--color-text-primary)' }}>No Lessons Found</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                        Try searching with different terms or select "All Courses".
                      </p>
                    </div>
                  );
                }

                return filtered.map((item, idx) => {
                  const mediaInfo = parseEmbedMedia(item.lesson.videoUrl);
                  return (
                    <div key={item.lesson.id || idx} style={styles.copyLessonCard}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                          <span style={styles.courseTagBadge}>{item.courseTitle}</span>
                          <span style={styles.moduleTagBadge}>M{item.moduleNumber}: {item.moduleTitle}</span>
                          {mediaInfo.type !== 'empty' && (
                            <span style={{ fontSize: '0.68rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                              {mediaInfo.badgeLabel}
                            </span>
                          )}
                        </div>

                        <h4 style={{ margin: '0 0 0.35rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          {item.lesson.title}
                        </h4>

                        {item.lesson.description && (
                          <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>
                            {item.lesson.description}
                          </p>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={13} color="var(--color-text-muted)" /> {item.lesson.duration || '15 min'}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#d97706' }}>
                            <Sparkles size={13} /> +{item.lesson.xp || 25} XP
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CheckSquare size={13} color="var(--color-text-muted)" /> {(item.lesson.steps || []).length} steps
                          </span>
                          {(item.lesson.resources || []).length > 0 && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10b981' }}>
                              <Paperclip size={13} /> {(item.lesson.resources || []).length} files
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyFromLibrary(item.lesson)}
                        style={styles.copyActionBtn}
                        title="Copy this lesson into active module"
                      >
                        <Copy size={15} /> Copy to Module {copyTargetModuleIdx + 1}
                      </button>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Feed Announcement Modal */}
      {announcementModalOpen && announcementData && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '720px' }} className="animate-fade-in">
            {/* Modal Header */}
            <div style={styles.modalHeader}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Megaphone size={20} color="#4ade80" />
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>
                    Announce on Training Feed
                  </h3>
                  <span style={styles.announcementTypeBadge}>
                    {announcementData.badge}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.825rem', color: 'rgba(255,255,255,0.7)' }}>
                  Broadcast this training update to all agents on the team's live Training & Community Feed.
                </p>
              </div>
              <button 
                onClick={() => setAnnouncementModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} />
              </button>
            </div>

            {/* Announcement Form */}
            <div style={styles.announcementFormBody}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={styles.label}>Post Body & Markdown Description</label>
                <textarea
                  value={announcementData.text}
                  onChange={(e) => setAnnouncementData({ ...announcementData, text: e.target.value })}
                  style={{ ...styles.input, minHeight: '160px', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.5' }}
                  placeholder="Announcement message markdown..."
                />
                <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  💡 Formatted with Markdown. Agents can click links to jump straight into the Classroom player!
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={styles.label}>Attached Video / Media URL (Optional)</label>
                  <input
                    type="text"
                    value={announcementData.media || ''}
                    onChange={(e) => setAnnouncementData({ ...announcementData, media: e.target.value })}
                    style={styles.input}
                    placeholder="YouTube, Loom, Vimeo, or Canva URL..."
                  />
                </div>

                <div>
                  <label style={styles.label}>Tags (Comma-separated)</label>
                  <input
                    type="text"
                    value={Array.isArray(announcementData.tags) ? announcementData.tags.join(', ') : announcementData.tags || ''}
                    onChange={(e) => setAnnouncementData({ 
                      ...announcementData, 
                      tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) 
                    })}
                    style={styles.input}
                    placeholder="Classroom, Training, Conversion..."
                  />
                </div>
              </div>

              {announcementData.attached_resources && announcementData.attached_resources.length > 0 && (
                <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--color-dark-navy)', display: 'block', marginBottom: '0.35rem' }}>
                    📎 {announcementData.attached_resources.length} Downloadable Materials Attached:
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {announcementData.attached_resources.map((r, i) => (
                      <div key={i} style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Paperclip size={12} color="#10b981" />
                        <span style={{ fontWeight: 600 }}>{r.title}</span>
                        <span style={{ color: 'var(--color-text-muted)' }}>({r.type})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div style={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setAnnouncementModalOpen(false)}
                style={styles.modalCancelBtn}
                disabled={announcementSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePublishAnnouncement}
                style={styles.modalPublishBtn}
                disabled={announcementSubmitting || !announcementData.text.trim()}
              >
                {announcementSubmitting ? (
                  <>Publishing...</>
                ) : (
                  <>
                    <Send size={16} /> Broadcast to Training Feed
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
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
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    backdropFilter: 'blur(4px)',
    zIndex: 1100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem'
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '16px',
    maxWidth: '780px',
    width: '100%',
    maxHeight: '88vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
    overflow: 'hidden'
  },
  modalHeader: {
    padding: '1.25rem 1.5rem',
    background: 'linear-gradient(135deg, #0b192c 0%, #1e3a8a 100%)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.1)'
  },
  modalCloseBtn: {
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s ease'
  },
  modalControls: {
    padding: '1rem 1.5rem',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid var(--color-border)',
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap'
  },
  searchBox: {
    flex: '1 1 300px',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'white',
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid var(--color-border)'
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '0.875rem',
    color: 'var(--color-text-primary)'
  },
  courseFilterSelect: {
    padding: '0.5rem 0.85rem',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    backgroundColor: 'white',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--color-dark-navy)',
    outline: 'none',
    cursor: 'pointer'
  },
  modalList: {
    padding: '1.25rem 1.5rem',
    overflowY: 'auto',
    maxHeight: '480px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.875rem'
  },
  modalEmpty: {
    textAlign: 'center',
    padding: '3rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  copyLessonCard: {
    backgroundColor: 'white',
    border: '1px solid var(--color-border)',
    borderRadius: '10px',
    padding: '1rem 1.25rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    transition: 'all 0.15s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
  },
  courseTagBadge: {
    fontSize: '0.7rem',
    fontWeight: '700',
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    padding: '2px 8px',
    borderRadius: '4px'
  },
  moduleTagBadge: {
    fontSize: '0.7rem',
    fontWeight: '600',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    padding: '2px 8px',
    borderRadius: '4px'
  },
  copyActionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    border: 'none',
    padding: '0.5rem 0.9rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: '700',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'transform 0.1s ease'
  },
  announcementTypeBadge: {
    fontSize: '0.7rem',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    color: '#4ade80',
    padding: '2px 8px',
    borderRadius: '4px',
    border: '1px solid rgba(74, 222, 128, 0.3)'
  },
  announcementFormBody: {
    padding: '1.25rem 1.5rem',
    overflowY: 'auto',
    maxHeight: '60vh'
  },
  modalFooter: {
    padding: '1rem 1.5rem',
    backgroundColor: '#f8fafc',
    borderTop: '1px solid var(--color-border)',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '0.75rem'
  },
  modalCancelBtn: {
    backgroundColor: 'transparent',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text-secondary)',
    padding: '0.55rem 1.1rem',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '0.875rem',
    cursor: 'pointer'
  },
  modalPublishBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.45rem',
    backgroundColor: '#16a34a',
    color: 'white',
    border: 'none',
    padding: '0.55rem 1.25rem',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '0.875rem',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)'
  }
};

export default ClassroomManager;
