import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';

const CommunityContext = createContext();

export const useCommunity = () => useContext(CommunityContext);

const MOCK_INITIAL_POSTS = [
  {
    id: 'post-1',
    authorName: 'Brian Burds',
    authorRole: 'Admin',
    content: 'Welcome to the new eXp Syndicate Training Feed! I will be posting exclusive video breakdowns and training content here weekly. Make sure to check the calendar for our live upcoming events!',
    videoUrl: 'https://www.youtube.com/embed/R315wWjg3f0',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    likes: ['agent-test-1']
  },
  {
    id: 'post-2',
    authorName: 'Brian Burds',
    authorRole: 'Admin',
    content: 'Just uploaded the new guide on setting up SkySlope. This is critical for getting paid on time. Drop any questions you have in a direct message!',
    videoUrl: '',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    likes: []
  }
];

const MOCK_INITIAL_EVENTS = [
  {
    id: 'evt-1',
    title: 'State Compliance Training',
    date: '2026-06-01',
    time: '10:00 AM',
    description: 'Mandatory state compliance meeting in eXp World.',
    status: 'approved'
  },
  {
    id: 'evt-2',
    title: 'Syndicate Launch Call',
    date: '2026-06-05',
    time: '2:00 PM',
    description: 'Weekly team mastermind and lead flow review.',
    status: 'approved'
  }
];

export const CommunityProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [chats, setChats] = useState({}); // { agentId: { agentName: string, messages: [] } }

  useEffect(() => {
    const savedPosts = JSON.parse(localStorage.getItem('mockCommunityPosts'));
    const savedEvents = JSON.parse(localStorage.getItem('mockCommunityEvents'));
    const savedChats = JSON.parse(localStorage.getItem('mockCommunityChats'));

    if (savedPosts) {
      setPosts(savedPosts);
    } else {
      setPosts(MOCK_INITIAL_POSTS);
      localStorage.setItem('mockCommunityPosts', JSON.stringify(MOCK_INITIAL_POSTS));
    }

    if (savedEvents) {
      setEvents(savedEvents);
    } else {
      setEvents(MOCK_INITIAL_EVENTS);
      localStorage.setItem('mockCommunityEvents', JSON.stringify(MOCK_INITIAL_EVENTS));
    }

    if (savedChats) {
      setChats(savedChats);
    }
  }, []);

  const sendMessage = (agentId, agentName, text, isFromAdmin = false) => {
    const newMessage = {
      sender: isFromAdmin ? 'Admin' : agentName,
      text,
      timestamp: new Date().toISOString()
    };

    setChats(prevChats => {
      const existingChat = prevChats[agentId] || { agentName, messages: [] };
      const updatedChats = {
        ...prevChats,
        [agentId]: {
          ...existingChat,
          agentName, // ensure name is updated if it changed
          messages: [...existingChat.messages, newMessage]
        }
      };
      localStorage.setItem('mockCommunityChats', JSON.stringify(updatedChats));
      return updatedChats;
    });
  };

  const addPost = (content, rawMediaInput = '', audioUrl = '', presentationUrl = '') => {
    if (!currentUser) return;
    
    let finalVideoUrl = rawMediaInput;
    let isRawHtml = false;

    // Check if the input is raw HTML (iframe, script, etc)
    if (rawMediaInput.trim().startsWith('<')) {
      isRawHtml = true;
    } else {
      // Parse normal youtube links into embed links if it's just a URL
      if (rawMediaInput.includes('youtube.com/watch?v=')) {
        const videoId = rawMediaInput.split('v=')[1]?.split('&')[0];
        finalVideoUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (rawMediaInput.includes('youtu.be/')) {
        const videoId = rawMediaInput.split('youtu.be/')[1]?.split('?')[0];
        finalVideoUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (rawMediaInput.includes('vimeo.com/')) {
        const videoId = rawMediaInput.split('vimeo.com/')[1]?.split('?')[0];
        finalVideoUrl = `https://player.vimeo.com/video/${videoId}`;
      } else if (rawMediaInput.includes('loom.com/share/')) {
        const videoId = rawMediaInput.split('loom.com/share/')[1]?.split('?')[0];
        finalVideoUrl = `https://www.loom.com/embed/${videoId}`;
      }
    }

    const newPost = {
      id: `post-${Date.now()}`,
      authorName: currentUser.name,
      authorRole: currentUser.role === 'admin' ? 'Admin' : 'Agent',
      content,
      videoUrl: finalVideoUrl,
      audioUrl,
      presentationUrl,
      isRawHtml,
      timestamp: new Date().toISOString(),
      likes: []
    };

    const updatedPosts = [newPost, ...posts];
    setPosts(updatedPosts);
    localStorage.setItem('mockCommunityPosts', JSON.stringify(updatedPosts));
  };

  const toggleLike = (postId) => {
    if (!currentUser) return;
    const userId = currentUser.id;

    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const hasLiked = post.likes.includes(userId);
        return {
          ...post,
          likes: hasLiked ? post.likes.filter(id => id !== userId) : [...post.likes, userId]
        };
      }
      return post;
    });

    setPosts(updatedPosts);
    localStorage.setItem('mockCommunityPosts', JSON.stringify(updatedPosts));
  };

  const addEvent = (title, date, time, description) => {
    const status = currentUser?.role === 'admin' ? 'approved' : 'pending';
    const newEvent = {
      id: `evt-${Date.now()}`,
      title,
      date,
      time,
      description,
      status
    };
    const updatedEvents = [...events, newEvent].sort((a, b) => new Date(a.date) - new Date(b.date));
    setEvents(updatedEvents);
    localStorage.setItem('mockCommunityEvents', JSON.stringify(updatedEvents));
  };

  const approveEvent = (eventId) => {
    const updatedEvents = events.map(evt => evt.id === eventId ? { ...evt, status: 'approved' } : evt);
    setEvents(updatedEvents);
    localStorage.setItem('mockCommunityEvents', JSON.stringify(updatedEvents));
  };

  const rejectEvent = (eventId) => {
    const updatedEvents = events.filter(evt => evt.id !== eventId);
    setEvents(updatedEvents);
    localStorage.setItem('mockCommunityEvents', JSON.stringify(updatedEvents));
  };

  return (
    <CommunityContext.Provider value={{ posts, events, chats, addPost, toggleLike, addEvent, approveEvent, rejectEvent, sendMessage }}>
      {children}
    </CommunityContext.Provider>
  );
};
