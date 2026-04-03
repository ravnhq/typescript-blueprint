import type { ReactNode } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: IndexComponent,
});

function IndexComponent(): ReactNode {
  return (
    <main style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
      <h1>Blueprint Web</h1>
      <p>TypeScript monorepo blueprint — web app.</p>
      <nav>
        <Link to="/notes">Notes</Link>
      </nav>
    </main>
  );
}
