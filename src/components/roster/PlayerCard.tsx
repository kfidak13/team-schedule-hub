import { Player } from '@/types/team';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, Phone, Trash2, Edit, MapPin, MoreVertical, UserCog } from 'lucide-react';
import silhouette from '@/assets/avatar-silhouette.svg';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTeam } from '@/context/TeamContext';

interface PlayerCardProps {
  player: Player;
  onEdit?: (player: Player) => void;
  onDelete?: (id: string) => void;
}

export function PlayerCard({ player, onEdit, onDelete }: PlayerCardProps) {
  const { updatePlayer } = useTeam();

  const initials = player.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const isManager = (player.rosterRole || 'player') === 'manager';
  
  return (
    <Card className="group transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={player.photo || silhouette} alt={player.name} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{player.name}</h3>
              {player.jerseyNumber && (
                <Badge variant="outline">#{player.jerseyNumber}</Badge>
              )}
              {isManager && (
                <Badge variant="secondary" className="font-normal">
                  Manager
                </Badge>
              )}
            </div>
            
            {player.position && (
              <p className="text-sm text-muted-foreground">{player.position}</p>
            )}

            {player.hometown && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span>{player.hometown}</span>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2 pt-1">
              {player.sports.map((sport) => (
                <Badge key={sport} variant="secondary" className="font-normal capitalize">
                  {sport}
                </Badge>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-3 pt-2 text-sm text-muted-foreground">
              {player.email && (
                <a
                  href={`mailto:${player.email}`}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{player.email}</span>
                </a>
              )}
              {player.phone && (
                <a
                  href={`tel:${player.phone}`}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>{player.phone}</span>
                </a>
              )}
            </div>
          </div>
          
          <div className="opacity-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onClick={() =>
                    updatePlayer(player.id, {
                      rosterRole: isManager ? 'player' : 'manager',
                    })
                  }
                  className="flex items-center gap-2"
                >
                  <UserCog className="h-4 w-4" />
                  {isManager ? 'Mark as Player' : 'Mark as Manager'}
                </DropdownMenuItem>

                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(player)} className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}

                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(player.id)}
                      className="flex items-center gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
