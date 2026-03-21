import React from 'react';
import { ShieldCheck } from 'lucide-react';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, errorInfo: string }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, errorInfo: '' };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorInfo: error.message };
  }

  render() {
    if (this.state.hasError) {
      let displayMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.errorInfo);
        if (parsed.error && parsed.error.includes('insufficient permissions')) {
          displayMessage = "You don't have permission to perform this action.";
        }
      } catch (e) {}

      return (
        <div className="h-screen w-full flex items-center justify-center bg-stone-950 p-6">
          <div className="max-w-md w-full bg-stone-900 border border-red-500/20 p-8 rounded-3xl text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-xl font-bold text-white mb-4">Application Error</h2>
            <p className="text-stone-400 text-sm mb-8 leading-relaxed">{displayMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-stone-800 text-white py-3 rounded-xl font-bold text-sm hover:bg-stone-700 transition-all"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
