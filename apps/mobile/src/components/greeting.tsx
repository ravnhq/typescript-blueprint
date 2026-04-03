import type { ReactNode } from 'react';
import { Text } from 'react-native';

interface GreetingProps {
  readonly name: string;
}

export function Greeting({ name }: GreetingProps): ReactNode {
  return <Text>Hello, {name}!</Text>;
}
