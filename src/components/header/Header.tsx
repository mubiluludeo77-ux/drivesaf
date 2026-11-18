'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';

import ThemeToggle from '@/components/header/ThemeToggle';
import { useAuth } from '@/providers/AuthProvider';

export default function Header() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const links = [
    { href: '/', label: 'Accueil' },
    { href: '/commander', label: 'Commander' },
    user?.role === 'driver'
      ? { href: '/chauffeur', label: 'Espace chauffeur' }
      : { href: '/inscription?role=chauffeur', label: 'Devenir chauffeur' },
    { href: '/demo', label: 'Démo' },
  ];

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href.split('?')[0]));
  const close = () => setOpen(false);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-brand" onClick={close}>
          <span className="site-brand-mark">DS</span>
          <span>DriveSAF</span>
        </Link>

        <nav id="site-nav" className={`site-nav${open ? ' open' : ''}`} aria-label="Navigation principale">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? 'page' : undefined}
              onClick={close}
            >
              {l.label}
            </Link>
          ))}

          <div className="site-account">
            {user ? (
              <>
                <span className="site-user">{user.fullName.split(' ')[0]}</span>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => {
                    signOut();
                    close();
                  }}
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link href="/connexion" className="btn btn-secondary btn-small" onClick={close}>
                  Connexion
                </Link>
                <Link href="/inscription" className="btn btn-primary btn-small" onClick={close}>
                  Inscription
                </Link>
              </>
            )}
          </div>
        </nav>

        <div className="site-controls">
          <ThemeToggle />
          <button
            type="button"
            className="theme-toggle menu-toggle"
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
            aria-controls="site-nav"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>
    </header>
  );
}
