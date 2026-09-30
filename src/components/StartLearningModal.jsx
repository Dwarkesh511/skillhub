import React, { useState, useEffect } from 'react';
import { 
  PlayCircle, X, CheckCircle, Circle, BookOpen, 
  Clock, AlertCircle, Check
} from 'lucide-react';
import * as progressApi from '../services/progressApi';

export const StartLearningModal = ({ isOpen, onClose, courseId, courseTitle, onProgressUpdate }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progressData, setProgressData] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!isOpen || !courseId) return;

      try {
        setLoading(true);
        setError('');

        const res = await progressApi.getCourseProgress(courseId);
        if (res && res.success && res.progress) {
          const prog = res.progress;
          setProgressData(prog);

          // Select active lesson: find first uncompleted lesson, or default to first lesson overall
          let selected = null;
          if (prog.modules && prog.modules.length > 0) {
            for (const mod of prog.modules) {
              if (mod.lessons && mod.lessons.length > 0) {
                for (const les of mod.lessons) {
                  if (!les.completed) {
                    selected = les;
                    break;
                  }
                }
              }
              if (selected) break;
            }
            // If all are completed, select the very first lesson
            if (!selected && prog.modules[0].lessons && prog.modules[0].lessons.length > 0) {
              selected = prog.modules[0].lessons[0];
            }
          }
          setActiveLesson(selected);
        } else {
          setError(res?.message || 'Failed to load course player.');
        }
      } catch (err) {
        setError(err.message || 'Failed to load course player.');
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [isOpen, courseId]);

  if (!isOpen) return null;

  const handleToggleLesson = async () => {
    if (!activeLesson || toggling) return;

    try {
      setToggling(true);
      const newCompletedStatus = !activeLesson.completed;
      const res = await progressApi.toggleLessonProgress(activeLesson.id, newCompletedStatus);

      if (res && res.success) {
        // Update local active lesson state
        const updatedLesson = { ...activeLesson, completed: newCompletedStatus };
        setActiveLesson(updatedLesson);

        // Update progressData state
        if (progressData) {
          const updatedModules = progressData.modules.map(mod => ({
            ...mod,
            lessons: mod.lessons.map(les => 
              les.id === activeLesson.id ? { ...les, completed: newCompletedStatus } : les
            )
          }));

          const updatedCourseProg = res.courseProgress || {};

          setProgressData({
            ...progressData,
            progressPercentage: updatedCourseProg.progressPercentage ?? progressData.progressPercentage,
            completedLessons: updatedCourseProg.completedLessons ?? progressData.completedLessons,
            totalLessons: updatedCourseProg.totalLessons ?? progressData.totalLessons,
            status: updatedCourseProg.status ?? progressData.status,
            modules: updatedModules
          });
        }

        // Notify parent component if callback provided
        if (onProgressUpdate) {
          onProgressUpdate();
        }
      }
    } catch (err) {
      console.error('Failed to toggle lesson progress:', err);
    } finally {
      setToggling(false);
    }
  };

  const progressPct = progressData?.progressPercentage || 0;
  const isCourseCompleted = progressData?.status === 'COMPLETED' || progressPct === 100;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '960px',
          width: '95%',
          maxHeight: '90vh',
          padding: '0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          textAlign: 'left'
        }}
      >
        {/* Modal Top Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #1e293b'
        }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
              {progressData?.courseTitle || courseTitle || 'Course Player'}
            </h3>
            {progressData && (
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <span>Progress: {progressData.completedLessons} of {progressData.totalLessons} lessons ({progressPct}%)</span>
                {isCourseCompleted && (
                  <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: 600 }}>
                    Completed 🎉
                  </span>
                )}
              </div>
            )}
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Close modal"
          >
            <X size={22} />
          </button>
        </div>

        {/* Progress bar line */}
        <div style={{ height: '4px', backgroundColor: '#334155', width: '100%' }}>
          <div style={{
            height: '100%',
            width: `${progressPct}%`,
            backgroundColor: isCourseCompleted ? '#10b981' : '#2563eb',
            transition: 'width 0.3s ease'
          }} />
        </div>

        {/* Main Content Area */}
        <div style={{
          display: 'flex',
          flex: '1 1 auto',
          overflow: 'hidden',
          flexDirection: 'row',
          flexWrap: 'wrap'
        }}>
          {loading ? (
            <div style={{ flex: 1, padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontWeight: 600, fontSize: '1rem' }}>Loading learning modules...</div>
            </div>
          ) : error ? (
            <div style={{ flex: 1, padding: '3rem', textAlign: 'center', color: '#ef4444' }}>
              <AlertCircle size={32} style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontWeight: 600 }}>{error}</div>
            </div>
          ) : (
            <>
              {/* Left Pane: Video / Player & Lesson Info */}
              <div style={{
                flex: '1 1 500px',
                padding: '1.5rem',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                borderRight: '1px solid #e2e8f0'
              }}>
                {activeLesson ? (
                  <>
                    {/* Video Player Display */}
                    <div style={{
                      width: '100%',
                      aspectRatio: '16/9',
                      backgroundColor: '#000000',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      marginBottom: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}>
                      {activeLesson.videoUrl && (activeLesson.videoUrl.startsWith('http') || activeLesson.videoUrl.endsWith('.mp4')) ? (
                        <video 
                          controls 
                          src={activeLesson.videoUrl} 
                          style={{ width: '100%', height: '100%' }}
                          key={activeLesson.id}
                        />
                      ) : (
                        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>
                          <PlayCircle size={48} color="#60a5fa" style={{ marginBottom: '0.5rem' }} />
                          <div style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff' }}>
                            {activeLesson.title}
                          </div>
                          <div style={{ fontSize: '0.8rem', marginTop: '0.3rem' }}>
                            Interactive Video Lesson Container
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Lesson Header & Mark Complete Action */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.3rem 0' }}>
                          {activeLesson.title}
                        </h4>
                        {activeLesson.duration && (
                          <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Clock size={15} /> {activeLesson.duration}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={handleToggleLesson}
                        disabled={toggling}
                        style={{
                          backgroundColor: activeLesson.completed ? '#ecfdf5' : '#2563eb',
                          color: activeLesson.completed ? '#047857' : '#ffffff',
                          border: activeLesson.completed ? '1px solid #a7f3d0' : 'none',
                          padding: '0.6rem 1.1rem',
                          borderRadius: '8px',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {activeLesson.completed ? (
                          <>
                            <CheckCircle size={18} color="#059669" /> Completed
                          </>
                        ) : (
                          <>
                            <Check size={18} /> Mark as Complete
                          </>
                        )}
                      </button>
                    </div>

                    {/* Lesson Description */}
                    {activeLesson.description && (
                      <div style={{
                        backgroundColor: '#f8fafc',
                        padding: '1rem',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        color: '#475569',
                        lineHeight: 1.5
                      }}>
                        {activeLesson.description}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                    Select a lesson from the curriculum sidebar to begin watching.
                  </div>
                )}
              </div>

              {/* Right Pane: Curriculum Navigation Sidebar */}
              <div style={{
                flex: '1 1 300px',
                maxWidth: '380px',
                backgroundColor: '#f8fafc',
                overflowY: 'auto',
                padding: '1.25rem',
                borderLeft: '1px solid #e2e8f0'
              }}>
                <h5 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <BookOpen size={18} color="#2563eb" /> Course Content
                </h5>

                {progressData?.modules && progressData.modules.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {progressData.modules.map((mod, modIdx) => (
                      <div key={mod.id || modIdx} style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <div style={{ padding: '0.75rem 0.9rem', backgroundColor: '#f1f5f9', fontWeight: 700, fontSize: '0.85rem', color: '#334155' }}>
                          Module {modIdx + 1}: {mod.title}
                        </div>
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                          {mod.lessons && mod.lessons.map((les) => {
                            const isActive = activeLesson?.id === les.id;
                            return (
                              <li 
                                key={les.id}
                                onClick={() => setActiveLesson(les)}
                                style={{
                                  padding: '0.65rem 0.9rem',
                                  borderTop: '1px solid #f1f5f9',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  backgroundColor: isActive ? '#eff6ff' : '#ffffff',
                                  borderLeft: isActive ? '3px solid #2563eb' : '3px solid transparent',
                                  transition: 'background-color 0.15s ease'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', fontWeight: isActive ? 600 : 400, color: isActive ? '#1d4ed8' : '#334155' }}>
                                  {les.completed ? (
                                    <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0 }} />
                                  ) : (
                                    <Circle size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
                                  )}
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                    {les.title}
                                  </span>
                                </div>
                                {les.duration && (
                                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', flexShrink: 0, marginLeft: '0.5rem' }}>
                                    {les.duration}
                                  </span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    No curriculum modules available.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
