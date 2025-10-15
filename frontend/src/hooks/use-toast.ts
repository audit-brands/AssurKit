// Simple toast hook for development
export function useToast() {
  return {
    toast: ({ title, description }: { title: string; description?: string }) => {
      console.log('Toast:', title, description)
    }
  }
}