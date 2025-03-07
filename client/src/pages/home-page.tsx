import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import JournalEditor from "@/components/journal-editor";
import JournalList from "@/components/journal-list";
import Recommendations from "@/components/recommendations";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [selectedJournalId, setSelectedJournalId] = useState<number | null>(null);

  const { data: journals = [] } = useQuery({
    queryKey: ["/api/journals"],
  });

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 border-r bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Welcome, {user?.username}</h2>
          <Button variant="ghost" size="sm" onClick={() => logoutMutation.mutate()}>
            Logout
          </Button>
        </div>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <JournalList
            journals={journals}
            selectedId={selectedJournalId}
            onSelect={setSelectedJournalId}
          />
        </ScrollArea>
      </aside>
      
      <main className="flex-1 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
          <div className="lg:col-span-2">
            <JournalEditor
              selectedJournalId={selectedJournalId}
              onJournalCreated={(id) => setSelectedJournalId(id)}
            />
          </div>
          <div className="hidden lg:block">
            <Recommendations />
          </div>
        </div>
      </main>
    </div>
  );
}
