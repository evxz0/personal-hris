import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface CustomTemplate {
  id: string
  nama_template: string
  deskripsi?: string
  html_content: string
  detected_placeholders: string[]
  created_at: string
}

const LOCAL_STORAGE_KEY = 'phris_custom_templates'

const DEFAULT_TEMPLATES: CustomTemplate[] = []

function getLocalTemplates(): CustomTemplate[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) return DEFAULT_TEMPLATES
    return JSON.parse(raw)
  } catch {
    return DEFAULT_TEMPLATES
  }
}

function saveLocalTemplates(list: CustomTemplate[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list))
  } catch (e) {
    console.error('Failed to save custom templates to localStorage', e)
  }
}

export function useCustomTemplates() {
  return useQuery({
    queryKey: ['custom-templates'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('master_template_surat').select('*').order('created_at', { ascending: false })
        if (error) throw error
        return (data ?? []) as CustomTemplate[]
      } catch (err) {
        console.warn('Supabase master_template_surat query failed or table missing, using local storage fallback:', err)
        return getLocalTemplates()
      }
    }
  })
}

export function useAddCustomTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { nama_template: string; deskripsi?: string; html_content: string; detected_placeholders: string[] }) => {
      const newItem: CustomTemplate = {
        id: 'TPL-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        nama_template: payload.nama_template,
        deskripsi: payload.deskripsi || '',
        html_content: payload.html_content,
        detected_placeholders: payload.detected_placeholders,
        created_at: new Date().toISOString()
      }

      // Save locally
      const localList = getLocalTemplates()
      localList.unshift(newItem)
      saveLocalTemplates(localList)

      // Save to Supabase if table exists
      try {
        await supabase.from('master_template_surat').insert([{
          id: newItem.id,
          nama_template: newItem.nama_template,
          deskripsi: newItem.deskripsi,
          html_content: newItem.html_content,
          detected_placeholders: newItem.detected_placeholders
        }])
      } catch (err) {
        console.warn('Could not insert into Supabase master_template_surat:', err)
      }

      return newItem
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['custom-templates'] })
    }
  })
}

export function useDeleteCustomTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      // Remove locally
      const localList = getLocalTemplates().filter(t => t.id !== id)
      saveLocalTemplates(localList)

      // Remove from Supabase
      try {
        await supabase.from('master_template_surat').delete().eq('id', id)
      } catch (err) {
        console.warn('Could not delete from Supabase master_template_surat:', err)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['custom-templates'] })
    }
  })
}
