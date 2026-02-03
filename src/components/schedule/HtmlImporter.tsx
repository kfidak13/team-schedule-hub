import { useState } from 'react';
import { parseScheduleHtml } from '@/lib/htmlParser';
import { useTeam } from '@/context/TeamContext';
import { Sport } from '@/types/team';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, FileCode, Check } from 'lucide-react';
import { toast } from 'sonner';

const sportOptions: { value: Sport; label: string }[] = [
  { value: 'tennis', label: 'Tennis' },
  { value: 'basketball', label: 'Basketball' },
  { value: 'soccer', label: 'Soccer' },
  { value: 'volleyball', label: 'Volleyball' },
  { value: 'baseball', label: 'Baseball' },
  { value: 'football', label: 'Football' },
  { value: 'other', label: 'Other' },
];

export function HtmlImporter() {
  const [open, setOpen] = useState(false);
  const [html, setHtml] = useState('');
  const [sport, setSport] = useState<Sport>('tennis');
  const [preview, setPreview] = useState<{ count: number; teamName?: string } | null>(null);
  const { addGames, addTeamInfo } = useTeam();
  
  const handlePreview = () => {
    if (!html.trim()) {
      toast.error('Please paste your HTML schedule first');
      return;
    }
    
    const result = parseScheduleHtml(html, sport);
    setPreview({
      count: result.games.length,
      teamName: result.teamInfo?.name,
    });
  };
  
  const handleImport = () => {
    if (!html.trim()) {
      toast.error('Please paste your HTML schedule first');
      return;
    }
    
    const result = parseScheduleHtml(html, sport);
    
    if (result.games.length === 0) {
      toast.error('No games found in the HTML. Please check the format.');
      return;
    }
    
    addGames(result.games);
    
    if (result.teamInfo) {
      addTeamInfo(result.teamInfo);
    }
    
    toast.success(`Imported ${result.games.length} games!`);
    setHtml('');
    setPreview(null);
    setOpen(false);
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setHtml(content);
      setPreview(null);
    };
    reader.readAsText(file);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Import Schedule
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            Import HTML Schedule
          </DialogTitle>
          <DialogDescription>
            Paste the HTML from your school's athletic schedule page or upload an HTML file.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="sport">Sport</Label>
            <Select value={sport} onValueChange={(v) => { setSport(v as Sport); setPreview(null); }}>
              <SelectTrigger>
                <SelectValue placeholder="Select sport" />
              </SelectTrigger>
              <SelectContent>
                {sportOptions.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="html">HTML Content</Label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <label className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload File
                  <input
                    type="file"
                    accept=".html,.htm"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </Button>
            </div>
            <Textarea
              id="html"
              placeholder="Paste your HTML schedule here..."
              value={html}
              onChange={(e) => { setHtml(e.target.value); setPreview(null); }}
              className="min-h-[200px] font-mono text-xs"
            />
          </div>
          
          {preview && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <Check className="h-5 w-5" />
                <span className="font-medium">
                  Found {preview.count} games
                  {preview.teamName && ` for ${preview.teamName}`}
                </span>
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handlePreview}>
              Preview
            </Button>
            <Button onClick={handleImport} disabled={!html.trim()}>
              Import Games
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
