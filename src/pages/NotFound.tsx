import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: 'var(--spacing-xl)',
    }}>
      <div style={{
        textAlign: 'center',
        background: 'var(--bg-card)',
        padding: 'var(--spacing-2xl)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <h1 style={{
          fontSize: '4rem',
          fontWeight: 'bold',
          background: 'var(--gradient-brand)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 'var(--spacing-md)',
        }}>404</h1>
        <p style={{
          fontSize: 'var(--font-size-xl)',
          color: 'var(--text-secondary)',
          marginBottom: 'var(--spacing-lg)',
        }}>Página no encontrada</p>
        <Link
          to="/"
          style={{
            display: 'inline-block',
            padding: 'var(--spacing-md) var(--spacing-xl)',
            background: 'var(--gradient-brand)',
            color: 'white',
            borderRadius: 'var(--radius-md)',
            fontWeight: '600',
            textDecoration: 'none',
          }}
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
