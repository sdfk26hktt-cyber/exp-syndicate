import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const CommunityContext = createContext();

export const useCommunity = () => useContext(CommunityContext);

export const CommunityProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [chats, setChats] = useState({});

  const loadCommunityData = async () => {
    const [postsRes, eventsRes] = await Promise.all([
      supabase.from('posts').select('*').order('timestamp', { ascending: false }),
      supabase.from('events').select('*')
    ]);

    if (postsRes.data) {
      // Map postgres arrays correctly, though Supabase handles simple arrays well.
      setPosts(postsRes.data.map(p => ({
        id: p.id,
        authorName: p.author,
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
      setEvents(eventsRes.data.map(e => ({
        id: e.id,
        title: e.title,
        date: e.date,
        time: e.time,
        endTime: e.end_time,
        location: e.location,
        description: e.description,
        status: e.status,
        type: e.type,
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
          agentName, // ensure name is updated if it changed
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
    let isRawHtml = false;

    if (rawMediaInput.trim().startsWith('<')) {
      isRawHtml = true;
    } else {
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
      author_id: currentUser.id,
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
    const userId = currentUser.id;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const hasLiked = post.likes.includes(userId);
    const updatedLikes = hasLiked ? post.likes.filter(id => id !== userId) : [...post.likes, userId];

    await supabase.from('posts').update({ likes: updatedLikes }).eq('id', postId);
    loadCommunityData();
  };

  const updatePost = async (postId, updatedData) => {
    let finalVideoUrl = updatedData.media || '';
    let isRawHtml = false;

    if (finalVideoUrl.trim().startsWith('<')) {
      isRawHtml = true;
    } else {
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

  const addEvent = async (title, date, time, endTime, location, description, category = 'general') => {
    const status = currentUser?.role === 'admin' ? 'approved' : 'pending';
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
      attendees: []
    };
    await supabase.from('events').insert([newEvent]);
    loadCommunityData();
  };

  const updateEvent = async (eventId, updatedData) => {
    await supabase.from('events').update({
      title: updatedData.title,
      date: updatedData.date,
      time: updatedData.time,
      end_time: updatedData.endTime,
      location: updatedData.location,
      description: updatedData.description,
      status: updatedData.status,
      type: updatedData.category || 'general'
    }).eq('id', eventId);
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
    <CommunityContext.Provider value={{ posts, events, chats, addPost, updatePost, deletePost, toggleLike, addEvent, updateEvent, approveEvent, rejectEvent, deleteEvent, sendMessage }}>
      {children}
    </CommunityContext.Provider>
  );
};
