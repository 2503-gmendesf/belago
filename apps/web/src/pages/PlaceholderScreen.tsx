import { Card } from '../components/Card.js';

interface PlaceholderScreenProps {
  title: string;
}

export function PlaceholderScreen({ title }: PlaceholderScreenProps) {
  return (
    <div className="stack gap16">
      <h1 className="h1">{title}</h1>
      <Card>
        <p className="muted small">Esta tela será migrada na Fase 3.</p>
      </Card>
    </div>
  );
}
