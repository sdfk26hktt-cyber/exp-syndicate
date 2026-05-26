import React, { useState } from 'react';
import { useCommunity } from '../context/CommunityContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageSquare, Calendar, Video, Plus, X, Send, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const CommunityFeed = () => {
  const { posts, events, addPost, toggleLike, addEvent, chats, sendMessage } = useCommunity();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const isAdmin = currentUser?.role === 'admin';

  // Compute upcoming events (Approved + within 5 days)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fiveDaysFromNow = new Date(today);
  fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
  fiveDaysFromNow.setHours(23, 59, 59, 999);

  const upcomingEvents = events.filter(evt => {
    if (evt.status !== 'approved') return false;
    const evtDate = new Date(evt.date);
    return evtDate >= today && evtDate <= fiveDaysFromNow;
  });

  // Chat Modal State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  
  const activeChatMessages = currentUser && chats[currentUser.id] 
    ? chats[currentUser.id].messages 
    : [{ sender: 'System', text: 'Connecting to an admin...', timestamp: new Date(Date.now() - 60000).toISOString() },
       { sender: 'Admin', text: 'Hi there! How can I help you today?', timestamp: new Date().toISOString() }];

  const handleSendChat = (e) => {
    e.preventDefault();
    if (chatMessage.trim() && currentUser) {
      sendMessage(currentUser.id, currentUser.name, chatMessage, false);
      setChatMessage('');
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="animate-fade-in" style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 className="text-2xl font-semibold mb-2">Training Feed</h1>
          <p className="text-muted">Exclusive training content, video updates, and mastermind schedules.</p>
        </div>
      </div>

      <div style={styles.layout} className="feed-layout">
        {/* Main Feed Column */}
        <div style={styles.feedColumn}>
          {/* Admin tools moved to AdminDashboard */}
          <div style={styles.postsList}>
            {posts.map(post => {
              const hasLiked = post.likes.includes(currentUser?.id);
              return (
                <div key={post.id} className="card" style={styles.postCard}>
                  {/* Post Header */}
                  <div style={styles.postHeader}>
                    <div style={styles.authorAvatar}>
                      {post.authorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={styles.authorName}>
                        {post.authorName} <span style={styles.authorRoleBadge}>{post.authorRole}</span>
                      </div>
                      <div style={styles.postDate}>{formatDate(post.timestamp)}</div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div style={styles.postContent}>
                    {post.content && (
                      <div className="markdown-body" style={{ marginBottom: (post.videoUrl || post.audioUrl || post.presentationUrl) ? '1rem' : 0 }}>
                        <ReactMarkdown>{post.content}</ReactMarkdown>
                      </div>
                    )}
                    
                    {post.videoUrl && (
                      post.isRawHtml ? (
                        <div 
                          style={styles.rawHtmlWrapper} 
                          dangerouslySetInnerHTML={{ __html: post.videoUrl }} 
                        />
                      ) : (
                        <div style={styles.videoWrapper}>
                          <iframe 
                            src={post.videoUrl} 
                            title="Video player" 
                            frameBorder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                            style={styles.iframe}
                          ></iframe>
                        </div>
                      )
                    )}

                    {post.audioUrl && (
                      <div style={styles.audioWrapper}>
                        <audio controls style={styles.audioPlayer}>
                          <source src={post.audioUrl} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}

                    {post.presentationUrl && (
                      <div style={styles.presentationWrapper}>
                        <a 
                          href={post.presentationUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn-primary"
                          style={{ textDecoration: 'none', display: 'inline-flex', width: '100%', maxWidth: '300px' }}
                        >
                          <FileText size={18} /> View Presentation
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Post Actions */}
                  <div style={styles.postActions}>
                    <button 
                      onClick={() => toggleLike(post.id)} 
                      style={{...styles.actionBtn, color: hasLiked ? 'var(--color-primary)' : 'var(--color-moss-grey)'}}
                    >
                      <Heart size={18} fill={hasLiked ? 'var(--color-primary)' : 'none'} />
                      {post.likes.length > 0 ? post.likes.length : 'Like'}
                    </button>
                    
                    {!isAdmin && (
                      <button 
                        onClick={() => setChatOpen(true)} 
                        style={styles.actionBtn}
                      >
                        <MessageSquare size={18} />
                        Message Admin
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Sidebar - Calendar */}
        <div style={styles.sidebarColumn}>
          <div className="card" style={styles.calendarCard}>
            <div style={styles.calendarHeader}>
              <h3 style={{margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-dark-navy)'}}>
                <Calendar size={18} /> Upcoming Training
              </h3>
            </div>

            <div style={styles.eventsList}>
              {upcomingEvents.length === 0 ? (
                <p style={{color: 'var(--color-text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem 0'}}>No events in the next 5 days.</p>
              ) : (
                upcomingEvents.map(evt => (
                  <div 
                    key={evt.id} 
                    style={{...styles.eventItem, cursor: 'pointer'}} 
                    onClick={() => navigate('/calendar')}
                  >
                    <div style={styles.eventDateBlock}>
                      <span style={styles.eventMonth}>{new Date(evt.date).toLocaleDateString('en-US', {month: 'short'}).toUpperCase()}</span>
                      <span style={styles.eventDay}>{new Date(evt.date).toLocaleDateString('en-US', {day: 'numeric'})}</span>
                    </div>
                    <div style={styles.eventDetails}>
                      <h4 style={styles.eventTitle}>{evt.title}</h4>
                      <div style={styles.eventTime}>{evt.time}</div>
                      {evt.description && <p style={styles.eventDesc}>{evt.description}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <button 
              onClick={() => navigate('/calendar')} 
              style={{...styles.actionBtn, width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '6px'}}
            >
              View Full Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Mock Chat Modal */}
      {chatOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.chatModal} className="animate-fade-in">
            <div style={styles.chatHeader}>
              <h3 style={{margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <MessageSquare size={18} /> Chat with Admin
              </h3>
              <button onClick={() => setChatOpen(false)} style={{background: 'none', border: 'none', color: 'white', cursor: 'pointer'}}>
                <X size={20} />
              </button>
            </div>
            
            <div style={styles.chatBody}>
              {activeChatMessages.map((msg, idx) => (
                <div key={idx} style={{
                  ...styles.chatMessage, 
                  alignSelf: msg.sender === currentUser.name ? 'flex-end' : 'flex-start',
                  backgroundColor: msg.sender === currentUser.name ? 'var(--color-primary)' : 'var(--color-frosted-blue)',
                  color: msg.sender === currentUser.name ? 'white' : 'var(--color-dark-navy)'
                }}>
                  <div style={{fontSize: '0.7rem', opacity: 0.7, marginBottom: '0.25rem'}}>{msg.sender}</div>
                  <div>{msg.text}</div>
                </div>
              ))}
            </div>
            
            <form onSubmit={handleSendChat} style={styles.chatFooter}>
              <input 
                type="text" 
                placeholder="Type your message..." 
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                style={styles.chatInput} 
              />
              <button type="submit" style={styles.chatSendBtn} disabled={!chatMessage.trim()}>
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%',
  },
  header: {
    marginBottom: '2rem',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 350px',
    gap: '2rem',
    alignItems: 'start',
  },
  feedColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  createPostCard: {
    backgroundColor: 'var(--color-frosted-blue)',
    borderColor: 'var(--color-slate-blue)',
  },
  textArea: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: 'var(--border-radius-sm)',
    border: '1px solid var(--color-border)',
    fontFamily: 'inherit',
    fontSize: '0.95rem',
    resize: 'vertical',
    outline: 'none',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: 'var(--border-radius-sm)',
    border: '1px solid var(--color-border)',
    fontFamily: 'inherit',
    fontSize: '0.95rem',
    outline: 'none',
  },
  postsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  postCard: {
    padding: 0,
    overflow: 'hidden',
  },
  postHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1.25rem',
    borderBottom: '1px solid var(--color-border)',
  },
  authorAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-slate-blue)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '1.2rem',
  },
  authorName: {
    fontWeight: '600',
    color: 'var(--color-dark-navy)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  authorRoleBadge: {
    fontSize: '0.7rem',
    backgroundColor: 'rgba(80, 108, 170, 0.1)',
    color: 'var(--color-primary)',
    padding: '0.1rem 0.4rem',
    borderRadius: '12px',
    fontWeight: '700',
  },
  postDate: {
    fontSize: '0.8rem',
    color: 'var(--color-text-muted)',
  },
  postContent: {
    padding: '1.25rem',
    fontSize: '1rem',
    color: 'var(--color-text-main)',
    lineHeight: '1.6',
  },
  videoWrapper: {
    position: 'relative',
    paddingBottom: '56.25%', /* 16:9 aspect ratio */
    height: 0,
    overflow: 'hidden',
    borderRadius: 'var(--border-radius-sm)',
    backgroundColor: 'black',
  },
  rawHtmlWrapper: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 'var(--border-radius-sm)',
    display: 'flex',
    flexDirection: 'column',
  },
  iframe: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  audioWrapper: {
    width: '100%',
    marginTop: '0.5rem',
  },
  audioPlayer: {
    width: '100%',
    height: '40px',
    borderRadius: 'var(--border-radius-sm)',
  },
  presentationWrapper: {
    marginTop: '0.75rem',
    width: '100%',
  },
  postActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    padding: '1rem 1.25rem',
    borderTop: '1px solid var(--color-border)',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'var(--color-moss-grey)',
    fontWeight: '500',
    fontSize: '0.9rem',
  },
  sidebarColumn: {
    position: 'sticky',
    top: '2rem',
  },
  calendarCard: {
    padding: '1.25rem',
  },
  calendarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    paddingBottom: '0.75rem',
    borderBottom: '2px solid var(--color-border)',
  },
  iconBtn: {
    color: 'var(--color-primary)',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addEventForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1.5rem',
    padding: '1rem',
    backgroundColor: 'var(--color-frosted-blue)',
    borderRadius: 'var(--border-radius-sm)',
  },
  cancelBtn: {
    padding: '0.4rem 0.75rem',
    fontSize: '0.8rem',
    color: 'var(--color-text-muted)',
  },
  saveBtn: {
    padding: '0.4rem 0.75rem',
    fontSize: '0.8rem',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    borderRadius: '4px',
    fontWeight: '600',
  },
  eventsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  eventItem: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start',
  },
  eventDateBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(80, 108, 170, 0.1)',
    borderRadius: '8px',
    minWidth: '50px',
    padding: '0.5rem',
    border: '1px solid rgba(80, 108, 170, 0.2)',
  },
  eventMonth: {
    fontSize: '0.7rem',
    fontWeight: '700',
    color: 'var(--color-primary)',
  },
  eventDay: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: 'var(--color-dark-navy)',
    lineHeight: 1,
    marginTop: '2px',
  },
  eventDetails: {
    flexGrow: 1,
  },
  eventTitle: {
    margin: 0,
    fontSize: '0.95rem',
    color: 'var(--color-dark-navy)',
  },
  eventTime: {
    fontSize: '0.8rem',
    color: 'var(--color-primary)',
    fontWeight: '600',
    marginTop: '2px',
  },
  eventDesc: {
    fontSize: '0.8rem',
    color: 'var(--color-text-muted)',
    marginTop: '4px',
    margin: 0,
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(12, 15, 36, 0.4)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  chatModal: {
    width: '100%',
    maxWidth: '450px',
    backgroundColor: 'var(--color-background)',
    borderRadius: 'var(--border-radius-md)',
    boxShadow: 'var(--shadow-lg)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    height: '500px',
  },
  chatHeader: {
    backgroundColor: 'var(--color-dark-navy)',
    padding: '1rem 1.25rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatBody: {
    flexGrow: 1,
    padding: '1.25rem',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    backgroundColor: 'var(--color-white)',
  },
  chatMessage: {
    maxWidth: '80%',
    padding: '0.75rem 1rem',
    borderRadius: '12px',
    fontSize: '0.95rem',
    boxShadow: 'var(--shadow-sm)',
  },
  chatFooter: {
    padding: '1rem',
    backgroundColor: 'var(--color-card-bg)',
    borderTop: '1px solid var(--color-border)',
    display: 'flex',
    gap: '0.75rem',
  },
  chatInput: {
    flexGrow: 1,
    padding: '0.75rem',
    borderRadius: '20px',
    border: '1px solid var(--color-border)',
    outline: 'none',
    fontSize: '0.95rem',
  },
  chatSendBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
};

// Inject responsive CSS
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @media (max-width: 900px) {
    .feed-layout {
      grid-template-columns: 1fr !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default CommunityFeed;
