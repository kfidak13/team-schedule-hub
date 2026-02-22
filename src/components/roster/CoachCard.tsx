import { Coach } from '@/types/team';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, Phone, Trash2, Edit } from 'lucide-react';
import silhouette from '@/assets/avatar-silhouette.svg';

interface CoachCardProps {
  coach: Coach;
  onEdit?: (coach: Coach) => void;
  onDelete?: (id: string) => void;
}

export function CoachCard({ coach, onEdit, onDelete }: CoachCardProps) {
  const initials = coach.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  return (
    <Card className="group transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 ring-1 ring-border">
            <AvatarImage src={coach.photo || silhouette} alt={coach.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{coach.name}</h3>
              <Badge
                variant="outline"
                className={coach.role === 'Head Coach'
                  ? 'border-gold/60 bg-gold/10 text-gold font-semibold'
                  : 'border-muted-foreground/30 text-muted-foreground font-normal'
                }
              >
                {coach.role}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {coach.sports.map((sport) => (
                <Badge key={sport} variant="secondary" className="font-normal capitalize">
                  {sport}
                </Badge>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-3 pt-2 text-sm text-muted-foreground">
              {coach.email && (
                <a
                  href={`mailto:${coach.email}`}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{coach.email}</span>
                </a>
              )}
              {coach.phone && (
                <a
                  href={`tel:${coach.phone}`}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>{coach.phone}</span>
                </a>
              )}
            </div>
          </div>
          
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {onEdit && (
              <Button variant="ghost" size="icon" onClick={() => onEdit(coach)}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(coach.id)}
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
