export interface Database {
  public: {
    Tables: {
      messages: {
        Row: {
          id: string;
          user_id: string;
          role: 'user' | 'assistant';
          content: string;
          created_at: string;
          is_in_buffer: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: 'user' | 'assistant';
          content: string;
          created_at?: string;
          is_in_buffer?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: 'user' | 'assistant';
          content?: string;
          created_at?: string;
          is_in_buffer?: boolean;
        };
      };
      saved_notes: {
        Row: {
          id: string;
          user_id: string;
          message_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          message_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          message_id?: string;
          content?: string;
          created_at?: string;
        };
      };
      memories: {
        Row: {
          id: string;
          user_id: string;
          type: 'core' | 'identity' | 'experience';
          content: string;
          importance: number;
          created_at: string;
          last_used_at: string;
          access_count: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'core' | 'identity' | 'experience';
          content: string;
          importance?: number;
          created_at?: string;
          last_used_at?: string;
          access_count?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'core' | 'identity' | 'experience';
          content?: string;
          importance?: number;
          created_at?: string;
          last_used_at?: string;
          access_count?: number;
        };
      };
    };
  };
}

export type Message = Database['public']['Tables']['messages']['Row'];
export type SavedNote = Database['public']['Tables']['saved_notes']['Row'];
export type Memory = Database['public']['Tables']['memories']['Row'];
export type MemoryType = 'core' | 'identity' | 'experience';
