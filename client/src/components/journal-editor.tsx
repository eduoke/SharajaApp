import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertJournalSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const categories = [
  "Personal",
  "Work",
  "Travel",
  "Health",
  "Goals",
  "Ideas",
  "Other"
];

interface JournalEditorProps {
  selectedJournalId: number | null;
  onJournalCreated: (id: number) => void;
}

export default function JournalEditor({ selectedJournalId, onJournalCreated }: JournalEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [aiInsights, setAiInsights] = useState<any>(null);

  const form = useForm({
    resolver: zodResolver(insertJournalSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "Personal",
      isPublic: false,
    },
  });

  const { data: selectedJournal, isLoading: isLoadingJournal } = useQuery({
    queryKey: ["/api/journals", selectedJournalId],
    enabled: !!selectedJournalId,
  });

  useEffect(() => {
    if (selectedJournal) {
      form.reset(selectedJournal);
    } else {
      form.reset({
        title: "",
        content: "",
        category: "Personal",
        isPublic: false,
      });
    }
  }, [selectedJournal, form]);

  const createJournalMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/journals", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/journals"] });
      onJournalCreated(data.id);
      toast({
        title: "Journal created",
        description: "Your journal entry has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save journal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getInsightsMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/insights", { content });
      return res.json();
    },
    onSuccess: (data) => {
      setAiInsights(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to get insights",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createJournalMutation.mutate(data);
    getInsightsMutation.mutate(data.content);
  };

  if (isLoadingJournal) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{selectedJournalId ? "Edit Journal" : "New Journal Entry"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Give your entry a title..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      className="w-full min-h-[300px] p-3 rounded-md border"
                      placeholder="Write your thoughts..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <FormLabel>Make this entry public</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={createJournalMutation.isPending}
            >
              {createJournalMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Journal
            </Button>
          </CardContent>
        </Card>

        {aiInsights && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>AI Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Mood</h4>
                  <p>{aiInsights.mood}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Insights</h4>
                  <ul className="list-disc pl-4">
                    {aiInsights.insights.map((insight: string, i: number) => (
                      <li key={i}>{insight}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Suggestions</h4>
                  <ul className="list-disc pl-4">
                    {aiInsights.suggestions.map((suggestion: string, i: number) => (
                      <li key={i}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </Form>
  );
}
