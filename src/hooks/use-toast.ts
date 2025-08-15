"use client"

import { toast as sonnerToast } from 'sonner'

export const useToast = () => {
  return {
    toast: (props: {
      title?: string
      description?: string
      variant?: 'default' | 'destructive'
    }) => {
      if (props.variant === 'destructive') {
        sonnerToast.error(props.title || 'Erro', {
          description: props.description
        })
      } else {
        sonnerToast.success(props.title || 'Sucesso', {
          description: props.description
        })
      }
    }
  }
}

export { sonnerToast as toast }
