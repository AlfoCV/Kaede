"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Message, SavedNote, Memory, MemoryType } from '@/lib/database.types';
import { USER_ID } from '@/lib/constants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Global state to track if tables exist
let tablesExist: boolean | null = null;
let checkingTables = false;
const tableCheckCallbacks: Array<(exists: boolean) => void> = [];

const getSupabase = () => {
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
};

// Check if tables exist (only once)
async function checkTablesExist(): Promise<boolean> {
  if (tablesExist !== null) return tablesExist;
  
  if (checkingTables) {
    // Wait for the check to complete
    return new Promise((resolve) => {
      tableCheckCallbacks.push(resolve);
    });
  }
  
  checkingTables = true;
  const supabase = getSupabase();
  if (!supabase) {
    tablesExist = false;
    checkingTables = false;
    return false;
  }
  
  try {
    // Try to query messages table with limit 0 to check if it exists
    const { error } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .limit(0);
    
    tablesExist = !error;
  } catch {
    tablesExist = false;
  }
  
  checkingTables = false;
  // Notify all waiting callbacks
  tableCheckCallbacks.forEach(cb => cb(tablesExist!));
  tableCheckCallbacks.length = 0;
  
  return tablesExist;
}

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    // Check if tables exist first
    const exists = await checkTablesExist();
    if (!exists) {
      setError('tables_not_created');
      setLoading(false);
      return;
    }
    
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', USER_ID)
        .eq('is_in_buffer', true)
        .order('created_at', { ascending: true });
      
      if (fetchError) {
        if (fetchError?.code === 'PGRST205' || fetchError?.message?.includes?.('not found')) {
          tablesExist = false;
          setError('tables_not_created');
        }
      } else {
        setMessages(data ?? []);
      }
    } catch {
      // Expected error - silently handle
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const addMessage = async (role: 'user' | 'assistant', content: string) => {
    const exists = await checkTablesExist();
    if (!exists) return null;
    
    const supabase = getSupabase();
    if (!supabase) return null;
    
    try {
      const { data, error: insertError } = await supabase
        .from('messages')
        .insert({
          user_id: USER_ID,
          role,
          content,
          is_in_buffer: true,
        })
        .select()
        .single();
      
      if (insertError) return null;
      setMessages(prev => [...prev, data]);
      return data;
    } catch {
      return null;
    }
  };

  const clearBuffer = async () => {
    const exists = await checkTablesExist();
    if (!exists) return false;
    
    const supabase = getSupabase();
    if (!supabase) return false;
    
    try {
      const { error: updateError } = await supabase
        .from('messages')
        .update({ is_in_buffer: false })
        .eq('user_id', USER_ID)
        .eq('is_in_buffer', true);
      
      if (updateError) return false;
      setMessages([]);
      return true;
    } catch {
      return false;
    }
  };

  return { messages, loading, error, addMessage, clearBuffer, refetch: fetchMessages };
}

export function useSavedNotes() {
  const [notes, setNotes] = useState<SavedNote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    
    const exists = await checkTablesExist();
    if (!exists) {
      setLoading(false);
      return;
    }
    
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error: fetchError } = await supabase
        .from('saved_notes')
        .select('*')
        .eq('user_id', USER_ID)
        .order('created_at', { ascending: false });
      
      if (!fetchError) {
        setNotes(data ?? []);
      }
    } catch {
      // Silently fail
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const saveNote = async (messageId: string | null, content: string) => {
    const exists = await checkTablesExist();
    if (!exists) return null;
    
    const supabase = getSupabase();
    if (!supabase) return null;
    
    try {
      const { data, error: insertError } = await supabase
        .from('saved_notes')
        .insert({
          user_id: USER_ID,
          message_id: messageId || undefined,
          content,
        })
        .select()
        .single();
      
      if (insertError) {
        return null;
      }
      setNotes(prev => [data, ...prev]);
      return data;
    } catch {
      return null;
    }
  };

  const deleteNote = async (id: string) => {
    const exists = await checkTablesExist();
    if (!exists) return false;
    
    const supabase = getSupabase();
    if (!supabase) return false;
    
    try {
      const { error: deleteError } = await supabase
        .from('saved_notes')
        .delete()
        .eq('id', id);
      
      if (deleteError) {
        return false;
      }
      setNotes(prev => prev.filter(n => n?.id !== id));
      return true;
    } catch {
      return false;
    }
  };

  return { notes, loading, saveNote, deleteNote, refetch: fetchNotes };
}

export function useMemories() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMemories = useCallback(async () => {
    setLoading(true);
    
    const exists = await checkTablesExist();
    if (!exists) {
      setLoading(false);
      return;
    }
    
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error: fetchError } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', USER_ID)
        .order('importance', { ascending: false })
        .order('last_used_at', { ascending: false });
      
      if (!fetchError) {
        setMemories(data ?? []);
      }
    } catch {
      // Silently fail
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const addMemory = async (
    content: string, 
    type: MemoryType = 'identity', 
    importance: number = 3
  ) => {
    const exists = await checkTablesExist();
    if (!exists) return null;
    
    const supabase = getSupabase();
    if (!supabase) return null;
    
    try {
      const { data, error: insertError } = await supabase
        .from('memories')
        .insert({
          user_id: USER_ID,
          type,
          content,
          importance,
          access_count: 0,
        })
        .select()
        .single();
      
      if (insertError) {
        return null;
      }
      setMemories(prev => [data, ...prev]);
      return data;
    } catch {
      return null;
    }
  };

  const updateMemory = async (id: string, updates: Partial<Memory>) => {
    const exists = await checkTablesExist();
    if (!exists) return null;
    
    const supabase = getSupabase();
    if (!supabase) return null;
    
    try {
      const { data, error: updateError } = await supabase
        .from('memories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) {
        return null;
      }
      setMemories(prev => prev.map(m => m?.id === id ? data : m));
      return data;
    } catch {
      return null;
    }
  };

  const deleteMemory = async (id: string) => {
    const exists = await checkTablesExist();
    if (!exists) return false;
    
    const supabase = getSupabase();
    if (!supabase) return false;
    
    try {
      const { error: deleteError } = await supabase
        .from('memories')
        .delete()
        .eq('id', id);
      
      if (deleteError) {
        return false;
      }
      setMemories(prev => prev.filter(m => m?.id !== id));
      return true;
    } catch {
      return false;
    }
  };

  // Function to reset table check (call after user creates tables)
  const resetTableCheck = () => {
    tablesExist = null;
  };

  return { memories, loading, addMemory, updateMemory, deleteMemory, refetch: fetchMemories, resetTableCheck };
}

// Export function to reset table check globally
export function resetTableCheck() {
  tablesExist = null;
}
