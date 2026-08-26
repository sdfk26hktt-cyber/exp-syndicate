import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  BookOpen, 
  CheckCircle2, 
  Lock, 
  Play, 
  Sparkles, 
  Search, 
  Layers, 
  ChevronRight,
  Filter
} from 'lucide-react';
import { useAgent } from '../../context/AgentContext';
import { useAuth } from '../../context/AuthContext';
import { getLevelInfo } from '../../utils/gamification';
import LevelBadge from '../Gamification/LevelBadge';

const ClassroomHub = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { courses, xp, agentClassroomProgress, gamificationSettings } = useAgent();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Agent's level info
  const agentLevelInfo = getLevelInfo(xp || 0, gamificationSettings?.levelThresholds);
  const currentLevel = agentLevelInfo.level;

  // Compute category list
  const categories = ['All', ...new Set((courses || []).map(c => c.category).filter(Boolean))];

  // Helper to compute course statistics
  const getCourseStats = (course) => {
    let totalLessons = 0;
    let totalXp = 0;
    (course.modules || []).forEach(m => {
      (m.lessons || []).forEach(l => {
        totalLessons += 1;
        totalXp += (l.xp || 25);
      });
    });

    const completedLessonIds = agentClassroomProgress[course.id] || [];
    const completedCount = completedLessonIds.length;
    const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
    const isFinished = totalLessons > 0 && completedCount >= totalLessons;

    const requiredLevel = course.unlockLevel || 1;
    const isLocked = currentLevel < requiredLevel;
    
    // Find required level title and XP needed
    const reqThreshold = (gamificationSettings?.levelThresholds || []).find(t => t.level === requiredLevel);
    const reqLevelTitle = reqThreshold ? reqThreshold.title : `Level ${requiredLevel}`;
    const xpNeeded = reqThreshold ? Math.max(0, reqThreshold.minXp - (xp || 0)) : 0;

    return {
      totalLessons,
      totalXp,
      completedCount,
      progressPercent,
      isFinished,
      isLocked,
      requiredLevel,
      reqLevelTitle,
      xpNeeded
    };
  };

  // Filter courses
  const filteredCourses = (courses || []).filter(course => {
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    const matchesSearch = !searchTerm || 
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Overall classroom aggregate progress
  let overallTotalLessons = 0;
  let overallCompletedLessons = 0;
  (courses || []).forEach(c => {
    const stats = getCourseStats(c);
    overallTotalLessons += stats.totalLessons;
    overallCompletedLessons += stats.completedCount;
  });
  const overallPercent = overallTotalLessons > 0 ? Math.round((overallCompletedLessons / overallTotalLessons) * 100) : 0;

  const handleOpenCourse = (course) => {
    const stats = getCourseStats(course);
    if (stats.isLocked && currentUser?.role !== 'admin') {
      alert(`🔒 This course unlocks at Level ${stats.requiredLevel} (${stats.reqLevelTitle}). You need ${stats.xpNeeded} more XP to access this training!`);
      return;
    }
    navigate(`/classroom/${course.id}`);
  };

  return (
    <div className="animate-fade-in" style={styles.container}>
      {/* Hero Section */}
      <div style={styles.heroCard}>
        <div style={styles.heroLeft}>
          <div style={styles.heroTag}>
            <GraduationCap size={16} />
            <span>SYNDICATE CLASSROOM</span>
          </div>
          <h1 style={styles.heroTitle}>Production & Systems Mastery</h1>
          <p style={styles.heroSubtitle}>
            Step-by-step training playbooks, video masterclasses, and actionable conversion scripts to scale your real estate business.
          </p>

          <div style={styles.heroBadges}>
            <div style={styles.heroStat}>
              <span style={styles.heroStatValue}>{courses.length}</span>
              <span style={styles.heroStatLabel}>Courses</span>
            </div>
            <div style={styles.heroDivider} />
            <div style={styles.heroStat}>
              <span style={styles.heroStatValue}>{overallTotalLessons}</span>
              <span style={styles.heroStatLabel}>Total Lessons</span>
            </div>
            <div style={styles.heroDivider} />
            <div style={styles.heroStat}>
              <span style={styles.heroStatValue}>{overallCompletedLessons}</span>
              <span style={styles.heroStatLabel}>Completed</span>
            </div>
            <div style={styles.heroDivider} />
            <div style={styles.heroStat}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={styles.heroStatValue}>{xp || 0}</span>
                <Sparkles size={16} color="#fbbf24" />
              </div>
              <span style={styles.heroStatLabel}>Your Total XP</span>
            </div>
          </div>
        </div>

        {/* Hero Right: Progress Card */}
        <div style={styles.heroRight}>
          <div style={styles.progressBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'rgba(255,255,255,0.85)' }}>CLASSROOM COMPLETION</span>
              <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#38bdf8' }}>{overallPercent}%</span>
            </div>
            
            <div style={styles.progressBarBg}>
              <div style={{ ...styles.progressBarFill, width: `${overallPercent}%` }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
              <span>{overallCompletedLessons} of {overallTotalLessons} Lessons Done</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <LevelBadge xp={xp || 0} size="xs" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={styles.controlsRow}>
        {/* Category Pills */}
        <div style={styles.categoryPills}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                ...styles.categoryBtn,
                backgroundColor: selectedCategory === cat ? 'var(--color-primary)' : 'white',
                color: selectedCategory === cat ? 'white' : 'var(--color-text-secondary)',
                borderColor: selectedCategory === cat ? 'var(--color-primary)' : 'var(--color-border)',
                fontWeight: selectedCategory === cat ? '700' : '500'
              }}
            >
              {cat === 'All' && <Filter size={14} style={{ marginRight: '4px' }} />}
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={styles.searchBox}>
          <Search size={16} color="var(--color-text-muted)" />
          <input
            type="text"
            placeholder="Search training, scripts, topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {/* Courses Grid */}
      <div style={styles.grid}>
        {filteredCourses.map(course => {
          const stats = getCourseStats(course);

          return (
            <div 
              key={course.id} 
              style={{
                ...styles.courseCard,
                opacity: stats.isLocked ? 0.78 : 1,
                cursor: 'pointer'
              }}
              onClick={() => handleOpenCourse(course)}
            >
              {/* Cover Banner */}
              <div style={styles.coverWrapper}>
                <img 
                  src={course.coverImage || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80'} 
                  alt={course.title}
                  style={styles.coverImage}
                />
                <div style={styles.coverOverlay} />
                
                {/* Category Pill on Image */}
                <span style={styles.coverBadge}>
                  {course.category || 'Training'}
                </span>

                {/* Lock or Unlock Level Badge */}
                {stats.isLocked ? (
                  <div style={styles.lockBadge}>
                    <Lock size={13} style={{ marginRight: '4px' }} />
                    <span>Requires Lv. {stats.requiredLevel}</span>
                  </div>
                ) : (
                  <div style={styles.unlockBadge}>
                    <LevelBadge level={stats.requiredLevel} size="xs" />
                  </div>
                )}
              </div>

              {/* Course Body */}
              <div style={styles.cardBody}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.courseTitle}>{course.title}</h3>
                  <p style={styles.courseDesc}>{course.description}</p>
                </div>

                {/* Modules & Lessons meta */}
                <div style={styles.metaRow}>
                  <div style={styles.metaItem}>
                    <Layers size={14} color="var(--color-text-muted)" />
                    <span>{(course.modules || []).length} Modules</span>
                  </div>
                  <div style={styles.metaItem}>
                    <BookOpen size={14} color="var(--color-text-muted)" />
                    <span>{stats.totalLessons} Lessons</span>
                  </div>
                  <div style={styles.metaItem}>
                    <Sparkles size={14} color="#f59e0b" />
                    <span>+{stats.totalXp} XP</span>
                  </div>
                </div>

                {/* Progress Bar or Lock Notice */}
                <div style={styles.cardFooter}>
                  {stats.isLocked ? (
                    <div style={styles.lockedFooter}>
                      <Lock size={14} color="var(--color-danger)" />
                      <span>{stats.xpNeeded} XP needed to unlock ({stats.reqLevelTitle})</span>
                    </div>
                  ) : (
                    <div>
                      <div style={styles.cardProgressHeader}>
                        <span style={styles.progressLabel}>
                          {stats.isFinished ? 'Completed ★' : `${stats.completedCount} / ${stats.totalLessons} Lessons`}
                        </span>
                        <span style={styles.progressValue}>{stats.progressPercent}%</span>
                      </div>
                      <div style={styles.cardProgressBarBg}>
                        <div 
                          style={{
                            ...styles.cardProgressBarFill,
                            width: `${stats.progressPercent}%`,
                            backgroundColor: stats.isFinished ? 'var(--color-success)' : 'var(--color-primary)'
                          }} 
                        />
                      </div>
                    </div>
                  )}

                  <button 
                    style={{
                      ...styles.actionBtn,
                      backgroundColor: stats.isLocked ? '#f3f4f6' : 'var(--color-primary)',
                      color: stats.isLocked ? 'var(--color-text-muted)' : 'white'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenCourse(course);
                    }}
                  >
                    {stats.isLocked ? (
                      <>
                        <Lock size={16} /> Locked
                      </>
                    ) : stats.isFinished ? (
                      <>
                        <CheckCircle2 size={16} /> Review Course
                      </>
                    ) : stats.completedCount > 0 ? (
                      <>
                        <Play size={16} /> Continue Learning <ChevronRight size={16} />
                      </>
                    ) : (
                      <>
                        <Play size={16} /> Start Course <ChevronRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCourses.length === 0 && (
        <div style={styles.emptyState}>
          <GraduationCap size={48} color="var(--color-text-muted)" />
          <h3>No courses found</h3>
          <p>Try searching with different keywords or switch the category filter.</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '1280px',
    margin: '0 auto',
  },
  heroCard: {
    background: 'linear-gradient(135deg, #0b192c 0%, #1e3a8a 60%, #0f172a 100%)',
    borderRadius: '16px',
    padding: '2.5rem',
    color: 'white',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '2rem',
    marginBottom: '2rem',
    boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  heroLeft: {
    flex: '1 1 500px',
  },
  heroTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    color: '#38bdf8',
    padding: '0.35rem 0.85rem',
    borderRadius: '999px',
    fontSize: '0.75rem',
    fontWeight: '800',
    letterSpacing: '0.08em',
    marginBottom: '1rem',
    border: '1px solid rgba(56, 189, 248, 0.3)'
  },
  heroTitle: {
    fontSize: '2.25rem',
    fontWeight: '800',
    lineHeight: '1.2',
    marginBottom: '0.75rem',
    letterSpacing: '-0.02em',
    color: '#ffffff'
  },
  heroSubtitle: {
    fontSize: '1rem',
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: '1.6',
    marginBottom: '1.75rem',
    maxWidth: '620px'
  },
  heroBadges: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    padding: '0.875rem 1.25rem',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.08)'
  },
  heroStat: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.15rem'
  },
  heroStatValue: {
    fontSize: '1.25rem',
    fontWeight: '800',
    color: '#ffffff'
  },
  heroStatLabel: {
    fontSize: '0.725rem',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.65)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
  },
  heroDivider: {
    width: '1px',
    height: '28px',
    backgroundColor: 'rgba(255, 255, 255, 0.15)'
  },
  heroRight: {
    flex: '1 1 300px',
    maxWidth: '380px'
  },
  progressBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    backdropFilter: 'blur(10px)',
    borderRadius: '14px',
    padding: '1.5rem',
    border: '1px solid rgba(255, 255, 255, 0.15)'
  },
  progressBarBg: {
    width: '100%',
    height: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: '999px',
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #38bdf8 0%, #818cf8 100%)',
    borderRadius: '999px',
    transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  controlsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '2rem',
    flexWrap: 'wrap'
  },
  categoryPills: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap'
  },
  categoryBtn: {
    padding: '0.5rem 1rem',
    borderRadius: '999px',
    fontSize: '0.85rem',
    border: '1px solid',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'inline-flex',
    alignItems: 'center'
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    flex: '1 1 260px',
    maxWidth: '340px'
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    width: '100%',
    fontSize: '0.875rem',
    color: 'var(--color-text-primary)'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '1.75rem',
  },
  courseCard: {
    backgroundColor: 'white',
    borderRadius: '14px',
    border: '1px solid var(--color-border)',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  coverWrapper: {
    position: 'relative',
    height: '180px',
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#0f172a'
  },
  coverImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  coverOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(15, 23, 42, 0.75) 0%, rgba(15, 23, 42, 0.15) 60%, transparent 100%)'
  },
  coverBadge: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(6px)',
    color: 'white',
    padding: '0.25rem 0.65rem',
    borderRadius: '6px',
    fontSize: '0.725rem',
    fontWeight: '700',
    letterSpacing: '0.04em'
  },
  lockBadge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    backdropFilter: 'blur(6px)',
    color: 'white',
    padding: '0.25rem 0.65rem',
    borderRadius: '6px',
    fontSize: '0.725rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center'
  },
  unlockBadge: {
    position: 'absolute',
    top: '12px',
    right: '12px'
  },
  cardBody: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    justifyContent: 'space-between'
  },
  cardHeader: {
    marginBottom: '1rem'
  },
  courseTitle: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: 'var(--color-text-primary)',
    marginBottom: '0.5rem',
    lineHeight: '1.3'
  },
  courseDesc: {
    fontSize: '0.875rem',
    color: 'var(--color-text-muted)',
    lineHeight: '1.5',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.75rem 0',
    borderTop: '1px solid #f1f5f9',
    borderBottom: '1px solid #f1f5f9',
    marginBottom: '1.25rem'
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    fontSize: '0.775rem',
    fontWeight: '600',
    color: 'var(--color-text-secondary)'
  },
  cardFooter: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.875rem'
  },
  cardProgressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.75rem',
    fontWeight: '700',
    marginBottom: '0.35rem'
  },
  progressLabel: {
    color: 'var(--color-text-secondary)'
  },
  progressValue: {
    color: 'var(--color-primary)'
  },
  cardProgressBarBg: {
    width: '100%',
    height: '6px',
    backgroundColor: '#e2e8f0',
    borderRadius: '999px',
    overflow: 'hidden'
  },
  cardProgressBarFill: {
    height: '100%',
    borderRadius: '999px',
    transition: 'width 0.4s ease'
  },
  lockedFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.775rem',
    color: 'var(--color-danger)',
    fontWeight: '600',
    padding: '0.4rem 0'
  },
  actionBtn: {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: 'none',
    fontWeight: '700',
    fontSize: '0.875rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'background-color 0.15s ease'
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text-secondary)'
  }
};

export default ClassroomHub;
