import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import { useAgent } from './AgentContext';
import { supabase } from '../lib/supabase';

const CommunityContext = createContext();

export const useCommunity = () => useContext(CommunityContext);

export const CommunityProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { agents, recordXpEvent } = useAgent();
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [chats, setChats] = useState({});

  const loadCommunityData = async () => {
    const [postsRes, eventsRes] = await Promise.all([
      supabase.from('posts').select('*').order('timestamp', { ascending: false }),
      supabase.from('events').select('*')
    ]);

    if (postsRes.data) {
      setPosts(postsRes.data.map(p => ({
        id: p.id,
        authorName: p.author,
        authorId: p.author_id || p.authorId || '',
        authorRole: p.role,
        content: p.text,
        videoUrl: p.media,
        audioUrl: p.audio,
        presentationUrl: p.presentation,
        attachedResources: p.attached_resources || [],
        tags: p.tags || [],
        timestamp: p.timestamp,
        likes: p.likes || []
      })));
    }

    if (eventsRes.data) {
      setEvents(eventsRes.data
        .filter(e => {
          const type = (e.type || '').toLowerCase();
          const id = String(e.id || '');
          const title = (e.title || '').toLowerCase();
          return !id.startsWith('oh-') && !type.includes('open house') && !title.startsWith('open house:');
        })
        .map(e => ({
          id: e.id,
          title: e.title,
          date: e.date,
          time: e.time,
          endTime: e.end_time,
          location: e.location,
          description: e.description,
          status: e.status,
          type: e.type,
          instructor: e.instructor || '',
          submitted_by: e.submitted_by || e.submittedBy || '',
          submittedBy: e.submitted_by || e.submittedBy || '',
          attendees: e.attendees || []
        })).sort((a, b) => new Date(a.date) - new Date(b.date)));
    }

    const savedChats = JSON.parse(localStorage.getItem('mockCommunityChats'));
    if (savedChats) setChats(savedChats);
  };

  useEffect(() => {
    loadCommunityData();
  }, [currentUser]);

  const sendMessage = (agentId, agentName, text, isFromAdmin = false, isSystemMessage = false) => {
    const newMessage = {
      sender: isSystemMessage ? 'System' : (isFromAdmin ? 'Admin' : agentName),
      text,
      timestamp: new Date().toISOString(),
      isSystemMessage
    };

    setChats(prevChats => {
      const existingChat = prevChats[agentId] || { agentName, messages: [] };
      const updatedChats = {
        ...prevChats,
        [agentId]: {
          ...existingChat,
          agentName,
          messages: [...existingChat.messages, newMessage]
        }
      };
      localStorage.setItem('mockCommunityChats', JSON.stringify(updatedChats));
      return updatedChats;
    });
  };

  const addPost = async (content, rawMediaInput = '', audioUrl = '', presentationUrl = '', tags = [], attachedResources = []) => {
    if (!currentUser) return;
    
    let finalVideoUrl = rawMediaInput;

    if (!rawMediaInput.trim().startsWith('<')) {
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
      author: currentUser.name,
      author_id: currentUser.id || currentUser.email,
      role: currentUser.role === 'admin' ? 'Admin' : 'Agent',
      text: content,
      media: finalVideoUrl,
      audio: audioUrl,
      presentation: presentationUrl,
      tags: tags,
      attached_resources: attachedResources,
      likes: [],
      timestamp: new Date().toISOString()
    };

    await supabase.from('posts').insert([newPost]);
    loadCommunityData();
  };

  const toggleLike = async (postId) => {
    if (!currentUser) return;
    const userId = currentUser.id || currentUser.email;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const hasLiked = (post.likes || []).includes(userId);
    const updatedLikes = hasLiked ? post.likes.filter(id => id !== userId) : [...(post.likes || []), userId];

    // Optimistically update local posts array
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: updatedLikes } : p));

    // Award +1 XP (or -1 XP if unliking) to the author if they are an agent
    const authorIdentifier = post.authorId || post.author_id;
    let targetAgent = agents.find(a => 
      (authorIdentifier && a.id?.toLowerCase() === authorIdentifier?.toLowerCase()) ||
      (post.authorName && a.name?.toLowerCase() === post.authorName?.toLowerCase())
    );

    if (targetAgent && recordXpEvent) {
      const xpDelta = hasLiked ? -1 : 1;
      const eventType = hasLiked ? 'training_feed_unlike' : 'training_feed_like';
      await recordXpEvent(
        targetAgent.id,
        xpDelta,
        eventType,
        postId,
        { 
          likedBy: currentUser.name || userId, 
          postSnippet: post.content ? post.content.substring(0, 40) : 'Training Post' 
        }
      );
    }

    await supabase.from('posts').update({ likes: updatedLikes }).eq('id', postId);
  };

  const updatePost = async (postId, updatedData) => {
    let finalVideoUrl = updatedData.media || '';

    if (!finalVideoUrl.trim().startsWith('<')) {
      if (finalVideoUrl.includes('youtube.com/watch?v=')) {
        const videoId = finalVideoUrl.split('v=')[1]?.split('&')[0];
        finalVideoUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (finalVideoUrl.includes('youtu.be/')) {
        const videoId = finalVideoUrl.split('youtu.be/')[1]?.split('?')[0];
        finalVideoUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (finalVideoUrl.includes('vimeo.com/')) {
        const videoId = finalVideoUrl.split('vimeo.com/')[1]?.split('?')[0];
        finalVideoUrl = `https://player.vimeo.com/video/${videoId}`;
      } else if (finalVideoUrl.includes('loom.com/share/')) {
        const videoId = finalVideoUrl.split('loom.com/share/')[1]?.split('?')[0];
        finalVideoUrl = `https://www.loom.com/embed/${videoId}`;
      }
    }

    const payload = {
      text: updatedData.text,
      media: finalVideoUrl,
      audio: updatedData.audio,
      presentation: updatedData.presentation,
      tags: updatedData.tags,
      attached_resources: updatedData.attached_resources
    };

    await supabase.from('posts').update(payload).eq('id', postId);
    loadCommunityData();
  };

  const deletePost = async (postId) => {
    await supabase.from('posts').delete().eq('id', postId);
    loadCommunityData();
  };

  const addEvent = async (title, date, time, endTime, location, description, category = 'general', instructor = '', submittedBy = '') => {
    const status = currentUser?.role === 'admin' ? 'approved' : 'pending';
    const finalSubmittedBy = submittedBy || currentUser?.name || currentUser?.email || 'Anonymous';
    const newEvent = {
      id: `evt-${Date.now()}`,
      title,
      date,
      time,
      end_time: endTime,
      location,
      description,
      status,
      type: category,
      instructor: instructor || '',
      submitted_by: finalSubmittedBy,
      attendees: []
    };
    await supabase.from('events').insert([newEvent]);
    loadCommunityData();
  };

  const updateEvent = async (eventId, updatedData) => {
    const payload = {
      title: updatedData.title,
      date: updatedData.date,
      time: updatedData.time,
      end_time: updatedData.endTime,
      location: updatedData.location,
      description: updatedData.description,
      status: updatedData.status,
      type: updatedData.category || 'general',
      instructor: updatedData.instructor || ''
    };
    if (updatedData.submitted_by || updatedData.submittedBy) {
      payload.submitted_by = updatedData.submitted_by || updatedData.submittedBy;
    }
    await supabase.from('events').update(payload).eq('id', eventId);
    loadCommunityData();
  };

  const approveEvent = async (eventId) => {
    await supabase.from('events').update({ status: 'approved' }).eq('id', eventId);
    loadCommunityData();
  };

  const rejectEvent = async (eventId) => {
    await supabase.from('events').delete().eq('id', eventId);
    loadCommunityData();
  };

  const deleteEvent = async (eventId) => {
    await supabase.from('events').delete().eq('id', eventId);
    loadCommunityData();
  };

  return (
    <CommunityContext.Provider value={{ 
      posts, 
      events, 
      chats, 
      addPost, 
      updatePost, 
      deletePost, 
      toggleLike, 
      addEvent, 
      updateEvent, 
      approveEvent, 
      rejectEvent, 
      deleteEvent, 
      sendMessage 
    }}>
      {children}
    </CommunityContext.Provider>
  );
};
