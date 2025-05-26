import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Settings, Users, Plus, Eye, Edit, Trash2, UserPlus } from "lucide-react";

const groupSchema = z.object({
  name: z.string().min(2, "Group name must be at least 2 characters"),
  description: z.string().optional(),
});

const addUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  canAddExpense: z.boolean().default(false),
});

const makeAdminSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type GroupFormData = z.infer<typeof groupSchema>;
type AddUserFormData = z.infer<typeof addUserSchema>;

interface Group {
  id: number;
  name: string;
  description: string;
  adminId: string;
  createdAt: string;
  updatedAt: string;
}

interface GroupMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  canAddExpense: boolean;
}

export default function Admin() {
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const groupForm = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const addUserForm = useForm<AddUserFormData>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      email: "",
      canAddExpense: false,
    },
  });

  const { data: groups, isLoading: groupsLoading } = useQuery<Group[]>({
    queryKey: ["/api/admin/groups"],
  });

  const { data: groupMembers } = useQuery<GroupMember[]>({
    queryKey: ["/api/admin/groups", selectedGroup?.id, "members"],
    enabled: !!selectedGroup,
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: GroupFormData) => {
      const response = await apiRequest("POST", "/api/admin/groups", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/groups"] });
      toast({
        title: "Group Created",
        description: "Your group has been created successfully.",
      });
      groupForm.reset();
      setShowCreateGroup(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create group. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addUserMutation = useMutation({
    mutationFn: async (data: AddUserFormData) => {
      const response = await apiRequest("POST", `/api/admin/groups/${selectedGroup?.id}/members`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/groups", selectedGroup?.id, "members"] });
      toast({
        title: "User Added",
        description: "User has been added to the group successfully.",
      });
      addUserForm.reset();
      setShowAddUser(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const removeUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/admin/groups/${selectedGroup?.id}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/groups", selectedGroup?.id, "members"] });
      toast({
        title: "User Removed",
        description: "User has been removed from the group.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onCreateGroup = (data: GroupFormData) => {
    createGroupMutation.mutate(data);
  };

  const onAddUser = (data: AddUserFormData) => {
    addUserMutation.mutate(data);
  };

  return (
    <div className="max-w-sm mx-auto bg-gray-50 min-h-screen pb-20">
      {/* Header */}
      <div className="gradient-header text-white p-6 pt-12">
        <div className="flex items-center space-x-3 mb-4">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </div>
        <p className="text-blue-100 text-sm">
          Manage groups and user permissions
        </p>
      </div>

      <div className="p-6 -mt-8 relative z-10 space-y-6">
        {/* Create Group Button */}
        <Card>
          <CardContent className="p-4">
            <Button
              onClick={() => setShowCreateGroup(true)}
              className="w-full bg-primary hover:bg-primary/90 text-white p-3 rounded-xl font-semibold touch-button"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Group
            </Button>
          </CardContent>
        </Card>

        {/* Groups List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Your Groups
            </CardTitle>
          </CardHeader>
          <CardContent>
            {groupsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : groups && groups.length > 0 ? (
              <div className="space-y-3">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="p-4 border border-gray-200 rounded-xl bg-white"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold">{group.name}</h3>
                        {group.description && (
                          <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Created {formatDate(group.createdAt)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedGroup(group)}
                        className="text-primary"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No groups created yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Create your first group to get started
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Group Details */}
        {selectedGroup && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{selectedGroup.name}</CardTitle>
                <Button
                  onClick={() => setShowAddUser(true)}
                  size="sm"
                  className="bg-green-500 hover:bg-green-600"
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Add User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {groupMembers && groupMembers.length > 0 ? (
                <div className="space-y-3">
                  {groupMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex justify-between items-center p-3 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{member.firstName} {member.lastName}</p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                        <p className="text-xs text-gray-500">
                          {member.canAddExpense ? "Can add expenses" : "View only"}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUserMutation.mutate(member.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No members in this group</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Add users to start sharing expenses
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Group Modal */}
      <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
        <DialogContent className="sm:max-w-md mx-4 rounded-t-2xl fixed bottom-0 left-1/2 transform -translate-x-1/2 max-w-sm w-full border-0 p-0">
          <div className="bg-white rounded-t-2xl p-6">
            <DialogHeader className="mb-6">
              <DialogTitle>Create New Group</DialogTitle>
            </DialogHeader>

            <Form {...groupForm}>
              <form onSubmit={groupForm.handleSubmit(onCreateGroup)} className="space-y-4">
                <FormField
                  control={groupForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Family Expenses"
                          className="p-3 border border-gray-300 rounded-xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={groupForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe the purpose of this group"
                          className="p-3 border border-gray-300 rounded-xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={createGroupMutation.isPending}
                  className="w-full bg-primary hover:bg-primary/90 text-white p-3 rounded-xl font-semibold touch-button"
                >
                  {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                </Button>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add User Modal */}
      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent className="sm:max-w-md mx-4 rounded-t-2xl fixed bottom-0 left-1/2 transform -translate-x-1/2 max-w-sm w-full border-0 p-0">
          <div className="bg-white rounded-t-2xl p-6">
            <DialogHeader className="mb-6">
              <DialogTitle>Add User to Group</DialogTitle>
            </DialogHeader>

            <Form {...addUserForm}>
              <form onSubmit={addUserForm.handleSubmit(onAddUser)} className="space-y-4">
                <FormField
                  control={addUserForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="user@example.com"
                          className="p-3 border border-gray-300 rounded-xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addUserForm.control}
                  name="canAddExpense"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Permission Level</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === "true")}
                        defaultValue={field.value ? "true" : "false"}
                      >
                        <FormControl>
                          <SelectTrigger className="p-3 border border-gray-300 rounded-xl">
                            <SelectValue placeholder="Select permission" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="false">View Only</SelectItem>
                          <SelectItem value="true">Can Add Expenses</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={addUserMutation.isPending}
                  className="w-full bg-green-500 hover:bg-green-600 text-white p-3 rounded-xl font-semibold touch-button"
                >
                  {addUserMutation.isPending ? "Adding..." : "Add User"}
                </Button>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}