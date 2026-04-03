import type { ReactNode } from 'react';

interface GreetingProps {
  readonly name: string;
}

export function Greeting({ name }: GreetingProps): ReactNode {
  return <p>Hello, {name}!</p>;
}
