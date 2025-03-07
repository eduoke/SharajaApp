import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import JournalEditor from "@/components/journal-editor";
import JournalList from "@/components/journal-list";
import JournalViewer from "@/components/journal-viewer";
import Recommendations from "@/components/recommendations";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "wouter";
import { Book, Users } from "lucide-react";
import { Journal } from "@shared/schema";
import MoodTracker from "@/components/mood-tracker";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [selectedJournalId, setSelectedJournalId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const { data: journals = [] } = useQuery<Journal[]>({
    queryKey: ["/api/journals"],
  });

  const selectedJournal = selectedJournalId 
    ? journals.find(j => j.id === selectedJournalId)
    : null;

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 border-r bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Welcome, {user?.username}</h2>
          <Button variant="ghost" size="sm" onClick={() => logoutMutation.mutate()}>
            Logout
          </Button>
        </div>
        <div className="flex gap-2 mb-4">
          <Link href="/">
            <Button variant="outline" className="w-full flex items-center gap-2">
              <Book className="h-4 w-4" />
              Journals
            </Button>
          </Link>
          <Link href="/circles">
            <Button variant="outline" className="w-full flex items-center gap-2">
              <Users className="h-4 w-4" />
              Circles
            </Button>
          </Link>
        </div>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <JournalList
            journals={journals}
            selectedId={selectedJournalId}
            onSelect={(id) => {
              setSelectedJournalId(id);
              setIsEditing(id === null); // If creating new entry, go to edit mode
            }}
          />
        </ScrollArea>
      </aside>

      <main className="flex-1 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
          <div className="lg:col-span-2">
            {isEditing ? (
              <JournalEditor
                selectedJournalId={selectedJournalId}
                onJournalCreated={(id) => {
                  setSelectedJournalId(id);
                  setIsEditing(false);
                }}
              />
            ) : selectedJournal ? (
              <JournalViewer
                journal={selectedJournal}
                onEdit={() => setIsEditing(true)}
              />
            ) : (
              <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
                Select a journal entry or create a new one
              </div>
            )}
          </div>
          <div className="hidden lg:flex lg:flex-col gap-4">
            <MoodTracker journals={journals} />
            <Recommendations />
          </div>
        </div>
      </main>
    </div>
  );
}