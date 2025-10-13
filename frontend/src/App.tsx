import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-white">
          <h1 className="text-4xl font-bold text-center py-8 text-gray-900">
            AssurKit
          </h1>
          <p className="text-center text-gray-600">
            SOX-first open-source GRC platform
          </p>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App