import { Game } from '@/types/team';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, MapPin, Trash2, Edit, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface GameCardProps {
  game: Game;
  onEdit?: (game: Game) => void;
  onDelete?: (id: string) => void;
}

export function GameCard({ game, onEdit, onDelete }: GameCardProps) {
  return (
    <Card className={cn(
      'group transition-shadow hover:shadow-md overflow-hidden',
      game.result?.won === true && 'border-l-[3px] border-l-gold',
      game.result?.won === false && 'border-l-[3px] border-l-destructive',
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            {/* Header with opponent and badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 ring-1 ring-gold/40">
                <Trophy className="h-4 w-4 text-gold" />
              </span>
              <h3 className="font-semibold">
                {game.title || (game.opponent ? `vs. ${game.opponent}` : 'Game')}
              </h3>
              <Badge
                variant="outline"
                className={cn(
                  game.venue === 'Home' && "border-primary/50 bg-primary/10 text-primary",
                  game.venue === 'Away' && "border-destructive/50 bg-destructive/10 text-destructive",
                  game.venue === 'Neutral' && "border-muted-foreground/50 bg-muted/50 text-muted-foreground"
                )}
              >
                {game.venue}
              </Badge>
              {game.isLeague && (
                <Badge variant="secondary">League</Badge>
              )}
            </div>
            
            {/* Date, time, location */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                {format(new Date(game.date), 'EEEE, MMMM d, yyyy')}
              </span>
              {game.time && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {game.time}
                </span>
              )}
            </div>
            
            {game.location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {game.location}
              </div>
            )}
            
            {/* Result */}
            {game.result && (
              <div className="mt-2">
                <Badge
                  variant="outline"
                  className={cn(
                    game.result.won
                      ? 'border-gold/70 bg-gold/10 text-gold font-semibold'
                      : 'border-destructive/50 bg-destructive/10 text-destructive'
                  )}
                >
                  {game.result.won ? 'W' : 'L'} {game.result.score}
                </Badge>
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {onEdit && (
              <Button variant="ghost" size="icon" onClick={() => onEdit(game)}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(game.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
