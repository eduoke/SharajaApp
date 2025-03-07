import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Loader2 } from "lucide-react";
import { Journal } from "@shared/schema";

export default function Recommendations() {
  const { data: journals = [] } = useQuery<Journal[]>({
    queryKey: ["/api/journals"],
  });

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ["/api/recommendations"],
    queryFn: async () => {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: journals.map((journal) => journal.content),
        }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to get recommendations");
      return res.json() as Promise<{
        topics: string[];
        prompts: string[];
      }>;
    },
    enabled: journals.length > 0,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!recommendations) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Writing Prompts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Start writing some journal entries to get personalized recommendations!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Writing Prompts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Suggested Topics</h4>
            <ul className="list-disc pl-4 space-y-2">
              {recommendations.topics.map((topic, i) => (
                <li key={i} className="text-sm">{topic}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Writing Prompts</h4>
            <ul className="list-disc pl-4 space-y-2">
              {recommendations.prompts.map((prompt, i) => (
                <li key={i} className="text-sm">{prompt}</li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}