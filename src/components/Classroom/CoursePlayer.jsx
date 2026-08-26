import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Circle, 
  Play, 
  Video, 
  Download, 
  ExternalLink, 
  Sparkles, 
  BookOpen, 
  CheckSquare, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  FileSpreadsheet, 
  Check,
  Lock
} from 'lucide-react';
import { useAgent } from '../../context/AgentContext';
import { useAuth } from '../../context/AuthContext';
import LevelBadge from '../Gamification/LevelBadge';

const CoursePlayer = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { 
    courses, 
    agentClassroomProgress, 
    toggleLessonCompletion, 
    gamificationSettings,
    xp 
  } = useAgent();

  // Find course
  const currentCourse = (courses || []).find(c => c.id === courseId);

  // Flatten all lessons across modules
  const allLessons = [];
  (currentCourse?.modules || []).forEach(module => {
    (module.lessons || []).forEach(lesson => {
      allLessons.push({
        ...lesson,
        moduleId: module.id,
        moduleTitle: module.title
      });
    });
  });

  // Current active lesson
  const activeLessonId = lessonId || allLessons[0]?.id;
  const currentLessonIndex = allLessons.findIndex(l => l.id === activeLessonId);
  const currentLesson = allLessons[currentLessonIndex] || allLessons[0];

  // Local step check states for the active lesson's sub-steps
  const [checkedSteps, setCheckedSteps] = useState({});
  const [expandedModules, setExpandedModules] = useState(() => {
    return currentLesson?.moduleId ? { [currentLesson.moduleId]: true } : {};
  });
  const [celebrationToast, setCelebrationToast] = useState(null);

  // If no course found
  if (!currentCourse) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h2>Course not found</h2>
        <p className="text-muted" style={{ marginBottom: '1.5rem' }}>The requested course could not be loaded.</p>
        <Link to="/classroom" className="btn-primary">
          <ArrowLeft size={16} /> Return to Classroom
        </Link>
      </div>
    );
  }

  // Level Gating Check
  const requiredLevel = currentCourse.unlockLevel || 1;
  const currentLevel = gamificationSettings?.levelThresholds 
    ? (gamificationSettings.levelThresholds.filter(t => (xp || 0) >= t.minXp).slice(-1)[0]?.level || 1)
    : 1;
  const isLocked = currentLevel < requiredLevel && currentUser?.role !== 'admin';

  if (isLocked) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', maxWidth: '600px', margin: '2rem auto', backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <Lock size={32} color="var(--color-danger)" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>Course Locked</h2>
        <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
          This training unlocks at <strong>Level {requiredLevel}</strong>. Continue completing onboarding checklist tasks and participating in the syndicate to level up!
        </p>
        <Link to="/classroom" className="btn-primary">
          <ArrowLeft size={16} /> Back to Classroom Catalog
        </Link>
      </div>
    );
  }

  // Course completion status
  const completedLessonIds = agentClassroomProgress[currentCourse.id] || [];
  const isCurrentLessonCompleted = completedLessonIds.includes(currentLesson?.id);
  const totalLessons = allLessons.length;
  const completedCount = completedLessonIds.length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  // Navigation handlers
  const prevLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex < allLessons.length - 1 ? allLessons[currentLessonIndex + 1] : null;

  const handleSelectLesson = (lesId) => {
    navigate(`/classroom/${currentCourse.id}/${lesId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleCompletion = async () => {
    if (!currentLesson) return;
    const isNowCompleting = !isCurrentLessonCompleted;
    const lessonXp = currentLesson.xp || 25;

    await toggleLessonCompletion(
      currentCourse.id, 
      currentLesson.id, 
      lessonXp, 
      currentCourse.title, 
      currentLesson.title
    );

    if (isNowCompleting) {
      setCelebrationToast(`🎉 +${lessonXp} XP! Lesson completed!`);
      setTimeout(() => setCelebrationToast(null), 3500);

      // Auto advance to next lesson if available
      if (nextLesson) {
        setTimeout(() => {
          navigate(`/classroom/${currentCourse.id}/${nextLesson.id}`);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 1000);
      }
    }
  };

  const toggleSubStep = (stepIdx) => {
    const key = `${currentLesson.id}_step_${stepIdx}`;
    setCheckedSteps(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleModuleAccordion = (modId) => {
    setExpandedModules(prev => ({
      ...prev,
      [modId]: !prev[modId]
    }));
  };

  // Convert video URL to embeddable iframe if YouTube/Vimeo/Loom
  const getEmbedUrl = (url) => {
    if (!url) return null;
    if (url.includes('youtube.com/watch?v=')) {
      const vidId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${vidId}`;
    }
    if (url.includes('youtu.be/')) {
      const vidId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${vidId}`;
    }
    if (url.includes('vimeo.com/')) {
      const vidId = url.split('vimeo.com/')[1]?.split('?')[0];
      return `https://player.vimeo.com/video/${vidId}`;
    }
    if (url.includes('loom.com/share/')) {
      const vidId = url.split('loom.com/share/')[1]?.split('?')[0];
      return `https://www.loom.com/embed/${vidId}`;
    }
    return url;
  };

  const embedUrl = getEmbedUrl(currentLesson?.videoUrl);

  return (
    <div className="animate-fade-in" style={styles.container}>
      {/* Celebration Floating Toast */}
      {celebrationToast && (
        <div style={styles.toast}>
          <Sparkles size={20} color="#fbbf24" />
          <span>{celebrationToast}</span>
        </div>
      )}

      {/* Top Header Bar / Breadcrumb */}
      <div style={styles.topBar}>
        <div style={styles.breadcrumbs}>
          <Link to="/classroom" style={styles.backLink}>
            <ArrowLeft size={16} />
            <span>Classroom</span>
          </Link>
          <ChevronRight size={14} color="var(--color-text-muted)" />
          <span style={styles.breadcrumbCourse}>{currentCourse.title}</span>
          {currentLesson && (
            <>
              <ChevronRight size={14} color="var(--color-text-muted)" />
              <span style={styles.breadcrumbLesson}>{currentLesson.title}</span>
            </>
          )}
        </div>

        <div style={styles.topBarRight}>
          <LevelBadge level={requiredLevel} size="xs" />
          <div style={styles.courseProgressPill}>
            <span>{completedCount}/{totalLessons} Done</span>
            <div style={styles.miniProgressBg}>
              <div style={{ ...styles.miniProgressFill, width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column LMS Player Grid */}
      <div style={styles.playerLayout}>
        {/* Left: Video, Interactive Steps, Study Notes, & Actions */}
        <div style={styles.mainContent}>
          {/* Lesson Header */}
          <div style={styles.lessonHeaderCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <span style={styles.moduleBadge}>{currentLesson?.moduleTitle}</span>
                <h1 style={styles.lessonTitle}>{currentLesson?.title}</h1>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={styles.xpPill}>
                  <Sparkles size={14} color="#f59e0b" />
                  <span>+{currentLesson?.xp || 25} XP</span>
                </div>
                {isCurrentLessonCompleted && (
                  <div style={styles.completedTag}>
                    <CheckCircle2 size={14} /> Completed
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Video Player Box */}
          <div style={styles.videoCard}>
            {embedUrl ? (
              <div style={styles.videoResponsiveWrapper}>
                <iframe
                  src={embedUrl}
                  title={currentLesson?.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  style={styles.iframe}
                />
              </div>
            ) : (
              <div style={styles.videoPlaceholder}>
                <div style={styles.placeholderIcon}>
                  <Video size={48} color="rgba(255,255,255,0.7)" />
                </div>
                <h3 style={{ color: 'white', marginTop: '1rem', fontWeight: '700' }}>{currentLesson?.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>Follow the step-by-step training checklist below.</p>
              </div>
            )}
          </div>

          {/* Step-by-Step Training Checklist (Interactive Action Items) */}
          {currentLesson?.steps && currentLesson.steps.length > 0 && (
            <div style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckSquare size={20} color="var(--color-primary)" />
                  <h3 style={styles.sectionTitle}>Step-by-Step Action Items</h3>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Take immediate action while going through this training.
                </span>
              </div>

              <div style={styles.stepsList}>
                {currentLesson.steps.map((step, idx) => {
                  const stepKey = `${currentLesson.id}_step_${idx}`;
                  const isChecked = !!checkedSteps[stepKey];

                  return (
                    <div 
                      key={idx} 
                      style={{
                        ...styles.stepItem,
                        backgroundColor: isChecked ? '#f0fdf4' : '#fafafa',
                        borderColor: isChecked ? '#bbf7d0' : 'var(--color-border)'
                      }}
                    >
                      <button 
                        onClick={() => toggleSubStep(idx)}
                        style={styles.stepCheckboxBtn}
                        aria-label="Toggle step"
                      >
                        {isChecked ? (
                          <CheckCircle2 size={22} color="var(--color-success)" />
                        ) : (
                          <Circle size={22} color="var(--color-text-muted)" />
                        )}
                      </button>

                      <div style={styles.stepContent}>
                        <div style={styles.stepTitleRow}>
                          <span style={{ fontWeight: '700', fontSize: '0.95rem', color: isChecked ? 'var(--color-text-secondary)' : 'var(--color-text-primary)' }}>
                            {idx + 1}. {step.title}
                          </span>
                          {step.link && (
                            <a 
                              href={step.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={styles.stepLinkBtn}
                            >
                              Open Link <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                        <p style={{ ...styles.stepInstruction, textDecoration: isChecked ? 'line-through' : 'none' }}>
                          {step.instruction}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Lesson Study Notes & Scripts */}
          {currentLesson?.description && (
            <div style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BookOpen size={20} color="var(--color-primary)" />
                  <h3 style={styles.sectionTitle}>Training Guide & Study Notes</h3>
                </div>
              </div>

              <div style={styles.studyNotesContent}>
                <p style={{ lineHeight: '1.7', fontSize: '0.95rem', color: 'var(--color-text-primary)', whiteSpace: 'pre-line' }}>
                  {currentLesson.description}
                </p>
              </div>
            </div>
          )}

          {/* Attached Resources & Downloads */}
          {currentLesson?.resources && currentLesson.resources.length > 0 && (
            <div style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Download size={20} color="var(--color-primary)" />
                  <h3 style={styles.sectionTitle}>Downloadable Templates & Resources</h3>
                </div>
              </div>

              <div style={styles.resourcesGrid}>
                {currentLesson.resources.map((res, rIdx) => (
                  <a
                    key={rIdx}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.resourceCard}
                  >
                    <div style={styles.resourceIconBox}>
                      {res.type === 'sheet' ? (
                        <FileSpreadsheet size={20} color="#10b981" />
                      ) : (
                        <FileText size={20} color="var(--color-primary)" />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={styles.resourceName}>{res.name}</div>
                      <div style={styles.resourceSub}>{res.type ? res.type.toUpperCase() : 'DOCUMENT'} • Click to view</div>
                    </div>
                    <ExternalLink size={16} color="var(--color-text-muted)" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Navigation & Mark Complete Bottom Bar */}
          <div style={styles.bottomNavCard}>
            <button
              onClick={() => prevLesson && handleSelectLesson(prevLesson.id)}
              disabled={!prevLesson}
              style={{
                ...styles.navBtn,
                opacity: prevLesson ? 1 : 0.4,
                cursor: prevLesson ? 'pointer' : 'not-allowed'
              }}
            >
              <ChevronLeft size={18} />
              <span>Previous Lesson</span>
            </button>

            <button
              onClick={handleToggleCompletion}
              style={{
                ...styles.completeBtn,
                backgroundColor: isCurrentLessonCompleted ? '#ecfdf5' : 'var(--color-primary)',
                color: isCurrentLessonCompleted ? 'var(--color-success)' : 'white',
                borderColor: isCurrentLessonCompleted ? '#a7f3d0' : 'transparent'
              }}
            >
              {isCurrentLessonCompleted ? (
                <>
                  <Check size={18} />
                  <span>Completed (+{currentLesson?.xp || 25} XP)</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>Mark as Complete & Next (+{currentLesson?.xp || 25} XP)</span>
                </>
              )}
            </button>

            <button
              onClick={() => nextLesson && handleSelectLesson(nextLesson.id)}
              disabled={!nextLesson}
              style={{
                ...styles.navBtn,
                opacity: nextLesson ? 1 : 0.4,
                cursor: nextLesson ? 'pointer' : 'not-allowed'
              }}
            >
              <span>Next Lesson</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Right: Course Curriculum Syllabus Sidebar */}
        <div style={styles.sidebar}>
          {/* Course Summary Widget */}
          <div style={styles.curriculumHeaderCard}>
            <h3 style={styles.curriculumCourseTitle}>{currentCourse.title}</h3>
            
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Course Progress</span>
                <span style={{ color: 'var(--color-primary)' }}>{progressPercent}%</span>
              </div>
              <div style={styles.sidebarProgressBarBg}>
                <div style={{ ...styles.sidebarProgressBarFill, width: `${progressPercent}%` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
                <span>{completedCount} of {totalLessons} Lessons</span>
                <span>{completedCount * 25} XP Earned</span>
              </div>
            </div>
          </div>

          {/* Module List Accordions */}
          <div style={styles.modulesContainer}>
            {(currentCourse.modules || []).map((module, mIdx) => {
              const isExpanded = !!expandedModules[module.id];
              const moduleLessons = module.lessons || [];
              const completedInMod = moduleLessons.filter(l => completedLessonIds.includes(l.id)).length;
              const isModComplete = moduleLessons.length > 0 && completedInMod === moduleLessons.length;

              return (
                <div key={module.id || mIdx} style={styles.moduleAccordion}>
                  {/* Module Header */}
                  <div 
                    style={styles.moduleAccordionHeader}
                    onClick={() => toggleModuleAccordion(module.id)}
                  >
                    <div style={{ flex: 1, paddingRight: '0.5rem' }}>
                      <div style={styles.moduleNumTag}>MODULE {mIdx + 1}</div>
                      <div style={styles.moduleHeaderTitle}>{module.title}</div>
                      <div style={styles.moduleProgressSub}>
                        {completedInMod}/{moduleLessons.length} Completed
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {isModComplete && (
                        <CheckCircle2 size={16} color="var(--color-success)" />
                      )}
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>

                  {/* Lessons List */}
                  {isExpanded && (
                    <div style={styles.lessonsList}>
                      {moduleLessons.map((lesson, lIdx) => {
                        const isSelected = lesson.id === activeLessonId;
                        const isDone = completedLessonIds.includes(lesson.id);

                        return (
                          <div
                            key={lesson.id || lIdx}
                            onClick={() => handleSelectLesson(lesson.id)}
                            style={{
                              ...styles.lessonRow,
                              backgroundColor: isSelected ? 'rgba(0, 161, 224, 0.08)' : 'transparent',
                              borderLeftColor: isSelected ? 'var(--color-primary)' : 'transparent'
                            }}
                          >
                            <div style={styles.lessonStatusIcon}>
                              {isDone ? (
                                <CheckCircle2 size={16} color="var(--color-success)" />
                              ) : isSelected ? (
                                <Play size={14} color="var(--color-primary)" />
                              ) : (
                                <Circle size={15} color="#cbd5e1" />
                              )}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                ...styles.lessonRowTitle,
                                color: isSelected ? 'var(--color-primary)' : isDone ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
                                fontWeight: isSelected ? '700' : '500'
                              }}>
                                {lesson.title}
                              </div>
                              <div style={styles.lessonRowMeta}>
                                {lesson.duration && <span>{lesson.duration}</span>}
                                <span>+{lesson.xp || 25} XP</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '1.5rem 2rem',
    maxWidth: '1440px',
    margin: '0 auto',
  },
  toast: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    backgroundColor: '#0f172a',
    color: 'white',
    padding: '1rem 1.5rem',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
    zIndex: 1000,
    fontWeight: '700',
    fontSize: '0.95rem',
    border: '1px solid rgba(255,255,255,0.1)'
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid var(--color-border)',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  breadcrumbs: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    flexWrap: 'wrap'
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    color: 'var(--color-primary)',
    fontWeight: '700',
    textDecoration: 'none'
  },
  breadcrumbCourse: {
    color: 'var(--color-text-secondary)',
    fontWeight: '600'
  },
  breadcrumbLesson: {
    color: 'var(--color-text-primary)',
    fontWeight: '700'
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  courseProgressPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    backgroundColor: 'white',
    padding: '0.35rem 0.75rem',
    borderRadius: '999px',
    border: '1px solid var(--color-border)',
    fontSize: '0.75rem',
    fontWeight: '700',
    color: 'var(--color-text-secondary)'
  },
  miniProgressBg: {
    width: '60px',
    height: '6px',
    backgroundColor: '#e2e8f0',
    borderRadius: '999px',
    overflow: 'hidden'
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: 'var(--color-primary)',
    borderRadius: '999px',
    transition: 'width 0.3s ease'
  },
  playerLayout: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 360px',
    gap: '2rem',
    alignItems: 'start'
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  lessonHeaderCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    border: '1px solid var(--color-border)'
  },
  moduleBadge: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: 'var(--color-primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    display: 'block',
    marginBottom: '0.25rem'
  },
  lessonTitle: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: 'var(--color-text-primary)',
    lineHeight: '1.3'
  },
  xpPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    backgroundColor: '#fef3c7',
    color: '#b45309',
    padding: '0.35rem 0.75rem',
    borderRadius: '999px',
    fontWeight: '800',
    fontSize: '0.8rem'
  },
  completedTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    backgroundColor: '#ecfdf5',
    color: 'var(--color-success)',
    padding: '0.35rem 0.75rem',
    borderRadius: '999px',
    fontWeight: '700',
    fontSize: '0.8rem'
  },
  videoCard: {
    backgroundColor: '#0f172a',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
  },
  videoResponsiveWrapper: {
    position: 'relative',
    paddingBottom: '56.25%', /* 16:9 Aspect Ratio */
    height: 0,
    overflow: 'hidden'
  },
  iframe: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: 0
  },
  videoPlaceholder: {
    padding: '5rem 2rem',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  placeholderIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    border: '1px solid var(--color-border)'
  },
  sectionHeader: {
    marginBottom: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: 'var(--color-text-primary)'
  },
  stepsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  stepItem: {
    display: 'flex',
    gap: '1rem',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid',
    alignItems: 'flex-start',
    transition: 'all 0.15s ease'
  },
  stepCheckboxBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    marginTop: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepContent: {
    flex: 1
  },
  stepTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '0.35rem',
    flexWrap: 'wrap'
  },
  stepLinkBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    backgroundColor: 'white',
    border: '1px solid var(--color-border)',
    color: 'var(--color-primary)',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: '700',
    textDecoration: 'none'
  },
  stepInstruction: {
    fontSize: '0.875rem',
    color: 'var(--color-text-secondary)',
    lineHeight: '1.5',
    margin: 0
  },
  studyNotesContent: {
    backgroundColor: '#f8fafc',
    padding: '1.25rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },
  resourcesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1rem'
  },
  resourceCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.875rem 1rem',
    borderRadius: '8px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    textDecoration: 'none',
    transition: 'all 0.15s ease'
  },
  resourceIconBox: {
    width: '36px',
    height: '36px',
    borderRadius: '6px',
    backgroundColor: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  },
  resourceName: {
    fontSize: '0.875rem',
    fontWeight: '700',
    color: 'var(--color-text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  resourceSub: {
    fontSize: '0.7rem',
    color: 'var(--color-text-muted)',
    fontWeight: '600'
  },
  bottomNavCard: {
    backgroundColor: 'white',
    padding: '1.25rem 1.5rem',
    borderRadius: '12px',
    border: '1px solid var(--color-border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap'
  },
  navBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'white',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text-primary)',
    padding: '0.65rem 1rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '600'
  },
  completeBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '0.95rem',
    fontWeight: '800',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    position: 'sticky',
    top: '1rem'
  },
  curriculumHeaderCard: {
    backgroundColor: 'white',
    padding: '1.25rem',
    borderRadius: '12px',
    border: '1px solid var(--color-border)'
  },
  curriculumCourseTitle: {
    fontSize: '1.1rem',
    fontWeight: '800',
    color: 'var(--color-text-primary)'
  },
  sidebarProgressBarBg: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e2e8f0',
    borderRadius: '999px',
    overflow: 'hidden'
  },
  sidebarProgressBarFill: {
    height: '100%',
    backgroundColor: 'var(--color-primary)',
    borderRadius: '999px',
    transition: 'width 0.4s ease'
  },
  modulesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  moduleAccordion: {
    backgroundColor: 'white',
    borderRadius: '10px',
    border: '1px solid var(--color-border)',
    overflow: 'hidden'
  },
  moduleAccordionHeader: {
    padding: '0.875rem 1rem',
    backgroundColor: '#f8fafc',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    userSelect: 'none'
  },
  moduleNumTag: {
    fontSize: '0.675rem',
    fontWeight: '800',
    color: 'var(--color-text-muted)',
    letterSpacing: '0.05em'
  },
  moduleHeaderTitle: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: 'var(--color-text-primary)',
    lineHeight: '1.3'
  },
  moduleProgressSub: {
    fontSize: '0.725rem',
    color: 'var(--color-text-muted)',
    marginTop: '0.15rem'
  },
  lessonsList: {
    display: 'flex',
    flexDirection: 'column'
  },
  lessonRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderLeft: '3px solid transparent',
    borderTop: '1px solid #f1f5f9',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease'
  },
  lessonStatusIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '18px'
  },
  lessonRowTitle: {
    fontSize: '0.825rem',
    lineHeight: '1.3',
    marginBottom: '0.15rem'
  },
  lessonRowMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.7rem',
    color: 'var(--color-text-muted)',
    fontWeight: '600'
  }
};

export default CoursePlayer;
