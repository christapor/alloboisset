import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rqyzrzbvfmwesxifwqcc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxeXpyemJ2Zm13ZXN4aWZ3cWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNDg1MzYsImV4cCI6MjA4ODgyNDUzNn0.ZDxiMRyFBaxtgG-Vf5b0fa4jtL_1OYHb5AKSKJqV_U4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
