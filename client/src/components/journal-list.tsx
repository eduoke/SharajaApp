import { format } from "date-fns";
import { Journal } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { PlusCircle, Book } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface JournalListProps {
  journals: Journal[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

export default function JournalList({ journals, selectedId, onSelect }: JournalListProps) {
  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={() => onSelect(null)}
      >
        <PlusCircle className="h-4 w-4 mr-2" />
        New Entry
      </Button>

      <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="space-y-2">
          {journals.map((journal) => (
            <Button
              key={journal.id}
              variant="ghost"
              className={cn(
                "w-full justify-start",
                selectedId === journal.id && "bg-accent"
              )}
              onClick={() => onSelect(journal.id)}
            >
              <Book className="h-4 w-4 mr-2" />
              <div className="text-left">
                <div className="font-medium truncate">{journal.title}</div>
                <div className="text-xs text-muted-foreground">
                  {journal.createdAt && format(new Date(journal.createdAt), "MMM d, yyyy")}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}