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
  Lock,
  Layers
} from 'lucide-react';
import { useAgent } from '../../context/AgentContext';
import { useAuth } from '../../context/AuthContext';
import LevelBadge from '../Gamification/LevelBadge';
import { parseEmbedMedia } from '../../utils/mediaEmbed';

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

  // Mobile Tab State: 'lesson' | 'curriculum'
  const [mobileTab, setMobileTab] = useState('lesson');

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
      <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
        <h2>Course not found</h2>
        <p className="text-muted" style={{ marginBottom: '1.5rem' }}>The requested course could not be loaded.</p>
        <Link to="/classroom" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
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
      <div style={{ padding: '3rem 1.5rem', textAlign: 'center', maxWidth: '600px', margin: '2rem auto', backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <Lock size={32} color="var(--color-danger)" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>Course Locked</h2>
        <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
          This training unlocks at <strong>Level {requiredLevel}</strong>. Continue completing onboarding checklist tasks and participating in the syndicate to level up!
        </p>
        <Link to="/classroom" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
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
    setMobileTab('lesson');
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
          setMobileTab('lesson');
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

  // Parse video, Canva presentation, Tango.ai walkthrough, or iframe embed media
  const embedMedia = parseEmbedMedia(currentLesson?.videoUrl);

  return (
    <div className="animate-fade-in course-player-container">
      {/* Dynamic Mobile & Desktop Responsive Styles */}
      <style>{`
        .course-player-container {
          padding: 1.5rem 2rem;
          max-width: 1440px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
        }
        .course-player-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
          padding-bottom: 0.875rem;
          border-bottom: 1px solid var(--color-border);
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .course-player-breadcrumbs {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          flex-wrap: wrap;
          min-width: 0;
        }
        .course-player-topbar-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .course-player-mobile-tabs {
          display: none;
        }
        .course-player-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 360px;
          gap: 2rem;
          align-items: start;
        }
        .course-player-main {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          min-width: 0;
        }
        .course-player-sidebar {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          position: sticky;
          top: 1rem;
          min-width: 0;
        }
        .course-player-resources-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 0.875rem;
        }
        .course-bottom-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
          background-color: white;
          padding: 1.25rem 1.5rem;
          border-radius: 12px;
          border: 1px solid var(--color-border);
        }
        .course-bottom-complete-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          border: 1px solid transparent;
          font-size: 0.95rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .course-bottom-nav-arrows {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        /* Tablet & Mobile Breakpoint (< 1024px) */
        @media (max-width: 1023px) {
          .course-player-container {
            padding: 0.5rem 0 2.5rem 0;
          }
          .course-player-topbar {
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
            margin-bottom: 1rem;
          }
          .course-player-topbar-right {
            justify-content: space-between;
            width: 100%;
          }
          .course-player-mobile-tabs {
            display: flex;
            background: #f1f5f9;
            padding: 4px;
            border-radius: 10px;
            gap: 4px;
            margin-bottom: 1.25rem;
          }
          .course-player-mobile-tab-btn {
            flex: 1;
            padding: 0.65rem 0.75rem;
            border: none;
            border-radius: 8px;
            font-size: 0.85rem;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.4rem;
            transition: all 0.15s ease;
          }
          .course-player-mobile-tab-btn.active {
            background: white;
            color: var(--color-primary);
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .course-player-mobile-tab-btn:not(.active) {
            background: transparent;
            color: var(--color-text-secondary);
          }
          .course-player-layout {
            display: block;
          }
          .course-player-main.mobile-hidden {
            display: none !important;
          }
          .course-player-sidebar.mobile-hidden {
            display: none !important;
          }
          .course-player-sidebar {
            position: static;
            width: 100%;
          }
          .course-player-resources-grid {
            grid-template-columns: 1fr;
          }
          .course-bottom-nav {
            flex-direction: column;
            gap: 0.875rem;
            padding: 1rem;
          }
          .course-bottom-complete-btn {
            width: 100%;
            padding: 0.85rem 1rem;
            font-size: 0.95rem;
          }
          .course-bottom-nav-arrows {
            display: flex;
            justify-content: space-between;
            width: 100%;
            gap: 0.5rem;
          }
          .course-bottom-nav-arrows button {
            flex: 1;
            justify-content: center;
          }
          .lesson-title-text {
            font-size: 1.25rem !important;
          }
          .lesson-header-card-box {
            padding: 1rem !important;
          }
          .section-card-box {
            padding: 1rem !important;
          }
        }

        @media (max-width: 640px) {
          .lesson-title-text {
            font-size: 1.15rem !important;
          }
          .breadcrumb-text-course {
            max-width: 120px !important;
          }
          .breadcrumb-text-lesson {
            max-width: 130px !important;
          }
        }
      `}</style>

      {/* Celebration Floating Toast */}
      {celebrationToast && (
        <div style={styles.toast}>
          <Sparkles size={20} color="#fbbf24" />
          <span>{celebrationToast}</span>
        </div>
      )}

      {/* Top Header Bar / Breadcrumb */}
      <div className="course-player-topbar">
        <div className="course-player-breadcrumbs">
          <Link to="/classroom" style={styles.backLink}>
            <ArrowLeft size={16} />
            <span>Classroom</span>
          </Link>
          <ChevronRight size={14} color="var(--color-text-muted)" />
          <span className="breadcrumb-text-course" style={styles.breadcrumbCourse}>{currentCourse.title}</span>
          {currentLesson && (
            <>
              <ChevronRight size={14} color="var(--color-text-muted)" />
              <span className="breadcrumb-text-lesson" style={styles.breadcrumbLesson}>{currentLesson.title}</span>
            </>
          )}
        </div>

        <div className="course-player-topbar-right">
          <LevelBadge level={requiredLevel} size="xs" />
          <div style={styles.courseProgressPill}>
            <span>{completedCount}/{totalLessons} Done</span>
            <div style={styles.miniProgressBg}>
              <div style={{ ...styles.miniProgressFill, width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Tab Switcher (Lesson vs Syllabus) */}
      <div className="course-player-mobile-tabs">
        <button 
          type="button" 
          className={`course-player-mobile-tab-btn ${mobileTab === 'lesson' ? 'active' : ''}`}
          onClick={() => setMobileTab('lesson')}
        >
          <Play size={15} />
          <span>Lesson Content</span>
        </button>
        <button 
          type="button" 
          className={`course-player-mobile-tab-btn ${mobileTab === 'curriculum' ? 'active' : ''}`}
          onClick={() => setMobileTab('curriculum')}
        >
          <Layers size={15} />
          <span>Syllabus ({completedCount}/{totalLessons})</span>
        </button>
      </div>

      {/* Main LMS Player Grid / Responsive Layout */}
      <div className="course-player-layout">
        {/* Left: Video, Interactive Steps, Study Notes, & Actions */}
        <div className={`course-player-main ${mobileTab === 'curriculum' ? 'mobile-hidden' : ''}`}>
          {/* Lesson Header Card */}
          <div className="lesson-header-card-box" style={styles.lessonHeaderCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '180px' }}>
                <span style={styles.moduleBadge}>{currentLesson?.moduleTitle}</span>
                <h1 className="lesson-title-text" style={styles.lessonTitle}>{currentLesson?.title}</h1>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
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

          {/* Training Media / Video / Presentation / Walkthrough Box */}
          <div style={styles.videoCard}>
            {embedMedia && embedMedia.embedUrl ? (
              <div>
                {/* Media Type & Quick Action Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.6rem 1rem',
                  backgroundColor: '#0b1120',
                  borderBottom: '1px solid rgba(255,255,255,0.08)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      backgroundColor: `${embedMedia.badgeColor}25`,
                      color: embedMedia.badgeColor
                    }}>
                      {embedMedia.badgeLabel}
                    </span>
                    {embedMedia.isWalkthrough && (
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Interactive Step-by-Step Guide</span>
                    )}
                    {embedMedia.isPresentation && (
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Interactive Slideshow</span>
                    )}
                  </div>

                  <a
                    href={embedMedia.rawUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.75rem',
                      color: '#94a3b8',
                      textDecoration: 'none',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; }}
                  >
                    <span>Open Full Screen</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                {/* Media Embed Container */}
                {embedMedia.isDirectVideo ? (
                  <div style={styles.videoResponsiveWrapper}>
                    <video
                      src={embedMedia.embedUrl}
                      controls
                      playsInline
                      style={styles.iframe}
                    />
                  </div>
                ) : (
                  <div style={{
                    ...styles.videoResponsiveWrapper,
                    ...(embedMedia.type === 'tango' ? {
                      paddingBottom: 0,
                      height: '660px',
                      minHeight: '600px'
                    } : {})
                  }}>
                    <iframe
                      src={embedMedia.embedUrl}
                      title={currentLesson?.title || 'Training Content'}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      style={styles.iframe}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div style={styles.videoPlaceholder}>
                <div style={styles.placeholderIcon}>
                  <Video size={40} color="rgba(255,255,255,0.7)" />
                </div>
                <h3 style={{ color: 'white', marginTop: '1rem', fontWeight: '700', fontSize: '1.1rem' }}>{currentLesson?.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>Follow the step-by-step training checklist below.</p>
              </div>
            )}
          </div>

          {/* Step-by-Step Training Checklist (Interactive Action Items) */}
          {currentLesson?.steps && currentLesson.steps.length > 0 && (
            <div className="section-card-box" style={styles.sectionCard}>
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
            <div className="section-card-box" style={styles.sectionCard}>
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
            <div className="section-card-box" style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Download size={20} color="var(--color-primary)" />
                  <h3 style={styles.sectionTitle}>Downloadable Templates & Resources</h3>
                </div>
              </div>

              <div className="course-player-resources-grid">
                {currentLesson.resources.map((res, rIdx) => {
                  const getResourceIcon = (type) => {
                    if (type === 'sheet') return <FileSpreadsheet size={20} color="#10b981" />;
                    if (type === 'canva') return <Sparkles size={20} color="#7d2ae8" />;
                    if (type === 'tango') return <Sparkles size={20} color="#ec4899" />;
                    if (type === 'video') return <Video size={20} color="#3b82f6" />;
                    return <FileText size={20} color="var(--color-primary)" />;
                  };

                  return (
                    <a
                      key={rIdx}
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.resourceCard}
                    >
                      <div style={styles.resourceIconBox}>
                        {getResourceIcon(res.type)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={styles.resourceName}>{res.name}</div>
                        <div style={styles.resourceSub}>{res.type ? res.type.toUpperCase() : 'DOCUMENT'} • Tap to view</div>
                      </div>
                      <ExternalLink size={16} color="var(--color-text-muted)" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation & Mark Complete Bottom Bar */}
          <div className="course-bottom-nav">
            <button
              onClick={handleToggleCompletion}
              className="course-bottom-complete-btn"
              style={{
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

            <div className="course-bottom-nav-arrows">
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
                <span>Previous</span>
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
                <span>Next</span>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Course Curriculum Syllabus Sidebar */}
        <div className={`course-player-sidebar ${mobileTab === 'lesson' ? 'mobile-hidden' : ''}`}>
          {/* Course Summary Widget */}
          <div style={styles.curriculumHeaderCard}>
            <h3 style={styles.curriculumCourseTitle}>{currentCourse.title}</h3>
            
            <div style={{ marginTop: '0.875rem' }}>
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
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    color: 'var(--color-primary)',
    fontWeight: '700',
    textDecoration: 'none',
    whiteSpace: 'nowrap'
  },
  breadcrumbCourse: {
    color: 'var(--color-text-secondary)',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '180px'
  },
  breadcrumbLesson: {
    color: 'var(--color-text-primary)',
    fontWeight: '700',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '200px'
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
    width: '50px',
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
  lessonHeaderCard: {
    backgroundColor: 'white',
    padding: '1.25rem 1.5rem',
    borderRadius: '12px',
    border: '1px solid var(--color-border)'
  },
  moduleBadge: {
    fontSize: '0.725rem',
    fontWeight: '700',
    color: 'var(--color-primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    display: 'block',
    marginBottom: '0.25rem'
  },
  lessonTitle: {
    fontSize: '1.4rem',
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
    padding: '0.35rem 0.65rem',
    borderRadius: '999px',
    fontWeight: '800',
    fontSize: '0.8rem',
    whiteSpace: 'nowrap'
  },
  completedTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    backgroundColor: '#ecfdf5',
    color: 'var(--color-success)',
    padding: '0.35rem 0.65rem',
    borderRadius: '999px',
    fontWeight: '700',
    fontSize: '0.8rem',
    whiteSpace: 'nowrap'
  },
  videoCard: {
    backgroundColor: '#0f172a',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
    width: '100%'
  },
  videoResponsiveWrapper: {
    position: 'relative',
    paddingBottom: '56.25%', /* 16:9 Aspect Ratio */
    height: 0,
    overflow: 'hidden',
    width: '100%'
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
    padding: '4rem 1.5rem',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  placeholderIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionCard: {
    backgroundColor: 'white',
    padding: '1.25rem 1.5rem',
    borderRadius: '12px',
    border: '1px solid var(--color-border)'
  },
  sectionHeader: {
    marginBottom: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  sectionTitle: {
    fontSize: '1.05rem',
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
    gap: '0.875rem',
    padding: '0.875rem 1rem',
    borderRadius: '8px',
    border: '1px solid',
    alignItems: 'flex-start',
    transition: 'all 0.15s ease'
  },
  stepCheckboxBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
    minWidth: '26px',
    minHeight: '26px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepContent: {
    flex: 1,
    minWidth: 0
  },
  stepTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.75rem',
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
    textDecoration: 'none',
    whiteSpace: 'nowrap'
  },
  stepInstruction: {
    fontSize: '0.875rem',
    color: 'var(--color-text-secondary)',
    lineHeight: '1.5',
    margin: 0
  },
  studyNotesContent: {
    backgroundColor: '#f8fafc',
    padding: '1rem 1.25rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },
  resourceCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
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
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    flexShrink: 0
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
  navBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    backgroundColor: 'white',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text-primary)',
    padding: '0.65rem 0.875rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '600'
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
    width: '18px',
    flexShrink: 0
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

