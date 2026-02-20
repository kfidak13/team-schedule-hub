import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Trophy } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const handleGetStarted = () => navigate('/get-started');

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Button variant="ghost" className="h-auto gap-3 px-6 py-4 text-base" onClick={handleGetStarted}>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-border">
          <Trophy className="h-5 w-5" />
        </span>
        <span className="flex flex-col items-start leading-tight">
          <span className="font-semibold tracking-tight">Get started</span>
          <span className="text-sm font-normal text-muted-foreground">Choose your sport program</span>
        </span>
        <ArrowRight className="ml-2 h-4 w-4 text-muted-foreground" />
      </Button>
    </div>
  );
}
