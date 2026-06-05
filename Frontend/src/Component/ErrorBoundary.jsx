import React from 'react';

/**
 * Error boundary. Catches render throws so a single bad component doesn't blank the
 * whole app (or, in `compact` mode, a whole section). In dev it surfaces the actual
 * error + component stack so the cause is visible instead of a generic message.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Caught render error:', error, info?.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, info: null });
    if (!this.props.compact) window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const isDev = import.meta.env.DEV;
    const msg = this.state.error?.message || String(this.state.error || 'Unknown error');

    // Compact (section-level) fallback — keeps the rest of the page alive.
    if (this.props.compact) {
      return (
        <div style={{
          border: '1px solid #f59e0b55', background: '#f59e0b14', borderRadius: 16,
          padding: '1.25rem', margin: '1rem 0', color: '#92400e', fontFamily: 'sans-serif'
        }}>
          <strong>{this.props.label || 'This section'} couldn’t be displayed.</strong>
          {isDev && (
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, marginTop: 8, color: '#b45309' }}>
              {msg}
            </pre>
          )}
          <button onClick={this.handleReload} style={{
            marginTop: 10, background: '#2563eb', color: '#fff', border: 'none',
            padding: '0.4rem 0.9rem', borderRadius: 8, fontWeight: 600, cursor: 'pointer'
          }}>Retry</button>
        </div>
      );
    }

    // Full-screen fallback.
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '2rem',
        textAlign: 'center', fontFamily: 'sans-serif', background: '#0a0a0f', color: '#e5e7eb'
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          Something went wrong
        </h1>
        <p style={{ color: '#9ca3af', marginBottom: '1.5rem', maxWidth: 480 }}>
          An unexpected error occurred while rendering this page. You can return home and try again.
        </p>
        {isDev && (
          <pre style={{
            whiteSpace: 'pre-wrap', textAlign: 'left', maxWidth: 720, maxHeight: 280,
            overflow: 'auto', background: '#111827', color: '#fca5a5', padding: '1rem',
            borderRadius: 8, fontSize: 12, marginBottom: '1.5rem'
          }}>
            {msg}
            {this.state.info?.componentStack || ''}
          </pre>
        )}
        <button onClick={this.handleReload} style={{
          background: '#2563eb', color: '#fff', border: 'none', padding: '0.75rem 1.5rem',
          borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer'
        }}>Return Home</button>
      </div>
    );
  }
}

export default ErrorBoundary;
