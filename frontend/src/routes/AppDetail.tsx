import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Upload,
  X,
  Image as ImageIcon,
  Users,
  Lock,
  Globe,
  Plus,
  Check,
  Trash2,
  Settings,
  Pencil,
  ChevronDown,
  ChevronUp,
  Share2,
  Pin,
  MessageSquare,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Circle,
  MoreHorizontal,
  ExternalLink,
} from "lucide-react";
import { api, getImageUrl } from "../lib/api";
import type { User } from "../lib/auth";
import type { Team, App, VoteInfo, AppTask } from "../lib/types";
import { usePinnedTeam } from "../lib/pinnedTeam";
import CommentSection from "../components/CommentSection";
import ThemeToggle from "../components/ThemeToggle";
import RepositorySection from "../components/RepositorySection";
import { Card } from "../components/ui/card";

interface AppDetailProps {
  user: User | null;
}

export default function AppDetail({ user }: AppDetailProps) {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    name: "",
    short_description: "",
    full_description: "",
    status: "in_development" as App["status"],
  });
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [editingRepoUrl, setEditingRepoUrl] = useState(false);
  const [repoUrlValue, setRepoUrlValue] = useState("");

  const { pinnedTeam } = usePinnedTeam();

  const { data: app, isLoading } = useQuery({
    queryKey: ["app", id],
    queryFn: async () => {
      const response = await api.get(`/apps/${id}`);
      return response.data as App;
    },
  });

  const { data: team } = useQuery({
    queryKey: ["team", app?.team_id],
    queryFn: async () => {
      const response = await api.get(`/teams/${app!.team_id}`);
      return response.data as Team;
    },
    enabled: !!app?.team_id,
  });

  const isOwner = user && app?.creator_id === user.id;

  const updateAppMutation = useMutation({
    mutationFn: async (data: Partial<App>) => {
      return api.put(`/apps/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app", id] });
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: async (title: string) => {
      return api.post(`/apps/${id}/tasks`, { title });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app", id] });
      setNewTaskTitle("");
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({
      taskId,
      is_completed,
    }: {
      taskId: string;
      is_completed: boolean;
    }) => {
      return api.put(`/apps/${id}/tasks/${taskId}`, { is_completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app", id] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return api.delete(`/apps/${id}/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app", id] });
    },
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"] },
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0 || !id) return;
      setUploading(true);
      try {
        for (const file of acceptedFiles) {
          const formData = new FormData();
          formData.append("file", file);
          await api.post(`/apps/${id}/images`, formData);
        }
        queryClient.invalidateQueries({ queryKey: ["app", id] });
        setShowUpload(false);
      } catch (error: any) {
        console.error("Failed to upload image:", error);
        alert(error.response?.data?.detail || "Failed to upload image");
      } finally {
        setUploading(false);
      }
    },
    disabled: uploading,
  });

  const { data: voteStats } = useQuery({
    queryKey: ["votes", id],
    queryFn: async () => {
      const response = await api.get(`/apps/${id}/votes`);
      return response.data as VoteInfo;
    },
    enabled: !!user && !!id,
  });

  const voteMutation = useMutation({
    mutationFn: async (voteType: "upvote" | "downvote") => {
      return api.post(`/apps/${id}/vote`, { vote_type: voteType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["votes", id] });
    },
  });

  const handleVote = (voteType: "upvote" | "downvote") => {
    if (!user) return;
    voteMutation.mutate(voteType);
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    addTaskMutation.mutate(newTaskTitle.trim());
  };

  useEffect(() => {
    if (app) {
      setEditValues({
        name: app.name,
        short_description: app.short_description,
        full_description: app.full_description || "",
        status: app.status,
      });
      setRepoUrlValue(app.repository_url || "");
    }
  }, [app]);

  const startEditing = (field: string) => {
    if (!app) return;
    setEditingField(field);
  };

  const cancelEditing = () => {
    setEditingField(null);
    if (app) {
      setEditValues({
        name: app.name,
        short_description: app.short_description,
        full_description: app.full_description || "",
        status: app.status,
      });
    }
  };

  const saveField = (field: string) => {
    if (!app) return;
    const updateData: any = {};
    if (field === "name") {
      updateData.name = editValues.name.trim();
      if (!updateData.name) return;
    } else if (field === "short_description") {
      updateData.short_description = editValues.short_description.trim();
      if (!updateData.short_description) return;
    } else if (field === "full_description") {
      updateData.full_description = editValues.full_description.trim();
    } else if (field === "status") {
      updateData.status = editValues.status;
    }
    updateAppMutation.mutate(updateData, {
      onSuccess: () => setEditingField(null),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (e.key === "Enter" && field !== "full_description") {
      e.preventDefault();
      saveField(field);
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  };

  const tasks = app?.tasks || [];
  const completedTasks = tasks.filter((t) => t.is_completed).length;
  const autoProgress =
    tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const displayProgress =
    app?.progress_mode === "auto" ? autoProgress : app?.progress || 0;
  const images = app?.images || [];

  useEffect(() => {
    if (images.length > 0 && selectedImageIndex >= images.length) {
      setSelectedImageIndex(0);
    }
  }, [images.length, selectedImageIndex]);

  useEffect(() => {
    const imageCount = images.length;
    if (imageCount <= 1) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSelectedImageIndex((prev) => (prev - 1 + imageCount) % imageCount);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setSelectedImageIndex((prev) => (prev + 1) % imageCount);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images.length]);

  useEffect(() => {
    if (!showSettingsMenu) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowSettingsMenu(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showSettingsMenu]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">App not found</div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "beta":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    } catch {
      alert("Failed to copy link");
    }
  };

  // ============== OWNER VIEW ==============
  if (isOwner) {
    return (
      <div className="min-h-screen bg-background">
        {/* Sticky Header */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  to={team ? `/teams/${team.id}` : "/"}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-3">
                  {editingField === "name" ? (
                    <input
                      type="text"
                      value={editValues.name}
                      onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                      onBlur={() => saveField("name")}
                      onKeyDown={(e) => handleKeyDown(e, "name")}
                      autoFocus
                      className="text-xl font-bold bg-background border border-primary rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  ) : (
                    <h1
                      className="text-xl font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
                      onClick={() => startEditing("name")}
                    >
                      {app.name}
                    </h1>
                  )}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(app.status)}`}>
                    {app.status?.replace("_", " ").toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                  title="Share"
                >
                  <Share2 className="w-4 h-4 text-muted-foreground" />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4 text-muted-foreground" />
                  </button>
                  {showSettingsMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowSettingsMenu(false)} />
                      <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-xl z-50 p-2">
                        <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Visibility
                        </div>
                        <button
                          onClick={() => {
                            updateAppMutation.mutate({ is_published: false });
                            setShowSettingsMenu(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                            !app.is_published ? "bg-primary/10 text-primary" : "hover:bg-secondary text-foreground"
                          }`}
                        >
                          <Lock className="w-4 h-4" /> Private
                        </button>
                        <button
                          onClick={() => {
                            updateAppMutation.mutate({ is_published: true });
                            setShowSettingsMenu(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                            app.is_published ? "bg-primary/10 text-primary" : "hover:bg-secondary text-foreground"
                          }`}
                        >
                          <Globe className="w-4 h-4" /> Public
                        </button>
                        <div className="border-t border-border my-2" />
                        <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Status
                        </div>
                        {["in_development", "beta", "completed"].map((status) => (
                          <button
                            key={status}
                            onClick={() => {
                              updateAppMutation.mutate({ status: status as App["status"] });
                              setShowSettingsMenu(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                              app.status === status ? "bg-primary/10 text-primary" : "hover:bg-secondary text-foreground"
                            }`}
                          >
                            {status === "completed" && <CheckCircle2 className="w-4 h-4" />}
                            {status === "beta" && <Circle className="w-4 h-4" />}
                            {status === "in_development" && <TrendingUp className="w-4 h-4" />}
                            {status.replace("_", " ").charAt(0).toUpperCase() + status.replace("_", " ").slice(1)}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{displayProgress}%</p>
                <p className="text-xs text-muted-foreground">Progress</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{completedTasks}/{tasks.length}</p>
                <p className="text-xs text-muted-foreground">Tasks Done</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <ThumbsUp className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{app.vote_count || 0}</p>
                <p className="text-xs text-muted-foreground">Votes</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <MessageSquare className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{app.comment_count || 0}</p>
                <p className="text-xs text-muted-foreground">Comments</p>
              </div>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Image (1/3) */}
            <div className="space-y-6">
              {/* Image Gallery */}
              <Card className="overflow-hidden">
                <div className="relative bg-secondary/30">
                  {images.length > 0 ? (
                    <div className="relative aspect-video flex items-center justify-center p-4">
                      <img
                        src={getImageUrl(images[selectedImageIndex]?.image_url)}
                        alt={app.name}
                        className="max-h-full max-w-full object-contain rounded-lg"
                      />
                      <button
                        onClick={async () => {
                          if (confirm("Delete this image?")) {
                            await api.delete(`/apps/images/${images[selectedImageIndex].id}`);
                            queryClient.invalidateQueries({ queryKey: ["app", id] });
                            if (selectedImageIndex >= images.length - 1 && selectedImageIndex > 0) {
                              setSelectedImageIndex(selectedImageIndex - 1);
                            }
                          }
                        }}
                        className="absolute top-4 right-4 p-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {images.length > 1 && (
                        <>
                          <button
                            onClick={() => setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-background/90 hover:bg-background rounded-full shadow-lg transition-colors"
                          >
                            <ArrowLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setSelectedImageIndex((prev) => (prev + 1) % images.length)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-background/90 hover:bg-background rounded-full shadow-lg transition-colors"
                          >
                            <ArrowLeft className="w-5 h-5 rotate-180" />
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-video flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <ImageIcon className="w-16 h-16 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No images yet</p>
                      </div>
                    </div>
                  )}
                </div>
                {/* Thumbnails */}
                <div className="p-3 border-t border-border flex gap-2 overflow-x-auto">
                  {images.map((image: any, idx: number) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImageIndex === idx ? "border-primary" : "border-transparent hover:border-border"
                      }`}
                    >
                      <img src={getImageUrl(image.image_url)} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                  <div
                    {...getRootProps()}
                    className={`flex-shrink-0 w-14 h-14 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                      isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <input {...getInputProps()} />
                    {uploading ? <span className="text-xs">...</span> : <Plus className="w-5 h-5 text-muted-foreground" />}
                  </div>
                </div>
              </Card>

              {/* Meta Info */}
              <Card className="p-4 mt-6">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Created {new Date(app.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                  <Calendar className="w-4 h-4" />
                  <span>Updated {new Date(app.updated_at).toLocaleDateString()}</span>
                </div>
                {team && (
                  <Link
                    to={`/teams/${team.id}`}
                    className="flex items-center gap-3 text-sm text-primary mt-3 hover:text-primary/80"
                  >
                    <Users className="w-4 h-4" />
                    <span>{team.name}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </Card>

              {/* Repository Card */}
              {editingRepoUrl ? (
                <Card className="p-6">
                  <h3 className="font-semibold text-foreground mb-4">Repository URL</h3>
                  <input
                    type="url"
                    value={repoUrlValue}
                    onChange={(e) => setRepoUrlValue(e.target.value)}
                    placeholder="https://github.com/owner/repo"
                    className="w-full px-3 py-2 bg-background border border-primary rounded-lg focus:outline-none mb-3"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        updateAppMutation.mutate({ repository_url: repoUrlValue.trim() || null }, { onSuccess: () => setEditingRepoUrl(false) });
                      }}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingRepoUrl(false);
                        setRepoUrlValue(app?.repository_url || "");
                      }}
                      className="px-4 py-2 bg-secondary rounded-lg text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </Card>
              ) : (
                <RepositorySection
                  appId={id!}
                  repositoryUrl={app.repository_url}
                  isOwner={true}
                  onEditUrl={() => setEditingRepoUrl(true)}
                  onDeleteUrl={() => updateAppMutation.mutate({ repository_url: null })}
                />
              )}
            </div>

            {/* Right Column (2/3) - Description, Progress, Tasks, Comments */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description Card */}
              <Card className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    {editingField === "short_description" ? (
                      <input
                        type="text"
                        value={editValues.short_description}
                        onChange={(e) => setEditValues({ ...editValues, short_description: e.target.value })}
                        onBlur={() => saveField("short_description")}
                        onKeyDown={(e) => handleKeyDown(e, "short_description")}
                        autoFocus
                        className="w-full text-lg bg-background border border-primary rounded px-3 py-2 focus:outline-none"
                      />
                    ) : (
                      <p
                        className="text-lg text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => startEditing("short_description")}
                      >
                        {app.short_description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-foreground">About</h3>
                    <button
                      onClick={() => startEditing("full_description")}
                      className="p-1 hover:bg-secondary rounded transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  {editingField === "full_description" ? (
                    <div className="space-y-3">
                      <textarea
                        value={editValues.full_description}
                        onChange={(e) => setEditValues({ ...editValues, full_description: e.target.value })}
                        rows={6}
                        className="w-full bg-background border border-primary rounded-lg px-3 py-2 text-foreground focus:outline-none resize-y"
                        onKeyDown={(e) => e.key === "Escape" && cancelEditing()}
                      />
                      <div className="flex gap-2">
                        <button onClick={() => saveField("full_description")} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
                          Save
                        </button>
                        <button onClick={cancelEditing} className="px-4 py-2 bg-secondary text-foreground rounded-lg text-sm">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={`text-sm text-muted-foreground whitespace-pre-wrap ${isDescriptionExpanded ? "" : "line-clamp-4"}`}>
                      {app.full_description || <span className="italic">No description. Click the pencil to add one.</span>}
                    </div>
                  )}
                  {app.full_description && app.full_description.length > 200 && editingField !== "full_description" && (
                    <button
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      className="mt-2 text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                    >
                      {isDescriptionExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {isDescriptionExpanded ? "Show less" : "Show more"}
                    </button>
                  )}
                </div>
              </Card>

              {/* Progress and Tasks Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Progress Card */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Progress</h3>
                  <div className="flex bg-secondary rounded-lg p-0.5">
                    <button
                      onClick={() => updateAppMutation.mutate({ progress_mode: "auto" })}
                      className={`px-3 py-1 rounded-md text-xs transition-colors ${
                        app.progress_mode === "auto" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                      }`}
                    >
                      Auto
                    </button>
                    <button
                      onClick={() => updateAppMutation.mutate({ progress_mode: "manual" })}
                      className={`px-3 py-1 rounded-md text-xs transition-colors ${
                        app.progress_mode === "manual" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                      }`}
                    >
                      Manual
                    </button>
                  </div>
                </div>
                <div className="relative pt-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl font-bold text-foreground">{displayProgress}%</span>
                    <span className="text-xs text-muted-foreground">
                      {app.progress_mode === "auto" ? "Based on tasks" : "Manual"}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        displayProgress >= 80 ? "bg-green-500" : displayProgress >= 50 ? "bg-yellow-500" : "bg-primary"
                      }`}
                      style={{ width: `${displayProgress}%` }}
                    />
                  </div>
                  {app.progress_mode === "manual" && (
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={app.progress || 0}
                      onChange={(e) => updateAppMutation.mutate({ progress: parseInt(e.target.value) })}
                      className="w-full mt-3 accent-primary"
                    />
                  )}
                </div>
              </Card>

              {/* Tasks Card */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Tasks</h3>
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                    {completedTasks}/{tasks.length}
                  </span>
                </div>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                    placeholder="Add task..."
                    className="flex-1 px-3 py-2 bg-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={handleAddTask}
                    disabled={!newTaskTitle.trim()}
                    className="p-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {tasks.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-6">No tasks yet</p>
                  ) : (
                    tasks.map((task: AppTask) => (
                      <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 group">
                        <button
                          onClick={() => updateTaskMutation.mutate({ taskId: task.id, is_completed: !task.is_completed })}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            task.is_completed ? "bg-primary border-primary" : "border-muted-foreground hover:border-primary"
                          }`}
                        >
                          {task.is_completed && <Check className="w-3 h-3 text-primary-foreground" />}
                        </button>
                        <span className={`flex-1 text-sm ${task.is_completed ? "line-through text-muted-foreground" : ""}`}>
                          {task.title}
                        </span>
                        <button
                          onClick={() => deleteTaskMutation.mutate(task.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </Card>
              </div>

              {/* Comments */}
              <Card className="p-6">
                <CommentSection appId={id!} user={user} />
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============== NON-OWNER VIEW ==============
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link
              to={team ? `/teams/${team.id}` : "/"}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Back</span>
            </Link>
            <div className="flex items-center gap-2">
              <button onClick={handleShare} className="p-2 hover:bg-secondary rounded-lg transition-colors">
                <Share2 className="w-4 h-4 text-muted-foreground" />
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Image */}
          <Card className="overflow-hidden">
            {images.length > 0 ? (
              <>
                <div className="relative aspect-video bg-secondary/30 flex items-center justify-center p-4">
                  <img
                    src={getImageUrl(images[selectedImageIndex]?.image_url)}
                    alt={app.name}
                    className="max-h-full max-w-full object-contain rounded-lg"
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-background/90 rounded-full shadow-lg"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setSelectedImageIndex((prev) => (prev + 1) % images.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-background/90 rounded-full shadow-lg"
                      >
                        <ArrowLeft className="w-5 h-5 rotate-180" />
                      </button>
                    </>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="p-3 border-t border-border flex gap-2 overflow-x-auto">
                    {images.map((image: any, idx: number) => (
                      <button
                        key={image.id}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 ${
                          selectedImageIndex === idx ? "border-primary" : "border-transparent"
                        }`}
                      >
                        <img src={getImageUrl(image.image_url)} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-video flex items-center justify-center bg-secondary/30">
                <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
              </div>
            )}
          </Card>

          {/* Info */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(app.status)}`}>
                {app.status?.replace("_", " ").toUpperCase()}
              </span>
              {app.is_published && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Globe className="w-3 h-3" /> Public
                </span>
              )}
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-3">{app.name}</h1>
            <p className="text-lg text-muted-foreground mb-6">{app.short_description}</p>

            {/* Stats */}
            <div className="flex items-center gap-6 mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-bold">{displayProgress}%</p>
                  <p className="text-xs text-muted-foreground">Progress</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <ThumbsUp className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-lg font-bold">{app.vote_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Votes</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <MessageSquare className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-lg font-bold">{app.comment_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Comments</p>
                </div>
              </div>
            </div>

            {/* Vote Buttons */}
            {user && voteStats ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleVote("upvote")}
                  disabled={voteMutation.isPending}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    voteStats.user_vote === "upvote" ? "bg-green-500 text-white" : "bg-secondary hover:bg-secondary/80"
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>{voteStats.upvotes}</span>
                </button>
                <button
                  onClick={() => handleVote("downvote")}
                  disabled={voteMutation.isPending}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    voteStats.user_vote === "downvote" ? "bg-red-500 text-white" : "bg-secondary hover:bg-secondary/80"
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span>{voteStats.downvotes}</span>
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                <Link to="/login" className="text-primary hover:underline">Login</Link> to vote
              </p>
            )}
          </div>
        </div>

        {/* Description & Repository */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">About</h2>
            <div className={`text-muted-foreground whitespace-pre-wrap ${isDescriptionExpanded ? "" : "line-clamp-6"}`}>
              {app.full_description || <span className="italic">No description available.</span>}
            </div>
            {app.full_description && app.full_description.length > 300 && (
              <button
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="mt-3 text-sm text-primary hover:text-primary/80 flex items-center gap-1"
              >
                {isDescriptionExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {isDescriptionExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </Card>

          {app.repository_url && (
            <RepositorySection appId={id!} repositoryUrl={app.repository_url} isOwner={false} />
          )}
        </div>

        {/* Comments */}
        <Card className="p-6">
          <CommentSection appId={id!} user={user} />
        </Card>
      </div>
    </div>
  );
}
