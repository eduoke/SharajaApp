import { format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";
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

interface GroupedJournals {
  [key: string]: Journal[];
}

export default function JournalList({ journals, selectedId, onSelect }: JournalListProps) {
  const groupJournalsByDate = (journals: Journal[]): GroupedJournals => {
    return journals.reduce((groups: GroupedJournals, journal) => {
      if (!journal.createdAt) return groups;

      const date = new Date(journal.createdAt);
      let groupKey = "Older";

      if (isToday(date)) {
        groupKey = "Today";
      } else if (isYesterday(date)) {
        groupKey = "Yesterday";
      } else if (isThisWeek(date)) {
        groupKey = "This Week";
      } else if (isThisMonth(date)) {
        groupKey = "This Month";
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(journal);
      return groups;
    }, {});
  };

  const sortedJournals = [...journals].sort((a, b) => {
    if (!a.createdAt || !b.createdAt) return 0;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const groupedJournals = groupJournalsByDate(sortedJournals);

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
        <div className="space-y-4">
          {Object.entries(groupedJournals).map(([groupName, groupJournals]) => (
            <div key={groupName}>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">{groupName}</h3>
              <div className="space-y-1">
                {groupJournals.map((journal) => (
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
                        {journal.createdAt && format(new Date(journal.createdAt), "h:mm a")}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}