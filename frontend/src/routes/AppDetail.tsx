import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  X,
  Image as ImageIcon,
  Users,
  Lock,
  Globe,
  Plus,
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
  ExternalLink,
  FolderKanban,
  Lightbulb,
  LogIn,
  Info,
} from "lucide-react";
import NavUser from "../components/NavUser";
import NotificationBell from "../components/NotificationBell";
import Logo from "../components/Logo";
import { api, getImageUrl } from "../lib/api";
import type { User } from "../lib/auth";
import type { Team, App, VoteInfo } from "../lib/types";
import { usePinnedTeam } from "../lib/pinnedTeam";
import CommentSection from "../components/CommentSection";
import ThemeToggle from "../components/ThemeToggle";
import RepositorySection from "../components/RepositorySection";
import ImageAnnotationModal from "../components/ImageAnnotationModal";
import { Card } from "../components/ui/card";

interface AppDetailProps {
  user: User | null;
}

export default function AppDetail({ user }: AppDetailProps) {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    name: "",
    full_description: "",
    status: "in_development" as App["status"],
  });
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [editingRepoUrl, setEditingRepoUrl] = useState(false);
  const [repoUrlValue, setRepoUrlValue] = useState("");
  const [editingAppUrl, setEditingAppUrl] = useState(false);
  const [appUrlValue, setAppUrlValue] = useState("");
  const [annotationModalOpen, setAnnotationModalOpen] = useState(false);
  const [showInfoMenu, setShowInfoMenu] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);
  const progressDebounceRef = useRef<NodeJS.Timeout | null>(null);

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

  const images = app?.images || [];
  const currentImageId = images[selectedImageIndex]?.id;

  // Fetch annotations for the current image
  const { data: annotations = [] } = useQuery({
    queryKey: ["annotations", currentImageId],
    queryFn: async () => {
      const response = await api.get(`/images/${currentImageId}/annotations`);
      return response.data as Array<{
        id: string;
        x_position: number;
        y_position: number;
        status: "open" | "resolved";
        comment: string;
      }>;
    },
    enabled: !!currentImageId,
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

  useEffect(() => {
    if (app) {
      setEditValues({
        name: app.name,
        full_description: app.full_description || "",
        status: app.status,
      });
      setRepoUrlValue(app.repository_url || "");
      setAppUrlValue(app.app_url || "");
      setLocalProgress(app.progress || 0);
    }
  }, [app]);

  // Debounced progress update
  const handleProgressChange = (value: number) => {
    setLocalProgress(value);

    if (progressDebounceRef.current) {
      clearTimeout(progressDebounceRef.current);
    }

    progressDebounceRef.current = setTimeout(() => {
      updateAppMutation.mutate({ progress: value });
    }, 500);
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (progressDebounceRef.current) {
        clearTimeout(progressDebounceRef.current);
      }
    };
  }, []);

  const startEditing = (field: string) => {
    if (!app) return;
    setEditingField(field);
  };

  const cancelEditing = () => {
    setEditingField(null);
    if (app) {
      setEditValues({
        name: app.name,
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
        {/* Main Navigation */}
        <nav className="bg-card border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center gap-6">
                <Logo />
                <div className="hidden sm:flex items-center gap-4">
                  <Link
                    to="/team"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                  >
                    <FolderKanban className="w-4 h-4" />
                    Teams
                  </Link>
                  <Link
                    to="/requests"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                  >
                    <Lightbulb className="w-4 h-4" />
                    App Requests
                  </Link>
                  </div>
              </div>
              <div className="flex items-center gap-3">
                {pinnedTeam && (
                  <Link
                    to={`/team/${pinnedTeam.id}`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-md border border-primary/20"
                  >
                    <Pin className="w-3 h-3 text-primary" />
                    <span className="text-primary font-medium">{pinnedTeam.name}</span>
                  </Link>
                )}
                <ThemeToggle />
                <NotificationBell />
                <NavUser user={user} />
              </div>
            </div>
          </div>
        </nav>

        {/* Sub Header */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  to={team ? `/team/${team.id}` : "/team"}
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
                  {editingAppUrl ? (
                    <div className="flex items-center gap-2 ml-2">
                      <input
                        type="url"
                        value={appUrlValue}
                        onChange={(e) => setAppUrlValue(e.target.value)}
                        placeholder="https://your-app.com"
                        className="px-2 py-1 bg-background border border-primary rounded text-sm w-48 focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          updateAppMutation.mutate({ app_url: appUrlValue.trim() || null }, { onSuccess: () => setEditingAppUrl(false) });
                        }}
                        className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingAppUrl(false);
                          setAppUrlValue(app?.app_url || "");
                        }}
                        className="px-2 py-1 bg-secondary rounded text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : app.app_url ? (
                    <div className="flex items-center gap-1 ml-2">
                      <a
                        href={app.app_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
                      >
                        <Globe className="w-4 h-4" />
                        <span className="hidden sm:inline">{app.app_url.replace(/^https?:\/\//, '').split('/')[0]}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        onClick={() => setEditingAppUrl(true)}
                        className="p-1 hover:bg-secondary rounded"
                      >
                        <Pencil className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingAppUrl(true)}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground ml-2 transition-colors"
                    >
                      <Globe className="w-4 h-4" />
                      <span className="hidden sm:inline">Add URL</span>
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
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
                    onClick={() => setShowInfoMenu(!showInfoMenu)}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    title="Info"
                  >
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </button>
                  {showInfoMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowInfoMenu(false)} />
                      <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-xl z-50 p-4">
                        <div className="space-y-3 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>Updated {new Date(app.updated_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>Created {new Date(app.created_at).toLocaleDateString()}</span>
                          </div>
                          {team && (
                            <Link
                              to={`/team/${team.id}`}
                              onClick={() => setShowInfoMenu(false)}
                              className="flex items-center gap-2 text-primary hover:text-primary/80"
                            >
                              <Users className="w-4 h-4" />
                              <span>{team.name}</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
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
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <Card className="p-4 flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ImageIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{images.length}</p>
                <p className="text-xs text-muted-foreground">Images</p>
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
            {/* Left Column - Image (2/3) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Gallery */}
              <Card className="overflow-hidden">
                <div className="relative bg-secondary/30">
                  {images.length > 0 ? (
                    <div className="relative flex items-center justify-center p-4">
                      <div className="relative">
                        <img
                          src={getImageUrl(images[selectedImageIndex]?.image_url)}
                          alt={app.name}
                          className="max-h-[500px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setAnnotationModalOpen(true)}
                          title="Click to view and annotate"
                        />
                        {/* Annotation markers */}
                        {annotations.map((annotation, index) => (
                          <button
                            key={annotation.id}
                            onClick={() => setAnnotationModalOpen(true)}
                            className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full flex items-center justify-center text-[10px] font-bold transition-transform hover:scale-110 ${
                              annotation.status === "resolved"
                                ? "bg-green-500 text-white"
                                : "bg-red-500 text-white"
                            }`}
                            style={{
                              left: `${annotation.x_position}%`,
                              top: `${annotation.y_position}%`,
                            }}
                            title={annotation.comment}
                          >
                            {String(index + 1).padStart(2, "0")}
                          </button>
                        ))}
                      </div>
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
            </div>

            {/* Right Column (1/3) - Description */}
            <div className="space-y-6">
              {/* Description Card */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground">Description</h3>
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
              </Card>

              {/* Progress Card */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground">Progress</h3>
                  <span className="text-sm font-medium text-foreground">{localProgress}%</span>
                </div>
                <div className="relative h-2">
                  {/* Background track */}
                  <div className="absolute inset-0 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-150 ${
                        localProgress >= 80
                          ? "bg-green-500"
                          : localProgress >= 50
                          ? "bg-yellow-500"
                          : "bg-primary"
                      }`}
                      style={{ width: `${localProgress}%` }}
                    />
                  </div>
                  {/* Range input overlay */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={localProgress}
                    onChange={(e) => handleProgressChange(parseInt(e.target.value))}
                    className="absolute inset-0 w-full h-full bg-transparent rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-foreground [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
                  />
                </div>
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
                  hasGithubToken={app.has_github_token}
                  onEditUrl={() => setEditingRepoUrl(true)}
                  onDeleteUrl={() => updateAppMutation.mutate({ repository_url: null })}
                />
              )}
            </div>
          </div>

          {/* Comments - Full Width */}
          <Card className="p-6 mt-6">
            <CommentSection appId={id!} user={user} />
          </Card>
        </div>

        {/* Annotation Modal */}
        {images.length > 0 && (
          <ImageAnnotationModal
            imageId={images[selectedImageIndex]?.id}
            imageUrl={images[selectedImageIndex]?.image_url}
            isOpen={annotationModalOpen}
            onClose={() => setAnnotationModalOpen(false)}
            user={user}
          />
        )}
      </div>
    );
  }

  // ============== NON-OWNER VIEW ==============
  return (
    <div className="min-h-screen bg-background">
      {/* Main Navigation */}
      <nav className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-6">
              <Link to="/" className="text-xl font-bold text-foreground">
                App Showcase
              </Link>
              <div className="hidden sm:flex items-center gap-4">
                <Link
                  to="/team"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <FolderKanban className="w-4 h-4" />
                  Teams
                </Link>
                <Link
                  to="/requests"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <Lightbulb className="w-4 h-4" />
                  App Requests
                </Link>
                <Link to="/public" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Public Apps
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {pinnedTeam && (
                <Link
                  to={`/team/${pinnedTeam.id}`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-md border border-primary/20"
                >
                  <Pin className="w-3 h-3 text-primary" />
                  <span className="text-primary font-medium">{pinnedTeam.name}</span>
                </Link>
              )}
              <ThemeToggle />
              {user && <NotificationBell />}
              {user ? (
                <NavUser user={user} />
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Sub Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link
              to={team ? `/team/${team.id}` : "/team"}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Back to {team?.name || "Teams"}</span>
            </Link>
            <div className="flex items-center gap-2">
              <button onClick={handleShare} className="p-2 hover:bg-secondary rounded-lg transition-colors" title="Share">
                <Share2 className="w-4 h-4 text-muted-foreground" />
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowInfoMenu(!showInfoMenu)}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                  title="Info"
                >
                  <Info className="w-4 h-4 text-muted-foreground" />
                </button>
                {showInfoMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowInfoMenu(false)} />
                    <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-xl z-50 p-4">
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>Updated {new Date(app.updated_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>Created {new Date(app.created_at).toLocaleDateString()}</span>
                        </div>
                        {team && (
                          <Link
                            to={`/team/${team.id}`}
                            onClick={() => setShowInfoMenu(false)}
                            className="flex items-center gap-2 text-primary hover:text-primary/80"
                          >
                            <Users className="w-4 h-4" />
                            <span>{team.name}</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Image */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              {images.length > 0 ? (
                <>
                  <div className="relative bg-secondary/30 flex items-center justify-center p-4">
                    <div className="relative">
                      <img
                        src={getImageUrl(images[selectedImageIndex]?.image_url)}
                        alt={app.name}
                        className="max-h-[500px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setAnnotationModalOpen(true)}
                        title="Click to view and annotate"
                      />
                      {annotations.map((annotation, index) => (
                        <button
                          key={annotation.id}
                          onClick={() => setAnnotationModalOpen(true)}
                          className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full flex items-center justify-center text-[10px] font-bold transition-transform hover:scale-110 ${
                            annotation.status === "resolved"
                              ? "bg-green-500 text-white"
                              : "bg-red-500 text-white"
                          }`}
                          style={{
                            left: `${annotation.x_position}%`,
                            top: `${annotation.y_position}%`,
                          }}
                          title={annotation.comment}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </button>
                      ))}
                    </div>
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
                  {images.length > 1 && (
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
                    </div>
                  )}
                </>
              ) : (
                <div className="aspect-video flex items-center justify-center bg-secondary/30">
                  <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
                </div>
              )}
            </Card>
          </div>

          {/* Right Column - Info */}
          <div className="space-y-4">
            {/* Title & Status */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(app.status)}`}>
                  {app.status?.replace("_", " ").toUpperCase()}
                </span>
                {app.app_url && (
                  <a
                    href={app.app_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <h1 className="text-2xl font-bold text-foreground">{app.name}</h1>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium text-foreground">{app.progress}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    app.progress >= 80
                      ? "bg-green-500"
                      : app.progress >= 50
                      ? "bg-yellow-500"
                      : "bg-primary"
                  }`}
                  style={{ width: `${app.progress}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4" />
                {images.length} images
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ThumbsUp className="w-4 h-4" />
                {app.vote_count || 0}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4" />
                {app.comment_count || 0}
              </span>
            </div>

            {/* Vote Buttons */}
            {user && voteStats ? (
              <div className="flex items-center gap-2">
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

            {/* Description Card */}
            <Card className="p-6">
              <h3 className="font-semibold text-foreground mb-3">Description</h3>
              <div className={`text-sm text-muted-foreground whitespace-pre-wrap ${isDescriptionExpanded ? "" : "line-clamp-4"}`}>
                {app.full_description || <span className="italic">No description available.</span>}
              </div>
              {app.full_description && app.full_description.length > 200 && (
                <button
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="mt-2 text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  {isDescriptionExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {isDescriptionExpanded ? "Show less" : "Show more"}
                </button>
              )}
            </Card>

            {/* Repository */}
            {app.repository_url && (
              <RepositorySection appId={id!} repositoryUrl={app.repository_url} isOwner={false} hasGithubToken={app.has_github_token} />
            )}
          </div>
        </div>

        {/* Comments - Full Width */}
        <Card className="p-6 mt-6">
          <CommentSection appId={id!} user={user} />
        </Card>
      </div>

      {/* Annotation Modal */}
      {images.length > 0 && (
        <ImageAnnotationModal
          imageId={images[selectedImageIndex]?.id}
          imageUrl={images[selectedImageIndex]?.image_url}
          isOpen={annotationModalOpen}
          onClose={() => setAnnotationModalOpen(false)}
          user={user}
        />
      )}
    </div>
  );
}
