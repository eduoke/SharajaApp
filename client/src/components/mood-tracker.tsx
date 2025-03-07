import { useMemo } from "react";
import { Journal } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays, eachDayOfInterval } from "date-fns";

const moodColors = {
  joyful: "#FFD700", // Gold
  happy: "#98FB98", // Pale green
  neutral: "#808080", // Gray
  sad: "#87CEEB", // Sky blue
  angry: "#FF6B6B", // Coral red
};

const moodValues = {
  joyful: 5,
  happy: 4,
  neutral: 3,
  sad: 2,
  angry: 1,
};

interface MoodTrackerProps {
  journals: Journal[];
}

export default function MoodTracker({ journals }: MoodTrackerProps) {
  const moodData = useMemo(() => {
    // Get the last 7 days
    const dates = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date(),
    });

    // Create a map of dates to moods
    const journalsByDate = journals.reduce((acc, journal) => {
      if (!journal.createdAt) return acc;
      const date = format(new Date(journal.createdAt), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(journal);
      return acc;
    }, {} as Record<string, Journal[]>);

    // Create data points for each day
    return dates.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayJournals = journalsByDate[dateStr] || [];
      
      // Calculate average mood if there are entries
      const moodValue = dayJournals.length
        ? dayJournals.reduce((sum, j) => sum + (moodValues[j.mood as keyof typeof moodValues] || 3), 0) / dayJournals.length
        : 3; // Default to neutral

      return {
        date: format(date, 'MMM d'),
        mood: moodValue,
        color: dayJournals[0]?.moodColor || moodColors.neutral,
      };
    });
  }, [journals]);

  const moodStats = useMemo(() => {
    const stats = {
      joyful: 0,
      happy: 0,
      neutral: 0,
      sad: 0,
      angry: 0,
    };

    journals.forEach(journal => {
      const mood = journal.mood as keyof typeof stats;
      if (mood in stats) {
        stats[mood]++;
      }
    });

    return stats;
  }, [journals]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mood Tracker</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={moodData}>
              <XAxis dataKey="date" />
              <YAxis
                domain={[1, 5]}
                ticks={[1, 2, 3, 4, 5]}
                tickFormatter={(value) => {
                  const labels = { 1: "Angry", 2: "Sad", 3: "Neutral", 4: "Happy", 5: "Joyful" };
                  return labels[value as keyof typeof labels] || "";
                }}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="mood"
                stroke="#8884d8"
                strokeWidth={2}
                dot={{ fill: "#8884d8" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 grid grid-cols-5 gap-2">
          {Object.entries(moodStats).map(([mood, count]) => (
            <div
              key={mood}
              className="flex flex-col items-center p-2 rounded-lg"
              style={{ backgroundColor: moodColors[mood as keyof typeof moodColors] }}
            >
              <span className="font-medium capitalize">{mood}</span>
              <span className="text-sm">{count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
