"use client"

import { toast as sonnerToast } from 'sonner'

export const useToast = () => {
  return {
    toast: (props: {
      title?: string
      description?: string
      variant?: 'default' | 'destructive'
      durationMs?: number
    }) => {
      const duration = props.durationMs ?? 6000
      if (props.variant === 'destructive') {
        sonnerToast.error(props.title || 'Erro', {
          description: props.description,
          duration,
        })
      } else {
        sonnerToast.success(props.title || 'Sucesso', {
          description: props.description,
          duration,
        })
      }
    }
  }
}

export { sonnerToast as toast }
