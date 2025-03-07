import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Circle } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCircleSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, UserPlus, Trash2 } from "lucide-react";

interface Member {
  id: number;
  username: string;
  role: string;
}

export default function CirclesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState<Circle | null>(null);
  const [isAddingMember, setIsAddingMember] = useState(false);

  const { data: circles = [] } = useQuery<Circle[]>({
    queryKey: ["/api/circles"],
  });

  const { data: selectedCircleMembers = [] } = useQuery<Member[]>({
    queryKey: ["/api/circles", selectedCircle?.id, "members"],
    enabled: !!selectedCircle,
  });

  const form = useForm({
    resolver: zodResolver(insertCircleSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const addMemberForm = useForm({
    defaultValues: {
      username: "",
      role: "member",
    },
  });

  const createCircleMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/circles", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/circles"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Circle created",
        description: "Your circle has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create circle",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async ({ circleId, data }: { circleId: number; data: any }) => {
      const res = await apiRequest("POST", `/api/circles/${circleId}/members`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/circles", selectedCircle?.id, "members"] });
      setIsAddingMember(false);
      addMemberForm.reset();
      toast({
        title: "Member added",
        description: "The member has been added to the circle.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async ({ circleId, userId }: { circleId: number; userId: number }) => {
      await apiRequest("DELETE", `/api/circles/${circleId}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/circles", selectedCircle?.id, "members"] });
      toast({
        title: "Member removed",
        description: "The member has been removed from the circle.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Circles</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Circle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Circle</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createCircleMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Circle Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter circle name..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Describe the purpose of this circle..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createCircleMutation.isPending}>
                  {createCircleMutation.isPending ? "Creating..." : "Create Circle"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {circles.map((circle) => (
          <Card key={circle.id} className={selectedCircle?.id === circle.id ? "ring-2 ring-primary" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {circle.name}
              </CardTitle>
              {circle.description && (
                <p className="text-sm text-muted-foreground">{circle.description}</p>
              )}
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full mb-2"
                onClick={() => setSelectedCircle(selectedCircle?.id === circle.id ? null : circle)}
              >
                {selectedCircle?.id === circle.id ? "Hide Members" : "View Members"}
              </Button>
              {selectedCircle?.id === circle.id && (
                <div className="space-y-4 mt-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Members</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingMember(!isAddingMember)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Member
                    </Button>
                  </div>
                  {isAddingMember && (
                    <form
                      onSubmit={addMemberForm.handleSubmit((data) =>
                        addMemberMutation.mutate({ circleId: circle.id, data })
                      )}
                      className="flex gap-2"
                    >
                      <Input
                        {...addMemberForm.register("username")}
                        placeholder="Username"
                        className="flex-1"
                      />
                      <Button type="submit" size="sm" disabled={addMemberMutation.isPending}>
                        Add
                      </Button>
                    </form>
                  )}
                  <div className="space-y-2">
                    {selectedCircleMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-2 bg-muted rounded-lg"
                      >
                        <div>
                          <span className="font-medium">{member.username}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {member.role}
                          </span>
                        </div>
                        {circle.ownerId !== member.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              removeMemberMutation.mutate({
                                circleId: circle.id,
                                userId: member.id,
                              })
                            }
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {circles.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4" />
              <p>You haven't created any circles yet. Create one to start sharing journals with others!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}