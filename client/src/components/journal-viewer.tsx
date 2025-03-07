import { Journal } from "@shared/schema";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Globe, Lock } from "lucide-react";

interface JournalViewerProps {
  journal: Journal;
  onEdit: () => void;
}

export default function JournalViewer({ journal, onEdit }: JournalViewerProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">{journal.title}</CardTitle>
        <div className="flex items-center gap-2">
          {journal.isPublic ? (
            <Globe className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Lock className="h-4 w-4 text-muted-foreground" />
          )}
          <Button onClick={onEdit} variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <span className="font-medium mr-2">Category:</span>
          {journal.category}
          <span className="mx-2">•</span>
          <span className="font-medium mr-2">Created:</span>
          {journal.createdAt && format(new Date(journal.createdAt), "PPP")}
        </div>
        <div className="prose prose-sm max-w-none">
          {journal.content.split("\n").map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
