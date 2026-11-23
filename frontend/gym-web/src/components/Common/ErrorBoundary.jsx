import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="card text-center py-12">
          <p className="text-red-600 dark:text-red-400 font-medium">
            Something went wrong. Please reload the page.
          </p>
          <button onClick={this.handleReload} className="mt-4 btn-primary">
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
